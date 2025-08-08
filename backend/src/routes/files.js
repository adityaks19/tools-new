const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { S3Service, DynamoDBService, BedrockService } = require('../config/aws');
const { checkUsageLimit, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/html',
      'text/markdown',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Helper function to get current month key for usage tracking
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Helper function to check and update usage
const checkAndUpdateUsage = async (userId) => {
  const monthKey = getCurrentMonthKey();
  
  try {
    // Get current usage
    let usage = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USAGE || 'user-usage',
      { userId, monthKey }
    );

    // Get user tier to check limits
    const user = await DynamoDBService.getItem(
      process.env.DYNAMODB_TABLE_USERS,
      { userId }
    );

    const tierLimits = {
      'FREE': 10,
      'BASIC': 50,
      'ADVANCED': 200,
      'ENTERPRISE': 1000
    };

    const maxConversions = tierLimits[user?.tier] || 10;

    // If no usage record exists, initialize it
    if (!usage) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      resetDate.setHours(0, 0, 0, 0);

      usage = {
        userId,
        monthKey,
        conversions: 0,
        maxConversions,
        resetDate: resetDate.toISOString(),
        createdAt: new Date().toISOString()
      };

      await DynamoDBService.putItem(process.env.DYNAMODB_TABLE_USAGE || 'user-usage', usage);
    }

    // Check if user has reached limit
    if (usage.conversions >= maxConversions) {
      throw new Error(`Monthly conversion limit reached (${maxConversions}). Please upgrade your plan.`);
    }

    // Increment usage
    const newConversions = (usage.conversions || 0) + 1;
    
    await DynamoDBService.updateItem(
      process.env.DYNAMODB_TABLE_USAGE || 'user-usage',
      { userId, monthKey },
      'SET conversions = :conversions, updatedAt = :updatedAt',
      { 
        ':conversions': newConversions,
        ':updatedAt': new Date().toISOString()
      }
    );

    return { success: true, conversions: newConversions, maxConversions };
  } catch (error) {
    throw error;
  }
};

// Extract text content from different file types
async function extractTextContent(file) {
  const { buffer, mimetype, originalname } = file;
  
  try {
    switch (mimetype) {
      case 'text/plain':
      case 'text/html':
      case 'text/markdown':
        return buffer.toString('utf-8');
        
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
        
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/bmp':
        // For images, we'll return a placeholder - in a real implementation,
        // you'd use OCR service like Amazon Textract
        return `[Image file: ${originalname}. OCR processing would be implemented here.]`;
        
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${originalname}`);
  }
}

// Convert file endpoint
router.post('/convert', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Processing prompt is required' });
    }

    // Check and update usage
    try {
      await checkAndUpdateUsage(req.user.userId);
    } catch (usageError) {
      return res.status(429).json({ error: usageError.message });
    }

    const fileId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Extract text content
    const textContent = await extractTextContent(req.file);
    
    // Process with AI (Bedrock)
    let processedContent;
    try {
      // Use BedrockService to process the content
      processedContent = await BedrockService.processText(textContent, prompt);
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      // Fallback to simple text processing if AI fails
      processedContent = `Processed content for: ${req.file.originalname}\n\nOriginal content:\n${textContent}\n\nPrompt: ${prompt}\n\nNote: AI processing temporarily unavailable. This is the extracted text content.`;
    }
    
    // Store original file in S3 (optional)
    const originalKey = `files/${req.user.userId}/${fileId}/original_${req.file.originalname}`;
    try {
      await S3Service.uploadFile(originalKey, req.file.buffer, req.file.mimetype);
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      // Continue without S3 storage if it fails
    }
    
    // Store conversion record in DynamoDB
    const conversionRecord = {
      fileId,
      userId: req.user.userId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      s3Key: originalKey,
      textContent: textContent.substring(0, 1000), // Store first 1000 chars
      prompt,
      processedContent,
      status: 'completed',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      await DynamoDBService.putItem('file-conversions', conversionRecord);
    } catch (dbError) {
      console.error('DynamoDB error:', dbError);
      // Continue without database storage if it fails
    }

    res.json({
      message: 'File converted successfully',
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      result: processedContent,
      convertedText: processedContent,
      status: 'completed'
    });
  } catch (error) {
    console.error('File conversion error:', error);
    res.status(500).json({ 
      error: 'File conversion failed',
      message: error.message 
    });
  }
});

// Upload and process file (legacy endpoint)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Processing prompt is required' });
    }

    const fileId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Extract text content
    const textContent = await extractTextContent(req.file);
    
    // Store original file in S3
    const originalKey = `files/${req.user.userId}/${fileId}/original_${req.file.originalname}`;
    await S3Service.uploadFile(originalKey, req.file.buffer, req.file.mimetype);
    
    // Store file metadata in DynamoDB
    const fileMetadata = {
      fileId,
      userId: req.user.userId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      s3Key: originalKey,
      textContent,
      prompt,
      status: 'uploaded',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await DynamoDBService.putItem('seo-nlp-files', fileMetadata);

    res.json({
      message: 'File uploaded successfully',
      fileId,
      originalName: req.file.originalname,
      size: req.file.size,
      status: 'uploaded'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'File upload failed',
      message: error.message 
    });
  }
});

// Get file details
router.get('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await DynamoDBService.getItem('seo-nlp-files', { fileId });
    
    if (!file || file.userId !== req.user.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      fileId: file.fileId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      prompt: file.prompt,
      status: file.status,
      processedContent: file.processedContent,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    });
  } catch (error) {
    console.error('File fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch file details' });
  }
});

// Get user's files
router.get('/', authenticateToken, async (req, res) => {
  try {
    const files = await DynamoDBService.queryItems(
      'seo-nlp-files',
      'userId = :userId',
      { ':userId': req.user.userId }
    );

    const fileList = files.map(file => ({
      fileId: file.fileId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      status: file.status,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    }));

    res.json({ files: fileList });
  } catch (error) {
    console.error('Files fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Delete file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await DynamoDBService.getItem('seo-nlp-files', { fileId });
    
    if (!file || file.userId !== req.user.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from S3
    if (file.s3Key) {
      try {
        await S3Service.deleteFile(file.s3Key);
      } catch (s3Error) {
        console.error('S3 deletion error:', s3Error);
      }
    }

    // Delete from DynamoDB
    await DynamoDBService.deleteItem('seo-nlp-files', { fileId });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
});

// Delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await DynamoDBService.getItem('seo-nlp-files', { fileId });
    
    if (!file || file.userId !== req.user.userId) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from S3
    await S3Service.deleteFile(file.s3Key);
    if (file.processedS3Key) {
      await S3Service.deleteFile(file.processedS3Key);
    }

    // Delete from DynamoDB
    await DynamoDBService.deleteItem('seo-nlp-files', { fileId });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;

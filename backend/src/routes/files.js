const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { S3Service, DynamoDBService } = require('../config/aws');
const { checkUsageLimit } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/html',
      'text/markdown'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

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
        
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${originalname}`);
  }
}

// Upload and process file
router.post('/upload', checkUsageLimit, upload.single('file'), async (req, res) => {
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

    // Update usage count
    const today = new Date().toISOString().split('T')[0];
    const usageKey = {
      userId: req.user.userId,
      date: today
    };

    try {
      await DynamoDBService.updateItem(
        process.env.DYNAMODB_TABLE_USAGE,
        usageKey,
        'SET #count = if_not_exists(#count, :zero) + :inc, updatedAt = :updatedAt',
        {
          ':zero': 0,
          ':inc': 1,
          ':updatedAt': timestamp,
          '#count': 'count'
        }
      );
    } catch (usageError) {
      // If item doesn't exist, create it
      await DynamoDBService.putItem(process.env.DYNAMODB_TABLE_USAGE, {
        userId: req.user.userId,
        date: today,
        count: 1,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

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
router.get('/:fileId', async (req, res) => {
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
router.get('/', async (req, res) => {
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

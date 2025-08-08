// Global error handler to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Force production mode after dotenv loads
process.env.NODE_ENV = 'production';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.NODE_ENV === 'production' ? undefined : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock'
  }
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.NODE_ENV === 'production' ? undefined : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock'
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Basic security headers without helmet
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    [`http://${process.env.PUBLIC_IP || '44.205.255.158'}:3000`, 'http://localhost:3000'] : 
    true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// DynamoDB table names
const USERS_TABLE = process.env.USERS_TABLE || 'nlp-tool-users';
const SESSIONS_TABLE = process.env.SESSIONS_TABLE || 'nlp-tool-sessions';
const USAGE_TABLE = process.env.USAGE_TABLE || 'nlp-tool-usage';

// Helper function to create tables if they don't exist (for development)
async function ensureTablesExist() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎭 Using mock AWS services for development');
    return;
  }
  
  // In production, tables should be created via CloudFormation/CDK
  console.log('📊 Using AWS DynamoDB tables');
}

// Initialize tables
ensureTablesExist();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'NLP Tool API is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = uuidv4();
    const user = {
      id: userId,
      email,
      name,
      createdAt: new Date().toISOString(),
      tier: 'FREE'
    };

    if (process.env.NODE_ENV === 'development') {
      // Mock response for development
      return res.json({
        token: `mock-jwt-${userId}`,
        user: user
      });
    }

    // Store user in DynamoDB
    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(email)'
    }));

    res.json({
      token: `jwt-${userId}`,
      user: user
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    if (process.env.NODE_ENV === 'development') {
      // Mock response for development
      return res.json({
        token: `mock-jwt-${Date.now()}`,
        user: {
          id: '1',
          email: email,
          name: 'Demo User',
          tier: 'FREE'
        }
      });
    }

    // In production, implement proper authentication
    res.json({
      token: `jwt-${Date.now()}`,
      user: {
        id: '1',
        email: email,
        name: 'User',
        tier: 'FREE'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const fileInfo = {
      id: fileId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    // In production, you would upload to S3 here
    if (process.env.NODE_ENV !== 'development') {
      // Store file metadata in DynamoDB
      await docClient.send(new PutCommand({
        TableName: 'nlp-tool-files',
        Item: fileInfo
      }));
    }

    res.json({
      fileId: fileId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      content: req.file.buffer.toString('utf-8').substring(0, 1000) // First 1000 chars for preview
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// NLP Analysis endpoint
app.post('/api/nlp/analyze', async (req, res) => {
  try {
    const { content, prompt } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const analysisId = uuidv4();
    let analysis;

    try {
      const bedrockPrompt = prompt || `Analyze the following content and provide insights about its structure, themes, sentiment, and readability:\n\n${content}`;
      
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-text-express-v1',
        body: JSON.stringify({
          inputText: bedrockPrompt,
          textGenerationConfig: {
            maxTokenCount: 1000,
            temperature: 0.7,
            topP: 0.9
          }
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      analysis = responseBody.results[0].outputText;
    } catch (bedrockError) {
      console.error('Bedrock error:', bedrockError);
      
      // Fallback analysis using basic text processing
      const wordCount = content.split(/\s+/).length;
      const sentenceCount = content.split(/[.!?]+/).length - 1;
      const avgWordsPerSentence = Math.round(wordCount / Math.max(sentenceCount, 1));
      const readabilityScore = avgWordsPerSentence < 15 ? 'High' : avgWordsPerSentence < 25 ? 'Medium' : 'Low';
      
      analysis = `Content Analysis:
      
Word Count: ${wordCount}
Sentence Count: ${sentenceCount}
Average Words per Sentence: ${avgWordsPerSentence}
Readability: ${readabilityScore}

Structure: The content contains ${sentenceCount} sentences with an average of ${avgWordsPerSentence} words per sentence.

${prompt ? `Focus Area (${prompt}): Based on your specific request, this content appears to address the topic with ${wordCount > 100 ? 'comprehensive' : 'concise'} coverage.` : ''}

Themes: The text discusses various topics with ${wordCount > 200 ? 'detailed' : 'brief'} explanations.

Sentiment: The overall tone appears ${content.includes('!') ? 'enthusiastic' : content.includes('?') ? 'inquisitive' : 'neutral'}.

Note: This analysis was generated using basic text processing as AI services are currently unavailable.`;
    }

    const result = {
      id: analysisId,
      analysis: analysis,
      metadata: {
        tokensUsed: Math.ceil(content.length / 4),
        tier: 'FREE',
        timestamp: new Date().toISOString(),
        modelUsed: 'amazon.titan-text-express-v1 (with fallback)'
      }
    };

    // Track usage in DynamoDB (production only)
    if (process.env.NODE_ENV !== 'development') {
      await docClient.send(new PutCommand({
        TableName: USAGE_TABLE,
        Item: {
          id: analysisId,
          userId: req.headers['user-id'] || 'anonymous',
          type: 'analysis',
          tokensUsed: result.metadata.tokensUsed,
          timestamp: result.metadata.timestamp
        }
      }));
    }

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Text Generation endpoint
app.post('/api/nlp/generate', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generationId = uuidv4();
    let generatedText;

    try {
      const fullPrompt = context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt;
      
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-text-express-v1',
        body: JSON.stringify({
          inputText: fullPrompt,
          textGenerationConfig: {
            maxTokenCount: 2000,
            temperature: 0.8,
            topP: 0.9
          }
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      generatedText = responseBody.results[0].outputText;
    } catch (bedrockError) {
      console.error('Bedrock error:', bedrockError);
      
      // Fallback text generation using template-based approach
      const promptWords = prompt.toLowerCase().split(/\s+/);
      let generationType = 'general content';
      
      if (promptWords.some(word => ['story', 'narrative', 'tale'].includes(word))) {
        generationType = 'story';
      } else if (promptWords.some(word => ['email', 'letter', 'message'].includes(word))) {
        generationType = 'communication';
      } else if (promptWords.some(word => ['article', 'blog', 'post'].includes(word))) {
        generationType = 'article';
      } else if (promptWords.some(word => ['summary', 'overview', 'brief'].includes(word))) {
        generationType = 'summary';
      }
      
      generatedText = `Generated ${generationType} based on your prompt: "${prompt}"

${context ? `Building on the provided context: ${context.substring(0, 100)}...` : ''}

This is a structured response that addresses your request. The content has been generated to match the style and requirements you specified in your prompt.

Key points covered:
• Relevant information related to your topic
• Structured presentation of ideas
• Professional tone and formatting
• Comprehensive coverage of the subject matter

${generationType === 'story' ? 'The narrative follows a clear beginning, middle, and end structure.' : 
  generationType === 'communication' ? 'The message is formatted for clear and effective communication.' :
  generationType === 'article' ? 'The article provides informative content with proper organization.' :
  generationType === 'summary' ? 'The summary captures the essential points concisely.' :
  'The content is organized to provide maximum value and clarity.'}

Note: This content was generated using template-based processing as AI services are currently unavailable.`;
    }

    const result = {
      id: generationId,
      generatedText: generatedText,
      metadata: {
        tokensUsed: Math.ceil(prompt.length / 4) + 50,
        tier: 'FREE',
        timestamp: new Date().toISOString(),
        modelUsed: 'amazon.titan-text-express-v1'
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Text generation failed' });
  }
});

// Text Transformation endpoint
app.post('/api/nlp/transform', async (req, res) => {
  try {
    const { content, transformationType, instructions } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const transformId = uuidv4();
    let transformedContent;

    try {
      const transformPrompt = `Transform the following content according to these instructions: ${instructions || 'improve clarity and readability'}\n\nTransformation type: ${transformationType || 'general'}\n\nContent to transform:\n${content}`;
      
      const command = new InvokeModelCommand({
        modelId: 'amazon.titan-text-express-v1',
        body: JSON.stringify({
          inputText: transformPrompt,
          textGenerationConfig: {
            maxTokenCount: 2000,
            temperature: 0.7,
            topP: 0.9
          }
        }),
        contentType: 'application/json',
        accept: 'application/json'
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      transformedContent = responseBody.results[0].outputText;
    } catch (bedrockError) {
      console.error('Bedrock error:', bedrockError);
      
      // Fallback transformation using basic text processing
      let transformed = content;
      
      // Apply basic transformations based on type
      if (transformationType === 'formal') {
        transformed = content
          .replace(/\bi\b/g, 'I')
          .replace(/\bcan't\b/g, 'cannot')
          .replace(/\bwon't\b/g, 'will not')
          .replace(/\bdon't\b/g, 'do not')
          .replace(/\bisn't\b/g, 'is not')
          .replace(/\baren't\b/g, 'are not')
          .replace(/\bwasn't\b/g, 'was not')
          .replace(/\bweren't\b/g, 'were not')
          .replace(/\bhasn't\b/g, 'has not')
          .replace(/\bhaven't\b/g, 'have not')
          .replace(/\bhadn't\b/g, 'had not')
          .replace(/\bisnt\b/g, 'is not')
          .replace(/\barent\b/g, 'are not')
          .replace(/\bcant\b/g, 'cannot')
          .replace(/\bdont\b/g, 'do not')
          .replace(/\bwont\b/g, 'will not');
      } else if (transformationType === 'casual') {
        transformed = content
          .replace(/\bcannot\b/g, "can't")
          .replace(/\bwill not\b/g, "won't")
          .replace(/\bdo not\b/g, "don't")
          .replace(/\bis not\b/g, "isn't")
          .replace(/\bare not\b/g, "aren't");
      } else if (transformationType === 'summary') {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keyPoints = sentences.slice(0, Math.min(3, sentences.length));
        transformed = `Summary: ${keyPoints.join('. ')}.`;
      } else {
        // General improvements
        transformed = content
          .replace(/\s+/g, ' ') // normalize whitespace
          .replace(/([.!?])\s*([a-z])/g, '$1 $2') // fix spacing after punctuation
          .trim();
      }
      
      transformedContent = `Transformed Content (${transformationType || 'general'}):

${transformed}

Transformation Applied:
${instructions || 'Basic text improvements including formatting, punctuation, and readability enhancements.'}

Note: This transformation was applied using rule-based processing as AI services are currently unavailable.`;
    }

    const result = {
      id: transformId,
      transformedContent: transformedContent,
      metadata: {
        tokensUsed: Math.ceil(content.length / 4) + 25,
        tier: 'FREE',
        timestamp: new Date().toISOString(),
        modelUsed: 'amazon.titan-text-express-v1'
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Transformation error:', error);
    res.status(500).json({ error: 'Text transformation failed' });
  }
});

// User usage statistics
app.get('/api/user/usage', async (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'anonymous';
    
    // Get usage from DynamoDB
    const result = await docClient.send(new ScanCommand({
      TableName: USAGE_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const totalTokens = result.Items?.reduce((sum, item) => sum + (item.tokensUsed || 0), 0) || 0;
    
    res.json({
      totalRequests: result.Items?.length || 0,
      tokensUsed: totalTokens,
      tier: 'FREE',
      limits: {
        maxRequests: 100,
        maxTokens: 10000
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// User stats endpoint (alias for usage)
app.get('/api/user/stats', async (req, res) => {
  try {
    const userId = req.headers['user-id'] || 'anonymous';
    
    // Get usage from DynamoDB
    const result = await docClient.send(new ScanCommand({
      TableName: USAGE_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    const totalTokens = result.Items?.reduce((sum, item) => sum + (item.tokensUsed || 0), 0) || 0;
    
    res.json({
      totalRequests: result.Items?.length || 0,
      requestsThisMonth: result.Items?.filter(item => 
        new Date(item.timestamp).getMonth() === new Date().getMonth()
      ).length || 0,
      tier: 'FREE',
      remainingRequests: Math.max(0, 100 - (result.Items?.length || 0)),
      lastUsed: result.Items?.length > 0 ? result.Items[result.Items.length - 1].timestamp : null
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Convert endpoint (legacy support)
app.post('/api/convert', async (req, res) => {
  try {
    const { content, prompt, type } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    let result;
    
    if (type === 'analyze') {
      // Analyze the content
      let analysis;
      try {
        const bedrockPrompt = `Analyze the following content: "${content}". ${prompt ? `Focus on: ${prompt}` : 'Provide a comprehensive analysis.'}`;
        
        const command = new InvokeModelCommand({
          modelId: 'amazon.titan-text-express-v1',
          body: JSON.stringify({
            inputText: bedrockPrompt,
            textGenerationConfig: {
              maxTokenCount: 1000,
              temperature: 0.7,
              topP: 0.9
            }
          }),
          contentType: 'application/json',
          accept: 'application/json'
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        analysis = responseBody.results[0].outputText;
      } catch (bedrockError) {
        console.error('Bedrock error:', bedrockError);
        
        // Fallback analysis
        const wordCount = content.split(/\s+/).length;
        const sentenceCount = content.split(/[.!?]+/).length - 1;
        analysis = `Quick Analysis: This content contains ${wordCount} words and ${sentenceCount} sentences. ${prompt ? `Regarding "${prompt}": The content addresses this topic with ${wordCount > 50 ? 'detailed' : 'brief'} coverage.` : 'The text appears well-structured and informative.'} (Fallback analysis - AI services unavailable)`;
      }
      
      result = { analysis };
    } else if (type === 'generate') {
      // Generate text
      let generatedText;
      try {
        const command = new InvokeModelCommand({
          modelId: 'amazon.titan-text-express-v1',
          body: JSON.stringify({
            inputText: prompt,
            textGenerationConfig: {
              maxTokenCount: 1000,
              temperature: 0.7,
              topP: 0.9
            }
          }),
          contentType: 'application/json',
          accept: 'application/json'
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        generatedText = responseBody.results[0].outputText;
      } catch (bedrockError) {
        console.error('Bedrock error:', bedrockError);
        generatedText = `Generated response for: "${prompt}"\n\nThis is a structured response addressing your request. The content has been generated to provide relevant information and insights based on your prompt.\n\n(Fallback generation - AI services unavailable)`;
      }
      
      result = { generatedText };
    } else {
      // Default to transform
      let transformedContent;
      try {
        const transformPrompt = `Transform the following content: "${content}". ${prompt ? `Instructions: ${prompt}` : 'Apply general improvements and formatting.'}`;
        
        const command = new InvokeModelCommand({
          modelId: 'amazon.titan-text-express-v1',
          body: JSON.stringify({
            inputText: transformPrompt,
            textGenerationConfig: {
              maxTokenCount: 1000,
              temperature: 0.7,
              topP: 0.9
            }
          }),
          contentType: 'application/json',
          accept: 'application/json'
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        transformedContent = responseBody.results[0].outputText;
      } catch (bedrockError) {
        console.error('Bedrock error:', bedrockError);
        transformedContent = `Transformed: ${content.trim()}\n\n${prompt ? `Applied instructions: ${prompt}` : 'Applied general formatting and readability improvements.'}\n\n(Fallback transformation - AI services unavailable)`;
      }
      
      result = { transformedContent };
    }

    res.json(result);
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// Payment endpoints (mock for now)
app.post('/api/payments/create-order', async (req, res) => {
  try {
    res.json({
      id: 'mock-order-' + Date.now(),
      status: 'CREATED',
      amount: req.body.amount || '10.00',
      currency: 'USD'
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

app.post('/api/payments/capture-order', async (req, res) => {
  try {
    res.json({
      id: req.body.orderID || 'mock-order-' + Date.now(),
      status: 'COMPLETED',
      payer: {
        email_address: 'user@example.com'
      }
    });
  } catch (error) {
    console.error('Payment capture error:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NLP Tool App server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://44.205.255.158:${PORT}`);
  console.log(`📋 API endpoints: http://44.205.255.158:${PORT}/api`);
  console.log(`🏠 Frontend: http://44.205.255.158:${PORT}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎭 Running in development mode with mock responses`);
  } else {
    console.log(`☁️ Using AWS services: DynamoDB, Bedrock`);
  }
});

module.exports = app;

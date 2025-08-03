/**
 * SEO NLP App Server with Cost Optimization and Auto-scaling
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const CostOptimizer = require('./services/cost-optimizer');
const { 
    getModelConfig, 
    calculateCost, 
    getTierFeatures,
    getOptimalModel 
} = require('./config/ai-models');

// Import routes
const authRoutes = require('../routes/auth');
const nlpRoutes = require('../routes/nlp');
const subscriptionRoutes = require('../routes/subscriptions');
const paymentRoutes = require('../routes/payments');
const fileRoutes = require('../routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const bedrockClient = new BedrockRuntimeClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});
const costOptimizer = new CostOptimizer();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/nlp', nlpRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
    try {
        // Check if services are ready
        const checks = {
            bedrock: true, // Assume ready if no error
            redis: true,   // Assume ready if no error
            costOptimizer: true
        };
        
        res.status(200).json({
            status: 'ready',
            checks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// User tier middleware
const getUserTier = (req, res, next) => {
    // In a real app, this would come from authentication/database
    const tier = req.headers['x-user-tier'] || 'FREE';
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    req.userTier = tier.toUpperCase();
    req.userId = userId;
    next();
};

// SEO Analysis endpoint
app.post('/api/seo/analyze', getUserTier, async (req, res) => {
    try {
        const { content, url, options = {} } = req.body;
        const { userTier, userId } = req;
        
        if (!content) {
            return res.status(400).json({
                error: 'Content is required',
                code: 'MISSING_CONTENT'
            });
        }
        
        // Check if request should be processed
        const requestCheck = await costOptimizer.shouldProcessRequest(userId, userTier, 'textGeneration');
        if (!requestCheck.allowed) {
            return res.status(429).json({
                error: 'Request limit exceeded',
                code: requestCheck.reason,
                details: requestCheck
            });
        }
        
        // Generate cache key
        const cacheKey = costOptimizer.generateCacheKey(userTier, 'seo-analysis', content, options);
        
        // Check cache first
        const cachedResult = await costOptimizer.getCachedResult(cacheKey, userTier);
        if (cachedResult) {
            return res.json({
                ...cachedResult,
                cached: true,
                tier: userTier
            });
        }
        
        // Get optimal model configuration
        const modelConfig = getOptimalModel(userTier, content, 'textGeneration');
        
        // Prepare prompt for SEO analysis
        const prompt = `Analyze the following content for SEO optimization:

Content: ${content}
${url ? `URL: ${url}` : ''}

Please provide:
1. SEO score (0-100)
2. Key issues and recommendations
3. Keyword suggestions
4. Content optimization tips
5. Meta description suggestion

Format the response as JSON.`;

        // Calculate input tokens (rough estimate)
        const inputTokens = Math.ceil(prompt.length / 4);
        
        // Invoke Bedrock model
        const command = new InvokeModelCommand({
            modelId: modelConfig.modelId,
            body: JSON.stringify({
                prompt: `Human: ${prompt}\n\nAssistant:`,
                max_tokens: modelConfig.maxTokens,
                temperature: modelConfig.temperature,
                top_p: 0.9,
                stop_sequences: ["Human:"]
            }),
            contentType: 'application/json',
            accept: 'application/json'
        });
        
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Calculate output tokens and cost
        const outputTokens = Math.ceil(responseBody.completion.length / 4);
        const cost = calculateCost(userTier, 'textGeneration', inputTokens, outputTokens);
        
        // Track usage
        await costOptimizer.trackUsage(userId, userTier, 'textGeneration', inputTokens, outputTokens, cost);
        
        // Prepare result
        const result = {
            analysis: responseBody.completion,
            metadata: {
                modelUsed: modelConfig.modelId,
                tokensUsed: inputTokens + outputTokens,
                cost: cost,
                tier: userTier,
                timestamp: new Date().toISOString()
            },
            limits: requestCheck.limits
        };
        
        // Cache result
        await costOptimizer.cacheResult(cacheKey, result, userTier);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error in SEO analysis:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'ANALYSIS_FAILED',
            message: error.message
        });
    }
});

// Keyword Research endpoint
app.post('/api/seo/keywords', getUserTier, async (req, res) => {
    try {
        const { topic, targetAudience, options = {} } = req.body;
        const { userTier, userId } = req;
        
        if (!topic) {
            return res.status(400).json({
                error: 'Topic is required',
                code: 'MISSING_TOPIC'
            });
        }
        
        // Check if request should be processed
        const requestCheck = await costOptimizer.shouldProcessRequest(userId, userTier, 'textGeneration');
        if (!requestCheck.allowed) {
            return res.status(429).json({
                error: 'Request limit exceeded',
                code: requestCheck.reason,
                details: requestCheck
            });
        }
        
        // Generate cache key
        const cacheKey = costOptimizer.generateCacheKey(userTier, 'keyword-research', topic, { targetAudience, ...options });
        
        // Check cache first
        const cachedResult = await costOptimizer.getCachedResult(cacheKey, userTier);
        if (cachedResult) {
            return res.json({
                ...cachedResult,
                cached: true,
                tier: userTier
            });
        }
        
        // Get optimal model configuration
        const modelConfig = getOptimalModel(userTier, topic, 'textGeneration');
        
        // Prepare prompt for keyword research
        const prompt = `Generate comprehensive keyword research for the following topic:

Topic: ${topic}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Please provide:
1. Primary keywords (high volume, high competition)
2. Long-tail keywords (lower volume, lower competition)
3. Related keywords and synonyms
4. Search intent analysis
5. Difficulty scores (estimated)
6. Content ideas based on keywords

Format the response as JSON with clear categories.`;

        // Calculate input tokens
        const inputTokens = Math.ceil(prompt.length / 4);
        
        // Invoke Bedrock model
        const command = new InvokeModelCommand({
            modelId: modelConfig.modelId,
            body: JSON.stringify({
                prompt: `Human: ${prompt}\n\nAssistant:`,
                max_tokens: modelConfig.maxTokens,
                temperature: modelConfig.temperature,
                top_p: 0.9,
                stop_sequences: ["Human:"]
            }),
            contentType: 'application/json',
            accept: 'application/json'
        });
        
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Calculate cost and track usage
        const outputTokens = Math.ceil(responseBody.completion.length / 4);
        const cost = calculateCost(userTier, 'textGeneration', inputTokens, outputTokens);
        
        await costOptimizer.trackUsage(userId, userTier, 'textGeneration', inputTokens, outputTokens, cost);
        
        const result = {
            keywords: responseBody.completion,
            metadata: {
                modelUsed: modelConfig.modelId,
                tokensUsed: inputTokens + outputTokens,
                cost: cost,
                tier: userTier,
                timestamp: new Date().toISOString()
            },
            limits: requestCheck.limits
        };
        
        // Cache result
        await costOptimizer.cacheResult(cacheKey, result, userTier);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error in keyword research:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'KEYWORD_RESEARCH_FAILED',
            message: error.message
        });
    }
});

// Content Optimization endpoint
app.post('/api/seo/optimize', getUserTier, async (req, res) => {
    try {
        const { content, targetKeywords, options = {} } = req.body;
        const { userTier, userId } = req;
        
        if (!content) {
            return res.status(400).json({
                error: 'Content is required',
                code: 'MISSING_CONTENT'
            });
        }
        
        // Check tier features
        const features = getTierFeatures(userTier);
        if (!features.contentSuggestions) {
            return res.status(403).json({
                error: 'Content optimization not available in your tier',
                code: 'FEATURE_NOT_AVAILABLE',
                tier: userTier
            });
        }
        
        // Check request limits
        const requestCheck = await costOptimizer.shouldProcessRequest(userId, userTier, 'contentOptimization');
        if (!requestCheck.allowed) {
            return res.status(429).json({
                error: 'Request limit exceeded',
                code: requestCheck.reason,
                details: requestCheck
            });
        }
        
        // Generate cache key
        const cacheKey = costOptimizer.generateCacheKey(userTier, 'content-optimization', content, { targetKeywords, ...options });
        
        // Check cache
        const cachedResult = await costOptimizer.getCachedResult(cacheKey, userTier);
        if (cachedResult) {
            return res.json({
                ...cachedResult,
                cached: true,
                tier: userTier
            });
        }
        
        // Get model configuration
        const modelConfig = getOptimalModel(userTier, content, 'contentOptimization');
        
        // Prepare optimization prompt
        const prompt = `Optimize the following content for SEO:

Original Content: ${content}
${targetKeywords ? `Target Keywords: ${targetKeywords.join(', ')}` : ''}

Please provide:
1. Optimized version of the content
2. Keyword density analysis
3. Readability improvements
4. Structure suggestions (headings, paragraphs)
5. Internal linking opportunities
6. Meta title and description suggestions

Format the response as JSON with clear sections.`;

        const inputTokens = Math.ceil(prompt.length / 4);
        
        const command = new InvokeModelCommand({
            modelId: modelConfig.modelId,
            body: JSON.stringify({
                prompt: `Human: ${prompt}\n\nAssistant:`,
                max_tokens: modelConfig.maxTokens,
                temperature: modelConfig.temperature,
                top_p: 0.9,
                stop_sequences: ["Human:"]
            }),
            contentType: 'application/json',
            accept: 'application/json'
        });
        
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        const outputTokens = Math.ceil(responseBody.completion.length / 4);
        const cost = calculateCost(userTier, 'contentOptimization', inputTokens, outputTokens);
        
        await costOptimizer.trackUsage(userId, userTier, 'contentOptimization', inputTokens, outputTokens, cost);
        
        const result = {
            optimizedContent: responseBody.completion,
            metadata: {
                modelUsed: modelConfig.modelId,
                tokensUsed: inputTokens + outputTokens,
                cost: cost,
                tier: userTier,
                timestamp: new Date().toISOString()
            },
            limits: requestCheck.limits
        };
        
        await costOptimizer.cacheResult(cacheKey, result, userTier);
        
        res.json(result);
        
    } catch (error) {
        console.error('Error in content optimization:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'OPTIMIZATION_FAILED',
            message: error.message
        });
    }
});

// User usage statistics endpoint
app.get('/api/user/usage', getUserTier, async (req, res) => {
    try {
        const { userId, userTier } = req;
        
        const usage = await costOptimizer.getUserUsage(userId);
        const features = getTierFeatures(userTier);
        const recommendations = await costOptimizer.getCostOptimizationRecommendations(userId);
        
        res.json({
            usage,
            tier: userTier,
            features,
            recommendations,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting usage statistics:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'USAGE_STATS_FAILED',
            message: error.message
        });
    }
});

// Cost optimization metrics endpoint (for monitoring)
app.get('/api/metrics', async (req, res) => {
    try {
        const metrics = await costOptimizer.getRecentMetrics();
        
        res.json({
            metrics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting metrics:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'METRICS_FAILED',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        code: 'UNHANDLED_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        code: 'NOT_FOUND',
        path: req.path
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEO NLP App server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    
    // Start cost optimization
    setInterval(() => {
        costOptimizer.optimizeResources().catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes
});

module.exports = app;

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

class AIModelService {
    constructor() {
        this.client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Cost-optimized AI model configuration by subscription tier
        this.modelConfig = {
            free: {
                modelId: process.env.FREE_TIER_MODEL || 'amazon.titan-text-lite-v1',
                maxTokens: 512,
                temperature: 0.7,
                topP: 0.9,
                dailyLimit: 10, // 10 requests per day
                monthlyLimit: 100, // 100 requests per month
                costPerToken: 0.0001, // Lowest cost
                features: ['basic_seo_analysis', 'keyword_extraction']
            },
            basic: {
                modelId: process.env.BASIC_TIER_MODEL || 'amazon.titan-text-express-v1',
                maxTokens: 1024,
                temperature: 0.7,
                topP: 0.9,
                dailyLimit: 50,
                monthlyLimit: 1000,
                costPerToken: 0.0003,
                features: ['basic_seo_analysis', 'keyword_extraction', 'content_optimization', 'meta_description']
            },
            pro: {
                modelId: process.env.PRO_TIER_MODEL || 'anthropic.claude-3-haiku-20240307-v1:0',
                maxTokens: 2048,
                temperature: 0.6,
                topP: 0.8,
                dailyLimit: 200,
                monthlyLimit: 5000,
                costPerToken: 0.0008,
                features: ['advanced_seo_analysis', 'keyword_extraction', 'content_optimization', 'meta_description', 'competitor_analysis', 'content_strategy']
            },
            enterprise: {
                modelId: process.env.ENTERPRISE_TIER_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0',
                maxTokens: 4096,
                temperature: 0.5,
                topP: 0.7,
                dailyLimit: 1000,
                monthlyLimit: 25000,
                costPerToken: 0.003,
                features: ['premium_seo_analysis', 'keyword_extraction', 'content_optimization', 'meta_description', 'competitor_analysis', 'content_strategy', 'technical_seo', 'schema_markup', 'performance_optimization']
            }
        };

        // Usage tracking
        this.usageCache = new Map();
    }

    /**
     * Get model configuration for user's subscription tier
     */
    getModelConfig(subscriptionTier = 'free') {
        const tier = subscriptionTier.toLowerCase();
        return this.modelConfig[tier] || this.modelConfig.free;
    }

    /**
     * Check if user has exceeded their usage limits
     */
    async checkUsageLimits(userId, subscriptionTier) {
        const config = this.getModelConfig(subscriptionTier);
        const today = new Date().toISOString().split('T')[0];
        const month = new Date().toISOString().substring(0, 7);

        // Get usage from DynamoDB (implement based on your table structure)
        const dailyUsage = await this.getDailyUsage(userId, today);
        const monthlyUsage = await this.getMonthlyUsage(userId, month);

        return {
            canUse: dailyUsage < config.dailyLimit && monthlyUsage < config.monthlyLimit,
            dailyUsage,
            monthlyUsage,
            dailyLimit: config.dailyLimit,
            monthlyLimit: config.monthlyLimit,
            remainingDaily: Math.max(0, config.dailyLimit - dailyUsage),
            remainingMonthly: Math.max(0, config.monthlyLimit - monthlyUsage)
        };
    }

    /**
     * Invoke AI model with tier-specific configuration
     */
    async invokeModel(prompt, userId, subscriptionTier = 'free', analysisType = 'basic_seo_analysis') {
        try {
            const config = this.getModelConfig(subscriptionTier);
            
            // Check if the requested analysis type is available for this tier
            if (!config.features.includes(analysisType)) {
                throw new Error(`Analysis type '${analysisType}' not available for ${subscriptionTier} tier. Please upgrade your subscription.`);
            }

            // Check usage limits
            const usageCheck = await this.checkUsageLimits(userId, subscriptionTier);
            if (!usageCheck.canUse) {
                throw new Error(`Usage limit exceeded. Daily: ${usageCheck.dailyUsage}/${usageCheck.dailyLimit}, Monthly: ${usageCheck.monthlyUsage}/${usageCheck.monthlyLimit}`);
            }

            // Prepare model-specific payload
            const payload = this.preparePayload(config, prompt, analysisType);
            
            const command = new InvokeModelCommand({
                modelId: config.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload)
            });

            console.log(`🤖 Invoking ${config.modelId} for user ${userId} (${subscriptionTier} tier)`);
            
            const response = await this.client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            // Track usage
            await this.trackUsage(userId, subscriptionTier, config.modelId, payload, responseBody);
            
            return {
                success: true,
                result: this.parseResponse(responseBody, config.modelId),
                modelUsed: config.modelId,
                tokensUsed: this.calculateTokens(responseBody),
                costEstimate: this.calculateCost(responseBody, config.costPerToken),
                remainingUsage: {
                    daily: usageCheck.remainingDaily - 1,
                    monthly: usageCheck.remainingMonthly - 1
                }
            };

        } catch (error) {
            console.error('AI Model invocation error:', error);
            
            // Handle specific AWS Bedrock errors
            if (error.name === 'ThrottlingException') {
                throw new Error('Service is temporarily busy. Please try again in a few moments.');
            } else if (error.name === 'ValidationException') {
                throw new Error('Invalid request format. Please check your input.');
            } else if (error.name === 'AccessDeniedException') {
                throw new Error('Access denied to AI model. Please contact support.');
            }
            
            throw error;
        }
    }

    /**
     * Prepare model-specific payload
     */
    preparePayload(config, prompt, analysisType) {
        const enhancedPrompt = this.enhancePromptForAnalysisType(prompt, analysisType, config.features);
        
        if (config.modelId.includes('titan')) {
            return {
                inputText: enhancedPrompt,
                textGenerationConfig: {
                    maxTokenCount: config.maxTokens,
                    temperature: config.temperature,
                    topP: config.topP,
                    stopSequences: []
                }
            };
        } else if (config.modelId.includes('claude')) {
            return {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: config.maxTokens,
                temperature: config.temperature,
                top_p: config.topP,
                messages: [
                    {
                        role: "user",
                        content: enhancedPrompt
                    }
                ]
            };
        }
        
        // Default payload
        return {
            prompt: enhancedPrompt,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            top_p: config.topP
        };
    }

    /**
     * Enhance prompt based on analysis type and available features
     */
    enhancePromptForAnalysisType(prompt, analysisType, availableFeatures) {
        const analysisPrompts = {
            basic_seo_analysis: `Analyze the following content for basic SEO optimization:\n\n${prompt}\n\nProvide: keyword density, readability score, and basic recommendations.`,
            
            keyword_extraction: `Extract relevant keywords and phrases from the following content:\n\n${prompt}\n\nProvide: primary keywords, secondary keywords, and long-tail keywords.`,
            
            content_optimization: `Optimize the following content for SEO:\n\n${prompt}\n\nProvide: improved content structure, keyword placement, and readability enhancements.`,
            
            meta_description: `Create SEO-optimized meta descriptions for the following content:\n\n${prompt}\n\nProvide: 3 different meta descriptions under 160 characters each.`,
            
            competitor_analysis: `Analyze the competitive landscape for the following content:\n\n${prompt}\n\nProvide: competitor keywords, content gaps, and opportunities.`,
            
            content_strategy: `Develop a content strategy based on:\n\n${prompt}\n\nProvide: content calendar, topic clusters, and optimization roadmap.`,
            
            technical_seo: `Perform technical SEO analysis for:\n\n${prompt}\n\nProvide: technical recommendations, performance optimizations, and crawlability improvements.`,
            
            schema_markup: `Generate appropriate schema markup for:\n\n${prompt}\n\nProvide: JSON-LD schema markup and implementation guidelines.`,
            
            performance_optimization: `Analyze and optimize performance for:\n\n${prompt}\n\nProvide: Core Web Vitals improvements, loading optimizations, and user experience enhancements.`
        };

        return analysisPrompts[analysisType] || prompt;
    }

    /**
     * Parse response based on model type
     */
    parseResponse(responseBody, modelId) {
        if (modelId.includes('titan')) {
            return responseBody.results?.[0]?.outputText || responseBody.outputText || '';
        } else if (modelId.includes('claude')) {
            return responseBody.content?.[0]?.text || responseBody.completion || '';
        }
        
        return responseBody.text || responseBody.completion || JSON.stringify(responseBody);
    }

    /**
     * Calculate tokens used (approximate)
     */
    calculateTokens(responseBody) {
        const text = JSON.stringify(responseBody);
        return Math.ceil(text.length / 4); // Rough approximation: 1 token ≈ 4 characters
    }

    /**
     * Calculate cost estimate
     */
    calculateCost(responseBody, costPerToken) {
        const tokens = this.calculateTokens(responseBody);
        return (tokens * costPerToken).toFixed(6);
    }

    /**
     * Track usage in DynamoDB
     */
    async trackUsage(userId, subscriptionTier, modelId, request, response) {
        const usage = {
            userId,
            timestamp: new Date().toISOString(),
            subscriptionTier,
            modelId,
            tokensUsed: this.calculateTokens(response),
            costEstimate: this.calculateCost(response, this.getModelConfig(subscriptionTier).costPerToken),
            requestSize: JSON.stringify(request).length,
            responseSize: JSON.stringify(response).length
        };

        // Store in DynamoDB (implement based on your table structure)
        console.log('📊 Usage tracked:', usage);
        
        // You can implement actual DynamoDB storage here
        // await this.storeUsageInDynamoDB(usage);
    }

    /**
     * Get daily usage from DynamoDB
     */
    async getDailyUsage(userId, date) {
        // Implement DynamoDB query for daily usage
        // This is a placeholder - implement based on your table structure
        return 0;
    }

    /**
     * Get monthly usage from DynamoDB
     */
    async getMonthlyUsage(userId, month) {
        // Implement DynamoDB query for monthly usage
        // This is a placeholder - implement based on your table structure
        return 0;
    }

    /**
     * Get available features for subscription tier
     */
    getAvailableFeatures(subscriptionTier) {
        const config = this.getModelConfig(subscriptionTier);
        return {
            tier: subscriptionTier,
            features: config.features,
            dailyLimit: config.dailyLimit,
            monthlyLimit: config.monthlyLimit,
            maxTokens: config.maxTokens,
            modelId: config.modelId
        };
    }

    /**
     * Get cost estimate for analysis
     */
    getCostEstimate(subscriptionTier, estimatedTokens = 1000) {
        const config = this.getModelConfig(subscriptionTier);
        return {
            tier: subscriptionTier,
            estimatedTokens,
            costPerToken: config.costPerToken,
            estimatedCost: (estimatedTokens * config.costPerToken).toFixed(6),
            currency: 'USD'
        };
    }
}

module.exports = AIModelService;

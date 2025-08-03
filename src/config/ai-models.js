/**
 * Tiered AI Model Configuration for Cost Optimization
 * Different subscription tiers get different AI models based on cost and capability
 */

const AI_MODEL_TIERS = {
    FREE: {
        name: 'Free Tier',
        maxRequestsPerDay: 10,
        maxRequestsPerMonth: 100,
        models: {
            // Use cheapest models for free tier
            textGeneration: {
                modelId: 'amazon.titan-text-lite-v1',
                maxTokens: 512,
                temperature: 0.7,
                costPerToken: 0.0003 // Very low cost
            },
            textEmbedding: {
                modelId: 'amazon.titan-embed-text-v1',
                dimensions: 1536,
                costPerToken: 0.0001
            },
            summarization: {
                modelId: 'amazon.titan-text-lite-v1',
                maxTokens: 256,
                temperature: 0.3
            }
        },
        features: {
            basicSEO: true,
            keywordAnalysis: true,
            contentSuggestions: false,
            advancedAnalytics: false,
            realTimeOptimization: false,
            customPrompts: false
        }
    },
    
    BASIC: {
        name: 'Basic Plan',
        maxRequestsPerDay: 100,
        maxRequestsPerMonth: 2000,
        models: {
            // Mid-level models for basic tier
            textGeneration: {
                modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
                maxTokens: 1024,
                temperature: 0.7,
                costPerToken: 0.00025
            },
            textEmbedding: {
                modelId: 'amazon.titan-embed-text-v1',
                dimensions: 1536,
                costPerToken: 0.0001
            },
            summarization: {
                modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
                maxTokens: 512,
                temperature: 0.3
            },
            contentOptimization: {
                modelId: 'amazon.titan-text-express-v1',
                maxTokens: 2048,
                temperature: 0.5
            }
        },
        features: {
            basicSEO: true,
            keywordAnalysis: true,
            contentSuggestions: true,
            advancedAnalytics: false,
            realTimeOptimization: false,
            customPrompts: false,
            batchProcessing: true
        }
    },
    
    PRO: {
        name: 'Pro Plan',
        maxRequestsPerDay: 500,
        maxRequestsPerMonth: 10000,
        models: {
            // Better models for pro tier
            textGeneration: {
                modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
                maxTokens: 2048,
                temperature: 0.7,
                costPerToken: 0.003
            },
            textEmbedding: {
                modelId: 'cohere.embed-english-v3',
                dimensions: 1024,
                costPerToken: 0.0001
            },
            summarization: {
                modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
                maxTokens: 1024,
                temperature: 0.3
            },
            contentOptimization: {
                modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
                maxTokens: 4096,
                temperature: 0.5
            },
            competitorAnalysis: {
                modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
                maxTokens: 3072,
                temperature: 0.4
            }
        },
        features: {
            basicSEO: true,
            keywordAnalysis: true,
            contentSuggestions: true,
            advancedAnalytics: true,
            realTimeOptimization: true,
            customPrompts: true,
            batchProcessing: true,
            competitorAnalysis: true,
            multiLanguage: true
        }
    },
    
    ENTERPRISE: {
        name: 'Enterprise Plan',
        maxRequestsPerDay: 2000,
        maxRequestsPerMonth: 50000,
        models: {
            // Best models for enterprise tier
            textGeneration: {
                modelId: 'anthropic.claude-3-opus-20240229-v1:0',
                maxTokens: 4096,
                temperature: 0.7,
                costPerToken: 0.015
            },
            textEmbedding: {
                modelId: 'cohere.embed-english-v3',
                dimensions: 1024,
                costPerToken: 0.0001
            },
            summarization: {
                modelId: 'anthropic.claude-3-opus-20240229-v1:0',
                maxTokens: 2048,
                temperature: 0.3
            },
            contentOptimization: {
                modelId: 'anthropic.claude-3-opus-20240229-v1:0',
                maxTokens: 8192,
                temperature: 0.5
            },
            competitorAnalysis: {
                modelId: 'anthropic.claude-3-opus-20240229-v1:0',
                maxTokens: 6144,
                temperature: 0.4
            },
            customAnalysis: {
                modelId: 'anthropic.claude-3-opus-20240229-v1:0',
                maxTokens: 8192,
                temperature: 0.6
            }
        },
        features: {
            basicSEO: true,
            keywordAnalysis: true,
            contentSuggestions: true,
            advancedAnalytics: true,
            realTimeOptimization: true,
            customPrompts: true,
            batchProcessing: true,
            competitorAnalysis: true,
            multiLanguage: true,
            customModels: true,
            prioritySupport: true,
            whiteLabel: true,
            apiAccess: true
        }
    }
};

/**
 * Cost optimization strategies
 */
const COST_OPTIMIZATION = {
    // Cache frequently used results
    caching: {
        enabled: true,
        ttl: {
            FREE: 3600,      // 1 hour
            BASIC: 1800,     // 30 minutes
            PRO: 900,        // 15 minutes
            ENTERPRISE: 300  // 5 minutes
        }
    },
    
    // Batch processing for efficiency
    batching: {
        enabled: true,
        batchSize: {
            FREE: 1,
            BASIC: 5,
            PRO: 10,
            ENTERPRISE: 20
        },
        maxWaitTime: 5000 // 5 seconds
    },
    
    // Request throttling
    throttling: {
        enabled: true,
        rateLimit: {
            FREE: { requests: 1, window: 60000 },      // 1 req/minute
            BASIC: { requests: 10, window: 60000 },    // 10 req/minute
            PRO: { requests: 50, window: 60000 },      // 50 req/minute
            ENTERPRISE: { requests: 200, window: 60000 } // 200 req/minute
        }
    },
    
    // Smart model selection based on content complexity
    smartSelection: {
        enabled: true,
        rules: {
            shortContent: 'lite',    // Use lite models for short content
            mediumContent: 'standard', // Use standard models for medium content
            longContent: 'advanced',   // Use advanced models for long content
            complexAnalysis: 'premium' // Use premium models for complex analysis
        }
    }
};

/**
 * Get model configuration for a specific tier and use case
 */
function getModelConfig(tier, useCase) {
    const tierConfig = AI_MODEL_TIERS[tier.toUpperCase()];
    if (!tierConfig) {
        throw new Error(`Invalid tier: ${tier}`);
    }
    
    const modelConfig = tierConfig.models[useCase];
    if (!modelConfig) {
        throw new Error(`Invalid use case: ${useCase} for tier: ${tier}`);
    }
    
    return {
        ...modelConfig,
        tier: tierConfig.name,
        features: tierConfig.features,
        limits: {
            maxRequestsPerDay: tierConfig.maxRequestsPerDay,
            maxRequestsPerMonth: tierConfig.maxRequestsPerMonth
        }
    };
}

/**
 * Calculate estimated cost for a request
 */
function calculateCost(tier, useCase, inputTokens, outputTokens = 0) {
    const config = getModelConfig(tier, useCase);
    const totalTokens = inputTokens + outputTokens;
    return totalTokens * config.costPerToken;
}

/**
 * Get appropriate model based on content complexity and tier
 */
function getOptimalModel(tier, content, useCase) {
    const tierConfig = AI_MODEL_TIERS[tier.toUpperCase()];
    const contentLength = content.length;
    
    // Smart model selection based on content complexity
    if (COST_OPTIMIZATION.smartSelection.enabled) {
        let complexity = 'standard';
        
        if (contentLength < 500) {
            complexity = 'lite';
        } else if (contentLength > 2000) {
            complexity = 'advanced';
        }
        
        // For free tier, always use the cheapest option
        if (tier.toUpperCase() === 'FREE') {
            complexity = 'lite';
        }
    }
    
    return getModelConfig(tier, useCase);
}

/**
 * Check if user has exceeded their limits
 */
function checkLimits(tier, dailyUsage, monthlyUsage) {
    const tierConfig = AI_MODEL_TIERS[tier.toUpperCase()];
    
    return {
        dailyLimitExceeded: dailyUsage >= tierConfig.maxRequestsPerDay,
        monthlyLimitExceeded: monthlyUsage >= tierConfig.maxRequestsPerMonth,
        remainingDaily: Math.max(0, tierConfig.maxRequestsPerDay - dailyUsage),
        remainingMonthly: Math.max(0, tierConfig.maxRequestsPerMonth - monthlyUsage)
    };
}

/**
 * Get caching configuration for tier
 */
function getCacheConfig(tier) {
    return {
        enabled: COST_OPTIMIZATION.caching.enabled,
        ttl: COST_OPTIMIZATION.caching.ttl[tier.toUpperCase()] || 3600
    };
}

/**
 * Get throttling configuration for tier
 */
function getThrottleConfig(tier) {
    return COST_OPTIMIZATION.throttling.rateLimit[tier.toUpperCase()] || 
           COST_OPTIMIZATION.throttling.rateLimit.FREE;
}

/**
 * Get all available features for a tier
 */
function getTierFeatures(tier) {
    const tierConfig = AI_MODEL_TIERS[tier.toUpperCase()];
    return tierConfig ? tierConfig.features : AI_MODEL_TIERS.FREE.features;
}

module.exports = {
    AI_MODEL_TIERS,
    COST_OPTIMIZATION,
    getModelConfig,
    calculateCost,
    getOptimalModel,
    checkLimits,
    getCacheConfig,
    getThrottleConfig,
    getTierFeatures
};

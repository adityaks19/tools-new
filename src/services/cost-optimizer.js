/**
 * Intelligent Cost Optimization Service
 * Manages resource usage, caching, and smart scaling decisions
 */

const AWS = require('aws-sdk');
const Redis = require('redis');
const { 
    getModelConfig, 
    calculateCost, 
    checkLimits, 
    getCacheConfig,
    getThrottleConfig 
} = require('../config/ai-models');

class CostOptimizer {
    constructor() {
        this.cloudwatch = new AWS.CloudWatch();
        this.ecs = new AWS.ECS();
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        });
        
        this.metrics = {
            totalRequests: 0,
            totalCost: 0,
            cacheHits: 0,
            cacheMisses: 0,
            throttledRequests: 0
        };
        
        // Initialize rate limiting storage
        this.rateLimitStore = new Map();
        
        // Start metrics reporting
        this.startMetricsReporting();
    }
    
    /**
     * Check if request should be processed based on tier limits and throttling
     */
    async shouldProcessRequest(userId, tier, useCase) {
        try {
            // Check tier limits
            const usage = await this.getUserUsage(userId);
            const limits = checkLimits(tier, usage.daily, usage.monthly);
            
            if (limits.dailyLimitExceeded || limits.monthlyLimitExceeded) {
                return {
                    allowed: false,
                    reason: 'LIMIT_EXCEEDED',
                    limits: limits
                };
            }
            
            // Check rate limiting
            const throttleConfig = getThrottleConfig(tier);
            const rateLimitKey = `${userId}:${tier}`;
            const now = Date.now();
            
            if (!this.rateLimitStore.has(rateLimitKey)) {
                this.rateLimitStore.set(rateLimitKey, {
                    requests: 0,
                    windowStart: now
                });
            }
            
            const rateLimitData = this.rateLimitStore.get(rateLimitKey);
            
            // Reset window if expired
            if (now - rateLimitData.windowStart > throttleConfig.window) {
                rateLimitData.requests = 0;
                rateLimitData.windowStart = now;
            }
            
            if (rateLimitData.requests >= throttleConfig.requests) {
                this.metrics.throttledRequests++;
                return {
                    allowed: false,
                    reason: 'RATE_LIMITED',
                    retryAfter: throttleConfig.window - (now - rateLimitData.windowStart)
                };
            }
            
            // Increment request count
            rateLimitData.requests++;
            
            return {
                allowed: true,
                remainingRequests: throttleConfig.requests - rateLimitData.requests,
                limits: limits
            };
            
        } catch (error) {
            console.error('Error checking request limits:', error);
            // Allow request on error to avoid blocking users
            return { allowed: true };
        }
    }
    
    /**
     * Get cached result if available
     */
    async getCachedResult(cacheKey, tier) {
        try {
            const cacheConfig = getCacheConfig(tier);
            if (!cacheConfig.enabled) {
                return null;
            }
            
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                return JSON.parse(cached);
            }
            
            this.metrics.cacheMisses++;
            return null;
            
        } catch (error) {
            console.error('Error getting cached result:', error);
            return null;
        }
    }
    
    /**
     * Cache result for future use
     */
    async cacheResult(cacheKey, result, tier) {
        try {
            const cacheConfig = getCacheConfig(tier);
            if (!cacheConfig.enabled) {
                return;
            }
            
            await this.redis.setex(
                cacheKey, 
                cacheConfig.ttl, 
                JSON.stringify(result)
            );
            
        } catch (error) {
            console.error('Error caching result:', error);
        }
    }
    
    /**
     * Generate cache key for request
     */
    generateCacheKey(tier, useCase, content, options = {}) {
        const hash = require('crypto')
            .createHash('md5')
            .update(JSON.stringify({ tier, useCase, content, options }))
            .digest('hex');
        
        return `nlp-tool:${tier}:${useCase}:${hash}`;
    }
    
    /**
     * Track usage for a user
     */
    async trackUsage(userId, tier, useCase, inputTokens, outputTokens, cost) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const month = today.substring(0, 7);
            
            // Update daily usage
            const dailyKey = `usage:${userId}:${today}`;
            await this.redis.hincrby(dailyKey, 'requests', 1);
            await this.redis.hincrby(dailyKey, 'tokens', inputTokens + outputTokens);
            await this.redis.hincrbyfloat(dailyKey, 'cost', cost);
            await this.redis.expire(dailyKey, 86400 * 7); // Keep for 7 days
            
            // Update monthly usage
            const monthlyKey = `usage:${userId}:${month}`;
            await this.redis.hincrby(monthlyKey, 'requests', 1);
            await this.redis.hincrby(monthlyKey, 'tokens', inputTokens + outputTokens);
            await this.redis.hincrbyfloat(monthlyKey, 'cost', cost);
            await this.redis.expire(monthlyKey, 86400 * 32); // Keep for 32 days
            
            // Update global metrics
            this.metrics.totalRequests++;
            this.metrics.totalCost += cost;
            
        } catch (error) {
            console.error('Error tracking usage:', error);
        }
    }
    
    /**
     * Get user usage statistics
     */
    async getUserUsage(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const month = today.substring(0, 7);
            
            const dailyKey = `usage:${userId}:${today}`;
            const monthlyKey = `usage:${userId}:${month}`;
            
            const [dailyUsage, monthlyUsage] = await Promise.all([
                this.redis.hgetall(dailyKey),
                this.redis.hgetall(monthlyKey)
            ]);
            
            return {
                daily: parseInt(dailyUsage.requests || 0),
                monthly: parseInt(monthlyUsage.requests || 0),
                dailyCost: parseFloat(dailyUsage.cost || 0),
                monthlyCost: parseFloat(monthlyUsage.cost || 0),
                dailyTokens: parseInt(dailyUsage.tokens || 0),
                monthlyTokens: parseInt(monthlyUsage.tokens || 0)
            };
            
        } catch (error) {
            console.error('Error getting user usage:', error);
            return { daily: 0, monthly: 0, dailyCost: 0, monthlyCost: 0 };
        }
    }
    
    /**
     * Optimize resource allocation based on current load
     */
    async optimizeResources() {
        try {
            const clusterName = process.env.ECS_CLUSTER_NAME;
            const serviceName = process.env.ECS_SERVICE_NAME;
            
            if (!clusterName || !serviceName) {
                console.log('ECS cluster or service name not configured');
                return;
            }
            
            // Get current service status
            const services = await this.ecs.describeServices({
                cluster: clusterName,
                services: [serviceName]
            }).promise();
            
            if (services.services.length === 0) {
                console.log('Service not found');
                return;
            }
            
            const service = services.services[0];
            const currentDesiredCount = service.desiredCount;
            const runningCount = service.runningCount;
            
            // Get recent metrics
            const metrics = await this.getRecentMetrics();
            
            // Calculate optimal task count
            const optimalCount = this.calculateOptimalTaskCount(metrics);
            
            console.log(`Current: ${currentDesiredCount}, Running: ${runningCount}, Optimal: ${optimalCount}`);
            
            // Update service if needed
            if (optimalCount !== currentDesiredCount) {
                await this.ecs.updateService({
                    cluster: clusterName,
                    service: serviceName,
                    desiredCount: optimalCount
                }).promise();
                
                console.log(`Updated service desired count from ${currentDesiredCount} to ${optimalCount}`);
                
                // Send metric to CloudWatch
                await this.cloudwatch.putMetricData({
                    Namespace: 'NLP-Tool-App/CostOptimization',
                    MetricData: [{
                        MetricName: 'TaskCountChange',
                        Value: optimalCount - currentDesiredCount,
                        Unit: 'Count',
                        Timestamp: new Date()
                    }]
                }).promise();
            }
            
        } catch (error) {
            console.error('Error optimizing resources:', error);
        }
    }
    
    /**
     * Get recent performance metrics
     */
    async getRecentMetrics() {
        try {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); // 15 minutes ago
            
            const [cpuMetrics, requestMetrics] = await Promise.all([
                this.cloudwatch.getMetricStatistics({
                    Namespace: 'AWS/ECS',
                    MetricName: 'CPUUtilization',
                    Dimensions: [
                        { Name: 'ServiceName', Value: process.env.ECS_SERVICE_NAME },
                        { Name: 'ClusterName', Value: process.env.ECS_CLUSTER_NAME }
                    ],
                    StartTime: startTime,
                    EndTime: endTime,
                    Period: 300,
                    Statistics: ['Average']
                }).promise(),
                
                this.cloudwatch.getMetricStatistics({
                    Namespace: 'AWS/ApplicationELB',
                    MetricName: 'RequestCount',
                    StartTime: startTime,
                    EndTime: endTime,
                    Period: 300,
                    Statistics: ['Sum']
                }).promise()
            ]);
            
            const avgCPU = cpuMetrics.Datapoints.length > 0 
                ? cpuMetrics.Datapoints.reduce((sum, point) => sum + point.Average, 0) / cpuMetrics.Datapoints.length
                : 0;
                
            const totalRequests = requestMetrics.Datapoints.reduce((sum, point) => sum + point.Sum, 0);
            
            return {
                avgCPU,
                totalRequests,
                requestsPerMinute: totalRequests / 15,
                cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
            };
            
        } catch (error) {
            console.error('Error getting metrics:', error);
            return { avgCPU: 0, totalRequests: 0, requestsPerMinute: 0, cacheHitRate: 0 };
        }
    }
    
    /**
     * Calculate optimal task count based on metrics
     */
    calculateOptimalTaskCount(metrics) {
        const { avgCPU, requestsPerMinute, cacheHitRate } = metrics;
        
        // Base scaling logic
        let optimalCount = 1;
        
        // Scale based on CPU utilization
        if (avgCPU > 70) {
            optimalCount += Math.ceil((avgCPU - 70) / 20);
        } else if (avgCPU < 20 && requestsPerMinute < 1) {
            optimalCount = 0; // Scale to zero if very low usage
        }
        
        // Scale based on request rate
        if (requestsPerMinute > 10) {
            optimalCount += Math.ceil(requestsPerMinute / 20);
        }
        
        // Adjust for cache hit rate (better cache = fewer resources needed)
        if (cacheHitRate > 0.8) {
            optimalCount = Math.max(0, optimalCount - 1);
        }
        
        // Ensure we don't exceed maximum
        return Math.min(optimalCount, 10);
    }
    
    /**
     * Start periodic metrics reporting
     */
    startMetricsReporting() {
        setInterval(async () => {
            try {
                await this.cloudwatch.putMetricData({
                    Namespace: 'NLP-Tool-App/CostOptimization',
                    MetricData: [
                        {
                            MetricName: 'TotalRequests',
                            Value: this.metrics.totalRequests,
                            Unit: 'Count'
                        },
                        {
                            MetricName: 'TotalCost',
                            Value: this.metrics.totalCost,
                            Unit: 'None'
                        },
                        {
                            MetricName: 'CacheHitRate',
                            Value: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
                            Unit: 'Percent'
                        },
                        {
                            MetricName: 'ThrottledRequests',
                            Value: this.metrics.throttledRequests,
                            Unit: 'Count'
                        }
                    ]
                }).promise();
                
                // Reset counters
                this.metrics.totalRequests = 0;
                this.metrics.throttledRequests = 0;
                
            } catch (error) {
                console.error('Error reporting metrics:', error);
            }
        }, 60000); // Report every minute
    }
    
    /**
     * Get cost optimization recommendations
     */
    async getCostOptimizationRecommendations(userId) {
        try {
            const usage = await this.getUserUsage(userId);
            const recommendations = [];
            
            // High cost recommendations
            if (usage.monthlyCost > 50) {
                recommendations.push({
                    type: 'COST_REDUCTION',
                    priority: 'HIGH',
                    message: 'Consider upgrading to a higher tier for better cost efficiency',
                    potentialSavings: usage.monthlyCost * 0.2
                });
            }
            
            // Cache optimization
            if (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) < 0.5) {
                recommendations.push({
                    type: 'CACHE_OPTIMIZATION',
                    priority: 'MEDIUM',
                    message: 'Enable caching to reduce API costs by up to 60%',
                    potentialSavings: usage.monthlyCost * 0.6
                });
            }
            
            // Batch processing
            if (usage.daily > 20) {
                recommendations.push({
                    type: 'BATCH_PROCESSING',
                    priority: 'MEDIUM',
                    message: 'Use batch processing for multiple requests to reduce costs',
                    potentialSavings: usage.monthlyCost * 0.3
                });
            }
            
            return recommendations;
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }
}

module.exports = CostOptimizer;

/**
 * Test suite for Cost Optimizer
 */

const { 
    getModelConfig, 
    calculateCost, 
    checkLimits, 
    getCacheConfig,
    getThrottleConfig,
    getTierFeatures 
} = require('../src/config/ai-models');

describe('AI Models Configuration', () => {
    
    describe('getModelConfig', () => {
        test('should return correct config for FREE tier', () => {
            const config = getModelConfig('FREE', 'textGeneration');
            
            expect(config).toHaveProperty('modelId', 'amazon.titan-text-lite-v1');
            expect(config).toHaveProperty('maxTokens', 512);
            expect(config).toHaveProperty('costPerToken', 0.0003);
            expect(config).toHaveProperty('tier', 'Free Tier');
        });
        
        test('should return correct config for ENTERPRISE tier', () => {
            const config = getModelConfig('ENTERPRISE', 'textGeneration');
            
            expect(config).toHaveProperty('modelId', 'anthropic.claude-3-opus-20240229-v1:0');
            expect(config).toHaveProperty('maxTokens', 4096);
            expect(config).toHaveProperty('costPerToken', 0.015);
            expect(config).toHaveProperty('tier', 'Enterprise Plan');
        });
        
        test('should throw error for invalid tier', () => {
            expect(() => {
                getModelConfig('INVALID', 'textGeneration');
            }).toThrow('Invalid tier: INVALID');
        });
        
        test('should throw error for invalid use case', () => {
            expect(() => {
                getModelConfig('FREE', 'invalidUseCase');
            }).toThrow('Invalid use case: invalidUseCase for tier: FREE');
        });
    });
    
    describe('calculateCost', () => {
        test('should calculate cost correctly for FREE tier', () => {
            const cost = calculateCost('FREE', 'textGeneration', 1000, 500);
            const expectedCost = 1500 * 0.0003; // (1000 + 500) * 0.0003
            
            expect(cost).toBe(expectedCost);
        });
        
        test('should calculate cost correctly for ENTERPRISE tier', () => {
            const cost = calculateCost('ENTERPRISE', 'textGeneration', 1000, 500);
            const expectedCost = 1500 * 0.015; // (1000 + 500) * 0.015
            
            expect(cost).toBe(expectedCost);
        });
        
        test('should handle zero output tokens', () => {
            const cost = calculateCost('FREE', 'textGeneration', 1000);
            const expectedCost = 1000 * 0.0003;
            
            expect(cost).toBe(expectedCost);
        });
    });
    
    describe('checkLimits', () => {
        test('should return correct limits for FREE tier', () => {
            const limits = checkLimits('FREE', 5, 50);
            
            expect(limits).toEqual({
                dailyLimitExceeded: false,
                monthlyLimitExceeded: false,
                remainingDaily: 5, // 10 - 5
                remainingMonthly: 50 // 100 - 50
            });
        });
        
        test('should detect daily limit exceeded', () => {
            const limits = checkLimits('FREE', 15, 50);
            
            expect(limits.dailyLimitExceeded).toBe(true);
            expect(limits.remainingDaily).toBe(0);
        });
        
        test('should detect monthly limit exceeded', () => {
            const limits = checkLimits('FREE', 5, 150);
            
            expect(limits.monthlyLimitExceeded).toBe(true);
            expect(limits.remainingMonthly).toBe(0);
        });
    });
    
    describe('getCacheConfig', () => {
        test('should return correct cache config for FREE tier', () => {
            const config = getCacheConfig('FREE');
            
            expect(config).toEqual({
                enabled: true,
                ttl: 3600
            });
        });
        
        test('should return correct cache config for ENTERPRISE tier', () => {
            const config = getCacheConfig('ENTERPRISE');
            
            expect(config).toEqual({
                enabled: true,
                ttl: 300
            });
        });
    });
    
    describe('getThrottleConfig', () => {
        test('should return correct throttle config for FREE tier', () => {
            const config = getThrottleConfig('FREE');
            
            expect(config).toEqual({
                requests: 1,
                window: 60000
            });
        });
        
        test('should return correct throttle config for ENTERPRISE tier', () => {
            const config = getThrottleConfig('ENTERPRISE');
            
            expect(config).toEqual({
                requests: 200,
                window: 60000
            });
        });
        
        test('should fallback to FREE tier for invalid tier', () => {
            const config = getThrottleConfig('INVALID');
            
            expect(config).toEqual({
                requests: 1,
                window: 60000
            });
        });
    });
    
    describe('getTierFeatures', () => {
        test('should return correct features for FREE tier', () => {
            const features = getTierFeatures('FREE');
            
            expect(features).toEqual({
                basicSEO: true,
                keywordAnalysis: true,
                contentSuggestions: false,
                advancedAnalytics: false,
                realTimeOptimization: false,
                customPrompts: false
            });
        });
        
        test('should return correct features for ENTERPRISE tier', () => {
            const features = getTierFeatures('ENTERPRISE');
            
            expect(features).toEqual({
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
            });
        });
        
        test('should fallback to FREE tier for invalid tier', () => {
            const features = getTierFeatures('INVALID');
            
            expect(features).toEqual({
                basicSEO: true,
                keywordAnalysis: true,
                contentSuggestions: false,
                advancedAnalytics: false,
                realTimeOptimization: false,
                customPrompts: false
            });
        });
    });
});

describe('Cost Optimization Logic', () => {
    
    describe('Tier Progression', () => {
        test('should have increasing costs from FREE to ENTERPRISE', () => {
            const freeCost = calculateCost('FREE', 'textGeneration', 1000, 500);
            const basicCost = calculateCost('BASIC', 'textGeneration', 1000, 500);
            const proCost = calculateCost('PRO', 'textGeneration', 1000, 500);
            const enterpriseCost = calculateCost('ENTERPRISE', 'textGeneration', 1000, 500);
            
            expect(freeCost).toBeLessThan(basicCost);
            expect(basicCost).toBeLessThan(proCost);
            expect(proCost).toBeLessThan(enterpriseCost);
        });
        
        test('should have increasing limits from FREE to ENTERPRISE', () => {
            const freeLimits = checkLimits('FREE', 0, 0);
            const basicLimits = checkLimits('BASIC', 0, 0);
            const proLimits = checkLimits('PRO', 0, 0);
            const enterpriseLimits = checkLimits('ENTERPRISE', 0, 0);
            
            expect(freeLimits.remainingDaily).toBeLessThan(basicLimits.remainingDaily);
            expect(basicLimits.remainingDaily).toBeLessThan(proLimits.remainingDaily);
            expect(proLimits.remainingDaily).toBeLessThan(enterpriseLimits.remainingDaily);
        });
        
        test('should have decreasing cache TTL from FREE to ENTERPRISE', () => {
            const freeTTL = getCacheConfig('FREE').ttl;
            const basicTTL = getCacheConfig('BASIC').ttl;
            const proTTL = getCacheConfig('PRO').ttl;
            const enterpriseTTL = getCacheConfig('ENTERPRISE').ttl;
            
            expect(freeTTL).toBeGreaterThan(basicTTL);
            expect(basicTTL).toBeGreaterThan(proTTL);
            expect(proTTL).toBeGreaterThan(enterpriseTTL);
        });
    });
    
    describe('Feature Availability', () => {
        test('FREE tier should have limited features', () => {
            const features = getTierFeatures('FREE');
            const enabledFeatures = Object.values(features).filter(Boolean).length;
            
            expect(enabledFeatures).toBe(2); // Only basicSEO and keywordAnalysis
        });
        
        test('ENTERPRISE tier should have all features', () => {
            const features = getTierFeatures('ENTERPRISE');
            const enabledFeatures = Object.values(features).filter(Boolean).length;
            const totalFeatures = Object.keys(features).length;
            
            expect(enabledFeatures).toBe(totalFeatures);
        });
    });
});

describe('Edge Cases', () => {
    
    test('should handle case-insensitive tier names', () => {
        const lowerConfig = getModelConfig('free', 'textGeneration');
        const upperConfig = getModelConfig('FREE', 'textGeneration');
        
        expect(lowerConfig).toEqual(upperConfig);
    });
    
    test('should handle zero token calculations', () => {
        const cost = calculateCost('FREE', 'textGeneration', 0, 0);
        
        expect(cost).toBe(0);
    });
    
    test('should handle large token counts', () => {
        const cost = calculateCost('ENTERPRISE', 'textGeneration', 1000000, 500000);
        
        expect(cost).toBe(1500000 * 0.015);
        expect(cost).toBeGreaterThan(0);
    });
});

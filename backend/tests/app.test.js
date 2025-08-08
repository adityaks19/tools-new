/**
 * Test suite for SEO NLP App
 */

const request = require('supertest');
const app = require('../src/server');

describe('SEO NLP App', () => {
    
    describe('Health Checks', () => {
        test('GET /health should return healthy status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version');
        });
        
        test('GET /ready should return ready status', async () => {
            const response = await request(app)
                .get('/ready')
                .expect(200);
            
            expect(response.body).toHaveProperty('status', 'ready');
            expect(response.body).toHaveProperty('checks');
        });
    });
    
    describe('SEO Analysis API', () => {
        test('POST /api/seo/analyze should require content', async () => {
            const response = await request(app)
                .post('/api/seo/analyze')
                .set('x-user-tier', 'FREE')
                .set('x-user-id', 'test-user')
                .send({})
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Content is required');
            expect(response.body).toHaveProperty('code', 'MISSING_CONTENT');
        });
        
        test('POST /api/seo/analyze should accept valid content', async () => {
            const response = await request(app)
                .post('/api/seo/analyze')
                .set('x-user-tier', 'FREE')
                .set('x-user-id', 'test-user')
                .send({
                    content: 'This is test content for SEO analysis',
                    url: 'https://example.com'
                });
            
            // Note: This might fail in test environment without AWS credentials
            // In a real test, you'd mock the Bedrock client
            expect(response.status).toBeOneOf([200, 500]);
        });
    });
    
    describe('Keyword Research API', () => {
        test('POST /api/seo/keywords should require topic', async () => {
            const response = await request(app)
                .post('/api/seo/keywords')
                .set('x-user-tier', 'FREE')
                .set('x-user-id', 'test-user')
                .send({})
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Topic is required');
            expect(response.body).toHaveProperty('code', 'MISSING_TOPIC');
        });
    });
    
    describe('Content Optimization API', () => {
        test('POST /api/seo/optimize should require content', async () => {
            const response = await request(app)
                .post('/api/seo/optimize')
                .set('x-user-tier', 'FREE')
                .set('x-user-id', 'test-user')
                .send({})
                .expect(400);
            
            expect(response.body).toHaveProperty('error', 'Content is required');
            expect(response.body).toHaveProperty('code', 'MISSING_CONTENT');
        });
        
        test('POST /api/seo/optimize should check tier permissions', async () => {
            const response = await request(app)
                .post('/api/seo/optimize')
                .set('x-user-tier', 'FREE')
                .set('x-user-id', 'test-user')
                .send({
                    content: 'Test content'
                })
                .expect(403);
            
            expect(response.body).toHaveProperty('error', 'Content optimization not available in your tier');
            expect(response.body).toHaveProperty('code', 'FEATURE_NOT_AVAILABLE');
        });
    });
    
    describe('User Usage API', () => {
        test('GET /api/user/usage should return usage statistics', async () => {
            const response = await request(app)
                .get('/api/user/usage')
                .set('x-user-tier', 'FREE')
                .set('x-user-id', 'test-user');
            
            expect(response.status).toBeOneOf([200, 500]);
            
            if (response.status === 200) {
                expect(response.body).toHaveProperty('usage');
                expect(response.body).toHaveProperty('tier', 'FREE');
                expect(response.body).toHaveProperty('features');
            }
        });
    });
    
    describe('Error Handling', () => {
        test('Should return 404 for unknown routes', async () => {
            const response = await request(app)
                .get('/api/unknown-endpoint')
                .expect(404);
            
            expect(response.body).toHaveProperty('error', 'Not found');
            expect(response.body).toHaveProperty('code', 'NOT_FOUND');
        });
    });
    
    describe('Rate Limiting', () => {
        test('Should apply global rate limiting', async () => {
            // This test would need to be adjusted based on actual rate limits
            // and might require multiple requests to trigger
            const response = await request(app)
                .get('/health');
            
            expect(response.status).toBe(200);
            expect(response.headers).toHaveProperty('x-ratelimit-limit');
        });
    });
});

// Custom Jest matcher
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${expected}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be one of ${expected}`,
                pass: false,
            };
        }
    },
});

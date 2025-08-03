// Mock AWS services for local development
const mockUsers = new Map();
const mockSubscriptions = new Map();
const mockUsage = new Map();
const mockFiles = new Map();

// Mock Bedrock service
class MockBedrockService {
  async invokeModel(prompt, modelId = process.env.BEDROCK_MODEL_ID) {
    console.log('🤖 Mock Bedrock invocation:', { prompt: prompt.substring(0, 100) + '...', modelId });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock response based on prompt content
    if (prompt.toLowerCase().includes('seo')) {
      return `# SEO Optimized Content

This is a mock response from the AI model. In a real implementation, this would be processed by AWS Bedrock using Claude 3.

## Key Improvements Made:
- Enhanced keyword density for better search visibility
- Improved heading structure with H1, H2, H3 tags
- Added meta description suggestions
- Optimized content flow and readability

## Original Content Analysis:
The content has been analyzed and optimized for search engines while maintaining readability and user engagement.

## SEO Recommendations:
1. Include target keywords in the first paragraph
2. Use semantic HTML structure
3. Add internal and external links
4. Optimize images with alt text
5. Ensure mobile responsiveness

This mock response demonstrates how the AI would transform your content for better SEO performance.`;
    }
    
    return `# AI-Processed Content

This is a mock response from the AI model. Your content has been processed and optimized according to your instructions.

## Key Features:
- Professional formatting
- Improved readability
- SEO optimization
- Engaging structure

The actual implementation would use AWS Bedrock with Claude 3 to provide sophisticated content transformation based on your specific prompts and requirements.`;
  }

  async processFileContent(content, userPrompt, fileType) {
    console.log('📄 Mock file processing:', { fileType, promptLength: userPrompt.length });
    
    const systemPrompt = `Mock processing for ${fileType} file with user prompt: ${userPrompt}`;
    return await this.invokeModel(systemPrompt);
  }
}

// Mock S3 service
class MockS3Service {
  async uploadFile(key, body, contentType) {
    console.log('📁 Mock S3 upload:', { key, contentType, size: body.length });
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUrl = `https://mock-bucket.s3.us-east-1.amazonaws.com/${key}`;
    console.log('✅ Mock S3 upload complete:', mockUrl);
    
    return mockUrl;
  }

  async getFile(key) {
    console.log('📥 Mock S3 get:', { key });
    
    // Return mock file content
    return Buffer.from('Mock file content');
  }

  async deleteFile(key) {
    console.log('🗑️ Mock S3 delete:', { key });
    
    // Simulate delete
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Mock DynamoDB service
class MockDynamoDBService {
  async putItem(tableName, item) {
    console.log('💾 Mock DynamoDB put:', { tableName, itemKeys: Object.keys(item) });
    
    const storage = this.getStorage(tableName);
    const key = this.getItemKey(tableName, item);
    storage.set(key, { ...item, createdAt: new Date().toISOString() });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async getItem(tableName, key) {
    console.log('🔍 Mock DynamoDB get:', { tableName, key });
    
    const storage = this.getStorage(tableName);
    const itemKey = this.getItemKey(tableName, key);
    const item = storage.get(itemKey);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return item || null;
  }

  async updateItem(tableName, key, updateExpression, expressionAttributeValues) {
    console.log('✏️ Mock DynamoDB update:', { tableName, key, updateExpression });
    
    const storage = this.getStorage(tableName);
    const itemKey = this.getItemKey(tableName, key);
    let item = storage.get(itemKey) || {};
    
    // Handle usage counting specifically
    if (tableName.includes('usage') && updateExpression.includes('if_not_exists')) {
      // Initialize count if it doesn't exist, then increment
      if (!item.count) {
        item.count = 0;
      }
      item.count += 1;
      item.updatedAt = new Date().toISOString();
      
      // Set TTL for 24 hours from now
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      item.ttl = Math.floor(tomorrow.getTime() / 1000);
      
      if (!item.createdAt) {
        item.createdAt = new Date().toISOString();
      }
    } else {
      // Simple mock update logic for other cases
      if (updateExpression.includes('SET')) {
        Object.keys(expressionAttributeValues).forEach(attrKey => {
          const fieldName = attrKey.replace(':', '').replace('#', '');
          item[fieldName] = expressionAttributeValues[attrKey];
        });
      }
      item.updatedAt = new Date().toISOString();
    }
    
    storage.set(itemKey, item);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return item;
  }

  async queryItems(tableName, keyConditionExpression, expressionAttributeValues) {
    console.log('🔎 Mock DynamoDB query:', { tableName, keyConditionExpression });
    
    const storage = this.getStorage(tableName);
    const items = Array.from(storage.values());
    
    // Simple mock query logic
    const userId = expressionAttributeValues[':userId'];
    const filteredItems = items.filter(item => item.userId === userId);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return filteredItems;
  }

  async deleteItem(tableName, key) {
    console.log('🗑️ Mock DynamoDB delete:', { tableName, key });
    
    const storage = this.getStorage(tableName);
    const itemKey = this.getItemKey(tableName, key);
    storage.delete(itemKey);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getStorage(tableName) {
    // Handle undefined or null table names
    if (!tableName) {
      return mockUsers; // Default to users for auth operations
    }
    
    switch (tableName) {
      case process.env.DYNAMODB_TABLE_USERS:
      case 'seo-nlp-users-dev':
      case 'seo-nlp-users-local':
        return mockUsers;
      case process.env.DYNAMODB_TABLE_SUBSCRIPTIONS:
      case 'seo-nlp-subscriptions-dev':
      case 'seo-nlp-subscriptions-local':
        return mockSubscriptions;
      case process.env.DYNAMODB_TABLE_USAGE:
      case 'seo-nlp-usage-dev':
      case 'seo-nlp-usage-local':
        return mockUsage;
      case 'seo-nlp-files':
        return mockFiles;
      default:
        // Try to determine storage type from table name
        if (tableName.includes('users')) return mockUsers;
        if (tableName.includes('subscriptions')) return mockSubscriptions;
        if (tableName.includes('usage')) return mockUsage;
        if (tableName.includes('files')) return mockFiles;
        return mockUsers; // Default fallback
    }
  }

  getItemKey(tableName, item) {
    // Handle undefined tableName gracefully
    const table = tableName || 'default';
    
    if (table.includes('users')) {
      return item.userId || item.email;
    }
    if (table.includes('files')) {
      return item.fileId;
    }
    if (table.includes('subscriptions')) {
      return item.userId;
    }
    if (table.includes('usage')) {
      return `${item.userId}#${item.date}`;
    }
    return JSON.stringify(item);
  }
}

// Initialize mock data
const initializeMockData = () => {
  // Add a demo user
  const demoUserData = {
    userId: 'demo-user-123',
    email: 'demo@example.com',
    name: 'Demo User',
    password: '$2a$12$OFna0TWjX2W3NdqR89PcSereVo2YWUkmHwMf5zPr3.qqBwap57EEu', // demo123
    subscriptionTier: 'free',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  mockUsers.set('demo@example.com', demoUserData);
  mockUsers.set('demo-user-123', demoUserData);

  console.log('🎭 Mock data initialized with demo user: demo@example.com / demo123');
};

// Initialize mock data on module load
initializeMockData();

module.exports = {
  BedrockService: new MockBedrockService(),
  S3Service: new MockS3Service(),
  DynamoDBService: new MockDynamoDBService()
};

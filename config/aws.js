const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Initialize AWS clients
const bedrockClient = new BedrockRuntimeClient(awsConfig);
const s3Client = new S3Client(awsConfig);
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Bedrock service
class BedrockService {
  async invokeModel(prompt, modelId = process.env.BEDROCK_MODEL_ID) {
    try {
      const input = {
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      };

      const command = new InvokeModelCommand(input);
      const response = await bedrockClient.send(command);
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text;
    } catch (error) {
      console.error('Bedrock invocation error:', error);
      throw new Error('Failed to process with AI model');
    }
  }

  async processFileContent(content, userPrompt, fileType) {
    const systemPrompt = `You are an SEO-focused content processor. Your task is to transform the provided content according to the user's instructions while maintaining SEO best practices.

Guidelines:
- Optimize for search engines with relevant keywords
- Maintain readability and user engagement
- Use proper heading structure (H1, H2, H3)
- Include meta descriptions when appropriate
- Ensure content flows naturally
- Preserve important information while improving structure

File Type: ${fileType}
User Instructions: ${userPrompt}

Content to process:
${content}

Please provide the optimized content:`;

    return await this.invokeModel(systemPrompt);
  }
}

// S3 service
class S3Service {
  async uploadFile(key, body, contentType) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256'
      });

      await s3Client.send(command);
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getFile(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
      });

      const response = await s3Client.send(command);
      return response.Body;
    } catch (error) {
      console.error('S3 get error:', error);
      throw new Error('Failed to retrieve file');
    }
  }

  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file');
    }
  }
}

// DynamoDB service
class DynamoDBService {
  async putItem(tableName, item) {
    try {
      const command = new PutCommand({
        TableName: tableName,
        Item: item
      });

      await docClient.send(command);
    } catch (error) {
      console.error('DynamoDB put error:', error);
      throw new Error('Failed to save data');
    }
  }

  async getItem(tableName, key) {
    try {
      const command = new GetCommand({
        TableName: tableName,
        Key: key
      });

      const response = await docClient.send(command);
      return response.Item;
    } catch (error) {
      console.error('DynamoDB get error:', error);
      throw new Error('Failed to retrieve data');
    }
  }

  async updateItem(tableName, key, updateExpression, expressionAttributeValues) {
    try {
      const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
      });

      const response = await docClient.send(command);
      return response.Attributes;
    } catch (error) {
      console.error('DynamoDB update error:', error);
      throw new Error('Failed to update data');
    }
  }

  async queryItems(tableName, keyConditionExpression, expressionAttributeValues) {
    try {
      const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues
      });

      const response = await docClient.send(command);
      return response.Items;
    } catch (error) {
      console.error('DynamoDB query error:', error);
      throw new Error('Failed to query data');
    }
  }
}

// Use mock services in development
if (process.env.NODE_ENV === 'development') {
  console.log('🎭 Using mock AWS services for development');
  module.exports = require('./aws-mock');
} else {
  module.exports = {
    BedrockService: new BedrockService(),
    S3Service: new S3Service(),
    DynamoDBService: new DynamoDBService()
  };
}

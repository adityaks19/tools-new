const { dynamodb, USERS_TABLE, FILES_TABLE, SESSIONS_TABLE } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

class DynamoService {
  // User operations
  async createUser(userData) {
    const user = {
      id: uuidv4(),
      email: userData.email,
      name: userData.name,
      subscriptionTier: userData.subscriptionTier || 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dailyUsage: 0,
      totalConversions: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      isActive: true,
      ...userData
    };

    const params = {
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(email)'
    };

    try {
      await dynamodb.put(params).promise();
      return { success: true, user };
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('User with this email already exists');
      }
      console.error('DynamoDB create user error:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserByEmail(email) {
    const params = {
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    try {
      const result = await dynamodb.query(params).promise();
      return result.Items.length > 0 ? { success: true, user: result.Items[0] } : { success: false };
    } catch (error) {
      console.error('DynamoDB get user by email error:', error);
      throw new Error('Failed to get user by email');
    }
  }

  async getUserById(userId) {
    const params = {
      TableName: USERS_TABLE,
      Key: { id: userId }
    };

    try {
      const result = await dynamodb.get(params).promise();
      return result.Item ? { success: true, user: result.Item } : { success: false };
    } catch (error) {
      console.error('DynamoDB get user by ID error:', error);
      throw new Error('Failed to get user by ID');
    }
  }

  async updateUser(userId, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach(key => {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updates[key];
    });

    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    updateExpression.push('#updatedAt = :updatedAt');

    const params = {
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamodb.update(params).promise();
      return { success: true, user: result.Attributes };
    } catch (error) {
      console.error('DynamoDB update user error:', error);
      throw new Error('Failed to update user');
    }
  }

  async incrementUserUsage(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const params = {
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET dailyUsage = if_not_exists(dailyUsage, :zero) + :inc, totalConversions = if_not_exists(totalConversions, :zero) + :inc, lastResetDate = if_not_exists(lastResetDate, :today), updatedAt = :now',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
        ':today': today,
        ':now': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamodb.update(params).promise();
      
      // Reset daily usage if it's a new day
      if (result.Attributes.lastResetDate !== today) {
        await this.resetDailyUsage(userId, today);
        return await this.getUserById(userId);
      }
      
      return { success: true, user: result.Attributes };
    } catch (error) {
      console.error('DynamoDB increment usage error:', error);
      throw new Error('Failed to increment user usage');
    }
  }

  async resetDailyUsage(userId, date) {
    const params = {
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET dailyUsage = :zero, lastResetDate = :date, updatedAt = :now',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':date': date,
        ':now': new Date().toISOString()
      }
    };

    try {
      await dynamodb.update(params).promise();
      return { success: true };
    } catch (error) {
      console.error('DynamoDB reset daily usage error:', error);
      throw new Error('Failed to reset daily usage');
    }
  }

  // File operations
  async createFile(fileData) {
    const file = {
      id: uuidv4(),
      userId: fileData.userId,
      originalName: fileData.originalName,
      s3Key: fileData.s3Key,
      s3Bucket: fileData.s3Bucket,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      status: fileData.status || 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...fileData
    };

    const params = {
      TableName: FILES_TABLE,
      Item: file
    };

    try {
      await dynamodb.put(params).promise();
      return { success: true, file };
    } catch (error) {
      console.error('DynamoDB create file error:', error);
      throw new Error('Failed to create file record');
    }
  }

  async getFileById(fileId) {
    const params = {
      TableName: FILES_TABLE,
      Key: { id: fileId }
    };

    try {
      const result = await dynamodb.get(params).promise();
      return result.Item ? { success: true, file: result.Item } : { success: false };
    } catch (error) {
      console.error('DynamoDB get file error:', error);
      throw new Error('Failed to get file');
    }
  }

  async getUserFiles(userId, limit = 50) {
    const params = {
      TableName: FILES_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by creation date descending
      Limit: limit
    };

    try {
      const result = await dynamodb.query(params).promise();
      return { success: true, files: result.Items };
    } catch (error) {
      console.error('DynamoDB get user files error:', error);
      throw new Error('Failed to get user files');
    }
  }

  async updateFile(fileId, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach(key => {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updates[key];
    });

    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    updateExpression.push('#updatedAt = :updatedAt');

    const params = {
      TableName: FILES_TABLE,
      Key: { id: fileId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    try {
      const result = await dynamodb.update(params).promise();
      return { success: true, file: result.Attributes };
    } catch (error) {
      console.error('DynamoDB update file error:', error);
      throw new Error('Failed to update file');
    }
  }

  async deleteFile(fileId) {
    const params = {
      TableName: FILES_TABLE,
      Key: { id: fileId }
    };

    try {
      await dynamodb.delete(params).promise();
      return { success: true };
    } catch (error) {
      console.error('DynamoDB delete file error:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Session operations
  async createSession(sessionData) {
    const session = {
      id: uuidv4(),
      userId: sessionData.userId,
      token: sessionData.token,
      expiresAt: sessionData.expiresAt,
      createdAt: new Date().toISOString(),
      isActive: true,
      ...sessionData
    };

    const params = {
      TableName: SESSIONS_TABLE,
      Item: session
    };

    try {
      await dynamodb.put(params).promise();
      return { success: true, session };
    } catch (error) {
      console.error('DynamoDB create session error:', error);
      throw new Error('Failed to create session');
    }
  }

  async getSessionByToken(token) {
    const params = {
      TableName: SESSIONS_TABLE,
      IndexName: 'TokenIndex',
      KeyConditionExpression: 'token = :token',
      ExpressionAttributeValues: {
        ':token': token
      }
    };

    try {
      const result = await dynamodb.query(params).promise();
      return result.Items.length > 0 ? { success: true, session: result.Items[0] } : { success: false };
    } catch (error) {
      console.error('DynamoDB get session error:', error);
      throw new Error('Failed to get session');
    }
  }

  async deleteSession(sessionId) {
    const params = {
      TableName: SESSIONS_TABLE,
      Key: { id: sessionId }
    };

    try {
      await dynamodb.delete(params).promise();
      return { success: true };
    } catch (error) {
      console.error('DynamoDB delete session error:', error);
      throw new Error('Failed to delete session');
    }
  }

  async deleteUserSessions(userId) {
    // First, get all sessions for the user
    const params = {
      TableName: SESSIONS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    try {
      const result = await dynamodb.query(params).promise();
      
      // Delete each session
      const deletePromises = result.Items.map(session => 
        this.deleteSession(session.id)
      );
      
      await Promise.all(deletePromises);
      return { success: true };
    } catch (error) {
      console.error('DynamoDB delete user sessions error:', error);
      throw new Error('Failed to delete user sessions');
    }
  }

  // Batch operations
  async batchGetItems(tableName, keys) {
    const params = {
      RequestItems: {
        [tableName]: {
          Keys: keys
        }
      }
    };

    try {
      const result = await dynamodb.batchGet(params).promise();
      return { success: true, items: result.Responses[tableName] };
    } catch (error) {
      console.error('DynamoDB batch get error:', error);
      throw new Error('Failed to batch get items');
    }
  }

  async batchWriteItems(tableName, items, operation = 'PutRequest') {
    const requests = items.map(item => ({
      [operation]: operation === 'PutRequest' ? { Item: item } : { Key: item }
    }));

    const params = {
      RequestItems: {
        [tableName]: requests
      }
    };

    try {
      await dynamodb.batchWrite(params).promise();
      return { success: true };
    } catch (error) {
      console.error('DynamoDB batch write error:', error);
      throw new Error('Failed to batch write items');
    }
  }
}

module.exports = new DynamoService();

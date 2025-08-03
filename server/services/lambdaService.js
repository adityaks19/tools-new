const { lambda, FILE_PROCESSOR_FUNCTION, NLP_PROCESSOR_FUNCTION } = require('../config/aws');

class LambdaService {
  // Invoke file processor Lambda function
  async processFile(fileData, prompt) {
    const payload = {
      fileData: {
        s3Bucket: fileData.s3Bucket,
        s3Key: fileData.s3Key,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        userId: fileData.userId,
        fileId: fileData.id
      },
      prompt: prompt,
      timestamp: new Date().toISOString()
    };

    const params = {
      FunctionName: FILE_PROCESSOR_FUNCTION,
      InvocationType: 'RequestResponse', // Synchronous invocation
      Payload: JSON.stringify(payload)
    };

    try {
      const result = await lambda.invoke(params).promise();
      
      if (result.FunctionError) {
        throw new Error(`Lambda function error: ${result.FunctionError}`);
      }

      const response = JSON.parse(result.Payload);
      return {
        success: true,
        result: response
      };
    } catch (error) {
      console.error('Lambda file processing error:', error);
      throw new Error('Failed to process file with Lambda');
    }
  }

  // Invoke NLP processor Lambda function
  async processNLP(text, prompt, options = {}) {
    const payload = {
      text: text,
      prompt: prompt,
      options: {
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        model: options.model || 'claude-3-sonnet',
        ...options
      },
      timestamp: new Date().toISOString()
    };

    const params = {
      FunctionName: NLP_PROCESSOR_FUNCTION,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    };

    try {
      const result = await lambda.invoke(params).promise();
      
      if (result.FunctionError) {
        throw new Error(`Lambda function error: ${result.FunctionError}`);
      }

      const response = JSON.parse(result.Payload);
      return {
        success: true,
        result: response
      };
    } catch (error) {
      console.error('Lambda NLP processing error:', error);
      throw new Error('Failed to process NLP with Lambda');
    }
  }

  // Invoke Lambda function asynchronously
  async invokeAsync(functionName, payload) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'Event', // Asynchronous invocation
      Payload: JSON.stringify(payload)
    };

    try {
      const result = await lambda.invoke(params).promise();
      return {
        success: true,
        statusCode: result.StatusCode
      };
    } catch (error) {
      console.error('Lambda async invocation error:', error);
      throw new Error('Failed to invoke Lambda function asynchronously');
    }
  }

  // Get Lambda function configuration
  async getFunctionConfiguration(functionName) {
    const params = {
      FunctionName: functionName
    };

    try {
      const result = await lambda.getFunctionConfiguration(params).promise();
      return {
        success: true,
        configuration: result
      };
    } catch (error) {
      console.error('Lambda get configuration error:', error);
      throw new Error('Failed to get Lambda function configuration');
    }
  }

  // List Lambda functions
  async listFunctions() {
    try {
      const result = await lambda.listFunctions().promise();
      return {
        success: true,
        functions: result.Functions
      };
    } catch (error) {
      console.error('Lambda list functions error:', error);
      throw new Error('Failed to list Lambda functions');
    }
  }

  // Invoke Lambda with retry logic
  async invokeWithRetry(functionName, payload, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const params = {
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(payload)
        };

        const result = await lambda.invoke(params).promise();
        
        if (result.FunctionError) {
          throw new Error(`Lambda function error: ${result.FunctionError}`);
        }

        const response = JSON.parse(result.Payload);
        return {
          success: true,
          result: response,
          attempt: attempt
        };
      } catch (error) {
        lastError = error;
        console.warn(`Lambda invocation attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Lambda invocation failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  // Process multiple files in batch
  async processBatch(files, prompt, options = {}) {
    const batchSize = options.batchSize || 5;
    const results = [];
    
    // Process files in batches to avoid overwhelming Lambda
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchPromises = batch.map(file => 
        this.processFile(file, prompt).catch(error => ({
          success: false,
          error: error.message,
          fileId: file.id
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return {
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    };
  }

  // Create Lambda function (for deployment)
  async createFunction(functionConfig) {
    const params = {
      FunctionName: functionConfig.name,
      Runtime: functionConfig.runtime || 'python3.9',
      Role: functionConfig.roleArn,
      Handler: functionConfig.handler,
      Code: {
        ZipFile: functionConfig.zipFile || Buffer.from(''),
        S3Bucket: functionConfig.s3Bucket,
        S3Key: functionConfig.s3Key
      },
      Description: functionConfig.description,
      Timeout: functionConfig.timeout || 300,
      MemorySize: functionConfig.memorySize || 512,
      Environment: {
        Variables: functionConfig.environmentVariables || {}
      },
      Tags: functionConfig.tags || {}
    };

    try {
      const result = await lambda.createFunction(params).promise();
      return {
        success: true,
        function: result
      };
    } catch (error) {
      console.error('Lambda create function error:', error);
      throw new Error('Failed to create Lambda function');
    }
  }

  // Update Lambda function code
  async updateFunctionCode(functionName, codeConfig) {
    const params = {
      FunctionName: functionName,
      ZipFile: codeConfig.zipFile,
      S3Bucket: codeConfig.s3Bucket,
      S3Key: codeConfig.s3Key
    };

    try {
      const result = await lambda.updateFunctionCode(params).promise();
      return {
        success: true,
        function: result
      };
    } catch (error) {
      console.error('Lambda update function code error:', error);
      throw new Error('Failed to update Lambda function code');
    }
  }

  // Delete Lambda function
  async deleteFunction(functionName) {
    const params = {
      FunctionName: functionName
    };

    try {
      await lambda.deleteFunction(params).promise();
      return { success: true };
    } catch (error) {
      console.error('Lambda delete function error:', error);
      throw new Error('Failed to delete Lambda function');
    }
  }
}

module.exports = new LambdaService();

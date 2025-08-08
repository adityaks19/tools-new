const { bedrock } = require('../config/aws');

class BedrockService {
  // Main processText method - entry point for text processing
  async processText(text, prompt, options = {}) {
    try {
      // Use the best model selection by default
      const result = await this.processWithBestModel(text, prompt, options);
      return result.content;
    } catch (error) {
      console.error('BedrockService processText error:', error);
      // Fallback to simple text processing if AI fails
      return `Processed content based on prompt: "${prompt}"\n\nOriginal text:\n${text}\n\n[Note: AI processing temporarily unavailable]`;
    }
  }

  // Process text with Claude 3
  async processWithClaude(text, prompt, options = {}) {
    const modelId = options.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0';
    
    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nContent to transform:\n${text}`
        }
      ]
    };

    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    };

    try {
      const result = await bedrock.invokeModel(params).promise();
      const response = JSON.parse(result.body.toString());
      
      return {
        success: true,
        content: response.content[0].text,
        usage: response.usage,
        model: modelId
      };
    } catch (error) {
      console.error('Bedrock Claude processing error:', error);
      throw new Error('Failed to process text with Claude');
    }
  }

  // Process text with Titan
  async processWithTitan(text, prompt, options = {}) {
    const modelId = options.modelId || 'amazon.titan-text-express-v1';
    
    const body = {
      inputText: `${prompt}\n\nContent to transform:\n${text}`,
      textGenerationConfig: {
        maxTokenCount: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.9,
        stopSequences: options.stopSequences || []
      }
    };

    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    };

    try {
      const result = await bedrock.invokeModel(params).promise();
      const response = JSON.parse(result.body.toString());
      
      return {
        success: true,
        content: response.results[0].outputText,
        usage: response.inputTextTokenCount + response.results[0].tokenCount,
        model: modelId
      };
    } catch (error) {
      console.error('Bedrock Titan processing error:', error);
      throw new Error('Failed to process text with Titan');
    }
  }

  // Process text with Cohere Command
  async processWithCohere(text, prompt, options = {}) {
    const modelId = options.modelId || 'cohere.command-text-v14';
    
    const body = {
      prompt: `${prompt}\n\nContent to transform:\n${text}`,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      p: options.topP || 0.9,
      k: options.topK || 0,
      stop_sequences: options.stopSequences || [],
      return_likelihoods: 'NONE'
    };

    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    };

    try {
      const result = await bedrock.invokeModel(params).promise();
      const response = JSON.parse(result.body.toString());
      
      return {
        success: true,
        content: response.generations[0].text,
        usage: response.meta.billed_units,
        model: modelId
      };
    } catch (error) {
      console.error('Bedrock Cohere processing error:', error);
      throw new Error('Failed to process text with Cohere');
    }
  }

  // Process text with AI21 Jurassic
  async processWithAI21(text, prompt, options = {}) {
    const modelId = options.modelId || 'ai21.j2-ultra-v1';
    
    const body = {
      prompt: `${prompt}\n\nContent to transform:\n${text}`,
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.9,
      stopSequences: options.stopSequences || [],
      countPenalty: {
        scale: 0
      },
      presencePenalty: {
        scale: 0
      },
      frequencyPenalty: {
        scale: 0
      }
    };

    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    };

    try {
      const result = await bedrock.invokeModel(params).promise();
      const response = JSON.parse(result.body.toString());
      
      return {
        success: true,
        content: response.completions[0].data.text,
        usage: response.completions[0].finishReason,
        model: modelId
      };
    } catch (error) {
      console.error('Bedrock AI21 processing error:', error);
      throw new Error('Failed to process text with AI21');
    }
  }

  // Smart model selection based on content type and requirements
  async processWithBestModel(text, prompt, options = {}) {
    const contentLength = text.length;
    const requiresCreativity = prompt.toLowerCase().includes('creative') || prompt.toLowerCase().includes('story');
    const requiresAnalysis = prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('summary');
    
    let selectedModel = 'claude';
    
    // Model selection logic
    if (contentLength > 50000) {
      selectedModel = 'claude'; // Best for long content
    } else if (requiresCreativity) {
      selectedModel = 'cohere'; // Good for creative tasks
    } else if (requiresAnalysis) {
      selectedModel = 'claude'; // Best for analysis
    } else {
      selectedModel = options.preferredModel || 'claude';
    }

    // Process with selected model
    switch (selectedModel) {
      case 'claude':
        return await this.processWithClaude(text, prompt, options);
      case 'titan':
        return await this.processWithTitan(text, prompt, options);
      case 'cohere':
        return await this.processWithCohere(text, prompt, options);
      case 'ai21':
        return await this.processWithAI21(text, prompt, options);
      default:
        return await this.processWithClaude(text, prompt, options);
    }
  }

  // Process with streaming response
  async processWithStreaming(text, prompt, options = {}) {
    const modelId = options.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0';
    
    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nContent to transform:\n${text}`
        }
      ],
      stream: true
    };

    const params = {
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body)
    };

    try {
      const result = await bedrock.invokeModelWithResponseStream(params).promise();
      
      return {
        success: true,
        stream: result.body,
        model: modelId
      };
    } catch (error) {
      console.error('Bedrock streaming error:', error);
      throw new Error('Failed to process with streaming');
    }
  }

  // Batch process multiple texts
  async processBatch(texts, prompt, options = {}) {
    const batchSize = options.batchSize || 3; // Limit concurrent requests
    const results = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchPromises = batch.map((text, index) => 
        this.processWithBestModel(text, prompt, options).catch(error => ({
          success: false,
          error: error.message,
          index: i + index
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

  // Get available models
  async listFoundationModels() {
    try {
      const result = await bedrock.listFoundationModels().promise();
      return {
        success: true,
        models: result.modelSummaries
      };
    } catch (error) {
      console.error('Bedrock list models error:', error);
      throw new Error('Failed to list foundation models');
    }
  }

  // Get model details
  async getFoundationModel(modelId) {
    const params = {
      modelIdentifier: modelId
    };

    try {
      const result = await bedrock.getFoundationModel(params).promise();
      return {
        success: true,
        model: result.modelDetails
      };
    } catch (error) {
      console.error('Bedrock get model error:', error);
      throw new Error('Failed to get model details');
    }
  }

  // Process with retry logic and fallback models
  async processWithFallback(text, prompt, options = {}) {
    const models = options.models || ['claude', 'titan', 'cohere'];
    let lastError;

    for (const model of models) {
      try {
        const modelOptions = { ...options, preferredModel: model };
        return await this.processWithBestModel(text, prompt, modelOptions);
      } catch (error) {
        lastError = error;
        console.warn(`Model ${model} failed, trying next model:`, error.message);
      }
    }

    throw new Error(`All models failed. Last error: ${lastError.message}`);
  }

  // Estimate processing cost
  estimateCost(text, model = 'claude') {
    const tokenCount = Math.ceil(text.length / 4); // Rough token estimation
    
    const pricing = {
      claude: { input: 0.003, output: 0.015 }, // per 1K tokens
      titan: { input: 0.0008, output: 0.0016 },
      cohere: { input: 0.0015, output: 0.002 },
      ai21: { input: 0.0125, output: 0.0125 }
    };

    const modelPricing = pricing[model] || pricing.claude;
    const inputCost = (tokenCount / 1000) * modelPricing.input;
    const outputCost = (tokenCount / 1000) * modelPricing.output; // Assuming similar output length
    
    return {
      estimatedTokens: tokenCount,
      estimatedInputCost: inputCost,
      estimatedOutputCost: outputCost,
      totalEstimatedCost: inputCost + outputCost,
      currency: 'USD'
    };
  }
}

module.exports = new BedrockService();

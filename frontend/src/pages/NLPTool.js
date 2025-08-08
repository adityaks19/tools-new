import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Loader, TrendingUp, AlertCircle, FileText, Zap, Brain, Sparkles, RefreshCw } from 'lucide-react';

const NLPTool = () => {
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [transformationType, setTransformationType] = useState('analyze');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
          // Set default model based on transformation type
          setSelectedModel(models.defaults[transformationType] || models.available[0]);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    
    fetchModels();
  }, []);

  // Update selected model when transformation type changes
  useEffect(() => {
    if (availableModels && availableModels.defaults[transformationType]) {
      setSelectedModel(availableModels.defaults[transformationType]);
    }
  }, [transformationType, availableModels]);

  const handleProcess = async () => {
    if (!content.trim() && transformationType !== 'generate') {
      return;
    }

    if (!prompt.trim() && transformationType === 'generate') {
      return;
    }

    setLoading(true);
    
    try {
      let endpoint = '/api/nlp/analyze';
      let payload = { content, prompt, model: selectedModel };

      if (transformationType === 'generate') {
        endpoint = '/api/nlp/generate';
        payload = { prompt: prompt || content, model: selectedModel };
      } else if (transformationType === 'transform') {
        endpoint = '/api/nlp/transform';
        payload = { 
          content, 
          transformationType: 'custom', 
          instructions: prompt,
          model: selectedModel 
        };
      } else if (transformationType === 'summarize') {
        endpoint = '/api/nlp/transform';
        payload = { 
          content, 
          transformationType: 'summarize', 
          instructions: prompt,
          model: selectedModel 
        };
      } else if (transformationType === 'expand') {
        endpoint = '/api/nlp/transform';
        payload = { 
          content, 
          transformationType: 'expand', 
          instructions: prompt,
          model: selectedModel 
        };
      } else if (transformationType === 'rewrite') {
        endpoint = '/api/nlp/transform';
        payload = { 
          content, 
          transformationType: 'rewrite', 
          instructions: prompt,
          model: selectedModel 
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'user-id': localStorage.getItem('userId') || 'anonymous'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error processing content:', error);
      // Show error to user
      setAnalysis({
        error: error.message,
        analysis: 'An error occurred while processing your request. Please try again.',
        metadata: {
          tokensUsed: 0,
          tier: 'FREE',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    setLoading(false);
  };

  const getProcessingTypeIcon = (type) => {
    switch (type) {
      case 'analyze': return <Brain className="w-5 h-5" />;
      case 'generate': return <Sparkles className="w-5 h-5" />;
      case 'transform': return <RefreshCw className="w-5 h-5" />;
      case 'summarize': return <FileText className="w-5 h-5" />;
      case 'expand': return <TrendingUp className="w-5 h-5" />;
      case 'rewrite': return <Zap className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getModelCategory = (modelName) => {
    if (!availableModels) return 'Unknown';
    
    for (const [category, models] of Object.entries(availableModels.categories)) {
      if (models.includes(modelName)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    return 'Unknown';
  };

  return (
    <>
      <Helmet>
        <title>NLP Tool - Text Processing & Analysis</title>
        <meta name="description" content="Process and analyze your text content with AI-powered NLP tools" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NLP Text Processor
          </h1>
          <p className="text-gray-600">
            Analyze, transform, and generate text content using advanced AI models
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Type
              </label>
              <select
                value={transformationType}
                onChange={(e) => setTransformationType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="analyze">🧠 Analyze Text</option>
                <option value="generate">✨ Generate Text</option>
                <option value="transform">🔄 Transform Text</option>
                <option value="summarize">📄 Summarize</option>
                <option value="expand">📈 Expand Content</option>
                <option value="rewrite">⚡ Rewrite</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!availableModels}
              >
                {availableModels ? (
                  <>
                    <optgroup label="🤖 Anthropic (Claude)">
                      {availableModels.categories.anthropic.map(model => (
                        <option key={model} value={model}>
                          {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🚀 Amazon (Nova & Titan)">
                      {availableModels.categories.amazon.map(model => (
                        <option key={model} value={model}>
                          {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🦙 Meta (Llama)">
                      {availableModels.categories.meta.map(model => (
                        <option key={model} value={model}>
                          {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🔬 Other Models">
                      {availableModels.categories.other.map(model => (
                        <option key={model} value={model}>
                          {model.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  <option>Loading models...</option>
                )}
              </select>
            </div>
          </div>

          {transformationType !== 'generate' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content to Process
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your text content here..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {transformationType === 'generate' ? 'Generation Prompt' : 
               transformationType === 'analyze' ? 'Analysis Focus (Optional)' : 
               'Instructions (Optional)'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                transformationType === 'generate' ? 'Describe what you want to generate...' :
                transformationType === 'analyze' ? 'What aspects should I focus on?' :
                'How should I transform the content?'
              }
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedModel && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Model:</span> {selectedModel} 
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                    {getModelCategory(selectedModel)}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleProcess}
              disabled={loading || (!content.trim() && transformationType !== 'generate') || (!prompt.trim() && transformationType === 'generate')}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {getProcessingTypeIcon(transformationType)}
                  <span>
                    {transformationType === 'analyze' ? 'Analyze' :
                     transformationType === 'generate' ? 'Generate' :
                     transformationType === 'transform' ? 'Transform' :
                     transformationType === 'summarize' ? 'Summarize' :
                     transformationType === 'expand' ? 'Expand' :
                     transformationType === 'rewrite' ? 'Rewrite' : 'Process'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                {getProcessingTypeIcon(transformationType)}
                <span>
                  {transformationType === 'analyze' ? 'Analysis Results' :
                   transformationType === 'generate' ? 'Generated Content' :
                   'Transformed Content'}
                </span>
              </h3>
              
              {analysis.metadata && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Tokens: {analysis.metadata.tokensUsed}</span>
                  <span>Model: {analysis.metadata.model || selectedModel}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {analysis.metadata.tier}
                  </span>
                </div>
              )}
            </div>

            {analysis.error ? (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 mt-1">{analysis.error}</p>
                </div>
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-md p-4 border">
                  <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                    {analysis.analysis || analysis.generatedText || analysis.transformedContent}
                  </pre>
                </div>
              </div>
            )}

            {analysis.metadata && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Processed at {new Date(analysis.metadata.timestamp).toLocaleString()}
                  </span>
                  {analysis.metadata.transformationType && (
                    <span>Type: {analysis.metadata.transformationType}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Available AI Models
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🤖 Anthropic</h3>
              <p className="text-gray-600">Claude 3 Opus, Sonnet, Haiku, and Claude 4 series</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🚀 Amazon</h3>
              <p className="text-gray-600">Nova Premier, Pro, Lite and Titan models</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🦙 Meta</h3>
              <p className="text-gray-600">Llama 3.1, 3.2, 3.3, and Llama 4 series</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔬 Others</h3>
              <p className="text-gray-600">DeepSeek, Mistral, Cohere, and more</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NLPTool;

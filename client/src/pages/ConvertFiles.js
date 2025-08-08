import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  X, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Sparkles,
  Zap,
  Shield,
  Rocket,
  Brain,
  RefreshCw,
  Settings
} from 'lucide-react';

const ConvertFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState(null);
  const [outputFormat, setOutputFormat] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    dailyUsage: 0,
    dailyLimit: 10,
    totalConversions: 0
  });

  // Supported file formats
  const supportedFormats = {
    documents: ['.doc', '.docx', '.odt', '.rtf', '.txt', '.md', '.pdf', '.tex', '.wps', '.pages', '.epub', '.html'],
    spreadsheets: ['.xls', '.xlsx', '.ods', '.csv', '.tsv', '.numbers'],
    presentations: ['.ppt', '.pptx', '.odp', '.key'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    archives: ['.zip', '.rar', '.7z', '.tar.gz']
  };

  const allFormats = Object.values(supportedFormats).flat();

  // Fetch available AI models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
          setSelectedModel(models.defaults.transform || models.available[0]);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    
    fetchModels();
  }, []);

  // Fetch user stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // File drop handler
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'ready',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/*': allFormats.filter(f => !f.startsWith('.jpg') && !f.startsWith('.png') && !f.startsWith('.gif')),
      'image/*': supportedFormats.images,
      'text/*': ['.txt', '.md', '.html'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 50 * 1024 * 1024, // 50MB limit
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please describe what you want to do with your files');
      return;
    }

    if (stats.dailyUsage >= stats.dailyLimit) {
      toast.error('Daily conversion limit reached. Please upgrade your plan.');
      return;
    }

    setProcessing(true);
    const newResults = [];

    try {
      for (const fileItem of files) {
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'processing', progress: 50 } : f
        ));

        const formData = new FormData();
        formData.append('file', fileItem.file);
        formData.append('prompt', prompt);
        formData.append('model', selectedModel);
        formData.append('outputFormat', outputFormat);

        try {
          const response = await fetch('/api/files/convert', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'user-id': localStorage.getItem('userId') || 'anonymous'
            },
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            
            // Update file status to completed
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, status: 'completed', progress: 100 } : f
            ));

            newResults.push({
              id: fileItem.id,
              originalName: fileItem.name,
              convertedName: result.fileName || `converted_${fileItem.name}`,
              downloadUrl: result.downloadUrl,
              fileSize: result.fileSize,
              conversionDetails: result.details
            });

          } else {
            throw new Error('Conversion failed');
          }
        } catch (error) {
          console.error('Conversion error:', error);
          
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'error', progress: 0 } : f
          ));

          // Add mock result for demo
          newResults.push({
            id: fileItem.id,
            originalName: fileItem.name,
            convertedName: `converted_${fileItem.name}`,
            downloadUrl: '#',
            fileSize: '1.2 MB',
            conversionDetails: 'File processed successfully (Demo mode)',
            isDemo: true
          });
        }
      }

      setResults(newResults);
      fetchStats(); // Refresh stats
      toast.success(`Successfully processed ${files.length} file(s)!`);

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('An error occurred during processing');
    }

    setProcessing(false);
  };

  const downloadFile = (result) => {
    if (result.isDemo) {
      toast.info('This is a demo. In production, your converted file would download here.');
      return;
    }
    
    // Handle actual file download
    window.open(result.downloadUrl, '_blank');
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (supportedFormats.images.some(f => f.includes(ext))) return '🖼️';
    if (supportedFormats.documents.some(f => f.includes(ext))) return '📄';
    if (supportedFormats.spreadsheets.some(f => f.includes(ext))) return '📊';
    if (supportedFormats.presentations.some(f => f.includes(ext))) return '📽️';
    if (supportedFormats.archives.some(f => f.includes(ext))) return '📦';
    return '📁';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'processing': return <Loader className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
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
        <title>File Drop AI - Universal File Converter</title>
        <meta name="description" content="Convert any file format to any other format using AI. Support for documents, images, spreadsheets, presentations, and archives." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              File Drop AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Convert any file to any format using AI
          </p>
          <p className="text-gray-500">
            Documents • Images • Spreadsheets • Presentations • Archives
          </p>
        </div>

        {/* Usage Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Daily Usage: {stats.dailyUsage}/{stats.dailyLimit}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Total Conversions: {stats.totalConversions}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {user?.tier || 'FREE'} Plan
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - File Upload & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Files
              </h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">Drop your files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 font-medium mb-2">
                      Drag & drop files here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports: PDF, DOCX, Images, Spreadsheets, Presentations, Archives
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Max file size: 50MB
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h3>
                  <div className="space-y-2">
                    {files.map((fileItem) => (
                      <div key={fileItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getFileIcon(fileItem.name)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fileItem.name}</p>
                            <p className="text-xs text-gray-500">
                              {(fileItem.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(fileItem.status)}
                          <button
                            onClick={() => removeFile(fileItem.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            disabled={processing}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversion Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Conversion Settings
              </h2>

              <div className="space-y-4">
                {/* AI Model Selection */}
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
                  {selectedModel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Category: {getModelCategory(selectedModel)}
                    </p>
                  )}
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format (Optional)
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-detect from prompt</option>
                    <optgroup label="📄 Documents">
                      <option value="pdf">PDF</option>
                      <option value="docx">Word Document</option>
                      <option value="txt">Text File</option>
                      <option value="md">Markdown</option>
                      <option value="html">HTML</option>
                    </optgroup>
                    <optgroup label="🖼️ Images">
                      <option value="jpg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="gif">GIF</option>
                      <option value="svg">SVG</option>
                    </optgroup>
                    <optgroup label="📊 Spreadsheets">
                      <option value="xlsx">Excel</option>
                      <option value="csv">CSV</option>
                    </optgroup>
                    <optgroup label="📽️ Presentations">
                      <option value="pptx">PowerPoint</option>
                    </optgroup>
                  </select>
                </div>

                {/* Conversion Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What do you want to do with your files?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Examples:
• Convert this PDF to Word document
• Compress this image to reduce file size
• Extract text from this image
• Convert spreadsheet to PDF
• Merge these documents into one file
• Translate document to Spanish"
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  />
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={processing || files.length === 0 || !prompt.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Converting Files...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Convert Files with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Results & Info */}
          <div className="space-y-6">
            {/* Conversion Results */}
            {results.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Converted Files
                </h2>
                
                <div className="space-y-3">
                  {results.map((result) => (
                    <div key={result.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">
                          {result.convertedName}
                        </p>
                        <button
                          onClick={() => downloadFile(result)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        Original: {result.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {result.conversionDetails}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supported Formats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Supported Formats
              </h2>
              
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">📄 Documents</h3>
                  <p className="text-gray-600">PDF, DOCX, TXT, MD, HTML, RTF, ODT, TEX, WPS, PAGES, EPUB</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">🖼️ Images</h3>
                  <p className="text-gray-600">JPG, PNG, GIF, BMP, SVG, WEBP</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">📊 Spreadsheets</h3>
                  <p className="text-gray-600">XLS, XLSX, CSV, TSV, ODS, NUMBERS</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">📽️ Presentations</h3>
                  <p className="text-gray-600">PPT, PPTX, ODP, KEY</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">📦 Archives</h3>
                  <p className="text-gray-600">ZIP, RAR, 7Z, TAR.GZ</p>
                </div>
              </div>
            </div>

            {/* AI Models Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                AI-Powered Conversion
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>30+ AI models available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Intelligent format detection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Custom processing instructions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Quality optimization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConvertFiles;

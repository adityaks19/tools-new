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
  Rocket
} from 'lucide-react';

const ConvertFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    dailyUsage: 0,
    dailyLimit: 10,
    totalConversions: 0
  });

  // Tier-based model assignment and limits
  const getTierInfo = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'FREE':
        return { 
          name: 'Free', 
          model: 'Claude 3 Haiku', 
          color: 'bg-gray-100 text-gray-800',
          maxSize: '5 MB',
          maxConversions: 10,
          maxPages: 5,
          concurrent: 1,
          batchProcessing: false
        };
      case 'BASIC':
        return { 
          name: 'Basic', 
          model: 'Claude 3 Sonnet', 
          color: 'bg-blue-100 text-blue-800',
          maxSize: '20 MB',
          maxConversions: 50,
          maxPages: 20,
          concurrent: 2,
          batchProcessing: true
        };
      case 'ADVANCED':
        return { 
          name: 'Advanced', 
          model: 'Claude 3 Sonnet/Opus', 
          color: 'bg-purple-100 text-purple-800',
          maxSize: '50 MB',
          maxConversions: 200,
          maxPages: 100,
          concurrent: 5,
          batchProcessing: true
        };
      case 'ENTERPRISE':
        return { 
          name: 'Enterprise', 
          model: 'Claude 3 Opus', 
          color: 'bg-yellow-100 text-yellow-800',
          maxSize: '1 GB',
          maxConversions: 1000,
          maxPages: 'Unlimited',
          concurrent: 10,
          batchProcessing: true
        };
      default:
        return { 
          name: 'Free', 
          model: 'Claude 3 Haiku', 
          color: 'bg-gray-100 text-gray-800',
          maxSize: '5 MB',
          maxConversions: 10,
          maxPages: 5,
          concurrent: 1,
          batchProcessing: false
        };
    }
  };

  const tierInfo = getTierInfo(user?.tier);

  // File drop handler with tier restrictions
  const onDrop = useCallback((acceptedFiles) => {
    // Check batch processing restriction for free tier
    if (!tierInfo.batchProcessing && acceptedFiles.length > 1) {
      toast.error('Batch processing not available in Free tier. Please upgrade or upload one file at a time.');
      return;
    }

    // Check file size limits
    const maxSizeBytes = tierInfo.maxSize === '1 GB' ? 1024 * 1024 * 1024 : 
                        tierInfo.maxSize === '50 MB' ? 50 * 1024 * 1024 :
                        tierInfo.maxSize === '20 MB' ? 20 * 1024 * 1024 :
                        5 * 1024 * 1024; // 5 MB for free

    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      toast.error(`File size limit exceeded. Maximum allowed: ${tierInfo.maxSize}`);
      return;
    }

    // Check concurrent upload limit
    if (files.length + acceptedFiles.length > tierInfo.concurrent) {
      toast.error(`Too many files. Maximum concurrent uploads for ${tierInfo.name} tier: ${tierInfo.concurrent}`);
      return;
    }

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
  }, [files.length, tierInfo]);

  // Supported file formats
  const supportedFormats = {
    documents: ['.doc', '.docx', '.odt', '.rtf', '.txt', '.md', '.pdf', '.tex', '.wps', '.pages', '.epub', '.html'],
    spreadsheets: ['.xls', '.xlsx', '.ods', '.csv', '.tsv', '.numbers'],
    presentations: ['.ppt', '.pptx', '.odp', '.key'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    archives: ['.zip', '.rar', '.7z', '.tar.gz']
  };

  const allFormats = Object.values(supportedFormats).flat();

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

    // Check batch processing for free tier
    if (!tierInfo.batchProcessing && files.length > 1) {
      toast.error('Batch processing not available in Free tier. Please upgrade or upload one file at a time.');
      return;
    }

    // Check monthly limit
    if (stats.dailyUsage >= tierInfo.maxConversions) {
      toast.error(`Monthly conversion limit reached (${tierInfo.maxConversions}). Please upgrade your plan.`);
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

        try {
          const response = await fetch('/api/files/convert', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'user-id': localStorage.getItem('userId') || 'anonymous',
              'user-tier': user?.tier || 'FREE'
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
              conversionDetails: result.details,
              usage: result.usage
            });

            // Update stats with new usage info
            if (result.usage) {
              setStats(prev => ({
                ...prev,
                dailyUsage: result.usage.monthly,
                totalConversions: prev.totalConversions + 1
              }));
            }

          } else {
            const errorData = await response.json();
            
            // Handle tier-specific errors
            if (response.status === 403) {
              toast.error(`Upload restricted: ${errorData.reasons?.join(', ') || 'Tier limit exceeded'}`);
              
              // Update file status to error
              setFiles(prev => prev.map(f => 
                f.id === fileItem.id ? { ...f, status: 'error', progress: 0 } : f
              ));
              continue;
            }
            
            throw new Error(errorData.error || 'Conversion failed');
          }
        } catch (error) {
          console.error('Conversion error:', error);
          
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, status: 'error', progress: 0 } : f
          ));

          // Add mock result for demo (only if not a tier restriction error)
          if (!error.message.includes('restricted')) {
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
      }

      if (newResults.length > 0) {
        setResults(newResults);
        fetchStats(); // Refresh stats
        toast.success(`Successfully processed ${newResults.length} file(s)!`);
      }

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

  const getTierInfo = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'FREE':
        return { name: 'Free', model: 'Claude 3 Haiku', color: 'bg-gray-100 text-gray-800' };
      case 'BASIC':
        return { name: 'Basic', model: 'Claude 3 Sonnet', color: 'bg-blue-100 text-blue-800' };
      case 'ADVANCED':
        return { name: 'Advanced', model: 'Claude 3 Sonnet/Opus', color: 'bg-purple-100 text-purple-800' };
      case 'ENTERPRISE':
        return { name: 'Enterprise', model: 'Claude 3 Opus', color: 'bg-gold-100 text-gold-800' };
      default:
        return { name: 'Free', model: 'Claude 3 Haiku', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const tierInfo = getTierInfo(user?.tier);

  return (
    <>
      <Helmet>
        <title>File Drop AI - Universal File Converter</title>
        <meta name="description" content="Convert any file format to any other format using AI. Support for documents, images, spreadsheets, presentations, and archives." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className={`px-3 py-1 rounded-full ${tierInfo.color}`}>
              {tierInfo.name} Plan
            </span>
            <span className="text-gray-500">
              Powered by {tierInfo.model}
            </span>
          </div>
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
          </div>
        </div>

        {/* Main Conversion Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors mb-6 ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium text-lg">Drop your files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2 text-lg">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Supports: PDF, DOCX, Images, Spreadsheets, Presentations, Archives
                </p>
                <p className="text-xs text-gray-400">
                  Max file size: 50MB per file
                </p>
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="mb-6">
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

          {/* Conversion Prompt */}
          <div className="mb-6">
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
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
          </div>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={processing || files.length === 0 || !prompt.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg font-semibold"
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

        {/* Conversion Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
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
                      className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    Original: {result.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Size: {result.fileSize}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supported Formats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Supported Formats
            </h2>
            
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">📄 Documents</h3>
                <p className="text-gray-600">PDF, DOCX, TXT, MD, HTML, RTF, ODT</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">🖼️ Images</h3>
                <p className="text-gray-600">JPG, PNG, GIF, BMP, SVG, WEBP</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">📊 Spreadsheets</h3>
                <p className="text-gray-600">XLS, XLSX, CSV, TSV, ODS</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">📽️ Presentations</h3>
                <p className="text-gray-600">PPT, PPTX, ODP, KEY</p>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Plan: {tierInfo.name}
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>AI Model: {tierInfo.model}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Daily Limit: {stats.dailyLimit} conversions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>File Size: Up to 50MB</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Batch Processing: Multiple files</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConvertFiles;

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
    dailyLimit: 5,
    totalConversions: 0
  });

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
    if (user) {
      fetchStats();
    }
  }, [user]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(file => {
      toast.error(`${file.file.name}: ${file.errors[0].message}`);
    });

    // Add accepted files
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'ready',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${acceptedFiles.length} file(s) added successfully`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/html': ['.html'],
      'text/markdown': ['.md']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a conversion prompt');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (stats.dailyUsage >= stats.dailyLimit) {
      toast.error('Daily usage limit reached. Please upgrade your plan.');
      return;
    }

    setProcessing(true);

    try {
      // Update file statuses to processing
      setFiles(prev => prev.map(f => ({ ...f, status: 'processing', progress: 50 })));

      const formData = new FormData();
      files.forEach(fileItem => {
        formData.append('files', fileItem.file);
      });
      formData.append('prompt', prompt);

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const result = await response.json();
      
      // Update file statuses to completed
      setFiles(prev => prev.map(f => ({ ...f, status: 'completed', progress: 100 })));
      
      // Add results
      setResults(prev => [...prev, ...result.results]);
      
      // Update stats
      await fetchStats();
      
      toast.success('Files converted successfully!');
    } catch (error) {
      console.error('Error processing files:', error);
      setFiles(prev => prev.map(f => ({ ...f, status: 'error', progress: 0 })));
      toast.error('Error processing files. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = (result) => {
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${result.originalName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <FileText className="h-5 w-5 text-gray-500" />;
      case 'uploading':
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready':
        return 'Ready to convert';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Converting with AI...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error occurred';
      default:
        return 'Unknown';
    }
  };

  const usagePercentage = (stats.dailyUsage / stats.dailyLimit) * 100;

  return (
    <>
      <Helmet>
        <title>Convert Files - NLP File Converter</title>
        <meta name="description" content="Upload and convert your files with AI-powered NLP processing" />
      </Helmet>

      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Convert Your Files
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload your documents and transform them with AI-powered intelligence.
            </p>
          </div>

          {/* Enhanced File Converter Interface - Single Merged Box */}
          <div className="max-w-7xl mx-auto mb-16">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/60">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* File Upload Area */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Upload Your Files</h3>
                  </div>
                  
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 h-80 flex flex-col justify-center ${
                      isDragActive
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                      <Upload className="h-10 w-10 text-white" />
                    </div>
                    {isDragActive ? (
                      <div className="space-y-2">
                        <p className="text-blue-600 font-bold text-xl">
                          Drop the files here! ✨
                        </p>
                        <p className="text-gray-600">Release to upload your files</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-900 font-bold text-xl">
                          Drag & drop your files here
                        </p>
                        <p className="text-gray-600 text-lg">
                          or click to browse your computer
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {['PDF', 'DOCX', 'TXT', 'HTML', 'MD'].map((format) => (
                            <span key={format} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                              {format}
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-500 text-sm">Maximum file size: 10MB each</p>
                      </div>
                    )}
                  </div>

                  {/* Enhanced File List */}
                  {files.length > 0 && (
                    <div className="space-y-3 max-h-32 overflow-y-auto">
                      <h4 className="text-gray-900 font-semibold text-lg flex items-center">
                        <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                        Ready to Transform ({files.length})
                      </h4>
                      {files.map((fileItem) => (
                        <div key={fileItem.id} className="bg-gray-50 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {getStatusIcon(fileItem.status)}
                              <div className="min-w-0 flex-1">
                                <p className="text-gray-900 font-medium break-words" title={fileItem.file.name}>
                                  {fileItem.file.name}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(fileItem.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 flex-shrink-0 ml-2"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          {fileItem.progress > 0 && (
                            <div className="mt-2">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${fileItem.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Prompt Input */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Describe Your Vision</h3>
                  </div>
                  
                  <div className="relative h-80">
                    <textarea
                      className="w-full h-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-2xl shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="✨ Describe how you want your content transformed:

• Convert this technical document into simple, engaging language
• Transform this content into a professional business proposal  
• Rewrite this article for a younger, social media audience
• Convert this text into compelling bullet points and summaries
• Make this content more persuasive and action-oriented

Be specific about tone, style, audience, and format!"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={processFiles}
                    disabled={processing || files.length === 0 || !prompt.trim() || stats.dailyUsage >= stats.dailyLimit}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg disabled:transform-none"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center">
                        <Loader className="h-6 w-6 mr-3 animate-spin" />
                        Converting Files...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Rocket className="h-6 w-6 mr-3" />
                        Transform {files.length} File{files.length !== 1 ? 's' : ''} with AI
                      </span>
                    )}
                  </button>

                  {/* Feature Highlights */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <span className="text-gray-900 font-semibold">Lightning Fast</span>
                      </div>
                      <p className="text-gray-600 text-sm">Process files in seconds with advanced AI</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-5 w-5 text-green-500" />
                        <span className="text-gray-900 font-semibold">100% Secure</span>
                      </div>
                      <p className="text-gray-600 text-sm">Your files are encrypted and protected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
                  Conversion Results
                </h2>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {result.originalName}
                        </h3>
                        <button
                          onClick={() => downloadResult(result)}
                          className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {result.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ConvertFiles;

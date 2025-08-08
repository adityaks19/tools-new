import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  Loader, 
  Download, 
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

const FileProcessor = () => {
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

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
    setResults(prev => prev.filter(r => r.fileId !== fileId));
  };

  const processFiles = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a processing prompt');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setProcessing(true);
    const newResults = [];

    for (const fileItem of files) {
      if (fileItem.status === 'completed') continue;

      try {
        // Update file status
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploading', progress: 25 }
            : f
        ));

        // Upload file
        const formData = new FormData();
        formData.append('file', fileItem.file);
        formData.append('prompt', prompt);

        const uploadResponse = await axios.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const { fileId } = uploadResponse.data;

        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'processing', progress: 50, fileId }
            : f
        ));

        // Process with NLP
        const processResponse = await axios.post(`/nlp/process/${fileId}`);

        // Update completion
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));

        newResults.push({
          fileId,
          originalName: fileItem.file.name,
          processedContent: processResponse.data.processedContent,
          seoMetadata: processResponse.data.seoMetadata,
          downloadUrl: processResponse.data.downloadUrl
        });

        toast.success(`${fileItem.file.name} processed successfully!`);

      } catch (error) {
        console.error('Processing error:', error);
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', progress: 0 }
            : f
        ));

        const errorMessage = error.response?.data?.message || 'Processing failed';
        toast.error(`${fileItem.file.name}: ${errorMessage}`);
      }
    }

    setResults(prev => [...prev, ...newResults]);
    setProcessing(false);
  };

  const downloadResult = (result) => {
    const element = document.createElement('a');
    const file = new Blob([result.processedContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `processed_${result.originalName}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
        return 'Ready to process';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing with AI...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error occurred';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <Helmet>
        <title>File Processor - SEO NLP App</title>
        <meta name="description" content="Upload and process your files with AI-powered SEO optimization" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Processor
          </h1>
          <p className="text-gray-600">
            Upload your documents and transform them with AI-powered SEO optimization
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* Drag and Drop Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-primary-600 font-medium">
                  Drop the files here...
                </p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: PDF, DOCX, TXT, HTML, MD (max 10MB each)
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Processing Prompt
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe how you want your content transformed. For example: 'Optimize this content for SEO, make it more engaging, and target keywords related to digital marketing...'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            {/* Process Button */}
            <button
              onClick={processFiles}
              disabled={processing || files.length === 0 || !prompt.trim()}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Processing Files...
                </span>
              ) : (
                `Process ${files.length} File${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>

          {/* Files List */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Files ({files.length})
            </h2>

            {files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No files uploaded yet
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(fileItem.status)}
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-xs">
                            {fileItem.file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {getStatusText(fileItem.status)}
                      </span>
                      {fileItem.progress > 0 && (
                        <span className="text-sm text-gray-500">
                          {fileItem.progress}%
                        </span>
                      )}
                    </div>

                    {fileItem.progress > 0 && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
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
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Processing Results
            </h2>

            <div className="grid gap-6">
              {results.map((result) => (
                <div
                  key={result.fileId}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {result.originalName}
                    </h3>
                    <button
                      onClick={() => downloadResult(result)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>

                  {result.seoMetadata && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">SEO Metadata</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Title:</span>
                          <p className="text-gray-600 mt-1">{result.seoMetadata.title}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Keywords:</span>
                          <p className="text-gray-600 mt-1">
                            {Array.isArray(result.seoMetadata.keywords) 
                              ? result.seoMetadata.keywords.join(', ')
                              : result.seoMetadata.keywords
                            }
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="text-gray-600 mt-1">{result.seoMetadata.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h4 className="font-medium text-gray-900 mb-2">Processed Content Preview</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {result.processedContent.substring(0, 500)}
                      {result.processedContent.length > 500 && '...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FileProcessor;

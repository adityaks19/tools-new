import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  CheckCircle, 
  Star,
  ArrowRight,
  Play,
  Download,
  Sparkles,
  Brain,
  Globe,
  TrendingUp,
  Award,
  Target,
  Rocket,
  BarChart3,
  MessageSquare,
  Lightbulb,
  RefreshCw,
  Database,
  Lock,
  Cpu,
  Cloud,
  X,
  ArrowDown
} from 'lucide-react';

const Home = ({ onShowLogin }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // Process uploaded files
  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 20 * 1024 * 1024; // 20MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle convert button click
  const handleConvert = () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }
    if (!prompt.trim()) {
      alert('Please enter a transformation prompt');
      return;
    }
    
    // Show login dialog
    if (onShowLogin) {
      onShowLogin();
    }
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning algorithms understand context and meaning, delivering human-quality transformations.",
      details: "Our AI models are trained on millions of documents to understand nuance, tone, and context."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast Processing",
      description: "Process files in seconds, not minutes. Our optimized infrastructure handles any workload instantly.",
      details: "Average processing time under 10 seconds for most documents, with batch processing capabilities."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Enterprise Security",
      description: "Bank-level encryption and security protocols protect your sensitive documents at all times.",
      details: "End-to-end encryption, SOC 2 compliance, and automatic data deletion after processing."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multi-Language Support",
      description: "Support for 50+ languages with intelligent translation and localization capabilities.",
      details: "Automatic language detection and culturally-aware content adaptation."
    }
  ];

  const useCases = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Document Transformation",
      description: "Convert technical manuals into user-friendly guides",
      example: "Legal contracts → Plain English summaries"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Content Marketing",
      description: "Transform blog posts for different audiences",
      example: "Technical articles → Social media content"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Training Materials",
      description: "Adapt educational content for various skill levels",
      example: "Expert guides → Beginner tutorials"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Business Reports",
      description: "Convert data reports into executive summaries",
      example: "Technical analysis → C-suite presentations"
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Creative Writing",
      description: "Transform content style and tone",
      example: "Formal reports → Engaging narratives"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Marketing Copy",
      description: "Adapt messaging for different demographics",
      example: "Product specs → Compelling sales copy"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Marketing Manager",
      company: "TechCorp",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      content: "NLP Converter transformed our content workflow. We now create 10x more variations in half the time.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Technical Writer",
      company: "InnovateLabs",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      content: "The AI understands context better than any tool I've used. It's like having a writing assistant that never sleeps.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Marketing Director",
      company: "GrowthCo",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      content: "ROI was immediate. We reduced content creation time by 70% while improving quality and consistency.",
      rating: 5
    }
  ];

  const stats = [
    { number: "1M+", label: "Files Processed", icon: <FileText className="h-6 w-6" /> },
    { number: "50K+", label: "Happy Users", icon: <Users className="h-6 w-6" /> },
    { number: "99.9%", label: "Uptime", icon: <Clock className="h-6 w-6" /> },
    { number: "4.9/5", label: "User Rating", icon: <Star className="h-6 w-6" /> }
  ];

  const pricingHighlight = [
    {
      plan: "Free",
      price: "$0",
      period: "forever",
      features: ["5 conversions/week", "Basic formats", "20MB files"],
      cta: "Get Started Free",
      popular: false,
      link: "/register"
    },
    {
      plan: "Basic",
      price: "$9.99",
      period: "month",
      features: ["Unlimited conversions", "All formats", "100MB files", "Batch processing"],
      cta: "Start Basic Plan",
      popular: false,
      link: "/register"
    },
    {
      plan: "Premium",
      price: "$19.99",
      period: "month",
      features: ["Everything in Basic", "300MB files", "API access", "Priority support"],
      cta: "Start Premium Plan",
      popular: true,
      link: "/register"
    },
    {
      plan: "Enterprise",
      price: "$49.99",
      period: "month",
      features: ["Everything in Premium", "1GB files", "Dedicated support", "Custom integrations"],
      cta: "Start Enterprise Plan",
      popular: false,
      link: "/register"
    }
  ];

  return (
    <>
      <Helmet>
        <title>File Drop AI - Universal File Converter with AI</title>
        <meta name="description" content="Convert any file format to any other format using AI. Upload documents, images, spreadsheets, presentations, and archives. Get intelligent file conversion with custom prompts." />
        <meta name="keywords" content="file converter, AI file conversion, document converter, image converter, PDF converter, universal file converter" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Hero Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">File Drop AI</span>
              <br />
              Universal File Converter
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
              Convert any file to any format using AI. Upload documents, images, spreadsheets, presentations, and archives. 
              Get intelligent file conversion with custom prompts and processing instructions.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                to="#convert-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('convert-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl inline-flex items-center"
              >
                <Upload className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Converting Now
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-blue-600 mb-2 flex justify-center">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Layout Section */}
        <div id="convert-section" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/60">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Transform Your Content Now
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Upload your file and describe how you want it transformed. Our AI will do the rest.
              </p>
            </div>

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
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 h-80 flex flex-col justify-center ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : uploadedFiles.length > 0
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  
                  {uploadedFiles.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-green-900 font-bold text-xl">
                        {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
                      </p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900 truncate max-w-40">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">Click to add more files</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                        <Upload className="h-10 w-10 text-white" />
                      </div>
                      <p className="text-gray-900 font-bold text-xl">
                        Drag & drop your files here
                      </p>
                      <p className="text-gray-600 text-lg">
                        or click to browse your computer
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {['PDF', 'DOCX', 'TXT', 'Excel', 'Images'].map((format) => (
                          <span key={format} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {format}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-500 text-sm">Maximum file size: 20MB each</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Describe Your Vision</h3>
                </div>
                
                <div className="relative h-80">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-full px-6 py-4 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-2xl shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="✨ Describe how you want your content transformed:

• Convert this technical document into simple, engaging language
• Transform this content into a professional business proposal  
• Rewrite this article for a younger, social media audience
• Convert this text into compelling bullet points and summaries
• Make this content more persuasive and action-oriented

Be specific about tone, style, audience, and format!"
                  />
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleConvert}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-xl transition-all duration-300 shadow-lg inline-flex items-center justify-center"
                >
                  <Rocket className="h-6 w-6 mr-3" />
                  Convert Now - It's Free!
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

        {/* Conversion Process Flowchart */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your content in 4 simple steps. Our AI handles the complexity while you focus on results.
            </p>
          </div>

          {/* Flowchart */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {/* Step 1: Upload */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Upload Files</h3>
                <p className="text-gray-600 mb-4">Drag & drop your documents or click to browse. We support PDF, DOCX, TXT, Excel, and Images.</p>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700 font-medium">Up to 20MB per file</p>
                </div>
              </div>
            </div>

            {/* Step 2: Describe */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Enter Prompt</h3>
                <p className="text-gray-600 mb-4">Describe how you want your content transformed. Be specific about tone, style, and audience.</p>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-purple-700 font-medium">AI understands context</p>
                </div>
              </div>
            </div>

            {/* Step 3: Process */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. AI Processing</h3>
                <p className="text-gray-600 mb-4">Our advanced AI analyzes your content and transforms it according to your specifications.</p>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-green-700 font-medium">Lightning fast results</p>
                </div>
              </div>
            </div>

            {/* Step 4: Download */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Download className="h-10 w-10 text-white" />
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60">
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Download</h3>
                <p className="text-gray-600 mb-4">Get your transformed content instantly. Download in your preferred format or copy to clipboard.</p>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-sm text-orange-700 font-medium">Multiple formats available</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              to="#convert-section"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('convert-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-xl hover:shadow-2xl inline-flex items-center"
            >
              <Rocket className="h-6 w-6 mr-3" />
              Try It Now - It's Free!
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose NLP Converter?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the power of AI-driven content transformation with enterprise-grade features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast Processing</h3>
              <p className="text-gray-600">Process files in seconds, not minutes. Our optimized infrastructure handles any workload instantly.</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-600">Bank-level encryption and security protocols protect your sensitive documents at all times.</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Language Support</h3>
              <p className="text-gray-600">Support for 50+ languages with intelligent translation and localization capabilities.</p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Endless Possibilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From content marketing to technical documentation, see how professionals use NLP Converter to transform their workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl w-fit mb-6">
                  <div className="text-white">
                    {useCase.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                <p className="text-gray-600 mb-4">{useCase.description}</p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">{useCase.example}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of content creators, marketers, and writers who trust NLP Converter for their daily workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Preview Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-white">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Start free and scale as you grow. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {pricingHighlight.map((plan, index) => (
                <div key={index} className={`rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-white text-gray-900 shadow-2xl scale-105' 
                    : 'bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20'
                }`}>
                  {plan.popular && (
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 text-center">
                      Most Popular
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.plan}</h3>
                    <div className="text-4xl font-bold mb-1">{plan.price}</div>
                    <div className={`text-sm ${plan.popular ? 'text-gray-600' : 'text-blue-200'}`}>
                      per {plan.period}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className={`h-5 w-5 mr-3 ${
                          plan.popular ? 'text-green-500' : 'text-green-300'
                        }`} />
                        <span className={plan.popular ? 'text-gray-700' : 'text-blue-100'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={plan.link}
                    className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                        : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/pricing"
                className="text-blue-100 hover:text-white font-semibold inline-flex items-center"
              >
                View all plans and features
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by Cutting-Edge Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on enterprise-grade infrastructure with the latest AI models and security standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Brain className="h-8 w-8" />, title: "Advanced AI", desc: "Latest language models" },
              { icon: <Cloud className="h-8 w-8" />, title: "Cloud Native", desc: "Scalable infrastructure" },
              { icon: <Lock className="h-8 w-8" />, title: "Enterprise Security", desc: "Bank-level encryption" },
              { icon: <Cpu className="h-8 w-8" />, title: "High Performance", desc: "Optimized processing" }
            ].map((tech, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <div className="text-white">
                    {tech.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tech.title}</h3>
                <p className="text-gray-600">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Content?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Join thousands of professionals who use NLP Converter to create better content faster. 
              Start your free trial today - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl inline-flex items-center"
              >
                <Rocket className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/pricing"
                onClick={() => {
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
                className="text-gray-300 hover:text-white font-semibold text-lg inline-flex items-center"
              >
                View Pricing
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>

            <div className="mt-12 text-sm text-gray-400">
              No credit card required • Cancel anytime • 24/7 support
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

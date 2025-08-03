import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Loader, TrendingUp, AlertCircle } from 'lucide-react';

const SEOAnalyzer = () => {
  const [content, setContent] = useState('');
  const [targetKeywords, setTargetKeywords] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      return;
    }

    setLoading(true);
    
    // Mock analysis for demo
    setTimeout(() => {
      setAnalysis({
        seoScore: 78,
        readabilityScore: 85,
        keywordDensity: '2.3%',
        recommendations: [
          'Add more relevant keywords in headings',
          'Improve meta description length',
          'Include more internal links',
          'Optimize image alt texts'
        ]
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <>
      <Helmet>
        <title>SEO Analyzer - SEO NLP Processor</title>
        <meta name="description" content="Analyze your content for SEO optimization with AI-powered insights" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SEO Content Analyzer
          </h1>
          <p className="text-gray-600">
            Get AI-powered insights to optimize your content for search engines
          </p>
        </div>

        <div className="space-y-6">
          {/* Content Input */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content to Analyze
            </label>
            <textarea
              id="content"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="Paste your content here for SEO analysis..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Target Keywords */}
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
              Target Keywords (optional)
            </label>
            <input
              id="keywords"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., SEO optimization, content marketing"
              value={targetKeywords}
              onChange={(e) => setTargetKeywords(e.target.value)}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience (optional)
            </label>
            <input
              id="audience"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Digital marketers, Small business owners"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !content.trim()}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Analyzing Content...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Search className="h-5 w-5 mr-2" />
                Analyze SEO
              </span>
            )}
          </button>

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
              
              {/* Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{analysis.seoScore}</div>
                  <div className="text-sm text-gray-600">SEO Score</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysis.readabilityScore}</div>
                  <div className="text-sm text-gray-600">Readability</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.keywordDensity}</div>
                  <div className="text-sm text-gray-600">Keyword Density</div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <TrendingUp className="h-5 w-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SEOAnalyzer;

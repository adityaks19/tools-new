import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  FileText, 
  Upload, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  Star,
  Sparkles,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    filesProcessed: 0,
    dailyUsage: 0,
    dailyLimit: 5
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch user files
      const filesResponse = await axios.get('/files');
      const files = filesResponse.data.files || [];
      
      setRecentFiles(files.slice(0, 5)); // Show last 5 files
      setStats(prev => ({
        ...prev,
        filesProcessed: files.length
      }));

      // Set daily limits based on subscription
      const limits = {
        'free': 5,
        'basic': 50,
        'premium': 200,
        'enterprise': 1000
      };
      
      // Get today's usage
      const today = new Date().toISOString().split('T')[0];
      let dailyUsage = 0;
      
      try {
        // Count files processed today
        const todayFiles = files.filter(file => {
          const fileDate = new Date(file.createdAt).toISOString().split('T')[0];
          return fileDate === today;
        });
        dailyUsage = todayFiles.length;
      } catch (error) {
        console.error('Error calculating daily usage:', error);
      }
      
      setStats(prev => ({
        ...prev,
        dailyLimit: limits[user?.subscriptionTier] || 5,
        dailyUsage: dailyUsage
      }));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const usagePercentage = (stats.dailyUsage / stats.dailyLimit) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Usage Dashboard - NLP File Converter</title>
        <meta name="description" content="Track your file conversion usage and manage your account" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Files Processed */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Files Processed</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stats.filesProcessed}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-green-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-xl">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Usage</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {stats.dailyUsage}/{stats.dailyLimit}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-yellow-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Plan</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent capitalize">
                    {user?.subscriptionTier || 'Free'}
                  </p>
                  {user?.subscriptionTier === 'free' && (
                    <Link
                      to="/pricing"
                      className="text-sm text-purple-600 hover:text-purple-500 font-medium inline-flex items-center mt-1"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Upgrade Plan →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Convert New Files */}
            <Link
              to="/convert"
              className="group bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <div className="flex items-center">
                <div className="bg-white/20 p-4 rounded-xl group-hover:bg-white/30 transition-colors">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-bold">Convert New Files</h3>
                  <p className="text-purple-100 mt-1">
                    Upload and transform your documents with AI
                  </p>
                </div>
                <Plus className="h-6 w-6 ml-auto transition-transform" />
              </div>
            </Link>

            {/* View Pricing */}
            <Link
              to="/pricing"
              className="group bg-white border-2 border-purple-200 text-purple-600 rounded-2xl p-8 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:border-purple-300 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <div className="flex items-center">
                <div className="bg-purple-100 p-4 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-bold">Upgrade Plan</h3>
                  <p className="text-purple-500 mt-1">
                    Get more conversions and advanced features
                  </p>
                </div>
                <Plus className="h-6 w-6 ml-auto transition-transform" />
              </div>
            </Link>
          </div>

          {/* Recent Files */}
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-purple-600" />
                  Recent Files
                </h2>
                <Link
                  to="/convert"
                  className="text-purple-600 hover:text-purple-500 font-medium inline-flex items-center"
                >
                  View all →
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {recentFiles.length === 0 ? (
                <div className="px-8 py-12 text-center">
                  <div className="bg-gradient-to-r from-gray-100 to-purple-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
                  <p className="text-gray-500 mb-6">
                    Start by uploading your first document to convert with AI
                  </p>
                  <Link
                    to="/convert"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl inline-flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First File
                  </Link>
                </div>
              ) : (
                recentFiles.map((file) => (
                  <div key={file.fileId} className="px-8 py-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-2 rounded-lg">
                          {getStatusIcon(file.status)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{file.originalName}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          file.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : file.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : file.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {file.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Usage Warning */}
          {usagePercentage > 80 && (
            <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Approaching Daily Limit
                  </h3>
                  <p className="text-yellow-700 mt-1">
                    You've used {stats.dailyUsage} of your {stats.dailyLimit} daily file conversions. 
                    {user?.subscriptionTier === 'free' && (
                      <>
                        {' '}
                        <Link to="/pricing" className="font-semibold underline hover:text-yellow-600">
                          Upgrade your plan
                        </Link>
                        {' '}for higher limits and more features.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

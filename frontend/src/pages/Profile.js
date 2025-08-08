import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Save, Loader, Star, Shield, Zap } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await updateProfile({ name: formData.name });
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (tier) => {
    switch (tier) {
      case 'free':
        return 'from-gray-400 to-gray-600';
      case 'basic':
        return 'from-blue-400 to-blue-600';
      case 'premium':
        return 'from-purple-400 to-purple-600';
      case 'enterprise':
        return 'from-yellow-400 to-orange-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getPlanIcon = (tier) => {
    switch (tier) {
      case 'free':
        return <User className="h-5 w-5" />;
      case 'basic':
        return <Shield className="h-5 w-5" />;
      case 'premium':
        return <Star className="h-5 w-5" />;
      case 'enterprise':
        return <Zap className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings - NLP File Converter</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-full shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100 hover:shadow-2xl transition-all duration-300">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{user?.name}</h2>
                  <p className="text-gray-600 mb-4">{user?.email}</p>
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Plan</span>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getPlanColor(user?.subscriptionTier)}`}>
                        {getPlanIcon(user?.subscriptionTier)}
                        <span className="ml-1 capitalize">{user?.subscriptionTier || 'Free'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Status</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="h-6 w-6 mr-3 text-purple-600" />
                  Account Information
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className={`w-full px-4 py-3 border-2 ${
                        errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                      } rounded-xl shadow-sm focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-4 h-4 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        disabled
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500"
                        value={formData.email}
                      />
                      <Mail className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-500" />
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Subscription Management */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100 mt-8 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Star className="h-6 w-6 mr-3 text-purple-600" />
                  Subscription Management
                </h3>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${getPlanColor(user?.subscriptionTier)} shadow-lg`}>
                        <div className="text-white">
                          {getPlanIcon(user?.subscriptionTier)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-lg font-bold text-gray-900 capitalize">
                          {user?.subscriptionTier || 'Free'} Plan
                        </p>
                        <p className="text-gray-600">
                          {user?.subscriptionTier === 'free' 
                            ? 'Upgrade to unlock more features and higher limits'
                            : 'Manage your subscription settings and billing'
                          }
                        </p>
                      </div>
                    </div>
                    <div>
                      {user?.subscriptionTier === 'free' ? (
                        <a
                          href="/pricing"
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade Plan
                        </a>
                      ) : (
                        <button className="text-purple-600 hover:text-purple-500 font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                          Manage Subscription
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200 mt-8 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold text-red-900 mb-6 flex items-center">
                  <Shield className="h-6 w-6 mr-3 text-red-600" />
                  Danger Zone
                </h3>
                
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-red-900">Delete Account</p>
                      <p className="text-red-700 mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;

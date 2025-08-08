import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState({
    conversions: 0,
    maxConversions: 10, // Free tier limit
    resetDate: null
  });

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          setUser(response.data);
          
          // Fetch user usage data
          await fetchUsage();
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await axios.get('/auth/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      // Set default usage if API fails
      setUsage({
        conversions: 0,
        maxConversions: 10,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }
  };

  const updateUsage = async () => {
    try {
      const response = await axios.post('/auth/usage/increment');
      setUsage(response.data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update usage:', error);
      return { success: false, error: error.response?.data?.error || 'Failed to update usage' };
    }
  };

  const checkUsageLimit = () => {
    if (!user) return { canUse: false, reason: 'Please login to continue' };
    
    // Check if user has premium subscription
    if (user.subscription && user.subscription.status === 'active') {
      return { canUse: true };
    }
    
    // Check free tier limits
    if (usage.conversions >= usage.maxConversions) {
      return { 
        canUse: false, 
        reason: `You've reached your free tier limit of ${usage.maxConversions} conversions. Upgrade to continue.`,
        isLimitReached: true
      };
    }
    
    return { canUse: true, remaining: usage.maxConversions - usage.conversions };
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userData.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      // Fetch usage data after login
      await fetchUsage();
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/auth/register', { name, email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userData.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      // Initialize usage for new user
      setUsage({
        conversions: 0,
        maxConversions: 10,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      toast.success('Registration successful! You have 10 free conversions.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setUsage({ conversions: 0, maxConversions: 10, resetDate: null });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      await axios.put('/auth/profile', profileData);
      setUser(prev => ({ ...prev, ...profileData }));
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    usage,
    login,
    register,
    logout,
    updateProfile,
    fetchUsage,
    updateUsage,
    checkUsageLimit
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

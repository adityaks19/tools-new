import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Menu, X, User, Settings, LogOut, BarChart3, Zap } from 'lucide-react';

const Navbar = ({ onShowLogin, onShowSignUp }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSignInClick = () => {
    onShowLogin();
    setIsOpen(false);
  };

  // Navbar for logged-in users
  if (user) {
    return (
      <nav className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 shadow-lg border-b border-purple-200 relative z-[9999]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and brand - Left side */}
            <div className="flex items-center">
              <Link to="/convert" className="flex items-center space-x-2">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xl font-bold text-white">NLP Converter</span>
              </Link>
            </div>

            {/* Desktop navigation for logged-in users - Center */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/convert"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive('/convert') || isActive('/process')
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Convert Files
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  isActive('/dashboard')
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/pricing"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  isActive('/pricing')
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
            </div>

            {/* User menu - Right side */}
            <div className="flex items-center space-x-4">
              {/* User Profile Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{user.name}</span>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-1">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full">
                      {user.subscriptionTier || 'Free'} Plan
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3 text-purple-500" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu for logged-in users */}
          {isOpen && (
            <div className="md:hidden bg-white/10 backdrop-blur-sm">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <Link
                  to="/convert"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/convert') ? 'bg-white text-purple-600 shadow-md' : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Convert Files
                </Link>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/dashboard') ? 'bg-white text-purple-600 shadow-md' : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/pricing"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/pricing') ? 'bg-white text-purple-600 shadow-md' : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-white hover:bg-white/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Navbar for non-logged-in users
  return (
    <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-lg border-b border-blue-200 relative z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand - Left side */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-lg shadow-md">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-white">NLP Converter</span>
            </Link>
          </div>

          {/* Desktop navigation - Center */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors duration-200 ${
                isActive('/') ? 'text-yellow-300' : 'text-white hover:text-yellow-200'
              }`}
            >
              Home
            </Link>
            <Link
              to="/pricing"
              className={`font-medium transition-colors duration-200 ${
                isActive('/pricing') ? 'text-yellow-300' : 'text-white hover:text-yellow-200'
              }`}
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className={`font-medium transition-colors duration-200 ${
                isActive('/about') ? 'text-yellow-300' : 'text-white hover:text-yellow-200'
              }`}
            >
              About
            </Link>
          </div>

          {/* Auth buttons - Right side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSignInClick}
              className="text-white hover:text-blue-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onShowSignUp()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/') ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/pricing"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/pricing') ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/about') ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <button
                onClick={handleSignInClick}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/20 transition-colors w-full text-left"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onShowSignUp();
                  setIsOpen(false);
                }}
                className="block px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Menu, X, User, Settings, LogOut, BarChart3, Zap, Upload } from 'lucide-react';

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
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xl font-bold text-white">File Drop AI</span>
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
                <Upload className="inline-block w-4 h-4 mr-2" />
                Convert Files
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <BarChart3 className="inline-block w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>

            {/* User menu - Right side */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">{user.name || user.email}</span>
                </button>

                {/* Dropdown menu */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen && (
            <div className="md:hidden bg-white/10 backdrop-blur-sm rounded-lg mt-2 mb-4">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  to="/convert"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive('/convert') || isActive('/process')
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Upload className="inline-block w-4 h-4 mr-2" />
                  Convert Files
                </Link>
                <Link
                  to="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <BarChart3 className="inline-block w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive('/profile')
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="inline-block w-4 h-4 mr-2" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/20 transition-colors duration-200"
                >
                  <LogOut className="inline-block w-4 h-4 mr-2" />
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
    <nav className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 shadow-lg border-b border-purple-200 relative z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-white p-2 rounded-lg shadow-md">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xl font-bold text-white">File Drop AI</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`font-medium transition-colors duration-200 ${
                isActive('/') ? 'text-white' : 'text-purple-100 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`font-medium transition-colors duration-200 ${
                isActive('/about') ? 'text-white' : 'text-purple-100 hover:text-white'
              }`}
            >
              About
            </Link>
            <Link
              to="/pricing"
              className={`font-medium transition-colors duration-200 ${
                isActive('/pricing') ? 'text-white' : 'text-purple-100 hover:text-white'
              }`}
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className={`font-medium transition-colors duration-200 ${
                isActive('/contact') ? 'text-white' : 'text-purple-100 hover:text-white'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleSignInClick}
              className="text-white hover:text-purple-100 font-medium transition-colors duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => onShowSignUp()}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors duration-200 shadow-md"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-sm rounded-lg mt-2 mb-4">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive('/') ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive('/about') ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                to="/pricing"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive('/pricing') ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/contact"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive('/contact') ? 'bg-white text-purple-600' : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <div className="border-t border-white/20 pt-2 mt-2">
                <button
                  onClick={handleSignInClick}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/20 transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onShowSignUp();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-white text-purple-600 hover:bg-purple-50 transition-colors duration-200 mt-2"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

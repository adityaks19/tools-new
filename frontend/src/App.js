import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import GetStarted from './pages/GetStarted';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import ConvertFiles from './pages/ConvertFiles';
import FileProcessor from './pages/FileProcessor';
import Profile from './pages/Profile';
import LoadingSpinner from './components/LoadingSpinner';
import LoginDialog from './components/LoginDialog';
import SignUpDialog from './components/SignUpDialog';

import './index.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !user ? children : <Navigate to="/convert" />;
};

// Home Route Component (redirect logged-in users to convert page)
const HomeRoute = ({ showLoginDialog, setShowLoginDialog }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/convert" /> : <Home onShowLogin={() => setShowLoginDialog(true)} />;
};

// App Content Component
const AppContent = () => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar 
        onShowLogin={() => setShowLoginDialog(true)}
        onShowSignUp={() => setShowSignUpDialog(true)}
      />
      
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={<HomeRoute showLoginDialog={showLoginDialog} setShowLoginDialog={setShowLoginDialog} />} 
          />
          <Route 
            path="/pricing" 
            element={<Pricing onShowSignUp={() => setShowSignUpDialog(true)} />} 
          />
          <Route 
            path="/about" 
            element={<About />} 
          />
          <Route 
            path="/contact" 
            element={<Contact />} 
          />
          
          {/* Auth Routes */}
          <Route 
            path="/get-started" 
            element={
              <PublicRoute>
                <GetStarted />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <GetStarted />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/convert" 
            element={
              <ProtectedRoute>
                <ConvertFiles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/process" 
            element={
              <ProtectedRoute>
                <FileProcessor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      
      <Footer />
      
      {/* Login Dialog */}
      <LoginDialog 
        showLoginDialog={showLoginDialog} 
        setShowLoginDialog={setShowLoginDialog}
        onShowSignUp={() => setShowSignUpDialog(true)}
      />
      
      {/* Sign Up Dialog */}
      <SignUpDialog 
        showSignUpDialog={showSignUpDialog} 
        setShowSignUpDialog={setShowSignUpDialog}
        onShowLogin={() => setShowLoginDialog(true)}
      />
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: 'linear-gradient(90deg, #10b981, #3b82f6)',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: 'linear-gradient(90deg, #ef4444, #f97316)',
              color: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <Elements stripe={stripePromise}>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </Elements>
    </HelmetProvider>
  );
}

export default App;

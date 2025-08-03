import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../contexts/AuthContext';
import { Check, Star, Zap } from 'lucide-react';

const Pricing = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for trying out our AI-powered file conversion',
      features: [
        '5 file conversions per week',
        'Basic file formats (PDF, Excel, TXT, Images)',
        'Standard AI processing',
        'Community support',
        'File size limit: 20MB',
        'Single file processing only'
      ],
      limitations: [
        'Limited weekly usage',
        'Basic formats only',
        'No batch processing',
        'No priority support'
      ],
      cta: user ? 'Current Plan' : 'Get Started Free',
      popular: false,
      current: user?.subscriptionTier === 'free'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: { monthly: 9.99, yearly: 99.99 },
      description: 'Great for individuals and small businesses',
      features: [
        'Unlimited file conversions',
        'All file formats supported',
        'Advanced AI processing',
        'Email support',
        'File size limit: 100MB',
        'Batch processing (up to 10 files)',
        'Content analysis tools',
        'Processing history'
      ],
      limitations: [],
      cta: 'Start Basic Plan',
      popular: false,
      current: user?.subscriptionTier === 'basic'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: { monthly: 19.99, yearly: 199.99 },
      description: 'Perfect for content creators and teams',
      features: [
        'Unlimited file conversions',
        'All file formats supported',
        'Advanced AI processing',
        'Content variations generator',
        'Priority support',
        'File size limit: 300MB',
        'Unlimited batch processing',
        'Custom conversion templates',
        'Analytics dashboard',
        'API access',
        'Team collaboration tools'
      ],
      limitations: [],
      cta: 'Start Premium Plan',
      popular: true,
      current: user?.subscriptionTier === 'premium'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 49.99, yearly: 499.99 },
      description: 'For large organizations with high-volume needs',
      features: [
        'Unlimited file conversions',
        'All file formats supported',
        'Advanced AI processing with priority queue',
        'Dedicated account manager',
        '24/7 phone support',
        'File size limit: 1GB',
        'Unlimited batch processing',
        'Custom integrations',
        'Advanced analytics',
        'Full API access',
        'Team management',
        'Custom branding',
        'SLA guarantee'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
      current: user?.subscriptionTier === 'enterprise'
    }
  ];

  const handlePlanSelect = (planId) => {
    // All plans redirect to register page for signup
    if (!user) {
      window.location.href = '/register';
      return;
    }

    // For logged-in users, handle plan upgrades
    if (user) {
      // TODO: Implement Stripe checkout
      console.log(`Upgrading to ${planId} plan`);
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing Plans - File Converter</title>
        <meta name="description" content="Choose the perfect plan for your document conversion needs. Start free or upgrade for advanced features." />
        <meta name="keywords" content="pricing, plans, file conversion, document processing, subscription" />
      </Helmet>

      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your document conversion needs. 
              Start free and upgrade as you grow.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 relative ${
                  plan.popular
                    ? 'border-primary-500 ring-2 ring-primary-500'
                    : plan.current
                    ? 'border-green-500'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="h-4 w-4 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price[billingCycle]}
                    </span>
                    {plan.price[billingCycle] > 0 && (
                      <span className="text-gray-600 ml-1">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={plan.current}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg ${
                    plan.current
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : plan.id === 'free'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  }`}
                >
                  {plan.current ? 'Current Plan' : plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I change plans anytime?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. 
                  Changes take effect immediately for upgrades and at the next billing cycle for downgrades.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  What file formats are supported?
                </h3>
                <p className="text-gray-600 text-sm">
                  We support PDF, DOCX, DOC, TXT, HTML, and Markdown files. 
                  Premium and Enterprise plans include additional format support.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes! Our Free plan lets you process 5 files per day with no time limit. 
                  No credit card required to get started.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  How does the AI optimization work?
                </h3>
                <p className="text-gray-600 text-sm">
                  We use AWS Bedrock with Claude 3 to analyze and optimize your content for SEO, 
                  readability, and engagement based on your custom prompts.
                </p>
              </div>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-16 bg-primary-600 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              For large organizations with specific requirements, we offer custom enterprise solutions 
              with dedicated support, custom integrations, and volume discounts.
            </p>
            <div className="flex justify-center">
              <a
                href="mailto:sales@your-domain.com"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;

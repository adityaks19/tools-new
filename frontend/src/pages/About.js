import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Target, 
  Award, 
  Rocket,
  Brain,
  Shield,
  Globe,
  Zap,
  Heart,
  Star,
  CheckCircle
} from 'lucide-react';

const About = () => {
  const team = [
    {
      name: "Alex Johnson",
      role: "CEO & Founder",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      bio: "Former AI researcher at Google with 10+ years in NLP and machine learning."
    },
    {
      name: "Sarah Kim",
      role: "CTO",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      bio: "Ex-Microsoft engineer specializing in scalable AI infrastructure and cloud computing."
    },
    {
      name: "Michael Chen",
      role: "Head of AI",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      bio: "PhD in Computational Linguistics, published researcher in natural language processing."
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      bio: "Product leader with experience at Slack and Notion, focused on user experience."
    }
  ];

  const values = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Innovation First",
      description: "We push the boundaries of what's possible with AI and natural language processing."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "User-Centric",
      description: "Every feature we build starts with understanding our users' real needs and challenges."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy & Security",
      description: "Your data is sacred. We implement the highest security standards to protect your content."
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Accessibility",
      description: "Powerful AI should be accessible to everyone, regardless of technical expertise."
    }
  ];

  const milestones = [
    {
      year: "2022",
      title: "Company Founded",
      description: "Started with a vision to democratize AI-powered content transformation."
    },
    {
      year: "2023",
      title: "First 10K Users",
      description: "Reached our first major milestone with users from 50+ countries."
    },
    {
      year: "2024",
      title: "1M Files Processed",
      description: "Processed over 1 million files, saving users thousands of hours."
    },
    {
      year: "2024",
      title: "Enterprise Launch",
      description: "Launched enterprise features for teams and large organizations."
    }
  ];

  return (
    <>
      <Helmet>
        <title>About Us - NLP File Converter</title>
        <meta name="description" content="Learn about our mission to democratize AI-powered content transformation and meet the team behind NLP File Converter." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NLP Converter</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              We're on a mission to democratize AI-powered content transformation, making advanced natural language processing accessible to everyone.
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 border border-white/60">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 mb-6">
                  We believe that powerful AI should be accessible to everyone, not just tech giants. Our platform democratizes advanced natural language processing, enabling individuals and businesses to transform their content with enterprise-grade AI.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  From small businesses to Fortune 500 companies, we're helping organizations communicate more effectively, reach broader audiences, and save countless hours on content creation and adaptation.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">1M+</div>
                    <div className="text-gray-600">Files Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">50K+</div>
                    <div className="text-gray-600">Happy Users</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 text-center shadow-md">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Precision</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 text-center shadow-md">
                    <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Speed</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 text-center shadow-md">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Security</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 text-center shadow-md">
                    <Globe className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                    <div className="font-semibold text-gray-900">Global</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do, from product development to customer support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <div className="text-white">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're a diverse team of AI researchers, engineers, and product experts passionate about making AI accessible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <div className="text-blue-600 font-semibold mb-4">{member.role}</div>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a small startup to serving users worldwide, here are the key milestones in our journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/60">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 w-fit">
                  {milestone.year}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{milestone.title}</h3>
                <p className="text-gray-600">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Be part of the AI revolution. Transform your content, save time, and reach new audiences with our powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a
                href="/convert"
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl hover:shadow-2xl inline-flex items-center"
              >
                <Rocket className="h-6 w-6 mr-3" />
                Start Converting
              </a>
              <a
                href="/pricing"
                className="text-blue-100 hover:text-white font-semibold text-lg"
              >
                View Pricing →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;

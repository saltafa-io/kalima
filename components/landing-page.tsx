'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Play, ArrowRight } from 'lucide-react';

// Removed unused imports: Square, Pause, Check, Star, Users, Award, Clock

// Define the type for the props that this component will receive.
type LandingPageProps = {
  onGetStarted: () => void;
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  // State to manage the modal dialog
  const [modalContent, setModalContent] = useState<{title: string, body: string} | null>(null);

  useEffect(() => {
    // Loading effect
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Scroll effect for navbar
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Updated handlers to use the modal instead of alert()
  const handleDemo = () => {
    setModalContent({
      title: "Demo Feature",
      body: "In the full app, this would use the Web Audio API to record your voice and send it to our AI for analysis."
    });
  };

  const handlePlayExample = () => {
    setModalContent({
      title: "Native Speaker Audio",
      body: "The full app includes high-quality Arabic audio from native speakers to help you learn."
    });
  };

  const handleJoinBeta = () => {
    setModalContent({
      title: "Join the Beta!",
      body: "A beta signup form would appear here. We&apos;d collect your email and send you early access when available."
    });
  };

  const features = [
    {
      icon: '🎯',
      title: 'AI-Powered Pronunciation',
      description: 'Advanced speech recognition technology analyzes your Arabic pronunciation in real-time, providing instant feedback and corrections.'
    },
    {
      icon: '🗣️',
      title: 'Voice-First Learning',
      description: 'Focus on speaking from day one. Our platform prioritizes verbal communication over text-based learning.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Detailed analytics show your improvement over time, highlighting strengths and areas for focused practice.'
    },
    {
      icon: '🌍',
      title: 'Multiple Dialects',
      description: 'Learn Modern Standard Arabic and regional dialects with native speaker audio examples.'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Practice anywhere, anytime with our responsive web app that works seamlessly on all devices.'
    },
    {
      icon: '⚡',
      title: 'Instant Feedback',
      description: 'Get immediate pronunciation scores and suggestions for improvement with our advanced AI analysis.'
    }
  ];

  const testimonials = [
    {
      text: '“Kalima has transformed how I learn Arabic. The instant feedback on my pronunciation has accelerated my progress tremendously.”',
      author: "Sarah M.",
      role: "Language Student"
    },
    {
      text: '“As an Arabic teacher, I recommend Kalima to all my students. The AI feedback is surprisingly accurate and helpful.”',
      author: "Ahmed K.",
      role: "Arabic Teacher"
    },
    {
      text: '“I&apos;ve tried many language apps, but none focus on pronunciation like Kalima. It&apos;s exactly what I needed to improve my speaking.”',
      author: "Maria L.",
      role: "Business Professional"
    }
  ];

  const stats = [
    { value: '95%', label: 'Pronunciation Accuracy' },
    { value: '10K+', label: 'Words &amp; Phrases' },
    { value: '50+', label: 'Interactive Lessons' },
    { value: '24/7', label: 'AI Tutor Available' }
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="font-arabic text-5xl mb-4">كليمة</div>
          <div className="text-sm opacity-80">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isNavScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className={`font-arabic text-xl font-bold transition-colors ${
              isNavScrolled ? 'text-blue-600' : 'text-white'
            }`}>
              كليمة Kalima
            </div>
            <div className="hidden md:flex space-x-8">
              {['Features', 'Demo', 'Pricing', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`font-medium transition-colors hover:text-blue-600 ${
                    isNavScrolled ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center relative overflow-hidden">
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-white/10 text-6xl font-arabic animate-bounce">مرحبا</div>
        <div className="absolute top-60 right-10 text-white/10 text-6xl font-arabic animate-bounce delay-1000">شكرا</div>
        <div className="absolute bottom-20 left-20 text-white/10 text-6xl font-arabic animate-bounce delay-2000">أهلا</div>
        
        <div className="container mx-auto px-4 text-center text-white z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Master Arabic Speaking
          </h1>
          <div className="font-arabic text-2xl md:text-4xl mb-6 opacity-95" dir="rtl">
            تعلم النطق العربي الصحيح
          </div>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Learn Arabic with AI-powered voice feedback. Perfect your pronunciation with real-time analysis and personalized coaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* The onClick handler is now connected to the onGetStarted prop */}
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-xl flex items-center justify-center"
            >
              Try Free Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 backdrop-blur-sm border border-white/30"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
            <p className="max-w-xl mx-auto text-gray-600">
              Explore the key features that make Kalima your best Arabic pronunciation tutor.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {features.map(({ icon, title, description }) => (
              <div key={title} className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-2xl transition-shadow">
                <div className="text-5xl mb-6">{icon}</div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Try a Demo</h2>
          <p className="mb-6 text-gray-700">
            Click the button below to simulate recording your voice and getting instant AI feedback.
          </p>
          <button
            onClick={handleDemo}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition"
          >
            <Mic className="mr-2 w-6 h-6" />
            Record & Analyze
          </button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
          {testimonials.map(({ text, author, role }, i) => (
            <blockquote
              key={i}
              className="mb-10 bg-white rounded-lg p-8 shadow-md italic text-gray-700 relative"
            >
              <p className="mb-4">{text}</p>
              <footer className="font-semibold text-gray-900">
                {author}, <span className="text-sm font-normal text-gray-600">{role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition">
                <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
                <div className="text-gray-600 font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white text-center">
        <div className="container mx-auto px-4 max-w-xl">
          <h2 className="text-3xl font-bold mb-6">Stay Updated</h2>
          <p className="mb-6 opacity-90">
            Join our mailing list to get the latest updates about Kalima’s launch and new features.
          </p>
          <button
            onClick={handleJoinBeta}
            className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Join Beta
          </button>
        </div>
      </section>

      {/* Modal */}
      {modalContent && (
        <div
          onClick={() => setModalContent(null)}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg max-w-md w-full p-6 text-gray-900"
          >
            <h3 id="modal-title" className="text-xl font-semibold mb-4">
              {modalContent.title}
            </h3>
            <p id="modal-description" className="mb-6 whitespace-pre-wrap">
              {modalContent.body}
            </p>
            <button
              onClick={() => setModalContent(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

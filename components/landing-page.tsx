'use client';

import React, { useState, useEffect } from 'react';
import { Mic, Play, ArrowRight } from 'lucide-react';

// Define the type for the props that this component will receive.
// This tells TypeScript that LandingPage expects a function called `onGetStarted`.
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
      body: "A beta signup form would appear here. We'd collect your email and send you early access when available."
    });
  };

  const features = [
    {
      icon: '🎯',
      title: 'AI-Powered Pronunciation',
      description: 'Advanced speech recognition technology analyzes your Arabic pronunciation in real-time, providing instant feedback and corrections.'
    },
    {
      icon: '�',
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
      text: `&quot;Kalima has transformed how I learn Arabic. The instant feedback on my pronunciation has accelerated my progress tremendously.&quot;`,
      author: "Sarah M.",
      role: "Language Student"
    },
    {
      text: `&quot;As an Arabic teacher, I recommend Kalima to all my students. The AI feedback is surprisingly accurate and helpful.&quot;`,
      author: "Ahmed K.",
      role: "Arabic Teacher"
    },
    {
      text: `&quot;I've tried many language apps, but none focus on pronunciation like Kalima. It's exactly what I needed to improve my speaking.&quot;`,
      author: "Maria L.",
      role: "Business Professional"
    }
  ];

  const stats = [
    { value: '95%', label: 'Pronunciation Accuracy' },
    { value: '10K+', label: 'Words & Phrases' },
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
            Master Arabic Pronunciation
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
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Why Choose Kalima?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Revolutionary AI technology meets traditional Arabic learning methods
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border-t-4 border-blue-500"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Try It Now</h2>
          <p className="text-lg mb-12 opacity-90 max-w-2xl mx-auto">
            Experience the power of AI-driven Arabic pronunciation learning
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="font-arabic text-4xl md:text-5xl font-bold mb-4" dir="rtl">
              مرحبا
            </div>
            <div className="text-lg mb-8 opacity-80">
              mar-ha-ban (Hello)
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDemo}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105 border border-white/30 flex items-center justify-center"
              >
                <Mic className="mr-2 w-5 h-5" />
                Record Your Voice
              </button>
              <button
                onClick={handlePlayExample}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105 border border-white/30 flex items-center justify-center"
              >
                <Play className="mr-2 w-5 h-5" />
                Hear Example
              </button>
            </div>
          </div>

          <p className="mt-8 opacity-80">
            Click the microphone and say &quot;Marhaban&quot; - our AI will analyze your pronunciation!
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of learners mastering Arabic pronunciation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg relative">
                <div className="text-4xl text-blue-500 absolute -top-2 left-6">&quot;</div>
                <p className="text-gray-600 italic mb-6 pt-4">{testimonial.text}</p>
                <div className="font-semibold text-blue-600">
                  {testimonial.author}
                </div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Ready to Master Arabic?</h2>
          <p className="text-lg mb-12 max-w-2xl mx-auto opacity-90">
            Join our beta program and be among the first to experience the future of Arabic language learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleJoinBeta}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              Join Beta Program
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 backdrop-blur-sm border border-white/30">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {['About', 'Privacy', 'Terms', 'Support', 'Blog'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="text-center text-gray-400">
            © 2024 Kalima. All rights reserved. Made with ❤️ for Arabic learners worldwide.
          </div>
        </div>
      </footer>

      {/* Modal Dialog */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full transform transition-all animate-slide-up">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{modalContent.title}</h3>
            <p className="text-gray-600 mb-6">{modalContent.body}</p>
            <button
              onClick={() => setModalContent(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg w-full transition-colors"
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
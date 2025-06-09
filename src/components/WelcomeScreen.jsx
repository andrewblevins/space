import React, { useState, useEffect } from 'react';
import InfoModal from './InfoModal';

const WelcomeScreen = ({ onGetStarted }) => {
  // Reset any localStorage welcome flag when component mounts
  useEffect(() => {
    localStorage.removeItem('space_skip_welcome');
  }, []);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [skipInFuture, setSkipInFuture] = useState(false);

  const features = [
    {
      icon: "👥",
      title: "Multiple AI Perspectives",
      description: "Create advisors with different expertise and viewpoints to explore problems from every angle"
    },
    {
      icon: "🧠", 
      title: "Persistent Memory",
      description: "Your conversations build knowledge over time with smart tagging and cross-session references"
    },
    {
      icon: "🔍",
      title: "Deep Analysis",
      description: "Get metaphor analysis and contextual insights that help you think differently about challenges"
    },
    {
      icon: "💼",
      title: "Professional Grade",
      description: "Export conversations, share advisor profiles, and integrate with your existing workflow"
    }
  ];

  // Auto-rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 gap-4 h-full">
          {Array.from({ length: 120 }).map((_, i) => (
            <div 
              key={i} 
              className="border border-green-400/20 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '3s' }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-400 rounded flex items-center justify-center text-black font-bold">
            S
          </div>
          <span className="text-xl font-semibold">SPACE Terminal</span>
        </div>
        
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
          title="About SPACE Terminal"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Hero section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            <span className="text-white">Think</span>{' '}
            <span className="text-green-400">Deeper</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            An experimental interface for{' '}
            <span className="text-green-400 font-semibold">conversations with AI advisors</span>
          </p>
          
          <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-6 mb-8 backdrop-blur-sm">
            <p className="text-green-300 text-lg">
              SPACE stands for <span className="font-semibold text-green-400">Simple Perspective-Augmenting Conversation Environment</span>
            </p>
          </div>
        </div>

        {/* Feature showcase */}
        <div className="w-full max-w-3xl mx-auto mb-16">
          <div className="bg-gray-900/50 border border-green-400/20 rounded-lg p-8 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">{features[currentFeatureIndex].icon}</div>
              <h3 className="text-2xl font-semibold text-green-400 mb-2">
                {features[currentFeatureIndex].title}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {features[currentFeatureIndex].description}
              </p>
            </div>
            
            {/* Feature indicators */}
            <div className="flex justify-center gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeatureIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeatureIndex 
                      ? 'bg-green-400 scale-110' 
                      : 'bg-green-400/30 hover:bg-green-400/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">Your data stays local</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm">~2¢ per conversation</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (skipInFuture) {
                localStorage.setItem('space_skip_welcome', 'true');
              }
              onGetStarted();
            }}
            className="bg-green-400 text-black px-8 py-4 rounded-lg text-xl font-semibold hover:bg-green-300 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-400/20"
          >
            Get Started
          </button>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <input
              type="checkbox"
              id="skip-welcome"
              checked={skipInFuture}
              onChange={(e) => setSkipInFuture(e.target.checked)}
              className="rounded border-green-400 text-green-400 focus:ring-green-400"
            />
            <label htmlFor="skip-welcome" className="text-gray-400 text-sm">
              Don't show this welcome screen again
            </label>
          </div>
          
          <p className="text-gray-400 text-sm mt-4">
            You'll need API keys from Anthropic and OpenAI to begin
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-gray-500">
        <p className="text-sm">
          Created by{' '}
          <a 
            href="https://www.andrewshadeblevins.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            Andrew Blevins
          </a>{' '}
          • v0.2.2
        </p>
      </footer>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
};

export default WelcomeScreen;
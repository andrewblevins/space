import React, { useState, useEffect } from 'react';
import InfoModal from './InfoModal';

const WelcomeScreen = ({ onGetStarted }) => {
  // Reset any localStorage welcome flag when component mounts
  useEffect(() => {
    localStorage.removeItem('space_skip_welcome');
  }, []);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [skipInFuture, setSkipInFuture] = useState(false);

  const features = [
    {
      icon: "🎭",
      title: "Generate and swap high-quality advisors instantly",
      description: "Create a constellation of advisors—each with their own expertise, viewpoint, or lineage"
    },
    {
      icon: "💬", 
      title: "Reference previous discussions in chat",
      description: "Your advisors remember context across sessions, building understanding over time"
    },
    {
      icon: "🤖",
      title: "Automated advisor recommendations in the side panel",
      description: "Get intelligent suggestions for new advisors based on your conversation context"
    },
    {
      icon: "🏷️",
      title: "Track and search based on topic with automatic knowledge tags",
      description: "Organize and find your conversations with intelligent topic categorization"
    },
    {
      icon: "🔮",
      title: "Metaphor tracking makes the structure of thought visible",
      description: "Discover patterns and connections in your thinking process"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 gap-8 h-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div 
              key={i} 
              className="border border-green-400/10"
              style={{ opacity: Math.random() * 0.3 + 0.1 }}
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
            <span className="text-white">SPACE</span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-green-400 font-light mb-8 tracking-wide">
            Change Your Minds
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            SPACE is a terminal interface for navigating complex situations with multiple AI advisors. 
            Instead of getting one perspective from a single AI assistant, you create a{' '}
            <span className="text-green-400 font-semibold">constellation of advisors</span>—each with their own expertise, viewpoint, or lineage.
          </p>
          
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4 mb-8 backdrop-blur-sm">
            <p className="text-green-300/80 text-sm font-light">
              Currently in beta • Multiple AI advisors • Distinct perspectives • Persistent memory
            </p>
          </div>
        </div>

        {/* Feature showcase */}
        <div className="w-full max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-900/30 border border-green-400/10 rounded-lg p-4 backdrop-blur-sm hover:border-green-400/30 transition-colors duration-300">
                <div className="text-left">
                  <div className="text-2xl mb-2 opacity-80">{feature.icon}</div>
                  <h3 className="text-sm font-medium text-green-400 mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300/80 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Local data</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>~2¢ per chat</span>
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
            className="bg-green-400 text-black px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-300 transition-all duration-200 shadow-lg hover:shadow-green-400/10 mb-6"
          >
            Begin Exploration
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <input
              type="checkbox"
              id="skip-welcome"
              checked={skipInFuture}
              onChange={(e) => setSkipInFuture(e.target.checked)}
              className="rounded border-green-400/50 text-green-400 focus:ring-green-400/30"
            />
            <label htmlFor="skip-welcome" className="text-gray-500 text-xs">
              Skip welcome screen in future
            </label>
          </div>
          
          <p className="text-gray-600 text-xs">
            Requires Anthropic and OpenAI API keys
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
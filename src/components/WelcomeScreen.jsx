import React, { useState, useEffect } from 'react';
import InfoModal from './InfoModal';

const WelcomeScreen = ({ onGetStarted }) => {
  // Reset any localStorage welcome flag when component mounts
  useEffect(() => {
    localStorage.removeItem('space_skip_welcome');
  }, []);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [skipInFuture, setSkipInFuture] = useState(false);

  const features = [];

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
            Change your minds
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Navigate complexity with a board of AI advisors.
          </p>
          
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4 mb-8 backdrop-blur-sm">
            <p className="text-green-300/80 text-sm font-light">
              Currently in beta
            </p>
          </div>
        </div>


        {/* CTA section */}
        <div className="text-center max-w-2xl mx-auto">
          <button
            onClick={() => {
              onGetStarted();
            }}
            className="bg-green-400 text-black px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-300 transition-all duration-200 shadow-lg hover:shadow-green-400/10"
          >
            Start Exploring
          </button>
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
          • Protocol by{' '}
          <a 
            href="https://www.andrewshadeblevins.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            Andrew Blevins
          </a>{' '}
          and Jason Ganz • v0.2.3
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
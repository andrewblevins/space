import React, { useState, useEffect } from 'react';
import InfoModal from './InfoModal';
import PrivacyPolicy from './PrivacyPolicy';
import { useAuthSafe } from '../contexts/AuthContext';

const WelcomeScreen = ({ onGetStarted }) => {
  // Reset any localStorage welcome flag when component mounts
  useEffect(() => {
    localStorage.removeItem('space_skip_welcome');
  }, []);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuthSafe();

  const handleGetStarted = async () => {
    // If auth is enabled and signInWithGoogle exists, use it
    if (signInWithGoogle) {
      try {
        setLoading(true);
        await signInWithGoogle();
      } catch (error) {
        console.error('Sign in error:', error);
      } finally {
        setLoading(false);
      }
    } else if (onGetStarted) {
      // Legacy mode - just proceed to the app
      onGetStarted();
    }
  };

  const features = [];

  return (
    <div className="min-h-screen bg-black text-term-400 flex flex-col relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 gap-8 h-full">
          {Array.from({ length: 64 }).map((_, i) => (
            <div 
              key={i} 
              className="border border-term-500/10"
              style={{ opacity: Math.random() * 0.3 + 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sage-500 rounded flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="text-xl font-semibold text-sage-400">SPACE Terminal</span>
        </div>
        
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-term-500 text-term-400 hover:bg-term-500 hover:text-black transition-colors"
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
            <span className="text-sage-400">SPACE</span>
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-term-400 font-light mb-8 tracking-wide">
            Change your minds
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Think through anything with multiple AI perspectives.
          </p>
          
          <div className="bg-term-500/5 border border-term-500/20 rounded-lg p-4 mb-8 backdrop-blur-sm">
            <p className="text-term-300/80 text-sm font-light">
              Currently in beta
            </p>
          </div>
        </div>


        {/* CTA section */}
        <div className="text-center max-w-2xl mx-auto">
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className="bg-term-500 text-black px-8 py-3 rounded-lg text-lg font-medium hover:bg-term-400 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-term-500/10 mx-auto"
          >
            {loading ? 'Loading...' : 'Explore'}
          </button>
          
          <p className="text-xs text-gray-500 mt-4 max-w-md mx-auto">
            By continuing, you agree to our{' '}
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="text-term-400 hover:text-term-300 underline"
            >
              Privacy Policy
            </button>
            . We use cookies and analytics to improve your experience.
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
            className="text-term-400 hover:text-term-300 transition-colors"
          >
            Andrew Blevins
          </a>{' '}
          • Protocol by{' '}
          <a 
            href="https://www.andrewshadeblevins.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-term-400 hover:text-term-300 transition-colors"
          >
            Andrew Blevins
          </a>{' '}
          and{' '}
          <a 
            href="https://x.com/jasnonaz/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-term-400 hover:text-term-300 transition-colors"
          >
            Jason Ganz
          </a>{' '}
          • v0.2.4
        </p>
        <p className="text-xs mt-2">
          <button 
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-term-400 hover:text-term-300 transition-colors underline"
          >
            Privacy Policy
          </button>
        </p>
      </footer>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
      
      <PrivacyPolicy
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </div>
  );
};

export default WelcomeScreen;
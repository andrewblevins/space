import React, { useState, useEffect } from 'react';
import { setEncrypted } from '../utils/secureStorage';
import InfoModal from './InfoModal';

const ApiKeySetup = ({ onComplete }) => {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showApiKeysInfoModal, setShowApiKeysInfoModal] = useState(false);

  useEffect(() => {
    // Check for auth error message from previous session
    const authError = sessionStorage.getItem('auth_error');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('auth_error');
    }

    // Automation helper: expose functions globally for Puppeteer
    window.spaceAutomation = {
      setApiKeys: (key) => {
        setOpenrouterKey(key);
        setError('');
        return { success: true };
      },
      submitForm: () => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
          return { success: true };
        }
        return { success: false, error: 'Form not found' };
      },
      getCurrentState: () => ({
        openrouterKey: openrouterKey ? '***set***' : '',
        error,
        hasError: !!error
      })
    };

    // Check for environment variables (for development)
    try {
      const envOpenrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (envOpenrouterKey) {
        console.log('🔑 Found OpenRouter API key in environment, auto-filling...');
        setOpenrouterKey(envOpenrouterKey);
      }
    } catch (error) {
      console.log('No environment variables found for auto-fill');
    }
  }, [openrouterKey, error]);

  const handleInputChange = (e) => {
    setError('');
    setOpenrouterKey(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!openrouterKey) {
      setError('OpenRouter API key is required');
      return;
    }

    if (!openrouterKey.startsWith('sk-or-v1-')) {
      setError('Invalid OpenRouter API key format. It should start with "sk-or-v1-"');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Test the API key with a minimal request
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SPACE Terminal'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API validation failed (${response.status})`);
      }

      // Save the key
      await setEncrypted('space_openrouter_key', openrouterKey);

      onComplete({ openrouterKey });
    } catch (error) {
      console.error('API key validation error:', error);
      setError(`API key validation failed: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

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
        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white">
            Connect Your AI Key
          </h1>
          <p className="text-lg text-gray-300 mb-2 leading-relaxed">
            SPACE Terminal uses OpenRouter to access AI models
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-400/50 text-red-400 p-4 mb-6 rounded-lg backdrop-blur-sm max-w-xl w-full">
            {error}
          </div>
        )}

        <div className="w-full max-w-xl space-y-6">
          {/* Instructions */}
          <div className="bg-gray-900/30 border border-green-400/10 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-green-400 font-medium mb-4 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Setup (2 minutes)
            </h3>
            <ol className="text-gray-300 space-y-3 list-decimal list-inside">
              <li>
                Go to{' '}
                <a 
                  href="https://openrouter.ai/keys" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-green-400 hover:text-green-300 underline transition-colors"
                >
                  openrouter.ai/keys
                </a>
              </li>
              <li>Create a free account (Google sign-in available)</li>
              <li>Click "Create Key" and copy it</li>
              <li>Paste it below</li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="api-key-form">
            <div>
              <label className="block mb-2 text-green-400 font-medium text-sm">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={openrouterKey}
                onChange={handleInputChange}
                className="w-full bg-black text-green-400 border border-green-400/50 p-3 rounded focus:outline-none focus:border-green-400 transition-colors font-mono"
                placeholder="sk-or-v1-..."
                data-testid="openrouter-api-key"
                id="openrouter-api-key"
                autoFocus
              />
            </div>

            <button 
              type="submit"
              disabled={isValidating}
              className="w-full bg-green-400 text-black py-3 px-6 rounded-lg font-medium hover:bg-green-300 transition-all duration-200 shadow-lg hover:shadow-green-400/10 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="save-api-keys-button"
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Validating...
                </span>
              ) : (
                'Continue to SPACE Terminal'
              )}
            </button>
          </form>
          
          <div className="text-center">
            <button
              onClick={() => setShowApiKeysInfoModal(true)}
              className="text-gray-400 hover:text-green-400 text-sm transition-colors"
            >
              What is an API key? Why do I need this?
            </button>
          </div>
          
          {/* Cost info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              <strong className="text-gray-400">Typical usage:</strong> $5-15/month depending on how much you chat
            </p>
            <p className="mt-1">
              You only pay for what you use • No subscriptions
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-gray-500 text-sm">
          Your key is encrypted and stored locally in your browser •{' '}
          <a 
            href="/privacy.html" 
            className="text-green-400/70 hover:text-green-400 transition-colors"
          >
            Privacy Policy
          </a>
        </p>
      </footer>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* API Keys Info Modal */}
      {showApiKeysInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-green-400/20 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">About API Keys</h2>
                <button
                  onClick={() => setShowApiKeysInfoModal(false)}
                  className="text-gray-400 hover:text-green-400 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-green-400 font-medium mb-2">What is an API key?</h3>
                  <p className="text-sm leading-relaxed">
                    An API key is like a password that lets SPACE Terminal communicate with AI services on your behalf. 
                    It's how you get access to AI models like Claude and GPT.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-green-400 font-medium mb-2">Why OpenRouter?</h3>
                  <p className="text-sm leading-relaxed">
                    OpenRouter is a service that gives you access to many AI models through a single key. 
                    Instead of getting separate accounts with Anthropic, OpenAI, and others, you just need one OpenRouter account.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-green-400 font-medium mb-2">Is it safe?</h3>
                  <p className="text-sm leading-relaxed">
                    Yes. Your API key is encrypted and stored only on your device. 
                    SPACE Terminal never sends your key to our servers—it goes directly from your browser to OpenRouter.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-green-400 font-medium mb-2">How much does it cost?</h3>
                  <p className="text-sm leading-relaxed">
                    OpenRouter offers a free tier with some credits to get started. 
                    After that, you pay per message based on the AI model used. 
                    Light usage is typically $5-15/month.
                  </p>
                </div>
                
                <div className="pt-4 border-t border-green-400/20">
                  <a 
                    href="https://openrouter.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 text-sm transition-colors"
                  >
                    Learn more at openrouter.ai →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeySetup;

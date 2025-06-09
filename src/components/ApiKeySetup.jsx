import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { setEncrypted } from '../utils/secureStorage';
import InfoModal from './InfoModal';

const ApiKeySetup = ({ onComplete }) => {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    // Check for auth error message from previous session
    const authError = sessionStorage.getItem('auth_error');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('auth_error'); // Clear the message
    }

    // Automation helper: expose functions globally for Puppeteer
    window.spaceAutomation = {
      setApiKeys: (anthropicKey, openaiKey) => {
        setAnthropicKey(anthropicKey);
        setOpenaiKey(openaiKey);
        setError(''); // Clear any errors
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
        anthropicKey: anthropicKey ? '***set***' : '',
        openaiKey: openaiKey ? '***set***' : '',
        error,
        hasError: !!error
      })
    };

    // Check for environment variables (for development)
    try {
      const envAnthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const envOpenaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (envAnthropicKey && envOpenaiKey) {
        console.log('🔑 Found API keys in environment, auto-filling...');
        setAnthropicKey(envAnthropicKey);
        setOpenaiKey(envOpenaiKey);
      }
    } catch (error) {
      // Environment variables not available, continue normally
      console.log('No environment variables found for auto-fill');
    }
  }, [anthropicKey, openaiKey, error]);

  const handleInputChange = (setter) => (e) => {
    setError(''); // Clear error when user starts typing
    setter(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!anthropicKey || !openaiKey) {
      setError('Both API keys are required');
      return;
    }

    if (!anthropicKey.startsWith('sk-ant-')) {
      setError('Invalid Anthropic API key format');
      return;
    }

    if (!openaiKey.startsWith('sk-')) {
      setError('Invalid OpenAI API key format');
      return;
    }

    try {
      const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      await setEncrypted('space_anthropic_key', anthropicKey);
      await setEncrypted('space_openai_key', openaiKey);

      onComplete({ anthropicKey, openaiKey });
    } catch (error) {
      setError(`API key validation failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 flex flex-col relative overflow-hidden">
      {/* Subtle background pattern matching welcome screen */}
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
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white">
            API Configuration
          </h1>
          <p className="text-lg text-gray-300 mb-6 leading-relaxed">
            Connect your AI providers to begin exploring with SPACE
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-400/50 text-red-400 p-4 mb-6 rounded-lg backdrop-blur-sm max-w-2xl w-full">
            {error}
          </div>
        )}

        <div className="w-full max-w-2xl space-y-8">
          {/* Instructions */}
          <div className="bg-gray-900/30 border border-green-400/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Anthropic (Claude)
                </h3>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline transition-colors">console.anthropic.com</a></li>
                  <li>Sign up or log in</li>
                  <li>Create a new API key</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  OpenAI
                </h3>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline transition-colors">platform.openai.com</a></li>
                  <li>Sign up or log in</li>
                  <li>Create a new API key</li>
                </ol>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-green-400/20">
              <p className="text-gray-400 text-sm text-center">
                ~2¢ per message • $5 per account gives you hours of conversation
              </p>
            </div>
          </div>

                     {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-6" data-testid="api-key-form">
             <div className="text-center mb-4">
               <p className="text-gray-400 text-xs">* Both API keys are required</p>
             </div>
             <div className="space-y-4">
               <div>
                 <label className="block mb-2 text-green-400 font-medium text-sm">Anthropic API Key *</label>
                 <input
                   type="password"
                   value={anthropicKey}
                   onChange={handleInputChange(setAnthropicKey)}
                   className="w-full bg-black text-green-400 border border-green-400/50 p-3 rounded focus:outline-none focus:border-green-400 transition-colors"
                   placeholder="sk-ant-..."
                   data-testid="anthropic-api-key"
                   id="anthropic-api-key"
                 />
               </div>

               <div>
                 <label className="block mb-2 text-green-400 font-medium text-sm">OpenAI API Key *</label>
                 <input
                   type="password"
                   value={openaiKey}
                   onChange={handleInputChange(setOpenaiKey)}
                   className="w-full bg-black text-green-400 border border-green-400/50 p-3 rounded focus:outline-none focus:border-green-400 transition-colors"
                   placeholder="sk-..."
                   data-testid="openai-api-key"
                   id="openai-api-key"
                 />
               </div>
             </div>

            <button 
              type="submit"
              className="w-full bg-green-400 text-black py-3 px-6 rounded-lg font-medium hover:bg-green-300 transition-all duration-200 shadow-lg hover:shadow-green-400/10"
              data-testid="save-api-keys-button"
            >
              Continue to SPACE Terminal
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="text-gray-500 text-sm">
          Your keys are encrypted and stored locally • 
          <span className="text-green-400 ml-1">Privacy-focused design</span>
        </p>
      </footer>

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
};

export default ApiKeySetup; 
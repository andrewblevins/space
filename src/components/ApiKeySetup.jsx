import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { setEncrypted } from '../utils/secureStorage';
import InfoModal from './InfoModal';

const ApiKeySetup = ({ onComplete }) => {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [error, setError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showApiKeysInfoModal, setShowApiKeysInfoModal] = useState(false);

  useEffect(() => {
    // Check for auth error message from previous session
    const authError = sessionStorage.getItem('auth_error');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('auth_error'); // Clear the message
    }

    // Automation helper: expose functions globally for Puppeteer
    window.spaceAutomation = {
      setApiKeys: (anthropicKey, openaiKey, openrouterKey) => {
        setAnthropicKey(anthropicKey);
        setOpenaiKey(openaiKey);
        if (openrouterKey) setOpenrouterKey(openrouterKey);
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
        openrouterKey: openrouterKey ? '***set***' : '',
        error,
        hasError: !!error
      })
    };

    // Check for environment variables (for development)
    try {
      const envAnthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const envOpenaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const envOpenrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      if (envAnthropicKey && envOpenaiKey) {
        console.log('🔑 Found API keys in environment, auto-filling...');
        setAnthropicKey(envAnthropicKey);
        setOpenaiKey(envOpenaiKey);
        if (envOpenrouterKey) {
          setOpenrouterKey(envOpenrouterKey);
        }
      }
    } catch (error) {
      // Environment variables not available, continue normally
      console.log('No environment variables found for auto-fill');
    }
  }, [anthropicKey, openaiKey, openrouterKey, error]);

  const handleInputChange = (setter) => (e) => {
    setError(''); // Clear error when user starts typing
    setter(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!anthropicKey || !openaiKey) {
      setError('Anthropic and OpenAI API keys are required');
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

    if (openrouterKey && !openrouterKey.startsWith('sk-or-v1-')) {
      setError('Invalid OpenRouter API key format');
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
          model: 'claude-sonnet-4.5',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      await setEncrypted('space_anthropic_key', anthropicKey);
      await setEncrypted('space_openai_key', openaiKey);
      if (openrouterKey) {
        await setEncrypted('space_openrouter_key', openrouterKey);
      }

      onComplete({ anthropicKey, openaiKey, openrouterKey });
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
          <div className="text-center">
            <button
              onClick={() => setShowApiKeysInfoModal(true)}
              className="text-green-400 hover:text-green-300 underline text-sm transition-colors"
              title="Learn about API keys"
            >
              (What does this mean?)
            </button>
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-900/30 border border-green-400/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Anthropic (Claude) *
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
                  OpenAI *
                </h3>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline transition-colors">platform.openai.com</a></li>
                  <li>Sign up or log in</li>
                  <li>Create a new API key</li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  OpenRouter
                </h3>
                <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline transition-colors">openrouter.ai</a></li>
                  <li>Sign up or log in</li>
                  <li>Create a new API key</li>
                </ol>
                <p className="text-xs text-gray-400 mt-2">Optional • 200+ AI models</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-green-400/20">
              <p className="text-gray-400 text-sm text-center">
                <strong>Realistic costs:</strong> ~3-4¢ per message • Light usage: $5-12/month • Moderate: $15-30/month
              </p>
              <p className="text-gray-300 text-xs text-center mt-2">
                Higher than basic AI chat due to multi-model architecture, knowledge dossier, and advisor personas
              </p>
            </div>
          </div>

                     {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-6" data-testid="api-key-form">
             <div className="text-center mb-4">
               <p className="text-gray-400 text-xs">* Required: Anthropic and OpenAI • Optional: OpenRouter for additional models</p>
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

               <div>
                 <label className="block mb-2 text-green-400 font-medium text-sm">OpenRouter API Key <span className="text-gray-400">(Optional)</span></label>
                 <input
                   type="password"
                   value={openrouterKey}
                   onChange={handleInputChange(setOpenrouterKey)}
                   className="w-full bg-black text-green-400 border border-green-400/50 p-3 rounded focus:outline-none focus:border-green-400 transition-colors"
                   placeholder="sk-or-v1-..."
                   data-testid="openrouter-api-key"
                   id="openrouter-api-key"
                 />
                 <p className="text-xs text-gray-400 mt-1">Access 200+ AI models including Claude, GPT, Gemini, and more</p>
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

      {/* API Keys Info Modal */}
      {showApiKeysInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-green-400/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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
                  <h3 className="text-green-400 font-medium mb-2">What are API keys?</h3>
                  <p className="text-sm leading-relaxed">
                    API keys are secure authentication tokens that allow SPACE to communicate with AI providers on your behalf. 
                    Think of them as digital passwords that give our app permission to access AI services like Claude and GPT.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-green-400 font-medium mb-2">How SPACE uses your API keys</h3>
                  <p className="text-sm leading-relaxed">
                    Claude (Anthropic) powers main conversations and advisor generation. GPT (OpenAI) handles background analysis. OpenRouter (optional) provides access to 200+ additional models for experimentation and cost optimization.
                  </p>                 
                </div>
                
                <div>
                  <h3 className="text-green-400 font-medium mb-2">Your privacy & security</h3>
                  <p className="text-sm leading-relaxed">
                    Your API keys are encrypted and stored locally on your device. SPACE never sends your keys to external servers—
                    they're only used directly between your browser and the AI providers.
                  </p>
                </div>
                
                <div className="pt-4 border-t border-green-400/20">
                  <p className="text-xs text-gray-400">
                    If you don't have API keys yet, follow the instructions below to get free accounts with both providers.
                  </p>
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
import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';

const ApiKeySetup = ({ onComplete }) => {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for auth error message from previous session
    const authError = sessionStorage.getItem('auth_error');
    if (authError) {
      setError(authError);
      sessionStorage.removeItem('auth_error'); // Clear the message
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 ApiKeySetup - Submitting keys:', {
      anthropicKeyStart: anthropicKey.substring(0, 10) + '...',
      openaiKeyStart: openaiKey.substring(0, 10) + '...',
      anthropicKeyLength: anthropicKey.length,
      openaiKeyLength: openaiKey.length
    });

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
      console.log('🔍 ApiKeySetup - Testing Anthropic API with endpoint:', getApiEndpoint());
      
      const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      console.log('🔍 ApiKeySetup - API Response:', {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 ApiKeySetup - API Error:', errorText);
        await handleApiError(response);
      }

      console.log('🔍 ApiKeySetup - Storing keys in localStorage');
      localStorage.setItem('space_anthropic_key', anthropicKey);
      localStorage.setItem('space_openai_key', openaiKey);

      onComplete({ anthropicKey, openaiKey });
    } catch (error) {
      console.error('🔍 ApiKeySetup - Error:', error);
      setError(`API key validation failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl mb-4">API Key Setup Required</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-400 text-red-400 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Anthropic API Key:</label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="w-full bg-black text-green-400 border border-green-400 p-2"
              placeholder="sk-ant-..."
            />
          </div>

          <div>
            <label className="block mb-2">OpenAI API Key:</label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full bg-black text-green-400 border border-green-400 p-2"
              placeholder="sk-..."
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-green-400 text-black py-2 px-4 hover:bg-green-300 transition-colors"
          >
            Save API Keys
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeySetup; 
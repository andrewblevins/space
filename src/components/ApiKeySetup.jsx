import React, { useState } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';

const ApiKeySetup = ({ onComplete }) => {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState('');

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
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        throw new Error('Invalid Anthropic API key');
      }

      localStorage.setItem('space_anthropic_key', anthropicKey);
      localStorage.setItem('space_openai_key', openaiKey);

      onComplete({ anthropicKey, openaiKey });
    } catch (error) {
      setError(`API key validation failed: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-gray-900 p-6 rounded-lg border border-green-400 w-full max-w-md">
        <h2 className="text-green-400 text-xl mb-4">API Key Setup</h2>
        <p className="text-green-400 mb-6">
          SPACE Terminal requires API keys from Anthropic and OpenAI to function. 
          Your keys are stored locally and never sent to our servers.
        </p>
        
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-400 mb-2">Anthropic API Key</label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="w-full bg-black text-green-400 p-2 border border-green-400 focus:outline-none"
              placeholder="sk-ant-..."
            />
          </div>

          <div>
            <label className="block text-green-400 mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full bg-black text-green-400 p-2 border border-green-400 focus:outline-none"
              placeholder="sk-..."
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-green-400 border border-green-400 rounded hover:bg-green-400 hover:text-black"
          >
            Start SPACE Terminal
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeySetup; 
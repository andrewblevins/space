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
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl text-green-400 mb-4">Welcome to SPACE Terminal</h1>
        
        <p className="text-gray-300 mb-6">
          To start, you'll need API keys from two AI providers:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li><a href="https://console.anthropic.com/account/keys" target="_blank" className="text-green-400 hover:underline">Anthropic (Claude)</a> - Advanced reasoning and analysis</li>
            <li><a href="https://platform.openai.com/api-keys" target="_blank" className="text-green-400 hover:underline">OpenAI</a> - Background processing and metadata</li>
          </ul>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-400 mb-2">Anthropic API Key</label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              className="w-full bg-black text-green-400 p-2 rounded border border-green-400"
              placeholder="sk-ant-..."
            />
          </div>

          <div>
            <label className="block text-green-400 mb-2">OpenAI API Key</label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full bg-black text-green-400 p-2 rounded border border-green-400"
              placeholder="sk-..."
            />
          </div>

          {error && (
            <div className="text-red-400 mt-2">{error}</div>
          )}

          <button 
            type="submit"
            className="w-full bg-green-400 text-black py-2 rounded hover:bg-green-300 transition-colors"
          >
            Start
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeySetup; 
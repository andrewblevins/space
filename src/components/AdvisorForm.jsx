import React, { useState } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';

const generateAdvisorDescription = async (advisorName, onStream) => {
  try {
    const anthropicKey = localStorage.getItem('space_anthropic_key');
    if (!anthropicKey) {
      throw new Error('Anthropic API key not found');
    }

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
        messages: [{
          role: 'user',
          content: `You are generating a description of an AI advisor that will be used to summon that entity into a conversation. You will receive a name and you will write your description based on that name. Your description should be a paragraph spoken directly in the advisor's distinct voice and perspective. It should include a general self-description, any specific lineages, practices, or frameworks they embody, and how they tend to approach problems. Do not include the advisor's name in the description.

The advisor's name is ${advisorName}.`
        }],
        max_tokens: 500,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API Error: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let description = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.delta?.text || '';
            description += content;
            onStream(description);
          } catch (e) {
            console.error('Error parsing stream:', e);
          }
        }
      }
    }

    return description;
  } catch (error) {
    console.error('Error generating advisor description:', error);
    throw error;
  }
};

const AdvisorForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError('Enter an advisor name first');
      return;
    }
    
    if (description.trim()) {
      setError('Clear the description field before generating a new description');
      return;
    }
    
    try {
      setError('');
      await generateAdvisorDescription(name, (streamedText) => {
        setDescription(streamedText);
      });
    } catch (error) {
      setError('Failed to generate description: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg border border-green-400 w-96">
        <h2 className="text-green-400 text-xl mb-4">Add New Advisor</h2>
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Advisor name"
          className="w-full bg-black text-green-400 p-2 mb-4 border border-green-400 focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Advisor description"
          className="w-full h-40 bg-black text-green-400 p-2 mb-4 border border-green-400 focus:outline-none resize-none"
        />
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-green-400 border border-green-400 rounded hover:bg-green-400 hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 mx-2 text-yellow-400 border border-yellow-400 rounded hover:bg-yellow-400 hover:text-black"
          >
            Generate Description
          </button>
          <button
            onClick={() => onSubmit({ name, description })}
            className="px-4 py-2 text-green-400 border border-green-400 rounded hover:bg-green-400 hover:text-black"
          >
            Add Advisor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorForm; 
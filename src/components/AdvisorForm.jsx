import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { getDecrypted } from '../utils/secureStorage';

const generateAdvisorDescription = async (advisorName, onStream) => {
  try {
    const anthropicKey = await getDecrypted('space_anthropic_key');
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
        model: 'claude-3-7-sonnet-20250219',
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
      await handleApiError(response);
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

const AdvisorForm = ({ onSubmit, onCancel, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

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
    <div className="fixed inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center">
      <div className="bg-gray-100 p-6 rounded-lg border border-green-600 w-96 dark:bg-gray-900 dark:border-green-400">
        <h2 className="text-green-400 text-xl mb-4">Add New Advisor</h2>
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Advisor name"
          className="w-full bg-white text-gray-800 p-2 mb-4 border border-gray-300 focus:outline-none dark:bg-black dark:text-green-400 dark:border-green-400"
          autoComplete="off"
          spellCheck="true"
          data-role="advisor-name"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Advisor description"
          className="w-full h-40 bg-white text-gray-800 p-2 mb-4 border border-gray-300 focus:outline-none resize-none dark:bg-black dark:text-green-400 dark:border-green-400"
          autoComplete="off"
          spellCheck="true"
          data-role="advisor-description"
        />
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-green-600 border border-green-600 rounded hover:bg-green-600 hover:text-white dark:text-green-400 dark:border-green-400 dark:hover:bg-green-400 dark:hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 mx-2 text-yellow-600 border border-yellow-600 rounded hover:bg-yellow-600 hover:text-white dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-black"
          >
            Generate Description
          </button>
          <button
            onClick={() => onSubmit({ name, description })}
            className="px-4 py-2 text-green-600 border border-green-600 rounded hover:bg-green-600 hover:text-white dark:text-green-400 dark:border-green-400 dark:hover:bg-green-400 dark:hover:text-black"
          >
            Add Advisor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorForm; 
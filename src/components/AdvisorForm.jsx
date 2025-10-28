import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { ADVISOR_COLORS, getNextAvailableColor } from '../lib/advisorColors';
import { trackAdvisorCreated } from '../utils/analytics';

const generateAdvisorDescription = async (advisorName, onStream) => {
  try {
    const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
    
    // Get auth session if using auth system
    let session = null;
    if (useAuthSystem) {
      // Import the auth hook and get the current session
      const { useAuth } = await import('../contexts/AuthContext');
      // We need to get the session from React context, but we can't use hooks in async functions
      // Instead, we'll get it from supabase directly
      const { supabase } = await import('../lib/supabase');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      session = currentSession;
      if (!session) {
        throw new Error('Please sign in to generate advisor descriptions');
      }
    }

    // Use appropriate API endpoint
    const apiUrl = useAuthSystem 
      ? `${getApiEndpoint()}/api/chat/claude`  // Backend proxy
      : `${getApiEndpoint()}/v1/messages`;     // Direct API
    
    // Set up headers based on auth mode
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (useAuthSystem) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // In legacy mode, get API key from secure storage
      const { getDecryptedKey } = await import('../utils/secureStorage');
      const anthropicKey = await getDecryptedKey('anthropic');
      if (!anthropicKey) {
        throw new Error('Please set your Anthropic API key first');
      }
      headers['x-api-key'] = anthropicKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        messages: [{
          role: 'user',
          content: `You are generating a description of an AI advisor that will be used to instruct that entity in a conversation. You will receive a name and you will write instructions for that advisor based on that name. Your description should be written in second-person (addressing the advisor as "you") and should instruct them on their identity, expertise, and approach. Include instructions about any specific lineages, practices, or frameworks they should embody, and how they should approach problems. Imitate the advisor, writing in their own distinct voice, as gleaned from any writings or public communications they have made. Do not include the advisor's name in the description. Do not include action cues, stage directions, or physical descriptions.

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

const AdvisorForm = ({ onSubmit, onCancel, initialName = '', existingAdvisors = [] }) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    // Auto-assign color when form opens
    if (!selectedColor && existingAdvisors) {
      const nextColor = getNextAvailableColor(existingAdvisors);
      setSelectedColor(nextColor);
    }
  }, [existingAdvisors, selectedColor]);

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
      setIsGenerating(true);
      await generateAdvisorDescription(name, (streamedText) => {
        setDescription(streamedText);
      });
    } catch (error) {
      setError('Failed to generate description: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center">
      <div className="bg-gray-100 p-6 rounded-lg border border-green-600 w-96 max-h-[80vh] overflow-y-auto overflow-x-hidden dark:bg-gray-900 dark:border-green-400">
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
        
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (Optional):
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Leave blank to grow through assertions"
            className="w-full h-40 bg-white text-gray-800 p-2 mb-2 border border-gray-300 focus:outline-none resize-none dark:bg-black dark:text-green-400 dark:border-green-400"
            autoComplete="off"
            spellCheck="true"
            data-role="advisor-description"
          />
        </div>
        
        {/* Color Selection */}
        <div className="mb-4">
          <div className="space-y-2">
            {/* First row - 11 colors */}
            <div className="flex justify-between">
              {ADVISOR_COLORS.slice(0, 11).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full ${color} border-2 ${
                    selectedColor === color 
                      ? 'border-green-400 ring-2 ring-green-400 ring-opacity-50' 
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:border-green-400 transition-all duration-200 hover:scale-110`}
                />
              ))}
            </div>
            {/* Second row - 11 colors with same justify-between spacing */}
            <div className="flex justify-between">
              {ADVISOR_COLORS.slice(11, 22).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full ${color} border-2 ${
                    selectedColor === color 
                      ? 'border-green-400 ring-2 ring-green-400 ring-opacity-50' 
                      : 'border-gray-300 dark:border-gray-600'
                  } hover:border-green-400 transition-all duration-200 hover:scale-110`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Helpful tip */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">💡</span>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> You can start with just a name and develop your advisor's personality through conversations and assertions in the evaluation system.
            </p>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-green-600 border border-green-600 rounded hover:bg-green-600 hover:text-white dark:text-green-400 dark:border-green-400 dark:hover:bg-green-400 dark:hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 mx-2 text-yellow-600 border border-yellow-600 rounded hover:bg-yellow-600 hover:text-white dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Description'}
          </button>
          <button
            onClick={() => {
              trackAdvisorCreated(name);
              onSubmit({ name, description, color: selectedColor });
            }}
            disabled={isGenerating}
            className="px-4 py-2 text-green-600 border border-green-600 rounded hover:bg-green-600 hover:text-white dark:text-green-400 dark:border-green-400 dark:hover:bg-green-400 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Advisor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorForm; 
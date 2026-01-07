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
      const { supabase } = await import('../lib/supabase');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      session = currentSession;
      if (!session) {
        throw new Error('Please sign in to generate advisor descriptions');
      }
    }

    // Use OpenRouter API endpoint
    const apiUrl = useAuthSystem
      ? `${getApiEndpoint()}/api/chat/openrouter`  // Backend proxy
      : 'https://openrouter.ai/api/v1/chat/completions';  // Direct OpenRouter

    // Set up headers based on auth mode
    const headers = {
      'Content-Type': 'application/json'
    };

    if (useAuthSystem) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // In legacy mode, get OpenRouter API key from secure storage
      const { getDecryptedKey } = await import('../utils/secureStorage');
      const openrouterKey = await getDecryptedKey('openrouter');
      if (!openrouterKey) {
        throw new Error('Please set your OpenRouter API key first');
      }
      headers['Authorization'] = `Bearer ${openrouterKey}`;
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'SPACE Terminal';
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
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
            // OpenRouter uses OpenAI format: choices[0].delta.content
            const content = parsed.choices?.[0]?.delta?.content || '';
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

    try {
      setError('');
      setIsGenerating(true);
      setDescription(''); // Clear existing description before generating
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
    <div className="fixed inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-gray-100 p-6 rounded-lg border border-term-700 w-96 max-h-[80vh] overflow-y-auto overflow-x-hidden dark:bg-stone-900 dark:border-term-500">
        <h2 className="text-term-400 text-xl mb-4">Add New Advisor</h2>
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Advisor name"
          className="w-full bg-white text-gray-800 font-sans p-2 mb-4 border border-gray-300 focus:outline-none placeholder:text-amber-600 dark:placeholder:text-term-300 dark:bg-stone-900 dark:text-white dark:border-term-700"
          autoComplete="off"
          spellCheck="true"
          data-role="advisor-name"
        />
        
        <label className="block text-sm font-medium text-gray-700 dark:text-term-200 mb-2">
          Description (Optional):
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Leave blank to grow through assertions"
            className="w-full h-40 bg-white text-gray-800 font-sans p-2 mb-2 border border-gray-300 focus:outline-none resize-none placeholder:text-amber-600 dark:placeholder:text-term-300 dark:bg-stone-900 dark:text-white dark:border-term-700"
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
                      ? 'border-term-500 ring-2 ring-term-500 ring-opacity-50' 
                      : 'border-gray-300 dark:border-stone-600'
                  } hover:border-term-500 transition-all duration-200 hover:scale-110`}
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
                      ? 'border-term-500 ring-2 ring-term-500 ring-opacity-50' 
                      : 'border-gray-300 dark:border-stone-600'
                  } hover:border-term-500 transition-all duration-200 hover:scale-110`}
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
            className="px-4 py-2 text-term-600 border border-term-700 rounded hover:bg-term-700 hover:text-white dark:text-term-400 dark:border-term-500 dark:hover:bg-term-500 dark:hover:text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 mx-2 text-yellow-600 border border-yellow-600 rounded hover:bg-yellow-600 hover:text-white dark:text-yellow-400 dark:border-yellow-400 dark:hover:bg-yellow-400 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : (description.trim() ? 'Regenerate Description' : 'Generate Description')}
          </button>
          <button
            onClick={() => {
              trackAdvisorCreated(name);
              onSubmit({ name, description, color: selectedColor });
            }}
            disabled={isGenerating}
            className="px-4 py-2 text-term-600 border border-term-700 rounded hover:bg-term-700 hover:text-white dark:text-term-400 dark:border-term-500 dark:hover:bg-term-500 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Advisor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorForm; 
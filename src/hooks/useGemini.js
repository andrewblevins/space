import { useCallback } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { getDecrypted } from '../utils/secureStorage';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook providing Gemini API access with auth support
 */
export function useGemini() {
  // Always call hooks (hooks rules), but check auth enabled inside logic
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;

  const callGemini = useCallback(async (prompt, options = {}) => {
    if (useAuthSystem) {
      // Auth mode: use backend proxy
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${getApiEndpoint()}/api/chat/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          temperature: options.temperature || 0.1,
          maxOutputTokens: options.maxOutputTokens || 1000,
          ...options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error: ${response.status} ${errorData.message || 'Unknown error'}`);
      }

      return await response.json();
    } else {
      // Legacy mode: direct API access
      const geminiKey = await getDecrypted('space_gemini_key');
      if (!geminiKey) {
        throw new Error('Gemini API key not found');
      }

      // Transform to Gemini format for direct API call
      const geminiRequest = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.1,
          maxOutputTokens: options.maxOutputTokens || 1000
        }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Transform to standard format
      return {
        choices: [
          {
            message: {
              content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
            }
          }
        ],
        usage: {
          prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: data.usageMetadata?.totalTokenCount || 0
        },
        model: 'gemini-2.5-flash-lite'
      };
    }
  }, [useAuthSystem, session]);

  return { callGemini };
}
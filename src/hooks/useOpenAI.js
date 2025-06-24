import { useCallback, useRef } from 'react';
import { OpenAI } from 'openai';
import { getApiEndpoint } from '../utils/apiConfig';
import { getDecrypted } from '../utils/secureStorage';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook providing OpenAI API access with auth support
 */
export function useOpenAI() {
  // Always call hooks (hooks rules), but check auth enabled inside logic
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;
  
  // Keep a ref to the legacy OpenAI client for non-auth mode
  const legacyClientRef = useRef(null);

  const callOpenAI = useCallback(async (requestBody) => {
    if (useAuthSystem) {
      // Auth mode: use backend proxy
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${getApiEndpoint()}/api/chat/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      return await response.json();
    } else {
      // Legacy mode: direct API access
      if (!legacyClientRef.current) {
        const openaiKey = await getDecrypted('space_openai_key');
        if (!openaiKey) {
          throw new Error('OpenAI API key not found');
        }
        
        legacyClientRef.current = new OpenAI({
          apiKey: openaiKey,
          dangerouslyAllowBrowser: true
        });
      }

      return await legacyClientRef.current.chat.completions.create(requestBody);
    }
  }, [useAuthSystem, session]);

  // Helper method to mimic the OpenAI client interface
  const chat = {
    completions: {
      create: callOpenAI
    }
  };

  return { chat, callOpenAI };
}
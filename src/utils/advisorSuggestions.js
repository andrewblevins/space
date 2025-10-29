import { getApiEndpoint } from './apiConfig';
import { handleApiError } from './apiErrorHandler';
import { getNextAvailableColor } from '../lib/advisorColors';

export const generateAdvisorSuggestions = async (journalEntry, existingAdvisors = [], previousNames = []) => {
  try {
    const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';

    // Get auth session if using auth system
    let session = null;
    if (useAuthSystem) {
      const { supabase } = await import('../lib/supabase');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      session = currentSession;
      if (!session) {
        throw new Error('Please sign in to generate advisor suggestions');
      }
    }

    // Use OpenRouter API endpoint (works in both auth and legacy modes)
    const apiUrl = useAuthSystem
      ? `${getApiEndpoint()}/api/chat/openrouter`  // Backend proxy
      : 'https://openrouter.ai/api/v1/chat/completions';  // Direct OpenRouter API

    // Set up headers based on auth mode
    const headers = {
      'Content-Type': 'application/json'
    };

    if (useAuthSystem) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // In legacy mode, get OpenRouter API key from secure storage
      const { getDecryptedKey } = await import('./secureStorage');
      const openrouterKey = await getDecryptedKey('openrouter');
      if (!openrouterKey) {
        throw new Error('Please set your OpenRouter API key first');
      }
      headers['Authorization'] = `Bearer ${openrouterKey}`;
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'SPACE Terminal';
    }

    // Build exclusion list
    const excludeNames = previousNames.length > 0
      ? `\n\nIMPORTANT: Do NOT suggest any of these advisors (they were already suggested): ${previousNames.join(', ')}. Generate completely different advisors with different names and perspectives.`
      : '';

    const prompt = `The user has written this journal entry to begin exploring their thoughts:

${journalEntry}

Based on this entry, suggest 4-5 AI advisors who would provide valuable perspectives. For each advisor:${excludeNames}

1. Choose a name that represents a real or archetypal perspective (e.g., "Stoic Philosopher", "Systems Thinker", "Creative Disruptor", or specific figures like "Seneca" or "Ursula K. Le Guin")

2. Write a 2-3 sentence description in second-person that will instruct that advisor on their identity, expertise, and approach

3. Briefly explain (1 sentence) why this advisor is relevant to the user's entry

Look for:
- Tension points or contradictions that need multiple perspectives
- Domains of expertise mentioned or implied
- Emotional tone or challenges suggested
- Philosophical or practical frameworks that could help

Aim for diversity: different disciplines, approaches, and temperaments.

Return ONLY valid JSON with no additional text, in this exact format:
{
  "advisors": [
    {
      "name": "Advisor Name",
      "description": "You are... [second-person instructions]",
      "rationale": "Why this advisor is relevant to the entry"
    }
  ]
}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',  // OpenRouter model format
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    // OpenRouter uses OpenAI-style response format
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON response
    let parsedData;
    try {
      // Try to extract JSON if there's extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(content);
      }
    } catch (e) {
      console.error('Failed to parse advisor suggestions:', content);
      throw new Error('Failed to parse advisor suggestions from API response');
    }

    if (!parsedData.advisors || !Array.isArray(parsedData.advisors)) {
      throw new Error('Invalid response format from API');
    }

    // Assign colors and IDs to advisors
    const assignedColors = existingAdvisors.map(a => a.color).filter(Boolean);
    const suggestions = parsedData.advisors.map((advisor, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      name: advisor.name,
      description: advisor.description,
      rationale: advisor.rationale,
      color: getNextAvailableColor(assignedColors),
      active: false
    }));

    return suggestions;

  } catch (error) {
    console.error('Error generating advisor suggestions:', error);
    throw error;
  }
};

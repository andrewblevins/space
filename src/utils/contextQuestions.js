/**
 * Generate a context question based on journal entry and previous answers
 * Uses gpt-4o-mini via OpenRouter for lightweight question generation
 */
export async function generateContextQuestion(journalEntry, previousAnswers = []) {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';

  // Get auth session if using auth system
  let session = null;
  let headers = {
    'Content-Type': 'application/json'
  };

  if (useAuthSystem) {
    const { supabase } = await import('../lib/supabase');
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    session = currentSession;
    if (!session) {
      throw new Error('Not signed in');
    }
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    // Get OpenRouter API key from secure storage
    const { getDecryptedKey } = await import('./secureStorage');
    const openrouterKey = await getDecryptedKey('openrouter');
    if (!openrouterKey) {
      throw new Error('OpenRouter API key not set');
    }
    headers['Authorization'] = `Bearer ${openrouterKey}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'SPACE Terminal';
  }

  // Build prompt
  const previousContext = previousAnswers.length > 0
    ? `\n\nPrevious answers:\n${previousAnswers.join('\n\n')}`
    : '';

  const promptContent = `You are helping gather context for a conversation. The user has written an initial entry about a situation they want to explore. Ask ONE specific, factual follow-up question that will help understand their situation better.

Ask about concrete details like:
- Specific people involved
- What actually happened or was said
- Timeline or sequence of events
- Constraints or resources
- What they've already tried

Keep the question short and conversational. Do not make suggestions or offer advice.

Initial entry: ${journalEntry}${previousContext}

Respond with just the question, no preamble.`;

  const { getApiEndpoint } = await import('./apiConfig');
  const apiUrl = useAuthSystem
    ? `${getApiEndpoint()}/api/chat/openrouter`
    : 'https://openrouter.ai/api/v1/chat/completions';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a helpful assistant that asks clarifying questions.'
      }, {
        role: 'user',
        content: promptContent
      }],
      max_tokens: 100,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const question = data.choices[0].message.content.trim();

  return question;
}

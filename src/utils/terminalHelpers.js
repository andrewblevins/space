/** Helper functions used by the Terminal component. */

/**
 * Build a conversation context for Claude when the full history is too large.
 * @param {string} userMessage
 * @param {Array<object>} messages
 * @param {import('../lib/memory').MemorySystem} memory
 * @returns {Array<{role: string, content: string}>}
 */
export function buildConversationContext(userMessage, messages, memory) {
  const formatTimestamp = (iso) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  const relevantMessages = messages.length > 6 ? memory.retrieveRelevantContext(userMessage, messages.slice(0, -6)) : [];

  const recentMessages = messages
    .slice(-6)
    .filter(
      (msg) =>
        (msg.type === 'user' || msg.type === 'assistant') &&
        !msg.content.includes('Terminal v0.1') &&
        !msg.content.includes('Debug mode') &&
        !msg.content.includes('Claude API Call') &&
        msg.content.trim() !== '' &&
        msg.content !== userMessage
    );

  const contextParts = [];

  if (relevantMessages.length > 0) {
    contextParts.push('=== PREVIOUS RELEVANT USER MESSAGES ===');
    relevantMessages.forEach((msg) => {
      if (msg.timestamp) {
        contextParts.push(`[${formatTimestamp(msg.timestamp)}] ${msg.content}`);
      } else {
        contextParts.push(msg.content);
      }
    });
  }

  if (relevantMessages.length > 0 && recentMessages.length > 0) {
    contextParts.push('=====================================');
  }

  if (recentMessages.length > 0) {
    contextParts.push('=== MOST RECENT CONVERSATION ===');
    recentMessages.forEach((msg) => {
      const lines = msg.content.trim().split('\n');
      const formatted = lines.map((line, i) => (i === 0 ? `> ${line}` : `  ${line.trim()}`));
      contextParts.push(formatted.join('\n'));
    });
  }

  contextParts.push('=== CURRENT MESSAGE ===');
  contextParts.push(`> ${userMessage}`);

  return [
    {
      role: 'user',
      content: contextParts.join('\n\n'),
    },
  ];
}

/**
 * Analyze messages for metaphors and update state.
 */
export async function analyzeMetaphors(messages, { enabled, openaiClient, setMetaphors, debugMode, setMessages }) {
  if (!enabled || !openaiClient) return;
  const userMessages = messages.filter((m) => m.type === 'user').map((m) => m.content).join('\n');
  if (!userMessages.trim()) return;
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: "You are a helpful assistant that responds only in valid JSON format. Your response should be a JSON object with a 'metaphors' property containing an array of strings." },
        { role: 'user', content: `Analyze the following messages for conceptual metaphors. Extract metaphors like "life is a journey", "time is money", "mind as computer", etc.:\n\n${userMessages}\n\nRespond with JSON in this format: {"metaphors": ["metaphor1", "metaphor2", ...]}` },
      ],
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(response.choices[0].message.content);
    setMetaphors(result.metaphors || []);
  } catch (err) {
    if (debugMode && setMessages) {
      setMessages((prev) => [...prev, { type: 'system', content: `❌ Metaphor Analysis Error:\n${err.message}` }]);
    }
    console.error('Error analyzing metaphors:', err);
  }
}

/** Analyze the conversation for potential questions to ask. */
export async function analyzeForQuestions(messages, { enabled, openaiClient, setQuestions, debugMode, setMessages }) {
  if (!enabled || !openaiClient) return;
  const recentMessages = messages
    .slice(-3)
    .filter((m) => m.type === 'assistant' || m.type === 'user')
    .map((m) => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
  if (!recentMessages.trim()) return;
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: "You are a helpful assistant that responds only in valid JSON format. Your response should be a JSON object with a 'questions' property containing an array of strings." },
        { role: 'user', content: `Based on this recent conversation exchange, suggest 1-2 specific advisors who could add valuable perspective to this discussion.\n\nRecent conversation:\n${recentMessages}\n\nRespond with JSON: {"questions": ["Question 1", "Question 2"]}` },
      ],
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });
    const result = JSON.parse(response.choices[0].message.content);
    setQuestions(result.questions || []);
  } catch (err) {
    if (debugMode && setMessages) {
      setMessages((prev) => [...prev, { type: 'system', content: `❌ Question Analysis Error:\n${err.message}` }]);
    }
    console.error('Error analyzing for questions:', err);
  }
}

/**
 * Summarize a previously saved session.
 * @param {number} sessionId
 * @param {object} options
 * @param {import('openai').OpenAI} options.openaiClient
 * @returns {Promise<string|null>}
 */
export async function summarizeSession(sessionId, { openaiClient }) {
  if (!openaiClient) return null;

  const sessionData = localStorage.getItem(`space_session_${sessionId}`);
  if (!sessionData) return null;

  const session = JSON.parse(sessionData);
  const convoText = session.messages
    .filter((m) => m.type === 'user' || m.type === 'assistant')
    .map((m) => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Summarize the key points of the following conversation in 3-5 short bullet points.'
        },
        {
          role: 'user',
          content: convoText.slice(0, 6000)
        }
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('Error summarizing session:', err);
    return null;
  }
}

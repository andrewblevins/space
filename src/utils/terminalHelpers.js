/** Helper functions used by the Terminal component. */

import { trackUsage } from './usageTracking';

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
export async function analyzeMetaphors(messages, { enabled, openaiClient, setMetaphors, debugMode, setMessages, onComplete }) {
  if (!enabled || !openaiClient) {
    if (onComplete) onComplete();
    return;
  }
  const userMessages = messages.filter((m) => m.type === 'user').map((m) => m.content).join('\n');
  if (!userMessages.trim()) {
    if (onComplete) onComplete();
    return;
  }
  try {
    const inputTokens = Math.ceil((userMessages.length + 200) / 4); // Estimate input tokens
    console.log('🔍 Metaphors analysis starting, input tokens:', inputTokens, 'chars:', userMessages.length);
    const startTime = Date.now();
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: "You are a helpful assistant that responds only in valid JSON format. Your response should be a JSON object with a 'metaphors' property containing an array of strings." },
        { role: 'user', content: `Analyze the following messages for conceptual metaphors. Extract metaphors like "life is a journey", "time is money", "mind as computer", etc.:\n\n${userMessages}\n\nRespond with JSON in this format: {"metaphors": ["metaphor1", "metaphor2", ...]}` },
      ],
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });
    const endTime = Date.now();
    console.log('🔍 Metaphors analysis completed in', endTime - startTime, 'ms');
    const result = JSON.parse(response.choices[0].message.content);
    
    // Track usage
    const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);
    trackUsage('gpt', inputTokens, outputTokens);
    
    setMetaphors(result.metaphors || []);
    if (onComplete) onComplete();
  } catch (err) {
    if (debugMode && setMessages) {
      setMessages((prev) => [...prev, { type: 'system', content: `❌ Metaphor Analysis Error:\n${err.message}` }]);
    }
    console.error('Error analyzing metaphors:', err);
    if (onComplete) onComplete();
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
    const inputTokens = Math.ceil((recentMessages.length + 300) / 4); // Estimate input tokens
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
    
    // Track usage
    const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);
    trackUsage('gpt', inputTokens, outputTokens);
    
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
  
  // Check if we have a cached summary that's still relevant
  if (session.summary && session.summaryMessageCount) {
    const currentMessageCount = session.messages.filter(m => m.type === 'user' || m.type === 'assistant').length;
    // Use cached summary if it covers at least 80% of current messages
    if (session.summaryMessageCount >= currentMessageCount * 0.8) {
      console.log(`📄 Using cached summary for session ${sessionId}`);
      return session.summary;
    }
  }

  console.log(`📄 Generating fresh summary for session ${sessionId}`);
  return await generateSessionSummary(session, openaiClient);
}

export async function generateSessionSummary(session, openaiClient) {
  if (!openaiClient) return null;

  const convoText = session.messages
    .filter((m) => m.type === 'user' || m.type === 'assistant')
    .map((m) => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  try {
    const inputText = convoText.slice(0, 6000);
    const inputTokens = Math.ceil((inputText.length + 100) / 4); // Estimate input tokens
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Summarize the key points of the following conversation in 3-5 short bullet points.'
        },
        {
          role: 'user',
          content: inputText
        }
      ],
      max_tokens: 150
    });

    const summary = response.choices[0].message.content.trim();
    
    // Track usage
    const outputTokens = Math.ceil(summary.length / 4);
    trackUsage('gpt', inputTokens, outputTokens);
    
    // Cache the summary in the session
    const updatedSession = {
      ...session,
      summary,
      summaryTimestamp: new Date().toISOString(),
      summaryMessageCount: session.messages.filter(m => m.type === 'user' || m.type === 'assistant').length
    };
    
    localStorage.setItem(`space_session_${session.id}`, JSON.stringify(updatedSession));
    console.log(`📄 Cached summary for session ${session.id}`);
    
    return summary;
  } catch (err) {
    console.error('Error summarizing session:', err);
    return null;
  }
}

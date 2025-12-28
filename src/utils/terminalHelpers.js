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

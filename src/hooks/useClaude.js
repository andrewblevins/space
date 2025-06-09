import { useCallback } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { getDecrypted } from '../utils/secureStorage';
import { buildConversationContext } from '../utils/terminalHelpers';

/**
 * Hook providing the callClaude function used to stream responses from the API.
 * @param {object} params
 * @param {Array<object>} params.messages - Current conversation messages.
 * @param {(msgs: Array<object>|((prev: Array<object>) => Array<object>)) => void} params.setMessages
 * @param {number} params.maxTokens
 * @param {number} params.contextLimit
 * @param {import('../lib/memory').MemorySystem} params.memory
 * @param {boolean} params.debugMode
 * @param {() => string} params.getSystemPrompt
 * @returns {{ callClaude: (msg: string, customGetSystemPrompt?: () => string) => Promise<string> }}
 */
export function useClaude({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt }) {
  const callClaude = useCallback(async (userMessage, customGetSystemPrompt = null) => {
    const formatTimestamp = (iso) => new Date(iso).toISOString().slice(0, 16);
    if (!userMessage?.trim()) throw new Error('Empty message');
    const anthropicKey = await getDecrypted('space_anthropic_key');
    if (!anthropicKey) throw new Error('Anthropic API key not found');

    const estimateTokens = (text) => Math.ceil(text.length / 4);
    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

    const contextMessages = [{ role: 'user', content: userMessage }];
    if (totalTokens < contextLimit) {
      const historical = messages
        .filter((m) => (m.type === 'user' || m.type === 'assistant') && m.content?.trim() !== '' && m.content !== userMessage)
        .map((m) => ({ role: m.type, content: m.timestamp ? `[${formatTimestamp(m.timestamp)}] ${m.content}` : m.content }));
      contextMessages.unshift(...historical);
    } else {
      const managed = buildConversationContext(userMessage, messages, memory);
      if (managed?.length) contextMessages.unshift(...managed);
    }

    const systemPromptText = customGetSystemPrompt ? customGetSystemPrompt() : getSystemPrompt();
    if (debugMode) {
      const currentUserMessage = [...messages].reverse().find((m) => m.type === 'user' && m.content === userMessage) || { content: userMessage, tags: [] };
      const systemTokens = estimateTokens(systemPromptText);
      const contextTokens = contextMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
      const total = systemTokens + contextTokens;
      const inputCost = ((total / 1000) * 0.003).toFixed(4);
      const debugOutput = `Claude API Call:\nEstimated tokens: ${total} (System: ${systemTokens}, Context: ${contextTokens})\nEstimated cost: $${inputCost}\n\nTags for current message: ${JSON.stringify(currentUserMessage.tags, null, 2)}\n\nSystem Prompt:\n${systemPromptText}\n\nContext Messages:\n${JSON.stringify(contextMessages, null, 2)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      messages: contextMessages,
      system: systemPromptText,
      max_tokens: maxTokens,
      stream: true,
    };

    const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await handleApiError(response);
      throw new Error(errorText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessageContent = '';

    setMessages((prev) => [...prev, { type: 'assistant', content: '' }]);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const isPunctuation = (char) => ['.', '!', '?', '\n'].includes(char);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) {
        const dataMatch = event.match(/^data: (.+)$/m);
        if (!dataMatch) continue;
        try {
          const data = JSON.parse(dataMatch[1]);
          if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
            const text = data.delta.text;
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              let delay = Math.random() * 5;
              if (i > 0 && isPunctuation(text[i - 1])) delay += 0;
              await sleep(delay);
              currentMessageContent += char;
              setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                  newMessages[newMessages.length - 1] = { type: 'assistant', content: currentMessageContent };
                }
                return newMessages;
              });
            }
          }
        } catch (e) {
          console.error('Error parsing event:', e);
        }
      }
    }
    return currentMessageContent;
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt]);

  return { callClaude };
}

export default useClaude;

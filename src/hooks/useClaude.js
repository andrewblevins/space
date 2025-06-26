import { useCallback } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { getDecrypted } from '../utils/secureStorage';
import { buildConversationContext } from '../utils/terminalHelpers';
import { trackUsage, formatCost } from '../utils/usageTracking';
import { useAuth } from '../contexts/AuthContext';
import { useUsageTracking } from './useUsageTracking';
import { trackMessage } from '../utils/analytics';

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
export function useClaude({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, getSystemPrompt }) {
  // Always call hooks (hooks rules), but check auth enabled inside logic
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;
  const { updateFromHeaders } = useUsageTracking();
  
  const callClaude = useCallback(async (userMessage, customGetSystemPrompt = null) => {
    const formatTimestamp = (iso) => new Date(iso).toISOString().slice(0, 16);
    if (!userMessage?.trim()) throw new Error('Empty message');
    
    // Check for auth session if auth is enabled
    if (useAuthSystem && !session) {
      throw new Error('Not authenticated');
    }
    
    // Only get API key for legacy mode
    let anthropicKey = null;
    if (!useAuthSystem) {
      anthropicKey = await getDecrypted('space_anthropic_key');
      if (!anthropicKey) throw new Error('Anthropic API key not found');
    }

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

    const baseSystemPrompt = customGetSystemPrompt ? customGetSystemPrompt() : getSystemPrompt();
    
    // Add reasoning guidance when Extended Thinking is enabled
    const systemPromptText = reasoningMode && baseSystemPrompt
      ? `${baseSystemPrompt}\n\n## REASONING GUIDANCE\n\nWhen thinking through this problem, focus on the actual substance of the user's question rather than predicting what advisors would say. Use your thinking space to:\n\n1. **Analyze the core problem or question** - Break down what's really being asked\n2. **Consider multiple perspectives and approaches** - Explore different angles and potential solutions\n3. **Evaluate evidence and reasoning** - Think through the logic, assumptions, and implications\n4. **Synthesize insights** - Connect ideas and draw meaningful conclusions\n\nOnly after this substantive analysis should you consider how the advisors would present these insights to the user.`
      : baseSystemPrompt;
    
    // Debug logging for High Council mode
    if (systemPromptText.includes('HIGH COUNCIL MODE')) {
      console.log('🏛️ DEBUG: System prompt contains High Council instructions');
      console.log('🏛️ DEBUG: System prompt preview:', systemPromptText.substring(systemPromptText.indexOf('HIGH COUNCIL MODE'), systemPromptText.indexOf('HIGH COUNCIL MODE') + 200));
    } else {
      console.log('🏛️ DEBUG: System prompt does NOT contain High Council instructions');
    }
    
    // Calculate input tokens for tracking
    const systemTokens = estimateTokens(systemPromptText);
    const contextTokens = contextMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const inputTokens = systemTokens + contextTokens;
    
    if (debugMode) {
      const currentUserMessage = [...messages].reverse().find((m) => m.type === 'user' && m.content === userMessage) || { content: userMessage, tags: [] };
      const inputCost = inputTokens * (3.00 / 1_000_000); // Current Claude pricing
      const debugOutput = `Claude API Call:\nEstimated input tokens: ${inputTokens} (System: ${systemTokens}, Context: ${contextTokens})\nEstimated input cost: ${formatCost(inputCost)}\n\nTags for current message: ${JSON.stringify(currentUserMessage.tags, null, 2)}\n\nSystem Prompt:\n${systemPromptText}\n\nContext Messages:\n${JSON.stringify(contextMessages, null, 2)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      messages: contextMessages,
      system: systemPromptText,
      max_tokens: maxTokens,
      stream: true,
    };

    // Add native Extended Thinking if reasoning mode is enabled AND not in council mode
    const isCouncilMode = systemPromptText.includes('HIGH COUNCIL MODE');
    if (reasoningMode && !isCouncilMode) {
      // Set thinking budget to be 60% of max_tokens, leaving 40% for the actual response
      const thinkingBudget = Math.floor(maxTokens * 0.6);
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget
      };
      if (debugMode) {
        console.log(`🧠 Extended Thinking enabled with budget ${thinkingBudget}/${maxTokens} tokens`);
      }
    } else if (reasoningMode && isCouncilMode) {
      if (debugMode) {
        console.log(`🏛️ Extended Thinking disabled in Council Mode`);
      }
    }

    // Build headers based on auth mode
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (useAuthSystem) {
      // Auth mode: use bearer token
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Legacy mode: direct API access
      headers['x-api-key'] = anthropicKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    
    const apiUrl = useAuthSystem 
      ? `${getApiEndpoint()}/api/chat/claude`  // Backend proxy
      : `${getApiEndpoint()}/v1/messages`;     // Direct API
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    // Update usage from response headers
    updateFromHeaders(response);

    // Track successful message sent
    if (response.ok) {
      // Count advisors by checking if messages contain multiple perspectives
      const hasAdvisors = messages.some(msg => 
        msg.content?.includes('**') || 
        msg.content?.includes('---') ||
        systemPromptText.includes('advisor')
      );
      trackMessage(hasAdvisors, messages.length + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        reasoningMode: reasoningMode
      });
      await handleApiError(response, errorText);
      throw new Error(errorText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessageContent = '';
    let thinkingContent = '';

    setMessages((prev) => [...prev, { type: 'assistant', content: '', thinking: (reasoningMode && !isCouncilMode) ? '' : undefined }]);

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
          if (data.type === 'content_block_delta') {
            if (data.delta.type === 'text_delta') {
              // Regular text content
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
                    newMessages[newMessages.length - 1] = { 
                      type: 'assistant', 
                      content: currentMessageContent,
                      thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined
                    };
                  }
                  return newMessages;
                });
              }
            } else if (data.delta.type === 'thinking_delta' && reasoningMode && !isCouncilMode) {
              // Thinking content (Extended Thinking) - only when not in council mode
              const thinkingText = data.delta.thinking || '';
              if (thinkingText) {
                thinkingContent += thinkingText;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1] = { 
                      type: 'assistant', 
                      content: currentMessageContent,
                      thinking: thinkingContent
                    };
                  }
                  return newMessages;
                });
              }
            }
          }
        } catch (e) {
          console.error('Error parsing event:', e);
        }
      }
    }
    
    // Check if response is JSON advisor format and parse it
    let parsedAdvisorResponse = null;
    
    console.log('🎭 Checking if response is JSON...', {
      content: currentMessageContent.substring(0, 100) + '...',
      startsWithBrace: currentMessageContent.trim().startsWith('{'),
      endsWithBrace: currentMessageContent.trim().endsWith('}'),
      startsWithCodeBlock: currentMessageContent.trim().startsWith('```json'),
      endsWithCodeBlock: currentMessageContent.trim().endsWith('```'),
      length: currentMessageContent.length
    });
    
    // Check for JSON - either direct JSON or markdown code block
    let jsonContent = currentMessageContent.trim();
    if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
      // Extract JSON from markdown code block
      jsonContent = jsonContent.slice(7, -3).trim(); // Remove ```json and ```
      console.log('🎭 Extracted JSON from code block:', jsonContent.substring(0, 100) + '...');
    }
    
    if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(jsonContent);
        console.log('🎭 Successfully parsed JSON:', parsed);
        
        if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
          parsedAdvisorResponse = parsed;
          console.log('🎭 JSON advisor response detected with', parsed.advisors.length, 'advisors');
          
          // Update the message with parsed format
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = { 
                type: 'advisor_json', 
                content: jsonContent, // Use clean JSON content instead of raw with markdown
                parsedAdvisors: parsedAdvisorResponse,
                thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined
              };
            }
            return newMessages;
          });
        } else {
          console.log('🎭 JSON parsed but wrong structure:', {
            type: parsed.type,
            hasAdvisors: !!parsed.advisors,
            advisorsIsArray: Array.isArray(parsed.advisors)
          });
        }
      } catch (e) {
        console.log('🎭 Response looks like JSON but failed to parse:', e.message);
      }
    }
    
    // Track usage after successful completion
    const outputTokens = estimateTokens(currentMessageContent);
    const cost = trackUsage('claude', inputTokens, outputTokens);
    
    // console.log('🔍 useClaude - Final response from Claude:', JSON.stringify(currentMessageContent));
    
    if (debugMode) {
      const debugOutput = `Response complete:\nOutput tokens: ${outputTokens}\nTotal cost for this call: ${formatCost(cost)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }
    
    return currentMessageContent;
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, getSystemPrompt, useAuthSystem, session, updateFromHeaders]);

  return { callClaude };
}

export default useClaude;

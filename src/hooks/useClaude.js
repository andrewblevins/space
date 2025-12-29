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
    
    // Only get API key for legacy mode (now using OpenRouter)
    let openrouterKey = null;
    if (!useAuthSystem) {
      openrouterKey = await getDecrypted('space_openrouter_key');
      if (!openrouterKey) throw new Error('OpenRouter API key not found. Please set up your API key.');
    }

    const estimateTokens = (text) => Math.ceil(text.length / 4);
    // Cache token calculation to avoid recalculating on every call
    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0);

    const contextMessages = [{ role: 'user', content: userMessage }];
    if (totalTokens < contextLimit) {
      const historical = messages
        .filter((m) => (m.type === 'user' || m.type === 'assistant' || m.type === 'advisor_json') && m.content?.trim() !== '' && m.content !== userMessage)
        .map((m) => {
          // Convert advisor_json messages to assistant role for Claude
          const role = m.type === 'advisor_json' ? 'assistant' : m.type;
          // For advisor_json messages, extract the actual advisor responses
          let content = m.content;
          if (m.type === 'advisor_json' && m.parsedAdvisors) {
            content = m.parsedAdvisors.advisors.map(advisor => 
              `**${advisor.name}**: ${advisor.response}`
            ).join('\n\n');
          }
          return { 
            role, 
            content: m.timestamp ? `[${formatTimestamp(m.timestamp)}] ${content}` : content 
          };
        });
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
    
    // DEPRECATED: High Council mode debug logging
    // if (systemPromptText.includes('HIGH COUNCIL MODE')) {
    //   console.log('🏛️ DEBUG: System prompt contains High Council instructions');
    //   console.log('🏛️ DEBUG: System prompt preview:', systemPromptText.substring(systemPromptText.indexOf('HIGH COUNCIL MODE'), systemPromptText.indexOf('HIGH COUNCIL MODE') + 200));
    // } else {
    //   console.log('🏛️ DEBUG: System prompt does NOT contain High Council instructions');
    // }
    
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

    // Build request body - format depends on auth mode
    // Auth mode uses our backend proxy (Anthropic format)
    // Legacy mode uses OpenRouter API (OpenAI-compatible format)
    const requestBody = useAuthSystem ? {
      model: 'claude-sonnet-4.5',
      messages: contextMessages,
      system: systemPromptText,
      max_tokens: maxTokens,
      stream: true,
    } : {
      model: 'anthropic/claude-sonnet-4.5', // OpenRouter model name
      messages: [
        { role: 'system', content: systemPromptText },
        ...contextMessages
      ],
      max_tokens: maxTokens,
      stream: true,
    };
    
    // Log the complete system prompt that Claude receives
    console.log('📝 SYSTEM PROMPT SENT TO CLAUDE:');
    console.log('=' .repeat(80));
    console.log(systemPromptText);
    console.log('=' .repeat(80));
    
    // Log the conversation context messages
    // console.log('💬 CONVERSATION CONTEXT SENT TO CLAUDE:');
    // console.log('============================================================');
    // console.log(conversationContext);
    // console.log('============================================================');

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
      // Auth mode: use bearer token for our backend proxy
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Legacy mode: use OpenRouter API directly
      headers['Authorization'] = `Bearer ${openrouterKey}`;
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'SPACE Terminal';
    }
    
    const apiUrl = useAuthSystem 
      ? `${getApiEndpoint()}/api/chat/claude`  // Backend proxy
      : 'https://openrouter.ai/api/v1/chat/completions';  // OpenRouter API
    
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
    let isJsonMode = false;
    let isInCodeBlock = false;

    // Streaming performance tracking
    let streamStartTime = null;
    let lastChunkTime = null;
    let chunkCount = 0;
    let totalBytesReceived = 0;

    setMessages((prev) => [...prev, { type: 'assistant', content: '', thinking: (reasoningMode && !isCouncilMode) ? '' : undefined }]);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const isPunctuation = (char) => ['.', '!', '?', '\n'].includes(char);
    
    // Direct character-by-character updates for smooth streaming
    
    // Helper function to detect if we're starting JSON advisor format
    const detectJsonFormat = (content) => {
      const trimmed = content.trim();
      // Check for direct JSON start
      if (trimmed.startsWith('{')) return true;
      // Check for markdown code block start
      if (trimmed.startsWith('```json')) return true;
      // Check if we have enough content to detect JSON pattern
      if (trimmed.length >= 20 && trimmed.includes('"type"') && trimmed.includes('"advisor_response"')) return true;
      return false;
    };
    
    // Helper function to try parsing partial JSON for advisor structure
    const tryParsePartialAdvisorJson = (content) => {
      try {
        let jsonContent = content.trim();
        
        // Handle markdown code block
        if (jsonContent.startsWith('```json')) {
          const endIndex = jsonContent.indexOf('```', 7);
          if (endIndex === -1) {
            // Code block not closed yet, extract what we have
            jsonContent = jsonContent.slice(7).trim();
          } else {
            // Code block closed, extract the content
            jsonContent = jsonContent.slice(7, endIndex).trim();
          }
        }
        
        // Try to parse - this will fail for incomplete JSON, which is expected
        if (jsonContent.startsWith('{')) {
          const parsed = JSON.parse(jsonContent);
          if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
            return { success: true, parsed, jsonContent };
          }
        }
      } catch (e) {
        // Expected for partial JSON - not an error
      }
      
      // If full parsing fails, try to extract partial advisor data for progressive rendering
      if (content.includes('"type"') && content.includes('"advisor_response"') && content.includes('"advisors"')) {
        // Try to extract all advisor data that's partially available
        const advisorMatches = [...content.matchAll(/"name":\s*"([^"]*)"(?:.*?"response":\s*"([^"]*(?:[^"\\]|\\.)*))/gs)];
        if (advisorMatches.length > 0) {
          const advisors = advisorMatches.map(([, advisorName, partialResponse]) => {
            // Clean up partial response - remove any incomplete escape sequences
            const cleanResponse = (partialResponse || '')
              .replace(/\\$/, '') // Remove incomplete escape at end
              .replace(/\\n/g, '\n') // Unescape newlines
              .replace(/\\t/g, '\t') // Unescape tabs
              .replace(/\\"/g, '"') // Unescape quotes
              .replace(/\\\\/g, '\\'); // Unescape backslashes
            return {
              id: `streaming-${advisorName.toLowerCase().replace(/\s+/g, '-')}`,
              name: advisorName || 'Loading...',
              response: cleanResponse || 'Generating response...',
              timestamp: new Date().toISOString()
            };
          });
          
          return {
            success: true,
            partial: true,
            parsed: {
              type: 'advisor_response',
              advisors: advisors
            },
            jsonContent: content.trim()
          };
        } else {
          // Fallback to placeholder if we can't extract advisor data yet
          return {
            success: true,
            partial: true,
            parsed: {
              type: 'advisor_response',
              advisors: [{
                id: 'streaming-placeholder',
                name: 'Loading...',
                response: 'Generating response...',
                timestamp: new Date().toISOString()
              }]
            },
            jsonContent: content.trim()
          };
        }
      }
      
      return { success: false };
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Track streaming performance
      const now = performance.now();
      if (streamStartTime === null) {
        streamStartTime = now;
        console.log('🚀 STREAMING: First chunk received at', new Date().toISOString());
      }
      
      chunkCount++;
      totalBytesReceived += value.length;
      const timeSinceStart = now - streamStartTime;
      const timeSinceLastChunk = lastChunkTime ? now - lastChunkTime : 0;
      
      console.log(`📦 STREAMING CHUNK #${chunkCount}:`, {
        chunkSizeBytes: value.length,
        totalBytesReceived,
        timeSinceStartMs: Math.round(timeSinceStart),
        timeSinceLastChunkMs: Math.round(timeSinceLastChunk),
        avgBytesPerSecond: Math.round(totalBytesReceived / (timeSinceStart / 1000))
      });
      
      lastChunkTime = now;
      
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) {
        const dataMatch = event.match(/^data: (.+)$/m);
        if (!dataMatch) continue;
        
        // Skip [DONE] marker
        if (dataMatch[1] === '[DONE]') continue;
        
        try {
          const data = JSON.parse(dataMatch[1]);
          
          // Handle text content - support both Anthropic and OpenAI/OpenRouter formats
          let text = null;
          
          // Anthropic format: data.type === 'content_block_delta' with data.delta.text
          if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
            text = data.delta.text;
          }
          // OpenAI/OpenRouter format: data.choices[0].delta.content
          else if (data.choices?.[0]?.delta?.content) {
            text = data.choices[0].delta.content;
          }
          
          if (text) {
            // Regular text content with character-by-character updates
            console.log('✍️ TEXT DELTA:', {
              textLength: text.length,
              textPreview: text.length > 50 ? text.substring(0, 50) + '...' : text,
              totalContentLength: currentMessageContent.length + text.length,
              timeSinceStreamStart: Math.round(performance.now() - streamStartTime)
            });
            
            currentMessageContent += text;
            
            // Early detection of JSON advisor format
            if (!isJsonMode && detectJsonFormat(currentMessageContent)) {
              isJsonMode = true;
            }
            
            // Update message with appropriate type
            setMessages((prev) => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                if (isJsonMode) {
                  // Try to parse partial JSON for better streaming experience
                  const parseResult = tryParsePartialAdvisorJson(currentMessageContent);
                  if (parseResult.success) {
                    newMessages[newMessages.length - 1] = {
                      type: 'advisor_json',
                      content: parseResult.jsonContent,
                      parsedAdvisors: parseResult.parsed,
                      thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined,
                      isStreaming: true,
                      isPartial: parseResult.partial
                    };
                  } else {
                    newMessages[newMessages.length - 1] = {
                      type: 'assistant',
                      content: currentMessageContent,
                      thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined,
                      isJsonStreaming: true
                    };
                  }
                } else {
                  // Regular assistant message
                  newMessages[newMessages.length - 1] = {
                    type: 'assistant',
                    content: currentMessageContent,
                    thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined,
                    isStreaming: true
                  };
                }
              }
              return newMessages;
            });
          }
          
          // Handle thinking content (Extended Thinking) - Anthropic only, not in council mode
          if (data.type === 'content_block_delta' && data.delta?.type === 'thinking_delta' && reasoningMode && !isCouncilMode) {
            const thinkingText = data.delta.thinking || '';
            if (thinkingText) {
              thinkingContent += thinkingText;
              // Batch thinking updates too - only update every 10 characters or on significant breaks
              if (thinkingText.length > 10 || thinkingText.includes('\n') || thinkingText.includes('.')) {
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
    
    // Log streaming performance summary
    if (streamStartTime !== null) {
      const totalStreamTime = performance.now() - streamStartTime;
      console.log('🏁 STREAMING COMPLETE:', {
        totalChunks: chunkCount,
        totalBytesReceived,
        totalStreamTimeMs: Math.round(totalStreamTime),
        avgBytesPerSecond: Math.round(totalBytesReceived / (totalStreamTime / 1000)),
        finalContentLength: currentMessageContent.length,
        contentToByteRatio: Math.round((currentMessageContent.length / totalBytesReceived) * 100) + '%'
      });
    }
    
    // No final flush needed since we update character-by-character
    
    // Check if response is JSON advisor format and parse it
    let parsedAdvisorResponse = null;
    
    // console.log('🎭 Checking if response is JSON...', {
    //   content: currentMessageContent.substring(0, 100) + '...',
    //   startsWithBrace: currentMessageContent.trim().startsWith('{'),
    //   endsWithBrace: currentMessageContent.trim().endsWith('}'),
    //   startsWithCodeBlock: currentMessageContent.trim().startsWith('```json'),
    //   endsWithCodeBlock: currentMessageContent.trim().endsWith('```'),
    //   length: currentMessageContent.length
    // });
    
    // Check for JSON - either direct JSON or markdown code block
    let jsonContent = currentMessageContent.trim();
    if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
      // Extract JSON from markdown code block
      jsonContent = jsonContent.slice(7, -3).trim(); // Remove ```json and ```
      // console.log('🎭 Extracted JSON from code block:', jsonContent.substring(0, 100) + '...');
    }
    
    if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(jsonContent);
        // console.log('🎭 Successfully parsed JSON:', parsed);
        
        if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
          parsedAdvisorResponse = parsed;
          // console.log('🎭 JSON advisor response detected with', parsed.advisors.length, 'advisors');
          
          // Update the message with final parsed format (remove streaming flags)
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = { 
                type: 'advisor_json', 
                content: jsonContent, // Use clean JSON content instead of raw with markdown
                parsedAdvisors: parsedAdvisorResponse,
                thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined
                // Remove isStreaming and isJsonStreaming flags
              };
            }
            return newMessages;
          });
        } else {
          // console.log('🎭 JSON parsed but wrong structure:', {
          //   type: parsed.type,
          //   hasAdvisors: !!parsed.advisors,
          //   advisorsIsArray: Array.isArray(parsed.advisors)
          // });
        }
      } catch (e) {
        // console.log('🎭 Response looks like JSON but failed to parse:', e.message);
      }
    }

    // For non-JSON responses, remove streaming flag now that streaming is complete
    if (!parsedAdvisorResponse) {
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          const lastMsg = newMessages[newMessages.length - 1];
          // Only update if this is an assistant message with streaming flag
          if (lastMsg.type === 'assistant' && (lastMsg.isStreaming || lastMsg.isJsonStreaming)) {
            newMessages[newMessages.length - 1] = {
              type: 'assistant',
              content: currentMessageContent,
              thinking: (reasoningMode && !isCouncilMode) ? thinkingContent : undefined
              // isStreaming and isJsonStreaming flags removed
            };
          }
        }
        return newMessages;
      });
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

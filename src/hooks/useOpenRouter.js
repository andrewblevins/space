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
 * Hook providing the callOpenRouter function used to stream responses from the OpenRouter API.
 * @param {object} params
 * @param {Array<object>} params.messages - Current conversation messages.
 * @param {(msgs: Array<object>|((prev: Array<object>) => Array<object>)) => void} params.setMessages
 * @param {number} params.maxTokens
 * @param {number} params.contextLimit
 * @param {import('../lib/memory').MemorySystem} params.memory
 * @param {boolean} params.debugMode
 * @param {() => string} params.getSystemPrompt
 * @param {string} params.model - OpenRouter model to use
 * @returns {{ callOpenRouter: (msg: string, customGetSystemPrompt?: () => string) => Promise<string> }}
 */
export function useOpenRouter({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt, model = 'anthropic/claude-3.5-sonnet' }) {
  // Always call hooks (hooks rules), but check auth enabled inside logic
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;
  const { updateFromHeaders } = useUsageTracking();
  
  const callOpenRouter = useCallback(async (userMessage, customGetSystemPrompt = null) => {
    const formatTimestamp = (iso) => new Date(iso).toISOString().slice(0, 16);
    if (!userMessage?.trim()) throw new Error('Empty message');
    
    // Check for auth session if auth is enabled
    if (useAuthSystem && !session) {
      throw new Error('Not authenticated');
    }
    
    // Only get API key for legacy mode
    let openrouterKey = null;
    if (!useAuthSystem) {
      openrouterKey = await getDecrypted('space_openrouter_key');
      if (!openrouterKey) throw new Error('OpenRouter API key not found');
    }

    const estimateTokens = (text) => Math.ceil(text.length / 4);
    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

    const contextMessages = [{ role: 'user', content: userMessage }];
    if (totalTokens < contextLimit) {
      const historical = messages
        .filter((m) => (m.type === 'user' || m.type === 'assistant' || m.type === 'advisor_json') && m.content?.trim() !== '' && m.content !== userMessage)
        .map((m) => {
          // Convert advisor_json messages to assistant role for OpenRouter
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

    const systemPromptText = customGetSystemPrompt ? customGetSystemPrompt() : getSystemPrompt();
    
    // Debug logging for High Council mode
    if (systemPromptText.includes('HIGH COUNCIL MODE')) {
      console.log('🌐 OpenRouter DEBUG: System prompt contains High Council instructions');
    }
    
    // Calculate input tokens for tracking
    const systemTokens = estimateTokens(systemPromptText);
    const contextTokens = contextMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const inputTokens = systemTokens + contextTokens;
    
    if (debugMode) {
      const currentUserMessage = [...messages].reverse().find((m) => m.type === 'user' && m.content === userMessage) || { content: userMessage, tags: [] };
      // OpenRouter pricing varies by model - using approximate average
      const inputCost = inputTokens * (2.00 / 1_000_000); 
      const debugOutput = `OpenRouter API Call (${model}):\nEstimated input tokens: ${inputTokens} (System: ${systemTokens}, Context: ${contextTokens})\nEstimated input cost: ${formatCost(inputCost)}\n\nTags for current message: ${JSON.stringify(currentUserMessage.tags, null, 2)}\n\nSystem Prompt:\n${systemPromptText}\n\nContext Messages:\n${JSON.stringify(contextMessages, null, 2)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }

    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPromptText },
        ...contextMessages
      ],
      max_tokens: maxTokens,
      stream: true,
    };
    
    // Log the complete system prompt that OpenRouter receives
    console.log('📝 SYSTEM PROMPT SENT TO OPENROUTER:');
    console.log('=' .repeat(80));
    console.log(systemPromptText);
    console.log('=' .repeat(80));
    console.log('🌐 Using model:', model);

    // Build headers based on auth mode
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (useAuthSystem) {
      // Auth mode: use bearer token
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Legacy mode: direct API access
      headers['Authorization'] = `Bearer ${openrouterKey}`;
      headers['HTTP-Referer'] = window.location.origin; // Required by OpenRouter
      headers['X-Title'] = 'SPACE Terminal'; // Optional app identification
    }
    
    const apiUrl = useAuthSystem 
      ? `${getApiEndpoint()}/api/chat/openrouter`  // Backend proxy
      : 'https://openrouter.ai/api/v1/chat/completions';     // Direct API
    
    console.log('🚀 OPENROUTER DEBUG: About to make API call with streaming=true');
    console.log('🌐 OPENROUTER DEBUG: API URL:', apiUrl);
    console.log('📋 OPENROUTER DEBUG: Request body stream setting:', requestBody.stream);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    console.log('📡 OPENROUTER DEBUG: Got response status:', response.status);
    console.log('📡 OPENROUTER DEBUG: Response ok:', response.ok);
    console.log('📡 OPENROUTER DEBUG: About to start reading stream');

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
      console.error('🚨 OpenRouter API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        model: model
      });
      await handleApiError(response, errorText);
      throw new Error(errorText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessageContent = '';
    let isJsonMode = false;

    setMessages((prev) => [...prev, { type: 'assistant', content: '', provider: 'openrouter', model: model }]);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const isPunctuation = (char) => ['.', '!', '?', '\n'].includes(char);
    
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

    // Streaming performance tracking
    let streamStartTime = null;
    let lastChunkTime = null;
    let chunkCount = 0;
    let totalBytesReceived = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Track streaming performance
      const now = performance.now();
      if (streamStartTime === null) {
        streamStartTime = now;
        console.log('🚀 OPENROUTER STREAMING: First chunk received at', new Date().toISOString());
      }
      
      chunkCount++;
      totalBytesReceived += value.length;
      const timeSinceStart = now - streamStartTime;
      const timeSinceLastChunk = lastChunkTime ? now - lastChunkTime : 0;
      
      console.log(`📦 OPENROUTER CHUNK #${chunkCount}:`, {
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
        try {
          const data = JSON.parse(dataMatch[1]);
          if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
            const text = data.choices[0].delta.content;
            
            console.log('✍️ OPENROUTER TEXT DELTA:', {
              textLength: text.length,
              textPreview: text.length > 50 ? text.substring(0, 50) + '...' : text,
              timeSinceStreamStart: Math.round(performance.now() - streamStartTime)
            });
            
            // Show actual text content as it arrives
            console.log(`📝 OPENROUTER STREAMING TEXT: "${text}"`);
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              let delay = Math.random() * 5;
              if (i > 0 && isPunctuation(text[i - 1])) delay += 0;
              await sleep(delay);
              currentMessageContent += char;
              
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
                      // We have valid partial advisor JSON - render as advisor_json
                      newMessages[newMessages.length - 1] = {
                        type: 'advisor_json',
                        content: parseResult.jsonContent,
                        parsedAdvisors: parseResult.parsed,
                        provider: 'openrouter',
                        model: model,
                        isStreaming: true, // Flag to indicate still streaming
                        isPartial: parseResult.partial // Flag to indicate partial/placeholder data
                      };
                    } else {
                      // JSON mode but not parseable yet - show as assistant with indicator
                      newMessages[newMessages.length - 1] = {
                        type: 'assistant',
                        content: currentMessageContent,
                        provider: 'openrouter',
                        model: model,
                        isJsonStreaming: true // Flag to indicate JSON is coming
                      };
                    }
                  } else {
                    // Regular assistant message
                    newMessages[newMessages.length - 1] = { 
                      type: 'assistant', 
                      content: currentMessageContent,
                      provider: 'openrouter',
                      model: model
                    };
                  }
                }
                return newMessages;
              });
            }
          }
        } catch (e) {
          console.error('Error parsing OpenRouter event:', e);
        }
      }
    }
    
    // Check if response is JSON advisor format and parse it
    let parsedAdvisorResponse = null;
    
    // Check for JSON - either direct JSON or markdown code block
    let jsonContent = currentMessageContent.trim();
    if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
      // Extract JSON from markdown code block
      jsonContent = jsonContent.slice(7, -3).trim(); // Remove ```json and ```
    }
    
    if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
      try {
        const parsed = JSON.parse(jsonContent);
        
        if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
          parsedAdvisorResponse = parsed;
          
          // Update the message with final parsed format (remove streaming flags)
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = { 
                type: 'advisor_json', 
                content: jsonContent, // Use clean JSON content instead of raw with markdown
                parsedAdvisors: parsedAdvisorResponse,
                provider: 'openrouter',
                model: model
                // Remove isStreaming and isJsonStreaming flags
              };
            }
            return newMessages;
          });
        }
      } catch (e) {
        // Response looks like JSON but failed to parse
      }
    }
    
    // Track usage after successful completion
    const outputTokens = estimateTokens(currentMessageContent);
    const cost = trackUsage('openrouter', inputTokens, outputTokens, model);
    
    if (debugMode) {
      const debugOutput = `OpenRouter Response complete:\nModel: ${model}\nOutput tokens: ${outputTokens}\nTotal cost for this call: ${formatCost(cost)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }
    
    return currentMessageContent;
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt, model, useAuthSystem, session, updateFromHeaders]);

  return { callOpenRouter };
}

export default useOpenRouter;
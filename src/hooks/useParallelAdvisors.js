import { useCallback } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { getDecrypted } from '../utils/secureStorage';
import { buildConversationContext } from '../utils/terminalHelpers';
import { trackUsage, formatCost } from '../utils/usageTracking';
import { useAuth } from '../contexts/AuthContext';
import { useUsageTracking } from './useUsageTracking';

/**
 * Hook for calling multiple advisors in parallel, each with their own Claude instance
 * @param {object} params
 * @param {Array<object>} params.messages - Current conversation messages
 * @param {(msgs: Array<object>|((prev: Array<object>) => Array<object>)) => void} params.setMessages
 * @param {number} params.maxTokens
 * @param {number} params.contextLimit
 * @param {import('../lib/memory').MemorySystem} params.memory
 * @param {boolean} params.debugMode
 * @param {boolean} params.reasoningMode
 * @returns {{ callParallelAdvisors: (userMessage: string, activeAdvisors: Array<object>) => Promise<void> }}
 */
export function useParallelAdvisors({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode }) {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;
  const { updateFromHeaders } = useUsageTracking();

  /**
   * Call a single advisor with their individual system prompt
   */
  const callSingleAdvisor = useCallback(async (userMessage, advisor, advisorId) => {
    const formatTimestamp = (iso) => new Date(iso).toISOString().slice(0, 16);
    
    // Check for auth session if auth is enabled
    if (useAuthSystem && !session) {
      throw new Error('Not authenticated');
    }
    
    // API key handling moved to headers section for proper routing

    const estimateTokens = (text) => Math.ceil(text.length / 4);
    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0);

    // Create individual system prompt for this advisor only
    const systemPromptText = `You are ${advisor.name}. ${advisor.description}

## Context
You are an advisor in SPACE Terminal, a multi-perspective conversation interface where users explore complex problems by consulting multiple AI advisors with distinct viewpoints. Users create and configure advisors to help them think through questions, stress-test ideas, and develop their understanding through "opponent processing."

## Response Guidelines
Be concise for simple questions, thorough for complex ones. Respond naturally and directly without JSON formatting, advisor name labels, or meta-commentary about being an advisor. Other advisors are responding independently in parallel - you don't see their responses and shouldn't reference them.`;

    // Build conversation context - user messages + this advisor's own responses only
    const conversationMessages = [];
    
    // Add historical conversation with proper context filtering
    if (totalTokens < contextLimit) {
      const historical = messages
        .filter((m) => {
          // Always include user messages
          if (m.type === 'user' && m.content?.trim() !== '' && m.content !== userMessage) return true;
          
          // Include only THIS advisor's previous responses (not other advisors)
          if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
            return Object.values(m.advisorResponses).some(resp => resp.name === advisor.name);
          }
          
          // For legacy advisor_json messages, include only if this advisor participated
          if (m.type === 'advisor_json' && m.parsedAdvisors) {
            return m.parsedAdvisors.advisors.some(a => a.name === advisor.name);
          }
          
          return false;
        })
        .map((m) => {
          let role = m.type;
          let content = m.content;
          
          // Handle parallel advisor responses - extract only this advisor's response
          if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
            const thisAdvisorResponse = Object.values(m.advisorResponses).find(resp => resp.name === advisor.name);
            if (thisAdvisorResponse) {
              role = 'assistant';
              content = thisAdvisorResponse.content;
            }
          }
          // Handle legacy advisor_json - extract only this advisor's response  
          else if (m.type === 'advisor_json' && m.parsedAdvisors) {
            const thisAdvisorResponse = m.parsedAdvisors.advisors.find(a => a.name === advisor.name);
            if (thisAdvisorResponse) {
              role = 'assistant';
              content = thisAdvisorResponse.response;
            }
          }
          // User messages stay as-is
          else if (m.type === 'user') {
            role = 'user';
          }
          
          return {
            role,
            content: m.timestamp ? `[${formatTimestamp(m.timestamp)}] ${content}` : content
          };
        });
      
      conversationMessages.push(...historical);
    } else {
      // For memory-managed context, we might need to adapt buildConversationContext
      // For now, fall back to simpler approach
      const userMessages = messages
        .filter((m) => m.type === 'user' && m.content?.trim() !== '' && m.content !== userMessage)
        .map((m) => ({
          role: 'user',
          content: m.timestamp ? `[${formatTimestamp(m.timestamp)}] ${m.content}` : m.content
        }));
      conversationMessages.push(...userMessages);
    }
    
    // Add current user message
    conversationMessages.push({ role: 'user', content: userMessage });

    // Calculate input tokens
    const systemTokens = estimateTokens(systemPromptText);
    const contextTokens = conversationMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const inputTokens = systemTokens + contextTokens;

    const requestBody = {
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: systemPromptText },
        ...conversationMessages
      ],
      max_tokens: maxTokens,
      stream: true,
    };

    console.log(`🎭 ${advisor.name} API Call Starting:`, {
      inputTokens,
      systemTokens,
      contextTokens,
      systemPrompt: systemPromptText.substring(0, 200) + '...',
      model: requestBody.model
    });

    // Debug: Show the exact context being sent to this advisor
    console.log(`🎭 ${advisor.name} CONTEXT MESSAGES:`, {
      systemMessage: { role: 'system', content: systemPromptText.substring(0, 100) + '...' },
      conversationMessages: conversationMessages
    });

    // Add Extended Thinking if enabled
    if (reasoningMode) {
      const thinkingBudget = Math.floor(maxTokens * 0.6);
      requestBody.thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget
      };
    }

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (useAuthSystem) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Legacy mode: get OpenRouter key and set appropriate headers
      const openrouterKey = await getDecrypted('space_openrouter_key');
      if (!openrouterKey) throw new Error('OpenRouter API key not found');
      
      headers['Authorization'] = `Bearer ${openrouterKey}`;
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'SPACE Terminal';
    }
    
    const apiUrl = useAuthSystem 
      ? `${getApiEndpoint()}/api/chat/openrouter`
      : 'https://openrouter.ai/api/v1/chat/completions';
    
    console.log(`🎭 ${advisor.name} Calling API:`, { apiUrl });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`🎭 ${advisor.name} Response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    updateFromHeaders(response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚨 ${advisor.name} API Error:`, {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      await handleApiError(response, errorText);
      throw new Error(`${advisor.name}: ${errorText}`);
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentContent = '';
    let thinkingContent = '';


    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      
      for (const event of events) {
        const dataMatch = event.match(/^data: (.+)$/m);
        if (!dataMatch) continue;
        
        try {
          // Skip the final [DONE] marker
          if (dataMatch[1] === '[DONE]') {
            continue;
          }
          
          const data = JSON.parse(dataMatch[1]);
          
          // OpenRouter format: data.choices[0].delta.content
          if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
            const text = data.choices[0].delta.content;
            currentContent += text;
            
            // Update the parallel message state for this advisor
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              
              if (lastMessage && lastMessage.type === 'parallel_advisor_response') {
                // Create new message object to trigger React re-render
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  advisorResponses: {
                    ...lastMessage.advisorResponses,
                    [advisorId]: {
                      ...lastMessage.advisorResponses[advisorId],
                      content: currentContent,
                      thinking: reasoningMode ? thinkingContent : undefined,
                      completed: false
                    }
                  }
                };
              }
              
              return newMessages;
            });
          }
          
          // Handle thinking content if available (Anthropic format, might not be used with OpenRouter)
          if (data.type === 'content_block_delta' && data.delta && data.delta.type === 'thinking_delta' && reasoningMode) {
            const thinkingText = data.delta.thinking || '';
            if (thinkingText) {
              thinkingContent += thinkingText;
              
              // Update thinking content
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                
                if (lastMessage && lastMessage.type === 'parallel_advisor_response') {
                  newMessages[newMessages.length - 1] = {
                    ...lastMessage,
                    advisorResponses: {
                      ...lastMessage.advisorResponses,
                      [advisorId]: {
                        ...lastMessage.advisorResponses[advisorId],
                        thinking: thinkingContent
                      }
                    }
                  };
                }
                
                return newMessages;
              });
            }
          }
        } catch (e) {
          console.error(`${advisor.name} streaming error:`, e);
        }
      }
    }

    // Mark this advisor as completed
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      
      if (lastMessage && lastMessage.type === 'parallel_advisor_response') {
        const updatedAdvisorResponses = {
          ...lastMessage.advisorResponses,
          [advisorId]: {
            ...lastMessage.advisorResponses[advisorId],
            completed: true
          }
        };
        
        // Check if all advisors are completed
        const allCompleted = Object.values(updatedAdvisorResponses).every(advisor => advisor.completed);
        
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          advisorResponses: updatedAdvisorResponses,
          allCompleted: allCompleted
        };
      }
      
      return newMessages;
    });

    // Track usage
    const outputTokens = estimateTokens(currentContent);
    trackUsage('claude', inputTokens, outputTokens);
    
    return currentContent;
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, useAuthSystem, session, updateFromHeaders]);

  /**
   * Call multiple advisors in parallel
   */
  const callParallelAdvisors = useCallback(async (userMessage, activeAdvisors) => {
    if (!userMessage?.trim()) throw new Error('Empty message');
    if (!activeAdvisors || activeAdvisors.length === 0) throw new Error('No active advisors');

    // Initialize parallel message structure
    const advisorResponses = {};
    activeAdvisors.forEach(advisor => {
      const advisorId = advisor.id || advisor.name.toLowerCase().replace(/\s+/g, '-');
      advisorResponses[advisorId] = {
        name: advisor.name,
        content: '',
        completed: false,
        thinking: reasoningMode ? '' : undefined
      };
    });

    // Add parallel message to state
    const parallelMessage = {
      type: 'parallel_advisor_response',
      advisorResponses: advisorResponses,
      allCompleted: false,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, parallelMessage]);

    // Launch parallel API calls
    const promises = activeAdvisors.map(advisor => {
      const advisorId = advisor.id || advisor.name.toLowerCase().replace(/\s+/g, '-');
      return callSingleAdvisor(userMessage, advisor, advisorId).catch(error => {
        console.error(`Error calling ${advisor.name}:`, error);
        
        // Mark this advisor as failed
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage && lastMessage.type === 'parallel_advisor_response') {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              advisorResponses: {
                ...lastMessage.advisorResponses,
                [advisorId]: {
                  ...lastMessage.advisorResponses[advisorId],
                  content: `Error: ${error.message}`,
                  completed: true,
                  error: true
                }
              }
            };
          }
          
          return newMessages;
        });
        
        return null; // Don't let individual failures break Promise.all
      });
    });

    // Wait for all advisors to complete
    await Promise.all(promises);
    
    console.log('🎭 All parallel advisor calls completed');
  }, [callSingleAdvisor, reasoningMode, setMessages]);

  return { callParallelAdvisors };
}

export default useParallelAdvisors;
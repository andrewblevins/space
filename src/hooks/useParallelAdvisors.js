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

    // Build conversation context (same as current system)
    const contextMessages = [{ role: 'user', content: userMessage }];
    if (totalTokens < contextLimit) {
      const historical = messages
        .filter((m) => (m.type === 'user' || m.type === 'assistant' || m.type === 'advisor_json') && m.content?.trim() !== '' && m.content !== userMessage)
        .map((m) => {
          const role = m.type === 'advisor_json' ? 'assistant' : m.type;
          let content = m.content;
          if (m.type === 'advisor_json' && m.parsedAdvisors) {
            // For parallel messages, extract only this advisor's previous responses
            const advisorResponses = m.parsedAdvisors.advisors
              .filter(a => a.name === advisor.name)
              .map(a => `**${a.name}**: ${a.response}`)
              .join('\n\n');
            content = advisorResponses || content;
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

    // Create individual system prompt for this advisor only
    const systemPromptText = `You are ${advisor.name}. ${advisor.description}

IMPORTANT: You are responding as a single advisor, not multiple advisors. Provide your response directly without any JSON formatting or advisor names. Just respond naturally as ${advisor.name} would.

Do not reference other advisors or say things like "I think" or "as ${advisor.name}". Just respond as this advisor naturally.`;

    // Calculate input tokens
    const systemTokens = estimateTokens(systemPromptText);
    const contextTokens = contextMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const inputTokens = systemTokens + contextTokens;

    if (debugMode) {
      console.log(`🎭 ${advisor.name} API Call:`, {
        inputTokens,
        systemTokens,
        contextTokens,
        systemPrompt: systemPromptText.substring(0, 200) + '...'
      });
    }

    const requestBody = {
      model: 'anthropic/claude-sonnet-4',
      messages: contextMessages,
      system: systemPromptText,
      max_tokens: maxTokens,
      stream: true,
    };

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
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
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
              const text = data.delta.text;
              currentContent += text;
              
              // Update the parallel message state for this advisor
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                
                if (lastMessage && lastMessage.type === 'parallel_advisor_response') {
                  lastMessage.advisorResponses[advisorId] = {
                    ...lastMessage.advisorResponses[advisorId],
                    content: currentContent,
                    thinking: reasoningMode ? thinkingContent : undefined,
                    completed: false
                  };
                }
                
                return newMessages;
              });
              
            } else if (data.delta.type === 'thinking_delta' && reasoningMode) {
              const thinkingText = data.delta.thinking || '';
              if (thinkingText) {
                thinkingContent += thinkingText;
                
                // Update thinking content
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage && lastMessage.type === 'parallel_advisor_response') {
                    lastMessage.advisorResponses[advisorId] = {
                      ...lastMessage.advisorResponses[advisorId],
                      thinking: thinkingContent
                    };
                  }
                  
                  return newMessages;
                });
              }
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
        lastMessage.advisorResponses[advisorId] = {
          ...lastMessage.advisorResponses[advisorId],
          completed: true
        };
        
        // Check if all advisors are completed
        const allCompleted = Object.values(lastMessage.advisorResponses).every(advisor => advisor.completed);
        lastMessage.allCompleted = allCompleted;
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
            lastMessage.advisorResponses[advisorId] = {
              ...lastMessage.advisorResponses[advisorId],
              content: `Error: ${error.message}`,
              completed: true,
              error: true
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
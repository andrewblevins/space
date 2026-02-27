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
export function useParallelAdvisors({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, model = 'anthropic/claude-sonnet-4.6' }) {
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

    // Count conversation turns (how many times this advisor has responded)
    const conversationTurns = messages.filter(m => {
      if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
        return Object.values(m.advisorResponses).some(resp => resp.name === advisor.name);
      }
      if (m.type === 'advisor_json' && m.parsedAdvisors) {
        return m.parsedAdvisors.advisors.some(a => a.name === advisor.name);
      }
      return false;
    }).length;

    console.log(`🔢 ${advisor.name} turn count:`, conversationTurns, 'Early protocol active:', conversationTurns < 3);

    // Create individual system prompt for this advisor only
    const systemPromptText = `You are ${advisor.name}. ${advisor.description}

## Context
You are a voice in SPACE Terminal, a multi-perspective conversation interface where users explore complex problems by consulting multiple voices with distinct viewpoints. Users create and configure perspectives to help them think through questions, stress-test ideas, and develop their understanding through "opponent processing."

## Your Task
Respond from your distinct perspective with genuine insight and depth.

Keep responses concise and focused - aim for 2-4 paragraphs maximum. Be brief for simple questions, more thorough for complex ones.

Be authentic to your perspective. You're here to offer your distinct viewpoint, not to mirror or validate the user. When you see gaps in their thinking, point them out. When assumptions seem shaky, probe them. When contradictions emerge, name them. But match your tone to what the situation calls for - sometimes challenge is needed, sometimes clarification, sometimes a reframe.

Directness and intellectual honesty matter more than agreement. Don't soften your perspective to be agreeable, but don't manufacture conflict either. Respond to what's actually there.

When it serves your point, share relevant stories, anecdotes, or examples to illustrate your perspective. Stories can make abstract concepts concrete and reveal patterns the user might not have considered.

Ask clarifying questions when needed, and offer strong opinions, frameworks, and recommendations based on your worldview.

Respond naturally and directly without JSON formatting, name labels, or meta-commentary about being a voice or perspective. Other perspectives are responding independently in parallel. You may occasionally see a summary of what they said in the previous turn — use it if it's relevant, but don't feel obligated to respond to it. Speak in your own voice and stay grounded in your perspective.`;

    // Build conversation context with graceful windowing
    // Each advisor sees: system prompt + own history + last-turn reference + current message
    // When over contextLimit, oldest turns are dropped first

    // Step 1: Build full filtered history for this advisor
    const historical = messages
      .filter((m) => {
        if (m.type === 'user' && m.content?.trim() !== '' && m.content !== userMessage) return true;
        if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
          return Object.values(m.advisorResponses).some(resp => resp.name === advisor.name);
        }
        if (m.type === 'advisor_json' && m.parsedAdvisors) {
          return m.parsedAdvisors.advisors.some(a => a.name === advisor.name);
        }
        return false;
      })
      .map((m) => {
        let role = m.type;
        let content = m.content;

        if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
          const thisAdvisorResponse = Object.values(m.advisorResponses).find(resp => resp.name === advisor.name);
          if (thisAdvisorResponse) {
            role = 'assistant';
            content = thisAdvisorResponse.content;
          }
        } else if (m.type === 'advisor_json' && m.parsedAdvisors) {
          const thisAdvisorResponse = m.parsedAdvisors.advisors.find(a => a.name === advisor.name);
          if (thisAdvisorResponse) {
            role = 'assistant';
            content = thisAdvisorResponse.response;
          }
        } else if (m.type === 'user') {
          role = 'user';
        }

        return {
          role,
          content: (role === 'user' && m.timestamp) ? `[${formatTimestamp(m.timestamp)}] ${content}` : content
        };
      });

    // Step 2: Build last-turn reference block (other advisors' most recent responses)
    const lastAdvisorTurn = [...messages].reverse().find(
      m => m.type === 'parallel_advisor_response' && m.advisorResponses && m.allCompleted
    );
    let referenceBlock = null;
    if (lastAdvisorTurn) {
      const otherResponses = Object.values(lastAdvisorTurn.advisorResponses)
        .filter(resp => resp.name !== advisor.name && resp.content?.trim())
        .map(resp => `${resp.name}: ${resp.content}`)
        .join('\n\n');
      if (otherResponses) {
        referenceBlock = `[For reference, here's what the other perspectives said last turn:\n\n${otherResponses}]`;
      }
    }

    // Step 3: Calculate token budget and trim oldest turns if needed
    const systemTokens = estimateTokens(systemPromptText);
    const currentMessageTokens = estimateTokens(userMessage);
    const referenceBlockTokens = referenceBlock ? estimateTokens(referenceBlock) : 0;
    const fixedTokens = systemTokens + currentMessageTokens;
    let availableForHistory = contextLimit - fixedTokens - referenceBlockTokens;

    let historyTokens = historical.reduce((s, m) => s + estimateTokens(m.content), 0);

    // Drop oldest user/assistant pairs until history fits
    while (historyTokens > availableForHistory && historical.length > 0) {
      const removed = historical.shift();
      historyTokens -= estimateTokens(removed.content);
      // If we removed a user message, also remove the following assistant message to keep pairs
      if (removed.role === 'user' && historical.length > 0 && historical[0].role === 'assistant') {
        const removedAssistant = historical.shift();
        historyTokens -= estimateTokens(removedAssistant.content);
      }
    }

    // If still over budget, drop the reference block
    if (historyTokens > contextLimit - fixedTokens && referenceBlock) {
      referenceBlock = null;
      availableForHistory = contextLimit - fixedTokens;
    }

    // Step 4: Assemble final message array
    const conversationMessages = [...historical];
    if (referenceBlock) {
      conversationMessages.push({ role: 'user', content: referenceBlock });
    }
    conversationMessages.push({ role: 'user', content: userMessage });

    // Calculate input tokens for tracking
    const contextTokens = conversationMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const inputTokens = systemTokens + contextTokens;

    const requestBody = {
      model: model,
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
      conversationTurns,
      earlyProtocolActive: conversationTurns < 3,
      systemPrompt: systemPromptText.substring(0, 400) + '...',
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
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, model, useAuthSystem, session, updateFromHeaders]);

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
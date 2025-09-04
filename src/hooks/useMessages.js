import { useState, useCallback, useRef } from 'react';
import { MemorySystem } from '../lib/memory';

/**
 * Custom hook for managing message state and operations in SPACE Terminal
 * Extracts all message-related functionality from Terminal.jsx
 */
export function useMessages({ memory, contextLimit = 150000 }) {
  // Core message state
  const [messages, setMessages] = useState(() => {
    const baseMessages = [
      { type: 'system', content: 'SPACE Terminal - v0.2.4' },
      { type: 'system', content: '🎉 New in v0.2.4:\n• Advisor evaluation system with Assert buttons\n• Automated scoring against test assertions\n• Optimization loop for iterative prompt improvement\n• Enhanced streaming with real-time formatting' }
    ];
    
    // Note: User authentication logic will be handled by parent component
    // and passed in as initial messages if needed
    
    return baseMessages;
  });
  
  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);
  
  // Container reference for scrolling
  const messagesContainerRef = useRef(null);

  // Add a new message to the conversation
  const addMessage = useCallback((message) => {
    const timestampedMessage = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    };
    
    setMessages(prev => [...prev, timestampedMessage]);
  }, []);

  // Add a system message (helper for common use case)
  const addSystemMessage = useCallback((content) => {
    addMessage({
      type: 'system',
      content
    });
  }, [addMessage]);

  // Update the last message in the conversation
  const updateLastMessage = useCallback((updates) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = {
        ...newMessages[newMessages.length - 1],
        ...updates
      };
      return newMessages;
    });
  }, []);

  // Clear all messages and reset to initial state
  const clearMessages = useCallback((customInitialMessages = null) => {
    const initialMessages = customInitialMessages || [
      { type: 'system', content: 'SPACE Terminal - v0.2.4' },
      { type: 'system', content: '🎉 New in v0.2.4:\n• Advisor evaluation system with Assert buttons\n• Automated scoring against test assertions\n• Optimization loop for iterative prompt improvement\n• Enhanced streaming with real-time formatting' },
      { type: 'system', content: 'Start a conversation, add an advisor (+), draw from the Prompt Library (↙), or type /help for instructions.' }
    ];
    
    setMessages(initialMessages);
  }, []);

  // Load messages from a session/conversation
  const loadMessages = useCallback((sessionMessages, additionalMetadata = {}) => {
    // Process messages to restore advisor_json format if needed and ensure timestamps
    const processedMessages = sessionMessages.map((msg, idx) => {
      // If it's an assistant message that looks like JSON advisor format, restore it
      if (msg.type === 'assistant' && msg.content) {
        let jsonContent = msg.content.trim();
        
        // Handle markdown code block
        if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
          jsonContent = jsonContent.slice(7, -3).trim();
        }
        
        // Try to parse as advisor JSON
        if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
          try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
              return {
                type: 'advisor_json',
                content: jsonContent,
                parsedAdvisors: parsed,
                timestamp: msg.timestamp || new Date(Date.now() - (sessionMessages.length - idx) * 1000).toISOString()
              };
            }
          } catch (e) {
            // If parsing fails, keep as regular assistant message
          }
        }
      }
      
      // Ensure each message has a timestamp for stable React keys
      return {
        ...msg,
        timestamp: msg.timestamp || new Date(Date.now() - (sessionMessages.length - idx) * 1000).toISOString()
      };
    });
    
    setMessages(processedMessages);
  }, []);

  // Build conversation context for API calls
  const buildConversationContext = useCallback((userMessage, additionalMessages = []) => {
    const formatTimestamp = (iso) => new Date(iso).toISOString().slice(0, 16);
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (text) => Math.ceil(text.length / 4);
    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0);

    const contextMessages = [{ role: 'user', content: userMessage }];
    
    if (totalTokens < contextLimit) {
      // Use full history if under context limit
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
      // Use memory system to build context when over limit
      if (memory) {
        const managed = memory.buildConversationContext ? 
          memory.buildConversationContext(userMessage, messages) : [];
        if (managed?.length) contextMessages.unshift(...managed);
      }
    }
    
    return contextMessages;
  }, [messages, contextLimit, memory]);

  // Get conversation statistics
  const getMessageStats = useCallback(() => {
    const userMessages = messages.filter(m => m.type === 'user');
    const assistantMessages = messages.filter(m => m.type === 'assistant' || m.type === 'advisor_json');
    const systemMessages = messages.filter(m => m.type === 'system');
    
    return {
      total: messages.length,
      user: userMessages.length,
      assistant: assistantMessages.length,
      system: systemMessages.length,
      hasConversation: userMessages.length > 0 && assistantMessages.length > 0
    };
  }, [messages]);

  // Get messages for export/display
  const getMessagesForExport = useCallback(() => {
    return messages.filter(m => m.type !== 'system');
  }, [messages]);

  // Scroll to bottom of messages container
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  return {
    // State
    messages,
    isLoading,
    messagesContainerRef,
    
    // Actions
    setMessages, // Keep direct access for complex operations
    setIsLoading,
    addMessage,
    addSystemMessage,
    updateLastMessage,
    clearMessages,
    loadMessages,
    
    // Computed values
    buildConversationContext,
    getMessageStats,
    getMessagesForExport,
    
    // Utilities
    scrollToBottom
  };
}

export default useMessages;
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

// Request throttling utilities
const requestQueue = new Map();
const failureCounts = new Map();
const CIRCUIT_BREAKER_THRESHOLD = 5;
const MAX_RETRY_DELAY = 10000; // 10 seconds

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRetryDelay = (attemptCount) => {
  return Math.min(1000 * Math.pow(2, attemptCount), MAX_RETRY_DELAY);
};

const isCircuitBreakerOpen = (endpoint) => {
  const failures = failureCounts.get(endpoint) || 0;
  return failures >= CIRCUIT_BREAKER_THRESHOLD;
};

const recordFailure = (endpoint) => {
  const current = failureCounts.get(endpoint) || 0;
  failureCounts.set(endpoint, current + 1);
  
  // Auto-reset circuit breaker after 30 seconds
  setTimeout(() => {
    failureCounts.set(endpoint, Math.max(0, (failureCounts.get(endpoint) || 0) - 1));
  }, 30000);
};

const recordSuccess = (endpoint) => {
  failureCounts.set(endpoint, 0);
};

export function useConversationStorage() {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error when starting new operations
  const clearError = useCallback(() => setError(null), []);

  // Standard headers for API requests
  const getHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }, [session]);

  // Handle API responses with error checking
  const handleResponse = useCallback(async (response) => {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.text();
        const parsed = JSON.parse(errorData);
        errorMessage = parsed.error || parsed.message || errorMessage;
      } catch {
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }, []);

  // Throttled fetch with retry logic and circuit breaker
  const throttledFetch = useCallback(async (url, options = {}, maxRetries = 3) => {
    const endpoint = new URL(url).pathname;
    
    // Check circuit breaker
    if (isCircuitBreakerOpen(endpoint)) {
      throw new Error(`Circuit breaker open for ${endpoint}. Too many failures.`);
    }
    
    // Throttle concurrent requests to same endpoint
    const requestKey = `${options.method || 'GET'}_${endpoint}`;
    if (requestQueue.has(requestKey)) {
      // Wait for existing request to complete
      await requestQueue.get(requestKey);
    }
    
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add delay for retries
        if (attempt > 0) {
          const delay = getRetryDelay(attempt - 1);
          console.warn(`Retrying request to ${endpoint} after ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await sleep(delay);
        }
        
        // Create request promise
        const requestPromise = fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });
        
        // Store in queue to prevent concurrent requests
        requestQueue.set(requestKey, requestPromise.catch(() => {}));
        
        const response = await requestPromise;
        
        // Clean up queue
        requestQueue.delete(requestKey);
        
        // Record success
        recordSuccess(endpoint);
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        // Clean up queue on error
        requestQueue.delete(requestKey);
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.message.includes('401') || error.message.includes('403')) {
          recordFailure(endpoint);
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          recordFailure(endpoint);
          throw error;
        }
      }
    }
    
    recordFailure(endpoint);
    throw lastError;
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title, metadata = {}) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await throttledFetch(`${getApiEndpoint()}/api/conversations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, metadata })
      });
      
      const result = await handleResponse(response);
      // console.log('🗃️ Created conversation:', result.id);
      return result;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleResponse, clearError, throttledFetch]);

  // Load a specific conversation with all messages
  const loadConversation = useCallback(async (conversationId) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await throttledFetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
        headers: getHeaders()
      });
      
      const result = await handleResponse(response);
      // console.log('🗃️ Loaded conversation:', conversationId, 'with', result.messages?.length || 0, 'messages');
      return result;
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleResponse, clearError, throttledFetch]);

  // Update conversation (title, metadata)
  const updateConversation = useCallback(async (conversationId, updates) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await throttledFetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      
      const result = await handleResponse(response);
      // console.log('🗃️ Updated conversation:', conversationId);
      return result;
    } catch (err) {
      console.error('Failed to update conversation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleResponse, clearError, throttledFetch]);

  // Add a message to a conversation
  const addMessage = useCallback(async (conversationId, type, content, metadata = {}) => {
    clearError();
    
    try {
      const response = await throttledFetch(`${getApiEndpoint()}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ type, content, metadata })
      });
      
      const result = await handleResponse(response);
      // console.log('💬 Added message to conversation:', conversationId, `(${type})`);
      return result;
    } catch (err) {
      console.error('Failed to add message:', err);
      setError(err.message);
      throw err;
    }
  }, [getHeaders, handleResponse, clearError, throttledFetch]);

  // Add multiple messages in batch (more efficient)
  const addMessages = useCallback(async (conversationId, messages) => {
    clearError();
    
    try {
      const results = [];
      for (const message of messages) {
        const result = await addMessage(conversationId, message.type, message.content, message.metadata);
        results.push(result);
      }
      // console.log('💬 Added', messages.length, 'messages to conversation:', conversationId);
      return results;
    } catch (err) {
      console.error('Failed to add messages:', err);
      setError(err.message);
      throw err;
    }
  }, [addMessage, clearError]);

  // List all conversations for the user
  const listConversations = useCallback(async () => {
    clearError();
    setLoading(true);
    
    try {
      const response = await throttledFetch(`${getApiEndpoint()}/api/conversations`, {
        headers: getHeaders()
      });
      
      const result = await handleResponse(response);
      // console.log('🗃️ Listed', result.length, 'conversations');
      return result;
    } catch (err) {
      console.error('Failed to list conversations:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleResponse, clearError, throttledFetch]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await throttledFetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      const result = await handleResponse(response);
      console.log('🗃️ Deleted conversation:', conversationId);
      return result;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders, handleResponse, clearError, throttledFetch]);

  // Auto-save session metadata (metaphors, advisor suggestions, etc.)
  const saveSessionMetadata = useCallback(async (conversationId, metadata) => {
    try {
      // Only save metadata, don't throw errors that would disrupt the UI
      await updateConversation(conversationId, { metadata });
    } catch (err) {
      console.warn('Failed to save session metadata:', err);
      // Don't throw - this is a background operation
    }
  }, [updateConversation]);

  return {
    // Core operations
    createConversation,
    loadConversation,
    updateConversation,
    addMessage,
    addMessages,
    listConversations,
    deleteConversation,
    
    // Convenience methods
    saveSessionMetadata,
    
    // State
    loading,
    error,
    clearError,
    
    // Utils
    isAuthenticated: !!session?.access_token
  };
}
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

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
      const errorData = await response.text();
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const parsed = JSON.parse(errorData);
        errorMessage = parsed.error || parsed.message || errorMessage;
      } catch {
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    return response.json();
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title, metadata = {}) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiEndpoint()}/api/conversations`, {
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
  }, [getHeaders, handleResponse, clearError]);

  // Load a specific conversation with all messages
  const loadConversation = useCallback(async (conversationId) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
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
  }, [getHeaders, handleResponse, clearError]);

  // Update conversation (title, metadata)
  const updateConversation = useCallback(async (conversationId, updates) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
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
  }, [getHeaders, handleResponse, clearError]);

  // Add a message to a conversation
  const addMessage = useCallback(async (conversationId, type, content, metadata = {}) => {
    clearError();
    
    try {
      const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}/messages`, {
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
  }, [getHeaders, handleResponse, clearError]);

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
      const response = await fetch(`${getApiEndpoint()}/api/conversations`, {
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
  }, [getHeaders, handleResponse, clearError]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId) => {
    clearError();
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
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
  }, [getHeaders, handleResponse, clearError]);

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
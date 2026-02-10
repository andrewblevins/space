# SPACE Terminal - Database-Primary Conversation Storage Plan

## Overview
This document outlines the implementation plan for migrating SPACE Terminal from localStorage-based conversation storage to a database-primary architecture with cross-device sync and reliable backup.

## Current State Assessment

### localStorage Architecture (Current)
- **Storage**: Browser localStorage only
- **Session Key Pattern**: `space_session_{sessionId}`
- **Auto-save**: Triggered on message, metaphor, advisor suggestion changes
- **Export**: Markdown/JSON export available
- **Limitations**: Device-specific, no backup, storage limits (5-10MB)

### Why Database Storage Makes Sense
With authentication now implemented, users expect:
- **Cross-device access** - Continue conversations on different devices
- **Reliable backup** - Never lose conversations
- **Better search** - Server-side full-text search across all conversations
- **Collaboration potential** - Share sessions with others (future feature)

**Note**: Offline support is not valuable since core app functions (AI conversations, metaphor analysis, question generation) all require internet connectivity.

## Technical Implementation

### Database Schema

#### Conversations Table
```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For session-level data (metaphors, vote history, etc.)
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at);

-- RLS policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);
```

#### Messages Table
```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('system', 'user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- For tags, timing, advisor info, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_content_search ON public.messages USING gin(to_tsvector('english', content));

-- RLS policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in own conversations" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
```

### Backend API Functions

#### Conversation Management
```javascript
// functions/api/conversations/index.js
export async function onRequestGet(context) {
  // GET /api/conversations - List user's conversations
  const userId = context.user.id;
  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at, metadata')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
    
  if (error) throw error;
  return Response.json(data);
}

export async function onRequestPost(context) {
  // POST /api/conversations - Create new conversation
  const userId = context.user.id;
  const { title, metadata = {} } = await context.request.json();
  
  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title || `Session ${Date.now()}`,
      metadata
    })
    .select()
    .single();
    
  if (error) throw error;
  return Response.json(data);
}
```

```javascript
// functions/api/conversations/[id].js
export async function onRequestGet(context) {
  // GET /api/conversations/:id - Load specific conversation with messages
  const conversationId = context.params.id;
  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Get conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
    
  if (convError) throw convError;
  
  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  if (msgError) throw msgError;
  
  return Response.json({
    ...conversation,
    messages
  });
}

export async function onRequestPut(context) {
  // PUT /api/conversations/:id - Update conversation
  const conversationId = context.params.id;
  const updates = await context.request.json();
  
  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .select()
    .single();
    
  if (error) throw error;
  return Response.json(data);
}

export async function onRequestDelete(context) {
  // DELETE /api/conversations/:id - Delete conversation
  const conversationId = context.params.id;
  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);
    
  if (error) throw error;
  return Response.json({ success: true });
}
```

#### Message Management
```javascript
// functions/api/conversations/[id]/messages.js
export async function onRequestPost(context) {
  // POST /api/conversations/:id/messages - Add message to conversation
  const conversationId = context.params.id;
  const { type, content, metadata = {} } = await context.request.json();
  
  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Add message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      type,
      content,
      metadata
    })
    .select()
    .single();
    
  if (msgError) throw msgError;
  
  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
    
  return Response.json(message);
}
```

### Frontend Integration

#### Conversation Storage Hook
```javascript
// src/hooks/useConversationStorage.js
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

export function useConversationStorage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  };

  const createConversation = useCallback(async (title, metadata = {}) => {
    const response = await fetch(`${getApiEndpoint()}/api/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, metadata })
    });
    return response.json();
  }, [session]);

  const loadConversation = useCallback(async (conversationId) => {
    const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
      headers
    });
    return response.json();
  }, [session]);

  const updateConversation = useCallback(async (conversationId, updates) => {
    const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    return response.json();
  }, [session]);

  const addMessage = useCallback(async (conversationId, type, content, metadata = {}) => {
    const response = await fetch(`${getApiEndpoint()}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type, content, metadata })
    });
    return response.json();
  }, [session]);

  const listConversations = useCallback(async () => {
    const response = await fetch(`${getApiEndpoint()}/api/conversations`, {
      headers
    });
    return response.json();
  }, [session]);

  return {
    createConversation,
    loadConversation,
    updateConversation,
    addMessage,
    listConversations,
    loading
  };
}
```

#### Terminal Integration
```javascript
// Update src/components/Terminal.jsx
import { useConversationStorage } from '../hooks/useConversationStorage';

export default function Terminal() {
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const storage = useConversationStorage();

  // Auto-save messages after each interaction
  useEffect(() => {
    if (!autoSaveEnabled || !currentConversationId) return;

    const saveMessage = async (message) => {
      try {
        await storage.addMessage(
          currentConversationId,
          message.type,
          message.content,
          { tags: message.tags, timestamp: message.timestamp }
        );
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    };

    // Save the last message if it's new
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.saved) {
      saveMessage(lastMessage);
      // Mark as saved to prevent duplicate saves
      setMessages(prev => prev.map((msg, idx) => 
        idx === prev.length - 1 ? { ...msg, saved: true } : msg
      ));
    }
  }, [messages, currentConversationId, autoSaveEnabled]);

  // Create new conversation
  const handleNewSession = async () => {
    try {
      const conversation = await storage.createConversation(
        `Session ${new Date().toLocaleString()}`,
        { metaphors: [], advisorSuggestions: [], voteHistory: [] }
      );
      setCurrentConversationId(conversation.id);
      setMessages([]);
      // Reset other session-related state...
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Load existing conversation
  const handleLoadSession = async (conversationId) => {
    try {
      const conversation = await storage.loadConversation(conversationId);
      setCurrentConversationId(conversation.id);
      setMessages(conversation.messages || []);
      // Restore session metadata...
      setMetaphors(conversation.metadata?.metaphors || []);
      setAdvisorSuggestions(conversation.metadata?.advisorSuggestions || []);
      setVoteHistory(conversation.metadata?.voteHistory || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // ... rest of component
}
```

### Migration Strategy

#### Phase 1: Dual-Write Implementation
1. **Add database storage** alongside existing localStorage
2. **Auto-import localStorage sessions** on first login  
3. **Write to both** localStorage and database during transition
4. **Read from database** primarily, fall back to localStorage

#### Phase 2: Migration Assistant
```javascript
// src/utils/migrationHelper.js
export async function migrateLocalStorageSessions(storage) {
  const sessions = [];
  
  // Find all localStorage sessions
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('space_session_')) {
      try {
        const sessionData = JSON.parse(localStorage.getItem(key));
        sessions.push(sessionData);
      } catch (error) {
        console.warn(`Failed to parse session ${key}:`, error);
      }
    }
  }

  // Import each session to database
  for (const session of sessions) {
    try {
      const conversation = await storage.createConversation(
        session.title || `Imported Session ${session.id}`,
        {
          metaphors: session.metaphors || [],
          advisorSuggestions: session.advisorSuggestions || [],
          voteHistory: session.voteHistory || [],
          importedFrom: 'localStorage',
          originalId: session.id
        }
      );

      // Add messages
      for (const message of session.messages || []) {
        await storage.addMessage(
          conversation.id,
          message.type,
          message.content,
          { 
            tags: message.tags,
            timestamp: message.timestamp,
            imported: true
          }
        );
      }

      console.log(`Migrated session ${session.id} to ${conversation.id}`);
    } catch (error) {
      console.error(`Failed to migrate session ${session.id}:`, error);
    }
  }

  return sessions.length;
}
```

#### Phase 3: localStorage Removal
1. **Verify all users migrated** via analytics
2. **Remove localStorage read/write code**
3. **Clean up migration utilities**
4. **Update export functionality** to use database

## Implementation Timeline

### Week 1: Database & Backend
- [ ] Create Supabase tables and policies
- [ ] Implement conversation API endpoints
- [ ] Implement message API endpoints  
- [ ] Test API with Postman/curl

### Week 2: Frontend Integration
- [ ] Create conversation storage hook
- [ ] Update Terminal.jsx with database integration
- [ ] Implement auto-save functionality
- [ ] Create migration helper utility

### Week 3: Migration & Testing
- [ ] Test localStorage migration
- [ ] Implement dual-write during transition
- [ ] Test cross-device sync
- [ ] Deploy and monitor

### Week 4: Cleanup & Enhancement
- [ ] Remove localStorage dependencies
- [ ] Update export functionality
- [ ] Add conversation search
- [ ] Performance optimization

## Benefits

### User Benefits
- **Cross-device sync** - Access conversations anywhere
- **Reliable backup** - Never lose conversations
- **Better performance** - No localStorage size limits
- **Search functionality** - Find conversations and messages easily

### Technical Benefits
- **Scalability** - No browser storage limits
- **Analytics** - Server-side usage insights
- **Collaboration ready** - Foundation for sharing features
- **Backup/restore** - Admin tools for data recovery

## Future Enhancements

### Conversation Features
- **Search across all conversations** - Full-text search
- **Conversation sharing** - Send links to share sessions
- **Conversation templates** - Pre-built starting points
- **Conversation analytics** - Usage patterns and insights

### Performance Optimizations
- **Lazy loading** - Load messages on demand for long conversations
- **Caching** - Client-side caching for frequently accessed conversations
- **Pagination** - Handle conversations with thousands of messages
- **Compression** - Compress stored content for efficiency

### Advanced Features
- **Version history** - Track changes to conversations over time  
- **Collaborative editing** - Multiple users in same conversation
- **Conversation branching** - Fork conversations at specific points
- **Smart organization** - Auto-categorization and tagging

---

This database-primary approach provides reliable, scalable conversation storage while maintaining the user experience users expect from a modern application. The migration strategy ensures no data loss during the transition from localStorage to database storage.
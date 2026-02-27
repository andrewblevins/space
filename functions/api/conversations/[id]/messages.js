import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../../../utils/auth';

export async function onRequestPost(context) {
  // POST /api/conversations/:id/messages - Add message to conversation
  const conversationId = context.params.id;
  const authResult = await verifyAuth(context);
  
  if (!authResult.success) {
    return new Response('Unauthorized', { 
      status: authResult.status || 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
  
  const userId = authResult.user.id;

  try {
    const requestBody = await context.request.json();
    const { type, content, metadata = {} } = requestBody;

    // Validate required fields
    if (!type || !content) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        message: 'Both type and content are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Validate message type
    if (!['system', 'user', 'assistant', 'advisor_json'].includes(type)) {
      return new Response(JSON.stringify({
        error: 'Invalid message type',
        message: 'Type must be system, user, assistant, or advisor_json'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify conversation exists and user owns it
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return new Response('Conversation not found', { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
      throw convError;
    }

    // Add message to conversation
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

    // Note: conversation timestamp is automatically updated via trigger
    
    return new Response(JSON.stringify(message), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error adding message:', error);
    return new Response(JSON.stringify({
      error: 'Failed to add message',
      message: 'An internal error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestGet(context) {
  // GET /api/conversations/:id/messages - Get messages for conversation
  const conversationId = context.params.id;
  const authResult = await verifyAuth(context);

  if (!authResult.success) {
    return new Response('Unauthorized', {
      status: authResult.status || 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const userId = authResult.user.id;

  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify conversation exists and user owns it
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError) {
      if (convError.code === 'PGRST116') {
        return new Response('Conversation not found', { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
      throw convError;
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return new Response(JSON.stringify(messages || []), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch messages',
      message: 'An internal error occurred'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
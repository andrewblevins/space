import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../../utils/auth';

export async function onRequestGet(context) {
  // GET /api/conversations/:id - Load specific conversation with messages
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

    // Get conversation (this also verifies user ownership via RLS)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
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

    return new Response(JSON.stringify({
      ...conversation,
      messages: messages || []
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch conversation',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestPut(context) {
  // PUT /api/conversations/:id - Update conversation
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
    const updates = {
      ...requestBody,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new Response('Conversation not found', { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update conversation',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestDelete(context) {
  // DELETE /api/conversations/:id - Delete conversation
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

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return new Response(JSON.stringify({
      error: 'Failed to delete conversation',
      message: error.message
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
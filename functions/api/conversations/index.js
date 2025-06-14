import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
  // GET /api/conversations - List user's conversations
  const userId = context.user?.id;
  
  if (!userId) {
    return new Response('Unauthorized', { 
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, metadata')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch conversations',
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

export async function onRequestPost(context) {
  // POST /api/conversations - Create new conversation
  const userId = context.user?.id;
  
  if (!userId) {
    return new Response('Unauthorized', { 
      status: 401,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const requestBody = await context.request.json();
    const { title, metadata = {} } = requestBody;

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || `Session ${new Date().toLocaleString()}`,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return new Response(JSON.stringify({
      error: 'Failed to create conversation',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
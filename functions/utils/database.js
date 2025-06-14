import { createClient } from '@supabase/supabase-js';

/**
 * Create authenticated Supabase client for server-side operations
 */
export function createSupabaseClient(context) {
  return createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Standard error response helper
 */
export function createErrorResponse(message, status = 500, details = null) {
  const response = {
    error: message,
    ...(details && { details })
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Standard success response helper
 */
export function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Check if user is authenticated
 */
export function requireAuth(context) {
  const userId = context.user?.id;
  
  if (!userId) {
    return createErrorResponse('Unauthorized', 401);
  }
  
  return { userId, authenticated: true };
}

/**
 * Standard CORS headers for preflight requests
 */
export function createCorsResponse(methods = 'GET, POST, OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
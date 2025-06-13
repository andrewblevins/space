import { createClient } from '@supabase/supabase-js';

// Skip auth for public routes
const PUBLIC_PATHS = ['/api/health', '/api/auth'];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Skip auth for public paths
  if (PUBLIC_PATHS.some(path => url.pathname.startsWith(path))) {
    return context.next();
  }

  // Skip auth for non-API routes (let frontend handle)
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return new Response('Invalid token', { status: 401 });
    }

    // Add user to context for use in functions
    context.user = user;
    return context.next();
  } catch (error) {
    return new Response('Authentication error', { status: 500 });
  }
}
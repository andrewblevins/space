import { createClient } from '@supabase/supabase-js';

export async function verifyAuth(context) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid authorization header',
      status: 401
    };
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Use service role key for token verification
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        error: 'Invalid token',
        status: 401
      };
    }
    
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Authentication error',
      status: 500
    };
  }
}
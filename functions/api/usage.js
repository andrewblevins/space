import { checkRateLimit } from '../middleware/rateLimiting.js';

export async function onRequestGet(context) {
  const userId = context.user?.id;
  
  try {
    const rateLimitInfo = await checkRateLimit(context, userId);
    
    // Calculate time until reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const hoursUntilReset = Math.ceil((tomorrow - now) / (1000 * 60 * 60));

    return new Response(JSON.stringify({
      usage: rateLimitInfo.usage,
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      tier: rateLimitInfo.tier,
      resetIn: `${hoursUntilReset} hours`,
      resetTime: tomorrow.toISOString()
    }), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch usage',
      message: error.message
    }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
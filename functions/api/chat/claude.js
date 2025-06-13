import { checkRateLimit, incrementUsage } from '../../middleware/rateLimiting.js';

export async function onRequestPost(context) {
  // User is now available from middleware
  const userId = context.user?.id;
  
  try {
    // Check rate limit before processing
    const rateLimitInfo = await checkRateLimit(context, userId);
    
    // Log usage info for monitoring
    console.log(`User ${userId} usage: ${rateLimitInfo.usage}/${rateLimitInfo.limit}`);

    const requestBody = await context.request.json();

    // Proceed with API call (even if over limit for MVP - soft enforcement)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Increment usage after successful API call
    if (response.ok) {
      await incrementUsage(context, userId);
    }

    // Include rate limit info in response headers
    const responseHeaders = {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': (rateLimitInfo.remaining - 1).toString(), // -1 because we just used one
      'X-RateLimit-Used': (rateLimitInfo.usage + 1).toString(), // +1 because we just used one
      'X-RateLimit-Tier': rateLimitInfo.tier
    };

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request even if rate limiting fails
    return new Response(JSON.stringify({
      error: 'Error communicating with Claude',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 
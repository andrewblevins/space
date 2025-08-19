import { verifyAuth } from '../../utils/auth.js';

export async function onRequestPost(context) {
  // Verify authentication
  const authResult = await verifyAuth(context);
  if (!authResult.success) {
    return new Response(JSON.stringify({ 
      error: authResult.error 
    }), { 
      status: authResult.status,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  const userId = authResult.user.id;
  
  try {
    const requestBody = await context.request.json();
    
    // Log usage for this user (for future analytics)
    console.log(`User ${userId} calling OpenRouter API with model: ${requestBody.model || 'default'}`);

    // Validate required fields
    if (!requestBody.model) {
      return new Response(JSON.stringify({
        error: 'Model parameter is required'
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Set default headers for OpenRouter
    const headers = {
      'Authorization': `Bearer ${context.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': context.request.headers.get('Referer') || 'https://space-terminal.com',
      'X-Title': 'SPACE Terminal'
    };

    // Forward the request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...requestBody,
        // Ensure we have proper stream handling
        stream: requestBody.stream || false
      })
    });

    // Handle streaming responses
    if (requestBody.stream) {
      // For streaming responses, we need to pass through the stream
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
      });
    }

    // For non-streaming responses, parse and return JSON
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    return new Response(JSON.stringify({
      error: 'Error communicating with OpenRouter',
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
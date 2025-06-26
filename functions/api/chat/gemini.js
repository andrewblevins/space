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
    console.log(`User ${userId} calling Gemini API`);

    // Transform the request to Gemini format
    const geminiRequest = {
      contents: [
        {
          parts: [
            {
              text: requestBody.prompt || requestBody.input || ''
            }
          ]
        }
      ],
      generationConfig: {
        temperature: requestBody.temperature || 0.1,
        maxOutputTokens: requestBody.maxOutputTokens || 1000
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${context.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Transform Gemini response to a more standard format
    const standardResponse = {
      choices: [
        {
          message: {
            content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
          }
        }
      ],
      usage: {
        prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
        completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: data.usageMetadata?.totalTokenCount || 0
      },
      model: 'gemini-2.5-flash-lite'
    };

    return new Response(JSON.stringify(standardResponse), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Gemini function error:', error);
    return new Response(JSON.stringify({
      error: 'Error communicating with Gemini',
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
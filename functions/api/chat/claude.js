import { Anthropic } from '@anthropic-ai/sdk';

export async function onRequestPost(context) {
  try {
    const { messages, max_tokens = 1024, model = 'claude-3-5-sonnet-20241022' } = await context.request.json();
    
    // Get user's API key from request header if provided
    const userApiKey = context.request.headers.get('x-api-key');
    
    const anthropic = new Anthropic({
      apiKey: userApiKey || context.env.ANTHROPIC_API_KEY
    });

    const response = await anthropic.messages.create({
      model,
      messages,
      max_tokens,
      stream: true
    });

    // Create a readable stream from the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response.stream()) {
            const data = JSON.stringify({ type: 'content', text: chunk.content[0].text }) + '\n';
            controller.enqueue(new TextEncoder().encode(data));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
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
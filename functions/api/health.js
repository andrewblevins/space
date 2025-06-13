export async function onRequest() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
} 
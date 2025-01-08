const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate keys are present
  if (!anthropicKey || !openaiKey) {
    setError('Both API keys are required');
    return;
  }

  // Validate key formats
  if (!anthropicKey.startsWith('sk-ant-')) {
    setError('Invalid Anthropic API key format');
    return;
  }

  if (!openaiKey.startsWith('sk-')) {
    setError('Invalid OpenAI API key format');
    return;
  }

  // Optional: Test the keys work before saving
  try {
    // Simple test call to validate Anthropic key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error('Invalid Anthropic API key');
    }

    // Store keys in localStorage
    localStorage.setItem('space_anthropic_key', anthropicKey);
    localStorage.setItem('space_openai_key', openaiKey);

    // Notify parent component
    onComplete({ anthropicKey, openaiKey });
  } catch (error) {
    setError(`API key validation failed: ${error.message}`);
  }
}; 
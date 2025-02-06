require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Validate required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Claude proxy endpoint
app.post('/api/chat/claude', async (req, res) => {
  try {
    const { messages, max_tokens = 1024, model = 'claude-3-5-sonnet-20241022' } = req.body;
    
    // Mirror Cloudflare Function's API key logic
    const userApiKey = req.headers['x-api-key'];
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model,
      messages,
      max_tokens
    }, {
      headers: {
        'x-api-key': userApiKey || process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Error communicating with Claude',
      message: error.message
    });
  }
});

// OpenAI proxy endpoint
app.post('/api/chat/openai', async (req, res) => {
  try {
    const { messages, max_tokens = 1024, model = 'gpt-4o-mini', temperature = 0.7 } = req.body;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', 
      {
        model,
        messages,
        max_tokens,
        temperature
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Error communicating with OpenAI',
      message: error.response?.data?.error?.message || error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

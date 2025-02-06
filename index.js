import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

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
    
    console.log('Claude request:', { messages, max_tokens, model });
    
    const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
    console.log('Using API key:', apiKey ? 'Present' : 'Missing');
    
    const anthropic = new Anthropic({
      apiKey
    });

    console.log('Creating message with Anthropic SDK...');

    // Set streaming headers first
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Use the stream method with .on('text')
    await anthropic.messages.stream({
      messages,
      model,
      max_tokens
    }).on('text', (text) => {
      res.write(JSON.stringify({ type: 'content', text }) + '\n');
    });

    res.end();

  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({
      error: 'Error communicating with Claude',
      message: error.message,
      details: error.toString()
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

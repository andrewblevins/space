# SPACE Development Scripts

## setup-dev-keys.js

Automatically configures API keys in the SPACE development environment using Puppeteer.

### Usage

```bash
npm run dev:setup
```

### What it does

1. **Starts the development server** - Launches `npm run dev` in the background
2. **Opens browser** - Launches a Puppeteer-controlled browser window
3. **Fills API keys** - Automatically fills in the Anthropic and OpenAI API keys from your `.env` file
4. **Validates keys** - Submits the form and waits for validation
5. **Leaves browser open** - Keeps the browser window open for you to use the app

### Requirements

- API keys must be configured in the `.env` file:
  ```
  ANTHROPIC_API_KEY=sk-ant-...
  OPENAI_API_KEY=sk-...
  ```

### Benefits for AI Development

This script is particularly useful when you want an AI assistant (like Claude) to be able to interact with your SPACE app:

1. **Quick Setup** - No manual copy/pasting of API keys
2. **Consistent Environment** - Ensures the same keys are used every time
3. **Browser Automation** - Puppeteer can continue to automate interactions with the app
4. **Development Workflow** - Perfect for iterative development and testing

### Stopping

Press `Ctrl+C` to stop the development server and close the browser.
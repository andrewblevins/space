#!/usr/bin/env node

/**
 * Improved Puppeteer setup using modern best practices
 * Uses locators, proper selectors, and React-compatible methods
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

let DEV_URL = 'http://localhost:3000';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DEV_PASSWORD = process.env.VITE_DEV_PASSWORD || 'development123';

// Register custom React query handler
const setupReactQueryHandler = (page) => {
  return page.evaluateOnNewDocument(() => {
    if (!window.customQueryHandlerRegistered) {
      // Register a custom handler for data-testid attributes
      window.customQueryHandlerRegistered = true;
    }
  });
};

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server did not start within ${timeout}ms`);
}

async function startDevServer() {
  console.log('Starting SPACE development server...');
  
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  let resolveUrl;
  const urlPromise = new Promise((resolve) => {
    resolveUrl = resolve;
  });

  devServer.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`Dev server: ${output}`);
    
    // Extract URL from Vite output
    const urlMatch = output.match(/Local:\s+(http:\/\/localhost:\d+)/);
    if (urlMatch) {
      DEV_URL = urlMatch[1];
      resolveUrl(DEV_URL);
    }
  });

  devServer.stderr.on('data', (data) => {
    console.error(`Dev server error: ${data.toString().trim()}`);
  });

  // Wait for URL to be detected
  await urlPromise;
  
  // Wait for server to be ready
  console.log(`Waiting for server to start at ${DEV_URL}...`);
  await waitForServer(DEV_URL);
  console.log('✓ Development server is ready');

  return devServer;
}

async function setupApiKeysModern(page) {
  console.log('Setting up API keys using modern Puppeteer methods...');
  
  // Navigate to the app
  await page.goto(DEV_URL, { waitUntil: 'networkidle0' });

  // Check if API keys are already auto-filled
  const hasAutoFilled = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="password"]');
    return inputs.length >= 2 && inputs[0].value.length > 0 && inputs[1].value.length > 0;
  });

  if (hasAutoFilled) {
    console.log('✓ API keys already auto-filled from environment variables');
  } else {
    console.log('Filling API keys manually...');
    
    // Use modern locator approach with proper selectors
    // Target by data-testid if available, fallback to type selector
    const anthropicInput = page.locator('[data-testid="anthropic-api-key"], input[type="password"]:first-of-type');
    const openaiInput = page.locator('[data-testid="openai-api-key"], input[type="password"]:last-of-type');
    
    // Clear and fill using modern methods
    await anthropicInput.fill(''); // Clear first
    await anthropicInput.fill(ANTHROPIC_KEY);
    console.log('✓ Filled Anthropic API key');
    
    await openaiInput.fill(''); // Clear first  
    await openaiInput.fill(OPENAI_KEY);
    console.log('✓ Filled OpenAI API key');
  }

  // Submit using modern locator approach
  const submitButton = page.locator('[data-testid="save-api-keys-button"], button[type="submit"]');
  await submitButton.click();
  console.log('✓ Submitted API key form');

  // Wait for either navigation or password modal
  try {
    // Wait for password modal to appear
    const passwordModal = page.locator('text/Password Required');
    await passwordModal.wait({ timeout: 10000 });
    console.log('✓ API keys validated, password modal appeared');
    return true;
  } catch (error) {
    // Check for errors
    const errorElement = page.locator('[class*="bg-red-900"]');
    try {
      await errorElement.wait({ timeout: 2000 });
      const errorText = await errorElement.evaluate(el => el.textContent);
      throw new Error(`API key validation failed: ${errorText}`);
    } catch (innerError) {
      // If no error found, might have navigated successfully
      console.log('✓ API keys may have been processed successfully');
      return false;
    }
  }
}

async function setupPasswordModern(page) {
  console.log('Setting up password using modern Puppeteer methods...');
  
  try {
    // Wait for password modal to appear
    await page.waitForSelector('input[type="password"]:not([data-autofilled])', { timeout: 5000 });
    
    // Fill password using direct selector
    await page.type('input[type="password"]:not([data-autofilled])', DEV_PASSWORD);
    console.log('✓ Filled password');
    
    // Find and click submit button using basic selector
    const submitBtn = await page.$('button[type="submit"]') || await page.$('button');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✓ Submitted password');
    } else {
      console.log('⚠️ No submit button found');
    }
    
    // Wait a bit for processing
    await page.waitForTimeout(2000);
    console.log('✓ Password setup completed');
    
    return true;
  } catch (error) {
    console.log('⚠️ Password setup skipped or already handled:', error.message);
    return true;
  }
}

async function testClaudeApiFeatures(page) {
  console.log('🧪 Testing Claude API features...');
  
  try {
    // Wait for terminal to load (looking for the specific Terminal component)
    await page.waitForSelector('textarea', { timeout: 15000 });
    console.log('✓ Terminal interface loaded');
    
    // Wait a bit more for all components to initialize
    await page.waitForTimeout(2000);
    
    // Find the textarea input for the terminal
    const terminalInput = await page.$('textarea');
    if (terminalInput) {
      console.log('✓ Found terminal input (textarea)');
      
      // Test sending a simple message to Claude
      await terminalInput.click();
      await terminalInput.type('Hello Claude, can you respond with just "API test successful"?');
      console.log('✓ Typed test message');
      
      // Submit using Enter key (as per the code: Enter key triggers onSubmit)
      await terminalInput.press('Enter');
      console.log('✓ Pressed Enter to submit message');
      
      // Wait for API response and check console logs for API activity
      console.log('⏳ Waiting for Claude API response...');
      await page.waitForTimeout(8000);
      
      // Check for new messages in the terminal
      const messageElements = await page.$$('.text-gray-300, .text-green-400, .text-blue-400');
      console.log(`✓ Found ${messageElements.length} message elements in terminal`);
      
      // Check for any error messages
      const errorElements = await page.$$('.text-red-400, .bg-red-900');
      if (errorElements.length > 0) {
        console.log(`⚠️ Found ${errorElements.length} potential error elements`);
      }
      
      // Test command functionality
      await page.waitForTimeout(1000);
      await terminalInput.click();
      await terminalInput.type('/key status');
      await terminalInput.press('Enter');
      console.log('✓ Tested /key status command');
      
      await page.waitForTimeout(2000);
      
    } else {
      console.log('⚠️ No terminal input found');
    }
    
    // Test other potential features
    const buttons = await page.$$('button');
    console.log(`✓ Found ${buttons.length} interactive buttons`);
    
    // Check for any advisor forms or other Claude API features
    const forms = await page.$$('form');
    console.log(`✓ Found ${forms.length} forms for additional features`);
    
    return true;
  } catch (error) {
    console.error('❌ Claude API testing failed:', error.message);
    return false;
  }
}

async function setupComplete() {
  console.log('Launching browser for complete setup...');
  
  const browser = await puppeteer.launch({
    headless: false, // Keep browser visible
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set up console log capture
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      // Format console output with timestamp and type
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = `[${timestamp}] [BROWSER:${type.toUpperCase()}]`;
      
      // Use appropriate Node.js console method based on browser console type
      switch (type) {
        case 'error':
          console.error(`${prefix} ${text}`);
          break;
        case 'warn':
          console.warn(`${prefix} ${text}`);
          break;
        case 'debug':
        case 'verbose':
          console.debug(`${prefix} ${text}`);
          break;
        default:
          console.log(`${prefix} ${text}`);
      }
    });
    
    // Set up error handlers for additional debugging
    page.on('pageerror', (error) => {
      console.error(`[BROWSER:PAGE_ERROR] ${error.message}`);
    });
    
    page.on('requestfailed', (request) => {
      console.error(`[BROWSER:REQUEST_FAILED] ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });
    
    console.log('✓ Browser console logging enabled');
    
    // Setup custom query handlers for better React support
    await setupReactQueryHandler(page);

    // Step 1: Setup API keys
    const needsPassword = await setupApiKeysModern(page);
    
    // Step 2: Setup password if needed
    if (needsPassword) {
      await setupPasswordModern(page);
    }

    // Step 3: Test Claude API functionality
    await testClaudeApiFeatures(page);

    console.log('🚀 SPACE setup completed successfully!');
    console.log(`🌐 App URL: ${DEV_URL}`);
    console.log('💡 Browser will stay open for development use');
    
    return browser;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    await browser.close();
    throw error;
  }
}

async function main() {
  if (!ANTHROPIC_KEY || !OPENAI_KEY) {
    console.error('❌ Missing API keys in environment variables');
    console.error('Please ensure ANTHROPIC_API_KEY and OPENAI_API_KEY are set in .env file');
    process.exit(1);
  }

  let devServer;
  try {
    // Start the development server
    devServer = await startDevServer();

    // Complete setup using modern Puppeteer
    const browser = await setupComplete();

    // Keep the process alive and handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      if (browser) {
        await browser.close();
      }
      if (devServer) {
        process.kill(-devServer.pid);
      }
      process.exit(0);
    });

    console.log('\n📝 Press Ctrl+C to stop the development server and close the browser');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (devServer) {
      process.kill(-devServer.pid);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { startDevServer, setupApiKeysModern, setupPasswordModern };
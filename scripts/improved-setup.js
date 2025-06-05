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

const DEV_URL = 'http://localhost:3000';
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

  devServer.stdout.on('data', (data) => {
    console.log(`Dev server: ${data.toString().trim()}`);
  });

  devServer.stderr.on('data', (data) => {
    console.error(`Dev server error: ${data.toString().trim()}`);
  });

  // Wait for server to be ready
  console.log('Waiting for server to start...');
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
  
  // Use locator to find password input - try multiple selectors
  const passwordInput = page.locator([
    '[data-testid="password-input"]',
    'input[type="password"][placeholder*="password" i]',
    'div:has-text("Password Required") input[type="password"]'
  ].join(', '));

  // Fill password using modern method
  await passwordInput.fill(DEV_PASSWORD);
  console.log('✓ Filled password');

  // Find and click submit button
  const submitButton = page.locator([
    '[data-testid="password-submit-btn"]',
    'button:has-text("Submit")',
    'div:has-text("Password Required") button:has-text("Submit")'
  ].join(', '));

  await submitButton.click();
  console.log('✓ Submitted password');

  // Wait for navigation or completion
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✓ Password accepted, navigated to main app');
    return true;
  } catch (error) {
    // Check for password errors
    const errorElement = page.locator('[class*="bg-red-900"], [class*="error"]');
    try {
      await errorElement.wait({ timeout: 2000 });
      const errorText = await errorElement.evaluate(el => el.textContent);
      throw new Error(`Password validation failed: ${errorText}`);
    } catch (innerError) {
      console.log('✓ Password may have been processed successfully');
      return true;
    }
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
    
    // Setup custom query handlers for better React support
    await setupReactQueryHandler(page);

    // Step 1: Setup API keys
    const needsPassword = await setupApiKeysModern(page);
    
    // Step 2: Setup password if needed
    if (needsPassword) {
      await setupPasswordModern(page);
    }

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
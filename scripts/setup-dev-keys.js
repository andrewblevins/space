#!/usr/bin/env node

/**
 * Puppeteer script to automatically configure API keys in SPACE development environment
 * 
 * This script:
 * 1. Starts the SPACE development server
 * 2. Opens the app in a browser
 * 3. Automatically fills in API keys from environment variables
 * 4. Validates the keys and completes setup
 * 5. Leaves the browser open for development use
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

async function setupApiKeys() {
  console.log('Launching browser and setting up API keys...');
  
  const browser = await puppeteer.launch({
    headless: false, // Keep browser visible for development
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
    
    // Navigate to the app
    console.log('Navigating to SPACE app...');
    await page.goto(DEV_URL, { waitUntil: 'networkidle0' });

    // Check if we're on the API key setup page
    const setupForm = await page.$('form');
    if (!setupForm) {
      console.log('✓ API keys already configured, no setup needed');
      return browser;
    }

    console.log('Found API key setup form, filling in credentials...');

    // Use the new automation API for easier interaction
    console.log('Using automation API to set API keys...');
    
    const result = await page.evaluate((anthropicKey, openaiKey) => {
      // Wait for the automation API to be available
      if (!window.spaceAutomation) {
        throw new Error('Automation API not available - may need to wait for component to mount');
      }
      
      // Use the exposed automation API
      const setResult = window.spaceAutomation.setApiKeys(anthropicKey, openaiKey);
      const currentState = window.spaceAutomation.getCurrentState();
      
      return {
        setResult,
        currentState,
        success: setResult.success && !currentState.hasError
      };
    }, ANTHROPIC_KEY, OPENAI_KEY);

    if (!result.success) {
      throw new Error(`Failed to set API keys: ${JSON.stringify(result)}`);
    }

    console.log('✓ Successfully set API keys using automation API');

    // Submit the form using the automation API
    console.log('Submitting API key form...');
    
    const submitResult = await page.evaluate(() => {
      if (!window.spaceAutomation) {
        // Fallback to manual click if automation API not available
        const button = document.querySelector('[data-testid="save-api-keys-button"]');
        if (button) {
          button.click();
          return { success: true, method: 'manual-click' };
        }
        return { success: false, error: 'Submit button not found' };
      }
      
      // Use automation API
      return { ...window.spaceAutomation.submitForm(), method: 'automation-api' };
    });
    
    if (!submitResult.success) {
      throw new Error(`Failed to submit form: ${submitResult.error}`);
    }
    
    console.log(`✓ Form submitted via ${submitResult.method}`);

    // Wait for either success (redirect) or error message
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      console.log('✓ API keys validated and saved successfully!');
    } catch (error) {
      // Check for error message on the same page
      const errorElement = await page.$('.bg-red-900\\/50');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        throw new Error(`API key validation failed: ${errorText}`);
      }
      throw error;
    }

    console.log('🚀 SPACE is ready for development!');
    console.log(`🌐 App URL: ${DEV_URL}`);
    console.log('💡 The browser will stay open for you to use the app');
    
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

    // Setup API keys in browser
    const browser = await setupApiKeys();

    // Keep the process alive and handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      if (browser) {
        await browser.close();
      }
      if (devServer) {
        process.kill(-devServer.pid); // Kill entire process group
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

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { startDevServer, setupApiKeys };
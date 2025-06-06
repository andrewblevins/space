#!/usr/bin/env node

/**
 * Test script to verify console logging and Claude API functionality
 * Assumes the dev server is already running
 */

import puppeteer from 'puppeteer';

async function testClaudeApiWithLogging() {
  console.log('🧪 Testing console logging and Claude API...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set up comprehensive console log capture
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = `[${timestamp}] [BROWSER:${type.toUpperCase()}]`;
      
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
    
    // Set up error handlers
    page.on('pageerror', (error) => {
      console.error(`[BROWSER:PAGE_ERROR] ${error.message}`);
      console.error(`[BROWSER:STACK] ${error.stack}`);
    });
    
    page.on('requestfailed', (request) => {
      console.error(`[BROWSER:REQUEST_FAILED] ${request.url()} - ${request.failure()?.errorText || 'Unknown error'}`);
    });
    
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (url.includes('anthropic') || url.includes('openai') || url.includes('claude')) {
        console.log(`[BROWSER:API_RESPONSE] ${status} ${url}`);
      }
    });
    
    console.log('✓ Console logging and error handling enabled');
    
    // Try different potential ports
    const ports = [3000, 3001, 3002, 3003];
    let successfulUrl = null;
    
    for (const port of ports) {
      try {
        const url = `http://localhost:${port}`;
        console.log(`Trying ${url}...`);
        
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
        successfulUrl = url;
        console.log(`✓ Connected to ${url}`);
        break;
      } catch (error) {
        console.log(`⚠️ Port ${port} not accessible`);
      }
    }
    
    if (!successfulUrl) {
      throw new Error('No accessible development server found on ports 3000-3003');
    }
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✓ Page loaded, checking interface...');
    
    // Check what kind of interface we have
    const hasTextarea = await page.$('textarea');
    const hasPasswordInputs = await page.$$('input[type="password"]');
    const hasButtons = await page.$$('button');
    
    console.log(`Interface check:`);
    console.log(`- Textarea: ${hasTextarea ? '✓' : '✗'}`);
    console.log(`- Password inputs: ${hasPasswordInputs.length}`);
    console.log(`- Buttons: ${hasButtons.length}`);
    
    if (hasPasswordInputs.length > 0) {
      console.log('📝 API key setup form detected');
      // If we're on the setup page, we can see if auto-fill worked
      const firstInput = hasPasswordInputs[0];
      const hasValue = await firstInput.evaluate(el => el.value.length > 0);
      console.log(`- Auto-fill status: ${hasValue ? '✓ Working' : '✗ Not working'}`);
    }
    
    if (hasTextarea) {
      console.log('💬 Terminal interface detected - testing Claude API...');
      
      // Test Claude API interaction
      await hasTextarea.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test a simple command first
      await hasTextarea.type('/key status');
      await hasTextarea.press('Enter');
      console.log('✓ Sent /key status command');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear and test Claude message
      await hasTextarea.click();
      await page.keyboard.down('Meta'); // Cmd on Mac
      await page.keyboard.press('a');   // Select all
      await page.keyboard.up('Meta');
      
      await hasTextarea.type('Hello Claude! Please respond with just "Console logging test successful" so I can verify the API is working.');
      console.log('✓ Typed test message to Claude');
      
      await hasTextarea.press('Enter');
      console.log('✓ Sent message to Claude');
      
      // Wait for response and monitor console logs
      console.log('⏳ Waiting for Claude API response...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check for any visible responses in the UI
      const messages = await page.$$eval('[class*="text-"]', elements => 
        elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 10)
      );
      
      console.log(`✓ Found ${messages.length} text elements in UI`);
      if (messages.length > 0) {
        console.log('Recent messages:', messages.slice(-3));
      }
    }
    
    // Test for any error states
    const errorElements = await page.$$('[class*="bg-red"], [class*="text-red"]');
    if (errorElements.length > 0) {
      console.log(`⚠️ Found ${errorElements.length} potential error indicators`);
      const errorTexts = await Promise.all(
        errorElements.slice(0, 3).map(el => el.evaluate(e => e.textContent?.trim()))
      );
      console.log('Error texts:', errorTexts.filter(Boolean));
    }
    
    console.log('\n🎉 Testing completed! Check the console logs above for:');
    console.log('  - Browser console messages with [BROWSER:*] prefix');
    console.log('  - API request/response logs');
    console.log('  - Any error messages or failures');
    console.log('\n💡 The browser will stay open for manual testing.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {}); // Wait indefinitely
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testClaudeApiWithLogging().catch(console.error);
}
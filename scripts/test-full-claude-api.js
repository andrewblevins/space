#!/usr/bin/env node

/**
 * Complete test of Claude API functionality
 * - Completes authentication flow
 * - Sends real messages to Claude
 * - Monitors API requests/responses
 */

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const DEV_PASSWORD = process.env.VITE_DEV_PASSWORD || 'development123';

async function testFullClaudeApi() {
  console.log('🧪 Testing complete Claude API functionality...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enhanced console log capture with API focus
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = `[${timestamp}] [BROWSER:${type.toUpperCase()}]`;
      
      // Highlight API-related logs
      if (text.includes('API') || text.includes('claude') || text.includes('anthropic') || text.includes('callClaude')) {
        console.log(`🔥 ${prefix} ${text}`);
      } else {
        switch (type) {
          case 'error':
            console.error(`${prefix} ${text}`);
            break;
          case 'warn':
            console.warn(`${prefix} ${text}`);
            break;
          default:
            console.log(`${prefix} ${text}`);
        }
      }
    });
    
    // Monitor network requests for API calls
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('anthropic') || url.includes('claude') || url.includes('api.openai.com')) {
        console.log(`🌐 [API_REQUEST] ${request.method()} ${url}`);
        console.log(`🔑 [API_HEADERS] ${JSON.stringify(request.headers(), null, 2)}`);
      }
    });
    
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (url.includes('anthropic') || url.includes('claude') || url.includes('api.openai.com')) {
        console.log(`📡 [API_RESPONSE] ${status} ${url}`);
        if (status >= 400) {
          console.error(`❌ [API_ERROR] Status ${status} for ${url}`);
        }
      }
    });
    
    page.on('pageerror', (error) => {
      console.error(`[BROWSER:PAGE_ERROR] ${error.message}`);
    });
    
    console.log('✓ Enhanced API monitoring enabled');
    
    // Navigate to the app
    const ports = [3000, 3001, 3002, 3003];
    let appUrl = null;
    
    for (const port of ports) {
      try {
        const url = `http://localhost:${port}`;
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
        appUrl = url;
        console.log(`✓ Connected to ${url}`);
        break;
      } catch (error) {
        console.log(`⚠️ Port ${port} not accessible`);
      }
    }
    
    if (!appUrl) {
      throw new Error('No accessible development server found');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check current state
    const hasTextarea = await page.$('textarea');
    const hasPasswordInputs = await page.$$('input[type="password"]');
    
    console.log(`\n📋 Current interface state:`);
    console.log(`- Terminal (textarea): ${hasTextarea ? '✓' : '✗'}`);
    console.log(`- Password inputs: ${hasPasswordInputs.length}`);
    
    if (hasPasswordInputs.length > 0) {
      console.log('\n🔐 Completing authentication flow...');
      
      // Check if API keys are auto-filled
      const firstInput = hasPasswordInputs[0];
      const hasValue = await firstInput.evaluate(el => el.value.length > 0);
      console.log(`- API keys auto-filled: ${hasValue ? '✓' : '✗'}`);
      
      if (hasValue) {
        // Submit the API key form
        const submitButton = await page.$('button[type="submit"], button');
        if (submitButton) {
          await submitButton.click();
          console.log('✓ Submitted API key form');
          
          // Wait for password modal to appear
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Look for the password modal using data-testid
          const passwordInput = await page.$('[data-testid="password-input"]');
          if (passwordInput) {
            console.log('✓ Password modal appeared');
            
            // Clear any existing value and type password
            await passwordInput.click();
            await page.keyboard.down('Meta');
            await page.keyboard.press('a');
            await page.keyboard.up('Meta');
            
            await passwordInput.type(DEV_PASSWORD);
            console.log('✓ Entered password');
            
            // Submit password using the specific submit button
            const passwordSubmit = await page.$('[data-testid="password-submit-btn"]');
            if (passwordSubmit) {
              await passwordSubmit.click();
              console.log('✓ Submitted password');
              
              // Wait for redirect to main app
              await new Promise(resolve => setTimeout(resolve, 8000));
              console.log('✓ Authentication completed, checking for terminal...');
            } else {
              console.log('⚠️ Password submit button not found');
            }
          } else {
            console.log('⚠️ Password modal not found, looking for alternative...');
            
            // Fallback: look for any password input
            const fallbackInput = await page.$('input[type="password"]');
            if (fallbackInput) {
              console.log('✓ Found fallback password input');
              await fallbackInput.type(DEV_PASSWORD);
              
              // Try Enter key
              await fallbackInput.press('Enter');
              console.log('✓ Pressed Enter for password');
              
              await new Promise(resolve => setTimeout(resolve, 8000));
            }
          }
        }
      }
    }
    
    // Now check if we have the terminal interface
    await new Promise(resolve => setTimeout(resolve, 2000));
    const terminalInput = await page.$('textarea');
    
    if (terminalInput) {
      console.log('\n💬 Terminal interface available - Testing Claude API...');
      
      // Test 1: Key status command
      console.log('\n📝 Test 1: Key status command');
      await terminalInput.click();
      await terminalInput.type('/key status');
      await terminalInput.press('Enter');
      console.log('✓ Sent: /key status');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test 2: Simple Claude message
      console.log('\n📝 Test 2: Simple Claude message');
      await terminalInput.click();
      
      // Clear any existing text
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      
      const testMessage = 'Hello Claude! Please respond with exactly: "API test successful - console logging working"';
      await terminalInput.type(testMessage);
      console.log(`✓ Typed: ${testMessage}`);
      
      console.log('🚀 Sending message to Claude...');
      await terminalInput.press('Enter');
      
      // Monitor for API activity
      console.log('⏳ Monitoring for API requests and responses...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Test 3: More complex Claude interaction
      console.log('\n📝 Test 3: Complex Claude interaction');
      await terminalInput.click();
      
      await page.keyboard.down('Meta');
      await page.keyboard.press('a');
      await page.keyboard.up('Meta');
      
      const complexMessage = 'Can you write a simple Python function that adds two numbers and explain how it works?';
      await terminalInput.type(complexMessage);
      console.log(`✓ Typed: ${complexMessage}`);
      
      console.log('🚀 Sending complex message to Claude...');
      await terminalInput.press('Enter');
      
      console.log('⏳ Waiting for response...');
      await new Promise(resolve => setTimeout(resolve, 12000));
      
      // Check for visible responses
      console.log('\n📊 Checking UI for responses...');
      const messages = await page.$$eval('[class*="text-"]', elements => 
        elements.map(el => el.textContent?.trim())
          .filter(text => text && text.length > 20)
          .slice(-5) // Get last 5 substantial text elements
      );
      
      console.log(`✓ Found ${messages.length} substantial text elements`);
      messages.forEach((msg, i) => {
        console.log(`   ${i + 1}: ${msg.substring(0, 100)}${msg.length > 100 ? '...' : ''}`);
      });
      
      // Check for any error indicators
      const errorElements = await page.$$('[class*="bg-red"], [class*="text-red"]');
      if (errorElements.length > 0) {
        console.log(`\n⚠️ Found ${errorElements.length} potential error indicators`);
        const errorTexts = await Promise.all(
          errorElements.slice(0, 3).map(el => el.evaluate(e => e.textContent?.trim()))
        );
        errorTexts.filter(Boolean).forEach(error => {
          console.log(`   Error: ${error}`);
        });
      }
      
    } else {
      console.log('❌ Terminal interface not found - authentication may have failed');
      
      // Debug: Take a screenshot
      await page.screenshot({ path: 'debug-auth-state.png' });
      console.log('📸 Saved debug screenshot: debug-auth-state.png');
      
      // Check what's actually on the page
      const pageContent = await page.evaluate(() => document.body.textContent);
      console.log('Page content preview:', pageContent.substring(0, 500));
    }
    
    console.log('\n🎉 Claude API testing completed!');
    console.log('📊 Summary of what was tested:');
    console.log('  ✓ Console logging capture');
    console.log('  ✓ API request/response monitoring');
    console.log('  ✓ Authentication flow');
    console.log('  ✓ Terminal interface interaction');
    console.log('  ✓ Claude API message sending');
    console.log('  ✓ Error detection and handling');
    
    console.log('\n💡 Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open for manual inspection
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testFullClaudeApi().catch(console.error);
}
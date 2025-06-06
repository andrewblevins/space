#!/usr/bin/env node

/**
 * Test script specifically for metaphors and questions features
 */

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const DEV_PASSWORD = process.env.VITE_DEV_PASSWORD || 'development123';

async function testMetaphorsAndQuestions() {
  console.log('🧪 Testing Metaphors and Questions features...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enhanced console log capture focusing on OpenAI and feature analysis
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      const prefix = `[${timestamp}] [BROWSER:${type.toUpperCase()}]`;
      
      // Highlight OpenAI, metaphor, and question analysis logs
      if (text.includes('OpenAI') || text.includes('metaphor') || text.includes('question') || 
          text.includes('🔍') || text.includes('❓') || text.includes('✅')) {
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
    
    page.on('pageerror', (error) => {
      console.error(`[BROWSER:PAGE_ERROR] ${error.message}`);
    });
    
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
    
    // Complete authentication if needed
    const hasPasswordInputs = await page.$$('input[type="password"]');
    if (hasPasswordInputs.length > 0) {
      console.log('🔐 Completing authentication...');
      
      const submitButton = await page.$('button[type="submit"], button');
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const passwordInput = await page.$('[data-testid="password-input"]');
        if (passwordInput) {
          await passwordInput.type(DEV_PASSWORD);
          const passwordSubmit = await page.$('[data-testid="password-submit-btn"]');
          if (passwordSubmit) {
            await passwordSubmit.click();
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
    }
    
    // Check for terminal interface
    const terminalInput = await page.$('textarea');
    if (!terminalInput) {
      throw new Error('Terminal interface not found');
    }
    
    console.log('✓ Terminal interface ready');
    
    // Step 1: Expand the Metaphors panel
    console.log('\n📝 Step 1: Expanding Metaphors panel...');
    const metaphorsPanel = await page.$('text/Metaphors');
    if (metaphorsPanel) {
      await metaphorsPanel.click();
      console.log('✓ Clicked Metaphors panel');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('⚠️ Metaphors panel not found, trying alternative selector');
      // Try to find by text content
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const metaphorsElement = elements.find(el => el.textContent?.includes('Metaphors'));
        if (metaphorsElement) {
          metaphorsElement.click();
        }
      });
    }
    
    // Step 2: Expand the Questions panel  
    console.log('\n📝 Step 2: Expanding Questions panel...');
    const questionsPanel = await page.$('text/Questions');
    if (questionsPanel) {
      await questionsPanel.click();
      console.log('✓ Clicked Questions panel');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log('⚠️ Questions panel not found, trying alternative selector');
      await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const questionsElement = elements.find(el => el.textContent?.includes('Questions'));
        if (questionsElement) {
          questionsElement.click();
        }
      });
    }
    
    // Step 3: Send a metaphor-rich message
    console.log('\n📝 Step 3: Sending metaphor-rich message...');
    await terminalInput.click();
    
    const metaphorMessage = "I feel like I'm navigating through a storm in my career. The path ahead is foggy, and I'm building bridges as I walk. Life feels like a marathon, not a sprint, but I'm worried I'm running out of steam. My mind is a computer that needs rebooting.";
    await terminalInput.type(metaphorMessage);
    console.log(`✓ Typed: ${metaphorMessage}`);
    
    console.log('🚀 Sending metaphor-rich message to Claude...');
    await terminalInput.press('Enter');
    
    console.log('⏳ Waiting for Claude response and metaphor analysis...');
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Step 4: Send a follow-up message to trigger questions
    console.log('\n📝 Step 4: Sending follow-up message...');
    await terminalInput.click();
    
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    
    const followupMessage = "I think the main challenge is that I don't know if I should focus on technical skills or people skills. Both seem important but require different approaches.";
    await terminalInput.type(followupMessage);
    console.log(`✓ Typed: ${followupMessage}`);
    
    console.log('🚀 Sending follow-up message...');
    await terminalInput.press('Enter');
    
    console.log('⏳ Waiting for response and question generation...');
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Step 5: Check the results
    console.log('\n📊 Step 5: Checking results...');
    
    // Check metaphors panel
    const metaphorsContent = await page.evaluate(() => {
      const metaphorsElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent?.includes('Metaphors'))
        .map(el => el.textContent);
      return metaphorsElements;
    });
    
    console.log('Metaphors panel content:', metaphorsContent);
    
    // Check questions panel
    const questionsContent = await page.evaluate(() => {
      const questionsElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent?.includes('Questions'))
        .map(el => el.textContent);
      return questionsElements;
    });
    
    console.log('Questions panel content:', questionsContent);
    
    console.log('\n🎉 Metaphors and Questions testing completed!');
    console.log('📊 Check the console logs above for:');
    console.log('  - OpenAI client initialization');
    console.log('  - Metaphor analysis with 🔍 prefix');
    console.log('  - Question generation with ❓ prefix');
    console.log('  - Success messages with ✅ prefix');
    console.log('\n💡 Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close when done.');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testMetaphorsAndQuestions().catch(console.error);
}
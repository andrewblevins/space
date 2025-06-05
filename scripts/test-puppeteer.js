#!/usr/bin/env node

/**
 * Simple test script to verify Puppeteer can connect to SPACE
 */

import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('Testing Puppeteer connection to SPACE...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to localhost:3000
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    // Take a screenshot
    await page.screenshot({ path: 'space-screenshot.png' });
    console.log('✓ Screenshot saved as space-screenshot.png');

    // Check if we can find the API key form
    const form = await page.$('form');
    if (form) {
      console.log('✓ Found API key setup form');
      
      // Check for input fields
      const inputs = await page.$$('input[type="password"]');
      console.log(`✓ Found ${inputs.length} password input fields`);
      
      if (inputs.length >= 2) {
        console.log('✓ Ready for API key automation');
      }
    } else {
      console.log('✓ No setup form found - may already be configured');
    }

    console.log('\n🎉 Puppeteer test successful!');
    console.log('Close the browser window when ready...');

    // Wait for user to close browser
    page.on('close', () => {
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testPuppeteer().catch(console.error);
}
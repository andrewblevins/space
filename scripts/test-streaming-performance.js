/**
 * Performance test script for diagnosing streaming slowdown issues
 * 
 * Run with: node scripts/test-streaming-performance.js
 * 
 * This script will:
 * 1. Start the dev server in detached mode
 * 2. Launch Puppeteer with performance monitoring
 * 3. Enable debug mode to activate performance logging
 * 4. Simulate a long conversation to trigger slowdown
 * 5. Capture and analyze performance metrics
 */

const puppeteer = require('puppeteer');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function testStreamingPerformance() {
  let browser;
  let devServerProcess;
  
  try {
    console.log('🚀 Starting SPACE Terminal performance test...');
    
    // 1. Start dev server in detached mode
    console.log('📡 Starting development server...');
    devServerProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      detached: false,
      cwd: process.cwd()
    });
    
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log('✅ Development server started');
    
    // 2. Launch browser with performance monitoring
    browser = await puppeteer.launch({
      headless: false, // Keep visible to observe behavior
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-logging',
        '--v=1'
      ],
      devtools: true // Open dev tools automatically
    });
    
    const page = await browser.newPage();
    
    // Enable console logging to capture performance metrics
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      console.log(`[${timestamp}] [BROWSER:${type.toUpperCase()}] ${text}`);
    });
    
    // Navigate to application
    console.log('🌐 Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Setup API keys and enable debug mode
    console.log('🔧 Setting up application...');
    try {
      await page.locator('[data-testid="save-api-keys-button"]').click();
      await page.locator('[data-testid="password-input"]').fill('development123');
      await page.locator('[data-testid="password-submit-btn"]').click();
      console.log('✅ API setup completed');
    } catch (error) {
      console.log('⚠️ API setup skipped - might already be configured');
    }
    
    // Wait for main interface
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Enable debug mode to activate performance logging
    console.log('🔧 Enabling debug mode...');
    try {
      await page.locator('.fixed.bottom-4.left-4 button').click(); // Settings gear
      await page.waitForTimeout(500);
      await page.locator('.relative.inline-flex').click(); // Debug toggle
      console.log('✅ Debug mode enabled');
      
      // Close settings
      await page.keyboard.press('Escape');
    } catch (error) {
      console.log('⚠️ Debug mode setup failed:', error.message);
    }
    
    // 3. Simulate conversation that will trigger slowdown
    const testMessages = [
      'Hello, I need help with a complex software architecture problem.',
      'Can you explain microservices architecture and its tradeoffs?',
      'What are the best practices for API design in distributed systems?',
      'How do you handle data consistency across microservices?',
      'What monitoring and logging strategies work best?',
      'How do you implement authentication in a microservices environment?',
      'What are the common pitfalls to avoid when designing microservices?',
      'Can you explain different deployment strategies for microservices?',
      'How do you handle service discovery and load balancing?',
      'What are the security considerations for microservices architecture?'
    ];
    
    console.log('💬 Starting conversation simulation...');
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📤 Sending message ${i + 1}/${testMessages.length}: "${message.substring(0, 50)}..."`);
      
      // Type message
      await page.locator('form input').fill(message);
      
      // Submit and wait for response to start
      await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true })));
      
      // Wait for loading to start and finish
      await page.waitForSelector('.text-amber-600', { timeout: 5000 });
      console.log('⏳ Response streaming started...');
      
      // Wait for streaming to complete (loading indicator disappears)
      await page.waitForFunction(
        () => !document.querySelector('.text-amber-600'),
        { timeout: 60000 } // 1 minute timeout for response
      );
      
      console.log(`✅ Message ${i + 1} completed`);
      
      // Brief pause between messages
      await page.waitForTimeout(1000);
    }
    
    console.log('\n🏁 Conversation simulation complete');
    console.log('📊 Check browser console for performance metrics');
    console.log('🔍 Look for patterns in streaming intervals and render times');
    
    // Generate final performance report
    await page.evaluate(() => {
      if (window.performanceLogger) {
        console.log('\n=== FINAL PERFORMANCE REPORT ===');
        window.performanceLogger.generateReport();
      }
    });
    
    // Keep browser open for manual inspection
    console.log('\n✋ Keeping browser open for manual inspection...');
    console.log('💡 Press Ctrl+C to close when you\'re done analyzing');
    
    // Wait indefinitely until user interrupts
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    if (devServerProcess) {
      devServerProcess.kill('SIGTERM');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Run the test
testStreamingPerformance().catch(console.error);
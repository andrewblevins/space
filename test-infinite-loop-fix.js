import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting infinite loop fix test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from browser
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[${timestamp}] [BROWSER:${type.toUpperCase()}] ${text}`);
  });
  
  // Track errors
  let errorCount = 0;
  let maxDepthError = false;
  
  page.on('pageerror', (error) => {
    errorCount++;
    console.log(`❌ [PAGE ERROR ${errorCount}] ${error.message}`);
    if (error.message.includes('Maximum update depth exceeded')) {
      maxDepthError = true;
      console.log('🚨 INFINITE LOOP DETECTED!');
    }
  });
  
  try {
    console.log('📱 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('⏳ Waiting 10 seconds to observe console behavior...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check for repeated "🔒 Encrypted keys found" messages
    const logs = await page.evaluate(() => {
      return window.consoleMessages || [];
    });
    
    console.log(`📊 Test Results:`);
    console.log(`- Total page errors: ${errorCount}`);
    console.log(`- Maximum update depth error: ${maxDepthError ? 'YES' : 'NO'}`);
    
    if (maxDepthError) {
      console.log('❌ INFINITE LOOP STILL EXISTS');
    } else {
      console.log('✅ NO INFINITE LOOP DETECTED');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  console.log('🔍 Browser will stay open for manual inspection. Close manually when done.');
  // Don't close browser - let user inspect manually
  // await browser.close();
})();
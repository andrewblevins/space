import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Testing reasoning mode...');
  
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
  
  page.on('pageerror', (error) => {
    errorCount++;
    console.log(`❌ [PAGE ERROR ${errorCount}] ${error.message}`);
  });
  
  try {
    console.log('📱 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if already logged in by looking for the main interface
    const hasMainInterface = await page.$('.fixed.bottom-4.left-4 button');
    
    if (!hasMainInterface) {
      console.log('🔑 Setting up API keys...');
      await page.locator('[data-testid="save-api-keys-button"]').click();
      await page.locator('[data-testid="password-input"]').fill('development123');
      await page.locator('[data-testid="password-submit-btn"]').click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Enable reasoning mode
    console.log('⚙️ Opening settings menu...');
    await page.locator('.fixed.bottom-4.left-4 button').click();
    
    console.log('🧠 Enabling reasoning mode...');
    // Look for reasoning mode toggle (it might be a switch/toggle)
    await page.locator('text=Reasoning Mode').click();
    
    // Close settings
    await page.locator('.fixed.bottom-4.left-4 button').click();
    
    console.log('💬 Testing reasoning mode with a complex question...');
    await page.locator('input[type="text"]').fill('think through all the pros and cons of renewable energy');
    await page.locator('input[type="text"]').press('Enter');
    
    console.log('⏳ Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log(`📊 Test completed with ${errorCount} errors`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  console.log('🔍 Browser will stay open for manual inspection.');
})();
# SPACE Automation Guide

## Overview
SPACE is designed to be automation-friendly for development, testing, and AI assistant interactions. This guide covers the patterns and tools available.

## Quick Start

### Automated Setup
```bash
npm run dev:setup
```
This command automatically handles the complete development setup process.

### Manual Browser Automation
```javascript
// Modern Puppeteer approach for React apps
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// Use locators with .fill() for React compatibility
await page.locator('[data-testid="anthropic-api-key"]').fill('sk-ant-...');
await page.locator('[data-testid="save-api-keys-button"]').click();
```

## Automation-Friendly Patterns

### 1. Data-TestId Attributes
Components include `data-testid` attributes for reliable element targeting:

```jsx
// API Key Setup
<input data-testid="anthropic-api-key" />
<input data-testid="openai-api-key" />
<button data-testid="save-api-keys-button" />

// Password Modal
<input data-testid="password-input" />
<button data-testid="password-submit-btn" />
```

### 2. Environment Variable Auto-Fill
API keys auto-fill from environment variables in development:

```bash
# .env file
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
VITE_DEV_PASSWORD=development123
```

### 3. Modern Puppeteer Methods
Always use modern Puppeteer patterns for React compatibility:

```javascript
// ✅ Good - Modern locator approach
await page.locator('input').fill('value');
await page.locator('[data-testid="submit-btn"]').click();
await page.locator('text/Expected Text').wait();

// ❌ Avoid - Old methods that don't work well with React
const input = await page.$('input');
await input.type('value'); // Often fails with React controlled components
```

## Best Practices for React Apps

### Element Targeting Priority
1. **data-testid attributes** - Most reliable
2. **Semantic selectors** - `button:has-text("Submit")`
3. **CSS selectors** - Last resort

### Filling Forms
```javascript
// Multi-selector fallback approach
const input = page.locator([
  '[data-testid="specific-input"]',
  'input[type="password"]',
  'div:has-text("Password") input'
].join(', '));

await input.fill('value');
```

### Waiting for Dynamic Content
```javascript
// Wait for elements to appear
await page.locator('text/Password Required').wait();

// Wait for navigation
await page.waitForNavigation({ waitUntil: 'networkidle0' });

// Wait for specific state
await page.locator('[data-testid="success-message"]').wait();
```

## Common Automation Workflows

### Complete Setup Flow
```javascript
// 1. Start and navigate
await page.goto('http://localhost:3000');

// 2. Fill API keys (auto-filled from env vars)
await page.locator('[data-testid="save-api-keys-button"]').click();

// 3. Handle password modal
await page.locator('[data-testid="password-input"]').fill('development123');
await page.locator('[data-testid="password-submit-btn"]').click();

// 4. Wait for main interface
await page.locator('text/Type your message').wait();
```

### Interacting with SPACE Terminal
```javascript
// Send a message
await page.locator('[data-testid="terminal-input"]').fill('Hello AI');
await page.keyboard.press('Enter');

// Wait for response
await page.locator('.message.ai').wait();
```

### Settings Menu Automation
```javascript
// Open settings menu via gear icon (bottom-left)
await page.locator('.fixed.bottom-4.left-4 button').click();

// Toggle debug mode
await page.locator('.relative.inline-flex').click(); // Toggle switch

// Update context limit
await page.locator('input[type="number"]').first().fill('200000');

// Update max tokens
await page.locator('input[type="number"]').nth(1).fill('8192');

// Check API key status (adds message to terminal)
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  for (let button of buttons) {
    if (button.textContent.trim() === 'View API Key Status') {
      button.click();
      break;
    }
  }
});

// Close settings menu
await page.locator('button[title="Close Settings"]').click();
```

## Error Handling

### Robust Element Selection
```javascript
try {
  await page.locator('[data-testid="preferred-selector"]').click();
} catch (error) {
  // Fallback to alternative selectors
  await page.locator('button:has-text("Submit")').click();
}
```

### Error Detection
```javascript
// Check for error messages
const errorElement = page.locator('[class*="bg-red-900"], [class*="error"]');
try {
  await errorElement.wait({ timeout: 2000 });
  const errorText = await errorElement.evaluate(el => el.textContent);
  throw new Error(`Application error: ${errorText}`);
} catch (timeoutError) {
  // No error found, continue
}
```

## Scripts Available

### Development Scripts
- `npm run dev` - Start development server
- `npm run dev:setup` - Automated setup with browser
- `npm run build` - Build for production
- `npm run lint` - Run linting

### Automation Scripts
- `scripts/improved-setup.js` - Complete automated setup
- `scripts/setup-dev-keys.js` - Legacy automation (deprecated)
- `scripts/test-puppeteer.js` - Basic Puppeteer test

## Troubleshooting

### Common Issues

**React controlled components not updating:**
- Use `page.locator().fill()` instead of `elementHandle.type()`
- Ensure proper event dispatching with modern methods

**Elements not found:**
- Use multiple selector fallbacks
- Wait for dynamic content with `.wait()`
- Check for element visibility with proper timeouts

**Form submission failures:**
- Use `data-testid` attributes for reliable targeting
- Wait for validation and state changes
- Handle async operations with proper waits

### Debug Mode
```javascript
// Launch with debugging
const browser = await puppeteer.launch({ 
  headless: false, 
  devtools: true,
  slowMo: 100 // Slow down for debugging
});
```

## Advanced Techniques

### Console Logging Integration
SPACE includes comprehensive browser console logging that can be monitored during automation:

```javascript
// Enable console logging in automation scripts
page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`[${timestamp}] [BROWSER:${type.toUpperCase()}] ${text}`);
});
```

### Working with React Controlled Components
When standard selectors fail, use JavaScript evaluation for complex interactions:

```javascript
// For buttons with text content that CSS selectors can't handle
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  for (let button of buttons) {
    if (button.textContent.trim() === 'Submit') {
      button.click();
      break;
    }
  }
});

// For forms that need special handling
await page.evaluate((value) => {
  const input = document.querySelector('input[type="password"]');
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  nativeInputValueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}, 'password123');
```

### Password Modal Persistence
The SPACE password modal can be persistent due to validation requirements:
- Try multiple approaches: `page.locator()`, `page.evaluate()`, direct selectors
- Always verify the modal is dismissed before proceeding
- Use environment variables (`VITE_DEV_PASSWORD`) for consistent testing

### Settings Menu State Management
Settings changes are immediately persisted to localStorage and state:
- No need to wait for save operations
- Changes are reflected instantly in the UI
- Debug mode toggle affects console output immediately
- API key operations add system messages to terminal

## Future Enhancements

### Known Working Selectors
```javascript
// Bottom action buttons
'.fixed.bottom-4.left-4 button'   // Settings gear icon
'.fixed.bottom-4.right-4 a'       // Info button

// Settings menu elements  
'.relative.inline-flex'            // Debug mode toggle switch
'input[type="number"]'             // Numeric inputs (context/tokens)
'button[title="Close Settings"]'   // Close button with title attribute

// Password modal
'input[type="password"]'           // Password input field
'input[placeholder="Enter password"]' // Alternative password selector

// General patterns
'button:nth-of-type(N)'           // When multiple buttons exist
'button:first-of-type'            // First button in container
'button:last-child'               // Last button (often submit)
```

### Planned Improvements
- [ ] Add data-testid to Terminal component interactions
- [ ] Add data-testid to Settings Menu components  
- [ ] Implement keyboard shortcut automation
- [ ] Add export/import automation workflows
- [ ] Create test fixtures for common scenarios

### Contributing
When adding new interactive components:
1. Add `data-testid` attributes to all interactive elements
2. Test with `page.locator().fill()` and `.click()` methods
3. Update this documentation with new patterns
4. Consider environment variable auto-fill for development data
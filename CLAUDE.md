# SPACE Terminal - Claude Development Guidelines

## Project Overview
SPACE is a terminal-style AI conversation interface built with React, featuring advisors, metaphors analysis, questions generation, and comprehensive settings management. The application emphasizes automation-friendly development and testing.

## 🤖 Automation-First Development

### ⚠️ CRITICAL AUTOMATION RULES
1. **Use detached server startup**: `nohup npm run dev > /dev/null 2>&1 & echo "Server started"`
2. **Use modern Puppeteer methods**: `page.locator().fill()` NOT `element.type()`
3. **Use data-testid selectors first**, CSS selectors as fallback
4. **Enable console logging** to monitor application behavior

### Server Management for Automation
```bash
# ❌ WRONG - This hangs automation
npm run dev

# ✅ CORRECT - Start server detached
nohup npm run dev > /dev/null 2>&1 & echo "Server started with PID $!"
sleep 3  # Wait for server to start
# Clean up: kill $(lsof -ti:3000)
```

### Essential Puppeteer Patterns
```javascript
// Setup with console logging (REQUIRED)
page.on('console', (msg) => {
  console.log(`[BROWSER:${msg.type().toUpperCase()}] ${msg.text()}`);
});

// Setup flow with data-testid selectors
await page.locator('[data-testid="save-api-keys-button"]').click();
await page.locator('[data-testid="password-input"]').fill('development123');
await page.locator('[data-testid="password-submit-btn"]').click();

// Settings menu automation
await page.locator('.fixed.bottom-4.left-4 button').click(); // Gear icon
await page.locator('.relative.inline-flex').click(); // Debug toggle

// Text-based button selection for React components
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  for (let button of buttons) {
    if (button.textContent.trim() === 'Submit') {
      button.click();
      break;
    }
  }
});
```

### Complete Setup Workflow (Copy-Paste Ready)
```javascript
// 1. Start detached server first
// nohup npm run dev > /dev/null 2>&1 & echo "Server started with PID $!"
// sleep 3

// 2. Navigate and setup
await page.goto('http://localhost:3000');
await page.locator('[data-testid="save-api-keys-button"]').click();
await page.locator('[data-testid="password-input"]').fill('development123');
await page.locator('[data-testid="password-submit-btn"]').click();
// Main interface should now be loaded
```

### Known Working Selectors
- Settings gear: `.fixed.bottom-4.left-4 button`
- Debug toggle: `.relative.inline-flex` (inside settings menu)
- Theme toggle: `.relative.inline-flex` (second one in settings menu)
- Password input: `input[type="password"]` or `[data-testid="password-input"]`
- Number inputs: `input[type="number"]`
- API key save: `[data-testid="save-api-keys-button"]`
- Password submit: `[data-testid="password-submit-btn"]`

### Automation Principles
1. **Always use `page.locator().fill()`** - NOT `element.type()` (React incompatible)
2. **Multi-selector fallbacks** - Try data-testid, then CSS, then text-based
3. **Wait for dynamic content** - Use `.wait()` for async operations
4. **Add `data-testid` attributes** to new interactive components

## 🏗️ Development Workflow

### Setup Commands
```bash
# Automated development setup (preferred)
npm run dev:setup

# Manual development
npm run dev

# Testing and validation
npm run lint
npm run build
```

### Environment Variables Required
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...  # For auto-fill
VITE_OPENAI_API_KEY=sk-...         # For auto-fill  
VITE_DEV_PASSWORD=development123   # Optional
```

## 🎯 Key Application Components

### Settings Menu (Bottom-Left Gear Icon)
- **Selector**: `.fixed.bottom-4.left-4 button`
- **Features**: Debug mode, theme toggle, context limit, max tokens, API key management
- **State**: Changes persist immediately to localStorage

### Terminal Interface
- **Input area**: Main conversation interface with green border (all themes)
- **Advisors panel**: Left sidebar for AI advisors (bordered modules)
- **Metaphors/Questions**: Right sidebar analysis panels (bordered modules)

### API Key Management
- **Setup flow**: Auto-fills from environment variables
- **Password modal**: Can be persistent, use multiple selector approaches
- **Status checking**: Adds system messages to terminal

## 🔧 Browser Testing Guidelines

### Required Setup for Puppeteer
```javascript
// ALWAYS include console logging
page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`[${timestamp}] [BROWSER:${type.toUpperCase()}] ${text}`);
});
```

### Known Working Selectors
Use these tested selectors from `/docs/AUTOMATION.md`:
- Settings: `.fixed.bottom-4.left-4 button`
- Debug toggle: `.relative.inline-flex`
- Password input: `input[type="password"]`
- Submit buttons: `button:last-child` or text-based evaluation

### React Component Interaction
```javascript
// For text-based button selection
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button');
  for (let button of buttons) {
    if (button.textContent.trim() === 'Submit') {
      button.click();
      break;
    }
  }
});
```

## 📁 Project Structure

### Key Files
- `src/components/Terminal.jsx` - Main terminal interface (central hub)
- `src/components/SettingsMenu.jsx` - Settings panel
- `src/components/ApiKeySetup.jsx` - Initial setup flow
- `src/hooks/useClaude.js` - Claude API integration hook
- `scripts/improved-setup.js` - Automated development setup
- `docs/ARCHITECTURE.md` - Comprehensive technical architecture reference

### Testing Scripts
- `scripts/improved-setup.js` - Complete automated setup
- `scripts/test-puppeteer.js` - Basic browser testing
- `scripts/setup-dev-keys.js` - Legacy automation (deprecated)

## 🚨 Important Reminders

### Before Any Browser Work
1. **Use detached server startup** - See automation section above
2. **Enable console logging** - Monitor application behavior
3. **Use documented selectors** - From Known Working Selectors section
4. **Test with environment variables** - Use auto-fill for efficiency

### When Adding New Components
1. **Add `data-testid` attributes** to interactive elements
2. **Test with Puppeteer** using modern `.locator()` methods
3. **Update CLAUDE.md** with new patterns in Known Working Selectors
4. **Consider automation during design** - not as an afterthought

### Error Handling
- **Password modal persistence**: Try multiple selector approaches
- **React controlled components**: Use `page.evaluate()` when needed
- **Form submission**: Always wait for state changes and validation

## 🎛️ Settings Menu Integration

The settings menu was designed to replace terminal commands with GUI controls:
- `/debug` → Debug mode toggle
- `/context limit N` → Context limit input field  
- `/tokens N` → Max tokens input field
- `/keys status` → "View API Key Status" button
- `/keys clear` → "Clear API Keys" button

**State Management**: All settings changes are immediately persisted to localStorage and application state. No manual save operations required.

## 🔄 Git Workflow

### Branch Strategy
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Always create PRs for review before merging

### Commit Guidelines
- Use conventional commit format
- Include automation testing when adding UI components
- Update documentation for new interactive elements

## 📚 Additional Resources

- **Technical Architecture**: `/docs/ARCHITECTURE.md` - Comprehensive system overview
- **API Documentation**: Check component files for props and usage
- **Environment Setup**: Use `npm run dev:setup` for quick start

---

**Remember**: SPACE is built for automation. Always consider the automation impact of any changes and use the automation patterns documented above.
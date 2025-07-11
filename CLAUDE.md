# SPACE Terminal - Claude Development Guidelines

## Project Overview
SPACE is a terminal-style AI conversation interface built with React, featuring advisors, metaphors analysis, questions generation, and comprehensive settings management. The application emphasizes automation-friendly development and testing.

## 🤖 Automation-First Development

### ⚠️ CRITICAL SAFETY RULES
1. **NEVER deploy to main branch** without explicit user permission
2. **NEVER merge to main** or suggest merging without user approval
3. **NEVER push directly to main** - always use feature branches
4. **Use detached server startup**: `nohup npm run dev > /dev/null 2>&1 & echo "Server started"`
5. **Use modern Puppeteer methods**: `page.locator().fill()` NOT `element.type()`
6. **Use data-testid selectors first**, CSS selectors as fallback
7. **Enable console logging** to monitor application behavior

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
# RECOMMENDED: Full development with backend functions
npm run dev:functions

# Legacy: Frontend only (will cause 404s in auth mode)
npm run dev

# Automated development setup (Google OAuth, rate limiting)
npm run dev:setup

# Testing and validation
npm run lint
npm run build
npm run preview  # Preview production build
```

### ⚠️ **Important: Use npm run dev:functions for Auth Mode**

**SPACE Terminal now uses authentication by default (`VITE_USE_AUTH=true`)**

- **✅ CORRECT**: `npm run dev:functions` - Runs both frontend AND backend functions
- **❌ WRONG**: `npm run dev` - Only frontend, backend functions return 404

**Backend functions are required for:**
- Google OAuth authentication
- Claude API calls (server-side)
- Rate limiting and usage tracking
- User account management

### Build Verification Best Practices
- **Always run `npm run build`** after refactoring or major changes
- **Catch syntax errors** before committing (especially after prop changes)
- **Test builds** after component updates or interface modifications
- **Verify production** builds work with `npm run preview`

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

## 💬 Message Sending Patterns

### How Messages Are Sent in SPACE
- **Correct**: Use existing form submission mechanism via `handleSubmit`
- **Incorrect**: Don't call non-existent `handleSendMessage()` or create custom sending functions
- **Pattern**: Set input with `setInput(message)` then trigger form submission programmatically

```javascript
// ✅ Correct pattern for programmatic message sending
const sendMessage = (messageText) => {
  setInput(messageText);
  setTimeout(() => {
    const form = document.querySelector('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
  }, 100);
};
```

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

SPACE is a React-based terminal interface with dual-AI integration: Claude Sonnet 4 for main conversations and GPT-4o-mini for background analysis (metaphors, questions, suggestions).

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

## 🎯 UI Component Organization

### Where Functionality Belongs
- **Settings Menu** (`SettingsMenu.jsx`): User preferences, configuration options, toggles
- **Accordion Menu** (`AccordionMenu.jsx`): Action buttons, operations, modal triggers
- **Terminal Interface**: Core conversation and advisor management

### Component Purpose Guidelines
- **Settings** = Configuration (debug mode, tokens, themes)
- **Accordion** = Actions (vote, debate, export, new session)
- **Don't mix** actions with settings

### Console Logging Strategy
- **Essential Logging**: System prompts being sent to AI, critical state changes
- **Remove Noise**: Intermediate processing steps, streaming updates, debug traces
- **Pattern**: Use meaningful prefixes like `🏛️` for specific features
- **Focus**: Log what developers need to understand behavior, not every step

```javascript
// ✅ Essential for debugging
if (councilMode) {
  console.log('🏛️ High Council System Prompt:', systemPrompt);
}

// ❌ Too noisy - remove these
console.log('DEBUG: Processing input step 1...');
console.log('DEBUG: Checking condition X...');
```

## 📝 Documentation Writing Standards

### Strunk and White Principles for SPACE Documentation

**ALWAYS follow these rules when writing documentation for this project:**

#### Rule 1: Omit Needless Words
- ❌ "Comprehensive 23-color palette organized following ROYGBIV spectrum"
- ✅ "23-color palette organized following ROYGBIV spectrum"

#### Rule 2: Avoid Marketing Language
- ❌ "Enhanced," "Improved," "Better," "Smart," "Powerful," "Comprehensive"
- ✅ Direct descriptions of what the feature does

#### Rule 3: Remove Bold Emphasis from Everything
- ❌ "**Real-time API cost tracking** with current 2025 pricing"
- ✅ "Real-time API cost tracking with 2025 pricing"

#### Rule 4: Use Active Voice
- ❌ "The interface has been streamlined"
- ✅ "Interface streamlined" or "Streamlined interface"

#### Rule 5: Cut Redundant Adjectives
- ❌ "Smart autocomplete dropdown," "Automatic migration," "Seamless integration"
- ✅ "Autocomplete dropdown," "Migration," "Integration"

#### Rule 6: Make Every Word Count
- ❌ "This represents a substantial evolution"
- ✅ "This evolves"

#### Quick Test
If you can remove a word without changing the meaning, remove it. If you can simplify a phrase without losing information, simplify it.

**Examples from CHANGELOG-v0.2.2.md revision:**
- "Enhanced Tagging System with Knowledge Dossier" → "Tagging System with Knowledge Dossier"
- "Comprehensive API Testing Framework" → "API Testing Framework"
- "Progressive Summary Caching System" → "Summary Caching System"
- "Better Information Architecture" → "Information Architecture"

**Apply this to ALL documentation:** changelogs, READMEs, code comments, commit messages, and feature descriptions.

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
- **Advisor System**: `/docs/ADVISOR-SYSTEM.md` - Implementation details for advisor features
- **API Documentation**: Check component files for props and usage
- **Environment Setup**: Use `npm run dev:setup` for quick start

---

**Remember**: SPACE is built for automation. Always consider the automation impact of any changes and use the automation patterns documented above.
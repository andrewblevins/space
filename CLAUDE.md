# SPACE Terminal - Claude Development Guidelines

## Project Overview
SPACE is a terminal-style AI conversation interface built with React, featuring advisors, metaphors analysis, questions generation, and comprehensive settings management. The application emphasizes automation-friendly development and testing.

## 🤖 Automation-First Development

**CRITICAL**: Always consult `/docs/AUTOMATION.md` before performing any browser testing or interaction with the application. This file contains battle-tested techniques and known working selectors.

### Required Reading
- **Before browser automation**: Read `/docs/AUTOMATION.md` completely
- **Before adding UI components**: Review automation patterns in the docs
- **Before testing**: Use documented selectors and techniques

### Automation Principles
1. **Always prefer existing documented selectors** from `/docs/AUTOMATION.md`
2. **Use `page.evaluate()` for React components** when CSS selectors fail
3. **Enable console logging** to monitor application behavior
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
npm run preview  # Preview production build
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
- **Features**: Debug mode, context limit, max tokens, API key management
- **State**: Changes persist immediately to localStorage

### Terminal Interface
- **Input area**: Main conversation interface
- **Advisors panel**: Left sidebar for AI advisors
- **Metaphors/Questions**: Right sidebar analysis panels

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

SPACE is a React-based terminal interface with dual-AI integration: Claude Sonnet 4 for main conversations and GPT-4o-mini for background analysis (metaphors, questions, suggestions).

### Key Files
- `src/components/Terminal.jsx` - Main terminal interface (central hub)
- `src/components/SettingsMenu.jsx` - Settings panel
- `src/components/ApiKeySetup.jsx` - Initial setup flow
- `src/hooks/useClaude.js` - Claude API integration hook
- `scripts/improved-setup.js` - Automated development setup
- `docs/AUTOMATION.md` - **REQUIRED READING** for automation
- `docs/ARCHITECTURE.md` - Comprehensive technical architecture reference

### Testing Scripts
- `scripts/improved-setup.js` - Complete automated setup
- `scripts/test-puppeteer.js` - Basic browser testing
- `scripts/setup-dev-keys.js` - Legacy automation (deprecated)

## 🚨 Important Reminders

### Before Any Browser Work
1. **Read `/docs/AUTOMATION.md` first** - Contains proven techniques
2. **Use documented selectors** - Don't reinvent working patterns
3. **Enable console logging** - Monitor application behavior
4. **Test with environment variables** - Use auto-fill for efficiency

### When Adding New Components
1. **Add `data-testid` attributes** to interactive elements
2. **Test with Puppeteer** using modern `.locator()` methods
3. **Update `/docs/AUTOMATION.md`** with new patterns
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

- **Automation Guide**: `/docs/AUTOMATION.md` ⚠️ **CRITICAL REFERENCE**
- **Technical Architecture**: `/docs/ARCHITECTURE.md` - Comprehensive system overview
- **API Documentation**: Check component files for props and usage
- **Environment Setup**: Use `npm run dev:setup` for quick start

---

**Remember**: SPACE is built for automation. Always consider the automation impact of any changes and consult the automation documentation before browser testing.
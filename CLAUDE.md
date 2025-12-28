# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SPACE Terminal is an open-source React-based interface for AI conversations featuring multi-perspective advisors, conversation analysis, and user-defined evaluation systems. Built with React 18, Vite, TailwindCSS, and Cloudflare Pages Functions.

## Development Commands

### Core Development
```bash
# Full development with backend functions (RECOMMENDED)
npm run dev:functions

# Build and watch mode (for production-like testing)
npm run dev:watch

# Frontend only (legacy, will cause 404s in auth mode)
npm run dev

# Automated development setup with browser automation
npm run dev:setup
```

### Testing
```bash
# Run all tests
npm test
npm run test:watch

# API testing suites
npm run test:api              # All API tests
npm run test:real-api         # Real API integration tests
npm run test:tag-analyzer     # Tag analysis tests
npm run test:memory           # Memory system tests
npm run test:integration      # Integration tests
npm run test:performance      # Performance benchmarks
```

### Build & Validation
```bash
npm run build                 # Production build
npm run preview               # Preview production build
npm run lint                  # ESLint validation
```

## Architecture Overview

### Core Components Structure
```
src/components/Terminal.jsx          # Central hub (~800 lines, main application state)
├── terminal/                        # Terminal-specific UI modules
│   ├── Module.jsx                   # Basic display module
│   ├── CollapsibleModule.jsx        # Expandable panels
│   ├── GroupableModule.jsx          # Advisor grouping system
│   └── ExpandingInput.jsx           # Resizable text input
├── [Modal Components]               # AdvisorForm, SettingsMenu, etc.
└── mobile/                          # Mobile-responsive components
```

### Key Integration Points
- **API Integration**: `src/hooks/useClaude.js` - Primary AI API hook with streaming
- **Memory System**: `src/lib/memory.ts` - Conversation context management
- **Analysis Pipeline**: `src/utils/terminalHelpers.js` - Metaphors/questions analysis
- **Storage**: `src/utils/secureStorage.js` - Encrypted API key storage

### Data Flow
```
User Input → Terminal.jsx → useClaude Hook → Claude API
                ↓
Message Processing ← Streaming Response ← API Response
        ↓
State Update → UI Refresh → Analysis Triggers (OpenAI GPT-4o-mini)
```

## Environment Configuration

### Required Environment Variables
```bash
# Frontend (.env)
VITE_USE_AUTH=false                   # Authentication disabled (localStorage mode)

# Backend (wrangler.toml)
ANTHROPIC_API_KEY=                    # Claude API (primary)
OPENAI_API_KEY=                       # GPT-4o-mini (analysis)
GEMINI_API_KEY=                       # Gemini (evaluation system)
OPENROUTER_API_KEY=                   # OpenRouter (additional models)
```

### Development Mode
- **Local Storage**: All conversation data is stored in browser localStorage
- No database or cloud storage is used for conversations

## Key Architectural Patterns

### State Management
Terminal.jsx manages 20+ useState hooks organizing:
- **Core State**: messages[], advisors[], input, isLoading
- **UI State**: Modal visibility, panel expansion states
- **Settings State**: maxTokens, contextLimit, debugMode
- **Analysis State**: metaphors[], questions[], advisorSuggestions[]

### API Integration Strategy
- **Primary AI**: Claude Sonnet 4 via useClaude hook
- **Analysis**: OpenAI GPT-4o-mini for metaphors/questions/suggestions
- **Evaluation**: Gemini Pro for advisor improvement system
- **Streaming**: Real-time response rendering with token estimation

### Module System
Terminal uses modular UI components:
- `CollapsibleModule`: Basic expandable panels
- `GroupableModule`: Advisor organization with color coding
- `CollapsibleSuggestionsModule`: Interactive suggestion panels
- All modules support consistent theming and responsive design

## Testing & Development Guidelines

### Browser Automation
When working with Puppeteer/automation:
- Use `data-testid` attributes for reliable selectors
- Prefer `page.locator().fill()` over deprecated `element.type()`
- Always include console logging: `page.on('console', (msg) => console.log(...))`
- Use detached server startup: `nohup npm run dev:functions > /dev/null 2>&1 &`

### Component Development
- Follow React 18 patterns with hooks
- Use TailwindCSS for styling (green terminal aesthetic)
- Implement responsive design for mobile compatibility
- Add TypeScript types in `src/types/` for complex data structures

### API Error Handling
- Use `src/utils/apiErrorHandler.js` for consistent error management
- Implement graceful degradation for API failures
- Provide user feedback through terminal system messages

## Performance Considerations

### Context Management
- Token limit: 150,000 characters before context pruning
- Memory system intelligently retains relevant messages
- Streaming responses for real-time user feedback

### React Optimizations
- Memoized components for expensive renders (`MemoizedMarkdownMessage`)
- `useCallback` hooks for function reference stability
- State batching to reduce re-renders

## Security Implementation

### API Key Management
- AES-256 encryption for browser-stored keys
- Password-protected secure storage system
- Automatic cleanup on logout/session end
- Backend proxy for authenticated API calls

### Authentication Flow
- Google OAuth via Supabase Auth
- Session-based authentication for API access
- Rate limiting and usage tracking

## Extension Points

The modular architecture supports:
- New terminal modules for custom panel types
- Additional AI service integrations
- Custom advisor personalities and evaluation criteria
- Export formats and automation tools

## Common Development Tasks

### Adding New Advisors
1. Use AdvisorForm component for creation UI
2. Store in localStorage (local mode) or Supabase (auth mode)
3. Color assignment via `src/lib/advisorColors.js`
4. System prompt generation in Terminal.jsx

### Implementing New Analysis Features
1. Add analysis function to `src/utils/terminalHelpers.js`
2. Integrate with OpenAI API call pattern
3. Create corresponding UI module in `src/components/terminal/`
4. Wire into Terminal.jsx state and useEffect hooks

### Testing New Features
- Use `npm run test:api` for backend integration testing
- Implement Jest tests for utility functions
- Use automated setup script: `npm run dev:setup`
- Test responsive design across viewport sizes
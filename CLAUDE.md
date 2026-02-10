# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Documentation Maintenance

When you make changes that affect the architecture — new files, renamed/deleted files, new hooks, new components, changed data flow, new environment variables — update this file and any relevant docs/ files to reflect the change. Do this as part of the same piece of work. Don't wait to be asked.

## Project Overview

SPACE Terminal is an open-source React-based interface for exploring complex questions through multi-perspective AI conversations. Users converse with multiple distinct AI perspectives simultaneously, with tools for generating, modifying, and swapping perspectives on the fly. Built with React 18, Vite, TailwindCSS, and Cloudflare Pages Functions.

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
src/components/
├── Terminal.jsx                     # Central hub (~3900 lines, main application state)
├── JournalOnboarding.jsx            # Onboarding context-gathering flow
├── PerspectiveGenerator.jsx         # Perspective suggestion UI
├── AdvisorSuggestionsModal.jsx      # Perspective suggestions modal
├── AdvisorForm.jsx                  # Create new advisor
├── EditAdvisorForm.jsx              # Edit existing advisor
├── ApiKeySetup.jsx                  # API key entry UI
├── SettingsMenu.jsx                 # Settings panel
├── SessionPanel.jsx                 # Chat session sidebar
├── AccordionMenu.jsx                # Collapsible menu
├── ExportMenu.jsx                   # Export options
├── ImportExportModal.jsx            # Import/export conversations
├── HelpModal.jsx                    # Help overlay
├── InfoModal.jsx                    # Info overlay
├── WelcomeScreen.jsx                # First-visit welcome
├── ThinkingBlock.jsx                # AI thinking indicator
├── AssertionsModal.jsx              # Assertion/evaluation creation
├── EvaluationsModal.jsx             # Evaluation results
├── UsageDisplay.jsx                 # Usage stats
├── UsageIndicator.jsx               # Inline usage indicator
├── PrivacyPolicy.jsx                # Privacy policy page
│
├── terminal/                        # Terminal-specific UI modules
│   ├── Module.jsx                   # Basic display module
│   ├── CollapsibleModule.jsx        # Expandable panels
│   ├── CollapsibleClickableModule.jsx
│   ├── CollapsibleSection.jsx       # Collapsible content sections
│   ├── CollapsibleSuggestionsModule.jsx  # Interactive suggestion panels
│   ├── GroupableModule.jsx          # Advisor grouping with color coding
│   ├── ExpandingInput.jsx           # Resizable text input
│   ├── AdvisorResponseCard.jsx      # Individual perspective response card
│   ├── AdvisorResponseMessage.jsx   # Legacy advisor response format
│   ├── ParallelAdvisorGrid.jsx      # Grid layout for parallel responses
│   ├── MessageRenderer.jsx          # Renders different message types
│   ├── MemoizedMarkdownMessage.jsx  # Memoized markdown rendering
│   ├── RecentChats.jsx              # Chat history list
│   ├── SessionAutocomplete.jsx      # @-mention session autocomplete
│   ├── SidebarFooterMenu.jsx        # Sidebar bottom menu
│   └── FullScreenPerspectiveModal.jsx  # Expanded perspective view
│
├── mobile/                          # Mobile-responsive components
│   ├── MobileLayout.jsx             # Mobile container layout
│   ├── MobileHeader.jsx             # Mobile top bar
│   ├── MobileTabBar.jsx             # Mobile bottom navigation
│   └── TouchInput.jsx               # Touch-optimized input
│
└── responsive/
    └── ResponsiveContainer.jsx      # Desktop/mobile breakpoint switching
```

### Hooks
```
src/hooks/
├── useParallelAdvisors.js     # Core hook: calls multiple advisors in parallel via OpenRouter
├── useClaude.js               # Single-advisor Claude calls (legacy, still used for some flows)
├── useOpenRouter.js            # OpenRouter API integration
├── useGemini.js               # Gemini API integration
├── useOpenAI.js               # OpenAI direct calls
├── useConversationStorage.js   # Conversation save/load (localStorage or Supabase)
├── useUsageTracking.js         # Token/cost tracking
└── useOpenRouterCredits.js     # OpenRouter credit balance
```

### Utilities
```
src/utils/
├── perspectiveGeneration.js    # Prompt building + API calls for perspective generation
├── advisorSuggestions.js       # Wrapper around perspectiveGeneration for advisor suggestions
├── contextQuestions.js         # Journal onboarding question generation (gpt-4o-mini)
├── terminalHelpers.js          # buildConversationContext, summarizeSession
├── apiConfig.js                # API endpoint routing (auth mode vs legacy)
├── apiErrorHandler.js          # Consistent API error handling
├── secureStorage.js            # Plain localStorage wrapper for API keys (no encryption)
├── usageTracking.js            # Usage tracking utilities
├── evaluationHelpers.js        # Evaluation/assertion system
├── worksheetTemplates.js       # Worksheet question templates
├── analytics.js                # Analytics tracking
├── migrationHelper.js          # Data migration utilities
├── fileLogger.js               # File-based logging
└── automationHelpers.js        # Puppeteer automation helpers
```

### Libraries
```
src/lib/
├── memory.ts          # MemorySystem: cross-session context via tag-based retrieval
├── tagAnalyzer.ts     # Tag analysis via gpt-4o-mini
├── advisorColors.js   # Color assignment for advisors
├── defaultPrompts.js  # Default system prompts
└── supabase.js        # Supabase client initialization
```

### Backend (Cloudflare Pages Functions)
```
functions/
├── api/
│   ├── chat/
│   │   ├── openrouter.js      # OpenRouter proxy (primary)
│   │   ├── claude.js           # Direct Anthropic proxy
│   │   ├── openai.js           # OpenAI proxy
│   │   └── gemini.js           # Gemini proxy
│   ├── conversations/
│   │   ├── index.js            # List/create conversations
│   │   └── [id].js             # Get/update/delete conversation
│   ├── subscriptions/
│   │   ├── status.js           # Subscription status
│   │   ├── create-checkout.js  # Stripe checkout
│   │   ├── billing-portal.js   # Stripe billing portal
│   │   └── webhook.js          # Stripe webhooks
│   ├── usage.js                # Usage tracking endpoint
│   └── health.js               # Health check
└── middleware/                  # Auth middleware, rate limiting
```

### Data Flow

**Chat message flow:**
```
User Input → Terminal.jsx handleSendMessage()
  → useParallelAdvisors.callParallelAdvisors()
    → For each active advisor in parallel:
      → Build per-advisor system prompt + context window
      → POST to /api/chat/openrouter (or direct OpenRouter in legacy mode)
      → Stream response tokens back
    → Update messages[] state with parallel_advisor_response
  → Render via ParallelAdvisorGrid → AdvisorResponseCard
```

**Journal onboarding flow:**
```
User enters journal text → JournalOnboarding
  → contextQuestions.generateContextQuestion() (gpt-4o-mini via OpenRouter)
  → 3 follow-up questions gathered
  → perspectiveGeneration.generatePerspectivesStream() (gpt-4o-mini via OpenRouter)
  → 8 perspective suggestions displayed
  → User selects/modifies → advisors[] state in Terminal.jsx
```

## Environment Configuration

### Frontend Environment Variables (.env)
```bash
VITE_USE_AUTH=false                   # 'true' enables Supabase auth; 'false' for BYOK localStorage mode
VITE_SUPABASE_URL=                    # Supabase project URL (only needed if VITE_USE_AUTH=true)
VITE_SUPABASE_ANON_KEY=               # Supabase anon key (only needed if VITE_USE_AUTH=true)
VITE_AUTH_REDIRECT_URL=               # OAuth redirect URL (defaults to window.location.origin)
VITE_OPENROUTER_API_KEY=              # Optional: auto-fill API key in development
VITE_DEV_PASSWORD=                    # Optional: dev password for automation (default: development123)
```

### Backend Environment Variables (wrangler.toml)
```bash
ANTHROPIC_API_KEY=                    # For /api/chat/claude proxy
OPENAI_API_KEY=                       # For /api/chat/openai proxy
OPENROUTER_API_KEY=                   # For /api/chat/openrouter proxy
```

### Two Operating Modes
- **BYOK mode** (`VITE_USE_AUTH=false`): User provides their own OpenRouter API key, stored in browser localStorage. No backend auth needed. This is the default.
- **Auth mode** (`VITE_USE_AUTH=true`): Google OAuth via Supabase. API calls proxied through backend functions. Subscription/usage tracking enabled.

## Key Architectural Patterns

### State Management
Terminal.jsx manages ~68 useState hooks organized as:
- **Core State**: messages[], advisors[], input, isLoading
- **UI State**: Modal visibility, panel expansion, sidebar state
- **Settings State**: maxTokens, contextLimit, debugMode, reasoningMode, openrouterModel
- **Onboarding State**: showJournalOnboarding, journalSuggestions, contextFlow
- **Analysis State**: advisorSuggestions[], customPerspectives[]
- **Session State**: sessions, currentConversationId, conversationTitle

### API Integration
- **Primary chat**: OpenRouter API (`anthropic/claude-sonnet-4.5` default model) via `useParallelAdvisors`
- **Analysis/generation**: `openai/gpt-4o-mini` via OpenRouter for context questions, perspective generation, session summaries, and tag analysis
- **Streaming**: All chat responses stream via SSE-like chunked responses

### Context Windowing (useParallelAdvisors)
Each advisor gets an independent context window:
1. System prompt with advisor identity
2. Filtered conversation history (only this advisor's past responses + user messages)
3. Last-turn reference block (summary of what other advisors said)
4. Current user message

When total tokens exceed `contextLimit` (default 150,000 chars), oldest turn pairs are dropped first. If still over budget, the cross-advisor reference block is dropped.

### API Key Storage
`secureStorage.js` stores API keys in plain text in localStorage. Despite the legacy function names (`setEncrypted`, `getDecrypted`), there is no encryption. The file explicitly states this.

## Testing & Development Guidelines

### Browser Automation
When working with Puppeteer/automation:
- Use `data-testid` attributes for reliable selectors
- Prefer `page.locator().fill()` over deprecated `element.type()`
- Always include console logging: `page.on('console', (msg) => console.log(...))`
- Use detached server startup: `nohup npm run dev:functions > /dev/null 2>&1 &`

### Component Development
- Follow React 18 patterns with hooks
- Use TailwindCSS for styling (sage/copper color scheme)
- Implement responsive design for mobile compatibility
- Add TypeScript types in `src/types/` for complex data structures

### API Error Handling
- Use `src/utils/apiErrorHandler.js` for consistent error management
- Implement graceful degradation for API failures
- Provide user feedback through terminal system messages

## Performance Considerations

### Context Management
- Token limit: 150,000 characters before context pruning (configurable via settings)
- Per-advisor context windowing drops oldest turns first
- Streaming responses for real-time user feedback

### React Optimizations
- Memoized components for expensive renders (`MemoizedMarkdownMessage`)
- `useCallback` hooks for function reference stability
- State batching to reduce re-renders

## Documentation

Technical docs are in `docs/`. Key references:
- `MESSAGE_AND_PROMPT_FLOW.md` — detailed message and prompt flow documentation
- `ADVISOR-SYSTEM.md` — advisor implementation details
- `CONTEXT-MANAGEMENT.md` — context windowing and memory system
- `ARCHITECTURE.md` — full architecture overview
- `DESIGN_PRINCIPLES.md` — UI/UX design principles
- `PRODUCT-PHILOSOPHY.md` — product vision and design rationale

Business/strategy docs are in `docs/business/`. Archived plans and old changelogs are in `docs/archived/`.

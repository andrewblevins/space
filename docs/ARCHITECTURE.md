# SPACE Terminal - Comprehensive Architecture Map

## Overview
SPACE Terminal is a React-based web application for deep conversations with AI advisors, featuring modular architecture, session management, and advanced conversation analysis capabilities.

**Version:** 0.2.3  
**Tech Stack:** React 18, Vite, TailwindCSS, TypeScript/JavaScript, Supabase, Cloudflare Pages Functions
**Primary APIs:** Anthropic Claude, OpenAI GPT-4  
**Authentication:** Supabase Auth (Google OAuth + email/password)  
**Backend:** Cloudflare Pages Functions with rate limiting

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                 SPACE Terminal                  │
├─────────────────────────────────────────────────┤
│  Frontend (React SPA)                          │
│  ├── Authentication (Supabase Auth)           │
│  ├── Terminal UI (Main Interface)             │
│  ├── Modal Components (Forms, Menus)           │
│  └── Terminal Modules (Collapsible Panels)     │
├─────────────────────────────────────────────────┤
│  Backend (Cloudflare Pages Functions)          │
│  ├── /api/chat/claude (AI Proxy)              │
│  ├── /api/usage (Rate Limiting)               │
│  ├── Authentication Middleware                 │
│  └── CORS & Security Headers                  │
├─────────────────────────────────────────────────┤
│  Data Layer                                    │
│  ├── Supabase Database (Users, Usage)         │
│  ├── Local Storage (Sessions, Settings)       │
│  ├── Memory System (Conversation Context)     │
│  └── Secure Storage (Legacy API Keys)         │
├─────────────────────────────────────────────────┤
│  External Services                             │
│  ├── Anthropic Claude API (Primary AI)        │
│  ├── OpenAI API (Analysis & Suggestions)      │
│  └── Google OAuth (Authentication)            │
└─────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure

```
src/
├── components/                    # React Components
│   ├── terminal/                 # Terminal-specific UI modules
│   ├── Terminal.jsx              # Main application component
│   └── [Form/Menu Components]    # Modals and overlays
├── hooks/                        # Custom React hooks
├── utils/                        # Business logic utilities
├── contexts/                     # React contexts
├── lib/                          # Core libraries
├── types/                        # TypeScript definitions
├── assets/                       # Static assets
└── [App files]                   # Entry point files
```

---

## 🎯 Core Components Hierarchy

### 1. **Application Entry Point**
```
main.jsx
└── App.jsx
    └── ModalProvider (contexts/ModalContext.jsx)
        └── Terminal.jsx (Main Component)
```

### 2. **Terminal.jsx** (Central Hub)
```
Terminal.jsx (~800 lines, refactored from ~3900)
├── State Management (20+ useState hooks)
├── API Integration (useClaude hook)
├── Event Handlers (40+ functions)
├── UI Layout (3-column design)
├── Modal Management (6 modal components)
└── Analysis Integration (metaphors, questions, suggestions)
```

### 3. **Terminal UI Modules** (`src/components/terminal/`)
```
terminal/
├── Module.jsx                          # Basic display module
├── CollapsibleModule.jsx               # Expandable panels
├── CollapsibleClickableModule.jsx      # Interactive panels
├── CollapsibleSuggestionsModule.jsx    # Suggestion panels with actions
├── GroupableModule.jsx                 # Advisor grouping (206 lines)
├── ExpandingInput.jsx                  # Resizable text input
└── MemoizedMarkdownMessage.jsx         # Optimized message rendering
```

### 4. **Modal Components**
```
components/
├── AdvisorForm.jsx              # Add new advisor
├── EditAdvisorForm.jsx          # Edit existing advisor
├── PromptLibrary.jsx            # Manage saved prompts
├── AddPromptForm.jsx            # Add new prompt
├── EditPromptForm.jsx           # Edit existing prompt
├── SessionPanel.jsx             # Session management
├── SettingsMenu.jsx             # Application settings
├── ExportMenu.jsx               # Export options
├── ApiKeySetup.jsx              # Initial API key configuration
├── AccordionMenu.jsx            # Bottom-left navigation
└── PasswordModal.jsx            # Secure storage authentication
```

---

## 🔧 Business Logic Layer

### 1. **Custom Hooks** (`src/hooks/`)
```
useClaude.js (126 lines)
├── API Communication (Claude Sonnet 4)
├── Streaming Response Handling
├── Context Management (token limits)
├── Error Handling
├── Debug Mode Support
└── Message State Integration
```

### 2. **Utility Functions** (`src/utils/`)
```
utils/
├── terminalHelpers.js           # Analysis functions (metaphors, questions)
├── worksheetTemplates.js        # Advisor generation templates
├── secureStorage.js            # Encrypted storage utilities
├── apiErrorHandler.js          # API error management
├── apiConfig.js               # API endpoint configuration
└── automationHelpers.js       # Automation utilities
```

### 3. **Core Libraries** (`src/lib/`)
```
lib/
├── memory.ts                   # Conversation context management
├── tagAnalyzer.ts             # Message tagging system
└── defaultPrompts.js          # Built-in prompt library
```

### 4. **Context Providers** (`src/contexts/`)
```
ModalContext.jsx               # Global modal state management
```

---

## 🎮 Key Features & Workflows

### 1. **Conversation Management**
```
User Input → Terminal.jsx → useClaude Hook → Claude API
                                        ↓
Message Processing ← Response Streaming ← API Response
        ↓
State Update → UI Refresh → Analysis Triggers
```

### 2. **Advisor System**
```
Advisor Creation → AdvisorForm → Terminal State
                                      ↓
Active Advisors → System Prompt → Claude API
                                      ↓
JSON Response → Response Parsing → Styled Display
```

### 3. **Session Management**
```
Local Storage ← Session Data ← Terminal State
                    ↓
Session Panel → Load/Delete/Export → File System
```

### 4. **Analysis Pipeline**
```
Message Update → useEffect Trigger
                      ↓
├── analyzeMetaphors (OpenAI GPT-4o-mini)
├── analyzeForQuestions (OpenAI GPT-4o-mini)
└── analyzeAdvisorSuggestions (OpenAI GPT-4o-mini)
                      ↓
Panel Updates → UI Refresh
```

---

## 🗄️ Data Management

### 1. **State Architecture**
```
Terminal.jsx State (20+ useState hooks)
├── Core State
│   ├── messages []              # Conversation history
│   ├── advisors []             # Advisor configurations
│   ├── input ""                # Current user input
│   └── isLoading false         # API call status
├── UI State
│   ├── showAdvisorForm         # Modal visibility flags
│   ├── metaphorsExpanded       # Panel expansion states
│   └── editingAdvisor          # Edit mode states
├── Settings State
│   ├── maxTokens              # Response length limit
│   ├── contextLimit           # Context management threshold
│   └── debugMode              # Development mode
└── Analysis State
    ├── metaphors []           # Extracted metaphors
    ├── questions []           # Suggested questions
    └── advisorSuggestions []  # AI-suggested advisors
```

### 2. **Persistence Layer**
```
localStorage
├── space_session_{id}          # Conversation sessions
├── space_advisors             # Advisor configurations
├── space_advisor_groups       # Advisor groupings
├── space_prompts              # Saved prompts
├── space_max_tokens           # User settings
└── space_worksheet_{id}       # Completed worksheets

Secure Storage (Encrypted)
├── space_anthropic_key        # Claude API key
└── space_openai_key          # OpenAI API key
```

### 3. **Memory System** (`src/lib/memory.ts`)
```
MemorySystem Class
├── Session Storage            # Temporary conversation storage
├── Context Retrieval         # Relevant message extraction
├── Token Estimation          # Content size calculation
└── Relevance Scoring         # Message importance ranking
```

---

## 🔌 External Integrations

### 1. **Anthropic Claude API**
```
Model: claude-sonnet-4-20250514
Features:
├── Streaming Responses        # Real-time message display
├── System Prompts            # Advisor personality injection
├── Context Management        # Conversation history handling
└── JSON Mode                 # Structured advisor responses
```

### 2. **OpenAI API**
```
Model: gpt-4o-mini
Use Cases:
├── Metaphor Analysis         # Conceptual pattern extraction
├── Question Generation       # Follow-up suggestions
├── Advisor Suggestions       # AI-recommended advisors
└── Session Titles            # Automatic naming
```

---

## 🎨 UI/UX Architecture

### 1. **Layout System**
```
Terminal Interface (3-Column Layout)
├── Left Panel (25%)           # Metaphors + Advisors
│   ├── CollapsibleModule     # Metaphors display
│   └── GroupableModule       # Advisor management
├── Center Panel (50%)         # Main conversation
│   ├── Message Container     # Scrollable chat history
│   └── ExpandingInput        # User input area
└── Right Panel (25%)          # Questions + Suggestions
    ├── CollapsibleModule     # Question suggestions
    └── CollapsibleSuggestionsModule # Advisor suggestions
```

### 2. **Styling System**
```
TailwindCSS Classes
├── Color Scheme              # Green terminal aesthetic
├── Typography               # Vollkorn serif font
├── Responsive Design        # Mobile-friendly layout
└── Dark Theme               # Black/gray/green palette
```

### 3. **Modal System**
```
Modal Management (ModalContext)
├── Overlay Rendering         # Full-screen modal backdrop
├── Form Components          # Advisor/Prompt/Settings forms
├── State Coordination       # Modal visibility control
└── Security Integration     # Password-protected storage
```

---

## 🔐 Security Architecture

### 1. **API Key Management**
```
Secure Storage System
├── Encryption               # AES-256 key encryption
├── Password Protection      # User-defined passwords
├── Browser Storage         # localStorage with encryption
└── Auto-cleanup           # Secure key removal
```

### 2. **Error Handling**
```
API Error Management
├── Authentication Errors   # Invalid API keys
├── Rate Limiting          # API quota management
├── Network Errors         # Connection failures
└── User Feedback          # Error message display
```

---

## 🧪 Development Features

### 1. **Debug Mode**
```
Debug Information Display
├── API Call Details        # Token usage, costs
├── Message Tags           # Conversation categorization
├── System Prompts         # AI instruction visibility
└── Performance Metrics    # Response timing
```

### 2. **Command System**
```
Terminal Commands (/commands)
├── Session Management     # /sessions, /load, /new
├── Advisor Management     # /advisor add/edit/delete
├── Export Functions       # /export, /export-all
├── Settings Control       # /debug, /keys, /tokens
└── Development Tools      # /memory, /context
```

---

## 📊 Performance Considerations

### 1. **Optimization Strategies**
```
React Optimizations
├── Memoized Components     # React.memo for expensive renders
├── useCallback Hooks      # Function reference stability
├── State Batching         # Reduced re-renders
└── Lazy Loading           # Component code splitting
```

### 2. **Memory Management**
```
Context Management
├── Token Limits           # 150,000 character threshold
├── Message Pruning        # Intelligent history trimming
├── Relevance Scoring      # Important message retention
└── Streaming Processing   # Real-time response handling
```

---

## 🚀 Extension Points

### 1. **Component Extensibility**
```
Modular Architecture Allows:
├── New Terminal Modules   # Custom panel types
├── Additional APIs        # Other AI service integrations
├── Custom Advisors        # Specialized AI personalities
└── Export Formats         # Additional output options
```

### 2. **Plugin Architecture**
```
Future Enhancement Areas:
├── Third-party Integrations # External service connectors
├── Custom Analysis Tools    # User-defined analyzers
├── Advanced UI Components   # Rich text editors, visualizations
└── Automation Features      # Workflow automation tools
```

---

## 📝 Development Guidelines

### 1. **Code Organization**
- **Components**: Single responsibility, props-based communication
- **Hooks**: Reusable business logic, side effect management
- **Utils**: Pure functions, stateless operations
- **Types**: TypeScript for complex data structures

### 2. **State Management**
- **Local State**: Component-specific UI state
- **Lifted State**: Shared state in Terminal.jsx
- **Context**: Global state (modals, themes)
- **Persistence**: localStorage for user data

### 3. **API Integration**
- **Error Boundaries**: Graceful failure handling
- **Loading States**: User feedback during operations
- **Rate Limiting**: Respect API quotas
- **Caching**: Minimize redundant API calls

---

*This architecture map serves as a comprehensive reference for understanding, maintaining, and extending the SPACE Terminal codebase.* 
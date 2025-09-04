# SPACE Terminal - Application Architecture

This document provides a comprehensive architectural overview of the SPACE Terminal application, including all components, their relationships, and data flow.

## High-Level Architecture Diagram

```mermaid
graph TB
    %% Top Level Application
    subgraph "SPACE Terminal Application"
        App[App.jsx<br/>Main Router & Theme Provider]
        
        %% Core UI Layer
        subgraph "Core UI Layer"
            Terminal[Terminal.jsx<br/>Central Application Hub<br/>~800 lines - Main State]
            MobileLayout[MobileLayout.jsx<br/>Mobile-Responsive Wrapper]
            ResponsiveContainer[ResponsiveContainer.jsx<br/>Adaptive UI Container]
        end
        
        %% Context Providers
        subgraph "Context Layer"
            AuthContext[AuthContext.jsx<br/>Authentication State]
            ModalContext[ModalContext.jsx<br/>Modal Management]
        end
        
        %% UI Modules
        subgraph "Terminal Modules"
            Module[Module.jsx<br/>Base Display Module]
            CollapsibleModule[CollapsibleModule.jsx<br/>Expandable Panels]
            GroupableModule[GroupableModule.jsx<br/>Advisor Grouping System]
            CollapsibleSuggestions[CollapsibleSuggestionsModule.jsx<br/>Interactive Suggestions]
            ExpandingInput[ExpandingInput.jsx<br/>Resizable Text Input]
        end
        
        %% Message Components
        subgraph "Message System"
            MessageRenderer[MessageRenderer.jsx<br/>Message Display Coordinator]
            MemoizedMarkdown[MemoizedMarkdownMessage.jsx<br/>Optimized Markdown]
            AdvisorResponseCard[AdvisorResponseCard.jsx<br/>Individual Advisor Displays]
            AdvisorResponseMessage[AdvisorResponseMessage.jsx<br/>Advisor Message Wrapper]
            ThinkingBlock[ThinkingBlock.jsx<br/>Extended Thinking Display]
            DebateBlock[DebateBlock.jsx<br/>Council Mode Debates]
        end
        
        %% Modal Components
        subgraph "Modal System"
            AdvisorForm[AdvisorForm.jsx<br/>Create Advisors]
            EditAdvisorForm[EditAdvisorForm.jsx<br/>Modify Advisors]
            SettingsMenu[SettingsMenu.jsx<br/>App Configuration]
            VotingModal[VotingModal.jsx<br/>Advisor Voting]
            HighCouncilModal[HighCouncilModal.jsx<br/>Council Mode Setup]
            AssertionsModal[AssertionsModal.jsx<br/>Claim Verification]
            EvaluationsModal[EvaluationsModal.jsx<br/>Advisor Improvement]
            DossierModal[DossierModal.jsx<br/>User Profiles]
            ImportExportModal[ImportExportModal.jsx<br/>Data Management]
            HelpModal[HelpModal.jsx<br/>User Documentation]
            InfoModal[InfoModal.jsx<br/>System Information]
            MigrationModal[MigrationModal.jsx<br/>Data Migration]
        end
        
        %% API Hooks Layer
        subgraph "API Integration Hooks"
            useClaude[useClaude.js<br/>Claude Sonnet 4 API<br/>Primary AI Integration]
            useOpenRouter[useOpenRouter.js<br/>OpenRouter API<br/>Multi-Model Access]
            useOpenAI[useOpenAI.js<br/>OpenAI GPT-4o-mini<br/>Analysis Functions]
            useGemini[useGemini.js<br/>Google Gemini<br/>Evaluation System]
            useUsageTracking[useUsageTracking.js<br/>Cost & Usage Analytics]
            useConversationStorage[useConversationStorage.js<br/>Database Operations]
        end
        
        %% Core Libraries
        subgraph "Core Libraries"
            MemorySystem[memory.ts<br/>Context Management<br/>Token Limit Handling]
            TagAnalyzer[tagAnalyzer.js<br/>Message Classification<br/>Shared Instance]
            DefaultPrompts[defaultPrompts.js<br/>System Prompt Templates]
            AdvisorColors[advisorColors.js<br/>Color Assignment System]
        end
        
        %% Utilities Layer
        subgraph "Utilities Layer"
            TerminalHelpers[terminalHelpers.js<br/>Analysis Pipeline<br/>Context Building]
            SecureStorage[secureStorage.js<br/>Encrypted API Keys<br/>AES-256 Encryption]
            UsageTracking[usageTracking.js<br/>Cost Calculation<br/>Usage Analytics]
            ApiConfig[apiConfig.js<br/>Endpoint Management]
            ApiErrorHandler[apiErrorHandler.js<br/>Error Management]
            Analytics[analytics.js<br/>Event Tracking]
            MigrationHelper[migrationHelper.js<br/>Data Migration Utils]
            WorksheetTemplates[worksheetTemplates.js<br/>Structured Prompts]
            EvaluationHelpers[evaluationHelpers.js<br/>Advisor Assessment]
            AutomationHelpers[automationHelpers.js<br/>Browser Testing Utils]
        end
        
        %% Backend Functions
        subgraph "Backend API (Cloudflare Functions)"
            subgraph "Chat Endpoints"
                ClaudeAPI[claude.js<br/>Claude API Proxy]
                OpenRouterAPI[openrouter.js<br/>OpenRouter Proxy]
                OpenAIAPI[openai.js<br/>OpenAI Proxy]
                GeminiAPI[gemini.js<br/>Gemini Proxy]
            end
            
            subgraph "Data Endpoints"
                ConversationsAPI[conversations/index.js<br/>Conversation CRUD]
                ConversationByID[conversations/[id].js<br/>Individual Conversations]
                MessagesAPI[conversations/[id]/messages.js<br/>Message Management]
                UsageAPI[usage.js<br/>Usage Statistics]
                HealthAPI[health.js<br/>System Status]
            end
            
            subgraph "Infrastructure"
                AuthUtils[utils/auth.js<br/>JWT Validation<br/>User Authentication]
                DatabaseUtils[utils/database.js<br/>Supabase Operations]
                RateLimiting[middleware/rateLimiting.js<br/>Request Throttling]
            end
        end
        
        %% External Services
        subgraph "External Services"
            Supabase[(Supabase<br/>PostgreSQL Database<br/>User Auth & Data)]
            ClaudeService[Claude Sonnet 4<br/>Primary AI Service]
            OpenAIService[OpenAI GPT-4o-mini<br/>Analysis Service]
            GeminiService[Google Gemini Pro<br/>Evaluation Service]
            OpenRouterService[OpenRouter<br/>Multi-Model Access]
        end
    end
    
    %% Data Flow Connections
    App --> Terminal
    App --> AuthContext
    App --> ModalContext
    
    Terminal --> MobileLayout
    Terminal --> ResponsiveContainer
    Terminal --> Module
    Terminal --> CollapsibleModule
    Terminal --> GroupableModule
    Terminal --> MessageRenderer
    Terminal --> AdvisorForm
    Terminal --> SettingsMenu
    Terminal --> VotingModal
    Terminal --> HighCouncilModal
    
    Terminal --> useClaude
    Terminal --> useOpenRouter
    Terminal --> useOpenAI
    Terminal --> useGemini
    Terminal --> useConversationStorage
    
    MessageRenderer --> MemoizedMarkdown
    MessageRenderer --> AdvisorResponseCard
    MessageRenderer --> ThinkingBlock
    MessageRenderer --> DebateBlock
    
    useClaude --> MemorySystem
    useClaude --> TerminalHelpers
    useClaude --> SecureStorage
    useClaude --> UsageTracking
    useClaude --> ClaudeAPI
    
    useOpenRouter --> OpenRouterAPI
    useOpenAI --> OpenAIAPI
    useGemini --> GeminiAPI
    
    ClaudeAPI --> ClaudeService
    OpenRouterAPI --> OpenRouterService
    OpenAIAPI --> OpenAIService
    GeminiAPI --> GeminiService
    
    useConversationStorage --> ConversationsAPI
    ConversationsAPI --> DatabaseUtils
    DatabaseUtils --> Supabase
    
    AuthContext --> AuthUtils
    AuthUtils --> Supabase
    
    Terminal --> TagAnalyzer
    Terminal --> DefaultPrompts
    Terminal --> AdvisorColors
    
    TerminalHelpers --> MemorySystem
    SecureStorage --> ModalContext
    
    %% Styling
    classDef coreComponent fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef apiHook fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef utility fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef modal fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class Terminal,MessageRenderer,MobileLayout coreComponent
    class useClaude,useOpenRouter,useOpenAI,useGemini apiHook
    class TerminalHelpers,SecureStorage,UsageTracking,MemorySystem utility
    class ClaudeAPI,OpenRouterAPI,ConversationsAPI,DatabaseUtils backend
    class Supabase,ClaudeService,OpenAIService,GeminiService external
    class AdvisorForm,SettingsMenu,VotingModal,HighCouncilModal modal
```

## Key Architectural Components

### 1. **Terminal.jsx - Central Hub (~800 lines)**
- **Role**: Main application state manager and coordinator
- **State Management**: 20+ useState hooks organizing core, UI, settings, and analysis state
- **Key Responsibilities**:
  - Message flow coordination
  - Advisor management
  - API orchestration
  - UI state management

### 2. **API Integration Strategy**
- **Primary AI**: Claude Sonnet 4 via `useClaude` hook
- **Analysis**: OpenAI GPT-4o-mini for metaphors/questions/suggestions  
- **Evaluation**: Gemini Pro for advisor improvement system
- **Multi-Model**: OpenRouter for additional model access
- **Streaming**: Real-time response rendering with token estimation

### 3. **Data Flow Architecture**
```
User Input → Terminal.jsx → API Hook → Backend Proxy → AI Service
                ↓
Message Processing ← Streaming Response ← API Response
        ↓
State Update → UI Refresh → Analysis Triggers
```

### 4. **Current Advisor System**
- **Single-Thread**: All advisors combined in one system prompt
- **System Prompt Generation**: `getSystemPrompt()` in Terminal.jsx:442-549
- **Response Format**: JSON structure with all advisor responses
- **Council Mode**: Structured debate format with rounds

### 5. **Context Management**
- **Memory System**: `memory.ts` handles token limits and context pruning
- **Context Limit**: 150,000 characters before pruning
- **Tag Analysis**: Automatic message classification and reference system
- **Session References**: @ syntax for referencing previous conversations

### 6. **Security Architecture**  
- **API Keys**: AES-256 encrypted browser storage via `secureStorage.js`
- **Authentication**: Google OAuth via Supabase Auth (optional)
- **Backend Proxy**: Cloudflare Functions proxy for authenticated API access
- **Rate Limiting**: Request throttling middleware

### 7. **Storage Modes**
- **Local Mode**: `VITE_USE_AUTH=false` - localStorage persistence
- **Database Mode**: `VITE_USE_AUTH=true` - Supabase integration

## Multi-Threaded Advisor Implementation Points

Based on this architecture, the multi-threaded advisor system would primarily modify:

1. **Terminal.jsx**: 
   - `getSystemPrompt()` function (lines 442-549)
   - Message handling and API orchestration
   - Response processing and UI updates

2. **useClaude.js**:
   - Individual advisor context building
   - Parallel API call management
   - Response streaming coordination

3. **MessageRenderer.jsx**:
   - Individual advisor response display
   - Threading-aware message organization

4. **New Components Needed**:
   - Thread management utilities
   - Individual advisor context builders
   - Parallel response coordinators

The existing modular architecture provides a solid foundation for implementing multi-threaded conversations without major structural changes.
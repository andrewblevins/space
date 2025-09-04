# Terminal.jsx Refactoring Plan

## Overview

Terminal.jsx (~800 lines, 20+ useState hooks) is a classic "God Component" that handles too many responsibilities. This document outlines a comprehensive plan to refactor it into a modular, maintainable architecture that will enable easier implementation of multi-threaded conversations.

## Current Problems

### Code Complexity
- **800+ lines** in a single component
- **20+ useState hooks** managing different concerns
- **Mixed responsibilities** (UI state, business logic, API coordination, data management)
- **Difficult to test** individual features in isolation
- **Performance issues** from excessive re-renders
- **Hard to maintain** - changes in one area can break others

### Specific Issues Identified
```javascript
// Current Terminal.jsx structure (lines referenced from actual file)
const Terminal = ({ theme, toggleTheme }) => {
  // Core State (5 hooks)
  const [messages, setMessages] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // UI State (10+ hooks)
  const [showAdvisorForm, setShowAdvisorForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showHighCouncilModal, setShowHighCouncilModal] = useState(false);
  // ... 6+ more modal states
  
  // Settings State (5+ hooks)
  const [maxTokens, setMaxTokens] = useState(4000);
  const [contextLimit, setContextLimit] = useState(150000);
  const [debugMode, setDebugMode] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(false);
  // ... more settings
  
  // Analysis State (4+ hooks)
  const [metaphors, setMetaphors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [advisorSuggestions, setAdvisorSuggestions] = useState([]);
  const [sessionSummary, setSessionSummary] = useState('');
  
  // 400+ lines of mixed logic
  // System prompt generation (lines 442-549)
  // Message handling
  // API orchestration
  // UI event handlers
  // Analysis pipeline coordination
};
```

## Proposed Architecture

### 1. Custom Hooks (Separation of Concerns)

#### **useMessages** 
**Purpose**: Handle all message-related state and operations
```javascript
// hooks/useMessages.js
export function useMessages({ memory, contextLimit }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  const addMessage = useCallback((message) => { /* logic */ }, []);
  const updateLastMessage = useCallback((content) => { /* logic */ }, []);
  const clearMessages = useCallback(() => { /* logic */ }, []);
  const buildConversationContext = useCallback(() => { /* logic */ }, []);
  
  return {
    messages,
    isLoading,
    streamingResponse,
    addMessage,
    updateLastMessage,
    clearMessages,
    buildConversationContext
  };
}
```

#### **useAdvisors**
**Purpose**: Manage advisor state, system prompt generation
```javascript
// hooks/useAdvisors.js
export function useAdvisors() {
  const [advisors, setAdvisors] = useState([]);
  const [activeAdvisors, setActiveAdvisors] = useState([]);
  const [advisorGroups, setAdvisorGroups] = useState([]);
  
  const addAdvisor = useCallback((advisor) => { /* logic */ }, []);
  const updateAdvisor = useCallback((id, updates) => { /* logic */ }, []);
  const toggleAdvisorActive = useCallback((id) => { /* logic */ }, []);
  const deleteAdvisor = useCallback((id) => { /* logic */ }, []);
  const getSystemPrompt = useCallback((options = {}) => { /* logic */ }, []);
  const getIndividualSystemPrompt = useCallback((advisor) => { /* logic */ }, []);
  
  return {
    advisors,
    activeAdvisors,
    advisorGroups,
    addAdvisor,
    updateAdvisor,
    toggleAdvisorActive,
    deleteAdvisor,
    getSystemPrompt,
    getIndividualSystemPrompt
  };
}
```

#### **useModalState**
**Purpose**: Manage all modal and UI visibility states
```javascript
// hooks/useModalState.js
export function useModalState() {
  const [modals, setModals] = useState({
    advisorForm: false,
    settings: false,
    voting: false,
    highCouncil: false,
    assertions: false,
    evaluations: false,
    dossier: false,
    importExport: false,
    help: false,
    info: false,
    migration: false
  });
  
  const [panels, setPanels] = useState({
    metaphors: false,
    questions: false,
    suggestions: false,
    sessionPanel: false,
    promptLibrary: false
  });
  
  const openModal = useCallback((modalName) => { /* logic */ }, []);
  const closeModal = useCallback((modalName) => { /* logic */ }, []);
  const togglePanel = useCallback((panelName) => { /* logic */ }, []);
  const closeAllModals = useCallback(() => { /* logic */ }, []);
  
  return {
    modals,
    panels,
    openModal,
    closeModal,
    togglePanel,
    closeAllModals
  };
}
```

#### **useAppSettings**
**Purpose**: Handle all application settings and preferences
```javascript
// hooks/useAppSettings.js
export function useAppSettings() {
  const [settings, setSettings] = useState({
    maxTokens: 4000,
    contextLimit: 150000,
    debugMode: false,
    reasoningMode: false,
    councilMode: false,
    multiThreadedMode: false, // NEW for multi-threaded conversations
    openrouterModel: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
    autoSave: true
  });
  
  const updateSetting = useCallback((key, value) => { /* logic */ }, []);
  const resetSettings = useCallback(() => { /* logic */ }, []);
  const exportSettings = useCallback(() => { /* logic */ }, []);
  const importSettings = useCallback((settingsData) => { /* logic */ }, []);
  
  return {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings
  };
}
```

#### **useConversationAnalysis**
**Purpose**: Coordinate analysis features (metaphors, questions, suggestions)
```javascript
// hooks/useConversationAnalysis.js
export function useConversationAnalysis({ messages, advisors }) {
  const [metaphors, setMetaphors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [advisorSuggestions, setAdvisorSuggestions] = useState([]);
  const [sessionSummary, setSessionSummary] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const analyzeForMetaphors = useCallback(async () => { /* logic */ }, []);
  const analyzeForQuestions = useCallback(async () => { /* logic */ }, []);
  const generateAdvisorSuggestions = useCallback(async () => { /* logic */ }, []);
  const summarizeSession = useCallback(async () => { /* logic */ }, []);
  const runFullAnalysis = useCallback(async () => { /* logic */ }, []);
  
  return {
    metaphors,
    questions,
    advisorSuggestions,
    sessionSummary,
    isAnalyzing,
    analyzeForMetaphors,
    analyzeForQuestions,
    generateAdvisorSuggestions,
    summarizeSession,
    runFullAnalysis
  };
}
```

#### **useMessageSending**
**Purpose**: Coordinate API calls and conversation flow
```javascript
// hooks/useMessageSending.js
export function useMessageSending({
  messageManager,
  advisorManager,
  settings,
  memory
}) {
  const { callClaude } = useClaude({
    messages: messageManager.messages,
    setMessages: messageManager.setMessages,
    maxTokens: settings.maxTokens,
    contextLimit: settings.contextLimit,
    memory,
    debugMode: settings.debugMode,
    reasoningMode: settings.reasoningMode,
    getSystemPrompt: advisorManager.getSystemPrompt
  });
  
  const { callOpenRouter } = useOpenRouter({ /* similar params */ });
  
  const sendMessage = useCallback(async (userMessage) => {
    if (settings.multiThreadedMode) {
      return await sendMultiThreadedMessage(userMessage);
    } else {
      return await sendSingleThreadMessage(userMessage);
    }
  }, [settings.multiThreadedMode]);
  
  const sendSingleThreadMessage = useCallback(async (userMessage) => {
    // Current implementation
    messageManager.addMessage({ type: 'user', content: userMessage });
    return await callClaude(userMessage);
  }, []);
  
  const sendMultiThreadedMessage = useCallback(async (userMessage) => {
    // NEW: Multi-threaded implementation
    messageManager.addMessage({ type: 'user', content: userMessage });
    const activeAdvisors = advisorManager.activeAdvisors;
    
    // Send parallel requests for each advisor
    const advisorPromises = activeAdvisors.map(advisor => 
      callClaude(userMessage, () => advisorManager.getIndividualSystemPrompt(advisor))
    );
    
    const responses = await Promise.allSettled(advisorPromises);
    // Process responses...
  }, []);
  
  return {
    sendMessage,
    isLoading: messageManager.isLoading
  };
}
```

### 2. Refactored Terminal Component

```javascript
// components/Terminal.jsx (New, much smaller)
const Terminal = ({ theme, toggleTheme }) => {
  // Initialize all hooks
  const memory = useRef(new MemorySystem()).current;
  const messageManager = useMessages({ memory, contextLimit: 150000 });
  const advisorManager = useAdvisors();
  const uiState = useModalState();
  const settings = useAppSettings();
  const analysis = useConversationAnalysis({
    messages: messageManager.messages,
    advisors: advisorManager.advisors
  });
  const conversation = useMessageSending({
    messageManager,
    advisorManager,
    settings,
    memory
  });
  
  // Event handlers (much simpler now)
  const handleSendMessage = useCallback(async (message) => {
    await conversation.sendMessage(message);
    if (settings.autoAnalyze) {
      await analysis.runFullAnalysis();
    }
  }, [conversation.sendMessage, analysis.runFullAnalysis, settings.autoAnalyze]);
  
  return (
    <div className="terminal">
      {/* UI Components - now just coordinate between managers */}
      <MessageDisplay 
        messages={messageManager.messages}
        isLoading={messageManager.isLoading}
      />
      
      <InputArea
        onSendMessage={handleSendMessage}
        disabled={messageManager.isLoading}
      />
      
      <AdvisorSidebar
        advisors={advisorManager.advisors}
        onToggleActive={advisorManager.toggleAdvisorActive}
        onAddAdvisor={() => uiState.openModal('advisorForm')}
      />
      
      {/* Modals - now managed by UIStateManager */}
      {uiState.modals.advisorForm && (
        <AdvisorForm
          onClose={() => uiState.closeModal('advisorForm')}
          onSave={advisorManager.addAdvisor}
        />
      )}
      
      {uiState.modals.settings && (
        <SettingsMenu
          settings={settings.settings}
          onUpdate={settings.updateSetting}
          onClose={() => uiState.closeModal('settings')}
        />
      )}
      
      {/* Other modals... */}
      
      {/* Analysis Panels */}
      <AnalysisPanel
        metaphors={analysis.metaphors}
        questions={analysis.questions}
        suggestions={analysis.advisorSuggestions}
        panels={uiState.panels}
        onTogglePanel={uiState.togglePanel}
      />
    </div>
  );
};
```

### 3. New Component Structure

```
components/
├── Terminal.jsx                 (150 lines - orchestrator only)
├── terminal/
│   ├── MessageDisplay.jsx       (message rendering logic)
│   ├── InputArea.jsx            (input handling)
│   ├── AdvisorSidebar.jsx       (advisor management UI)
│   ├── AnalysisPanel.jsx        (analysis results display)
│   └── SettingsPanel.jsx        (settings UI)
├── modals/
│   ├── AdvisorFormModal.jsx     (existing, but simpler)
│   ├── SettingsModal.jsx        (existing, but simpler)
│   └── ...
└── hooks/
    ├── useMessages.js           (200 lines)
    ├── useAdvisors.js           (150 lines)
    ├── useModalState.js         (100 lines)
    ├── useAppSettings.js        (100 lines)
    ├── useConversationAnalysis.js (150 lines)
    └── useMessageSending.js     (200 lines)
```

## Migration Strategy

### Phase 1: Extract State Management Hooks
1. **Create `useMessages`** - Move message state and operations
2. **Create `useAdvisors`** - Move advisor state and system prompt logic
3. **Create `useModalState`** - Move all modal/panel state
4. **Create `useAppSettings`** - Move all settings state
5. **Test**: Ensure Terminal.jsx still works with new hooks

### Phase 2: Extract Business Logic Hooks
1. **Create `useConversationAnalysis`** - Move analysis coordination logic
2. **Create `useMessageSending`** - Move API orchestration
3. **Test**: Ensure all functionality still works

### Phase 3: Simplify Terminal Component
1. **Refactor Terminal.jsx** to use the new hooks
2. **Extract UI components** (MessageDisplay, InputArea, etc.)
3. **Test**: Full functionality testing
4. **Performance testing** - ensure no regressions

### Phase 4: Multi-Threading Foundation
1. **Add multi-threaded mode setting** to useAppSettings
2. **Implement individual system prompts** in useAdvisors
3. **Add parallel API call support** to useMessageSending
4. **Test**: Basic multi-threading functionality

## Benefits After Refactoring

### 1. **Easier Multi-Threading Implementation**
- `useAdvisors.getIndividualSystemPrompt(advisor)` already isolated
- `useMessageSending` can handle parallel vs sequential calls
- Individual advisor contexts become straightforward

### 2. **Better Performance** 
- Targeted re-renders (only affected components update)
- Memoization opportunities in individual hooks
- Reduced component complexity

### 3. **Improved Maintainability**
- Single responsibility principle for each hook
- Easier to test individual features
- Changes isolated to specific concerns

### 4. **Enhanced Developer Experience**
- Smaller, focused components
- Clear separation of concerns
- Easier to understand and modify

### 5. **Future-Proof Architecture**
- Easy to add new features without affecting others
- Hooks can be reused in other components
- Better foundation for advanced features

## Testing Strategy

### Unit Testing
- Test each hook independently
- Mock dependencies clearly
- Test edge cases and error conditions

### Integration Testing  
- Test hook interactions
- Test Terminal component with all hooks
- Test multi-threading coordination

### Performance Testing
- Monitor re-render frequency
- Check memory usage patterns
- Measure API call efficiency

## Migration Timeline

**Week 1**: Phase 1 (State Management Hooks)
**Week 2**: Phase 2 (Business Logic Hooks) 
**Week 3**: Phase 3 (Component Refactoring)
**Week 4**: Phase 4 (Multi-Threading Foundation)

This refactoring will provide a solid foundation for implementing multi-threaded conversations while making the entire codebase more maintainable and performant.
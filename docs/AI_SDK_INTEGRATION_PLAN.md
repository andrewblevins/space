# SPACE Terminal AI SDK Integration Plan

## 🎯 **AI SDK Components to Integrate**

### **1. Multiple useChat Instances (Multi-Threading Core)**
- **Current**: Single chat managing all advisors in one API call
- **New**: Each advisor gets independent `useChat` instance with parallel streaming
- **Impact**: Enables true multi-threaded conversations with individual advisor contexts

### **2. streamText Backend (Performance & Reliability)**
- **Current**: Custom streaming logic in Cloudflare Functions
- **New**: AI SDK `streamText()` with built-in error handling and optimization
- **Impact**: Better streaming performance, reduced custom code maintenance

### **3. React State Management (useCompletion for Analysis)**
- **Current**: Manual state management for analysis functions (metaphors, questions)
- **New**: `useCompletion()` for individual analysis tasks
- **Impact**: Cleaner state management for analysis pipeline

### **4. Message Schema & Standards (Data Consistency)**
- **Current**: Custom message format and type definitions
- **New**: AI SDK standard message types and schemas
- **Impact**: Better type safety and compatibility with streaming

## 📋 **Phase-by-Phase Migration Plan**

### **Phase 1: Backend Streaming Foundation** ⚡
**Goal**: Replace custom streaming with AI SDK `streamText()`

**Files to Modify**:
- `functions/api/chat/claude.js` 
- `functions/api/chat/openai.js`
- `functions/api/chat/gemini.js`
- `functions/api/chat/openrouter.js`

**Changes**:
```javascript
// Replace custom streaming logic
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function onRequest(context) {
  const { messages, advisor } = await context.request.json();
  
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages,
    system: advisor ? getIndividualSystemPrompt(advisor) : getGroupSystemPrompt(),
  });
  
  return result.toTextStreamResponse();
}
```

**Benefits**: 
- Better error handling and retries
- Optimized streaming performance
- Less custom streaming code

**Risk**: Low (backend only, easy rollback)

### **Phase 2: Multiple useChat Integration** 🚀
**Goal**: Replace single chat with individual advisor chat instances

**Files to Modify**:
- `src/hooks/useAdvisors.js` (add chat instance management)
- `src/components/Terminal.jsx` (integrate multiple chats)
- `src/components/MessageRenderer.jsx` (map to individual chats)

**New Hook Pattern**:
```javascript
// In useAdvisors.js
const useAdvisorChats = () => {
  const chats = useMemo(() => {
    const chatInstances = {};
    
    advisors.forEach(advisor => {
      chatInstances[advisor.id] = useChat({
        id: `advisor-${advisor.id}`,
        api: '/api/chat',
        body: { advisor },
        onFinish: (message) => {
          // Handle individual advisor completion
          onAdvisorResponse(advisor.id, message);
        }
      });
    });
    
    return chatInstances;
  }, [advisors]);
  
  return chats;
};
```

**Benefits**:
- True parallel advisor responses
- Individual streaming states
- Independent error handling per advisor

**Risk**: Medium (touches core chat logic)

### **Phase 3: Analysis Pipeline with useCompletion** 📊
**Goal**: Replace manual analysis state management with `useCompletion`

**Files to Modify**:
- `src/utils/terminalHelpers.js` (analysis functions)
- `src/hooks/useMessages.js` (analysis integration)

**Implementation**:
```javascript
// Analysis hooks using useCompletion
const useMetaphorAnalysis = () => {
  return useCompletion({
    api: '/api/analysis/metaphors',
    onFinish: (completion) => {
      setMetaphors(parseMetaphors(completion));
    }
  });
};

const useQuestionAnalysis = () => {
  return useCompletion({
    api: '/api/analysis/questions',
    onFinish: (completion) => {
      setQuestions(parseQuestions(completion));
    }
  });
};
```

**Benefits**:
- Cleaner analysis state management
- Built-in loading states
- Better error handling for analysis

**Risk**: Low (isolated to analysis functions)

### **Phase 4: Message Schema Standardization** 📝
**Goal**: Adopt AI SDK message types and schemas

**Files to Modify**:
- `src/types/` (message type definitions)
- All hooks and components using message objects

**Changes**:
```javascript
// Standard AI SDK message format
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  // AI SDK standard properties
}
```

**Benefits**:
- Better type safety
- Compatibility with AI SDK features
- Standard message format

**Risk**: Low (type definitions)

## 🔧 **Installation & Setup**

```bash
# Install AI SDK packages
npm install ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google

# Optional: Provider packages for direct API access
npm install @ai-sdk/openrouter  # If available
```

## 🎯 **Integration Points with Current Architecture**

### **Preserves Current Structure**:
- ✅ Keep OpenRouter as unified provider for model variety
- ✅ Keep current advisor management system
- ✅ Keep existing UI components (`AdvisorResponseCard`, etc.)
- ✅ Keep conversation storage and memory systems

### **Enhances Current Features**:
- ✅ Multi-threading through multiple `useChat` instances
- ✅ Better streaming through `streamText()` backend
- ✅ Cleaner analysis pipeline with `useCompletion()`
- ✅ Standard message types and error handling

### **Key Decisions**:
- **Keep**: OpenRouter for provider diversity
- **Keep**: Current advisor personality system
- **Keep**: Existing conversation storage
- **Replace**: Single chat → Multiple chat instances
- **Replace**: Custom streaming → AI SDK streaming
- **Replace**: Manual analysis state → useCompletion

## 📊 **Migration Timeline Estimate**

- **Phase 1 (Backend)**: 1-2 days
- **Phase 2 (Multi-Chat)**: 3-4 days  
- **Phase 3 (Analysis)**: 1-2 days
- **Phase 4 (Schema)**: 1 day
- **Testing & Polish**: 2-3 days

**Total**: ~1-2 weeks for complete integration

## 🚀 **End State Vision**

After integration, we'll have:
- **True multi-threaded conversations** with individual advisor streaming
- **Improved streaming performance** via AI SDK backend
- **Cleaner state management** throughout the application
- **Better error handling** and retry logic
- **Foundation for advanced features** (tool calling later if needed)

## 🏗️ **Implementation Strategy**

### **Backward Compatibility**
- Maintain existing conversation data format
- Keep current advisor configurations
- Preserve user settings and API keys

### **Testing Strategy**
- Phase-by-phase rollout with fallback options
- Preserve dev environment setup and automation
- Test with existing conversation data

### **Risk Mitigation**
- Backend changes first (lowest risk)
- Keep current code as fallback during migration
- Incremental testing at each phase

This plan provides a clear path to integrate AI SDK benefits while preserving the strengths of our current OpenRouter-based architecture and newly refactored hook system.
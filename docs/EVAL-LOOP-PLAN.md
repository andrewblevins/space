# SPACE Terminal - Evaluation Loop Implementation Plan

## 🎯 Current Status: Phase 5 Complete, Phase 6 In Progress
**Completed**: Phases 1-5 (JSON format, Gemini integration, Assertions system, Evaluations system, Optimization MVP)  
**In Progress**: Phase 6 - Assertion-Centric Redesign (MVP)  
**Branch**: `feature/eval-loop` (implementing assertion-centric architecture)

## Overview
Implement an evaluation and optimization loop for advisor responses, allowing users to define assertions, run evaluations, and automatically optimize prompts to meet those assertions.

**MAJOR UPDATE**: Moving from response-centric to assertion-centric architecture for better user experience and flexibility.

## Architecture Goals
1. Allow users to create assertions about advisor responses
2. Evaluate responses against assertions using Gemini 2.5 Flash-lite
3. Automatically optimize advisor/system prompts to pass evaluations
4. Store full conversation context for reproducibility
5. Track evaluation and optimization history

## Phase 1: JSON Refactor for Advisor Responses ✅ COMPLETED

### Current State
- Single message contains multiple advisor perspectives with `[ADVISOR: Name]` markers
- Difficult to attach assertions to individual advisor responses
- Text-based parsing required for separation

### Target State
```json
{
  "type": "advisor_response",
  "advisors": [
    {
      "id": "resp-carl-jung-1737914400123",
      "name": "Carl Jung",
      "response": "From an analytical psychology perspective...",
      "timestamp": "2025-01-26T12:00:00.123Z"
    },
    {
      "id": "resp-marie-curie-1737914400456", 
      "name": "Marie Curie",
      "response": "From a scientific methodology standpoint...",
      "timestamp": "2025-01-26T12:00:00.456Z"
    }
  ],
  "synthesis": "Bringing these perspectives together..."
}
```

### Implementation Steps ✅ COMPLETED
1. ✅ Update system prompt to request JSON output
2. ✅ Modify `useClaude` hook to detect and parse JSON responses
3. ✅ Create `AdvisorResponseCard` component with assertion button
4. ✅ Update message rendering to handle both formats (backwards compatibility)

## Phase 2: Gemini 2.5 Flash-lite Integration ✅ COMPLETED

### API Setup
- Model: `gemini-2.5-flash-lite` (8192 token context)
- Pricing: Free tier available, then $0.01/$0.04 per million tokens
- Use cases: Assertions evaluation, prompt optimization

### Implementation ✅ COMPLETED
1. ✅ Add Gemini API key to environment variables
2. ✅ Create `useGemini` hook for API calls
3. ✅ Add key management in settings (similar to OpenAI)

## Phase 3: Assertions System ✅ COMPLETED

### Data Structure
```javascript
// Storage: localStorage key pattern: space_assertions_<responseId>
{
  responseId: "resp-carl-jung-1737914400123",
  responseContent: "From an analytical psychology perspective...",
  advisorName: "Carl Jung",
  conversationContext: {
    messages: [...], // Full conversation history
    advisors: [...], // Active advisors configuration
    systemPrompt: "...", // System prompt at time of response
    timestamp: "2025-01-26T12:00:00.123Z"
  },
  assertions: [
    {
      id: "assert-1",
      text: "Response should mention unconscious patterns",
      createdAt: "2025-01-26T12:01:00.000Z"
    },
    {
      id: "assert-2", 
      text: "Response should relate to collective unconscious",
      createdAt: "2025-01-26T12:01:30.000Z"
    }
  ],
  evaluations: [], // Will be populated by eval runs
  optimizations: [] // Will be populated by optimization runs
}
```

### UI Components ✅ COMPLETED
1. ✅ **Assertion Button**: Small icon next to each advisor response
2. ✅ **Assertions Modal**: Text area for entering multiple assertions
3. ✅ **Save Logic**: Store assertions with full context

## Phase 4: Evaluations System ✅ COMPLETED

### Evaluation Process ✅ COMPLETED
1. ✅ User clicks "Evaluate" in Evaluations modal
2. ✅ Send single batch request to Gemini with:
   - The advisor response
   - All assertions to evaluate
   - Request JSON response with pass/fail for each
3. ✅ Parse results and store with timestamp

### Evaluation Prompt Template
```
Evaluate whether this AI advisor's response meets the following assertions.

Response:
[ADVISOR RESPONSE]

Assertions:
1. [ASSERTION 1]
2. [ASSERTION 2]
3. [ASSERTION 3]

Return your evaluation as JSON in this exact format:
{
  "results": [
    {"id": 1, "pass": true, "reason": "Response discusses shadow and personal unconscious"},
    {"id": 2, "pass": false, "reason": "No mention of collective unconscious"},
    {"id": 3, "pass": true, "reason": "Includes dream analysis example"}
  ]
}
```

### Storage Structure
```javascript
evaluations: [
  {
    id: "eval-1",
    timestamp: "2025-01-26T12:05:00.000Z",
    model: "gemini-2.5-flash-lite",
    results: [
      {
        assertionId: "assert-1",
        assertionIndex: 1,
        passed: true,
        reason: "Response discusses shadow and personal unconscious patterns"
      },
      {
        assertionId: "assert-2",
        assertionIndex: 2,
        passed: false,
        reason: "No mention of collective unconscious or archetypes"
      }
    ],
    overallPassed: false,
    batchRequest: true  // Indicates this used batch evaluation
  }
]
```

## Phase 5: Optimization Loop (MVP) ✅ COMPLETED

### MVP Optimization Strategy
1. **Advisor-only optimization** (skip system prompt for MVP)
2. **Simple progress feedback** - spinner with iteration count
3. **Background processing** - run all 10 iterations without user intervention
4. **Binary decision** - accept optimized prompt or keep original
5. **Best attempt on failure** - present best result if no perfect solution found

### Optimization Process (MVP)
1. User clicks "Optimize" in Evaluations modal
2. Simple modal: "Optimize [Advisor Name]?" with Start button
3. Progress: "Optimizing prompts... (3/10)" with cancel option
4. For each iteration (up to 10):
   - Use Gemini to suggest improved advisor prompt
   - Test with Claude using original conversation context
   - Evaluate against assertions
   - Keep best result, continue if not perfect
5. Present results: "Improved X/Y assertions" with before/after prompts
6. User chooses: Accept or Cancel

### Optimization Prompt Template (MVP)
```
Current advisor prompt for [ADVISOR_NAME]:
[CURRENT PROMPT]

This advisor's response failed these assertions:
[FAILED ASSERTIONS WITH REASONS]

The original response was:
[ADVISOR RESPONSE]

Suggest an improved advisor prompt that would help produce responses meeting all assertions. Keep the same expertise level and personality, just enhance the approach.

Improved prompt:
```

### Storage Structure (MVP)
```javascript
// Add to existing assertions data structure
optimizations: [
  {
    id: "opt-1",
    startedAt: "2025-01-26T12:10:00.000Z",
    completedAt: "2025-01-26T12:15:00.000Z",
    originalPrompt: "Analytical psychologist...",
    finalPrompt: "Analytical psychologist who explores both personal and collective unconscious...",
    success: true,  // All assertions passed
    totalIterations: 3,
    improvementCount: 2, // How many assertions improved
    totalAssertions: 3
  }
]
```

### Implementation (MVP)
1. **Single component**: Extend `EvaluationsModal` with optimization logic
2. **No new hooks**: Add `handleOptimize` function directly
3. **Simple UI**: Basic modal overlay for progress and results
4. **Core logic**: 10-iteration loop with Gemini + Claude + evaluation

## Success Metrics
- Clean separation of advisor responses
- Reliable assertion evaluation
- Successful prompt optimization within 10 iterations
- Full context preservation for reproducibility
- Intuitive UI flow

## Technical Considerations
- Backwards compatibility with existing message format
- Efficient storage of conversation contexts
- Rate limiting for Gemini API calls
- Error handling for failed evaluations
- Rollback mechanism for prompt changes

## Phase 6: Assertion-Centric Redesign (MVP) 🚧 IN PROGRESS

### Problem with Current Architecture
The current system is **response-centric**: assertions belong to specific responses, making it difficult to:
- Test against multiple assertions from different responses
- Build comprehensive test suites for advisors
- Think in terms of requirements rather than individual responses

### New Architecture: Assertions as Primitives

**User Mental Model**: "I want my advisor to be gnomic AND concise AND metaphorical" (requirements-focused)  
**Not**: "I want it to be like Response A and Response B" (response-focused)

### New Data Structure
```javascript
// Assertion-centric storage
assertion_${assertionId} = {
  id: assertionId,
  text: "Response should be gnomic",
  advisorId: "advisor_123",
  advisorName: "Skull Cup", 
  sourceResponseId: "response_456",
  sourceConversationId: "conv_789",
  sourceUserInput: "Tell me about wisdom",
  sourceAdvisorResponse: "The owl knows...",
  sourceContext: [...], // conversation history
  createdAt: timestamp,
  isActive: true // for selection in UI
}

// Index for quick lookup
advisor_assertions_${advisorId} = [assertionId1, assertionId2, ...]
```

### MVP Implementation Plan

#### Step 1: Storage Migration (Foundation)
**Goal**: Change storage from response-centric to assertion-centric while preserving all existing data

**Changes Needed**:
1. **New Storage Structure**: Assertion objects with source context
2. **Migration Helper**: Convert existing `assertions_${conversationId}_${responseId}` to new format
3. **Storage Helper Functions**: Create/read/update/delete assertions
4. **Advisor Index**: Maintain `advisor_assertions_${advisorId}` arrays

#### Step 2: AssertionsModal Update (Creation)
**Goal**: Change assertion creation to store in new format

**Changes Needed**:
1. **Generate unique assertion IDs** instead of storing by response
2. **Capture full context** (user input, advisor response, conversation history)
3. **Store in assertion-centric format**
4. **Update advisor index** when assertions are created

#### Step 3: EvaluationsModal Redesign (Selection Interface)
**Goal**: Replace response selection with assertion selection

**New UI Layout**:
```
Assertions for [Advisor Name]:
☑ "Response should be gnomic"
   Source: "Tell me about wisdom" → "The owl knows..."
☐ "Response should be concise"
   Source: "Explain philosophy" → "Philosophy seeks..."
☑ "Response should use metaphors"
   Source: "What is truth?" → "Truth is a mirror..."

[Optimize Against Selected Assertions]
```

**Changes Needed**:
1. **Assertion List Component**: Show assertions with source context
2. **Selection State**: Track which assertions are selected for optimization
3. **Replace response dropdown** with assertion checklist

#### Step 4: Optimization Logic Update (Testing)
**Goal**: Test against selected assertions instead of response-specific assertions

**Changes Needed**:
1. **Collect selected assertions** instead of loading by response ID
2. **Test each assertion in its original context** (preserve source conversation)
3. **Update evaluation helpers** to work with assertion objects
4. **Results display** showing which assertions passed/failed

#### Step 5: UI Polish (MVP Completion)
**Goal**: Clean up interface and add basic assertion management

**Changes Needed**:
1. **Remove assertion count indicators** from response cards (no longer relevant)
2. **Add assertion management**: Edit/delete assertions from EvaluationsModal
3. **Visual improvements**: Better display of assertion source context
4. **Error handling**: Graceful migration and fallbacks

### MVP Benefits
- **Granular Selection**: Pick specific requirements without taking all assertions from a response
- **Requirement-Focused**: Interface organized around "what should this advisor do?" 
- **Flexible Composition**: Mix and match requirements from different contexts
- **Reusable**: Assertions become reusable criteria for different optimization runs

### MVP Scope Limitations
**What we're NOT including in MVP**:
- Advanced assertion organization/grouping
- Assertion templates or suggestions
- Bulk assertion operations
- Advanced filtering/search
- Assertion analytics/statistics

**MVP Focus**: 
- Core functionality: Create → Select → Optimize
- Data migration without loss
- Clean, intuitive selection interface
- Preserve all existing optimization capabilities
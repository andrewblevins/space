# SPACE Terminal - Evaluation Loop Implementation Plan

## 🎯 Current Status: Phase 5 Complete (Ready for Testing)
**Completed**: Phases 1-5 (JSON format, Gemini integration, Assertions system, Evaluations system, Optimization MVP)  
**Next Up**: Testing and refinement  
**Branch**: `feature/eval-loop` (ready to merge full evaluation + optimization system)

## Overview
Implement an evaluation and optimization loop for advisor responses, allowing users to define assertions, run evaluations, and automatically optimize prompts to meet those assertions.

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

## Phase 6: UI Implementation ✅ PARTIALLY COMPLETED

### New Components ✅ COMPLETED
1. ✅ **AssertionsModal**: Create/view assertions for a response
2. ✅ **EvaluationsModal**: List responses with assertions, run evals
3. ✅ **EvaluationResultsModal**: Show eval results (basic version)
4. ⏳ **Optimization UI**: Simple modal overlay within EvaluationsModal (MVP approach)

### AccordionMenu Addition ✅ COMPLETED
```javascript
{
  id: 'evaluations',
  label: 'Evaluations',
  onClick: onEvaluationsClick,
  icon: (/* checklist icon */)
}
```

## Implementation Order
1. ✅ JSON refactor for advisor responses
2. ✅ Gemini API integration
3. ✅ Assertions UI and storage
4. ✅ Evaluations button and modal
5. ✅ Basic evaluation functionality
6. ✅ Optimization loop (MVP implementation)
7. ⏳ Prompt update mechanism (basic version implemented, needs integration with main advisor state)

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
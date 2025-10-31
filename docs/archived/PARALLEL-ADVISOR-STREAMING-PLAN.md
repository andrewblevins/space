# Parallel Advisor Streaming MVP Implementation Plan

## Overview
Transform SPACE Terminal from single-stream multi-advisor simulation to true parallel advisor conversations. Each selected advisor runs as an independent Claude instance with its own streaming response.

## End State Description

### User Experience After Implementation
1. **User sends a message** (unchanged)
2. **Only SELECTED advisors respond** - advisors with active checkmarks in the advisor menu
3. **Multiple advisors start streaming simultaneously** - each selected advisor begins streaming their response immediately in parallel
4. **Real-time parallel streaming** - user sees each advisor's response appearing as they generate it, all happening at the same time
5. **Independent completion** - advisors finish at different times based on response length

### Visual Changes
- **AdvisorResponseCard components** show streaming text appearing in real-time per advisor
- **Multiple cards streaming simultaneously** instead of waiting for complete JSON response
- **Same UI layout and design** - no visual changes to advisor management or layout

### Technical Changes
- **Multiple Claude API calls** fire simultaneously for each selected advisor
- **Individual system prompts** - each advisor gets only their own personality description
- **Independent conversation threads** - each advisor has separate context
- **New message type** `parallel_advisor_response` with per-advisor content

### What Stays Exactly the Same
- Advisor selection interface (checkboxes in advisor menu)
- UI layout, colors, and design
- Conversation history and storage
- All other features (assertions, evaluations, etc.)

## Current vs Target Architecture

### Current (Single Stream)
```
User Message → Single System Prompt (all advisors) → Claude API → JSON Response → Parse/Display
```

### Target (Parallel Streams)
```
User Message → Multiple Individual Prompts (selected advisors only) → Parallel Claude API Calls → Independent Streams → Real-time Display
```

## MVP Implementation Phases

### Phase 1: Core Parallel API Hook
**Objective**: Create basic parallel streaming functionality.

#### 1.1 Create `useParallelAdvisors.js`
- Hook to manage multiple simultaneous Claude API calls for selected advisors only
- Handle parallel streaming with independent states
- Basic error handling per advisor

#### 1.2 Simple Message State Structure
```javascript
// New message structure for parallel responses
{
  type: 'parallel_advisor_response',
  advisorResponses: {
    'advisor-1-id': {
      content: 'streaming content...',
      completed: false
    }
  },
  allCompleted: false,
  timestamp: '...'
}
```

### Phase 2: Basic UI Updates
**Objective**: Display parallel streaming responses.

#### 2.1 Update AdvisorResponseCard
- Support for live streaming updates per advisor
- Remove individual loading indicators (unnecessary)

#### 2.2 Update Terminal Message Rendering
- Handle `parallel_advisor_response` message type
- Display each advisor's streaming response

### Phase 3: Terminal Integration
**Objective**: Wire parallel system into main Terminal component.

#### 3.1 Terminal.jsx Changes
- Replace single API call with parallel calls for selected advisors
- Update `handleSubmit` to get active advisors and trigger multiple API calls
- Generate individual system prompts per selected advisor

#### 3.2 Individual System Prompts
- Create separate prompt for each selected advisor
- Each advisor gets only their own personality description

## Technical Implementation Details

### New Files to Create
1. `src/hooks/useParallelAdvisors.js` - Core parallel streaming hook

### Modified Files  
1. `src/components/Terminal.jsx` - Replace single API call with parallel calls
2. `src/components/terminal/AdvisorResponseCard.jsx` - Add streaming support
3. `src/components/mobile/MobileLayout.jsx` - Handle new message type

### Key Technical Considerations

#### 1. Selected Advisors Only
- Only advisors with `active: true` in advisor state get API calls
- Filter advisors before creating parallel calls
- Same advisor selection logic as current system

#### 2. Basic Error Handling
- Individual advisor failure doesn't break entire response
- Continue streaming other advisors on individual failures

#### 3. Simple State Management
- Each advisor tracks: content, completed
- No individual loading indicators needed

## Testing Strategy

### Phase Testing Approach
1. **Phase 1**: Test parallel API calls with 2 advisors
2. **Phase 2**: Test UI displays streaming correctly
3. **Phase 3**: End-to-end test with real conversations

### Test Scenarios
1. **Basic Parallel**: 2-3 selected advisors streaming simultaneously
2. **Advisor Selection**: Only advisors with checkmarks respond
3. **Single Failure**: One advisor fails, others continue

## Development Timeline Estimate

- **Phase 1**: 3-5 days (Parallel Hook)
- **Phase 2**: 2-3 days (UI Updates)
- **Phase 3**: 2-3 days (Integration)

**Total MVP Estimate**: 1-2 weeks

## Next Steps

1. Create `useParallelAdvisors.js` hook
2. Test basic parallel API functionality
3. Update UI components for parallel display
4. Integrate into Terminal.jsx

This simplified MVP focuses only on core parallel streaming without advanced features or complex optimizations.
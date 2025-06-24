# SPACE Terminal Context Management & Conversation Flow
*Date: 2025-06-24*

## Overview

This document provides a detailed explanation of how SPACE Terminal manages context and processes conversations between users and Claude. It covers the complete flow from user input to AI response, including all intermediate processing steps.

## Conversation Flow Pipeline

### 1. User Input Processing
**Location**: `Terminal.jsx:2225-2314` (handleSubmit function)

When a user submits a message:
1. Input validation - checks for empty or loading states
2. Command detection - routes `/` commands to command handler
3. Special mode detection:
   - High Council mode via `/council` marker
   - Session references via `@"Session Title"` syntax
4. Parallel processing initiates:
   - Tag analysis using GPT-4o-mini
   - Message preparation for Claude

### 2. Context Injection & Session References
**Location**: `Terminal.jsx:2262-2314`

SPACE supports two reference formats:
- **Modern**: `@"Session Title"` - references by session name
- **Legacy**: `@1`, `@2` - references by session ID

Process:
1. Regex matching finds all session references
2. Parallel fetch of session summaries (via GPT-4o-mini)
3. Context injection into the system prompt
4. Original references preserved in the user message

### 3. System Prompt Construction
**Location**: `Terminal.jsx:371-421` (getSystemPrompt function)

The system prompt is dynamically built from:

#### Active Advisors
```javascript
prompt += `You are currently embodying the following advisors:\n${activeAdvisors.map(a => `\n${a.name}: ${a.description}`).join('\n')}\n\n`;
```

#### Response Format Instructions
- Standard advisor format with `[ADVISOR: Name]` tags
- High Council debate format for multi-advisor discussions
- Specific formatting rules for actions and emotional states

#### Session Contexts
Referenced sessions are included as:
```
### Context 1: "Session Title" (Session ID, Date)
[Summary content]
```

### 4. Context Window Management
**Location**: `useClaude.js:45-65`

Two strategies based on token estimation:

#### Strategy 1: Under Token Limit
- Include all user/assistant messages
- Add timestamps for temporal context
- Maintain complete conversation history

#### Strategy 2: Over Token Limit
**Location**: `terminalHelpers.js:12-67` (buildConversationContext)

Smart context selection:
1. Memory system retrieves relevant past messages
2. Last 6 messages included for immediate context
3. Formatted with clear section headers:
   - `=== PREVIOUS RELEVANT USER MESSAGES ===`
   - `=== MOST RECENT CONVERSATION ===`
   - `=== CURRENT MESSAGE ===`

### 5. API Request Construction
**Location**: `useClaude.js:86-110`

Request structure:
```javascript
{
  model: 'claude-sonnet-4-20250514',
  messages: contextMessages,
  system: systemPromptText,
  max_tokens: maxTokens,
  stream: true,
  thinking: {  // Only if reasoning mode enabled
    type: 'enabled',
    budget_tokens: Math.floor(maxTokens * 0.6)
  }
}
```

### 6. Response Streaming
**Location**: `useClaude.js:152-219`

Real-time streaming process:
1. Character-by-character streaming with natural delays
2. Separate handling for:
   - Regular content (`text_delta`)
   - Thinking content (`thinking_delta`) when Extended Thinking is enabled
3. Live UI updates during streaming
4. Token counting for usage tracking

### 7. Post-Response Processing
**Location**: `Terminal.jsx:2473-2483`

After Claude responds:
1. Tag analysis completes and updates message metadata
2. Session contexts cleared (temporary per-request)
3. Parallel analysis triggers:
   - Metaphor extraction
   - Advisor suggestions
4. Session auto-save with all metadata

## Key Features

### Token Management
- Automatic estimation: ~4 characters per token
- Dynamic strategy switching at context limit threshold
- Separate tracking for input/output tokens
- Real-time cost calculation in debug mode

### Session Memory System
- Progressive summaries every 20 messages
- Cached summaries with 80% relevance threshold
- Parallel summary generation for performance
- Summary includes message count for cache validation

### Advisor System Integration
- Each advisor adds personality to system prompt
- Formatting instructions ensure consistent output
- High Council mode enables structured debates
- Active advisor state persists across sessions

### Extended Thinking Mode
- 60% of max tokens allocated to thinking
- Disabled during High Council debates
- Thinking content displayed separately in UI
- Reasoning guidance added to system prompt

## Debug Mode Insights

When debug mode is enabled:
- Token counts (system, context, total)
- Cost calculations (input/output)
- Complete system prompt
- Full context messages array
- Tags for current message

## Performance Optimizations

1. **Parallel Processing**: Tag analysis runs alongside Claude API call
2. **Progressive Summaries**: Reduce repeated summarization overhead
3. **Smart Context Selection**: Memory system prevents token overflow
4. **Streaming Response**: Immediate user feedback during generation

## Configuration Points

### User-Configurable Settings
- `contextLimit`: Token threshold for context management
- `maxTokens`: Maximum response length
- `debugMode`: Detailed API information display
- `reasoningMode`: Extended Thinking toggle

### System Constants
- Model: `claude-sonnet-4-20250514`
- Token estimation: 4 characters per token
- Recent message count: 6
- Summary generation threshold: 20 messages

## Future Enhancement Opportunities

1. **Visual Context Inspector**: Show which messages are included/excluded
2. **Token Budget Visualization**: Real-time graph of token usage
3. **Context Strategy Override**: Manual control over context selection
4. **Session Graph View**: Visualize conversation references and relationships
5. **Adaptive Token Estimation**: Learn actual token ratios per session

## Related Documentation

- `/docs/ARCHITECTURE.md` - Overall system architecture
- `/docs/AUTOMATION.md` - Browser automation patterns
- `/src/hooks/useClaude.js` - Core Claude integration
- `/src/utils/terminalHelpers.js` - Context building utilities
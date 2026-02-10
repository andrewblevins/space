# Message and Prompt Flow Documentation

This document describes how messages and prompts flow through the SPACE Terminal conversation system, particularly for the parallel advisor architecture.

## Overview

SPACE Terminal uses a parallel advisor system where multiple AI perspectives respond simultaneously to user input. Each advisor maintains an independent conversation thread with the user, seeing only their own previous responses (not other advisors' responses).

## Message Types

### User Messages
```javascript
{
  type: 'user',
  content: 'User's text input',
  timestamp: '2025-10-30T12:00:00.000Z'
}
```

### Parallel Advisor Response Messages
```javascript
{
  type: 'parallel_advisor_response',
  advisorResponses: {
    'seth-godin': {
      name: 'Seth Godin',
      content: 'Response text...',
      completed: true,
      thinking: '...' // Optional, if reasoning mode enabled
    },
    'martin-buber': {
      name: 'Martin Buber',
      content: 'Response text...',
      completed: true
    }
    // ... other advisors
  },
  allCompleted: true,
  timestamp: '2025-10-30T12:00:01.000Z'
}
```

### Legacy Message Types
- `advisor_json`: Older format for advisor responses
- `assistant`: Standard assistant responses (non-advisor mode)
- `system`: System messages and notifications

## Conversation Flow

### 1. User Submits Input

User enters text in Terminal.jsx → `handleSubmit()` is called

```javascript
// Terminal.jsx
const handleSubmit = async (e) => {
  // Add user message to state
  const newUserMessage = {
    type: 'user',
    content: input,
    timestamp: new Date().toISOString()
  };
  setMessages(prev => [...prev, newUserMessage]);

  // Call parallel advisors
  await callParallelAdvisors(input, activeAdvisors);
}
```

### 2. Parallel Advisor Invocation

The `useParallelAdvisors` hook orchestrates multiple simultaneous API calls:

```javascript
// useParallelAdvisors.js - callParallelAdvisors()

// 1. Initialize parallel message structure
const advisorResponses = {};
activeAdvisors.forEach(advisor => {
  advisorResponses[advisorId] = {
    name: advisor.name,
    content: '',
    completed: false
  };
});

// 2. Add parallel message to state (will be updated during streaming)
const parallelMessage = {
  type: 'parallel_advisor_response',
  advisorResponses: advisorResponses,
  allCompleted: false,
  timestamp: new Date().toISOString()
};
setMessages(prev => [...prev, parallelMessage]);

// 3. Launch parallel API calls (Promise.all)
const promises = activeAdvisors.map(advisor =>
  callSingleAdvisor(userMessage, advisor, advisorId)
);
await Promise.all(promises);
```

### 3. Individual Advisor Context Building

For each advisor, `callSingleAdvisor()` builds their unique context:

```javascript
// useParallelAdvisors.js - callSingleAdvisor()

// Count conversation turns for THIS advisor
const conversationTurns = messages.filter(m => {
  // Count messages where this advisor participated
  if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
    return Object.values(m.advisorResponses).some(resp => resp.name === advisor.name);
  }
  return false;
}).length;

// Build conversation history
const conversationMessages = messages
  .filter(m => {
    // Include ALL user messages
    if (m.type === 'user') return true;

    // Include ONLY this advisor's previous responses
    if (m.type === 'parallel_advisor_response' && m.advisorResponses) {
      return Object.values(m.advisorResponses).some(resp => resp.name === advisor.name);
    }

    return false;
  })
  .map(m => {
    if (m.type === 'user') {
      return {
        role: 'user',
        content: m.timestamp ? `[${formatTimestamp(m.timestamp)}] ${m.content}` : m.content
      };
    }

    // Extract only THIS advisor's response
    const thisAdvisorResponse = Object.values(m.advisorResponses)
      .find(resp => resp.name === advisor.name);

    return {
      role: 'assistant',
      content: thisAdvisorResponse.content
    };
  });
```

## System Prompt Structure

Each advisor receives a dynamically constructed system prompt that varies based on conversation turn count.

### Complete System Prompt Template

```javascript
const systemPromptText = `You are ${advisor.name}. ${advisor.description}

## Context
You are a voice in SPACE Terminal, a multi-perspective conversation interface where users explore complex problems by consulting multiple voices with distinct viewpoints. Users create and configure perspectives to help them think through questions, stress-test ideas, and develop their understanding through "opponent processing."

${conversationTurns < 3 ? EARLY_PROTOCOL : ONGOING_PROTOCOL}

Respond naturally and directly without JSON formatting, name labels, or meta-commentary about being a voice or perspective. Other perspectives are responding independently in parallel. You may occasionally see a summary of what they said in the previous turn — use it if it's relevant, but don't feel obligated to respond to it. Speak in your own voice and stay grounded in your perspective.`;
```

### Early Protocol (Turns 1-3)

**Purpose:** Information gathering only. No advice, challenge, or perspective yet.

```
## Your Task Right Now (Turn ${conversationTurns + 1} of 3)
Your only job right now is to ask ONE question that will help you understand the concrete situation better. You do not have enough information yet to offer perspective, advice, or challenge.

Ask about specific details you're genuinely uncertain about:
- What actually happened or was said
- What constraints or context exist
- What the person has already tried
- Concrete facts about the situation

Your question should be short and direct. No preamble, no observations, no advice.

Do NOT ask questions that make a point or suggest a direction. These are information-gathering turns only.

Good: "What did your teacher say when they recommended The Prosperous Coach?"
Good: "How many of these potential clients have you worked with before?"
Bad: "What would it mean to risk an authentic encounter?" (this is advice disguised as a question)
Bad: "What are you protecting?" (this assumes and suggests)
```

**Key Design Decisions:**
- Explicit "Turn X of 3" to create temporal awareness
- "You do not have enough information yet" normalizes not knowing
- Concrete examples of good/bad questions prevent Socratic advice questions
- No mention of later turns to avoid forward-thinking

### Ongoing Protocol (Turn 4+)

**Purpose:** Full engagement with perspective, challenge, insight, and depth.

```
## Your Task Now (Turn ${conversationTurns + 1})
You now have enough context to engage more fully. Respond from your distinct perspective with insight, challenge, and depth.

Keep responses concise and focused - aim for 2-4 paragraphs maximum. Be brief for simple questions, more thorough for complex ones.

Be direct and challenging. The user has chosen you specifically to stress-test their thinking. Challenge assumptions, point out contradictions, and push back when something doesn't make sense from your perspective. Directness and intellectual honesty matter more than politeness.

When it serves your point, share relevant stories, anecdotes, or examples to illustrate your perspective. Stories can make abstract concepts concrete and reveal patterns the user might not have considered.

Ask clarifying questions when needed, but now you can also offer strong opinions, frameworks, and recommendations based on your worldview.
```

**Key Design Decisions:**
- "You now have enough context" signals permission to engage
- Brings back all challenge/directness/perspective elements
- Maintains brevity expectations (2-4 paragraphs)
- Storytelling encouraged but not required
- No reference to earlier protocol phases

## API Request Structure

### Request to OpenRouter (via backend proxy in auth mode)

```javascript
const requestBody = {
  model: 'anthropic/claude-sonnet-4.5',
  messages: [
    { role: 'system', content: systemPromptText },
    ...conversationMessages // user/assistant alternating
  ],
  max_tokens: maxTokens,
  stream: true
};

// Headers differ based on auth mode
const headers = useAuthSystem
  ? { 'Authorization': `Bearer ${session.access_token}` }
  : { 'Authorization': `Bearer ${openrouterKey}`, ... };

fetch(apiUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify(requestBody)
});
```

### Streaming Response Handling

```javascript
// Parse SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  // Parse: data: {"choices":[{"delta":{"content":"text"}}]}
  const data = JSON.parse(dataMatch[1]);

  // Append to current content
  currentContent += data.choices[0].delta.content;

  // Update message state (triggers UI re-render)
  setMessages(prev => {
    const lastMessage = prev[prev.length - 1];
    return [
      ...prev.slice(0, -1),
      {
        ...lastMessage,
        advisorResponses: {
          ...lastMessage.advisorResponses,
          [advisorId]: {
            ...lastMessage.advisorResponses[advisorId],
            content: currentContent,
            completed: false
          }
        }
      }
    ];
  });
}
```

## Context Visibility Rules

### What Each Advisor Sees

Each advisor's API call receives an isolated conversation history to prevent "context contamination" — a bug where advisors mimic the multi-perspective format after seeing all advisors' responses in their assistant message history.

✅ **Included in context:**
- ALL user messages from conversation history
- ONLY their own previous responses (as `assistant` role messages)
- A reference summary of other advisors' responses from the **most recent turn only** (as a `user` role message, clearly bracketed)
- The current user message
- Their current system prompt (appropriate for turn count)

❌ **NOT included in context:**
- Other advisors' responses in the `assistant` role (this caused the contamination bug)
- Other advisors' responses from turns older than the most recent
- System messages
- Previous versions of system prompts
- Metadata about turn counts or protocol phases

### Cross-Advisor Awareness (Last Turn Reference)

To allow users to naturally reference what other advisors said, each advisor receives a bracketed reference block containing the other advisors' responses from the previous turn. This is injected as a `user` role message immediately before the current user message.

```javascript
// Injected as user role — NOT assistant — to avoid pattern mimicking
{
  role: 'user',
  content: `[For reference, here's what the other perspectives said last turn:

Seth Godin: ...response text...

Pema Chödrön: ...response text...]`
}
```

**Design rationale:**
- **`user` role, not `assistant`**: The LLM never sees multi-voice text as its own output, preventing the contamination pattern
- **Only the last turn**: Keeps token cost bounded regardless of conversation length
- **Bracketed framing**: Clearly marked as reference material, not a directive to respond to
- **Excludes this advisor's own response**: No redundancy — they already have it in their assistant history

### Example Context for "Martin Buber" on Turn 4

```javascript
// System message
{
  role: 'system',
  content: `You are Martin Buber. ${description}...

  ## Your Task Now (Turn 4)
  You now have enough context to engage more fully...`
}

// Conversation history (this advisor's isolated thread)
{ role: 'user', content: '[2025-10-30T12:00] First user message' }
{ role: 'assistant', content: 'Martin Buber turn 1 response' }
{ role: 'user', content: '[2025-10-30T12:05] Second user message' }
{ role: 'assistant', content: 'Martin Buber turn 2 response' }
{ role: 'user', content: '[2025-10-30T12:10] Third user message' }
{ role: 'assistant', content: 'Martin Buber turn 3 response' }

// Last turn reference (other advisors' most recent responses)
{ role: 'user', content: '[For reference, here\'s what the other perspectives said last turn:\n\nSeth Godin: ...turn 3 response...\n\nPema Chödrön: ...turn 3 response...]' }

// Current user message
{ role: 'user', content: '[2025-10-30T12:15] Fourth user message' }
```

## UI Rendering

### ParallelAdvisorGrid Component

Messages with `type: 'parallel_advisor_response'` are rendered in a responsive grid:

```javascript
// MessageRenderer.jsx
case 'parallel_advisor_response':
  return (
    <ParallelAdvisorGrid
      message={msg}
      advisors={advisors}
      onAssertionsClick={onAssertionsClick}
      messages={messages}
      getSystemPrompt={getSystemPrompt}
    />
  );
```

Grid layout:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

Each card shows:
- Advisor name with color indicator
- Response content (streaming updates)
- Edit and assertions buttons
- Thinking content (if reasoning mode enabled)

## Token Management

### Estimation
```javascript
const estimateTokens = (text) => Math.ceil(text.length / 4);
```

### Tracking
```javascript
// Input tokens
const systemTokens = estimateTokens(systemPromptText);
const contextTokens = conversationMessages.reduce((s, m) =>
  s + estimateTokens(m.content), 0
);
const inputTokens = systemTokens + contextTokens;

// Output tokens
const outputTokens = estimateTokens(currentContent);

// Track usage
trackUsage('claude', inputTokens, outputTokens);
```

### Context Limits
- Default context limit: 150,000 characters
- When exceeded, older messages are pruned (user's memory system handles intelligent pruning)

## Error Handling

### Individual Advisor Failures

If one advisor's API call fails, others continue:

```javascript
// Promise.all with error catching
const promises = activeAdvisors.map(advisor =>
  callSingleAdvisor(userMessage, advisor, advisorId)
    .catch(error => {
      // Mark this advisor as failed in UI
      setMessages(prev => {
        // Update advisorResponses[advisorId] with error
        content: `Error: ${error.message}`,
        completed: true,
        error: true
      });
      return null; // Don't break Promise.all
    })
);
```

### Complete Failure Scenarios

- Network timeout (15 second timeout on fetch)
- Authentication failure (401)
- Rate limiting (429)
- API key issues

All errors surface in the UI with appropriate messaging.

## Performance Considerations

### Parallel Execution
- Multiple advisors call APIs simultaneously (not sequentially)
- Streaming provides real-time feedback
- React state updates trigger incremental re-renders

### Optimization Opportunities
- Responses are memoized in ParallelAdvisorGrid
- Context building is optimized to avoid re-filtering on every render
- Token estimation uses simple approximation (text.length / 4)

## Debug Logging

Key console logs for debugging:

```javascript
console.log(`🔢 ${advisor.name} turn count:`, conversationTurns);
console.log(`🎭 ${advisor.name} API Call Starting:`, { inputTokens, systemTokens });
console.log(`🎭 ${advisor.name} CONTEXT MESSAGES:`, conversationMessages);
console.log(`🎭 ${advisor.name} Response received:`, { status, ok });
```

Enable with `debugMode` state in Terminal.jsx.

## Change History

### Context contamination fix (2026-02-10)
- **Problem**: Advisors saw all other advisors' responses in the `assistant` role, causing them to mimic the multi-perspective format after 2-3 turns
- **Fix**: Reverted to isolated context model where each advisor only sees its own responses as `assistant` messages
- **Enhancement**: Added "last turn reference" — other advisors' most recent responses injected as a bracketed `user` role message, giving awareness without contamination
- **Commit**: `81f08e9` introduced the bug; current commit fixes it

## Future Enhancements

Potential improvements to this architecture:

1. **Graceful context windowing**: Instead of the current binary cliff (full history or user-messages-only), trim oldest turns first when approaching the token limit
2. **Cross-Advisor Synthesis**: Optional synthesis step after all advisors respond
3. **Dynamic Protocol Phases**: Allow users to configure when early protocol ends
4. **Advisor Interruptions**: Allow advisors to respond to each other in certain modes

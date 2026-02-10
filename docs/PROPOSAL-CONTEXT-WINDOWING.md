# Proposal: Graceful Context Windowing for Advisor Conversations

## Problem

The current context management in `useParallelAdvisors.js` uses a binary approach:

```javascript
const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0);

if (totalTokens < contextLimit) {
  // Include full filtered history for this advisor
} else {
  // Fallback: user messages only — all advisor history dropped
}
```

This has two issues:

1. **The token estimate is wrong.** `totalTokens` counts ALL messages in the conversation (every advisor's responses, every user message), but each advisor only receives its own responses + user messages. An advisor with 200 tokens of history could lose everything because other advisors were verbose.

2. **The fallback is a cliff.** You go from full history to zero advisor history in one step. There's no gradual degradation.

## Proposed Solution

Replace the binary gate with a build-then-trim approach:

### Algorithm

```
1. Build the full filtered history for this advisor:
   - All user messages
   - This advisor's own responses only

2. Build the last-turn reference block (other advisors' most recent responses)

3. Calculate total tokens:
   system prompt + history + reference block + current user message

4. While total exceeds contextLimit:
   a. First: drop the oldest user/assistant pair from history
   b. If all history is dropped and still over: truncate the reference block
   c. System prompt and current user message are never dropped
```

### What This Achieves

- **Accurate estimation**: Token count reflects what this specific advisor will actually receive, not the global conversation state
- **Graceful degradation**: Oldest turns drop first, preserving the most recent and relevant context
- **Per-advisor fairness**: A concise advisor keeps full history even when others are verbose
- **Protected elements**: System prompt and current message are always preserved; the reference block is trimmed only as a last resort

### Token Budget Priority (highest to lowest)

1. System prompt (never dropped)
2. Current user message (never dropped)
3. Most recent conversation turns (dropped last)
4. Last-turn reference block (trimmed before losing all history, dropped before losing current turn)
5. Oldest conversation turns (dropped first)

## Implementation

All changes in `src/hooks/useParallelAdvisors.js`, within `callSingleAdvisor()`.

### Step 1: Build full history (no change to existing filter/map logic)

The current filter that selects user messages + this advisor's responses stays the same.

### Step 2: Assemble and measure

```javascript
const systemTokens = estimateTokens(systemPromptText);
const currentMessageTokens = estimateTokens(userMessage);
const referenceBlockTokens = referenceBlock ? estimateTokens(referenceBlock) : 0;
const fixedTokens = systemTokens + currentMessageTokens + referenceBlockTokens;
const availableForHistory = contextLimit - fixedTokens;
```

### Step 3: Trim history from the front

```javascript
let historyTokens = historical.reduce((s, m) => s + estimateTokens(m.content), 0);

while (historyTokens > availableForHistory && historical.length > 0) {
  const removed = historical.shift();
  historyTokens -= estimateTokens(removed.content);

  // If we removed a user message, also remove the following assistant message (keep pairs)
  if (removed.role === 'user' && historical.length > 0 && historical[0].role === 'assistant') {
    const removedAssistant = historical.shift();
    historyTokens -= estimateTokens(removedAssistant.content);
  }
}
```

### Step 4: If still over, trim reference block

```javascript
if (historyTokens + referenceBlockTokens > availableForHistory && referenceBlock) {
  // Drop the reference block entirely rather than partially truncating
  referenceBlock = null;
}
```

## Scope

- Single file change: `src/hooks/useParallelAdvisors.js`
- No changes to message format, UI, or other hooks
- Backward compatible — behavior is identical when conversations are short enough to fit in context

## Risks

- **Token estimation is approximate** (`length / 4`). Could occasionally trim too much or too little. Acceptable since the current system uses the same estimation.
- **Dropping user/assistant pairs** could remove context that a later message references. Mitigated by always keeping the most recent turns.

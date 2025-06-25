# SPACE Terminal Tagging System
*Date: 2025-06-25*

## Overview

SPACE Terminal implements an intelligent tagging system that enables semantic retrieval of relevant messages from long conversation histories. The system uses GPT-4o-mini to extract meaningful tags from user messages, allowing for contextual message retrieval when conversations exceed the context window limits.

## Purpose

The tagging system solves a fundamental problem in long-form conversations:

**The Problem**: In extended conversations (200K+ tokens), the AI loses access to early relevant context when the conversation history is truncated. Without intelligent retrieval, users might get responses that ignore important earlier discussions.

**The Solution**: Semantic tags enable selective retrieval of relevant historical messages based on topic similarity, not just recency.

## Architecture

### Core Components

#### 1. Tag Generation (`TagAnalyzer.ts`)

**Location**: `/src/lib/tagAnalyzer.ts`

The `TagAnalyzer` class uses GPT-4o-mini to extract semantic tags from user messages:

```javascript
const TAGGING_PROMPT = `Extract short tags that would help a user search for this
message later. Focus on notable people, places, organizations, key topics, and
major actions. Ignore filler details or generic words. Return 5-10 tags as JSON
objects with "value" (lowercase) and "category". Categories: person, place,
organization, topic, activity, state, other.`;
```

**Tag Structure**:
```javascript
{
  "value": "competitive positioning",    // Lowercase semantic concept
  "category": "topic"                   // Classification category
}
```

**Categories**:
- `person` - Notable individuals ("steve jobs", "marcus aurelius")
- `place` - Locations ("silicon valley", "europe")
- `organization` - Companies, institutions ("apple", "stanford")
- `topic` - Subject matters ("pricing strategy", "market analysis")
- `activity` - Actions or processes ("hiring", "product launch")
- `state` - Conditions or situations ("crisis", "growth phase")
- `other` - Miscellaneous concepts

#### 2. Async Tag Processing

Tags are generated asynchronously and attached to messages after Claude responds:

```javascript
// Tag analysis runs in parallel with Claude API call
const tagAnalysisPromise = sharedTagAnalyzer.analyzeTags(processedInput);

// Tags are added to message after analysis completes
tagAnalysisPromise.then(tags => {
  setMessages(prev => prev.map(msg => 
    msg === newMessage ? { ...msg, tags } : msg
  ));
});
```

**Benefits of Async Processing**:
- No latency impact on Claude responses
- Tags persist for future retrieval
- Failure doesn't break conversation flow

#### 3. Context Retrieval (`memory.ts`)

**Location**: `/src/lib/memory.ts`

The `MemorySystem` class retrieves relevant messages using tag-based matching:

```javascript
retrieveRelevantContext(query: string, currentMessages: Message[]): Message[] {
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const relevantMessages = currentMessages.filter(msg => {
    if (!msg.tags || msg.type === 'system') return false;
    
    const matches = msg.tags.filter(tag =>
      queryWords.some(word => {
        const normalized = word.replace(/[.,?!]/g, '');
        return tag.value.toLowerCase() === normalized;
      })
    );
    
    return matches.length > 0;
  });
  
  return relevantMessages;
}
```

**Matching Logic**:
1. Split user query into individual words
2. Remove punctuation from query words
3. Find messages where any tag exactly matches any query word
4. Return all matching messages (no ranking/scoring)

## Integration with Context Management

### Context Strategy Selection

The tagging system integrates with SPACE's dual-context strategy:

**Under Token Limit** (`contextLimit: 150000`):
```javascript
// Include all conversation history with timestamps
const historical = messages
  .filter(m => m.type === 'user' || m.type === 'assistant')
  .map(m => ({ 
    role: m.type, 
    content: m.timestamp ? `[${timestamp}] ${m.content}` : m.content 
  }));
```

**Over Token Limit**:
```javascript
// Use tag-based retrieval + recent messages
const managed = buildConversationContext(userMessage, messages, memory);
```

### Context Formatting

When using tag-based retrieval, context is formatted as a structured summary:

```
=== PREVIOUS RELEVANT USER MESSAGES ===
[2023-12-01 10:30] What's our competitive positioning strategy?
[2023-12-03 15:45] How should we handle the Apple announcement?
=====================================
=== MOST RECENT CONVERSATION ===
> Tell me about the latest market changes
  I'm concerned about our response time
> [ADVISOR: Marcus] Consider the stoic approach...
=== CURRENT MESSAGE ===
> What did we decide about competitive positioning earlier?
```

## Authentication Modes

### Legacy Mode (Direct API Access)
- Requires OpenAI API key in secure storage
- Client-side GPT-4o-mini calls for tag generation
- Full tag analysis capabilities

### Auth Mode (Backend Proxy)
- Tag analysis handled by backend functions
- No client-side OpenAI dependency
- Consistent with rate limiting and usage tracking

## Usage Tracking

Tag generation is tracked for cost monitoring:

```javascript
const inputTokens = Math.ceil((TAGGING_PROMPT.length + content.length) / 4);
const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);
trackUsage('gpt', inputTokens, outputTokens);
```

**Typical Cost**:
- ~100-200 input tokens per message
- ~50-100 output tokens per response
- Very low cost impact (~$0.0001 per message)

## Performance Characteristics

### Tag Generation
- **Latency**: ~500-1000ms (async, doesn't block responses)
- **Accuracy**: GPT-4o-mini reliably extracts semantic concepts
- **Consistency**: Same content produces similar tags across runs

### Tag Retrieval
- **Speed**: Very fast exact string matching
- **Recall**: High for exact word matches, lower for semantic variants
- **Precision**: Generally good due to LLM tag quality

## Limitations and Edge Cases

### Current Limitations

1. **Exact Matching Only**
   - Query "competitive analysis" won't match tag "competitive positioning"
   - No semantic similarity or fuzzy matching

2. **No Relevance Ranking**
   - All matching messages returned equally
   - No scoring based on match quality or recency

3. **Single-Word Query Processing**
   - Multi-word concepts like "market analysis" split into "market" and "analysis"
   - May miss nuanced topic relationships

4. **Limited Category Usage**
   - Categories are extracted but not used in retrieval logic
   - Could enable more sophisticated filtering

### Edge Cases

- **Tag Generation Failure**: Message gets no tags, won't be retrievable
- **Query Mismatch**: User query words don't match any tag values
- **Overwhelming Results**: Popular tags might return too many messages

## Future Enhancement Opportunities

### Retrieval Improvements
1. **Fuzzy Matching**: Use semantic similarity for partial matches
2. **Relevance Scoring**: Rank results by match quality and recency
3. **Category Filtering**: Enable searches within specific categories
4. **Multi-Word Processing**: Better handling of compound concepts

### Tag Quality
1. **Adaptive Prompting**: Adjust tag extraction based on conversation domain
2. **User Feedback**: Learn from which retrieved messages are actually useful
3. **Tag Validation**: Ensure tag quality and consistency

### Performance Optimization
1. **Caching**: Cache frequent tag lookups
2. **Indexing**: Create inverted index for faster searching
3. **Batching**: Process multiple messages together

## Configuration

### Environment Variables
- `VITE_USE_AUTH`: Determines client-side vs backend tag processing

### User Settings
- No direct user controls for tagging system
- Inherits OpenAI API key from general settings

### System Constants
- **Model**: `gpt-4o-mini` (cost-optimized for tag extraction)
- **Temperature**: `0.7` (balanced creativity/consistency)
- **Tag Count**: 5-10 tags per message
- **Categories**: Fixed set of 7 categories

## Related Documentation

- `/docs/CONTEXT-MANAGEMENT.md` - Overall context strategy
- `/src/lib/tagAnalyzer.ts` - Tag generation implementation
- `/src/lib/memory.ts` - Tag-based retrieval logic
- `/src/utils/usageTracking.js` - Cost tracking integration

---

The tagging system represents a sophisticated approach to long-term conversation memory, enabling SPACE Terminal to maintain context across extended discussions while optimizing for both performance and cost.
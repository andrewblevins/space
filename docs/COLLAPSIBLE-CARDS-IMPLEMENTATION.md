# Collapsible Perspective Cards Implementation Plan

## Overview
Implement "Show more/less" functionality for perspective response cards to reduce cognitive overwhelm while preserving the parallel grid layout and multi-perspective scanning capability.

## Goals
1. Reduce initial text density by ~70% (show only 3 lines per card)
2. Give users control over which perspectives to read in depth
3. Maintain parallel grid layout and simultaneous visibility of all perspectives
4. Support streaming responses (cards start collapsed, can be expanded during streaming)
5. Improve scan → respond cycle speed

## Files to Modify

### 1. `src/components/terminal/AdvisorResponseCard.jsx`
**Primary changes - the core collapsible logic**

#### Add State Management
```jsx
import { memo, useState } from "react";

export const AdvisorResponseCard = memo(({ advisor, allAdvisors = [], onAssertionsClick, compact = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Rest of existing code...
```

#### Add Truncation Logic
```jsx
// After existing processResponseContent function, add:

const TRUNCATE_THRESHOLD = 250; // characters
const shouldShowToggle = advisor.response && advisor.response.length > TRUNCATE_THRESHOLD;

// Determine display content
const getDisplayContent = () => {
  if (!shouldShowToggle) {
    return advisor.response; // Short responses show in full
  }

  if (isExpanded) {
    return advisor.response; // Expanded state
  }

  // Collapsed state - truncate to ~3 lines
  // Find first 2-3 sentence boundaries within 250 chars
  const sentences = advisor.response.match(/[^.!?]+[.!?]+/g) || [];
  let preview = '';
  for (const sentence of sentences) {
    if ((preview + sentence).length > TRUNCATE_THRESHOLD) break;
    preview += sentence;
  }

  // Fallback to character limit if no sentence boundaries found
  return preview || advisor.response.slice(0, TRUNCATE_THRESHOLD) + '...';
};

const displayContent = getDisplayContent();
```

#### Update JSX Structure
```jsx
return (
  <div className={cardClasses}>
    {/* Existing header code - unchanged */}
    <div className={headerClasses}>
      <h3 className={titleClasses}>
        <span className={`w-2 h-2 rounded-full ${colorClass} mr-2`}></span>
        {advisor.name}
      </h3>
      <button
        onClick={handleAssertionsClick}
        className="flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        title="Add assertions for this response"
      >
        {/* Existing Assert button SVG */}
      </button>
    </div>

    {/* Response content - now collapsible */}
    <div className="text-gray-800 dark:text-gray-200">
      <StreamingMarkdownRenderer content={displayContent} />
    </div>

    {/* Show more/less button - NEW */}
    {shouldShowToggle && (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center transition-colors group"
        aria-label={isExpanded ? `Collapse response from ${advisor.name}` : `Expand response from ${advisor.name}`}
      >
        <span>{isExpanded ? 'Show less' : 'Show more'}</span>
        <svg
          className={`w-4 h-4 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )}
  </div>
);
```

### 2. `src/components/terminal/ParallelAdvisorGrid.jsx`
**Minor change - fix grid height issue**

#### Update Grid Container
```jsx
// Line 48 - Add items-start class
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
```

**Why:** The `items-start` class prevents cards from stretching to match the tallest card in their row. Each card controls its own height independently.

### 3. Optional Enhancement: `src/hooks/useParallelAdvisors.js`
**Consider default expand state for streaming**

If you want cards to auto-collapse during streaming but allow manual expansion:

```jsx
// In the streaming message construction, add metadata:
advisorResponses: {
  [advisorId]: {
    name: advisor.name,
    content: '',
    completed: false,
    thinking: '',
    error: null,
    autoCollapsed: true  // NEW: Signal that this started collapsed
  }
}
```

Then in AdvisorResponseCard, check this flag to determine initial state:
```jsx
const [isExpanded, setIsExpanded] = useState(!advisor.autoCollapsed);
```

## Implementation Steps

### Step 1: Update ParallelAdvisorGrid.jsx
1. Add `items-start` to grid container class (line 48)
2. Test: Verify cards no longer stretch when siblings expand
3. Commit: "Fix grid row height stretching for independent card heights"

### Step 2: Update AdvisorResponseCard.jsx
1. Import `useState` from React
2. Add `isExpanded` state variable
3. Add truncation logic functions:
   - `shouldShowToggle` - determine if response is long enough
   - `getDisplayContent()` - return truncated or full content
4. Update JSX to use `displayContent` instead of `advisor.response`
5. Add Show more/less button with conditional rendering
6. Test manually with various response lengths:
   - Short (< 250 chars): No button, shows full content
   - Medium (250-500 chars): Button appears, truncates to ~3 lines
   - Long (> 500 chars): Button appears, truncates to ~3 lines
7. Test expand/collapse interaction
8. Test keyboard accessibility (Tab to button, Enter/Space to toggle)
9. Commit: "Implement collapsible perspective cards with Show more/less"

### Step 3: Edge Case Testing
1. **Streaming responses**: Verify cards start collapsed during streaming
2. **Markdown formatting**: Ensure truncation doesn't break markdown syntax
3. **Multiple expansions**: Expand 3-4 cards simultaneously, verify grid layout holds
4. **Mobile responsive**: Test on small screens (single column)
5. **Dark mode**: Verify button styling works in both themes
6. **Rapid toggle**: Click Show more/less quickly, verify no UI glitches

### Step 4: Polish & Refinements
1. Consider adding subtle fade gradient at truncation point (optional):
   ```jsx
   <div className="relative">
     <StreamingMarkdownRenderer content={displayContent} />
     {!isExpanded && shouldShowToggle && (
       <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
     )}
   </div>
   ```
2. Consider persisting expand state in message metadata (so refreshing page maintains expanded cards)
3. Consider adding "Expand all" / "Collapse all" button in ParallelAdvisorGrid header

## Testing Checklist

- [ ] Short responses (< 250 chars) show in full with no button
- [ ] Medium responses (250-500 chars) truncate with Show more button
- [ ] Long responses (> 500 chars) truncate with Show more button
- [ ] Click Show more expands card smoothly
- [ ] Click Show less collapses card smoothly
- [ ] Chevron icon rotates on expand/collapse
- [ ] Grid layout maintains independent card heights
- [ ] Cards align to top of grid row (items-start working)
- [ ] Expanding one card doesn't affect height of siblings
- [ ] Works during streaming (can expand mid-stream)
- [ ] Keyboard navigation works (Tab + Enter/Space)
- [ ] Screen reader announces expand/collapse state
- [ ] Dark mode button styling looks good
- [ ] Mobile single-column layout works
- [ ] Multiple cards can be expanded simultaneously
- [ ] Markdown formatting preserved in truncated view

## Expected User Impact

### Before (Current State)
- All perspectives show full responses (~400-800 words each)
- 6 perspectives = 2400-4800 words on screen
- Users feel overwhelmed by text density
- Scan time: ~30-60 seconds before responding
- Playtest feedback: "too much text"

### After (Collapsible State)
- All perspectives show ~3 lines (~50-80 words preview)
- 6 perspectives = 300-480 words on screen initially
- Users see all perspectives at a glance
- Can selectively expand 2-3 interesting perspectives
- Scan time: ~10-15 seconds before responding
- User controls depth of engagement

### Key Metric
**Cognitive load reduction: ~70%** while maintaining information accessibility

## Rollback Plan

If collapsible cards don't work well in practice:

1. The change is isolated to AdvisorResponseCard.jsx
2. Remove the `isExpanded` state and Show more/less button
3. Revert to using `advisor.response` directly in StreamingMarkdownRenderer
4. Keep the `items-start` fix in ParallelAdvisorGrid.jsx (that's beneficial regardless)

## Future Enhancements (Not in this implementation)

1. **Smart truncation**: Use AI to identify natural break points (end of thought)
2. **Keyboard shortcuts**: Press '1-9' to expand/collapse specific card
3. **Expand all button**: In ParallelAdvisorGrid header
4. **Persist state**: Save expanded/collapsed state in localStorage per session
5. **Animation**: Smooth height transition with CSS or Framer Motion
6. **Preview quality**: Show complete sentences only (never cut mid-sentence)

## Notes for Agent

- Keep existing functionality intact (Assert button, color dots, thinking blocks, streaming indicators)
- Don't change the grid layout structure (3 columns desktop, 2 tablet, 1 mobile)
- Don't add Framer Motion or heavy animation libraries - CSS transitions are sufficient
- Preserve accessibility (keyboard nav, ARIA labels, screen reader support)
- The truncation threshold of 250 characters is approximate - aim for 2-3 complete sentences
- Test with the actual SPACE Terminal dev server, not just the mockup
- Reference the mockup at `/Users/andrew/spaceterminal/space/collapsible-cards-mockup.html` for visual design

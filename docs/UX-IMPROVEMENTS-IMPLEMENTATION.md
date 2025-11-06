# UX Improvements Implementation Plan

Three targeted improvements from playtest feedback to enhance the journal onboarding and perspective management experience.

---

## 1. Loading State Cleanup

### Problem
**Playtest Feedback:** "When Generating… button is loading, the Generate Now button should go away."

During journal onboarding question flow, when the user clicks "Generate Perspectives Now" (to skip remaining questions), the button shows "Generating..." but remains visible alongside the "Generate Perspectives Now" button, creating visual confusion.

### Current Behavior
- User on Question 1 or 2
- Two buttons visible:
  - Left: "Generate Perspectives Now" (underlined, clickable)
  - Right: "Continue" button (changes to "Generating..." when loading)
- When user clicks "Generate Perspectives Now":
  - `isGenerating` becomes `true`
  - "Generate Perspectives Now" button gets `disabled={isGenerating}` but stays visible
  - Right button shows "Generating..."
  - Result: Two buttons, one says "Generating", one is just grayed out

### Affected Files
- `src/components/JournalOnboarding.jsx` (lines 142-172)

### Solution

Hide the "Generate Perspectives Now" button entirely when `isGenerating` is true:

```jsx
// Line 142-152: Update button visibility logic
<div className="flex items-center justify-between mt-4">
  {/* Only show "Generate Perspectives Now" if NOT on last question AND not generating */}
  {!isLastQuestion && !isGenerating && (
    <button
      onClick={handleGenerateNow}
      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline"
    >
      Generate Perspectives Now
    </button>
  )}
  {(isLastQuestion || isGenerating) && <div></div>}

  <div className="flex gap-3">
    {/* Rest of buttons... */}
  </div>
</div>
```

**Key Change:** Add `&& !isGenerating` to the button visibility condition (line 144).

### Testing
- [ ] Start journal onboarding, reach Question 1
- [ ] Click "Generate Perspectives Now"
- [ ] Verify button disappears immediately
- [ ] Verify "Generating..." appears on right button
- [ ] Verify spacer div maintains layout (no shift)

### Expected Impact
- **Before:** Confusing UI with disabled button + "Generating..." text
- **After:** Clean UI with only "Generating..." button visible

---

## 2. Move Loading Indicator to Content Area

### Problem
**Playtest Feedback:** "Put the loading indicator where the data is about to appear in Generate Perspective."

When generating perspectives, the loading state appears in the button ("Generating...") but users expect to see a loading indicator in the main content area where the perspective cards will appear.

### Current Behavior
Located in: `src/components/PerspectiveGenerator.jsx`

1. User clicks "Generate Perspectives" button (line 187-206)
2. Button text changes to "Generating..." (inside button)
3. Modal opens (`AdvisorSuggestionsModal`)
4. Modal shows perspectives when ready

**Problem:** No loading indicator in the modal itself while generating.

### Affected Files
- `src/components/PerspectiveGenerator.jsx` (button component)
- `src/components/AdvisorSuggestionsModal.jsx` (modal display)

### Solution

#### Part A: Pass Loading State to Modal

In `PerspectiveGenerator.jsx`:
```jsx
// Line 209-220: Pass isGenerating to modal
<AdvisorSuggestionsModal
  isOpen={isModalOpen}
  suggestions={generatedPerspectives}
  existingAdvisors={existingAdvisors}
  onAddSelected={handleAddSelected}
  onEditAdvisor={onEditAdvisor}
  onSkip={handleSkip}
  isGenerating={isGenerating}  // NEW PROP
/>
```

#### Part B: Update Modal to Show Loading Indicator

In `AdvisorSuggestionsModal.jsx`:
```jsx
// Add isGenerating to props destructuring
export default function AdvisorSuggestionsModal({
  isOpen,
  suggestions,
  existingAdvisors,
  onAddSelected,
  onEditAdvisor,
  onSkip,
  isGenerating = false  // NEW
}) {

  // Inside modal content, before suggestions list:
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-green-400 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-green-400 text-xl font-semibold mb-4">
          {isGenerating ? 'Generating Perspectives...' : 'Suggested Perspectives'}
        </h2>

        {/* Loading indicator - NEW */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mb-4"></div>
            <p className="text-gray-400 text-sm">Analyzing conversation and generating perspectives...</p>
          </div>
        )}

        {/* Suggestions list - only show when not generating */}
        {!isGenerating && suggestions.length > 0 && (
          <div className="space-y-3">
            {/* Existing suggestion rendering code */}
          </div>
        )}

        {/* Buttons - update to disable during generation */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onSkip}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Cancel' : 'Skip'}
          </button>
          <button
            onClick={() => onAddSelected(selectedPerspectives)}
            disabled={selectedPerspectives.length === 0 || isGenerating}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Selected ({selectedPerspectives.length})
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Visual Design
```
┌──────────────────────────────────────┐
│  Generating Perspectives...          │
│                                      │
│         ⟳ (spinning icon)            │
│                                      │
│  Analyzing conversation and          │
│  generating perspectives...          │
│                                      │
│               [Cancel]               │
└──────────────────────────────────────┘
```

### Testing
- [ ] Click "Generate Perspectives" button
- [ ] Verify modal opens immediately
- [ ] Verify spinner appears in modal content area
- [ ] Verify "Generating Perspectives..." title
- [ ] Verify loading message is clear
- [ ] Wait for generation to complete
- [ ] Verify spinner disappears
- [ ] Verify perspectives appear in same location
- [ ] Verify smooth transition from loading → content

### Expected Impact
- **Before:** User waits with no feedback (blank modal or unclear state)
- **After:** Clear visual feedback in the exact location where content will appear

---

## 3. Immediate Perspective Feedback

### Problem
**Playtest Feedback (Pav):** "I added a perspective, and expected it to immediately say something."

When a user manually adds a perspective via the "+" button, there's no immediate visual feedback that the perspective will participate in the conversation. Users expect to see the new perspective respond right away.

### Current Behavior

Located in: `src/components/Terminal.jsx` (lines 4161-4183)

```jsx
const handleAddGeneratedPerspective = async (perspective) => {
  // ... create newPerspective object

  // Add to advisors list
  setAdvisors(prev => [...prev, newPerspective]);

  // Trigger immediate response if there are messages
  const lastUserMessage = messages.filter(m => m.type === 'user').slice(-1)[0];
  if (lastUserMessage) {
    await callParallelAdvisors([newPerspective], lastUserMessage.content);
  }
};
```

**Issue:** The code DOES call `callParallelAdvisors` to get an immediate response, BUT there's no visual feedback during the ~2-3 seconds it takes to generate. User just sees the perspective appear in the sidebar.

### Affected Files
- `src/components/Terminal.jsx` (handleAddGeneratedPerspective function)
- Messages array (need to show placeholder/loading card)

### Solution

Add a placeholder card to the message stream immediately when perspective is added, then update it when the response arrives.

#### Part A: Create Placeholder Message

```jsx
const handleAddGeneratedPerspective = async (perspective) => {
  // ... existing color assignment code

  const newPerspective = {
    name: perspective.name,
    description: perspective.rationale,
    color: newColor,
    active: true,
    systemPrompt: `You are ${perspective.name}. ${perspective.rationale} Provide your perspective based on this viewpoint.`
  };

  // Add to advisors list
  setAdvisors(prev => [...prev, newPerspective]);

  // Trigger immediate response if there are messages
  const lastUserMessage = messages.filter(m => m.type === 'user').slice(-1)[0];
  if (lastUserMessage) {
    // NEW: Add placeholder card immediately
    const placeholderMessageId = `placeholder-${Date.now()}`;
    setMessages(prev => [...prev, {
      type: 'parallel_advisor_response',
      timestamp: new Date().toISOString(),
      id: placeholderMessageId,
      allCompleted: false,
      advisorResponses: {
        [newPerspective.name]: {
          name: newPerspective.name,
          content: '', // Empty initially
          completed: false,
          thinking: '',
          error: null,
          isNewPerspective: true // Flag to show special loading state
        }
      }
    }]);

    // Call parallel advisors (will stream response)
    await callParallelAdvisors([newPerspective], lastUserMessage.content);
  } else {
    // NEW: No messages yet, show a system message
    setMessages(prev => [...prev, {
      type: 'system',
      content: `Added perspective: **${newPerspective.name}**. They'll respond to your next message.`
    }]);
  }
};
```

#### Part B: Update AdvisorResponseCard to Show Loading State

In `src/components/terminal/AdvisorResponseCard.jsx`:

```jsx
export const AdvisorResponseCard = memo(({ advisor, allAdvisors = [], onAssertionsClick, compact = false }) => {
  // ... existing code

  // NEW: Check if this is a newly added perspective with no content yet
  const isLoadingNewPerspective = advisor.isNewPerspective && !advisor.response;

  return (
    <div className={cardClasses}>
      {/* Header - existing code */}
      <div className={headerClasses}>
        <h3 className={titleClasses}>
          <span className={`w-2 h-2 rounded-full ${colorClass} mr-2 ${isLoadingNewPerspective ? 'animate-pulse' : ''}`}></span>
          {advisor.name}
        </h3>
        {/* ... Assert button */}
      </div>

      {/* Content - show loading state for new perspectives */}
      <div className="text-gray-800 dark:text-gray-200">
        {isLoadingNewPerspective ? (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 italic">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
            <span>Generating response...</span>
          </div>
        ) : (
          <StreamingMarkdownRenderer content={advisor.response} />
        )}
      </div>
    </div>
  );
});
```

### Visual Design

**Immediately after adding perspective:**
```
┌─────────────────────────────────────┐
│ ● Carl Jung                    Assert│
│                                      │
│ ⟳ Generating response...             │
│                                      │
└─────────────────────────────────────┘
```

**After response arrives (2-3 seconds):**
```
┌─────────────────────────────────────┐
│ ● Carl Jung                    Assert│
│                                      │
│ This struggle you describe—the pull  │
│ between safety and risk—is the...    │
│                                      │
│              [Show more ↓]           │
└─────────────────────────────────────┘
```

### Alternative: Toast Notification

If the placeholder card approach is too complex, a simpler alternative is a toast notification:

```jsx
// In handleAddGeneratedPerspective, after adding to advisors:
setMessages(prev => [...prev, {
  type: 'system',
  content: `✓ **${newPerspective.name}** added. Generating response to last message...`,
  timestamp: new Date().toISOString()
}]);
```

This is simpler but less visually connected to where the response will appear.

### Testing
- [ ] Add a perspective manually via "+" button
- [ ] Verify empty card appears immediately with loading spinner
- [ ] Verify perspective name and color dot are visible
- [ ] Verify "Generating response..." text appears
- [ ] Wait for response to stream in
- [ ] Verify loading state disappears
- [ ] Verify response content appears in same card
- [ ] Test with no prior messages (should show system message)
- [ ] Test with existing conversation (should show placeholder card)

### Expected Impact
- **Before:** User adds perspective, waits 2-3 seconds with no feedback, response suddenly appears
- **After:** User adds perspective, immediately sees placeholder card with loading state, smooth transition to response

---

## 4. Hide/Show Perspective UI

### Problem
**Playtest Feedback (Pav):** "How do I remove a perspective? Want a distinct UI to make it clear it's being hidden and not deleted. Like an X or a minus on the card."

Currently, perspectives can only be permanently deleted (trash icon). Users want to temporarily hide/show perspectives without deleting them.

### Current Behavior

Located in: `src/components/terminal/GroupableModule.jsx` (lines 112-126)

Perspectives in sidebar have two actions:
1. **Edit** (pencil icon) - Opens edit form
2. **Delete** (trash icon) - Permanently deletes with confirmation

Clicking the perspective name toggles `active: true/false`, which controls whether they respond to messages. BUT there's no visual distinction between active and inactive perspectives.

### Affected Files
- `src/components/terminal/GroupableModule.jsx` (sidebar perspective list)
- `src/components/Terminal.jsx` (handleItemClick function for toggling active)

### Current Active/Inactive Logic

```jsx
// In GroupableModule.jsx line 139
className={`... ${activeItems.includes(item) ? 'text-green-700 dark:text-green-400' : ''}`}

// activeItems = advisors.filter(a => a.active)
// So active perspectives have green text, inactive have gray text
```

**Problem:** The visual difference is subtle (green vs gray text). Users don't understand that clicking the name hides/shows the perspective.

### Solution

Add a prominent eye icon to show/hide state, and make the interaction more obvious.

#### Part A: Update Visual Design in GroupableModule.jsx

```jsx
// Lines 134-179: Update perspective list items
{items
  .filter((item) => !groups.some((g) => g.advisors.includes(item.name)))
  .map((item, idx) => {
    const isActive = activeItems.includes(item);
    return (
      <li
        key={`item-${idx}`}
        className={`group flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          isActive
            ? 'text-gray-900 dark:text-gray-300'
            : 'text-gray-400 dark:text-gray-600 opacity-60'
        }`}
      >
        <div
          onClick={() => onItemClick && onItemClick(item)}
          className="flex items-center space-x-2 flex-1 cursor-pointer"
        >
          {item.color && (
            <span className={`w-3 h-3 rounded-full ${item.color} ${!isActive && 'opacity-40'}`}></span>
          )}
          <span className={isActive ? '' : 'line-through'}>{item.name}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* NEW: Eye icon to show/hide */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onItemClick && onItemClick(item);
            }}
            className={`p-1 transition-colors ${
              isActive
                ? 'hover:text-amber-500 dark:hover:text-amber-400'
                : 'hover:text-green-500 dark:hover:text-green-400'
            }`}
            title={isActive ? 'Hide perspective' : 'Show perspective'}
          >
            {isActive ? (
              // Eye open icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            ) : (
              // Eye closed icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>

          {/* Existing edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingAdvisor && setEditingAdvisor(item);
            }}
            className="p-1 hover:text-blue-500 dark:hover:text-blue-400"
            title="Edit perspective"
          >
            {/* Existing pencil icon */}
          </button>

          {/* Existing delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to permanently delete "${item.name}"? This cannot be undone.`)) {
                setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== item.name));
              }
            }}
            className="p-1 hover:text-red-500 dark:hover:text-red-400"
            title="Delete perspective (permanent)"
          >
            {/* Existing trash icon */}
          </button>
        </div>
      </li>
    );
  })
}
```

#### Part B: Update Delete Confirmation Message

Make it clear that delete is permanent, unlike hide:

```jsx
if (window.confirm(
  `Permanently delete "${item.name}"?\n\n` +
  `This cannot be undone. To temporarily remove them from conversations, use the hide button (eye icon) instead.`
))
```

### Visual Design

**Active perspective (hover):**
```
┌──────────────────────────────────────┐
│ ● Carl Jung          👁 ✏️ 🗑         │
│   (green text)      (eye) (edit) (del)│
└──────────────────────────────────────┘
```

**Inactive perspective (hover):**
```
┌──────────────────────────────────────┐
│ ○ Carl Jung          👁 ✏️ 🗑         │
│ (gray, strikethrough) (eye) (edit) (del)│
└──────────────────────────────────────┘
```

### Interaction Flow

1. **Hide perspective:**
   - User hovers over perspective in sidebar
   - Three icons appear: Eye (open), Edit, Delete
   - User clicks eye icon
   - Perspective text becomes gray and struck-through
   - Color dot becomes semi-transparent
   - Eye icon changes to "closed eye"
   - Perspective stops responding to new messages

2. **Show perspective:**
   - User hovers over hidden (gray) perspective
   - Three icons appear: Eye (closed), Edit, Delete
   - User clicks eye icon
   - Perspective text becomes normal color
   - Color dot becomes fully opaque
   - Eye icon changes to "open eye"
   - Perspective will respond to next message

3. **Delete perspective:**
   - User hovers over perspective
   - User clicks trash icon
   - Confirmation dialog appears with warning
   - User confirms
   - Perspective is permanently removed

### Testing
- [ ] Hover over active perspective
- [ ] Verify eye icon (open) appears
- [ ] Click eye icon
- [ ] Verify perspective becomes gray and struck-through
- [ ] Verify color dot fades to 40% opacity
- [ ] Verify eye icon changes to closed
- [ ] Send a message, verify hidden perspective doesn't respond
- [ ] Click eye icon again
- [ ] Verify perspective returns to normal appearance
- [ ] Send a message, verify perspective responds
- [ ] Test delete flow, verify confirmation mentions hide alternative
- [ ] Test with grouped perspectives (same behavior)

### Expected Impact
- **Before:** Users confused about how to "remove" perspectives without deleting them
- **After:** Clear visual distinction between active/hidden/deleted states with intuitive eye icon

---

## Implementation Order

1. **Loading State Cleanup** (Easiest, 10 min)
   - Single line change in JournalOnboarding.jsx
   - Low risk, high UX impact

2. **Hide/Show Perspective UI** (Medium, 30 min)
   - Update GroupableModule.jsx with eye icons
   - Visual design changes only
   - No new logic needed (active/inactive already works)

3. **Move Loading Indicator** (Medium, 45 min)
   - Update PerspectiveGenerator.jsx to pass state
   - Update AdvisorSuggestionsModal.jsx to show spinner
   - Requires modal component changes

4. **Immediate Perspective Feedback** (Hardest, 60 min)
   - Update handleAddGeneratedPerspective
   - Add placeholder message logic
   - Update AdvisorResponseCard with loading state
   - More complex state management

---

## Summary of Changes

| Component | Lines Changed | Complexity | Impact |
|-----------|--------------|------------|---------|
| JournalOnboarding.jsx | 1 | Low | High |
| GroupableModule.jsx | ~40 | Medium | High |
| PerspectiveGenerator.jsx | ~5 | Low | Medium |
| AdvisorSuggestionsModal.jsx | ~30 | Medium | High |
| Terminal.jsx | ~30 | High | High |
| AdvisorResponseCard.jsx | ~15 | Medium | Medium |

**Total estimated time:** 2-3 hours for all four improvements.

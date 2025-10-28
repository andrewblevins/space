# Proposal: Guided Journaling Onboarding with AI-Generated Advisor Suggestions

## Overview

Transform the empty-session experience from "blank page anxiety" into a productive journaling flow that automatically surfaces relevant advisors. This aligns with the "council of elders" frame while solving the onboarding problem identified in playtests.

## User Flow

### 1. Session Start State

**Trigger Conditions** (any of):
- New session with no messages
- No active advisors
- User explicitly clicks "Start New Session" or "Journal Entry" button

**UI State**:
```
┌─────────────────────────────────────────────────────────┐
│  SPACE Terminal                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   What's on your mind?                                  │
│                                                          │
│   [Large, welcoming textarea - 6-8 lines tall]          │
│                                                          │
│   Take a moment to write freely about what you're       │
│   thinking about, working on, or struggling with.       │
│   This is for you - be as messy or structured as        │
│   you like.                                             │
│                                                          │
│   [Generate Advisors]  [Skip - I'll add my own]        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Journal Entry

**UX Details**:
- **Minimum length**: ~100 words (or 500 characters) before "Generate Advisors" button activates
- **No maximum**: Let users write as much as they want
- **Auto-save**: Save to session context as a special "journal_entry" message type
- **Visual feedback**: Character counter or word count (subtle, in corner)
- **Tone**: Warm, inviting, low-pressure

**Example Prompts** (rotate randomly):
- "What's on your mind right now?"
- "What are you working through today?"
- "What question or situation brought you here?"
- "What's been occupying your thoughts lately?"

### 3. Advisor Generation

**When user clicks "Generate Advisors"**:

1. **Loading state**:
   - Show spinner/progress indicator
   - "Analyzing your entry and suggesting advisors..."
   - Disable textarea (but keep visible)

2. **API Call**:
   - Send journal entry to Claude Sonnet 4.5
   - Request 3-5 advisor suggestions
   - Generate name + full description for each
   - Include rationale for why each is relevant

**Generation Prompt Structure**:
```
The user has written this journal entry to begin exploring their thoughts:

[USER JOURNAL ENTRY]

Based on this entry, suggest 3-5 AI advisors who would provide valuable
perspectives. For each advisor:

1. Choose a name that represents a real or archetypal perspective
   (e.g., "Stoic Philosopher", "Systems Thinker", "Creative Disruptor",
   or specific figures like "Seneca" or "Ursula K. Le Guin")

2. Write a 2-3 sentence description in second-person that will instruct
   that advisor on their identity, expertise, and approach

3. Briefly explain (1 sentence) why this advisor is relevant to the
   user's entry

Look for:
- Tension points or contradictions that need multiple perspectives
- Domains of expertise mentioned or implied
- Emotional tone or challenges suggested
- Philosophical or practical frameworks that could help

Aim for diversity: different disciplines, approaches, and temperaments.

Return as JSON:
{
  "advisors": [
    {
      "name": "Advisor Name",
      "description": "You are... [second-person instructions]",
      "rationale": "Why this advisor is relevant to the entry"
    }
  ]
}
```

### 4. Advisor Selection Modal

**Modal Appearance**:

```
┌───────────────────────────────────────────────────────────┐
│  Suggested Advisors                                   [×] │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  Based on your entry, here are some advisors who might    │
│  offer valuable perspectives:                             │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🧠 Systems Thinker                            [+]  │  │
│  │                                                     │  │
│  │ You approach problems by mapping interconnections  │  │
│  │ and feedback loops. You help people see how...     │  │
│  │                                                     │  │
│  │ → Relevant because your entry discusses multiple   │  │
│  │   competing priorities and their dependencies      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 💭 Seneca                                     [+]  │  │
│  │                                                     │  │
│  │ You are a Roman Stoic philosopher who writes...    │  │
│  │                                                     │  │
│  │ → Relevant because you're struggling with what     │  │
│  │   you can and cannot control                       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  [...more advisors...]                                    │
│                                                            │
│  [Add Selected (2)]  [Regenerate]  [Start Without]       │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

**Modal Features**:

1. **Individual Selection**:
   - Click [+] button to add/remove advisor
   - Button changes to [✓] when selected
   - Visual indication of selected state (highlight, checkmark, color change)

2. **Batch Actions**:
   - "Add Selected (N)" button shows count
   - "Add All" shortcut button
   - "Regenerate" if user wants different suggestions
   - "Start Without" to proceed with no advisors (keeps journal entry)

3. **Advisor Cards**:
   - **Name** with auto-generated icon/emoji
   - **Description** (truncated to ~2 lines with "expand" option)
   - **Rationale** in lighter text (why it's relevant)
   - **Color dot** preview (use advisor color system)

4. **Smart Defaults**:
   - Pre-select 2-3 advisors automatically (top recommendations)
   - User can adjust selection before adding

### 5. Post-Selection Experience

**After user clicks "Add Selected"**:

1. **Modal closes**
2. **Advisors appear** in left panel (with auto-assigned colors)
3. **Journal entry remains** in conversation as first user message
4. **Input focused** and ready for follow-up question
5. **Gentle prompt**: "Your advisors are ready. What would you like to explore?"

**No Advisors Selected**:
- Journal entry still saved as context
- Regular input area appears
- Can add advisors manually later via + button

## Technical Implementation

### New Components

1. **`JournalPrompt.jsx`**
   - Large textarea with character counter
   - "Generate Advisors" / "Skip" buttons
   - Conditional rendering based on session state

2. **`AdvisorSuggestionsModal.jsx`**
   - Modal wrapper
   - Grid of suggested advisor cards
   - Selection state management
   - Batch action buttons

3. **`SuggestedAdvisorCard.jsx`**
   - Individual advisor display
   - Expandable description
   - Add/remove toggle
   - Rationale display

### API Integration

**New API Function**: `generateAdvisorSuggestions(journalEntry)`
- Similar to existing `generateAdvisorDescription`
- Returns array of advisor objects
- Uses Claude Sonnet 4.5
- Includes error handling and retry logic

### State Management

**New Terminal.jsx State**:
```javascript
const [showJournalPrompt, setShowJournalPrompt] = useState(false);
const [journalEntry, setJournalEntry] = useState('');
const [suggestedAdvisors, setSuggestedAdvisors] = useState([]);
const [showAdvisorSuggestions, setShowAdvisorSuggestions] = useState(false);
const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
```

**Trigger Logic**:
```javascript
useEffect(() => {
  // Show journal prompt when:
  // 1. New session with no messages
  // 2. No active advisors
  // 3. User hasn't dismissed it
  const shouldShow =
    messages.length === 0 &&
    advisors.filter(a => a.active).length === 0 &&
    !localStorage.getItem('journal_prompt_dismissed');

  setShowJournalPrompt(shouldShow);
}, [messages, advisors]);
```

### Data Flow

```
User writes entry
      ↓
Click "Generate Advisors"
      ↓
API call: generateAdvisorSuggestions(entry)
      ↓
Response: { advisors: [...] }
      ↓
Show AdvisorSuggestionsModal
      ↓
User selects advisors
      ↓
Click "Add Selected"
      ↓
Add advisors to state with active=true
      ↓
Save journal entry as first message
      ↓
Focus input, ready for conversation
```

## Advantages

### For Users
1. **Reduces blank page anxiety** - Clear starting action
2. **Contextual advisors** - Relevant to their actual concerns
3. **Saves time** - No manual advisor creation needed
4. **Educational** - Shows what kinds of advisors are possible
5. **Low commitment** - Can skip or regenerate
6. **Preserves journal entry** - Becomes conversation context

### For System
1. **Better onboarding** - Clear path from landing to conversation
2. **Demonstrates value** - AI helpfulness immediately visible
3. **Natural fit** - Aligns with "Morning Pages" mental model
4. **Flexible** - Works for any topic/domain
5. **Reusable** - Can trigger at any time, not just initial session

## Edge Cases & Considerations

### 1. Short Entries
**Problem**: User writes < 100 words
**Solution**:
- Keep "Generate Advisors" disabled with tooltip
- "Please write a bit more (at least 100 words) so we can suggest relevant advisors"
- Alternative: Allow generation but show warning

### 2. Vague Entries
**Problem**: "I don't know, just thinking about stuff"
**Solution**:
- API returns generic but useful advisors
- "Devil's Advocate", "Creative Brainstormer", "Practical Optimizer"
- Rationale: "For open-ended exploration"

### 3. Generation Failures
**Problem**: API error or timeout
**Solution**:
- Show error message with retry button
- Fallback: "Start Without Advisors" always available
- Can manually add advisors afterward

### 4. Return Users
**Problem**: Experienced users don't need this every time
**Solution**:
- Only show on truly new sessions
- Add "Don't show this again" option
- Store preference in localStorage
- Can re-enable in settings

### 5. Mobile Experience
**Problem**: Modal might be cramped on mobile
**Solution**:
- Full-screen modal on mobile
- Swipeable advisor cards
- Simplified layout
- Single-column card grid

## Future Enhancements

### Phase 2 Features

1. **Advisor Templates Library**
   - Pre-built advisor profiles by category
   - "Science & Technology", "Philosophy & Ethics", etc.
   - Mix suggestions with templates

2. **Learning from History**
   - Track which suggested advisors users actually use
   - Improve suggestion algorithm over time
   - Personalize suggestions based on past preferences

3. **Edit Before Adding**
   - Allow tweaking advisor descriptions before adding
   - "This is close, but I want to adjust..."
   - Edit modal inline

4. **Save Suggestion Sets**
   - "Save this advisor group for later"
   - Quick-load advisor configurations
   - Share advisor sets with others

5. **Iterative Refinement**
   - "These are too academic, suggest more practical advisors"
   - Regenerate with constraints
   - Chat-based suggestion refinement

## Open Questions

1. **Should the journal entry be visible in the conversation thread?**
   - Pro: Provides context for advisors' first responses
   - Con: Might feel redundant or exposing
   - Proposal: Make it a special, styled message type (distinct from normal user messages)

2. **How many advisors should we suggest?**
   - 3 might be too few (limited choice)
   - 7 might be overwhelming (decision fatigue)
   - Proposal: 4-5 as sweet spot, with "Generate More" option

3. **Should we auto-activate suggested advisors?**
   - Pro: Faster path to conversation
   - Con: Reduces user control
   - Proposal: Pre-select 2-3, but require explicit "Add Selected"

4. **What if the journal entry is very personal/sensitive?**
   - Privacy concern: Sending to API
   - Proposal: Add disclaimer: "Your entry will be analyzed to suggest advisors but won't be stored separately"
   - Alternative: Local-only mode where user manually selects

5. **Should this replace or augment the current "Add Advisor" flow?**
   - Proposal: Augment. This is for *starting* sessions, not managing advisors
   - Manual add is still available anytime via + button
   - This is about onboarding, not replacing existing UX

## Success Metrics

If this feature works well, we should see:

1. **Increased completion rate** - More users who land → write entry → start conversation
2. **Fewer empty sessions** - Fewer abandoned sessions with zero messages
3. **Higher advisor usage** - More users actually use multiple advisors
4. **Longer initial entries** - Users write more when prompted to journal
5. **Faster time-to-value** - Shorter time from landing to meaningful conversation

## Implementation Priority

### Must Have (MVP)
- [ ] Journal prompt component
- [ ] Advisor suggestion API integration
- [ ] Suggestion modal with selection
- [ ] Add selected advisors to panel
- [ ] Basic error handling

### Should Have (v1)
- [ ] Regenerate suggestions
- [ ] Expandable advisor descriptions
- [ ] Pre-selection of top recommendations
- [ ] Mobile-responsive modal
- [ ] Don't show again preference

### Nice to Have (v2)
- [ ] Edit descriptions before adding
- [ ] Advisor templates library
- [ ] Save advisor configurations
- [ ] Iterative refinement chat
- [ ] Usage analytics and personalization

---

**This proposal transforms the cold start problem into a warm, productive beginning that aligns perfectly with the "council of elders around a fire" metaphor. The user shares what's on their mind, and the council assembles itself to help.**

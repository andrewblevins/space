# SPACE Terminal - Advisor System Documentation

## Overview
The SPACE Terminal advisor system allows users to create AI personalities that provide specialized perspectives in conversations. This document describes the implementation details for developers working on advisor-related features.

## Core Components

### 1. Advisor Data Structure
```javascript
// Advisor object shape
{
  name: "Carl Jung",
  description: "Analytical psychologist...",
  color: "bg-blue-500",  // TailwindCSS color class
  active: true           // Whether advisor participates in conversations
}
```

### 2. Key Files

#### Terminal.jsx (Main Component)
- **State**: `advisors` state array stores all advisors
- **Storage**: Persisted to `localStorage.getItem('space_advisors')`
- **System Prompt**: Built by `getSystemPrompt()` function
- **Active Advisors**: Filtered by `advisors.filter(a => a.active)`

#### AdvisorResponseMessage.jsx
- **Purpose**: Renders advisor responses with color-coded names
- **Markers**: Detects `[ADVISOR: Name]` in responses
- **Colors**: Maps advisor names to their assigned colors
- **Location**: `src/components/terminal/AdvisorResponseMessage.jsx`

#### GroupableModule.jsx
- **Purpose**: Left sidebar module for managing advisors
- **Features**: Add/edit/delete advisors, toggle active state
- **Groups**: Support for advisor groups (e.g., "Psychologists")
- **Location**: `src/components/terminal/GroupableModule.jsx`

### 3. Message Flow

1. **User Input** → Terminal.jsx `handleSubmit()`
2. **Build System Prompt** → Includes active advisor descriptions
3. **Call Claude API** → via `useClaude` hook
4. **Stream Response** → Updates messages array
5. **Render Response** → `MemoizedMarkdownMessage` or `AdvisorResponseMessage`

### 4. System Prompt Construction

```javascript
// In Terminal.jsx getSystemPrompt()
const systemPrompt = `
${basePrompt}

## Advisors
${activeAdvisors.map(a => `- ${a.name}: ${a.description}`).join('\n')}

Format responses with [ADVISOR: Name] markers...
`;
```

### 5. Response Rendering Logic

```javascript
// In Terminal.jsx (lines ~3425-3440)
{msg.type === 'assistant' ? (
  // Process council debates if present
  // Then render with MemoizedMarkdownMessage
  <MemoizedMarkdownMessage 
    content={processedContent} 
    advisors={advisors} 
  />
) : (
  msg.content
)}
```

### 6. Advisor Colors System

- **File**: `src/lib/advisorColors.js`
- **Colors**: 23-color ROYGBIV palette
- **Assignment**: `getNextAvailableColor()` function
- **Classes**: TailwindCSS background color classes

### 7. Related Components

- **AdvisorForm.jsx**: Modal for creating new advisors
- **EditAdvisorForm.jsx**: Modal for editing existing advisors
- **ImportExportModal.jsx**: Import/export advisor configurations

## Message Types

1. **System Messages**: Terminal status, commands
2. **User Messages**: User input
3. **Assistant Messages**: Claude responses (may contain advisor markers)
4. **Debug Messages**: API call details (when debug mode enabled)

## Storage Patterns

- **Advisors**: `localStorage.setItem('space_advisors', JSON.stringify(advisors))`
- **Sessions**: `localStorage.setItem('space_session_${id}', JSON.stringify(session))`
- **Settings**: Individual localStorage keys for each setting

## API Integration

The advisor system integrates with Claude via the `useClaude` hook:
- Builds conversation context including advisor descriptions
- Streams responses with advisor perspectives
- Handles Extended Thinking mode (disabled for High Council debates)

## Upcoming Features (Eval Loop)

### Planned Architecture
- **Assertions Storage**: `space_assertions_<messageId>`
- **Evaluation Results**: Binary pass/fail with Flashlight (GPT-4o-mini)
- **Optimization Loop**: Iterative prompt improvement
- **UI Integration**: Buttons on advisor responses, new accordion menu item

### Key Considerations
- Store full conversation context at assertion time
- Track evaluation history
- Limit optimization iterations
- Support both advisor and system prompt optimization
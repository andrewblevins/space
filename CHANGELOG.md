# Changelog

All notable changes to SPACE Terminal will be documented in this file.

## [Unreleased]

### Added
- **Journal Context Questions**: 3-question onboarding flow before perspective generation to gather rich context
  - Questions generated one-at-a-time by GPT-4o-mini
  - Full navigation (back/forward) between questions with persistent answers
  - Enter key to proceed through flow
  - Questions and answers interleaved in final context
- **User Message Styling**: Updated chat UI for better readability
  - User messages now display in white/black text (instead of green)
  - Subtle left border accent to distinguish user from AI messages
  - Increased font size (text-lg) across all messages
- **Parallel Card Grid Layout**: Perspective responses now display side-by-side in responsive grid (1/2/3 columns)
- **Custom Perspective Creation**: Users can create custom perspectives directly in Generate Perspectives modal
- **Perspective Generation Improvements**:
  - Removed "Archetype" suffix from generated perspective names
  - Better diversity in suggestion mix
- **Context Concatenation**: Questions now included in final context string for better perspective understanding

### Changed
- **Removed Early Conversation Protocol**: Perspectives now engage fully from turn 1 (no more 3-turn information gathering restriction)
- **Simplified System Prompts**: Unified prompt structure for all conversation turns
- **Immediate Input Clearing**: Chat input now clears instantly when you hit Enter (better UX)
- Removed timestamps from perspective response cards
- Consolidated duplicate advisor creation logic

### Fixed
- **AI perspectives not showing on session load**: Fixed bug where perspective response cards were blank when loading saved conversations from database (advisor_json messages weren't having parsedAdvisors restored)
- **Duplicate message submissions**: Fixed race condition causing messages to be saved multiple times to database
  - Added synchronous ref guard (isSubmittingRef) to prevent rapid double-clicks from submitting twice
  - Added synchronous ref guard (savingMessageIdRef) to prevent auto-save effect from saving same message multiple times during async operation
- **Excessive re-renders**: Fixed useEffect with missing dependency array that was triggering on every render
- Mobile layout error with deprecated processCouncilDebates function
- URL construction error in useConversationStorage for relative paths
- TagAnalyzer backend API error handling for malformed responses
- Journal text incorrectly appearing in chat instead of input field
- Timestamps appearing in perspective outputs
- Contradictory prompt instructions causing perspectives to ignore brevity constraints

### Deprecated
- High Council debate mode (replaced by parallel advisor streaming)

## [0.2.6] - 2024-12

### Added
- Parallel advisor streaming with real-time responses from multiple perspectives
- Improved context management system
- Enhanced message rendering with memoization
- Better error handling across API calls

### Changed
- Refactored advisor response system for better performance
- Updated UI components for consistency
- Improved mobile responsive design

### Fixed
- Various bug fixes and performance improvements
- Memory leaks in streaming components
- State management issues in parallel responses

## [0.2.3] - [0.2.5]
- Various incremental improvements
- Bug fixes and stability enhancements
- UI/UX polish

## [0.2.2] - 2024-11
- Memory system improvements
- Tagging system enhancements
- Performance optimizations

## Earlier Versions
See individual CHANGELOG files in docs/ for version history prior to 0.2.6.

# SPACE Terminal v0.2.4 Changelog

## Major Features

### Advisor Evaluation System
- **Assert buttons** on advisor response cards for creating test assertions
- **Assertions modal** with natural language assertion creation
- **Evaluations modal** with automated scoring against assertions
- **Optimization loop** (MVP) for iterative prompt improvement using Gemini + Claude + evaluation cycle
- **Evaluation history** stored in localStorage with session context

### Streaming Improvements
- **Progressive advisor card rendering** during response streaming
- **Early JSON detection** switches to advisor format immediately
- **Real-time paragraph formatting** with proper `\n\n` → paragraph break conversion
- **Streaming indicators** show preparation and streaming status
- **Custom StreamingMarkdownRenderer** for better real-time formatting

## Technical Enhancements

### Backend Integration
- **Evaluation API endpoints** for automated scoring
- **Session loading fixes** restore advisor response formatting and Assert buttons
- **Progressive JSON parsing** extracts advisor data during streaming
- **Escape sequence handling** properly unescapes `\n`, `\t`, `\"`, `\\` in streaming content

### Bug Fixes
- **Infinite loop prevention** in conversation storage with message validation
- **Chrome error resolution** by reducing debug logging
- **Paragraph formatting** works correctly during streaming phase
- **Assert button availability** in loaded sessions

## UI/UX Improvements
- **Streaming visual feedback** with "⚡ Preparing advisor responses..." indicators
- **Progressive content updates** show real advisor content instead of static placeholders
- **Improved markdown rendering** for streaming responses
- **Better error handling** for incomplete streaming data

---

**Total Changes:** 4 major features • 8 technical enhancements • 6 bug fixes • 4 UI improvements

Version 0.2.4 focuses on evaluation capabilities and streaming experience improvements. 
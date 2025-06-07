# SPACE Terminal - TODO List

## Technical Debt & Refactoring

### Theme System Refactor (Priority: Medium)
**Issue**: Current light/dark theme implementation uses inline styles with `!important` to override CSS conflicts
**Problem**: 
- Scattered inline styles across components make maintenance difficult
- `!important` declarations indicate CSS specificity issues
- Inconsistent theming approach between Tailwind classes and inline styles

**Proposed Solution**: 
1. Implement CSS custom properties (CSS variables) for theme-aware styling
2. Create a centralized theme context that manages color tokens
3. Replace inline `!important` styles with systematic theme classes
4. Ensure proper CSS specificity hierarchy

**Files Affected**:
- `src/components/Terminal.jsx` - Message text colors
- `src/components/terminal/MemoizedMarkdownMessage.jsx` - Markdown text colors  
- `src/components/terminal/ExpandingInput.jsx` - Input text/background
- `src/components/terminal/CollapsibleModule.jsx` - Header text
- `src/components/terminal/GroupableModule.jsx` - Header text
- `src/components/terminal/CollapsibleSuggestionsModule.jsx` - Header text

**Acceptance Criteria**:
- Remove all `!important` declarations
- Consistent theming approach across all components
- Maintainable color token system
- No visual regressions in light/dark mode switching

---

*Last updated: January 2025*
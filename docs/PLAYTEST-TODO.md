# SPACE Terminal - Playtest Action Items

Status tracking for improvements identified during playtest session.

## ✅ Completed

### Critical Bugs (All Fixed)
- [x] **Later question turns broken** - Question navigation now works, Continue button appears properly
- [x] **Mobile/browser state sync** - Added storage event listeners and state hydration checks
- [x] **Export feature broken** - Fixed session data loading and validation

### UX Improvements (Completed)
- [x] **Loading state cleanup** - "Generate Now" button hides when loading, clean UI state
- [x] **Modal z-index issue** - AdvisorForm now appears above AdvisorSuggestionsModal (z-60)
- [x] **Perspective tone calibration** - System prompt revised to avoid "mean mode" default while maintaining distinctness

### Feature Improvements (Completed)
- [x] **Context question quality** - Progressive questions now surface richer context:
  - Q1: What's most pressing and their angle
  - Q2: How they currently understand the situation
  - Q3: What kind of input would help

## 🔄 In Progress

### High Priority UX
- [ ] **Move loading indicator** - Show spinner where perspectives will appear (in modal content area)
- [ ] **Immediate perspective feedback** - Show placeholder card when perspective added
- [ ] **Hide/show perspective UI** - Add eye icon (distinct from delete) for toggling perspectives
- [ ] **Remove "Added Perspective" messages** - System messages shouldn't show in chat

## 📋 Planned Features

### Medium Priority UX
- [ ] **Collapsible perspective responses** - "Show more" like Claude (reduces text overload)
  - Implementation doc: `docs/COLLAPSIBLE-CARDS-IMPLEMENTATION.md`
  - Mockup: `collapsible-cards-mockup.html`
- [ ] **@ mention system** - Address specific perspectives directly
- [ ] **Turn summaries** - Cheap summaries for context between turns

### Lower Priority Features
- [ ] **Card stack UI exploration** - Research stacking pattern for perspectives
  - Note: May not fit multi-perspective scanning UX, collapsible cards preferred
- [ ] **Tutorial/onboarding** - Show users adversarial communication norms
- [ ] **Poke.ai research** - Study their onboarding flow for inspiration
- [ ] **Perspective tone control** - Per-perspective "challenging" toggle

## 🔮 Future Explorations

### Shadow Work & Advanced Features
- [ ] **Shadow self features** - Explore ways to surface shadow in conversations
- [ ] **Better context questions** - Continue refining to help users identify problems
- [ ] **Improve question quality** - Questions should help users find problems worth exploring

## 📊 Playtest Feedback Themes

### What's Working
- **Multi-perspective dialogue** - People appreciate the range of viewpoints
- **Adversarial reflection** - The corrective process is "activating and energetic" (Parth)
- **Perspective suggestions improve over time** - Users notice the loop getting better

### Pain Points Addressed
- ✅ Too much text (solution: collapsible cards planned)
- ✅ Perspectives too challenging out of gate (solution: tone calibration done)
- ✅ Questions not surfacing problems (solution: question prompts improved)
- ✅ Modal stacking issues (solution: z-index fixed)

### Suggested Features
- "Show more" toggle (Claude-style)
- Card stack UI for perspectives
- Visual distinction for hide vs delete
- Tutorial for adversarial communication norms

## 📝 Implementation Docs

Detailed implementation plans available:
- **Critical Bugs**: Documented in conversation with full analysis
- **Collapsible Cards**: `docs/COLLAPSIBLE-CARDS-IMPLEMENTATION.md`
- **UX Improvements**: `docs/UX-IMPROVEMENTS-IMPLEMENTATION.md`

---

Last updated: 2025-01-06

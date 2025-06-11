# PR Integration Plan for SPACE Terminal

## Context & Current State

**Project**: SPACE Terminal - A terminal-style AI conversation interface  
**Current Branch**: `integration/tested-features-20250611`  
**Base Commit**: `2633ef6` - "Improve High Council debate formatting and fix system prompt conflicts"  
**Goal**: Integrate 5 tested PRs using cherry-pick approach

**IMPORTANT**: The original PR branches must remain intact for easy rollback. We're copying commits, not moving them.

## PRs to Integrate

### PR #18: Fix missing scrolling in modal dialogs
- **Branch**: `fix/modal-dialog-scrolling`
- **Purpose**: Adds `overflow-y-auto overflow-x-hidden` to modal dialogs
- **Key Files**: Multiple modal components
- **Complexity**: Low - CSS changes only

### PR #17: Refine tag analyzer prompt for relevance
- **Branch**: `improve/tag-analyzer-prompt`
- **Purpose**: Improves tag suggestions to be more relevant
- **Key Files**: `src/lib/tagAnalyzer.ts`
- **Complexity**: Low - Prompt text change only

### PR #15: Add reasoning mode toggle
- **Branch**: `feature/reasoning-mode`
- **Purpose**: Shows Claude's thinking process in collapsible blocks
- **Key Files**: `SettingsMenu.jsx`, `Terminal.jsx`, `useClaude.js`
- **Complexity**: Medium - New state management and UI

### PR #16: Add advisor voting feature
- **Branch**: `feature/advisor-voting`
- **Purpose**: Advisors can vote on user questions
- **Key Files**: New components `VotingModal.jsx`, `VotingSummary.jsx`, plus `Terminal.jsx`
- **Complexity**: High - New feature with multiple components

### PR #14: Add agent mode for advisor responses
- **Branch**: `feature/agent-mode`
- **Purpose**: Each advisor uses separate Claude API call
- **Key Files**: `SettingsMenu.jsx`, `Terminal.jsx`, `useClaude.js`
- **Complexity**: High - Changes API calling logic

## Step-by-Step Integration Plan

### Phase 0: Setup & Verification

```bash
# 1. Ensure on correct branch and clean state
git checkout integration/tested-features-20250611
git status  # Should show "nothing to commit, working tree clean"

# 2. Verify base commit
git log -1 --oneline  # Should show: 2633ef6 Improve High Council debate formatting...

# 3. Create backup branch (for safety)
git branch backup/integration-20250611-$(date +%Y%m%d-%H%M%S)

# 4. Fetch all PR branches (ensures we have latest)
git fetch origin
```

### Phase 1: Integrate PR #18 (Modal Scrolling)

```bash
# 1. List commits in PR
git log origin/fix/modal-dialog-scrolling --oneline -10

# 2. Cherry-pick the fix commit (find the actual hash)
git cherry-pick <commit-hash>

# 3. Verify build
npm run lint
npm run build
```

### Phase 2: Integrate PR #17 (Tag Analyzer)

```bash
# 1. List commits
git log origin/improve/tag-analyzer-prompt --oneline -10

# 2. Cherry-pick
git cherry-pick <commit-hash>

# 3. Verify the change was applied
cat src/lib/tagAnalyzer.ts | grep -A20 "system:"

# 4. Verify build
npm run lint
npm run build
```

### Phase 3: Integrate PR #15 (Reasoning Mode)

```bash
# 1. List commits
git log origin/feature/reasoning-mode --oneline -10

# 2. Cherry-pick commits (likely multiple)
git cherry-pick <commit-hash-1> <commit-hash-2>

# 3. Expected conflicts in SettingsMenu.jsx
# When resolving:
# - Keep BOTH reasoning mode AND existing debug mode toggles
# - They should be separate toggles in the General tab
# - Reasoning mode goes after Debug mode

# 4. Verify build
npm run lint
npm run build
```

### Phase 4: Integrate PR #16 (Voting Feature)

```bash
# 1. List commits
git log origin/feature/advisor-voting --oneline -10

# 2. Cherry-pick (may be multiple commits)
git cherry-pick <commit-hash-1> <commit-hash-2>

# 3. New files should be added:
# - src/components/VotingModal.jsx
# - src/components/VotingSummary.jsx
# - src/types/advisors.ts (Vote type added)

# 4. Verify build
npm run lint
npm run build
```

### Phase 5: Integrate PR #14 (Agent Mode)

```bash
# 1. List commits
git log origin/feature/agent-mode --oneline -10

# 2. Cherry-pick
git cherry-pick <commit-hash>

# 3. Expected conflicts:
# - SettingsMenu.jsx: Add agentMode props and toggle in Performance tab
# - Terminal.jsx: Combine agent mode with High Council logic
# - Keep BOTH features, they should work together

# 4. Resolution strategy for Terminal.jsx:
# - In callWithPrompt function, check agentMode first
# - If agentMode && !councilMode: separate API calls per advisor
# - If councilMode (with or without agentMode): use High Council format
# - If neither: use normal combined response

# 5. Verify build
npm run lint
npm run build
```

## Conflict Resolution Guidelines

### SettingsMenu.jsx Conflicts

```jsx
// The component should receive these props:
const SettingsMenu = ({
  isOpen,
  onClose,
  debugMode,
  setDebugMode,
  reasoningMode,      // From PR #15
  setReasoningMode,   // From PR #15
  contextLimit,
  setContextLimit,
  maxTokens,
  setMaxTokens,
  onClearApiKeys,
  theme,
  toggleTheme,
  paragraphSpacing,
  setParagraphSpacing,
  agentMode,          // From PR #14
  setAgentMode        // From PR #14
}) => {

// General tab should have:
// - Debug Mode toggle (existing)
// - Reasoning Mode toggle (PR #15)
// - Theme toggle (existing)
// - Paragraph Spacing (existing)

// Performance tab should have:
// - Context Limit (existing)
// - Max Response Tokens (existing)
// - Agent Mode toggle (PR #14)
```

### Terminal.jsx Conflicts

Key areas to watch:
1. **State declarations** - Add all new states
2. **Props passed to SettingsMenu** - Include all mode props
3. **callWithPrompt logic** - Combine agent and council modes properly
4. **System prompt building** - Ensure High Council overrides normal format

## Build Verification Only

After each PR integration, run:

```bash
npm run lint
npm run build
```

If either command fails:
- Fix any linting errors
- Resolve any TypeScript/build errors
- Do NOT proceed to next PR until build passes

## Rollback Procedures

### If a cherry-pick fails:
```bash
git cherry-pick --abort
# Debug the issue or skip that commit
```

### If integration goes wrong:
```bash
# Option 1: Reset to last good commit
git reset --hard <last-good-commit>

# Option 2: Restore from backup
git checkout backup/integration-20250611-<timestamp>
git branch -f integration/tested-features-20250611
git checkout integration/tested-features-20250611

# Option 3: Start completely fresh (original PRs remain intact)
git checkout main
git checkout -b integration/attempt-2
```

## Final Steps

```bash
# 1. Final build verification
npm run lint
npm run build

# 2. Push to remote
git push origin integration/tested-features-20250611

# 3. Original PR branches remain untouched for rollback
```

## Important Context for Next Claude Instance

1. **High Council Mode** is already in the base - it's the structured debate format with `/council` command
2. **System prompts** can conflict - High Council should override normal advisor format, not append
3. **Agent mode** means each advisor gets a separate API call - expensive but more distinct
4. **Reasoning mode** shows Claude's thinking in collapsible blocks - uses `<thinking>` tags
5. **The user has tested all these PRs individually** - they work in isolation
6. **DO NOT test features in browser** - only verify build/lint passes

## Commands Reference

```bash
# See what commits a PR contains
git log origin/<branch-name> --oneline -10

# Cherry-pick a single commit
git cherry-pick <commit-hash>

# Cherry-pick multiple commits
git cherry-pick <hash1> <hash2> <hash3>

# Continue after resolving conflicts
git add <resolved-files>
git cherry-pick --continue

# Abort if things go wrong
git cherry-pick --abort

# Verify changes were applied
git log --oneline -5
git diff HEAD~1
```

## Success Criteria

- All PRs integrated via cherry-pick
- `npm run lint` passes
- `npm run build` passes  
- Original PR branches remain intact
- Integration branch pushed to remote
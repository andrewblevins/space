# Migration audit — localStorage call sites

Produced by subagent audit of `/Users/andrew/spaceterminal/space`, 2026-04-09.

This is the map used by the port tasks (#5 advisors, #6 conversations). Every migrated line should be tagged `// VAULT:` for greppability.

## Summary

- **Total localStorage call sites: 79** across 11 files
- **Migrating (buckets A + B): 40 sites**
- **Staying (C/D/E/F): 39 sites** — settings, API keys, evaluations, usage, theme

By strategy (migrating sites only):
- `sync-read-from-cache`: 11 — MUST be prewarmed before Terminal.jsx mounts
- `async-fetch`: 8 — in useEffect or event handlers, safe to await
- `fire-and-forget-write`: 10 — update cache synchronously, queue network write
- `awaited-write`: 6 — caller needs to know the write landed
- `delete-this-line`: 5 — migrationHelper.js scaffolding becomes dead code

## Keys that move to the vault

- `space_advisors` → `~/space-vault/advisors/{slug}/advisor.md`
- `space_advisor_groups` → `~/space-vault/config.json`
- `space_session_*` → `~/space-vault/conversations/{id}/conversation.md`
- `space_current_conversation_id`, `space_current_session_id` → `~/space-vault/config.json`

## Keys that STAY in localStorage for MVP

- `theme`, `space_reasoning_mode`, `space_prompts`, `space_sidebar_collapsed`, `space_max_tokens`, `space_auto_scroll`, `space_paragraph_spacing`, `space_openrouter_model`, `space_skip_welcome`, `space_context_limit`
- API keys via `secureStorage.js` (`space_openrouter_key`, etc.)
- `space_assertions_*` (evaluations)
- `space_api_usage` (usage tracking)
- `space_migration_*` — will be deleted entirely (scaffolding)

## Hot spots (3+ clustered call sites)

1. **Terminal.jsx:596–635** — advisor init with color-assignment side effect. Advisors are read, any without `.color` get one assigned, then written back. This write-on-read pattern is inside a useState initializer. Port strategy: keep color assignment client-side, let the adapter's prewarm fetch advisors, then Terminal's init assigns colors to any missing and calls `setAdvisors(updated)` which fires a fire-and-forget write.
2. **Terminal.jsx:1432–1451** — `loadSessions()` utility, called from useEffect, scans all keys matching `space_session_*`. Replace with `vaultAdapter.getConversationIndex()`.
3. **Terminal.jsx:2643–2778** — auto-save mega-effect. Runs on every `messages` state change via dependency array line 2778. **Must debounce** (500ms–1s) when it becomes async, otherwise every keystroke triggers a network write.
4. **Terminal.jsx:1875–1897** — delete/reset handlers. Event context, straight async-fetch migration.
5. **SessionPanel.jsx:20–84** — session modal with cleanup-on-open logic. Move cleanup out; let the sidecar be authoritative.
6. **migrationHelper.js** entire file — delete.

## Sync-read risks (11 sites, must be prewarmed)

These are the ones that can't just `await fetch()`. They need `vaultAdapter.getCached(key)` which reads from a prewarmed in-memory cache.

| File:line | Key | Why sync |
|-----------|-----|----------|
| Terminal.jsx:67 | `space_current_conversation_id` | `loadPersistedCurrentSession()` called from useState init |
| Terminal.jsx:68 | `space_current_session_id` | Same |
| Terminal.jsx:153 | `space_session_*` enumeration | `getNextSessionId()` called from useState init |
| Terminal.jsx:597 | `space_advisors` | Direct useState init |
| Terminal.jsx:637 | `space_advisor_groups` | Direct useState init |
| Terminal.jsx:1436 | `space_session_*` enumeration | `loadSessions()` scans keys |
| Terminal.jsx:1439 | `space_session_*` | `loadSessions()` reads each |
| SessionPanel.jsx:24 | `space_session_*` enumeration | Sync utility in modal |
| SessionPanel.jsx:28 | `space_session_*` | Reads session data |
| SessionPanel.jsx:60 | keys | Modal-open effect |
| RecentChats.jsx:47 | `space_session_*` enumeration | Sync utility in component |

**Prewarm set:** `advisors`, `advisorGroups`, `conversationIndex`, `currentConversationId`. These get fetched in `prewarmVault()` called from `main.jsx` before `<App />` renders.

## Auditor's open questions (answered here)

1. **Async gaps in useState initializers** — We're solving this with the adapter's prewarmed cache, not by deferring useState. `getCached()` returns the already-fetched data synchronously.
2. **Key enumeration API** — Sidecar exposes `GET /vault/conversations` (index only). The adapter exposes `getConversationIndex()` synchronously post-prewarm.
3. **Session cleanup on modal open** — Delete the cleanup logic. The sidecar is authoritative; if it writes a conversation file, it's valid. Corrupt files can be inspected on disk by the user.
4. **Advisor color assignment** — **Client-side.** Keep the sidecar dumb. Terminal.jsx's init runs color-assignment after prewarm and calls `setAdvisors` to persist.
5. **Prompt library migration (line 648–670)** — Out of scope, stays in localStorage (bucket C).
6. **Evaluation data scope** — Out of scope (bucket E).
7. **saveLegacySession frequency** — **Debounce 1s.** Add to the port task for conversations (#6).
8. **Session ID format** — Post-port, IDs are kebab-case date-prefixed slugs (`2026-04-09-some-title`). The integer session ID code can be simplified or removed as part of the port.

## Files deleted entirely by the port

- `src/utils/migrationHelper.js` — all functions become dead code once the vault is authoritative.

## Surprising findings to note

- **Two session-load functions exist** (Terminal.jsx:1432 and SessionPanel.jsx:20). Both scan localStorage. During the port, unify via a single call to `vaultAdapter.getConversationIndex()`.
- **Auto-save runs on every message state change.** This is the #1 performance risk once writes are async. Debounce is non-negotiable.
- **Advisor color assignment is a silent mutation in a read path.** Preserve the behavior but move it to a post-prewarm effect in Terminal.jsx.

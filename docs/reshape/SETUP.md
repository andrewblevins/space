# SPACE — local markdown vault setup

This is the minimal "clone, install, run" path for SPACE Terminal in vault mode. The result: a local web app where every conversation and every advisor lives as a markdown file in a folder you can open in Obsidian, or grep, or version control.

This document is the Misha test. If you can hand it to a friend with reasonable command-line comfort and they get to a working SPACE in under five minutes, the MVP is doing its job.

## Prerequisites

- **Node.js 18 or later** (`node --version` to check)
- **npm** (comes with Node)
- An **OpenRouter API key** — get one at https://openrouter.ai/keys. SPACE uses your key directly; nothing is sent to a third-party SPACE server.

That's it. No database, no auth, no Docker, no Cloudflare account.

## Installation

```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
cd vault-sidecar && npm install && cd ..
```

The `vault-sidecar` is a tiny local HTTP server that reads and writes markdown files in your vault directory. It runs on `127.0.0.1:3001` and only accepts requests from `http://localhost:3000` (the SPACE frontend).

## Running

The default vault location is `~/space-vault/`. To use a different directory (e.g., a folder inside an existing Obsidian vault):

```bash
export SPACE_VAULT=~/ObsidianVault/SPACE
```

To allow SPACE's `@`-mention feature to read markdown files from additional directories (e.g., another Obsidian vault):

```bash
export SPACE_ALLOWED_PATHS=~/ObsidianVault:~/notes
```

Then start everything with one command:

```bash
npm run dev:vault
```

This launches both the vault sidecar and the Vite dev server. Open **http://localhost:3000** in your browser. You'll be prompted for your OpenRouter API key on first run; it's stored in your browser's localStorage and never leaves your machine.

If you don't want the vault — just the standalone web app with browser-only storage — `npm run dev` still works as before.

## What lives where

After running SPACE for a few minutes, your vault directory will look like this:

```
~/space-vault/
├── config.json                  # advisor groups, current conversation pointer
├── advisors/
│   ├── the-pragmatist/
│   │   └── advisor.md           # YAML frontmatter + description body
│   └── the-mystic/
│       └── advisor.md
└── conversations/
    ├── 1/
    │   └── conversation.md      # YAML frontmatter + ## User / ## Advisor sections
    └── 2/
        └── conversation.md
```

Every file is plain markdown. Open them in Obsidian, in a text editor, in Cursor, in `vim`. Edit them by hand and SPACE will pick up the changes the next time you reload.

## Using `@`-mention to pull in files

When typing a message in SPACE, type `@` followed by part of a filename. The autocomplete will show:

1. **Past sessions** (existing feature)
2. **Markdown files in your vault** (and any directory in `SPACE_ALLOWED_PATHS`) — new in vault mode

Select a file and its full content gets inlined into your next message as context. The advisors see it; your prompt stays uncluttered.

## Stopping

`Ctrl-C` in the terminal. Both processes shut down cleanly.

## Verifying it works

Quick smoke test you can run yourself:

```bash
# Sidecar should answer health check
curl http://localhost:3001/vault/health

# Vite should serve the React app
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/

# Both should return the right things
```

If the first command returns `{"ok":true,...}` and the second returns `200`, the stack is healthy.

## What's intentionally not in this MVP

- **No Tauri/Electron desktop wrapper.** The browser is the interface for now.
- **No Claude subscription auth.** You bring your own OpenRouter key. Riding on a Claude subscription is interesting but not in scope yet.
- **No live cross-tab sync.** If you have SPACE open in two tabs, they won't see each other's edits until you reload.
- **No migration of existing browser-localStorage sessions to the vault.** If you've used SPACE before in plain web-app mode and want to bring conversations forward, export them via the existing export menu (markdown format) and drop them in `~/space-vault/conversations/` by hand.
- **No "advisors with worldviews" yet.** Advisors are still `{name, description, color}`. The richer "advisors as believers" model is post-MVP — see `dempsey-worldviews.md` in this directory.

## Troubleshooting

**"vault not prewarmed" error in the browser console:**
You're running `npm run dev` instead of `npm run dev:vault`. The app falls back to localStorage transparently in this case, but the vault features aren't active.

**Sidecar won't start, "EADDRINUSE: address already in use 127.0.0.1:3001":**
Something else is already on port 3001. Either kill it (`lsof -iTCP:3001` to find the process) or set `SPACE_VAULT_PORT=3002` and update the proxy in `vite.config.js` to match.

**`@`-mention doesn't show vault files:**
Confirm the vault is active — open the browser console and look for `[vault] active`. If you see `[vault] inactive`, you're in legacy mode.

**Vault files exist on disk but don't show up in SPACE:**
Reload the page. The prewarm only runs once at app boot.

**Tests for the vault layer:**
```bash
# Sidecar tests (Node test runner)
cd vault-sidecar && npm test

# Frontend vault tests (Jest)
npm test -- src/vault/

# End-to-end smoke test (starts dev:vault, takes ~5s)
RUN_SMOKE=1 npm test -- src/vault/__tests__/dev-vault.smoke.test.js
```

## Where to file friction

If anything in this document trips you up, that's a bug in the document or the MVP. Open an issue at https://github.com/andrewblevins/space/issues with what you tried and what happened.

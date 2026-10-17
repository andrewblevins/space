# SPACE (desktop)

A standalone desktop app for talking with a panel of advisors. Every advisor and every conversation is a markdown file in a folder you own.

```bash
cd desktop
npm install
npm start          # build the UI and open the app
npm run dev        # hot-reloading UI while you work on it
npm test
```

All models go through OpenRouter, so one key reaches Claude, GPT, Gemini and the rest. The key is found in this order:

1. `OPENROUTER_API_KEY` in the environment
2. a key saved in Settings (stored in the app's data folder, encrypted with the macOS keychain, never in the vault)
3. when running from this repo (not a packaged build), `OPENROUTER_API_KEY` from the repo's root `.env`, the key the web app already uses

## The vault

Defaults to `~/space-vault` (change it in Settings or with `SPACE_VAULT=...`). A new vault is seeded with four example advisors.

```
space-vault/
  advisors/
    the-steward/
      advisor.md        # who they are: frontmatter + prompt
      portrait.png      # optional; replaces the marble monogram
      sources/          # optional .md/.txt texts appended to their prompt
  conversations/
    2026-10-15-should-i-take-the-teaching-job-x1y2/
      conversation.md
```

### advisor.md

```markdown
---
name: The Steward
epithet: Keeper of what was handed down   # shown under the bust
model: anthropic/claude-sonnet-5.5        # any OpenRouter model id; the panel picker offers Claude, GPT, Muse, DeepSeek
order: 1                                  # optional panel position
---

## Who you are
## What you hold to be true
## What you care about most, and what you would sacrifice for it
## Where your authority comes from
## How you make hard decisions
## What you distrust or push back on
## How you speak
```

The body is sent verbatim as the advisor's instructions. The headings above are the worldview structure (adapted from Fowler's Faith Development Interview; see `docs/reshape/dempsey-worldviews.md`), but nothing enforces them. Write whatever you want.

Edit files in any editor while the app is open; the panel updates live.

### conversation.md

Plain markdown with an invisible `<!-- space:... -->` marker before each turn, so it reads cleanly in Obsidian and parses back exactly.

## Code

- `main/vault.js` — reading and writing the vault (the only code that touches disk)
- `main/providers.js` — prompt assembly and streaming via OpenRouter
- `main/settings.js` — OpenRouter key and vault location
- `main/main.js` — Electron window, IPC, file watcher
- `src/` — React UI (`Panel` = the busts, `Conversation`, `Composer`, `Sidebar`, `Settings`)

Visual check without clicking around: `SPACE_CAPTURE=out.png npm start` writes a screenshot and quits.

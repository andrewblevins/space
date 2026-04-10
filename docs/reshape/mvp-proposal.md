# SPACE MVP proposal — markdown port

Status: proposal, not yet approved.
Date: 2026-04-09.
Companion docs: `desires.md`, `voice-memo-2026-04-09.md`.

## The one-line version

Replace SPACE's localStorage with a small local filesystem sidecar that reads and writes plain markdown files in a `~/space-vault/` directory. Keep the existing React app and UI untouched.

## Why this shape

Three constraints, stated in `desires.md`, determine almost everything:

1. **MVP = `npm run dev` + browser.** Not Tauri, not Electron. This rules out the native-desktop shell path entirely.
2. **Reuse the existing app to the greatest extent possible.** This rules out rewriting Terminal.jsx or the advisor data model. The job is persistence, not UI.
3. **Files must be legible markdown on disk, in folders the user can open in Finder or Obsidian.** This rules out SQLite, IndexedDB, or any "clever" storage.

The only real engineering question is: **how does a browser-based React app read and write files on the user's actual filesystem?** Browsers can't do this directly. So we need a small local process that can, and the React app talks to it over HTTP.

## Architecture

```
┌─────────────────────────────┐       ┌──────────────────────────┐
│  Vite dev server (port 3000)│◄─────►│  Browser (React app)     │
│  serves the React app       │       │                          │
└─────────────────────────────┘       │  - reads/writes advisors │
                                      │  - reads/writes convos   │
                                      │  - @-mentions files      │
                                      └──────────┬───────────────┘
                                                 │ fetch('/vault/...')
                                                 ▼
                                      ┌──────────────────────────┐
                                      │  Vault sidecar           │
                                      │  (Node/Express, port 3001)│
                                      │                          │
                                      │  - GET  /vault/advisors  │
                                      │  - PUT  /vault/advisors/:name │
                                      │  - GET  /vault/conversations │
                                      │  - PUT  /vault/conversations/:id │
                                      │  - GET  /vault/file?path=... │
                                      │  - GET  /vault/list?glob=... │
                                      └──────────┬───────────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────────────┐
                                      │  ~/space-vault/          │
                                      │    advisors/             │
                                      │      {name}/             │
                                      │        advisor.md        │
                                      │    conversations/        │
                                      │      {id}/               │
                                      │        conversation.md   │
                                      │    config.json           │
                                      └──────────────────────────┘
```

Vite's dev server proxies `/vault/*` to `http://localhost:3001` so the React app just calls `fetch('/vault/advisors')` and doesn't have to know the sidecar exists. Single `npm run dev` command starts both processes concurrently.

## On-disk layout

```
~/space-vault/                        # configurable via env var or settings
├── config.json                       # vault metadata, active conversation id
├── advisors/
│   ├── the-pragmatist/
│   │   ├── advisor.md                # frontmatter + description (the main file)
│   │   └── sources/                  # optional: drop-in reference texts
│   │       └── ...
│   └── the-mystic/
│       └── advisor.md
└── conversations/
    ├── 2026-04-09-reshape-thinking/
    │   └── conversation.md           # full conversation as one markdown file
    └── 2026-04-10-morning-pages/
        └── conversation.md
```

### `advisor.md` format

```markdown
---
name: The Pragmatist
color: bg-amber-600
created: 2026-04-09T18:00:00Z
---

A no-nonsense operator who cares about shipping, tradeoffs, and whether
something will actually work on Tuesday morning...
```

The frontmatter maps directly onto the current advisor object shape (`{ name, description, color }`), so Terminal.jsx's advisor state can be populated from these files with a trivial parse. No schema migration drama.

### `conversation.md` format

```markdown
---
id: 2026-04-09-reshape-thinking
title: SPACE reshape thinking
created: 2026-04-09T18:27:00Z
advisors: [the-pragmatist, the-mystic]
---

## User

What should I do about SPACE?

## The Pragmatist

...

## The Mystic

...

## User

...
```

This matches what `ExportMenu.jsx` + `formatSessionAsMarkdown` already produce (Terminal.jsx:2292–2338). **We already have the writer.** The MVP extends it to be the *primary* format instead of an export format, and adds a reader that turns the file back into the in-memory message array.

## What actually changes in the code

The recon (Explore agent) found ~20 distinct localStorage keys across ~15 files. Most of them fall into one of three buckets:

**Bucket 1: Advisors** — `space_advisors`, `space_advisor_groups`. Replace with `GET/PUT /vault/advisors`. Terminal.jsx:597, 631, 989, 2378–2380, 2386, 637, 1007.

**Bucket 2: Sessions/conversations** — `space_session_{id}`, `space_current_session_id`, `space_current_conversation_id`. Replace with `GET/PUT /vault/conversations`. Terminal.jsx:67–68, 84–89, 1438–1450, 1669, 1878, 1890, 1897, 1908, 2235, 2720, 2772, 2941, 3109, 3782, plus SessionPanel.jsx, RecentChats.jsx, terminalHelpers.js, migrationHelper.js.

**Bucket 3: Settings and API keys** — `space_max_tokens`, `space_openrouter_model`, `space_openrouter_key`, etc. **Leave these in localStorage for MVP.** They're per-browser user preferences and the API key doesn't benefit from being on disk. This is an intentional cut — moving them is trivial later and buys nothing now.

The mechanical work is: introduce a single `vaultClient.js` module with `loadAdvisors()`, `saveAdvisors()`, `loadConversation(id)`, `saveConversation(convo)`, `listConversations()`, `readMarkdownFile(absPath)`, `listMarkdownFiles(glob)`. Then replace the localStorage call sites in buckets 1 and 2 with calls into this client. The existing React state shapes don't change.

The `@`-mention feature for arbitrary markdown files uses `readMarkdownFile(absPath)` via `listMarkdownFiles(glob)`. The sidecar validates that the path is readable and returns the file contents. **Security note:** the sidecar should only accept requests from `localhost` and should probably restrict file reads to a configurable allowlist of directories (default: the vault itself + an optionally-configured Obsidian vault path). See "Risks" below.

## The sidecar: how small can it be?

Very small. A single `server.js` at the repo root:

- Express or even plain Node `http`.
- ~200 lines.
- Depends on `express`, `gray-matter` (frontmatter parsing), and `fast-glob`.
- Started via `concurrently` alongside Vite in `npm run dev`.

No database. No ORM. No auth. Localhost-only. The entire persistence layer is `fs.readFile` / `fs.writeFile` wrapped in HTTP.

## What Misha sees on first run

```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
npm run dev
# open http://localhost:3000
# paste OpenRouter key (this friction stays for MVP)
# start using it; files land in ~/space-vault/
```

Optional: `SPACE_VAULT=~/ObsidianVault/SPACE npm run dev` to point the vault at an existing Obsidian directory. This is the single move that delivers "integrated with your files" to any user with a markdown-based setup.

## What's explicitly cut

Copied from `desires.md` and re-stated so the cut is visible in the plan:

- No Tauri/Electron packaging.
- No Claude-subscription auth. BYOK OpenRouter stays.
- No worldview/belief-system advisor upgrade (that's `dempsey-worldviews.md` territory, post-MVP).
- No pricing, licensing, Stripe, onboarding polish.
- No new UI. No redesign. No marble busts (yet).
- No migration tool from existing localStorage sessions to the vault. If Andrew wants his current sessions in the vault, the existing export-to-markdown feature already produces the right format — he can export and drop them in `~/space-vault/conversations/` by hand.
- No cognitive-overload fix.
- No agent behaviors.

## Risks and things I'm uncertain about

1. **Filesystem access security.** A localhost HTTP server that reads arbitrary paths is a (mild) risk vector — any webpage the user visits could in theory `fetch('http://localhost:3001/vault/file?path=/etc/passwd')`. Mitigations: bind to `127.0.0.1` only, check `Origin` header against `localhost:3000`, restrict reads to an allowlist of directories. For MVP I'd do all three. Flagging this as the one place where "small and simple" meets a real concern.

2. **Concurrent writes.** If SPACE is open in two browser tabs, they'll race on conversation files. MVP solution: don't worry about it, single-tab assumption, document it. Real solution later: file locks or last-write-wins with timestamps.

3. **"Replace localStorage with HTTP calls" is not free.** localStorage is synchronous; `fetch` is not. A handful of places in Terminal.jsx read from localStorage during render (e.g., the initial state of `useState` hooks at lines 597, 643, 648, 696, 700, 719, 772, 779, 803). These need to become effect-based loads with a loading state, or the vault client needs to prefetch on mount and expose a cached sync read. **This is the single biggest source of "it'll take longer than you think" risk in this plan.** I want to flag it clearly rather than paper over it.

4. **The advisor-groups feature** (`space_advisor_groups`) is a cross-cutting bit of state that doesn't obviously map to per-advisor folders. Options: (a) store groups in `~/space-vault/config.json`, (b) add a `group:` field to advisor frontmatter. I'd pick (a) for MVP — one round-trip, no data duplication.

5. **I haven't actually read Terminal.jsx.** The recon agent did, and reported file:line references, but I'm relying on its summary. Before implementation I'd want to read the specific localStorage call sites myself to make sure the sync-vs-async issue (risk #3) isn't worse than it looks.

6. **`gray-matter` and `fast-glob` add two new dependencies.** Tiny, well-trusted, but it's a cut worth being intentional about. Alternatives: write a 20-line frontmatter parser, use `fs.readdir` recursively. I'd take the dependencies.

## Staged implementation (suggested order)

1. **Sidecar first, standalone.** Build `server.js`, get it reading and writing files in `~/space-vault/`. Test it with `curl`. No React yet. This is half a day of work and de-risks everything else.
2. **`vaultClient.js` in the React app.** A module that wraps `fetch` calls to the sidecar. Typed interfaces matching the current advisor/conversation shapes.
3. **Port advisors** (bucket 1). Smallest surface area, ~6 call sites. Ship it, check Terminal.jsx still loads.
4. **Port conversations** (bucket 2). Larger, ~15 call sites. This is where the sync-vs-async issue will bite if it's going to.
5. **Add `@`-mention for arbitrary markdown files.** This is the one *new* user-facing feature in the MVP. Everything before it is a port; this is the thing that makes the reshape *valuable* rather than just *different*.
6. **Concurrently script, docs, Misha-test.** Get it to the point where `git clone && npm install && npm run dev` is the entire setup flow. Send it to Misha.

Steps 1–4 are mechanical. Step 5 is the payoff. Step 6 is the forcing function.

## Open questions for Andrew

1. **Vault location.** Default `~/space-vault/`, or default to asking on first run, or default to a path inside the repo? My guess: `~/space-vault/` with an env var override.
2. **Existing conversations.** Do you care about bringing existing localStorage sessions forward, or is a clean slate fine? (I've assumed clean slate in this plan.)
3. **Obsidian integration concretely.** Is "point `SPACE_VAULT` at a folder inside your Obsidian vault" enough, or do you want tighter integration (e.g., respect Obsidian's `[[wikilinks]]` when reading markdown files)? MVP assumes the former.
4. **The `@`-mention scope.** Can it reach any file on disk (subject to the allowlist), or only files inside the vault? I've proposed "vault + optional extra allowlist paths" — confirm.
5. **Does this plan feel like it honors the voice memo, or did I miss something?**

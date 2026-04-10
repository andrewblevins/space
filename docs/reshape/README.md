# SPACE Reshape

Working notes, research, and the MVP itself for reshaping SPACE from a hosted web app into a locally-run tool that stores its files as markdown on disk.

## Files in this directory

**Source material**
- **`voice-memo-2026-04-09.md`** — Transcribed voice memo where Andrew thinks out loud about the reshape. Raw source material.

**Design**
- **`desires.md`** — Distilled statement of what Andrew wants from the reshape (heart's desire, kill-if, scope boundaries).
- **`decisions.md`** — Answers to the open questions (vault location, isolation strategy, what's in scope vs. cut).
- **`mvp-proposal.md`** — The MVP plan: what to build, what to cut, file layout on disk, engineering shape.
- **`migration-audit.md`** — Per-call-site map of the localStorage → vault migration. Used by the bucket A and bucket B port tasks.

**Setup and usage**
- **`SETUP.md`** — Minimal clone-install-run instructions. The "Misha test" forcing function.

**Future work (post-MVP)**
- **`dempsey-worldviews.md`** — Research notes on Brendan Graham Dempsey's worldview formalization work. Relevant to the "advisors as believers" pass that's gated behind the MVP kill-if check.

## What was actually built (status as of MVP completion)

Outside this directory:

- **`vault-sidecar/`** — local Node/Express HTTP server that reads/writes markdown files. 6 files, ~470 lines of server code + 230 lines of tests. Bound to `127.0.0.1` only, Origin-checked, path-traversal-safe. 17 tests passing.
- **`src/vault/`** — frontend bridge to the sidecar. `vaultClient.js` (transport), `vaultAdapter.js` (cached sync surface for React), `bootstrap.js` (dual-mode shim that lets the app run with or without the sidecar), `vaultMarkdown.js` (markdown round-trip helpers), `index.js` (public surface), and 6 test files. 44 tests passing.
- **`src/main.jsx`** — calls `bootstrapVault()` before mounting `<App />`. 1-line change.
- **`src/components/Terminal.jsx`** — bucket A (advisors) and bucket B (sessions/conversations) ported to call the bootstrap shim instead of `localStorage` directly. Every changed line tagged `// VAULT:` for greppability.
- **`src/components/SessionPanel.jsx`**, **`src/components/terminal/RecentChats.jsx`**, **`src/utils/terminalHelpers.js`** — same bucket-B port.
- **`src/components/terminal/SessionAutocomplete.jsx`** and **`src/components/terminal/ExpandingInput.jsx`** — `@`-mention extended to surface vault markdown files alongside past sessions.
- **`src/utils/migrationHelper.js`** — deleted (legacy migration scaffolding, dead code in vault world).
- **`package.json`** — new `dev:vault` script (`concurrently`-launched vite + sidecar).
- **`vite.config.js`** — added `/vault` proxy to `127.0.0.1:3001`.

## How to run it

See `SETUP.md`.

```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
cd vault-sidecar && npm install && cd ..
SPACE_VAULT=~/space-vault npm run dev:vault
# open http://localhost:3000
```

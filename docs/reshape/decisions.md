# MVP decisions (answered open questions)

Andrew delegated these to Claude's judgment on 2026-04-09 with the constraint: "as long as it's clearly sectioned off from the rest of the app." This doc records the answers so they're reviewable.

## 1. Vault location

**Decision:** Default to `~/space-vault/`. Override via `SPACE_VAULT` environment variable. Create on first run if it doesn't exist. If the env var points at a path that doesn't exist, create it; if it points at an existing non-directory, error loudly.

**Why:** Home-directory default is the most obvious place for a user's personal data. `~/space-vault/` is explicit enough that it won't be mistaken for something else and won't collide with anything standard. The env var override is the single lever a user like Misha or Andrew-with-Obsidian needs: `SPACE_VAULT=~/ObsidianVault/SPACE npm run dev` and the thing just works.

**Not chosen:**
- A path inside the repo (`./vault/`) — would get gitignored and disappear on `rm -rf`, feels like scratch.
- Asking on first run via a modal — adds UI work and another onboarding step. The env var is documentation-level config, not runtime config.

## 2. Existing localStorage sessions

**Decision:** Clean slate. No migration tool. Document how to export old sessions to markdown via the existing `ExportMenu` and drop them into `~/space-vault/conversations/` by hand if wanted.

**Why:** Migration is engineering cost against an audience of one (Andrew), and the existing export-to-markdown feature already produces the right format. Building a one-shot migration button is probably a half-day of work for a problem that can be solved in five minutes manually if it ever comes up. MVP is about the port, not data portability.

## 3. Obsidian integration depth

**Decision:** Point-`SPACE_VAULT`-at-an-Obsidian-folder is the only integration. No `[[wikilink]]` parsing, no Obsidian metadata awareness, no sync with Obsidian plugins. The vault reads and writes plain markdown with YAML frontmatter, which Obsidian handles natively.

**Why:** Obsidian happily renders anything that's a markdown file in a folder. Any deeper integration couples SPACE to Obsidian's conventions and breaks the "works for any markdown-based setup" promise in the voice memo. If Andrew later wants wikilinks to resolve inside SPACE conversations, that's a post-MVP enhancement with a clear cost.

## 4. `@`-mention scope

**Decision:** `@`-mention can reach any markdown file inside the vault, plus any additional directories listed in `SPACE_ALLOWED_PATHS` (colon-separated). Default: just the vault. The sidecar refuses reads outside the allowlist and refuses anything that resolves outside after following symlinks.

**Why:** The voice memo explicitly mentions pulling in "any markdown file" — including from an Obsidian vault that may not be the SPACE vault itself. But unrestricted filesystem reads from a localhost HTTP server is a mild security footgun (see `mvp-proposal.md` risk #1). An allowlist + symlink resolution gives the common case (Obsidian vault alongside SPACE vault) without opening the whole disk.

A user wanting SPACE to see their Obsidian vault would run:

```bash
SPACE_VAULT=~/space-vault SPACE_ALLOWED_PATHS=~/ObsidianVault npm run dev
```

## 5. Does the plan honor the voice memo?

**Yes, with one caveat I'm flagging.** The memo's core asks — run locally, markdown on disk, each advisor a folder, each conversation a folder, `@`-mention any markdown file, keep the existing interface — are all in the plan. The one thing the memo gestures at that the MVP does NOT deliver is the "fluidly updating GUI that incorporates new files as they're added." I read that as Andrew's own "nice to have, not MVP" note ("doesn't need to be there in the MVP version"). Post-MVP, a file-watcher sending SSE or websocket events to the frontend is a clean addition. Flagged but not built.

---

# Isolation strategy

Andrew's one constraint: "clearly sectioned off from the rest of the app." Here's how that's enforced.

## Code structure

All new MVP code lives under **three clearly-labeled locations** and nowhere else:

1. **`vault-sidecar/`** — new directory at repo root. Contains `server.js`, `package.json` for sidecar-only deps (`express`, `gray-matter`, `fast-glob`, `concurrently`... actually concurrently goes in root), and a README. This is the entire filesystem-access layer.

2. **`src/vault/`** — new directory under `src/`. Contains `vaultClient.js` (the React app's interface to the sidecar), `vaultTypes.ts` (shared types), and `vaultAdapter.js` (the shim layer that lets existing code keep calling localStorage-style APIs but routes through the vault — this is how we limit the blast radius on Terminal.jsx).

3. **`docs/reshape/`** — already exists, already contains all the design docs. Any new reshape documentation lands here.

## Edits to existing files — minimized and labeled

The existing app code gets touched in three places and only three places:

1. **`package.json`** — add `"dev:vault"` script that runs sidecar + vite concurrently. Does NOT modify the existing `dev` script. Users can still run `npm run dev` for the unported web-app experience.

2. **`vite.config.js`** — add a `/vault` proxy to `localhost:3001` inside the existing `server.proxy` block. Gated on the existing `command === 'serve'` check so it only applies in dev.

3. **`src/components/Terminal.jsx` (and the 14 other files with localStorage calls in buckets 1 and 2)** — localStorage call sites get replaced with `vaultAdapter` calls. **Every edited line gets a `// VAULT:` comment tag** so a grep tells you the full surface of the port. If Andrew wants to unwind the port, `git grep '// VAULT:'` is the roadmap.

## Runtime isolation

- The sidecar is **only started by `npm run dev:vault`**. Running `npm run dev` still works and behaves exactly as before (except that any Terminal.jsx code paths hitting `vaultAdapter` will get a clear error message telling the user to run `npm run dev:vault` instead). This means the MVP doesn't break any existing development workflow.

- The sidecar **binds to `127.0.0.1` only**, checks the `Origin` header against `localhost:3000`, and rejects anything else. No network exposure.

- The sidecar **only touches the vault directory and the `SPACE_ALLOWED_PATHS` allowlist**. Path resolution happens via `fs.realpath` to defeat symlink escapes.

## Test isolation

- Sidecar gets its own unit tests under `vault-sidecar/test/` using whatever is simplest (node's built-in `node:test` is fine — no need to pull in jest for the sidecar).
- `vaultClient` gets tests under `src/vault/__tests__/` using the existing jest setup.
- No existing tests should change. If an existing test breaks, that's a signal the port touched something it shouldn't have.

## Uninstall/rollback

If the MVP direction doesn't work out, removing it is:

```bash
rm -rf vault-sidecar/ src/vault/
git checkout package.json vite.config.js
git grep -l '// VAULT:' | xargs ... # find & revert tagged lines
```

The `// VAULT:` tag is specifically there so the rollback path exists and is greppable.

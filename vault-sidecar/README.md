# vault-sidecar

A small localhost-only HTTP server that reads and writes SPACE Terminal advisors
and conversations as markdown files on disk. Designed to be started alongside
the Vite dev server via the root `npm run dev:vault` script — not run directly.

This directory is intentionally isolated from the rest of the SPACE codebase.
You can `rm -rf vault-sidecar/` and the React app still builds.

## What it does

- Serves `GET/PUT/DELETE /vault/advisors[/:slug]`
- Serves `GET/PUT/DELETE /vault/conversations[/:id]`
- Serves `GET /vault/file?path=...` and `GET /vault/files?glob=...` for `@`-mention support
- Binds to `127.0.0.1` only, checks `Origin` against `localhost:3000`,
  rejects any path that resolves outside the vault or the configured allowlist

## How it's started

It is started by the project root, not from this directory:

```bash
npm run dev:vault   # runs vite + this sidecar concurrently
```

Direct invocation (`npm start` from inside `vault-sidecar/`) works for
debugging.

## Environment variables

| Var                    | Default                | Meaning                                                       |
| ---------------------- | ---------------------- | ------------------------------------------------------------- |
| `SPACE_VAULT`          | `~/space-vault`        | Vault root. Created on startup if missing. `~` is expanded.   |
| `SPACE_ALLOWED_PATHS`  | (empty)                | Colon-separated extra dirs readable via `@`-mention.          |
| `SPACE_VAULT_PORT`     | `3001`                 | Port the sidecar listens on (always on `127.0.0.1`).          |

Example pointing the vault at an Obsidian folder and allowing reads from
another:

```bash
SPACE_VAULT=~/Obsidian/SPACE \
SPACE_ALLOWED_PATHS=~/Obsidian/Inbox:~/notes \
npm run dev:vault
```

## Tests

```bash
cd vault-sidecar
npm install
npm test
```

Tests use `node --test`. They cover path-safety (`test/path-safety.test.js`)
and end-to-end endpoints against an ephemeral vault (`test/endpoints.test.js`).

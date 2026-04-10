// server.js
//
// SPACE Terminal vault sidecar. Localhost-only HTTP server that reads and
// writes advisors and conversations as markdown files. See README.md for the
// big picture and paths.js for the security model.
//
// This file is intentionally self-contained. The only helper module is
// paths.js for path-safety primitives.

import express from 'express';
import cors from 'cors';
import matter from 'gray-matter';
import fg from 'fast-glob';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';

import { assertPathAllowed, expandPath, PathNotAllowedError } from './paths.js';

// ---------- configuration ----------

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export async function buildConfig(env = process.env) {
  const vaultRootRaw = env.SPACE_VAULT || path.join(os.homedir(), 'space-vault');
  const vaultRoot = path.resolve(expandPath(vaultRootRaw));

  const extraPaths = (env.SPACE_ALLOWED_PATHS || '')
    .split(':')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => path.resolve(expandPath(p)));

  const port = Number(env.SPACE_VAULT_PORT || 3001);

  // Ensure the vault and its standard subdirectories exist. We do this here
  // (rather than lazily) so that startup fails loudly if the vault path is
  // wrong (e.g. points at a file).
  await fs.mkdir(vaultRoot, { recursive: true });
  await fs.mkdir(path.join(vaultRoot, 'advisors'), { recursive: true });
  await fs.mkdir(path.join(vaultRoot, 'conversations'), { recursive: true });

  // Resolve via realpath so the allowlist matches what assertPathAllowed
  // computes per-request. If the vault is itself a symlink, this matters.
  const realVault = await fs.realpath(vaultRoot);
  const realExtras = await Promise.all(
    extraPaths.map(async (p) => {
      try { return await fs.realpath(p); } catch { return p; }
    }),
  );

  return {
    vaultRoot: realVault,
    allowedPaths: realExtras,
    allowedRoots: [realVault, ...realExtras],
    port,
  };
}

// ---------- helpers ----------

function jsonError(res, status, message, code) {
  return res.status(status).json({ error: message, code: code || 'ERROR' });
}

function isValidSlug(s) {
  // Slugs are URL-safe directory names. Reject anything that could escape.
  return typeof s === 'string' && /^[a-zA-Z0-9._-]+$/.test(s) && s !== '.' && s !== '..';
}

function nowIso() {
  return new Date().toISOString();
}

async function pathExists(p) {
  try { await fs.stat(p); return true; } catch { return false; }
}

// Parse a conversation markdown body into an ordered messages array.
// Format produced by Terminal.jsx formatSessionAsMarkdown:
//   ## User
//   <content>
//   ## <Advisor Name>
//   <content>
// Headings starting with "## " are message boundaries; "# " is the title.
function parseConversationBody(body, advisorNames = []) {
  const lines = body.split('\n');
  const messages = [];
  let current = null;
  for (const line of lines) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) {
        current.content = current.content.replace(/\s+$/, '');
        messages.push(current);
      }
      const heading = m[1].trim();
      const isUser = heading.toLowerCase() === 'user';
      // Skip non-message sections like "Active Perspectives".
      if (!isUser && heading.toLowerCase() === 'active perspectives') {
        current = null;
        continue;
      }
      current = {
        type: isUser ? 'user' : 'advisor',
        name: isUser ? null : heading,
        content: '',
      };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) {
    current.content = current.content.replace(/\s+$/, '');
    messages.push(current);
  }
  return messages;
}

function formatConversationBody(conversation) {
  const parts = [];
  if (conversation.title) {
    parts.push(`# ${conversation.title}`);
    parts.push('');
  }
  for (const msg of conversation.messages || []) {
    if (msg.type === 'user') {
      parts.push('## User');
    } else {
      parts.push(`## ${msg.name || 'Advisor'}`);
    }
    parts.push('');
    parts.push((msg.content || '').replace(/\s+$/, ''));
    parts.push('');
  }
  return parts.join('\n');
}

// ---------- app construction ----------

export function createApp(config) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // The cors middleware here only exists to emit the Access-Control-Allow-Origin
  // header for allowed origins so browser fetches succeed. Policy enforcement
  // (rejecting disallowed origins) lives in the manual middleware below, which
  // can return a clean 403 JSON body — cors' origin callback error path
  // produces a 500 that fights with our error handler.
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
      // Disallowed: pass through without CORS headers. The manual check
      // below will reject with 403.
      return cb(null, false);
    },
  }));

  // Belt-and-suspenders origin check. The cors middleware can be bypassed
  // by callers that omit Origin entirely (curl, other servers). For browser
  // requests we require Origin to be present and on the allowlist. We
  // exempt the health endpoint so curl-from-terminal still works for
  // debugging.
  app.use((req, res, next) => {
    if (req.path === '/vault/health') return next();
    const origin = req.headers.origin;
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return jsonError(res, 403, 'Origin not allowed', 'ORIGIN_FORBIDDEN');
    }
    next();
  });

  // Per-request id for logging unexpected errors.
  app.use((req, _res, next) => {
    req.id = randomUUID().slice(0, 8);
    next();
  });

  // ---------- health ----------

  app.get('/vault/health', (_req, res) => {
    res.json({
      ok: true,
      vaultRoot: config.vaultRoot,
      allowedPaths: config.allowedPaths,
    });
  });

  // ---------- advisors ----------

  app.get('/vault/advisors', async (_req, res, next) => {
    try {
      const advisorsDir = path.join(config.vaultRoot, 'advisors');
      await assertPathAllowed(advisorsDir, config.allowedRoots);
      const entries = await fs.readdir(advisorsDir, { withFileTypes: true });
      const out = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name;
        const filePath = path.join(advisorsDir, slug, 'advisor.md');
        if (!(await pathExists(filePath))) continue;
        await assertPathAllowed(filePath, config.allowedRoots);
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = matter(raw);
        out.push({
          slug,
          name: parsed.data.name || slug,
          description: parsed.content.trim(),
          color: parsed.data.color || null,
          createdAt: parsed.data.createdAt || parsed.data.created || null,
          path: filePath,
          raw,
        });
      }
      res.json(out);
    } catch (err) { next(err); }
  });

  app.put('/vault/advisors/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      if (!isValidSlug(slug)) return jsonError(res, 400, 'Invalid slug', 'BAD_SLUG');
      const { name, description, color } = req.body || {};
      if (typeof name !== 'string' || typeof description !== 'string') {
        return jsonError(res, 400, 'name and description are required strings', 'BAD_BODY');
      }
      const dir = path.join(config.vaultRoot, 'advisors', slug);
      const filePath = path.join(dir, 'advisor.md');
      await assertPathAllowed(dir, config.allowedRoots);

      let createdAt = nowIso();
      if (await pathExists(filePath)) {
        const raw = await fs.readFile(filePath, 'utf8');
        const existing = matter(raw);
        if (existing.data.createdAt) createdAt = existing.data.createdAt;
        else if (existing.data.created) createdAt = existing.data.created;
      } else {
        await fs.mkdir(dir, { recursive: true });
      }

      const fm = { name, color: color || null, createdAt };
      const raw = matter.stringify(description.endsWith('\n') ? description : description + '\n', fm);
      await assertPathAllowed(filePath, config.allowedRoots);
      await fs.writeFile(filePath, raw, 'utf8');

      res.json({
        slug, name, description, color: color || null, createdAt,
        path: filePath, raw,
      });
    } catch (err) { next(err); }
  });

  app.delete('/vault/advisors/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      if (!isValidSlug(slug)) return jsonError(res, 400, 'Invalid slug', 'BAD_SLUG');
      const dir = path.join(config.vaultRoot, 'advisors', slug);
      await assertPathAllowed(dir, config.allowedRoots);
      if (!(await pathExists(dir))) return jsonError(res, 404, 'Advisor not found', 'NOT_FOUND');
      await fs.rm(dir, { recursive: true, force: true });
      res.json({ ok: true, slug });
    } catch (err) { next(err); }
  });

  // ---------- conversations ----------

  app.get('/vault/conversations', async (_req, res, next) => {
    try {
      const dir = path.join(config.vaultRoot, 'conversations');
      await assertPathAllowed(dir, config.allowedRoots);
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const out = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const id = entry.name;
        const filePath = path.join(dir, id, 'conversation.md');
        if (!(await pathExists(filePath))) continue;
        await assertPathAllowed(filePath, config.allowedRoots);
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = matter(raw);
        const stat = await fs.stat(filePath);
        out.push({
          id,
          title: parsed.data.title || id,
          createdAt: parsed.data.createdAt || parsed.data.created || null,
          updatedAt: parsed.data.updatedAt || stat.mtime.toISOString(),
          advisors: parsed.data.advisors || [],
          path: filePath,
        });
      }
      res.json(out);
    } catch (err) { next(err); }
  });

  app.get('/vault/conversations/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!isValidSlug(id)) return jsonError(res, 400, 'Invalid id', 'BAD_ID');
      const filePath = path.join(config.vaultRoot, 'conversations', id, 'conversation.md');
      await assertPathAllowed(filePath, config.allowedRoots);
      if (!(await pathExists(filePath))) return jsonError(res, 404, 'Conversation not found', 'NOT_FOUND');
      const raw = await fs.readFile(filePath, 'utf8');
      const parsed = matter(raw);
      const stat = await fs.stat(filePath);
      const messages = parseConversationBody(parsed.content, parsed.data.advisors || []);
      res.json({
        id,
        title: parsed.data.title || id,
        createdAt: parsed.data.createdAt || parsed.data.created || null,
        updatedAt: parsed.data.updatedAt || stat.mtime.toISOString(),
        advisors: parsed.data.advisors || [],
        metadata: parsed.data.metadata || null,
        messages,
        raw,
      });
    } catch (err) { next(err); }
  });

  app.put('/vault/conversations/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!isValidSlug(id)) return jsonError(res, 400, 'Invalid id', 'BAD_ID');
      const body = req.body || {};
      if (typeof body !== 'object') return jsonError(res, 400, 'Body must be object', 'BAD_BODY');
      const dir = path.join(config.vaultRoot, 'conversations', id);
      const filePath = path.join(dir, 'conversation.md');
      await assertPathAllowed(dir, config.allowedRoots);

      let createdAt = nowIso();
      if (await pathExists(filePath)) {
        const existing = matter(await fs.readFile(filePath, 'utf8'));
        if (existing.data.createdAt) createdAt = existing.data.createdAt;
        else if (existing.data.created) createdAt = existing.data.created;
      } else {
        await fs.mkdir(dir, { recursive: true });
      }

      const fm = {
        id,
        title: body.title || id,
        createdAt,
        updatedAt: nowIso(),
        advisors: body.advisors || [],
      };
      // Pass through arbitrary metadata. Terminal.jsx's session shape
      // includes things like advisorSuggestions, voteHistory, summary, etc.
      // that don't fit cleanly into the markdown body but need to round-trip.
      // We store them under a single `metadata` frontmatter key so the file
      // stays human-readable and the machine state is namespaced.
      if (body.metadata && typeof body.metadata === 'object') {
        fm.metadata = body.metadata;
      }
      const bodyMd = formatConversationBody({ title: body.title, messages: body.messages || [] });
      const raw = matter.stringify(bodyMd.endsWith('\n') ? bodyMd : bodyMd + '\n', fm);
      await assertPathAllowed(filePath, config.allowedRoots);
      await fs.writeFile(filePath, raw, 'utf8');

      res.json({
        id, title: fm.title, createdAt, updatedAt: fm.updatedAt,
        advisors: fm.advisors, metadata: fm.metadata || null,
        messages: body.messages || [], raw,
      });
    } catch (err) { next(err); }
  });

  app.delete('/vault/conversations/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!isValidSlug(id)) return jsonError(res, 400, 'Invalid id', 'BAD_ID');
      const dir = path.join(config.vaultRoot, 'conversations', id);
      await assertPathAllowed(dir, config.allowedRoots);
      if (!(await pathExists(dir))) return jsonError(res, 404, 'Conversation not found', 'NOT_FOUND');
      await fs.rm(dir, { recursive: true, force: true });
      res.json({ ok: true, id });
    } catch (err) { next(err); }
  });

  // ---------- config (advisor groups, current conversation id) ----------
  //
  // The vault stores a single config.json at its root. It holds state that
  // doesn't naturally fit in per-advisor or per-conversation files: advisor
  // groups and pointer fields like currentConversationId.
  //
  // This endpoint exists because the React adapter needs a place to persist
  // these and we don't want to conflate them with advisor/conversation files.
  async function readConfig() {
    const configPath = path.join(config.vaultRoot, 'config.json');
    await assertPathAllowed(configPath, config.allowedRoots);
    if (!(await pathExists(configPath))) {
      return { advisorGroups: [], currentConversationId: null };
    }
    try {
      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        advisorGroups: Array.isArray(parsed.advisorGroups) ? parsed.advisorGroups : [],
        currentConversationId: parsed.currentConversationId ?? null,
      };
    } catch {
      return { advisorGroups: [], currentConversationId: null };
    }
  }

  app.get('/vault/config', async (_req, res, next) => {
    try {
      res.json(await readConfig());
    } catch (err) { next(err); }
  });

  app.put('/vault/config', async (req, res, next) => {
    try {
      const body = req.body || {};
      const next = {
        advisorGroups: Array.isArray(body.advisorGroups) ? body.advisorGroups : [],
        currentConversationId: body.currentConversationId ?? null,
      };
      const configPath = path.join(config.vaultRoot, 'config.json');
      await assertPathAllowed(configPath, config.allowedRoots);
      await fs.writeFile(configPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
      res.json(next);
    } catch (err) { next(err); }
  });

  // ---------- file/files (for @-mention) ----------
  //
  // The @-mention feature is deliberately restricted to markdown files. The
  // sidecar enforces this server-side so a compromised or buggy client can't
  // turn the vault sidecar into a generic file-read service.

  function isMarkdownPath(p) {
    return /\.(md|markdown)$/i.test(p);
  }

  app.get('/vault/files', async (req, res, next) => {
    try {
      const glob = req.query.glob;
      if (typeof glob !== 'string' || glob.length === 0) {
        return jsonError(res, 400, 'glob query param required', 'BAD_GLOB');
      }
      // Run the glob across every allowed root, then validate each match.
      const results = [];
      for (const root of config.allowedRoots) {
        const matches = await fg(glob, {
          cwd: root,
          absolute: true,
          dot: false,
          onlyFiles: true,
          followSymbolicLinks: false,
        });
        for (const m of matches) {
          if (!isMarkdownPath(m)) continue; // markdown-only
          try {
            const safe = await assertPathAllowed(m, config.allowedRoots);
            const stat = await fs.stat(safe);
            results.push({
              path: safe,
              name: path.basename(safe),
              size: stat.size,
              mtime: stat.mtime.toISOString(),
            });
          } catch (e) {
            if (!(e instanceof PathNotAllowedError)) throw e;
            // Silently drop matches that escape the allowlist.
          }
        }
      }
      res.json(results);
    } catch (err) { next(err); }
  });

  app.get('/vault/file', async (req, res, next) => {
    try {
      const p = req.query.path;
      if (typeof p !== 'string') return jsonError(res, 400, 'path query param required', 'BAD_PATH');
      if (!isMarkdownPath(p)) {
        return jsonError(res, 400, 'Only markdown files may be read via /vault/file', 'NOT_MARKDOWN');
      }
      const safe = await assertPathAllowed(p, config.allowedRoots);
      if (!(await pathExists(safe))) return jsonError(res, 404, 'File not found', 'NOT_FOUND');
      const raw = await fs.readFile(safe, 'utf8');
      const parsed = matter(raw);
      res.json({ path: safe, frontmatter: parsed.data, body: parsed.content, raw });
    } catch (err) { next(err); }
  });

  // ---------- error handler ----------

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof PathNotAllowedError) {
      return jsonError(res, 403, err.message, 'PATH_NOT_ALLOWED');
    }
    if (err && err.type === 'entity.too.large') {
      return jsonError(res, 413, 'Request body too large', 'BODY_TOO_LARGE');
    }
    process.stderr.write(`[vault-sidecar] [${req.id || '?'}] unexpected error: ${err && err.stack || err}\n`);
    return jsonError(res, 500, 'Internal server error', 'INTERNAL');
  });

  return app;
}

// ---------- entry point ----------

export async function startServer(env = process.env) {
  const config = await buildConfig(env);
  const app = createApp(config);
  return new Promise((resolve) => {
    // CRITICAL: 127.0.0.1 only. Never 0.0.0.0 — that would expose the
    // sidecar (and the user's filesystem) to the local network.
    const server = app.listen(config.port, '127.0.0.1', () => {
      // eslint-disable-next-line no-console
      console.log(`[vault-sidecar] listening on http://127.0.0.1:${config.port}`);
      // eslint-disable-next-line no-console
      console.log(`[vault-sidecar] vault root: ${config.vaultRoot}`);
      if (config.allowedPaths.length) {
        // eslint-disable-next-line no-console
        console.log(`[vault-sidecar] extra allowed paths: ${config.allowedPaths.join(', ')}`);
      }
      resolve({ server, config, app });
    });
  });
}

// Run when invoked directly (node server.js), not when imported by tests.
// Use pathToFileURL to get a URL that matches import.meta.url exactly
// (the naive `file://${argv[1]}` variant drops a slash on macOS).
import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  startServer().catch((err) => {
    process.stderr.write(`[vault-sidecar] failed to start: ${err && err.stack || err}\n`);
    process.exit(1);
  });
}

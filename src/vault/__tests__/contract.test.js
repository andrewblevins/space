// VAULT: contract test — real sidecar + real vaultAdapter talking to each other.
//
// Purpose: catch agent-to-agent integration drift. The sidecar and adapter
// were built by separate subagents from a shared spec; unit tests on either
// side don't catch field-name mismatches, heading-level disagreements, or
// silent API shape differences. This test spins up the actual sidecar on an
// ephemeral port in a tempdir vault, points the adapter's fetch at it, and
// round-trips advisors and conversations through the full stack.
//
// If this test passes, the foundation layer is ready for the Terminal.jsx
// port. If it fails, reconciliation is needed before touching the main app.

/** @jest-environment node */

import { jest } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import http from 'node:http';

// We launch the real sidecar as a child process (the way it runs in dev)
// instead of importing it as a module. The sidecar is ESM and lives outside
// src/, which makes in-process import clash with jest's CJS transform path.
// A child process is also closer to the real integration we're testing.
//
// We use the node jest environment. But jest's globals don't include fetch
// in any env (even node), so we implement a minimal HTTP client on top of
// node:http for this test. The vaultClient itself uses globalThis.fetch, so
// we also install a fetch shim before loading the adapter.

function nodeFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            headers: {
              get(name) {
                return res.headers[name.toLowerCase()] || null;
              },
            },
            async json() { return JSON.parse(text); },
            async text() { return text; },
          });
        });
      },
    );
    req.on('error', reject);
    if (options.body !== undefined) req.write(options.body);
    req.end();
  });
}

// Install the shim globally so the adapter's vaultClient.request() can
// use globalThis.fetch and have it actually work.
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = nodeFetch;
}

let childProc;
let baseUrl;
let tempDir;

async function waitForHealth(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try {
      const res = await nodeFetch(`${url}/vault/health`);
      if (res.ok) return;
      lastErr = new Error(`health returned ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(
    `sidecar did not become healthy at ${url} within ${timeoutMs}ms. Last error: ${lastErr && (lastErr.message || lastErr)}`,
  );
}

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'space-contract-'));

  // Pick an ephemeral port by asking the OS. We can't pass port=0 to the
  // sidecar because it logs based on the resolved port; easier to find a
  // free port ourselves, then tell the sidecar to use it.
  const net = await import('node:net');
  const port = await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port: p } = srv.address();
      srv.close(() => resolve(p));
    });
    srv.on('error', reject);
  });
  baseUrl = `http://127.0.0.1:${port}`;

  // __dirname is provided by jest's babel transform (commonjs mode).
  // Resolve the sidecar path relative to this test file.
  const sidecarPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'vault-sidecar',
    'server.js',
  );

  childProc = spawn(process.execPath, [sidecarPath], {
    env: {
      ...process.env,
      SPACE_VAULT: tempDir,
      SPACE_VAULT_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let sidecarStdout = '';
  let sidecarStderr = '';
  childProc.stdout.on('data', (chunk) => { sidecarStdout += chunk.toString(); });
  childProc.stderr.on('data', (chunk) => { sidecarStderr += chunk.toString(); });
  childProc.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      // eslint-disable-next-line no-console
      console.error(`[sidecar] exited code=${code} signal=${signal}\nstdout:\n${sidecarStdout}\nstderr:\n${sidecarStderr}`);
    }
  });

  try {
    await waitForHealth(baseUrl);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[contract] sidecar never healthy.\nsidecarPath=${sidecarPath}\nstdout:\n${sidecarStdout}\nstderr:\n${sidecarStderr}`);
    throw err;
  }

  // Monkey-patch fetch so relative /vault/* URLs resolve against the sidecar,
  // AND so we can inject an Origin header (the sidecar requires it for
  // non-health endpoints). Jest's jsdom env fetch doesn't send Origin to
  // localhost by default.
  globalThis.fetch = (url, options = {}) => {
    const abs = typeof url === 'string' && url.startsWith('/')
      ? `${baseUrl}${url}`
      : url;
    return nodeFetch(abs, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Origin: 'http://localhost:3000',
      },
    });
  };
});

afterAll(async () => {
  globalThis.fetch = nodeFetch;
  if (childProc) {
    childProc.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 100));
  }
  if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
});

// Import after the fetch patch so the adapter picks up the patched fetch
// via its closure. (Modules do not cache fetch, but keeping the import here
// is also what forces jest to resolve the adapter at this point.)
import * as adapter from '../index.js';
import { __resetVaultAdapter } from '../vaultAdapter.js';

beforeEach(() => {
  __resetVaultAdapter();
});

describe('sidecar ↔ adapter contract', () => {
  test('health endpoint is reachable and returns vault root', async () => {
    // Direct fetch to health endpoint — smoke test before anything fancy.
    const res = await globalThis.fetch('/vault/health');
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.vaultRoot).toContain('space-contract-');
  });

  test('prewarmVault succeeds against empty vault', async () => {
    await adapter.prewarmVault();
    expect(adapter.isPrewarmed()).toBe(true);
    expect(adapter.getPrewarmError()).toBeNull();
    expect(adapter.getAdvisors()).toEqual([]);
    expect(adapter.getConversationIndex()).toEqual([]);
  });

  test('advisor round-trip via adapter persists to disk and reads back', async () => {
    await adapter.prewarmVault();

    // Write an advisor through the adapter's high-level API.
    await adapter.saveAdvisor({
      slug: 'the-pragmatist',
      name: 'The Pragmatist',
      description: 'A no-nonsense operator who cares about shipping.',
      color: 'bg-amber-600',
    });

    // Confirm the file actually landed on disk with the expected shape.
    const filePath = path.join(tempDir, 'advisors', 'the-pragmatist', 'advisor.md');
    const raw = await fs.readFile(filePath, 'utf8');
    expect(raw).toContain('name: The Pragmatist');
    expect(raw).toContain('color: bg-amber-600');
    expect(raw).toContain('A no-nonsense operator who cares about shipping.');

    // Now reset the adapter and re-prewarm — the new instance should see
    // the advisor we just wrote.
    __resetVaultAdapter();
    await adapter.prewarmVault();
    const advisors = adapter.getAdvisors();
    expect(advisors).toHaveLength(1);
    const [a] = advisors;
    expect(a.slug).toBe('the-pragmatist');
    expect(a.name).toBe('The Pragmatist');
    expect(a.color).toBe('bg-amber-600');
    expect(a.description).toContain('no-nonsense operator');
  });

  test('conversation round-trip preserves messages and heading level', async () => {
    await adapter.prewarmVault();

    const convoId = '2026-04-09-test-convo';
    const messages = [
      { type: 'user', content: 'What should I do?' },
      { type: 'advisor', name: 'The Pragmatist', content: 'Ship the MVP.' },
      { type: 'advisor', name: 'The Mystic', content: 'Sit with the question.' },
      { type: 'user', content: 'Both of those feel right.' },
    ];

    adapter.saveConversation(convoId, {
      title: 'Test Conversation',
      advisors: ['the-pragmatist', 'the-mystic'],
      messages,
    });

    // Wait for the fire-and-forget write to land. The adapter returns a
    // promise from saveConversation so we can await it.
    // (saveConversation is sync-cached-then-fire-and-forget, but returns the
    // promise so tests can await it.)
    // Re-get it via the chain:
    // We'll just re-prewarm, which forces a read.
    // But first, give the queued write a microtask to flush.
    await new Promise((r) => setTimeout(r, 50));

    // Verify the on-disk file uses ## headings (not ###) — this is the
    // single most important contract point between sidecar and adapter.
    const filePath = path.join(tempDir, 'conversations', convoId, 'conversation.md');
    const raw = await fs.readFile(filePath, 'utf8');
    expect(raw).toMatch(/^## User$/m);
    expect(raw).toMatch(/^## The Pragmatist$/m);
    expect(raw).toMatch(/^## The Mystic$/m);
    expect(raw).not.toMatch(/^### /m); // no h3 headings
    expect(raw).toContain('title: Test Conversation');
    expect(raw).toContain('Ship the MVP.');

    // Read the conversation back through the adapter.
    __resetVaultAdapter();
    await adapter.prewarmVault();

    const index = adapter.getConversationIndex();
    expect(index).toHaveLength(1);
    expect(index[0].id).toBe(convoId);
    expect(index[0].title).toBe('Test Conversation');
    expect(index[0].advisors).toEqual(['the-pragmatist', 'the-mystic']);

    const loaded = await adapter.loadConversation(convoId);
    expect(loaded.title).toBe('Test Conversation');
    expect(loaded.messages).toHaveLength(4);
    expect(loaded.messages[0]).toMatchObject({ type: 'user', content: 'What should I do?' });
    expect(loaded.messages[1]).toMatchObject({
      type: 'advisor',
      name: 'The Pragmatist',
      content: 'Ship the MVP.',
    });
    expect(loaded.messages[3]).toMatchObject({
      type: 'user',
      content: 'Both of those feel right.',
    });
  });

  test('conversation index list shape matches adapter expectations', async () => {
    // Clear any conversations left over from previous tests.
    const convoDir = path.join(tempDir, 'conversations');
    await fs.rm(convoDir, { recursive: true, force: true });
    await fs.mkdir(convoDir, { recursive: true });

    await adapter.prewarmVault();

    // Write two conversations.
    adapter.saveConversation('convo-a', {
      title: 'Convo A',
      advisors: ['x'],
      messages: [{ type: 'user', content: 'hello' }],
    });
    adapter.saveConversation('convo-b', {
      title: 'Convo B',
      advisors: ['y'],
      messages: [{ type: 'user', content: 'world' }],
    });
    await new Promise((r) => setTimeout(r, 100));

    __resetVaultAdapter();
    await adapter.prewarmVault();

    const index = adapter.getConversationIndex();
    expect(index).toHaveLength(2);
    // Every entry must have the fields the adapter and Terminal.jsx will
    // depend on. If any of these is missing or renamed, the port breaks.
    for (const entry of index) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('advisors');
      expect(entry).toHaveProperty('updatedAt');
    }
  });

  test('session round-trip with rich metadata via bootstrap helpers', async () => {
    // Reset conversations dir.
    await fs.rm(path.join(tempDir, 'conversations'), { recursive: true, force: true });
    await fs.mkdir(path.join(tempDir, 'conversations'), { recursive: true });
    __resetVaultAdapter();
    await adapter.prewarmVault();

    // Activate vault mode for bootstrap helpers by calling bootstrapVault.
    // This re-runs prewarm but it's idempotent.
    const bootstrap = await import('../bootstrap.js');
    await bootstrap.bootstrapVault();
    expect(bootstrap.isVaultActive()).toBe(true);

    // Build a Terminal-shaped session with rich metadata.
    const session = {
      id: 17,
      title: 'A test session',
      timestamp: '2026-04-09T20:00:00.000Z',
      metadata: {
        advisors: [{ name: 'The Pragmatist', slug: 'the-pragmatist' }],
        advisorSuggestions: ['look here', 'consider this'],
        voteHistory: [{ idx: 0, vote: 1 }],
      },
      messages: [
        { type: 'user', content: 'hello' },
        { type: 'advisor', name: 'The Pragmatist', content: 'right back at you' },
      ],
      summary: 'A two-line conversation',
      summaryTimestamp: '2026-04-09T20:01:00.000Z',
      summaryMessageCount: 2,
    };

    await bootstrap.persistSession(session);
    // Wait for the queued write.
    await new Promise((r) => setTimeout(r, 100));

    // Confirm the file landed on disk.
    const filePath = path.join(tempDir, 'conversations', '17', 'conversation.md');
    const raw = await fs.readFile(filePath, 'utf8');
    expect(raw).toContain('title: A test session');
    expect(raw).toContain('## User');
    expect(raw).toContain('## The Pragmatist');
    expect(raw).toContain('right back at you');

    // Read it back through the bootstrap helper.
    const loaded = await bootstrap.loadSessionFromStorage(17);
    expect(loaded).not.toBeNull();
    expect(loaded.id).toBe(17);
    expect(loaded.title).toBe('A test session');
    expect(loaded.summary).toBe('A two-line conversation');
    expect(loaded.summaryMessageCount).toBe(2);
    expect(loaded.metadata.advisorSuggestions).toEqual(['look here', 'consider this']);
    expect(loaded.metadata.voteHistory).toEqual([{ idx: 0, vote: 1 }]);
    expect(loaded.messages).toHaveLength(2);
    expect(loaded.messages[0]).toMatchObject({ type: 'user', content: 'hello' });
    expect(loaded.messages[1]).toMatchObject({
      type: 'advisor',
      name: 'The Pragmatist',
      content: 'right back at you',
    });
  });

  test('config round-trip: setAdvisorGroups and setCurrentConversationId persist', async () => {
    // Fresh vault for this test.
    const configPath = path.join(tempDir, 'config.json');
    await fs.rm(configPath, { force: true });

    await adapter.prewarmVault();
    // Default state from empty vault.
    expect(adapter.getAdvisorGroups()).toEqual([]);
    expect(adapter.getCurrentConversationId()).toBeNull();

    await adapter.setAdvisorGroups([{ name: 'Council', advisors: ['the-pragmatist'] }]);
    await adapter.setCurrentConversationId('some-convo');

    // Confirm the on-disk file matches.
    await new Promise((r) => setTimeout(r, 50));
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.advisorGroups).toEqual([{ name: 'Council', advisors: ['the-pragmatist'] }]);
    expect(parsed.currentConversationId).toBe('some-convo');

    // Re-prewarm and confirm the config comes back through the adapter.
    __resetVaultAdapter();
    await adapter.prewarmVault();
    expect(adapter.getAdvisorGroups()).toEqual([{ name: 'Council', advisors: ['the-pragmatist'] }]);
    expect(adapter.getCurrentConversationId()).toBe('some-convo');
  });

  test('@-mention: searchVaultFiles finds markdown files in the vault', async () => {
    // Drop a couple of markdown files in the vault root.
    await fs.writeFile(path.join(tempDir, 'thoughts.md'), '# my thoughts\n\nstuff');
    await fs.writeFile(path.join(tempDir, 'shopping.md'), '# shopping\n\neggs, milk');
    await fs.writeFile(path.join(tempDir, 'secret.txt'), 'should not appear');

    const bootstrap = await import('../bootstrap.js');
    await bootstrap.bootstrapVault();

    // Empty query returns all markdown files.
    const all = await bootstrap.searchVaultFiles('');
    const allNames = all.map((f) => f.name).sort();
    expect(allNames).toContain('thoughts.md');
    expect(allNames).toContain('shopping.md');
    expect(allNames).not.toContain('secret.txt');

    // Filtered query.
    const matches = await bootstrap.searchVaultFiles('shop');
    expect(matches.map((f) => f.name)).toEqual(['shopping.md']);

    // Read the contents of one.
    const file = await bootstrap.readVaultFile(matches[0].path);
    expect(file).not.toBeNull();
    expect(file.body).toContain('eggs, milk');
  });

  test('advisor delete removes the file from disk', async () => {
    await adapter.prewarmVault();
    await adapter.saveAdvisor({
      slug: 'ephemeral',
      name: 'Ephemeral',
      description: 'Here and gone.',
      color: 'bg-gray-500',
    });
    const filePath = path.join(tempDir, 'advisors', 'ephemeral', 'advisor.md');
    await fs.access(filePath); // exists

    await adapter.deleteAdvisor('ephemeral');
    await new Promise((r) => setTimeout(r, 50));

    await expect(fs.access(filePath)).rejects.toThrow();
    expect(adapter.getAdvisors().find((a) => a.slug === 'ephemeral')).toBeUndefined();
  });
});

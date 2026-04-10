import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { buildConfig, createApp } from '../server.js';

let server;
let baseUrl;
let config;
let vaultDir;

const ORIGIN = 'http://localhost:3000';

before(async () => {
  vaultDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vault-sidecar-e2e-'));
  config = await buildConfig({
    SPACE_VAULT: vaultDir,
    SPACE_VAULT_PORT: '0',
  });
  const app = createApp(config);
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (vaultDir) await fs.rm(vaultDir, { recursive: true, force: true });
});

function fetchJSON(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      origin: ORIGIN,
      ...(opts.headers || {}),
    },
  });
}

test('GET /vault/health returns vault root', async () => {
  const res = await fetch(`${baseUrl}/vault/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.vaultRoot, config.vaultRoot);
});

test('advisor PUT/GET/DELETE round-trip', async () => {
  const slug = 'the-pragmatist';
  const put = await fetchJSON(`${baseUrl}/vault/advisors/${slug}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'The Pragmatist',
      description: 'Cares about whether it ships on Tuesday morning.',
      color: 'bg-amber-600',
    }),
  });
  assert.equal(put.status, 200);
  const stored = await put.json();
  assert.equal(stored.slug, slug);
  assert.equal(stored.name, 'The Pragmatist');
  assert.ok(stored.createdAt);

  const list = await fetchJSON(`${baseUrl}/vault/advisors`);
  assert.equal(list.status, 200);
  const advisors = await list.json();
  const found = advisors.find((a) => a.slug === slug);
  assert.ok(found, 'advisor should appear in list');
  assert.equal(found.name, 'The Pragmatist');
  assert.match(found.description, /Tuesday/);

  const del = await fetchJSON(`${baseUrl}/vault/advisors/${slug}`, { method: 'DELETE' });
  assert.equal(del.status, 200);

  const list2 = await fetchJSON(`${baseUrl}/vault/advisors`);
  const after2 = await list2.json();
  assert.equal(after2.find((a) => a.slug === slug), undefined);
});

test('conversation PUT/GET round-trip preserves messages', async () => {
  const id = '2026-04-09-test-convo';
  const messages = [
    { type: 'user', name: null, content: 'What should I do?' },
    { type: 'advisor', name: 'The Pragmatist', content: 'Ship something small.' },
    { type: 'user', name: null, content: 'Like what?' },
    { type: 'advisor', name: 'The Mystic', content: 'Listen to the river.\n\nIt knows.' },
  ];
  const put = await fetchJSON(`${baseUrl}/vault/conversations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Test convo',
      advisors: ['the-pragmatist', 'the-mystic'],
      messages,
    }),
  });
  assert.equal(put.status, 200);

  const get = await fetchJSON(`${baseUrl}/vault/conversations/${id}`);
  assert.equal(get.status, 200);
  const convo = await get.json();
  assert.equal(convo.title, 'Test convo');
  assert.deepEqual(convo.advisors, ['the-pragmatist', 'the-mystic']);
  assert.equal(convo.messages.length, messages.length);
  for (let i = 0; i < messages.length; i++) {
    assert.equal(convo.messages[i].type, messages[i].type);
    assert.equal(convo.messages[i].name, messages[i].name);
    assert.equal(convo.messages[i].content, messages[i].content);
  }

  const list = await fetchJSON(`${baseUrl}/vault/conversations`);
  const items = await list.json();
  const item = items.find((c) => c.id === id);
  assert.ok(item);
  assert.equal(item.title, 'Test convo');

  const del = await fetchJSON(`${baseUrl}/vault/conversations/${id}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
});

test('GET /vault/file with markdown path outside allowlist returns 403', async () => {
  // Use a .md extension so the request gets past the markdown-only filter
  // and actually reaches the path-allowlist check we're trying to verify.
  const res = await fetchJSON(`${baseUrl}/vault/file?path=/tmp/not-in-the-vault.md`);
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.code, 'PATH_NOT_ALLOWED');
});

test('request with bad Origin returns 403', async () => {
  const res = await fetch(`${baseUrl}/vault/advisors`, {
    headers: { origin: 'http://evil.example.com' },
  });
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.equal(body.code, 'ORIGIN_FORBIDDEN');
});

test('GET /vault/config on empty vault returns defaults', async () => {
  const res = await fetchJSON(`${baseUrl}/vault/config`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.advisorGroups, []);
  assert.equal(body.currentConversationId, null);
});

test('PUT /vault/config persists config across requests', async () => {
  const put = await fetchJSON(`${baseUrl}/vault/config`, {
    method: 'PUT',
    body: JSON.stringify({
      advisorGroups: [{ name: 'Inner Circle', advisors: ['the-pragmatist'] }],
      currentConversationId: 'some-convo-id',
    }),
  });
  assert.equal(put.status, 200);

  const get = await fetchJSON(`${baseUrl}/vault/config`);
  const body = await get.json();
  assert.deepEqual(body.advisorGroups, [
    { name: 'Inner Circle', advisors: ['the-pragmatist'] },
  ]);
  assert.equal(body.currentConversationId, 'some-convo-id');
});

test('GET /vault/files only returns .md files', async () => {
  // Drop a .md and a .txt into the vault root.
  await fs.writeFile(path.join(vaultDir, 'note.md'), '# hello');
  await fs.writeFile(path.join(vaultDir, 'secret.txt'), 'nope');

  const res = await fetchJSON(`${baseUrl}/vault/files?glob=*.*`);
  assert.equal(res.status, 200);
  const files = await res.json();
  const names = files.map((f) => path.basename(f.path));
  assert.ok(names.includes('note.md'), 'note.md should be listed');
  assert.ok(!names.includes('secret.txt'), 'secret.txt should NOT be listed');
});

test('conversation PUT preserves arbitrary metadata field through round-trip', async () => {
  const id = 'metadata-test';
  const metadata = {
    advisorSuggestions: ['look here', 'consider this'],
    voteHistory: [{ user: 'a', vote: 1 }],
    summary: 'A bullet list of things',
    summaryMessageCount: 4,
    customField: { nested: { value: 42 } },
  };
  const put = await fetchJSON(`${baseUrl}/vault/conversations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Metadata test',
      advisors: ['x'],
      messages: [{ type: 'user', content: 'hi' }],
      metadata,
    }),
  });
  assert.equal(put.status, 200);

  const get = await fetchJSON(`${baseUrl}/vault/conversations/${id}`);
  const convo = await get.json();
  assert.deepEqual(convo.metadata, metadata);

  // Cleanup.
  await fetchJSON(`${baseUrl}/vault/conversations/${id}`, { method: 'DELETE' });
});

test('GET /vault/file refuses non-markdown extensions', async () => {
  await fs.writeFile(path.join(vaultDir, 'config-file.json'), '{}');
  const res = await fetchJSON(
    `${baseUrl}/vault/file?path=${encodeURIComponent(path.join(vaultDir, 'config-file.json'))}`,
  );
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, 'NOT_MARKDOWN');
});

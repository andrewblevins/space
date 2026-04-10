import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { assertPathAllowed, PathNotAllowedError } from '../paths.js';

async function makeTempDir(label) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), `vault-sidecar-${label}-`));
  return await fs.realpath(dir);
}

test('rejects ../ traversal out of vault', async () => {
  const vault = await makeTempDir('vault');
  await assert.rejects(
    () => assertPathAllowed(path.join(vault, '..', '..', '..', 'etc', 'passwd'), [vault]),
    PathNotAllowedError,
  );
});

test('rejects absolute paths outside vault', async () => {
  const vault = await makeTempDir('vault');
  await assert.rejects(
    () => assertPathAllowed('/etc/passwd', [vault]),
    PathNotAllowedError,
  );
});

test('rejects sibling-prefix attack (/vault vs /vault-evil)', async () => {
  // Build two directories sharing a string prefix.
  const parent = await makeTempDir('siblings');
  const vault = path.join(parent, 'vault');
  const evil = path.join(parent, 'vault-evil');
  await fs.mkdir(vault);
  await fs.mkdir(evil);
  const evilFile = path.join(evil, 'secret.md');
  await fs.writeFile(evilFile, 'pwned');

  await assert.rejects(
    () => assertPathAllowed(evilFile, [vault]),
    PathNotAllowedError,
    'a sibling whose name starts with the vault name must not be accepted',
  );
});

test('accepts files inside the vault', async () => {
  const vault = await makeTempDir('vault');
  const inside = path.join(vault, 'sub', 'note.md');
  await fs.mkdir(path.dirname(inside), { recursive: true });
  await fs.writeFile(inside, 'hello');
  const safe = await assertPathAllowed(inside, [vault]);
  assert.equal(safe, inside);
});

test('accepts paths inside an allowlist entry', async () => {
  const vault = await makeTempDir('vault');
  const extra = await makeTempDir('extra');
  const file = path.join(extra, 'note.md');
  await fs.writeFile(file, 'hi');
  const safe = await assertPathAllowed(file, [vault, extra]);
  assert.equal(safe, file);
});

test('accepts non-existent leaf inside the vault (PUT new file)', async () => {
  const vault = await makeTempDir('vault');
  const newFile = path.join(vault, 'advisors', 'brand-new', 'advisor.md');
  const safe = await assertPathAllowed(newFile, [vault]);
  assert.equal(safe, newFile);
});

test('rejects symlink that escapes the vault', async () => {
  const vault = await makeTempDir('vault');
  const outside = await makeTempDir('outside');
  const secret = path.join(outside, 'secret.md');
  await fs.writeFile(secret, 'top secret');
  const link = path.join(vault, 'escape.md');
  await fs.symlink(secret, link);

  await assert.rejects(
    () => assertPathAllowed(link, [vault]),
    PathNotAllowedError,
    'a symlink inside the vault pointing outside must be rejected',
  );
});

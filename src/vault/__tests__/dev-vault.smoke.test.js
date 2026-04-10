/** @jest-environment node */

// VAULT: smoke test for `npm run dev:vault` — confirms the script starts both
// the sidecar and the Vite dev server, and that Vite's /vault proxy correctly
// forwards to the sidecar. This catches regressions in package.json scripts
// or vite.config.js proxy wiring.
//
// This test is intentionally separate from contract.test.js because it
// exercises the actual concurrently wrapper and Vite, not the sidecar in
// isolation. It is the slowest test in the suite (Vite startup ~5s).
//
// Skipped in CI by default (set RUN_SMOKE=1 to enable). Always runnable locally.

import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { promises as fs } from 'node:fs';

const RUN = process.env.RUN_SMOKE === '1' || process.env.SPACE_RUN_SMOKE === '1';
const maybe = RUN ? describe : describe.skip;

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
        family: 4, // force IPv4 so we don't fight Vite's ::1 binding
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => text,
            json: async () => JSON.parse(text),
          });
        });
      },
    );
    req.on('error', reject);
    if (options.body !== undefined) req.write(options.body);
    req.end();
  });
}

async function waitFor(probe, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const ok = await probe();
      if (ok) return;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`waitFor timed out: ${lastErr && lastErr.message}`);
}

maybe('dev:vault smoke test', () => {
  let proc;
  let tempDir;
  const repoRoot = path.resolve(__dirname, '..', '..', '..');

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'space-dev-smoke-'));
    proc = spawn('npm', ['run', 'dev:vault'], {
      cwd: repoRoot,
      env: { ...process.env, SPACE_VAULT: tempDir, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true, // own process group so we can kill the whole tree
    });
    let out = '';
    proc.stdout.on('data', (c) => { out += c.toString(); });
    proc.stderr.on('data', (c) => { out += c.toString(); });

    await waitFor(async () => {
      // Use the hostname Vite advertises (localhost, IPv6) via family=4 to
      // talk to the IPv4 binding the sidecar uses. Both ports must be live.
      const sidecar = await nodeFetch('http://localhost:3001/vault/health');
      if (!sidecar.ok) return false;
      const vite = await nodeFetch('http://localhost:3000/');
      return vite.ok;
    }, 20000).catch((e) => {
      // eslint-disable-next-line no-console
      console.error(`[smoke] failed; output:\n${out}`);
      throw e;
    });
  }, 30000);

  afterAll(async () => {
    if (proc && proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch {
        proc.kill('SIGTERM');
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('vite proxies /vault/health to the sidecar', async () => {
    const res = await nodeFetch('http://localhost:3000/vault/health', {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.vaultRoot).toContain('space-dev-smoke-');
  });
});

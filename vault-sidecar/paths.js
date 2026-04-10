// paths.js
//
// Single-source-of-truth for path safety. Every filesystem operation in
// server.js MUST go through assertPathAllowed before reading or writing.
//
// The threat model: a localhost HTTP server is reachable from any page the
// user's browser visits. Even with CORS + Origin checks, treating user-
// supplied paths as untrusted is non-negotiable. The two attacks we care
// about:
//
//   1. Traversal: ../../../etc/passwd, absolute paths outside the vault.
//   2. Symlink escape: a symlink inside the vault pointing to /etc.
//
// Mitigations:
//
//   - fs.realpath resolves symlinks to their final on-disk location. We
//     check the resolved path, not the requested one.
//   - For paths that don't yet exist (PUT of a brand new advisor file), we
//     realpath the deepest existing ancestor and reattach the missing
//     suffix. This catches symlinks anywhere along the existing prefix.
//   - The "starts with" check uses `prefix + path.sep` rather than a bare
//     `prefix` so that "/vault" does NOT match a sibling like "/vault-evil".

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class PathNotAllowedError extends Error {
  constructor(message, requestedPath) {
    super(message);
    this.name = 'PathNotAllowedError';
    this.code = 'PATH_NOT_ALLOWED';
    this.requestedPath = requestedPath;
  }
}

/**
 * Expand a leading `~` to the user's home directory and resolve to absolute.
 */
export function expandPath(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return path.resolve(p);
}

/**
 * Resolve a path through symlinks, even if the leaf doesn't exist yet.
 * Walks up the path until it finds an existing ancestor, realpaths it,
 * then reattaches the non-existent suffix.
 */
export async function realpathLeafTolerant(absPath) {
  let current = absPath;
  const tail = [];
  // Loop with a hard cap to defend against pathological inputs.
  for (let i = 0; i < 64; i++) {
    try {
      const real = await fs.realpath(current);
      return tail.length === 0 ? real : path.join(real, ...tail.reverse());
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      const parent = path.dirname(current);
      if (parent === current) {
        // Hit filesystem root without finding anything that exists.
        return path.join(parent, ...tail.reverse());
      }
      tail.push(path.basename(current));
      current = parent;
    }
  }
  throw new Error(`realpathLeafTolerant: too many iterations resolving ${absPath}`);
}

/**
 * Throw PathNotAllowedError unless `requestedPath` resolves inside one of
 * the allowed roots. `allowedRoots` should be an array of already-resolved
 * absolute paths (resolved at server startup, not per-request).
 */
export async function assertPathAllowed(requestedPath, allowedRoots) {
  if (typeof requestedPath !== 'string' || requestedPath.length === 0) {
    throw new PathNotAllowedError('Empty path', requestedPath);
  }
  const expanded = expandPath(requestedPath);
  const absolute = path.resolve(expanded);
  const resolved = await realpathLeafTolerant(absolute);

  for (const root of allowedRoots) {
    // CRITICAL: append path.sep so /vault does not match /vault-evil.
    // Also accept exact equality with the root itself (e.g. listing the
    // vault root directory).
    if (resolved === root || resolved.startsWith(root + path.sep)) {
      return resolved;
    }
  }

  throw new PathNotAllowedError(
    `Path ${requestedPath} resolves to ${resolved}, which is outside the allowlist`,
    requestedPath,
  );
}

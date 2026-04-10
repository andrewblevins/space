// VAULT: bootstrap helpers used by main.jsx and Terminal.jsx during the port.
//
// Why this file exists:
// - main.jsx needs to call prewarmVault() before <App /> mounts. If the
//   sidecar isn't running (the user is running `npm run dev` instead of
//   `npm run dev:vault`) we want a clean fallback to localStorage rather than
//   crashing the app.
// - Terminal.jsx's existing useState initializers can't await fetches. They
//   call into helpers here that decide synchronously whether to read from the
//   vault cache or from localStorage.
// - Terminal.jsx's persistence effects call helpers here that route writes to
//   the same place.
//
// The boolean source of truth is `vaultActive`: set to true if prewarm
// succeeded against a real sidecar. False otherwise (legacy localStorage mode).

import {
  prewarmVault,
  isPrewarmed,
  getPrewarmError,
  getAdvisors as vaultGetAdvisors,
  saveAdvisor as vaultSaveAdvisor,
  setAdvisors as vaultSetAdvisors,
  getAdvisorGroups as vaultGetAdvisorGroups,
  setAdvisorGroups as vaultSetAdvisorGroups,
  getConversationIndex as vaultGetConversationIndex,
  saveConversation as vaultSaveConversation,
  loadConversation as vaultLoadConversation,
  deleteConversation as vaultDeleteConversation,
  getCurrentConversationId as vaultGetCurrentConversationId,
  setCurrentConversationId as vaultSetCurrentConversationId,
} from './vaultAdapter.js';
import * as client from './vaultClient.js';

let vaultActive = false;

/**
 * Try to prewarm the vault. Returns true if the sidecar is reachable and
 * prewarm succeeded; false if we should fall back to localStorage.
 *
 * Called from main.jsx before <App /> mounts.
 */
export async function bootstrapVault() {
  try {
    await prewarmVault();
    if (isPrewarmed() && !getPrewarmError()) {
      vaultActive = true;
      // eslint-disable-next-line no-console
      console.info('[vault] active — reading and writing markdown from sidecar');
      return true;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[vault] prewarm threw — falling back to localStorage', err);
  }

  // Either prewarm failed or recorded an error. Tell the user once.
  // eslint-disable-next-line no-console
  console.info('[vault] inactive — using localStorage. Run `npm run dev:vault` to enable the markdown vault.');
  return false;
}

export function isVaultActive() {
  return vaultActive;
}

// ---- Advisors ---------------------------------------------------------------

/**
 * Sync read of advisors. Routes to the vault cache if active, otherwise
 * reads from localStorage. Used by Terminal.jsx's useState initializer.
 */
export function getInitialAdvisors() {
  if (vaultActive) {
    return vaultGetAdvisors();
  }
  try {
    const saved = localStorage.getItem('space_advisors');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Persist the full advisors array. Vault path: PUT each advisor through the
 * adapter (which queues writes). Legacy path: write the whole array to
 * localStorage as a single JSON blob.
 *
 * Used by both the debounced effect and the immediate-save effect in
 * Terminal.jsx. The vault adapter's per-key write queue handles concurrency.
 */
export function persistAdvisors(advisors) {
  if (vaultActive) {
    // We use vaultSetAdvisors which PUTs every advisor. The adapter caches
    // synchronously so subsequent reads see the new state immediately.
    vaultSetAdvisors(advisors);
    return;
  }
  try {
    if (advisors && advisors.length > 0) {
      localStorage.setItem('space_advisors', JSON.stringify(advisors));
    } else {
      localStorage.removeItem('space_advisors');
    }
  } catch {
    /* legacy localStorage failure — nothing to do */
  }
}

// ---- Advisor groups ---------------------------------------------------------

export function getInitialAdvisorGroups() {
  if (vaultActive) {
    return vaultGetAdvisorGroups();
  }
  try {
    const saved = localStorage.getItem('space_advisor_groups');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function persistAdvisorGroups(groups) {
  if (vaultActive) {
    vaultSetAdvisorGroups(groups);
    return;
  }
  try {
    localStorage.setItem('space_advisor_groups', JSON.stringify(groups));
  } catch {
    /* noop */
  }
}

// Re-export for callers that need slug-aware single-advisor saves (e.g.
// AdvisorForm new-advisor flow).
export { vaultSaveAdvisor };

// ---- Sessions / conversations -----------------------------------------------
//
// Bucket B port: replace localStorage `space_session_{id}` keys with vault
// conversation files at `conversations/{id}/conversation.md`. The session ID
// stays an integer (the sidecar's slug validator accepts numeric strings),
// which keeps Terminal.jsx's existing ID code unchanged.
//
// Terminal.jsx's session shape is:
//   { id, title, timestamp, metadata, messages, summary?, summaryTimestamp?,
//     summaryMessageCount? }
// where metadata holds { advisors, advisorSuggestions, voteHistory, ... }.
//
// We map this onto the vault's conversation shape by:
//   - title       → vault title
//   - advisors    → vault advisors (extracted from metadata.advisors if present)
//   - messages    → vault messages (passed through verbatim)
//   - everything  → vault metadata (a single namespaced field)
//
// The original session shape is reconstructed exactly on read. Round-trip is
// lossless because the vault sidecar passes metadata through unchanged.

function sessionToVaultConvo(session) {
  const advisorList = (session.metadata && session.metadata.advisors) || [];
  // Vault advisors field expects a list of identifiers/names.
  const vaultAdvisors = advisorList.map((a) =>
    typeof a === 'string' ? a : (a.slug || a.name),
  );
  return {
    title: session.title || `Session ${session.id}`,
    advisors: vaultAdvisors,
    messages: session.messages || [],
    metadata: {
      // Stash the full original session payload (minus messages, which live
      // alongside) so round-trip is lossless.
      session: {
        id: session.id,
        title: session.title,
        timestamp: session.timestamp,
        metadata: session.metadata,
        summary: session.summary,
        summaryTimestamp: session.summaryTimestamp,
        summaryMessageCount: session.summaryMessageCount,
      },
    },
  };
}

function vaultConvoToSession(convo) {
  // Prefer the stashed original shape if present (lossless round-trip).
  const stashed = convo.metadata && convo.metadata.session;
  if (stashed) {
    return {
      ...stashed,
      messages: convo.messages || [],
    };
  }
  // Fall back: reconstruct a minimal session from the vault top-level fields.
  return {
    id: convo.id,
    title: convo.title,
    timestamp: convo.createdAt || new Date().toISOString(),
    metadata: { advisors: convo.advisors || [] },
    messages: convo.messages || [],
  };
}

/**
 * Synchronously read all session metadata from the prewarmed vault index, or
 * scan localStorage in legacy mode. Returns an array of session objects with
 * minimal fields ({id, title, timestamp}). Used by SessionPanel and
 * RecentChats to populate their lists at component mount.
 */
export function getInitialSessionIndex() {
  if (vaultActive) {
    return vaultGetConversationIndex().map((entry) => ({
      id: parseIntId(entry.id),
      title: entry.title,
      timestamp: entry.updatedAt || entry.createdAt,
    }));
  }
  // Legacy: scan localStorage for `space_session_*` keys.
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('space_session_')) continue;
      try {
        const session = JSON.parse(localStorage.getItem(key));
        if (session && session.id != null) {
          out.push({
            id: session.id,
            title: session.title,
            timestamp: session.timestamp,
          });
        }
      } catch { /* skip corrupt */ }
    }
  } catch { /* localStorage unavailable */ }
  return out;
}

function parseIntId(id) {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? id : n;
}

/**
 * Compute the next session ID. In vault mode, scans the prewarmed index. In
 * legacy mode, scans localStorage keys. Mirrors Terminal.jsx's getNextSessionId.
 */
export function getNextSessionIdFromStorage() {
  if (vaultActive) {
    const ids = vaultGetConversationIndex()
      .map((c) => parseIntId(c.id))
      .filter((n) => typeof n === 'number' && !Number.isNaN(n));
    if (ids.length === 0) return 1;
    return Math.max(...ids) + 1;
  }
  try {
    const ids = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('space_session_')) continue;
      const n = parseInt(k.replace('space_session_', ''), 10);
      if (!Number.isNaN(n)) ids.push(n);
    }
    if (ids.length === 0) return 1;
    return Math.max(...ids) + 1;
  } catch {
    return 1;
  }
}

/**
 * Load a single session by ID. Async — returns the full session object or null.
 * In vault mode, fetches the conversation and reconstructs the session shape.
 */
export async function loadSessionFromStorage(sessionId) {
  if (vaultActive) {
    try {
      const convo = await vaultLoadConversation(String(sessionId));
      if (!convo) return null;
      return vaultConvoToSession(convo);
    } catch (err) {
      // 404 or transport error — return null to mirror localStorage missing-key.
      if (err && err.status === 404) return null;
      // eslint-disable-next-line no-console
      console.warn(`[vault] loadSessionFromStorage(${sessionId}) failed`, err);
      return null;
    }
  }
  try {
    const raw = localStorage.getItem(`space_session_${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Synchronously read a session from localStorage in legacy mode. Used by call
 * sites that absolutely cannot await (rare; most session reads happen in
 * effects or event handlers). In vault mode this returns null and the caller
 * must use loadSessionFromStorage instead.
 */
export function readSessionSync(sessionId) {
  if (vaultActive) {
    // Vault mode: no synchronous filesystem read possible. Caller should be
    // upgraded to use loadSessionFromStorage.
    return null;
  }
  try {
    const raw = localStorage.getItem(`space_session_${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persist a session. In vault mode, converts to vault conversation shape and
 * fires a queued write. In legacy mode, JSON.stringify into localStorage.
 * Returns a promise that resolves when the write lands (or immediately in
 * legacy mode).
 */
export function persistSession(session) {
  if (!session || session.id == null) return Promise.resolve();
  if (vaultActive) {
    const convo = sessionToVaultConvo(session);
    return vaultSaveConversation(String(session.id), convo);
  }
  try {
    localStorage.setItem(`space_session_${session.id}`, JSON.stringify(session));
  } catch {
    /* noop */
  }
  return Promise.resolve();
}

/**
 * Delete a session by ID.
 */
export function deleteSessionFromStorage(sessionId) {
  if (vaultActive) {
    return vaultDeleteConversation(String(sessionId));
  }
  try {
    localStorage.removeItem(`space_session_${sessionId}`);
  } catch {
    /* noop */
  }
  return Promise.resolve();
}

/**
 * Iterate over all sessions in storage. Used by handlers that need to scan
 * (export, reset-all, summary-of-previous, etc.). Returns an array of full
 * session objects, lazy-loading from the vault if active.
 */
export async function getAllSessionsFromStorage() {
  if (vaultActive) {
    const index = vaultGetConversationIndex();
    const out = [];
    for (const entry of index) {
      try {
        const convo = await vaultLoadConversation(entry.id);
        out.push(vaultConvoToSession(convo));
      } catch {
        /* skip */
      }
    }
    return out;
  }
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('space_session_')) continue;
      try {
        out.push(JSON.parse(localStorage.getItem(key)));
      } catch { /* skip */ }
    }
  } catch { /* noop */ }
  return out;
}

// ---- Current session pointer ------------------------------------------------
//
// Stores `currentSessionId` (and the related currentConversationId for the
// Supabase path) in vault config or localStorage.

export function getInitialCurrentSession() {
  if (vaultActive) {
    const id = vaultGetCurrentConversationId();
    // The vault stores currentConversationId as a string. Convert to int
    // for the legacy session ID slot.
    if (id == null) return { conversationId: null, sessionId: null };
    return { conversationId: null, sessionId: parseIntId(id) };
  }
  try {
    const conversationId = localStorage.getItem('space_current_conversation_id');
    const sessionId = localStorage.getItem('space_current_session_id');
    return {
      conversationId: conversationId || null,
      sessionId: sessionId || null,
    };
  } catch {
    return { conversationId: null, sessionId: null };
  }
}

// ---- Markdown file @-mention --------------------------------------------
//
// In vault mode, the user can @-reference any markdown file in the vault (or
// any directory in SPACE_ALLOWED_PATHS). Selected files get their content
// pulled into the next message as quoted context.
//
// In legacy mode, this returns an empty list — no @-file feature.

/**
 * Search vault markdown files matching a query. Returns at most `limit`
 * file descriptors. Filters by basename. In legacy mode returns [].
 */
export async function searchVaultFiles(query, { limit = 8 } = {}) {
  if (!vaultActive) return [];
  try {
    const files = await client.listFiles('**/*.md');
    const q = (query || '').toLowerCase();
    const filtered = q
      ? files.filter((f) => f.name.toLowerCase().includes(q))
      : files;
    return filtered.slice(0, limit);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[vault] searchVaultFiles failed', err);
    return [];
  }
}

/**
 * Read a single markdown file from the vault and return {path, body, raw}.
 * In legacy mode returns null.
 */
export async function readVaultFile(filePath) {
  if (!vaultActive) return null;
  try {
    return await client.readFile(filePath);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[vault] readVaultFile(${filePath}) failed`, err);
    return null;
  }
}

export function persistCurrentSessionPointer(sessionId, conversationId) {
  if (vaultActive) {
    // Vault mode: only the local sessionId matters; conversationId is the
    // database-mode pointer that vault mode doesn't use.
    if (sessionId != null) {
      vaultSetCurrentConversationId(String(sessionId));
    } else {
      vaultSetCurrentConversationId(null);
    }
    return;
  }
  try {
    if (conversationId) {
      localStorage.setItem('space_current_conversation_id', conversationId);
      localStorage.setItem('space_current_session_id', conversationId);
    } else if (sessionId) {
      localStorage.setItem('space_current_session_id', sessionId.toString());
      localStorage.removeItem('space_current_conversation_id');
    }
  } catch {
    /* noop */
  }
}

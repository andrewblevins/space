// VAULT: synchronous-surface adapter over the async vaultClient.
//
// Why this exists: Terminal.jsx has many `useState(() => localStorage.getItem(...))`
// initializers that can't await. We prewarm an in-memory cache before <App /> mounts
// (see prewarmVault), then expose getX() reads that look synchronous to React,
// and setX() writes that update the cache immediately and queue the network write.

import * as client from './vaultClient.js';

const cache = {
  advisors: null,
  advisorGroups: null,
  conversations: null,        // { [id]: conversation }
  conversationIndex: null,    // [{ id, title, advisors, ... }]
  currentConversationId: null,
  prewarmed: false,
  prewarmError: null,
};

// Per-key serialized write queue. Concurrent writes to the same key chain
// instead of racing.
const writeChains = new Map();

// Derive a URL-safe slug from a name. Used when Terminal.jsx hands us
// advisors that don't carry a slug yet (the legacy localStorage shape was
// {name, description, color} with no slug).
export function slugify(name) {
  if (!name) return 'untitled';
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'untitled';
}

function ensureSlug(advisor) {
  if (advisor.slug && /^[a-zA-Z0-9._-]+$/.test(advisor.slug)) return advisor;
  return { ...advisor, slug: slugify(advisor.name) };
}

function enqueue(key, fn) {
  const prev = writeChains.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  writeChains.set(key, next);
  // Detach from chain head once it settles, so the map doesn't leak forever.
  // IMPORTANT: attach the finally() to a swallowed copy, not to `next` itself.
  // Otherwise the finally() returns a new promise that re-raises the rejection
  // with no handler, producing an unhandled rejection that crashes jest workers.
  next.catch(() => {}).finally(() => {
    if (writeChains.get(key) === next) writeChains.delete(key);
  });
  return next;
}

function fireAndForget(key, label, fn) {
  return enqueue(key, fn).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[vault] write failed: ${label}`, err);
  });
}

function ensurePrewarmed() {
  if (!cache.prewarmed) {
    throw new Error(
      'vault not prewarmed — did you call prewarmVault() in main.jsx?',
    );
  }
}

// ---- Prewarm ----------------------------------------------------------------

export async function prewarmVault() {
  if (cache.prewarmed) return;
  try {
    const [advisors, conversationIndex, config] = await Promise.all([
      client.listAdvisors(),
      client.listConversations(),
      client.getConfig(),
    ]);
    cache.advisors = Array.isArray(advisors) ? advisors : [];
    cache.conversationIndex = Array.isArray(conversationIndex) ? conversationIndex : [];
    cache.conversations = {};
    cache.advisorGroups = Array.isArray(config && config.advisorGroups) ? config.advisorGroups : [];
    cache.currentConversationId = (config && config.currentConversationId) ?? null;
  } catch (err) {
    cache.prewarmError = err;
    // Defaults so sync reads don't blow up if the app chooses to render anyway.
    cache.advisors = cache.advisors || [];
    cache.conversationIndex = cache.conversationIndex || [];
    cache.conversations = cache.conversations || {};
    cache.advisorGroups = cache.advisorGroups || [];
  } finally {
    cache.prewarmed = true;
  }
}

export function isPrewarmed() {
  return cache.prewarmed;
}

export function getPrewarmError() {
  return cache.prewarmError;
}

// Test-only helper. Not part of the public surface.
export function __resetVaultAdapter() {
  cache.advisors = null;
  cache.advisorGroups = null;
  cache.conversations = null;
  cache.conversationIndex = null;
  cache.currentConversationId = null;
  cache.prewarmed = false;
  cache.prewarmError = null;
  writeChains.clear();
}

// ---- Sync reads -------------------------------------------------------------

export function getAdvisors() {
  ensurePrewarmed();
  return cache.advisors;
}

export function getAdvisorGroups() {
  ensurePrewarmed();
  return cache.advisorGroups;
}

export function getConversationIndex() {
  ensurePrewarmed();
  return cache.conversationIndex;
}

export function getCurrentConversationId() {
  ensurePrewarmed();
  return cache.currentConversationId;
}

export function getConversation(id) {
  ensurePrewarmed();
  return cache.conversations[id];
}

// ---- Writes -----------------------------------------------------------------

export function setAdvisors(advisors) {
  ensurePrewarmed();
  // Derive slugs for any advisors that don't carry one (e.g. created in
  // legacy mode and now being persisted to the vault). This mutates the
  // cached objects so subsequent reads see the slug.
  const withSlugs = (Array.isArray(advisors) ? advisors : []).map(ensureSlug);
  cache.advisors = withSlugs;
  // Diff-and-write each advisor. We can't tell here whether something was
  // deleted vs renamed, so MVP behavior is: PUT every advisor in the new list.
  // Deletions are handled separately by callers via deleteAdvisor().
  return Promise.all(
    cache.advisors.map((adv) =>
      fireAndForget(`advisor:${adv.slug}`, `advisor ${adv.slug}`, () =>
        client.saveAdvisor(adv.slug, {
          name: adv.name,
          description: adv.description,
          color: adv.color,
        }),
      ),
    ),
  );
}

export function saveAdvisor(advisor) {
  ensurePrewarmed();
  const withSlug = ensureSlug(advisor);
  const idx = cache.advisors.findIndex((a) => a.slug === withSlug.slug);
  if (idx >= 0) cache.advisors[idx] = { ...cache.advisors[idx], ...withSlug };
  else cache.advisors = [...cache.advisors, withSlug];
  return fireAndForget(`advisor:${withSlug.slug}`, `advisor ${withSlug.slug}`, () =>
    client.saveAdvisor(withSlug.slug, {
      name: advisor.name,
      description: advisor.description,
      color: advisor.color,
    }),
  );
}

export function deleteAdvisor(slug) {
  ensurePrewarmed();
  cache.advisors = cache.advisors.filter((a) => a.slug !== slug);
  return fireAndForget(`advisor:${slug}`, `delete advisor ${slug}`, () =>
    client.deleteAdvisor(slug),
  );
}

// Persisting config is fire-and-forget through a single "config" queue so
// concurrent setAdvisorGroups/setCurrentConversationId calls serialize and
// the most recent cache values always win.
function flushConfig() {
  return fireAndForget('config', 'config', () =>
    client.saveConfig({
      advisorGroups: cache.advisorGroups,
      currentConversationId: cache.currentConversationId,
    }),
  );
}

export function setAdvisorGroups(groups) {
  ensurePrewarmed();
  cache.advisorGroups = Array.isArray(groups) ? groups : [];
  return flushConfig();
}

export function setCurrentConversationId(id) {
  ensurePrewarmed();
  cache.currentConversationId = id;
  return flushConfig();
}

export async function loadConversation(id) {
  ensurePrewarmed();
  const convo = await client.loadConversation(id);
  cache.conversations[id] = convo;
  return convo;
}

export function saveConversation(id, convo) {
  ensurePrewarmed();
  cache.conversations[id] = { ...convo, id };

  // Update or insert the index entry.
  const indexEntry = {
    id,
    title: convo.title,
    advisors: convo.advisors,
    updatedAt: new Date().toISOString(),
  };
  const idx = cache.conversationIndex.findIndex((c) => c.id === id);
  if (idx >= 0) {
    cache.conversationIndex[idx] = { ...cache.conversationIndex[idx], ...indexEntry };
  } else {
    cache.conversationIndex = [...cache.conversationIndex, indexEntry];
  }

  return fireAndForget(`conversation:${id}`, `conversation ${id}`, () =>
    client.saveConversation(id, {
      title: convo.title,
      advisors: convo.advisors,
      messages: convo.messages,
      metadata: convo.metadata,
    }),
  );
}

export function deleteConversation(id) {
  ensurePrewarmed();
  delete cache.conversations[id];
  cache.conversationIndex = cache.conversationIndex.filter((c) => c.id !== id);
  return fireAndForget(`conversation:${id}`, `delete conversation ${id}`, () =>
    client.deleteConversation(id),
  );
}

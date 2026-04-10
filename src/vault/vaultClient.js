// VAULT: thin fetch wrapper around the local sidecar HTTP API.
// Pure transport — no caching, no retries. See docs/reshape/mvp-proposal.md.

export let VAULT_BASE = '/vault';

// Test hook so jest tests can swap the base URL without env tricks.
export function __setVaultBase(base) {
  VAULT_BASE = base;
}

export class VaultError extends Error {
  constructor(message, { status = 0, code = 'vault_error', cause } = {}) {
    super(message);
    this.name = 'VaultError';
    this.status = status;
    this.code = code;
    if (cause) this.cause = cause;
  }
}

async function request(path, { method = 'GET', body, query } = {}) {
  let url = `${VAULT_BASE}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    const qstr = qs.toString();
    if (qstr) url += `?${qstr}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new VaultError(`vault request failed: ${err.message}`, {
      code: 'network_error',
      cause: err,
    });
  }

  if (!res.ok) {
    let detail = '';
    let code = 'http_error';
    try {
      const data = await res.json();
      detail = data.error || data.message || '';
      if (data.code) code = data.code;
    } catch {
      try { detail = await res.text(); } catch { /* noop */ }
    }
    throw new VaultError(
      `vault ${method} ${path} failed: ${res.status}${detail ? ` ${detail}` : ''}`,
      { status: res.status, code },
    );
  }

  if (res.status === 204) return null;
  // Health endpoint may return JSON or plain text; tolerate both.
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export function health() {
  return request('/health');
}

export async function isVaultAvailable() {
  try {
    await health();
    return true;
  } catch {
    return false;
  }
}

export function listAdvisors() {
  return request('/advisors');
}

export function saveAdvisor(slug, { name, description, color }) {
  return request(`/advisors/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    body: { name, description, color },
  });
}

export function deleteAdvisor(slug) {
  return request(`/advisors/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}

export function listConversations() {
  return request('/conversations');
}

export function loadConversation(id) {
  return request(`/conversations/${encodeURIComponent(id)}`);
}

export function saveConversation(id, { title, advisors, messages, metadata }) {
  return request(`/conversations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { title, advisors, messages, metadata },
  });
}

export function deleteConversation(id) {
  return request(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function listFiles(glob) {
  return request('/files', { query: { glob } });
}

export function readFile(path) {
  return request('/file', { query: { path } });
}

export function getConfig() {
  return request('/config');
}

export function saveConfig({ advisorGroups, currentConversationId }) {
  return request('/config', {
    method: 'PUT',
    body: { advisorGroups, currentConversationId },
  });
}

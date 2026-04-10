// VAULT: tests for bootstrap.js — the dual-mode (vault active vs legacy
// localStorage) shim used by Terminal.jsx during the port.

import {
  bootstrapVault,
  isVaultActive,
  getInitialAdvisors,
  persistAdvisors,
  getInitialAdvisorGroups,
  persistAdvisorGroups,
  getInitialSessionIndex,
  getNextSessionIdFromStorage,
  loadSessionFromStorage,
  readSessionSync,
  persistSession,
  deleteSessionFromStorage,
  getAllSessionsFromStorage,
  getInitialCurrentSession,
  persistCurrentSessionPointer,
} from '../bootstrap.js';
import { __resetVaultAdapter } from '../vaultAdapter.js';

let lsStore;

function installLocalStorageMock() {
  lsStore = {};
  const ls = {
    getItem: jest.fn((k) => (k in lsStore ? lsStore[k] : null)),
    setItem: jest.fn((k, v) => { lsStore[k] = String(v); }),
    removeItem: jest.fn((k) => { delete lsStore[k]; }),
    clear: jest.fn(() => { lsStore = {}; }),
    get length() { return Object.keys(lsStore).length; },
    key: jest.fn((i) => Object.keys(lsStore)[i] || null),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true, configurable: true });
}

function mockOk(body) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => {
  __resetVaultAdapter();
  installLocalStorageMock();
  // Reset module-scope vaultActive flag by re-importing.
  // bootstrap.js doesn't expose a reset hook, so we just rely on the test
  // ordering: legacy tests run before vault tests use bootstrapVault.
});

afterEach(() => {
  delete global.fetch;
});

describe('bootstrap in legacy localStorage mode', () => {
  test('isVaultActive is false before bootstrapVault is called', () => {
    expect(isVaultActive()).toBe(false);
  });

  test('getInitialAdvisors reads from localStorage when vault inactive', () => {
    lsStore['space_advisors'] = JSON.stringify([
      { name: 'L', description: 'd', color: 'bg-amber-600' },
    ]);
    const result = getInitialAdvisors();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('L');
  });

  test('persistAdvisors writes to localStorage when vault inactive', () => {
    persistAdvisors([{ name: 'X', description: 'y', color: 'bg-violet-600' }]);
    expect(lsStore['space_advisors']).toBeDefined();
    expect(JSON.parse(lsStore['space_advisors'])).toHaveLength(1);
  });

  test('persistAdvisors removes the key when given an empty array', () => {
    lsStore['space_advisors'] = '[]';
    persistAdvisors([]);
    expect(lsStore['space_advisors']).toBeUndefined();
  });

  test('getInitialAdvisorGroups falls back to localStorage', () => {
    lsStore['space_advisor_groups'] = JSON.stringify([{ name: 'g', advisors: ['a'] }]);
    expect(getInitialAdvisorGroups()).toEqual([{ name: 'g', advisors: ['a'] }]);
  });
});

describe('bootstrap session helpers — legacy mode', () => {
  test('getInitialSessionIndex reads sessions from localStorage', () => {
    lsStore['space_session_1'] = JSON.stringify({ id: 1, title: 'one', timestamp: 't1' });
    lsStore['space_session_2'] = JSON.stringify({ id: 2, title: 'two', timestamp: 't2' });
    lsStore['unrelated_key'] = 'ignore me';
    const idx = getInitialSessionIndex();
    expect(idx).toHaveLength(2);
    expect(idx.map((s) => s.id).sort()).toEqual([1, 2]);
  });

  test('getNextSessionIdFromStorage returns max+1', () => {
    lsStore['space_session_3'] = JSON.stringify({ id: 3 });
    lsStore['space_session_5'] = JSON.stringify({ id: 5 });
    expect(getNextSessionIdFromStorage()).toBe(6);
  });

  test('getNextSessionIdFromStorage returns 1 on empty storage', () => {
    expect(getNextSessionIdFromStorage()).toBe(1);
  });

  test('persistSession writes JSON to localStorage', async () => {
    await persistSession({
      id: 7,
      title: 'seven',
      timestamp: 't',
      messages: [{ type: 'user', content: 'hi' }],
    });
    expect(lsStore['space_session_7']).toBeDefined();
    const stored = JSON.parse(lsStore['space_session_7']);
    expect(stored.id).toBe(7);
    expect(stored.messages).toHaveLength(1);
  });

  test('readSessionSync returns the parsed session in legacy mode', () => {
    lsStore['space_session_9'] = JSON.stringify({ id: 9, title: 'nine' });
    const s = readSessionSync(9);
    expect(s.id).toBe(9);
    expect(s.title).toBe('nine');
  });

  test('deleteSessionFromStorage removes the key', async () => {
    lsStore['space_session_4'] = JSON.stringify({ id: 4 });
    await deleteSessionFromStorage(4);
    expect(lsStore['space_session_4']).toBeUndefined();
  });

  test('getInitialCurrentSession reads current pointers from localStorage', () => {
    lsStore['space_current_session_id'] = '12';
    lsStore['space_current_conversation_id'] = 'abc';
    const cur = getInitialCurrentSession();
    expect(cur.sessionId).toBe('12');
    expect(cur.conversationId).toBe('abc');
  });

  test('persistCurrentSessionPointer writes pointers to localStorage', () => {
    persistCurrentSessionPointer(42, null);
    expect(lsStore['space_current_session_id']).toBe('42');
    expect(lsStore['space_current_conversation_id']).toBeUndefined();

    persistCurrentSessionPointer(null, 'db-conv-id');
    expect(lsStore['space_current_conversation_id']).toBe('db-conv-id');
  });
});

describe('bootstrap in active vault mode', () => {
  test('bootstrapVault returns true when sidecar is reachable', async () => {
    let advisorsPut = null;
    global.fetch = jest.fn(async (url, init) => {
      if (url.endsWith('/vault/advisors') && (!init || init.method === 'GET')) {
        return mockOk([{ slug: 's', name: 'S', description: 'd', color: 'bg-amber-600' }]);
      }
      if (url.endsWith('/vault/conversations') && (!init || init.method === 'GET')) {
        return mockOk([]);
      }
      if (url.endsWith('/vault/config') && (!init || init.method === 'GET')) {
        return mockOk({ advisorGroups: [], currentConversationId: null });
      }
      if (url.includes('/vault/advisors/') && init && init.method === 'PUT') {
        advisorsPut = JSON.parse(init.body);
        return mockOk({ ok: true });
      }
      return mockOk({ ok: true });
    });

    const ok = await bootstrapVault();
    expect(ok).toBe(true);
    expect(isVaultActive()).toBe(true);

    // After activation, getInitialAdvisors should come from the vault, not LS.
    lsStore['space_advisors'] = JSON.stringify([{ name: 'leftover', description: 'd' }]);
    const result = getInitialAdvisors();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('s'); // came from vault, not from LS

    // persistAdvisors should write to vault, not LS.
    persistAdvisors([{ slug: 's', name: 'S', description: 'd2', color: 'bg-amber-600' }]);
    // Wait for the queued write.
    await new Promise((r) => setTimeout(r, 30));
    expect(advisorsPut).not.toBeNull();
    expect(advisorsPut.description).toBe('d2');
  });
});

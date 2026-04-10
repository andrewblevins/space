// VAULT: tests for vaultAdapter — cache, sync reads, queued writes, error handling.

import {
  prewarmVault,
  isPrewarmed,
  getPrewarmError,
  getAdvisors,
  getAdvisorGroups,
  getConversationIndex,
  getConversation,
  getCurrentConversationId,
  setAdvisors,
  setAdvisorGroups,
  setCurrentConversationId,
  saveAdvisor,
  saveConversation,
  loadConversation,
  slugify,
  __resetVaultAdapter,
} from '../vaultAdapter.js';

// Sequence of fetch responses for deterministic ordering assertions.
let fetchCalls;
let fetchImpl;

function mockFetchOk(body, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

beforeEach(() => {
  __resetVaultAdapter();
  fetchCalls = [];
  fetchImpl = jest.fn(async (url, init) => {
    fetchCalls.push({ url, method: (init && init.method) || 'GET', body: init && init.body });
    if (url.endsWith('/vault/advisors') && (!init || init.method === 'GET' || init.method === undefined)) {
      return mockFetchOk([
        { slug: 'pragmatist', name: 'The Pragmatist', description: 'desc', color: 'bg-amber-600' },
      ]);
    }
    if (url.endsWith('/vault/conversations') && (!init || !init.method || init.method === 'GET')) {
      return mockFetchOk([
        { id: 'conv-1', title: 'first', advisors: ['pragmatist'] },
      ]);
    }
    if (url.includes('/vault/conversations/') && (!init || !init.method || init.method === 'GET')) {
      return mockFetchOk({
        id: 'conv-1', title: 'first', advisors: ['pragmatist'], messages: [{ type: 'user', content: 'hi' }],
      });
    }
    if (url.endsWith('/vault/config') && (!init || !init.method || init.method === 'GET')) {
      return mockFetchOk({
        advisorGroups: [{ name: 'Core', advisors: ['pragmatist'] }],
        currentConversationId: 'conv-1',
      });
    }
    return mockFetchOk({ ok: true });
  });
  global.fetch = fetchImpl;
});

afterEach(() => {
  delete global.fetch;
});

describe('prewarm', () => {
  test('populates cache from list endpoints', async () => {
    expect(isPrewarmed()).toBe(false);
    await prewarmVault();
    expect(isPrewarmed()).toBe(true);
    expect(getPrewarmError()).toBeNull();
    expect(getAdvisors()).toHaveLength(1);
    expect(getConversationIndex()).toHaveLength(1);
  });

  test('marks prewarmed=true even on failure, records error', async () => {
    global.fetch = jest.fn(async () => { throw new Error('boom'); });
    await prewarmVault();
    expect(isPrewarmed()).toBe(true);
    expect(getPrewarmError()).toBeTruthy();
    expect(getAdvisors()).toEqual([]); // safe defaults
  });
});

describe('sync reads', () => {
  test('throw if not prewarmed', () => {
    expect(() => getAdvisors()).toThrow(/prewarm/);
    expect(() => getConversationIndex()).toThrow(/prewarm/);
  });

  test('return cached data after prewarm', async () => {
    await prewarmVault();
    expect(getAdvisors()[0].slug).toBe('pragmatist');
  });
});

describe('writes', () => {
  test('setAdvisors updates cache synchronously and queues network writes', async () => {
    await prewarmVault();
    fetchCalls.length = 0;

    const newAdvisors = [
      { slug: 'mystic', name: 'The Mystic', description: 'd', color: 'bg-violet-600' },
    ];
    const p = setAdvisors(newAdvisors);
    // Synchronous cache update:
    expect(getAdvisors()).toEqual(newAdvisors);
    await p;
    const puts = fetchCalls.filter((c) => c.method === 'PUT');
    expect(puts.length).toBe(1);
    expect(puts[0].url).toContain('/vault/advisors/mystic');
  });

  test('concurrent writes to the same advisor slug serialize', async () => {
    await prewarmVault();
    fetchCalls.length = 0;

    let resolveFirst;
    const order = [];
    global.fetch = jest.fn(async (url, init) => {
      fetchCalls.push({ url, method: init.method });
      if (url.includes('/advisors/x')) {
        order.push(`start:${JSON.parse(init.body).description}`);
        if (JSON.parse(init.body).description === 'one') {
          await new Promise((r) => { resolveFirst = r; });
        }
        order.push(`end:${JSON.parse(init.body).description}`);
      }
      return mockFetchOk({ ok: true });
    });

    const p1 = saveAdvisor({ slug: 'x', name: 'X', description: 'one', color: 'c' });
    const p2 = saveAdvisor({ slug: 'x', name: 'X', description: 'two', color: 'c' });

    // Let microtasks flush so the first fetch starts.
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(order).toEqual(['start:one']); // second hasn't started
    resolveFirst();
    await Promise.all([p1, p2]);
    expect(order).toEqual(['start:one', 'end:one', 'start:two', 'end:two']);
  });

  test('failed write logs but does not throw', async () => {
    await prewarmVault();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'nope' }),
      text: async () => 'nope',
    }));

    await expect(
      saveAdvisor({ slug: 'broken', name: 'B', description: 'd', color: 'c' }),
    ).resolves.toBeUndefined();

    expect(errSpy).toHaveBeenCalled();
    expect(errSpy.mock.calls[0][0]).toMatch(/\[vault\] write failed/);
    errSpy.mockRestore();
  });

  test('saveConversation updates full cache entry and index entry', async () => {
    await prewarmVault();

    await saveConversation('conv-2', {
      title: 'second',
      advisors: ['mystic'],
      messages: [{ type: 'user', content: 'hi' }],
    });

    expect(getConversation('conv-2')).toMatchObject({
      id: 'conv-2',
      title: 'second',
    });
    const idxEntry = getConversationIndex().find((c) => c.id === 'conv-2');
    expect(idxEntry).toBeDefined();
    expect(idxEntry.title).toBe('second');
  });

  test('setAdvisors derives slugs for advisors that do not carry one', async () => {
    await prewarmVault();
    fetchCalls.length = 0;

    // Legacy shape: no slug field, only name/description/color.
    const legacy = [
      { name: 'The Pragmatist', description: 'd', color: 'bg-amber-600' },
      { name: 'The Mystic!', description: 'd', color: 'bg-violet-600' },
    ];
    setAdvisors(legacy);

    // Cache should now have slugs assigned.
    const cached = getAdvisors();
    expect(cached[0].slug).toBe('the-pragmatist');
    expect(cached[1].slug).toBe('the-mystic');

    // The PUT URLs should use the derived slugs, not 'undefined'.
    await new Promise((r) => setTimeout(r, 30));
    const puts = fetchCalls.filter((c) => c.method === 'PUT');
    expect(puts).toHaveLength(2);
    expect(puts.some((p) => p.url.includes('/advisors/the-pragmatist'))).toBe(true);
    expect(puts.some((p) => p.url.includes('/advisors/the-mystic'))).toBe(true);
  });

  test('slugify produces URL-safe slugs', () => {
    expect(slugify('The Pragmatist')).toBe('the-pragmatist');
    expect(slugify('The Mystic!')).toBe('the-mystic');
    expect(slugify('  spaces  ')).toBe('spaces');
    expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    expect(slugify('weird/chars$$$')).toBe('weird-chars');
    expect(slugify('')).toBe('untitled');
    expect(slugify(undefined)).toBe('untitled');
  });

  test('loadConversation caches the result', async () => {
    await prewarmVault();
    const convo = await loadConversation('conv-1');
    expect(convo.id).toBe('conv-1');
    expect(getConversation('conv-1')).toEqual(convo);
  });
});

describe('config (advisor groups and current conversation id)', () => {
  test('prewarm loads config from sidecar', async () => {
    await prewarmVault();
    expect(getAdvisorGroups()).toEqual([{ name: 'Core', advisors: ['pragmatist'] }]);
    expect(getCurrentConversationId()).toBe('conv-1');
  });

  test('setAdvisorGroups updates cache and persists via PUT /vault/config', async () => {
    await prewarmVault();
    fetchCalls.length = 0;

    const next = [{ name: 'Challengers', advisors: ['socrates'] }];
    await setAdvisorGroups(next);

    expect(getAdvisorGroups()).toEqual(next);
    const puts = fetchCalls.filter((c) => c.method === 'PUT' && c.url.endsWith('/vault/config'));
    expect(puts.length).toBe(1);
    const body = JSON.parse(puts[0].body);
    expect(body.advisorGroups).toEqual(next);
  });

  test('setCurrentConversationId updates cache and persists via PUT /vault/config', async () => {
    await prewarmVault();
    fetchCalls.length = 0;

    await setCurrentConversationId('conv-42');

    expect(getCurrentConversationId()).toBe('conv-42');
    const puts = fetchCalls.filter((c) => c.method === 'PUT' && c.url.endsWith('/vault/config'));
    expect(puts.length).toBe(1);
    const body = JSON.parse(puts[0].body);
    expect(body.currentConversationId).toBe('conv-42');
  });
});

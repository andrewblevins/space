// VAULT: tests for the advisor init logic that Terminal.jsx will use after
// the bucket-A port. This test exercises the adapter at the level Terminal.jsx
// will call it, including the auto-color-assignment side effect that the
// original useState initializer performed.
//
// Why it lives here, not as a Terminal.jsx render test: Terminal.jsx is ~3900
// lines and instantiating it in jsdom drags in dozens of other concerns. The
// port's risk is in this slice of logic, so this is where we test it.

import {
  prewarmVault,
  getAdvisors,
  saveAdvisor,
  __resetVaultAdapter,
} from '../vaultAdapter.js';

const ADVISOR_COLORS = [
  'bg-amber-600',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-sky-600',
];

// Simulate Terminal.jsx's auto-color-assignment side effect, ported to the
// vault adapter. This is the function we'll inline into Terminal.jsx during
// the port.
function initAdvisorsFromVault() {
  const saved = getAdvisors();

  const assignedColors = saved.filter((a) => a.color).map((a) => a.color);
  const updated = [];
  let hasChanges = false;

  for (const advisor of saved) {
    if (advisor.color) {
      updated.push(advisor);
      continue;
    }
    const available = ADVISOR_COLORS.filter((c) => !assignedColors.includes(c));
    const next = available[0] || ADVISOR_COLORS[assignedColors.length % ADVISOR_COLORS.length];
    assignedColors.push(next);
    updated.push({ ...advisor, color: next });
    hasChanges = true;
  }

  if (hasChanges) {
    // Persist each newly-colored advisor.
    for (const a of updated) saveAdvisor(a);
  }

  return updated;
}

let fetchCalls;

beforeEach(() => {
  __resetVaultAdapter();
  fetchCalls = [];
  global.fetch = jest.fn(async (url, init) => {
    fetchCalls.push({ url, method: (init && init.method) || 'GET', body: init && init.body });
    if (url.endsWith('/vault/advisors') && (!init || init.method === 'GET')) {
      return mockOk(beforeAdvisors);
    }
    if (url.endsWith('/vault/conversations') && (!init || init.method === 'GET')) {
      return mockOk([]);
    }
    if (url.endsWith('/vault/config') && (!init || init.method === 'GET')) {
      return mockOk({ advisorGroups: [], currentConversationId: null });
    }
    return mockOk({ ok: true });
  });
});

afterEach(() => {
  delete global.fetch;
});

let beforeAdvisors = [];
function mockOk(body) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('advisor init from vault', () => {
  test('empty vault yields empty advisors array, no writes', async () => {
    beforeAdvisors = [];
    await prewarmVault();
    const result = initAdvisorsFromVault();
    expect(result).toEqual([]);
    const puts = fetchCalls.filter((c) => c.method === 'PUT');
    expect(puts).toHaveLength(0);
  });

  test('vault with two fully-colored advisors round-trips unchanged', async () => {
    beforeAdvisors = [
      { slug: 'pragmatist', name: 'The Pragmatist', description: 'd', color: 'bg-amber-600' },
      { slug: 'mystic', name: 'The Mystic', description: 'd', color: 'bg-violet-600' },
    ];
    await prewarmVault();
    fetchCalls.length = 0;
    const result = initAdvisorsFromVault();
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.color)).toEqual(['bg-amber-600', 'bg-violet-600']);
    const puts = fetchCalls.filter((c) => c.method === 'PUT');
    expect(puts).toHaveLength(0); // no rewrite needed
  });

  test('vault with an uncolored advisor gets a color assigned and persisted', async () => {
    beforeAdvisors = [
      { slug: 'pragmatist', name: 'The Pragmatist', description: 'd', color: 'bg-amber-600' },
      { slug: 'unknown', name: 'Unknown', description: 'd', color: null },
    ];
    await prewarmVault();
    fetchCalls.length = 0;
    const result = initAdvisorsFromVault();
    expect(result).toHaveLength(2);
    expect(result[1].color).toBeTruthy();
    expect(result[1].color).not.toBe('bg-amber-600'); // not the one already taken

    // Wait microtasks for queued writes.
    await new Promise((r) => setTimeout(r, 20));
    const puts = fetchCalls.filter((c) => c.method === 'PUT');
    expect(puts.length).toBeGreaterThan(0);
  });

  test('newly created advisor persists via saveAdvisor', async () => {
    beforeAdvisors = [];
    await prewarmVault();
    fetchCalls.length = 0;

    saveAdvisor({
      slug: 'fresh',
      name: 'Fresh',
      description: 'A new voice.',
      color: 'bg-sky-600',
    });
    await new Promise((r) => setTimeout(r, 20));

    const puts = fetchCalls.filter((c) => c.method === 'PUT' && c.url.includes('/vault/advisors/fresh'));
    expect(puts).toHaveLength(1);
    const body = JSON.parse(puts[0].body);
    expect(body.name).toBe('Fresh');
    expect(body.color).toBe('bg-sky-600');

    // Cache reflects the new advisor.
    expect(getAdvisors().find((a) => a.slug === 'fresh')).toBeDefined();
  });
});

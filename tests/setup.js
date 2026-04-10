// Test setup for infinite loop bug detection
import '@testing-library/jest-dom';

// VAULT: bail out of jsdom-specific setup when the test file declares
// @jest-environment node. The vault contract and smoke tests don't need
// (and can't have) window/localStorage/etc.
if (typeof window === 'undefined') {
  // Running in node env — nothing else in this file applies.
  // Use a globalThis flag so the rest of the file can short-circuit.
  globalThis.__SKIP_JSDOM_SETUP__ = true;
}
if (!globalThis.__SKIP_JSDOM_SETUP__) {

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock crypto for secure storage
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      generateKey: jest.fn(),
      deriveBits: jest.fn(),
      importKey: jest.fn(),
    },
    getRandomValues: jest.fn().mockReturnValue(new Uint8Array(16)),
  },
});

// Suppress console warnings in tests unless specifically testing them
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes('Maximum update depth')) {
    // Let these through for our tests
    originalWarn(...args);
  }
  // Suppress other warnings
};

// Set up fake timers for tests that need them
beforeEach(() => {
  jest.clearAllTimers();
});

} // VAULT: end !globalThis.__SKIP_JSDOM_SETUP__ guard
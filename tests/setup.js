// Test setup for infinite loop bug detection
import '@testing-library/jest-dom';

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
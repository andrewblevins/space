export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^../src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@fontsource/.*$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.jsx',
    '<rootDir>/src/**/__tests__/*.test.js', // VAULT: vault module tests
    '<rootDir>/src/**/__tests__/*.test.jsx' // VAULT: vault module tests
  ],
  // VAULT: ignore conductor worktrees which pollute the haste map
  testPathIgnorePatterns: ['/node_modules/', '/.conductor/'],
  modulePathIgnorePatterns: ['/.conductor/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/index.js',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  testTimeout: 10000,
  verbose: true,
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
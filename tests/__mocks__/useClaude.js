// Mock for useClaude hook
export const useClaude = jest.fn(() => ({
  callClaude: jest.fn(() => Promise.resolve('Mock Claude response'))
}));

export default useClaude;
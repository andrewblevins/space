// Mock for memory system
export class MemorySystem {
  constructor() {
    this.sessions = [];
  }
  
  saveSession = jest.fn();
  loadSession = jest.fn(() => ({ messages: [] }));
  getAllSessions = jest.fn(() => []);
  deleteSession = jest.fn();
  searchSessions = jest.fn(() => []);
}
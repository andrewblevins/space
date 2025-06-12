// Mock for secureStorage utilities
export const hasEncryptedData = jest.fn(() => false);
export const getDecrypted = jest.fn(() => Promise.resolve('mock-key'));
export const setEncrypted = jest.fn(() => Promise.resolve());
export const removeEncrypted = jest.fn(() => Promise.resolve());
export const setModalController = jest.fn();

// Default export
export default {
  hasEncryptedData,
  getDecrypted,
  setEncrypted,
  removeEncrypted,
  setModalController,
};
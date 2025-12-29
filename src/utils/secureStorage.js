/**
 * Simple localStorage wrapper for API key storage
 * No encryption - keys are stored in plain text in localStorage
 */

/**
 * Check if there's any stored API key data
 * @returns {boolean} True if API keys exist
 */
export const hasEncryptedData = () => {
  return localStorage.getItem('space_openrouter_key') !== null ||
         localStorage.getItem('space_anthropic_key') !== null ||
         localStorage.getItem('space_openai_key') !== null;
};

/**
 * Stores a value in localStorage
 * @param {string} key - The localStorage key
 * @param {string} value - The value to store
 * @returns {Promise<void>}
 */
export const setEncrypted = async (key, value) => {
  localStorage.setItem(key, value);
};

/**
 * Retrieves a value from localStorage
 * @param {string} key - The localStorage key
 * @returns {Promise<string|null>} The value or null if not found
 */
export const getDecrypted = async (key) => {
  return localStorage.getItem(key);
};

/**
 * Removes a value from localStorage
 * @param {string} key - The localStorage key to remove
 */
export const removeEncrypted = (key) => {
  localStorage.removeItem(key);
};

/**
 * Helper function to get an API key by short name
 * Maps short names like 'openrouter' to full keys like 'space_openrouter_key'
 * @param {string} keyName - Short name: 'openrouter', 'anthropic', 'openai', 'gemini'
 * @returns {Promise<string|null>} The key value or null
 */
export const getDecryptedKey = async (keyName) => {
  const keyMap = {
    'openrouter': 'space_openrouter_key',
    'anthropic': 'space_anthropic_key',
    'openai': 'space_openai_key',
    'gemini': 'space_gemini_key'
  };

  const fullKey = keyMap[keyName] || `space_${keyName}_key`;
  return localStorage.getItem(fullKey);
};

// Legacy exports for compatibility - these are now no-ops
export const setModalController = () => {};
export const hasSessionToken = () => false;
export const hasValidSession = () => false;
export const tryRestoreSession = () => null;
export const createSession = () => {};
export const clearSession = () => {};
export const validateSession = () => false;
export const canUseExistingSession = () => false;
export const extractPasswordFromSession = () => null;

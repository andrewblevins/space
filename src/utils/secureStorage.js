/**
 * Simple utility for encrypting/decrypting localStorage values
 * Note: This is a quick solution to improve security, but not perfect
 * A proper solution would use a server-side proxy with LiteLLM
 */

// CryptoJS is loaded via CDN in index.html
const CryptoJS = window.CryptoJS;

// Simple salt to make encryption a bit stronger
const ENCRYPTION_SALT = "SPACE_Terminal_Salt";

// Session management constants
const SESSION_STORAGE_KEY = "space_session_token";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Global reference to the modal controller - set by the app on initialization
 */
let modalController = null;

/**
 * Sets the modal controller instance for the secure storage utility
 * @param {Object} controller - Modal controller instance with requestPassword, confirmAction, showAlert
 */
export const setModalController = (controller) => {
  modalController = controller;
};

/**
 * Prompts user for a password to encrypt/decrypt API keys
 * Stores the password temporarily in memory during the session
 */
let encryptionPassword = null;

// Track failed password attempts
let failedAttempts = 0;
const MAX_ATTEMPTS = 3;

/**
 * Reset stored keys and password when user has forgotten their password
 */
const resetEncryptedKeys = () => {
  // Clear the stored API keys
  localStorage.removeItem('space_anthropic_key');
  localStorage.removeItem('space_openai_key');
  
  // Reset the password and attempt counter
  encryptionPassword = null;
  failedAttempts = 0;
  
  if (modalController) {
    modalController.showAlert("API keys have been cleared. You'll need to enter new API keys.");
  } else {
    alert("API keys have been cleared. You'll need to enter new API keys.");
  }
  
  // Reload the page to show the API key entry form
  window.location.reload();
};

/**
 * Check if there's any encrypted data in localStorage
 * @returns {boolean} True if encrypted API keys exist
 */
export const hasEncryptedData = () => {
  return localStorage.getItem('space_anthropic_key') !== null || 
         localStorage.getItem('space_openai_key') !== null;
};

/**
 * Get the encryption password from user or memory
 * @param {boolean} forDecryption - Whether this is for decryption (vs new password creation)
 * @returns {Promise<string>} The password for encryption/decryption
 */
const getEncryptionPassword = async (forDecryption = false) => {
  // If we already have the password in memory, use it
  if (encryptionPassword) return encryptionPassword;
  
  // Check for valid session first (only for decryption) and try to restore silently
  if (forDecryption && hasSessionToken()) {
    console.log('🔓 Session token found, attempting silent restoration...');
    
    try {
      const restoredPassword = tryRestoreSession();
      if (restoredPassword) {
        console.log('✅ Session restored successfully');
        encryptionPassword = restoredPassword;
        return restoredPassword;
      } else {
        console.log('❌ Session restoration failed, prompting for password');
        // Clear invalid session
        clearSession();
      }
    } catch (error) {
      console.error('Session restoration error:', error);
      clearSession();
    }
  }
  
  // Determine if we're creating a new password or entering an existing one
  const encryptedDataExists = hasEncryptedData();
  
  // Change prompt message based on whether we're creating or retrieving
  let message;
  if (encryptedDataExists && forDecryption) {
    if (failedAttempts > 0) {
      message = 
        `Incorrect password.\n\n` +
        "Please enter your password to access your API keys.";
    } else {
      message = "🔒 Security Update: SPACE Terminal now encrypts your API keys.\n\n" +
                "Please enter your password to access your API keys. Your saved conversations are not affected.";
    }
  } else {
    message = 
      "SPACE encrypts your API keys for security. Create a password to protect them.\n\n" +
      "You'll need this password to use SPACE. If you forget it, just re-enter your API keys.";
  }
  
  try {
    // Use the custom modal if available, otherwise fall back to prompt
    if (modalController) {
      const handleReset = encryptedDataExists && forDecryption ? resetEncryptedKeys : null;
      
      const result = await modalController.requestPassword({
        message,
        showResetOption: encryptedDataExists && forDecryption,
        onReset: handleReset,
        attemptCount: failedAttempts,
        maxAttempts: MAX_ATTEMPTS,
        isCreatingPassword: !encryptedDataExists || !forDecryption
      });
      
      const password = typeof result === 'string' ? result : result.password;
      const rememberMe = typeof result === 'object' ? result.rememberMe : false;
      
      if (!password) {
        throw new Error("Encryption password is required");
      }
      
      // Create session if remember me is checked
      if (rememberMe) {
        createSession(password);
      }
      
      // Save in memory for this session
      encryptionPassword = password;
      return password;
    } else {
      // Legacy fallback to browser prompts
      const promptMessage = message + (encryptedDataExists && forDecryption 
        ? "\n\nClick 'Cancel' if you've forgotten your password and want to reset."
        : "");
        
      // Prompt the user
      const password = prompt(promptMessage);
      
      // If they clicked Cancel and they're trying to decrypt existing data,
      // ask if they want to reset
      if (!password && encryptedDataExists && forDecryption) {
        const shouldReset = confirm(
          "Would you like to reset your API keys?\n" +
          "WARNING: This will delete your stored API keys and you'll need to enter them again."
        );
        
        if (shouldReset) {
          resetEncryptedKeys();
        }
        
        throw new Error("Password recovery initiated");
      }
      
      if (!password) {
        throw new Error("Encryption password is required");
      }
    
      // Save in memory for this session
      encryptionPassword = password;
      return password;
    }
  } catch (error) {
    console.error("Error getting password:", error);
    throw error;
  }
};

/**
 * Encrypts a value and stores it in localStorage
 * @param {string} key - The localStorage key
 * @param {string} value - The value to encrypt and store
 * @returns {Promise<void>}
 */
export const setEncrypted = async (key, value) => {
  try {
    const password = await getEncryptionPassword(false);
    const encrypted = CryptoJS.AES.encrypt(
      value, 
      password + ENCRYPTION_SALT
    ).toString();
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error("Error encrypting value:", error);
    throw error;
  }
};

/**
 * Retrieves and decrypts a value from localStorage
 * @param {string} key - The localStorage key
 * @returns {Promise<string|null>} The decrypted value or null if not found
 */
export const getDecrypted = async (key) => {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  
  try {
    const password = await getEncryptionPassword(true);
    const decrypted = CryptoJS.AES.decrypt(
      encrypted, 
      password + ENCRYPTION_SALT
    );
    
    // Try to convert to string - will fail if the password is wrong
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption succeeded, reset failed attempts counter
    failedAttempts = 0;
    
    return result;
  } catch (error) {
    console.error("Error decrypting value:", error);
    
    // If this was a password recovery operation, don't increment attempts
    if (error.message === "Password recovery initiated") {
      throw error;
    }
    
    // Increment failed attempts counter
    failedAttempts++;
    
    // If too many failed attempts, prompt for reset
    if (failedAttempts >= MAX_ATTEMPTS) {
      let shouldReset = false;
      
      if (modalController) {
        shouldReset = await modalController.confirmAction(
          "You've made several unsuccessful attempts to decrypt your API keys.\n" +
          "Would you like to reset and enter new API keys?"
        );
      } else {
        shouldReset = confirm(
          "You've made several unsuccessful attempts to decrypt your API keys.\n" +
          "Would you like to reset and enter new API keys?"
        );
      }
      
      if (shouldReset) {
        resetEncryptedKeys();
      }
      
      // Reset counter but keep prompting if they want to keep trying
      failedAttempts = 0;
    }
    
    // Clear the incorrect password
    encryptionPassword = null;
    
    // Try again with a new password
    return getDecrypted(key);
  }
};

/**
 * Removes an encrypted value from localStorage
 * @param {string} key - The localStorage key to remove
 */
export const removeEncrypted = (key) => {
  localStorage.removeItem(key);
};

/**
 * Generates a session key for encrypting session data independently of user password
 * @returns {string} Random session key
 */
const generateSessionKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

/**
 * Generates a session token with timestamp for expiration checking
 * @param {string} password - The user's password
 * @returns {string} Session token with format: timestamp.sessionKey.encryptedData
 */
const generateSessionToken = (password) => {
  const timestamp = Date.now();
  const sessionKey = generateSessionKey();
  const tokenData = JSON.stringify({ password, timestamp });
  const encrypted = CryptoJS.AES.encrypt(tokenData, sessionKey + ENCRYPTION_SALT).toString();
  
  // Store timestamp and sessionKey separately for validation without password
  return `${timestamp}.${sessionKey}.${encrypted}`;
};

/**
 * Checks if a session token is expired without requiring password
 * @param {string} token - The session token in format: timestamp.sessionKey.encryptedData
 * @returns {boolean} True if token is not expired
 */
const isSessionTokenExpired = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length < 3) return true; // Invalid format (need timestamp, sessionKey, encryptedData)
    
    const timestamp = parseInt(parts[0]);
    if (isNaN(timestamp)) return true; // Invalid timestamp
    
    const now = Date.now();
    const tokenAge = now - timestamp;
    
    return tokenAge > SESSION_DURATION;
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Extracts the password from a session token without requiring the password
 * @param {string} token - The session token in format: timestamp.sessionKey.encryptedData
 * @returns {string|null} The stored password if token is valid, null otherwise
 */
export const extractPasswordFromSession = (token) => {
  try {
    // Check expiration first without decryption
    if (isSessionTokenExpired(token)) {
      return null; // Token expired
    }
    
    const parts = token.split('.');
    if (parts.length < 3) return null; // Invalid format
    
    const timestamp = parts[0];
    const sessionKey = parts[1];
    const encryptedData = parts.slice(2).join('.'); // Rejoin in case there are dots in encrypted data
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, sessionKey + ENCRYPTION_SALT);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // Check if decryption actually produced valid data
    if (!decryptedString || decryptedString.trim() === '') {
      return null; // Invalid decryption result
    }
    
    const tokenData = JSON.parse(decryptedString);
    
    // Validate token structure
    if (!tokenData || typeof tokenData.timestamp !== 'number' || !tokenData.password) {
      return null; // Invalid token structure
    }
    
    return tokenData.password;
  } catch (error) {
    console.error("Session password extraction error:", error);
    return null; // Invalid token
  }
};

/**
 * Validates and extracts data from a session token (legacy function for compatibility)
 * @param {string} token - The session token to validate
 * @param {string} password - The password to validate against (now optional)
 * @returns {Object|null} Token data if valid, null if invalid or expired
 */
const validateSessionToken = (token, password = null) => {
  try {
    const extractedPassword = extractPasswordFromSession(token);
    if (!extractedPassword) {
      return null;
    }
    
    // If password is provided, verify it matches
    if (password && extractedPassword !== password) {
      return null;
    }
    
    // Parse timestamp from token
    const parts = token.split('.');
    const timestamp = parseInt(parts[0]);
    
    return {
      password: extractedPassword,
      timestamp: timestamp
    };
  } catch (error) {
    console.error("Session token validation error:", error);
    return null; // Invalid token
  }
};

/**
 * Stores a session token for "remember me" functionality
 * @param {string} password - The user's password
 */
export const createSession = (password) => {
  const token = generateSessionToken(password);
  localStorage.setItem(SESSION_STORAGE_KEY, token);
};

/**
 * Checks if there's a valid (non-expired) session token
 * @returns {boolean} True if a session token exists and is not expired
 */
export const hasSessionToken = () => {
  const token = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!token) return false;
  
  try {
    // Check if token exists and has the expected format (timestamp.sessionKey.encryptedData)
    const parts = token.split('.');
    if (parts.length < 3 || token.length <= 20) return false;
    
    // Check expiration without requiring password
    if (isSessionTokenExpired(token)) {
      localStorage.removeItem(SESSION_STORAGE_KEY); // Clean up expired token
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return false;
  }
};

/**
 * Checks if there's a valid session token (deprecated - use hasSessionToken instead)
 * @returns {boolean} True if a session token exists (doesn't validate password)
 * @deprecated Use hasSessionToken instead for clarity
 */
export const hasValidSession = hasSessionToken;

/**
 * Attempts to restore a session by extracting the password from a valid session token
 * @returns {string|null} The password if session is valid, null otherwise
 */
export const tryRestoreSession = () => {
  if (!hasSessionToken()) {
    return null;
  }
  
  try {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    const password = extractPasswordFromSession(token);
    
    if (password) {
      // Set the password in memory so subsequent operations can use it
      encryptionPassword = password;
      return password;
    }
    
    return null;
  } catch (error) {
    console.error("Session restoration failed:", error);
    clearSession();
    return null;
  }
};

/**
 * Attempts to validate the current session silently using any password already in memory
 * @returns {boolean} True if session is valid and not expired
 */
export const canUseExistingSession = () => {
  if (!encryptionPassword || !hasSessionToken()) {
    return false;
  }
  
  try {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    const tokenData = validateSessionToken(token, encryptionPassword);
    
    if (tokenData && tokenData.password === encryptionPassword) {
      return true;
    }
  } catch (error) {
    console.error("Silent session validation failed:", error);
  }
  
  return false;
};

/**
 * Validates a session token with the provided password
 * @param {string} password - Password to validate against
 * @returns {boolean} True if session is valid for this password
 */
export const validateSession = (password) => {
  const token = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!token) return false;
  
  const tokenData = validateSessionToken(token, password);
  if (!tokenData) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return false;
  }
  
  return tokenData.password === password;
};

/**
 * Clears the current session token
 */
export const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  encryptionPassword = null;
}; 
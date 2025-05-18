/**
 * Simple utility for encrypting/decrypting localStorage values
 * Note: This is a quick solution to improve security, but not perfect
 * A proper solution would use a server-side proxy with LiteLLM
 */

// Simple salt to make encryption a bit stronger
const ENCRYPTION_SALT = "SPACE_Terminal_Salt";

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
const hasEncryptedData = () => {
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
      message = "Please enter your password to access your API keys.";
    }
  } else {
    message = 
      "🔒 Security Update: SPACE Terminal now encrypts your API keys for better security.\n\n" +
      "Please create a password to secure your API keys. Your saved conversations are safe and won't be affected.\n\n" +
      "You'll need this password to access your keys in the future.\n\n" +
      "WARNING: If you forget this password, you'll only need to re-enter your API keys.";
  }
  
  try {
    // Use the custom modal if available, otherwise fall back to prompt
    if (modalController) {
      const handleReset = encryptedDataExists && forDecryption ? resetEncryptedKeys : null;
      
      const password = await modalController.requestPassword({
        message,
        showResetOption: encryptedDataExists && forDecryption,
        onReset: handleReset,
        attemptCount: failedAttempts,
        maxAttempts: MAX_ATTEMPTS
      });
      
      if (!password) {
        throw new Error("Encryption password is required");
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
import React, { createContext, useContext, useCallback } from 'react';

// Create context for modals (password functionality deprecated in auth mode)
const ModalContext = createContext();

/**
 * Provider component for modal management
 */
export const ModalProvider = ({ children }) => {
  // Deprecated: Password modal functionality removed in auth mode
  const requestPassword = useCallback((options = {}) => {
    console.warn('Password modal deprecated in auth mode');
    return Promise.reject(new Error('Password modal not available in auth mode'));
  }, []);

  // Function to confirm an action with the user
  const confirmAction = useCallback((message) => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }, []);

  // Function to alert the user
  const showAlert = useCallback((message) => {
    window.alert(message);
  }, []);

  // Context value (password functionality deprecated)
  const contextValue = {
    requestPassword, // Deprecated but kept for compatibility
    confirmAction,
    showAlert,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {/* PasswordModal removed - not needed in auth mode */}
    </ModalContext.Provider>
  );
};

// Hook to use the modal context
export const useModal = () => useContext(ModalContext); 
import React, { createContext, useState, useContext, useCallback } from 'react';
import PasswordModal from '../components/PasswordModal';

// Create context for password modals
const ModalContext = createContext();

/**
 * Provider component for modal management
 */
export const ModalProvider = ({ children }) => {
  const [passwordModalState, setPasswordModalState] = useState({
    isOpen: false,
    message: '',
    onSubmit: null,
    showResetOption: false,
    onReset: null,
    attemptCount: 0,
    maxAttempts: 3,
    isCreatingPassword: false,
    resolve: null,
    reject: null,
  });

  // Function to request a password from the user
  const requestPassword = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      setPasswordModalState({
        isOpen: true,
        message: options.message || 'Please enter your password:',
        showResetOption: options.showResetOption || false,
        onReset: options.onReset || null,
        attemptCount: options.attemptCount || 0,
        maxAttempts: options.maxAttempts || 3,
        isCreatingPassword: options.isCreatingPassword || false,
        resolve,
        reject,
      });
    });
  }, []);

  // Function to close the password modal
  const closePasswordModal = useCallback(() => {
    if (passwordModalState.reject) {
      passwordModalState.reject(new Error('Password input cancelled'));
    }
    setPasswordModalState(prev => ({ ...prev, isOpen: false }));
  }, [passwordModalState]);

  // Handle password submission
  const handlePasswordSubmit = useCallback((password, rememberMe = false) => {
    if (passwordModalState.resolve) {
      passwordModalState.resolve({ password, rememberMe });
    }
    setPasswordModalState(prev => ({ ...prev, isOpen: false }));
  }, [passwordModalState]);

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

  // Context value
  const contextValue = {
    requestPassword,
    confirmAction,
    showAlert,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <PasswordModal
        isOpen={passwordModalState.isOpen}
        onClose={closePasswordModal}
        onSubmit={handlePasswordSubmit}
        message={passwordModalState.message}
        showResetOption={passwordModalState.showResetOption}
        onReset={passwordModalState.onReset}
        attemptCount={passwordModalState.attemptCount}
        maxAttempts={passwordModalState.maxAttempts}
        isCreatingPassword={passwordModalState.isCreatingPassword}
      />
    </ModalContext.Provider>
  );
};

// Hook to use the modal context
export const useModal = () => useContext(ModalContext); 
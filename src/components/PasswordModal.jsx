import React, { useState, useEffect } from 'react';

/**
 * A custom password modal that matches the SPACE Terminal aesthetic
 */
const PasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  message,
  showResetOption = false,
  onReset = null,
  attemptCount = 0,
  maxAttempts = 3,
  isCreatingPassword = false
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Clear password when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setRememberMe(false);
    }
  }, [isOpen]);

  // Handle pressing Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    onSubmit(password, rememberMe);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-term-500 p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <h2 className="text-term-400 text-xl mb-4">
          {isCreatingPassword ? 'Create Password' : 'Password Required'}
        </h2>

        {error && (
          <div className="bg-red-900/50 border border-red-400 text-red-400 p-2 mb-4 rounded">
            {error}
          </div>
        )}

        {attemptCount > 0 && (
          <div className="text-yellow-400 mb-4">
            Attempt {attemptCount} of {maxAttempts}
          </div>
        )}

        <p className="text-term-400 mb-4 whitespace-pre-line">{message}</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-stone-900 text-white font-sans border border-term-700 p-2 mb-4 focus:outline-none placeholder:text-sage-400"
          placeholder="Enter password"
          data-testid="password-input"
          autoComplete={isCreatingPassword ? "new-password" : "current-password"}
          autoFocus
        />

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="remember-me"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="mr-2 rounded border-term-500 text-term-400 focus:ring-term-500"
          />
          <label htmlFor="remember-me" className="text-term-400 text-sm">
            Remember me for 7 days
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          {showResetOption && onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-red-400 border border-red-400 rounded hover:bg-red-900"
            >
              Reset API Keys
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 border border-gray-400 rounded hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-term-400 border border-term-500 rounded hover:bg-term-500 hover:text-black"
            data-testid="password-submit-btn"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;

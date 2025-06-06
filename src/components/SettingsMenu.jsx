import React, { useState } from 'react';

const SettingsMenu = ({ 
  isOpen, 
  onClose, 
  debugMode, 
  setDebugMode,
  contextLimit,
  setContextLimit,
  maxTokens,
  setMaxTokens,
  onClearApiKeys,
  onShowApiKeyStatus
}) => {
  const [tempContextLimit, setTempContextLimit] = useState(contextLimit);
  const [tempMaxTokens, setTempMaxTokens] = useState(maxTokens);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleContextLimitChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Clamp between 1,000 and 200,000 (Claude 4's context window)
      const clampedValue = Math.max(1000, Math.min(200000, numValue));
      setTempContextLimit(clampedValue);
      setContextLimit(clampedValue);
      localStorage.setItem('space_context_limit', clampedValue.toString());
    }
  };

  const handleMaxTokensChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      // Clamp between 1 and 8192 (Claude's max response tokens)
      const clampedValue = Math.max(1, Math.min(8192, numValue));
      setTempMaxTokens(clampedValue);
      setMaxTokens(clampedValue);
      localStorage.setItem('space_max_tokens', clampedValue.toString());
    }
  };

  const handleDebugToggle = () => {
    setDebugMode(!debugMode);
  };

  const handleClearApiKeysClick = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClearApiKeys = () => {
    onClearApiKeys();
    setShowClearConfirmation(false);
    // Close settings menu after clearing keys
    onClose();
  };

  const handleRestoreDefaults = () => {
    // High-quality conversation defaults (not cost-optimized)
    const defaultContextLimit = 150000;  // High context for rich conversations
    const defaultMaxTokens = 4096;       // Full response length
    const defaultDebugMode = false;      // Clean interface
    
    setTempContextLimit(defaultContextLimit);
    setContextLimit(defaultContextLimit);
    localStorage.setItem('space_context_limit', defaultContextLimit.toString());
    
    setTempMaxTokens(defaultMaxTokens);
    setMaxTokens(defaultMaxTokens);
    localStorage.setItem('space_max_tokens', defaultMaxTokens.toString());
    
    setDebugMode(defaultDebugMode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-green-400 rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-green-400 text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Debug Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-green-400 font-medium">Debug Mode</label>
              <p className="text-gray-400 text-sm">Show detailed API call information</p>
            </div>
            <button
              onClick={handleDebugToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                debugMode ? 'bg-green-400' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  debugMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Context Limit */}
          <div>
            <label className="text-green-400 font-medium block mb-2">
              Context Limit
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Maximum tokens for conversation context (higher = more history sent to Claude)
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={tempContextLimit}
                onChange={(e) => setTempContextLimit(e.target.value)}
                onBlur={(e) => handleContextLimitChange(e.target.value)}
                className="bg-black text-green-400 border border-green-400 rounded px-3 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-green-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1000"
                max="200000"
                step="1000"
              />
              <span className="text-gray-400 text-sm">tokens</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Range: 1,000 - 200,000 tokens (Claude 4's context window)
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-green-400 font-medium block mb-2">
              Max Response Tokens
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Maximum length of Claude's responses (higher = longer responses possible)
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={tempMaxTokens}
                onChange={(e) => setTempMaxTokens(e.target.value)}
                onBlur={(e) => handleMaxTokensChange(e.target.value)}
                className="bg-black text-green-400 border border-green-400 rounded px-3 py-1 w-20 focus:outline-none focus:ring-1 focus:ring-green-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
                max="8192"
              />
              <span className="text-gray-400 text-sm">tokens</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Range: 1-8192, Current: {maxTokens}
            </div>
          </div>

          {/* API Key Management */}
          <div>
            <label className="text-green-400 font-medium block mb-3">
              API Key Management
            </label>
            <div className="space-y-2">
              <button
                onClick={onShowApiKeyStatus}
                className="w-full text-left px-3 py-2 bg-black border border-green-400 rounded text-green-400 hover:bg-green-400 hover:text-black transition-colors"
              >
                View API Key Status
              </button>
              <button
                onClick={handleClearApiKeysClick}
                className="w-full text-left px-3 py-2 bg-black border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-black transition-colors"
              >
                Clear API Keys
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
          <button
            onClick={handleRestoreDefaults}
            className="w-full px-4 py-2 bg-black border border-blue-400 rounded text-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
          >
            Restore Defaults (High Quality)
          </button>
          <p className="text-xs text-gray-500 text-center">
            Settings are saved automatically
          </p>
        </div>
      </div>

      {/* Confirmation Dialog for Clear API Keys */}
      {showClearConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-gray-900 border border-red-400 rounded-lg p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-red-400 text-lg font-semibold mb-2">Clear API Keys?</h3>
              <p className="text-gray-300 text-sm">
                This will remove all stored API keys from your browser. You'll need to re-enter them to continue using SPACE.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirmation(false)}
                className="flex-1 px-4 py-2 bg-black border border-gray-400 rounded text-gray-400 hover:bg-gray-400 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearApiKeys}
                className="flex-1 px-4 py-2 bg-black border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-black transition-colors"
              >
                Clear Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
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

  if (!isOpen) return null;

  const handleContextLimitChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setTempContextLimit(numValue);
      setContextLimit(numValue);
      localStorage.setItem('space_context_limit', numValue.toString());
    }
  };

  const handleMaxTokensChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 8192) {
      setTempMaxTokens(numValue);
      setMaxTokens(numValue);
      localStorage.setItem('space_max_tokens', numValue.toString());
    }
  };

  const handleDebugToggle = () => {
    setDebugMode(!debugMode);
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
                className="bg-black text-green-400 border border-green-400 rounded px-3 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-green-400"
                min="1000"
                max="500000"
                step="1000"
              />
              <span className="text-gray-400 text-sm">tokens</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Current: {contextLimit.toLocaleString()}
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
                className="bg-black text-green-400 border border-green-400 rounded px-3 py-1 w-20 focus:outline-none focus:ring-1 focus:ring-green-400"
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
                onClick={onClearApiKeys}
                className="w-full text-left px-3 py-2 bg-black border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-black transition-colors"
              >
                Clear API Keys
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Settings are saved automatically
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
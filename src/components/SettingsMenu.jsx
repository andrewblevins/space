import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UsageDisplay from './UsageDisplay';
import UsageIndicator from './UsageIndicator';
import PrivacyPolicy from './PrivacyPolicy';

const SettingsMenu = ({
  isOpen,
  onClose,
  debugMode,
  setDebugMode,
  reasoningMode,
  setReasoningMode,
  contextLimit,
  setContextLimit,
  maxTokens,
  setMaxTokens,
  onClearApiKeys,
  theme,
  toggleTheme,
  paragraphSpacing,
  setParagraphSpacing,
  onMigrateConversations,
  openrouterModel,
  setOpenrouterModel,
  aiProvider,
  setAiProvider
}) => {
  const [tempContextLimit, setTempContextLimit] = useState(contextLimit);
  const [tempMaxTokens, setTempMaxTokens] = useState(maxTokens);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [apiKeyStatus, setApiKeyStatus] = useState({ anthropic: false, openai: false, openrouter: false });
  const [isCheckingKeys, setIsCheckingKeys] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Auth system
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { user: null, signOut: () => {} };
  const { user, signOut } = authData;

  // Check API keys when modal opens or when switching to API tab
  const checkApiKeys = async () => {
    // Skip in auth mode - no API keys to check
    if (useAuthSystem) return;
    
    setIsCheckingKeys(true);
    try {
      // In auth mode, we don't use local API keys
      setApiKeyStatus({ anthropic: false, openai: false, openrouter: false });
    } catch (error) {
      console.error('Error checking API keys:', error);
      setApiKeyStatus({ anthropic: false, openai: false, openrouter: false });
    } finally {
      setIsCheckingKeys(false);
    }
  };

  // Check keys when modal opens or when switching to API tab
  useEffect(() => {
    if (isOpen && activeTab === 'api') {
      checkApiKeys();
    }
  }, [isOpen, activeTab]);

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

  const handleParagraphSpacingChange = (value) => {
    const numValue = parseFloat(value);
    setParagraphSpacing(numValue);
    localStorage.setItem('space_paragraph_spacing', numValue.toString());
  };

  const handleDebugToggle = () => {
    setDebugMode(!debugMode);
  };

  const handleReasoningToggle = () => {
    const newMode = !reasoningMode;
    setReasoningMode(newMode);
    localStorage.setItem('space_reasoning_mode', newMode.toString());
  };

  const handleClearApiKeysClick = () => {
    setShowClearConfirmation(true);
  };

  const handleConfirmClearApiKeys = () => {
    onClearApiKeys();
    setShowClearConfirmation(false);
    // Refresh API status after clearing
    checkApiKeys();
  };

  const handleRestoreDefaults = () => {
    // High-quality conversation defaults (not cost-optimized)
    const defaultContextLimit = 150000;  // High context for rich conversations
    const defaultMaxTokens = 4096;       // Full response length
    const defaultDebugMode = false;      // Clean interface
    const defaultReasoningMode = false;  // No step-by-step reasoning
    const defaultParagraphSpacing = 0.25; // Default paragraph spacing
    
    setTempContextLimit(defaultContextLimit);
    setContextLimit(defaultContextLimit);
    localStorage.setItem('space_context_limit', defaultContextLimit.toString());
    
    setTempMaxTokens(defaultMaxTokens);
    setMaxTokens(defaultMaxTokens);
    localStorage.setItem('space_max_tokens', defaultMaxTokens.toString());

    setDebugMode(defaultDebugMode);
    setReasoningMode(defaultReasoningMode);

    localStorage.setItem('space_reasoning_mode', defaultReasoningMode.toString());
    
    setParagraphSpacing(defaultParagraphSpacing);
    localStorage.setItem('space_paragraph_spacing', defaultParagraphSpacing.toString());
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI Provider' },
    { id: 'performance', label: 'Performance' },
    { id: 'api', label: useAuthSystem ? 'Account & Usage' : 'API Keys' }
  ];

  // OpenRouter popular models
  const openrouterModels = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta' },
    { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral' },
    { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere' },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Alibaba' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek' }
  ];

  const handleProviderChange = (provider) => {
    setAiProvider(provider);
    localStorage.setItem('space_ai_provider', provider);
  };

  const handleOpenrouterModelChange = (model) => {
    setOpenrouterModel(model);
    localStorage.setItem('space_openrouter_model', model);
  };

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-green-600 rounded-lg w-full max-w-md mx-4 dark:bg-gray-900 dark:border-green-400 max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-300 dark:border-gray-600 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-400 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-green-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* AI Provider Selection */}
              <div>
                <label className="text-green-400 font-medium block mb-3">
                  Primary AI Provider
                </label>
                <p className="text-gray-400 text-sm mb-4">
                  Choose which AI service powers your main conversations
                </p>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="claude"
                      checked={aiProvider === 'claude'}
                      onChange={() => handleProviderChange('claude')}
                      className="text-green-400"
                    />
                    <div>
                      <div className="text-green-400 font-medium">Claude (Anthropic)</div>
                      <div className="text-gray-400 text-sm">High-quality conversations, reasoning, and roleplay</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="radio"
                      name="aiProvider"
                      value="openrouter"
                      checked={aiProvider === 'openrouter'}
                      onChange={() => handleProviderChange('openrouter')}
                      className="text-green-400"
                    />
                    <div>
                      <div className="text-green-400 font-medium">OpenRouter</div>
                      <div className="text-gray-400 text-sm">Access to 200+ AI models from multiple providers</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* OpenRouter Model Selection */}
              {aiProvider === 'openrouter' && (
                <div>
                  <label className="text-green-400 font-medium block mb-3">
                    OpenRouter Model
                  </label>
                  <p className="text-gray-400 text-sm mb-4">
                    Choose which model to use via OpenRouter
                  </p>
                  <select
                    value={openrouterModel}
                    onChange={(e) => handleOpenrouterModelChange(e.target.value)}
                    className="w-full bg-stone-50 text-gray-800 border border-stone-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 dark:bg-black dark:text-green-400 dark:border-green-400"
                  >
                    {openrouterModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-600 dark:text-blue-400">
                    <p><strong>Note:</strong> OpenRouter requires a separate API key. Pricing varies by model.</p>
                    <p className="mt-1">Visit <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">openrouter.ai/models</a> for full model list and pricing.</p>
                  </div>
                </div>
              )}

              {/* Provider Status */}
              <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                <label className="text-green-400 font-medium block mb-3">
                  Provider Status
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    <span>Claude (Required)</span>
                    <span className="text-green-400">✓ Available</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                    <span>OpenRouter</span>
                    <span className={apiKeyStatus.openrouter ? 'text-green-400' : 'text-gray-400'}>
                      {apiKeyStatus.openrouter ? '✓ Available' : 'API key needed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
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

              {/* Reasoning Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-green-400 font-medium">Reasoning Mode</label>
                  <p className="text-gray-400 text-sm">Model explains its reasoning step-by-step</p>
                </div>
                <button
                  onClick={handleReasoningToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    reasoningMode ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      reasoningMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-green-400 font-medium">Theme</label>
                  <p className="text-gray-400 text-sm">Toggle light or dark mode</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Paragraph Spacing */}
              <div>
                <label className="text-green-400 font-medium block mb-2">
                  Paragraph Spacing
                </label>
                <p className="text-gray-400 text-sm mb-3">
                  Control spacing between paragraphs in advisor responses
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={paragraphSpacing}
                    onChange={(e) => handleParagraphSpacingChange(e.target.value)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  />
                  <span className="text-gray-400 text-sm w-16">{paragraphSpacing === 0 ? 'None' : `${paragraphSpacing}rem`}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  0 = No spacing, 1 = Maximum spacing (0.05rem increments)
                </div>
              </div>

              {/* Restore Defaults */}
              <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
                <button
                  onClick={handleRestoreDefaults}
                  className="w-full px-4 py-2 bg-stone-50 border border-blue-600 rounded text-blue-600 hover:bg-blue-600 hover:text-white transition-colors dark:bg-black dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-black"
                >
                  Restore Defaults
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Settings are saved automatically
                </p>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
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
                    className="bg-stone-50 text-gray-800 border border-stone-300 rounded px-3 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-black dark:text-green-400 dark:border-green-400"
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
                    className="bg-stone-50 text-gray-800 border border-stone-300 rounded px-3 py-1 w-20 focus:outline-none focus:ring-1 focus:ring-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none dark:bg-black dark:text-green-400 dark:border-green-400"
                    min="1"
                    max="8192"
                  />
                  <span className="text-gray-400 text-sm">tokens</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Range: 1-8192, Current: {maxTokens}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              {useAuthSystem ? (
                /* Authentication & Account Info */
                <>
                  <div>
                    <label className="text-green-400 font-medium block mb-3">
                      Account Information
                    </label>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Email</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {user?.email || 'Not available'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Authentication</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          ✓ Signed In
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Management */}
                  <div>
                    <label className="text-green-400 font-medium block mb-3">
                      Account Management
                    </label>
                    <p className="text-gray-400 text-sm mb-4">
                      Manage your SPACE Terminal account and authentication.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={onMigrateConversations}
                        className="w-full text-left px-3 py-2 bg-stone-50 border border-blue-600 rounded text-blue-600 hover:bg-blue-600 hover:text-white transition-colors dark:bg-black dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-black"
                      >
                        Migrate Local Conversations
                      </button>
                      <button
                        onClick={() => setShowPrivacyPolicy(true)}
                        className="w-full text-left px-3 py-2 bg-stone-50 border border-gray-600 rounded text-gray-600 hover:bg-gray-600 hover:text-white transition-colors dark:bg-black dark:border-gray-400 dark:text-gray-400 dark:hover:bg-gray-400 dark:hover:text-black"
                      >
                        Privacy Policy
                      </button>
                      <button
                        onClick={async () => {
                          console.log('🔐 Sign out button clicked');
                          try {
                            await signOut();
                            console.log('🔐 Sign out completed, closing settings');
                            onClose(); // Close settings modal after successful sign out
                          } catch (error) {
                            console.error('🔐 Sign out failed:', error);
                            // Could show an error message to user here
                          }
                        }}
                        className="w-full text-left px-3 py-2 bg-stone-50 border border-red-600 rounded text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-black dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-black"
                      >
                        Sign Out
                      </button>
                    </div>
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      <p>API access is managed server-side. No API keys needed on your device.</p>
                    </div>
                  </div>
                </>
              ) : (
                /* Legacy API Key Management */
                <>
                  <div>
                    <label className="text-green-400 font-medium block mb-3">
                      API Key Status
                    </label>
                    {isCheckingKeys ? (
                      <div className="text-gray-400 text-sm">Checking API keys...</div>
                    ) : (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">Anthropic (Claude)</span>
                          <span className={`text-sm font-medium ${apiKeyStatus.anthropic ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {apiKeyStatus.anthropic ? '✓ Set' : '✗ Not Set'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">OpenAI (GPT)</span>
                          <span className={`text-sm font-medium ${apiKeyStatus.openai ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {apiKeyStatus.openai ? '✓ Set' : '✗ Not Set'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded">
                          <span className="text-gray-600 dark:text-gray-300 text-sm">OpenRouter</span>
                          <span className={`text-sm font-medium ${apiKeyStatus.openrouter ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {apiKeyStatus.openrouter ? '✓ Set' : 'Optional'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-green-400 font-medium block mb-3">
                      API Key Management
                    </label>
                    <p className="text-gray-400 text-sm mb-4">
                      Manage your API keys for SPACE Terminal. OpenRouter is optional for additional models.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={checkApiKeys}
                        disabled={isCheckingKeys}
                        className="w-full text-left px-3 py-2 bg-stone-50 border border-green-600 rounded text-green-600 hover:bg-green-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:border-green-400 dark:text-green-400 dark:hover:bg-green-400 dark:hover:text-black"
                      >
                        {isCheckingKeys ? 'Checking...' : 'Refresh Status'}
                      </button>
                      <button
                        onClick={handleClearApiKeysClick}
                        className="w-full text-left px-3 py-2 bg-stone-50 border border-red-600 rounded text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-black dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-black"
                      >
                        Clear API Keys
                      </button>
                    </div>
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                      <p>API keys are encrypted and stored locally in your browser. They are never sent to SPACE servers.</p>
                    </div>
                  </div>
                </>
              )}

              {/* Rate Limiting */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
                <UsageIndicator />
              </div>

              {/* Usage Statistics */}
              <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
                <UsageDisplay />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Clear API Keys */}
      {showClearConfirmation && (
        <div
          className="fixed inset-0 bg-white/70 dark:bg-black/75 flex items-center justify-center z-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-gray-100 border border-red-600 rounded-lg p-6 w-full max-w-sm mx-4 dark:bg-gray-900 dark:border-red-400"
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
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-400 rounded text-gray-600 hover:bg-stone-200 transition-colors dark:bg-black dark:text-gray-400 dark:hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearApiKeys}
                className="flex-1 px-4 py-2 bg-stone-50 border border-red-600 rounded text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-black dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-black"
              >
                Clear Keys
              </button>
            </div>
          </div>
        </div>
      )}
      
      <PrivacyPolicy
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </div>
  );
};

export default SettingsMenu;

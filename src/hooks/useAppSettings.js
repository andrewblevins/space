import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing application settings and preferences in SPACE Terminal
 * Extracts all settings-related functionality from Terminal.jsx
 */
export function useAppSettings() {
  // Core settings with localStorage persistence
  const [settings, setSettings] = useState(() => ({
    // API and model settings
    maxTokens: (() => {
      const saved = localStorage.getItem('space_max_tokens');
      return saved ? parseInt(saved) : 2048;
    })(),
    contextLimit: 150000,
    temperature: 0.7,
    openrouterModel: 'anthropic/claude-3.5-sonnet',
    
    // Feature toggles
    debugMode: false,
    reasoningMode: (() => {
      const saved = localStorage.getItem('space_reasoning_mode');
      return saved ? saved === 'true' : false;
    })(),
    councilMode: false,
    multiThreadedMode: false, // NEW: For multi-threaded conversations
    
    // UI settings
    autoSave: true,
    autoAnalyze: false,
    showWelcomeScreen: true,
    
    // Analysis settings
    enableMetaphorAnalysis: true,
    enableQuestionAnalysis: false, // Deprecated but kept for compatibility
    enableAdvisorSuggestions: true,
    
    // Advanced settings
    batchSize: 3, // For multi-threaded API calls
    streamingEnabled: true,
    contextPruningEnabled: true
  }));

  // Authentication and API key state
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const [apiKeysSet, setApiKeysSet] = useState(useAuthSystem);

  // Persist specific settings to localStorage
  useEffect(() => {
    localStorage.setItem('space_max_tokens', settings.maxTokens.toString());
  }, [settings.maxTokens]);

  useEffect(() => {
    localStorage.setItem('space_reasoning_mode', settings.reasoningMode.toString());
  }, [settings.reasoningMode]);

  useEffect(() => {
    localStorage.setItem('space_context_limit', settings.contextLimit.toString());
  }, [settings.contextLimit]);

  useEffect(() => {
    localStorage.setItem('space_temperature', settings.temperature.toString());
  }, [settings.temperature]);

  useEffect(() => {
    localStorage.setItem('space_openrouter_model', settings.openrouterModel);
  }, [settings.openrouterModel]);

  useEffect(() => {
    localStorage.setItem('space_multi_threaded_mode', settings.multiThreadedMode.toString());
  }, [settings.multiThreadedMode]);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple settings at once
  const updateSettings = useCallback((updates) => {
    setSettings(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    const defaultSettings = {
      maxTokens: 2048,
      contextLimit: 150000,
      temperature: 0.7,
      openrouterModel: 'anthropic/claude-3.5-sonnet',
      debugMode: false,
      reasoningMode: false,
      councilMode: false,
      multiThreadedMode: false,
      autoSave: true,
      autoAnalyze: false,
      showWelcomeScreen: true,
      enableMetaphorAnalysis: true,
      enableQuestionAnalysis: false,
      enableAdvisorSuggestions: true,
      batchSize: 3,
      streamingEnabled: true,
      contextPruningEnabled: true
    };
    
    setSettings(defaultSettings);
    
    // Clear localStorage for settings that should be reset
    localStorage.removeItem('space_max_tokens');
    localStorage.removeItem('space_reasoning_mode');
    localStorage.removeItem('space_context_limit');
    localStorage.removeItem('space_temperature');
    localStorage.removeItem('space_openrouter_model');
    localStorage.removeItem('space_multi_threaded_mode');
  }, []);

  // Toggle boolean settings
  const toggleSetting = useCallback((key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  // Specific toggle functions for common settings
  const toggleDebugMode = useCallback(() => {
    toggleSetting('debugMode');
  }, [toggleSetting]);

  const toggleReasoningMode = useCallback(() => {
    toggleSetting('reasoningMode');
  }, [toggleSetting]);

  const toggleCouncilMode = useCallback(() => {
    toggleSetting('councilMode');
  }, [toggleSetting]);

  const toggleMultiThreadedMode = useCallback(() => {
    toggleSetting('multiThreadedMode');
  }, [toggleSetting]);

  // Validation functions
  const validateMaxTokens = useCallback((value) => {
    const tokens = parseInt(value);
    if (isNaN(tokens) || tokens < 100) {
      throw new Error('Max tokens must be at least 100');
    }
    if (tokens > 8192) {
      throw new Error('Max tokens cannot exceed 8192');
    }
    return tokens;
  }, []);

  const validateContextLimit = useCallback((value) => {
    const limit = parseInt(value);
    if (isNaN(limit) || limit < 1000) {
      throw new Error('Context limit must be at least 1000');
    }
    if (limit > 1000000) {
      throw new Error('Context limit cannot exceed 1,000,000');
    }
    return limit;
  }, []);

  const validateTemperature = useCallback((value) => {
    const temp = parseFloat(value);
    if (isNaN(temp) || temp < 0) {
      throw new Error('Temperature must be at least 0');
    }
    if (temp > 2) {
      throw new Error('Temperature cannot exceed 2');
    }
    return temp;
  }, []);

  // Safe update functions with validation
  const updateMaxTokens = useCallback((value) => {
    const validated = validateMaxTokens(value);
    updateSetting('maxTokens', validated);
    return validated;
  }, [validateMaxTokens, updateSetting]);

  const updateContextLimit = useCallback((value) => {
    const validated = validateContextLimit(value);
    updateSetting('contextLimit', validated);
    return validated;
  }, [validateContextLimit, updateSetting]);

  const updateTemperature = useCallback((value) => {
    const validated = validateTemperature(value);
    updateSetting('temperature', validated);
    return validated;
  }, [validateTemperature, updateSetting]);

  // Export settings as JSON
  const exportSettings = useCallback(() => {
    return {
      ...settings,
      exportedAt: new Date().toISOString(),
      version: '0.2.4'
    };
  }, [settings]);

  // Import settings from JSON
  const importSettings = useCallback((settingsData) => {
    try {
      // Validate that it's a settings export
      if (!settingsData.version || !settingsData.exportedAt) {
        throw new Error('Invalid settings format');
      }

      // Extract only the settings we recognize
      const validSettings = {};
      const defaultSettings = {
        maxTokens: 2048,
        contextLimit: 150000,
        temperature: 0.7,
        openrouterModel: 'anthropic/claude-3.5-sonnet',
        debugMode: false,
        reasoningMode: false,
        councilMode: false,
        multiThreadedMode: false,
        autoSave: true,
        autoAnalyze: false,
        showWelcomeScreen: true,
        enableMetaphorAnalysis: true,
        enableQuestionAnalysis: false,
        enableAdvisorSuggestions: true,
        batchSize: 3,
        streamingEnabled: true,
        contextPruningEnabled: true
      };

      // Only import settings that exist in our default settings
      Object.keys(defaultSettings).forEach(key => {
        if (settingsData[key] !== undefined) {
          validSettings[key] = settingsData[key];
        }
      });

      // Validate critical settings
      if (validSettings.maxTokens) {
        validSettings.maxTokens = validateMaxTokens(validSettings.maxTokens);
      }
      if (validSettings.contextLimit) {
        validSettings.contextLimit = validateContextLimit(validSettings.contextLimit);
      }
      if (validSettings.temperature) {
        validSettings.temperature = validateTemperature(validSettings.temperature);
      }

      setSettings(prev => ({
        ...prev,
        ...validSettings
      }));

      return Object.keys(validSettings).length;
    } catch (error) {
      throw new Error(`Failed to import settings: ${error.message}`);
    }
  }, [validateMaxTokens, validateContextLimit, validateTemperature]);

  // Get settings summary for display
  const getSettingsSummary = useCallback(() => {
    return {
      performance: {
        maxTokens: settings.maxTokens,
        contextLimit: settings.contextLimit,
        streamingEnabled: settings.streamingEnabled,
        batchSize: settings.batchSize
      },
      features: {
        debugMode: settings.debugMode,
        reasoningMode: settings.reasoningMode,
        multiThreadedMode: settings.multiThreadedMode,
        councilMode: settings.councilMode
      },
      analysis: {
        enableMetaphorAnalysis: settings.enableMetaphorAnalysis,
        enableAdvisorSuggestions: settings.enableAdvisorSuggestions,
        autoAnalyze: settings.autoAnalyze
      },
      model: {
        openrouterModel: settings.openrouterModel,
        temperature: settings.temperature
      }
    };
  }, [settings]);

  // Check if settings have been modified from defaults
  const hasCustomSettings = useCallback(() => {
    const defaultSettings = {
      maxTokens: 2048,
      contextLimit: 150000,
      temperature: 0.7,
      openrouterModel: 'anthropic/claude-3.5-sonnet',
      debugMode: false,
      reasoningMode: false,
      councilMode: false,
      multiThreadedMode: false,
      autoSave: true,
      autoAnalyze: false,
      showWelcomeScreen: true,
      enableMetaphorAnalysis: true,
      enableQuestionAnalysis: false,
      enableAdvisorSuggestions: true,
      batchSize: 3,
      streamingEnabled: true,
      contextPruningEnabled: true
    };

    return Object.keys(defaultSettings).some(key => 
      settings[key] !== defaultSettings[key]
    );
  }, [settings]);

  return {
    // Settings state
    settings,
    apiKeysSet,
    useAuthSystem,
    
    // Direct setters (for compatibility)
    setSettings,
    setApiKeysSet,
    
    // Update functions
    updateSetting,
    updateSettings,
    resetSettings,
    toggleSetting,
    
    // Specific toggles
    toggleDebugMode,
    toggleReasoningMode,
    toggleCouncilMode,
    toggleMultiThreadedMode,
    
    // Safe update functions with validation
    updateMaxTokens,
    updateContextLimit,
    updateTemperature,
    
    // Validation functions
    validateMaxTokens,
    validateContextLimit,
    validateTemperature,
    
    // Import/export
    exportSettings,
    importSettings,
    
    // Utilities
    getSettingsSummary,
    hasCustomSettings
  };
}

export default useAppSettings;
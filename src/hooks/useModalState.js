import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal and panel visibility states in SPACE Terminal
 * Extracts all UI state management from Terminal.jsx
 */
export function useModalState() {
  // Modal states
  const [modals, setModals] = useState({
    advisorForm: false,
    settings: false,
    voting: false,
    highCouncil: false,
    assertions: false,
    evaluations: false,
    dossier: false,
    importExport: false,
    help: false,
    info: false,
    migration: false,
    welcome: false,
    addPrompt: false,
    exportMenu: false
  });

  // Panel states  
  const [panels, setPanels] = useState({
    metaphors: false,
    questions: false, // Deprecated but kept for compatibility
    advisorSuggestions: false,
    sessionPanel: false,
    promptLibrary: false
  });

  // Additional UI states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Modal-related data states
  const [selectedAdvisorForAssertions, setSelectedAdvisorForAssertions] = useState(null);
  const [selectedResponseForEvaluation, setSelectedResponseForEvaluation] = useState(null);
  const [suggestedAdvisorName, setSuggestedAdvisorName] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);

  // Generic modal control functions
  const openModal = useCallback((modalName, data = null) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
    
    // Handle modal-specific data
    switch (modalName) {
      case 'assertions':
        if (data) setSelectedAdvisorForAssertions(data);
        break;
      case 'evaluations':
        if (data) setSelectedResponseForEvaluation(data);
        break;
      case 'advisorForm':
        if (data?.suggestedName) setSuggestedAdvisorName(data.suggestedName);
        break;
      default:
        break;
    }
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    
    // Clear related data when closing specific modals
    switch (modalName) {
      case 'assertions':
        setSelectedAdvisorForAssertions(null);
        break;
      case 'evaluations':
        setSelectedResponseForEvaluation(null);
        break;
      case 'advisorForm':
        setSuggestedAdvisorName('');
        break;
      default:
        break;
    }
  }, []);

  const toggleModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      advisorForm: false,
      settings: false,
      voting: false,
      highCouncil: false,
      assertions: false,
      evaluations: false,
      dossier: false,
      importExport: false,
      help: false,
      info: false,
      migration: false,
      welcome: false,
      addPrompt: false,
      exportMenu: false
    });
    
    // Clear related data
    setSelectedAdvisorForAssertions(null);
    setSelectedResponseForEvaluation(null);
    setSuggestedAdvisorName('');
  }, []);

  // Panel control functions
  const openPanel = useCallback((panelName) => {
    setPanels(prev => ({ ...prev, [panelName]: true }));
  }, []);

  const closePanel = useCallback((panelName) => {
    setPanels(prev => ({ ...prev, [panelName]: false }));
  }, []);

  const togglePanel = useCallback((panelName) => {
    setPanels(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  }, []);

  const closeAllPanels = useCallback(() => {
    setPanels({
      metaphors: false,
      questions: false,
      advisorSuggestions: false,
      sessionPanel: false,
      promptLibrary: false
    });
  }, []);

  // Specific modal opening functions for common use cases
  const openAdvisorForm = useCallback((suggestedName = '') => {
    openModal('advisorForm', { suggestedName });
  }, [openModal]);

  const openAssertionsModal = useCallback((advisorData) => {
    openModal('assertions', advisorData);
  }, [openModal]);

  const openEvaluationsModal = useCallback((responseData) => {
    openModal('evaluations', responseData);
  }, [openModal]);

  // Navigation between related modals
  const navigateFromAssertionsToEvaluations = useCallback((assertionsData) => {
    closeModal('assertions');
    setSelectedResponseForEvaluation(assertionsData);
    openModal('evaluations');
  }, [closeModal, openModal]);

  const navigateFromPromptLibraryToAddPrompt = useCallback(() => {
    closeModal('promptLibrary');
    openModal('addPrompt');
  }, [closeModal, openModal]);

  const navigateFromAddPromptToPromptLibrary = useCallback(() => {
    closeModal('addPrompt');
    openModal('promptLibrary');
  }, [closeModal, openModal]);

  // Fullscreen management
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Initialization management
  const completeInitialization = useCallback(() => {
    setIsInitializing(false);
  }, []);

  // Prompt editing
  const startEditingPrompt = useCallback((prompt) => {
    setEditingPrompt(prompt);
    closePanel('promptLibrary');
  }, [closePanel]);

  const stopEditingPrompt = useCallback(() => {
    setEditingPrompt(null);
  }, []);

  // Get modal/panel status
  const getModalState = useCallback((modalName) => {
    return modals[modalName] || false;
  }, [modals]);

  const getPanelState = useCallback((panelName) => {
    return panels[panelName] || false;
  }, [panels]);

  const isAnyModalOpen = useCallback(() => {
    return Object.values(modals).some(isOpen => isOpen);
  }, [modals]);

  const isAnyPanelOpen = useCallback(() => {
    return Object.values(panels).some(isOpen => isOpen);
  }, [panels]);

  // Get list of open modals/panels
  const getOpenModals = useCallback(() => {
    return Object.entries(modals)
      .filter(([_, isOpen]) => isOpen)
      .map(([name, _]) => name);
  }, [modals]);

  const getOpenPanels = useCallback(() => {
    return Object.entries(panels)
      .filter(([_, isOpen]) => isOpen)
      .map(([name, _]) => name);
  }, [panels]);

  return {
    // Modal states
    modals,
    panels,
    isFullscreen,
    isInitializing,
    
    // Modal-related data
    selectedAdvisorForAssertions,
    selectedResponseForEvaluation,
    suggestedAdvisorName,
    editingPrompt,
    
    // Setters (for direct access when needed)
    setModals,
    setPanels,
    setIsFullscreen,
    setIsInitializing,
    setSelectedAdvisorForAssertions,
    setSelectedResponseForEvaluation,
    setSuggestedAdvisorName,
    setEditingPrompt,
    
    // Generic modal controls
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    
    // Panel controls
    openPanel,
    closePanel,
    togglePanel,
    closeAllPanels,
    
    // Specific modal openers
    openAdvisorForm,
    openAssertionsModal,
    openEvaluationsModal,
    
    // Modal navigation
    navigateFromAssertionsToEvaluations,
    navigateFromPromptLibraryToAddPrompt,
    navigateFromAddPromptToPromptLibrary,
    
    // Fullscreen controls
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    
    // Initialization
    completeInitialization,
    
    // Prompt editing
    startEditingPrompt,
    stopEditingPrompt,
    
    // State queries
    getModalState,
    getPanelState,
    isAnyModalOpen,
    isAnyPanelOpen,
    getOpenModals,
    getOpenPanels
  };
}

export default useModalState;
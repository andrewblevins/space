import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MemorySystem } from '../lib/memory';
import { OpenAI } from 'openai';
import AdvisorForm from './AdvisorForm';
import EditAdvisorForm from './EditAdvisorForm';
import EditPromptForm from './EditPromptForm';
import SettingsMenu from './SettingsMenu';
import '@fontsource/vollkorn';
import TagAnalyzer, { sharedTagAnalyzer } from '../lib/tagAnalyzer';
import ApiKeySetup from './ApiKeySetup';
import { getApiEndpoint } from '../utils/apiConfig';
import { defaultPrompts } from '../lib/defaultPrompts';
import { handleApiError } from '../utils/apiErrorHandler';
import { getNextAvailableColor, ADVISOR_COLORS } from '../lib/advisorColors';
import { setEncrypted, removeEncrypted, setModalController, hasEncryptedData } from '../utils/secureStorage';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import AccordionMenu from './AccordionMenu';
import SessionPanel from './SessionPanel';
import PromptLibrary from './PromptLibrary';
import AddPromptForm from './AddPromptForm';
import ExportMenu from './ExportMenu';
import DossierModal from './DossierModal';
import ImportExportModal from './ImportExportModal';
import HelpModal from './HelpModal';
import InfoModal from './InfoModal';
import WelcomeScreen from './WelcomeScreen';
import ThinkingBlock from './ThinkingBlock';
import { Module } from "./terminal/Module";
import { GroupableModule } from "./terminal/GroupableModule";
import { CollapsibleModule } from "./terminal/CollapsibleModule";
import { CollapsibleClickableModule } from "./terminal/CollapsibleClickableModule";
// DEPRECATED: High Council Mode components
// import DebateBlock from './DebateBlock';
import { CollapsibleSuggestionsModule } from "./terminal/CollapsibleSuggestionsModule";
import VotingModal from './VotingModal';
// import HighCouncilModal from './HighCouncilModal';
import { ExpandingInput } from "./terminal/ExpandingInput";
import { MemoizedMarkdownMessage } from "./terminal/MemoizedMarkdownMessage";
import { AdvisorResponseMessage } from "./terminal/AdvisorResponseMessage";
import { AdvisorResponseCard } from "./terminal/AdvisorResponseCard";
import MessageRenderer from "./terminal/MessageRenderer";
import useClaude from "../hooks/useClaude";
import useOpenRouter from "../hooks/useOpenRouter";
import useParallelAdvisors from "../hooks/useParallelAdvisors";
import { analyzeMetaphors, analyzeForQuestions, summarizeSession, generateSessionSummary } from "../utils/terminalHelpers";
import { trackUsage, trackSession } from '../utils/usageTracking';
import { worksheetQuestions, WORKSHEET_TEMPLATES } from "../utils/worksheetTemplates";
import { useConversationStorage } from '../hooks/useConversationStorage';
// DEPRECATED: Migration system no longer needed
// import { needsMigration } from '../utils/migrationHelper';
// import MigrationModal from './MigrationModal';
import AssertionsModal from './AssertionsModal';
import EvaluationsModal from './EvaluationsModal';
import ResponsiveContainer from './responsive/ResponsiveContainer';
import MobileLayout from './mobile/MobileLayout';
import JournalOnboarding from './JournalOnboarding';
import AdvisorSuggestionsModal from './AdvisorSuggestionsModal';
import PerspectiveGenerator from './PerspectiveGenerator';
import { generateAdvisorSuggestions } from '../utils/advisorSuggestions';




const Terminal = ({ theme, toggleTheme }) => {
  const modalController = useModal();
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { user: null, session: null };
  const { user, session } = authData;
  const storage = useConversationStorage();
  
  // Database storage state - initialize from persisted value
  const [currentConversationId, setCurrentConversationId] = useState(() => {
    const persisted = loadPersistedCurrentSession();
    return persisted.conversationId || null;
  });
  const [useDatabaseStorage, setUseDatabaseStorage] = useState(() => {
    const useDb = useAuthSystem && !!user;
    console.log('🗃️ Database storage decision:', { useAuthSystem, user: !!user, useDatabaseStorage: useDb });
    return useDb;
  });
  // DEPRECATED: Migration modal no longer needed
  // const [showMigrationModal, setShowMigrationModal] = useState(() => {
  //   console.log('🔄 Initializing showMigrationModal to false');
  //   return false;
  // });
  
  // Initialize the modal controller for secureStorage
  useEffect(() => {
    if (modalController) {
      setModalController(modalController);
    }
  }, [modalController]);

  // DEPRECATED: Migration check no longer needed
  // // Check for migration when user logs in (only if there are actual conversations)
  // useEffect(() => {
  //   if (useAuthSystem && user) {
  //     const needs = needsMigration();
  //     console.log('🔄 Migration check:', { needs, useAuthSystem, user: !!user, currentModalState: showMigrationModal });
  //     if (needs && !showMigrationModal) {
  //       console.log('🔄 Setting migration modal to TRUE (login check)');
  //       setShowMigrationModal(true);
  //     }
  //   }
  // }, [useAuthSystem, user]);

  // Sync useDatabaseStorage when user state changes
  useEffect(() => {
    const shouldUseDatabase = useAuthSystem && !!user;
    if (useDatabaseStorage !== shouldUseDatabase) {
      console.log('🗃️ Updating database storage decision:', { 
        useAuthSystem, 
        user: !!user, 
        previous: useDatabaseStorage, 
        new: shouldUseDatabase 
      });
      setUseDatabaseStorage(shouldUseDatabase);
      
      // If switching from localStorage to database storage, try to load most recent database conversation
      if (shouldUseDatabase && !useDatabaseStorage) {
        console.log('🔄 Switching to database storage, will load most recent conversation');
        // The auto-load effect will handle loading the conversation
      }
    }
  }, [user, useAuthSystem, useDatabaseStorage]);

  const getNextSessionId = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('space_session_'));
    if (keys.length === 0) return 1;
    
    const ids = keys.map(key => parseInt(key.replace('space_session_', '')));
    return Math.max(...ids) + 1;
  };

  // Persist current session/conversation ID so it survives page refreshes
  const persistCurrentSession = (sessionId, conversationId) => {
    try {
      if (conversationId) {
        // Database storage: persist conversation ID
        localStorage.setItem('space_current_conversation_id', conversationId);
        localStorage.setItem('space_current_session_id', conversationId); // Use conversation ID as session ID
      } else if (sessionId) {
        // LocalStorage storage: persist session ID
        localStorage.setItem('space_current_session_id', sessionId.toString());
        localStorage.removeItem('space_current_conversation_id'); // Clear if switching to localStorage mode
      }
    } catch (error) {
      console.error('Failed to persist current session:', error);
    }
  };

  // Load persisted current session/conversation ID
  const loadPersistedCurrentSession = () => {
    try {
      const conversationId = localStorage.getItem('space_current_conversation_id');
      const sessionId = localStorage.getItem('space_current_session_id');
      
      return {
        conversationId: conversationId || null,
        sessionId: sessionId || null
      };
    } catch (error) {
      console.error('Failed to load persisted current session:', error);
      return { conversationId: null, sessionId: null };
    }
  };

  const handleAdvisorImport = (importedAdvisors, mode) => {
    if (mode === 'replace') {
      setAdvisors(importedAdvisors);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Replaced all perspectives with ${importedAdvisors.length} imported perspectives.`
      }]);
    } else {
      // Add mode - append to existing advisors, avoiding duplicates
      const existingNames = new Set(advisors.map(a => a.name.toLowerCase()));
      const newAdvisors = importedAdvisors.filter(a => !existingNames.has(a.name.toLowerCase()));
      const duplicates = importedAdvisors.length - newAdvisors.length;

      setAdvisors(prev => [...prev, ...newAdvisors]);

      let message = `Added ${newAdvisors.length} new advisors.`;
      if (duplicates > 0) {
        message += ` Skipped ${duplicates} duplicate${duplicates > 1 ? 's' : ''}.`;
      }

      setMessages(prev => [...prev, {
        type: 'system',
        content: message
      }]);
    }
  };

  // Journal onboarding handlers
  const handleJournalSubmit = async (journalText) => {
    try {
      // Start context question flow
      const { generateContextQuestion } = await import('../utils/contextQuestions');

      // Generate first question
      const firstQuestion = await generateContextQuestion(journalText);

      // Set up context flow state with empty answer slots
      setContextFlow({
        active: true,
        initialEntry: journalText,
        questions: [firstQuestion],
        answers: ['', '', ''], // Pre-allocate 3 answer slots
        currentQuestionIndex: 0,
        hasNextQuestion: false // Initialize hasNextQuestion tracking
      });

    } catch (error) {
      console.error('Error starting context question flow:', error);
      // Fall back to old behavior - generate perspectives directly
      await generatePerspectivesFromContext(journalText, []);
    }
  };

  // Handle answer to context question
  const handleAnswerQuestion = async (answer, skipToGenerate) => {
    // Update answer at current index
    const newAnswers = [...contextFlow.answers];
    newAnswers[contextFlow.currentQuestionIndex] = answer && answer.trim() ? answer.trim() : '';

    // If user wants to skip to generate, or we've reached 3 questions
    if (skipToGenerate || contextFlow.currentQuestionIndex >= 2) {
      // Generate perspectives with all collected context (filter out empty answers)
      const filledAnswers = newAnswers.filter(a => a);
      await generatePerspectivesFromContext(contextFlow.initialEntry, filledAnswers);
      return;
    }

    // Generate next question if we don't have it yet
    if (!contextFlow.questions[contextFlow.currentQuestionIndex + 1]) {
      try {
        console.log('Generating question', contextFlow.currentQuestionIndex + 2, 'of 3');
        const filledAnswers = newAnswers.filter(a => a);
        console.log('Previous answers:', filledAnswers);
        
        const { generateContextQuestion } = await import('../utils/contextQuestions');
        const nextQuestion = await generateContextQuestion(
          contextFlow.initialEntry,
          filledAnswers
        );

        setContextFlow({
          ...contextFlow,
          questions: [...contextFlow.questions, nextQuestion],
          answers: newAnswers,
          currentQuestionIndex: contextFlow.currentQuestionIndex + 1,
          hasNextQuestion: contextFlow.currentQuestionIndex + 1 < 2 // Track if there will be another question after this one
        });
      } catch (error) {
        console.error('Error generating next question:', error);
        // Show error to user instead of silent fallback
        setMessages(prev => [...prev, {
          type: 'system',
          content: 'Unable to generate next question. Proceeding with collected context.'
        }]);
        const filledAnswers = newAnswers.filter(a => a);
        await generatePerspectivesFromContext(contextFlow.initialEntry, filledAnswers);
      }
    } else {
      // Just navigate to next question
      setContextFlow({
        ...contextFlow,
        answers: newAnswers,
        currentQuestionIndex: contextFlow.currentQuestionIndex + 1,
        hasNextQuestion: contextFlow.currentQuestionIndex + 1 < 2 // Update hasNextQuestion when navigating
      });
    }
  };

  // Handle navigation between questions
  const handleNavigateQuestion = async (direction, currentAnswer) => {
    // Save current answer
    const newAnswers = [...contextFlow.answers];
    newAnswers[contextFlow.currentQuestionIndex] = currentAnswer && currentAnswer.trim() ? currentAnswer.trim() : '';

    if (direction === 'back') {
      // Go to previous question
      setContextFlow({
        ...contextFlow,
        answers: newAnswers,
        currentQuestionIndex: contextFlow.currentQuestionIndex - 1,
        hasNextQuestion: contextFlow.questions[contextFlow.currentQuestionIndex] !== undefined // Update hasNextQuestion when going back
      });
    } else if (direction === 'forward') {
      // Go to next question (if it exists)
      if (contextFlow.questions[contextFlow.currentQuestionIndex + 1]) {
        setContextFlow({
          ...contextFlow,
          answers: newAnswers,
          currentQuestionIndex: contextFlow.currentQuestionIndex + 1,
          hasNextQuestion: contextFlow.currentQuestionIndex + 1 < 2 && contextFlow.questions[contextFlow.currentQuestionIndex + 2] !== undefined // Update hasNextQuestion when going forward
        });
      }
    }
  };

  // Handle skip question
  const handleSkipQuestion = async () => {
    // Move to next question or generate if at end
    if (contextFlow.currentQuestionIndex >= 2) {
      await generatePerspectivesFromContext(contextFlow.initialEntry, contextFlow.answers);
      return;
    }

    // Generate next question
    try {
      console.log('Generating question', contextFlow.currentQuestionIndex + 2, 'of 3 (after skip)');
      const { generateContextQuestion } = await import('../utils/contextQuestions');
      const nextQuestion = await generateContextQuestion(
        contextFlow.initialEntry,
        contextFlow.answers
      );

      setContextFlow({
        ...contextFlow,
        questions: [...contextFlow.questions, nextQuestion],
        currentQuestionIndex: contextFlow.currentQuestionIndex + 1,
        hasNextQuestion: contextFlow.currentQuestionIndex + 1 < 2 // Track if there will be another question after this one
      });
    } catch (error) {
      console.error('Error generating next question:', error);
      // Show error to user instead of silent fallback
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'Unable to generate next question. Proceeding with collected context.'
      }]);
      await generatePerspectivesFromContext(contextFlow.initialEntry, contextFlow.answers);
    }
  };

  // Generate perspectives with full context (journal + questions + answers)
  const generatePerspectivesFromContext = async (journalText, answers) => {
    try {
      setIsGeneratingSuggestions(true);

      // Generate a new session ID for this new conversation
      const newSessionId = getNextSessionId();
      setCurrentSessionId(newSessionId);
      console.log('📝 Starting new session after context gathering:', newSessionId);

      // Clear any existing messages
      setMessages([]);

      // Build full context with questions and answers interleaved
      const contextParts = [journalText];

      // Add question/answer pairs
      for (let i = 0; i < contextFlow.questions.length; i++) {
        const question = contextFlow.questions[i];
        const answer = answers[i];

        if (question) {
          contextParts.push(question);
          if (answer && answer.trim()) {
            contextParts.push(answer);
          }
        }
      }

      const fullContext = contextParts.filter(text => text && text.trim()).join('\n\n');

      // Store full context in input field
      setInput(fullContext);

      // Generate perspective suggestions with full context
      const existingNames = advisors.map(a => a.name);
      const suggestions = await generateAdvisorSuggestions(fullContext, advisors, existingNames);
      setJournalSuggestions(suggestions);

      // Track these names for future regenerations
      setPreviousSuggestionNames([...existingNames, ...suggestions.map(s => s.name)]);

      // Reset context flow and hide onboarding
      setContextFlow({
        active: false,
        initialEntry: '',
        questions: [],
        answers: [],
        currentQuestionIndex: 0
      });
      setShowJournalOnboarding(false);
      setShowJournalSuggestions(true);
      setIsGeneratingSuggestions(false);
    } catch (error) {
      console.error('Error generating perspective suggestions:', error);
      setIsGeneratingSuggestions(false);

      // Show error message
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Failed to generate perspective suggestions: ${error.message}. You can still add perspectives manually using the + button.`
      }]);

      // Close onboarding and reset context flow
      setContextFlow({
        active: false,
        initialEntry: '',
        questions: [],
        answers: [],
        currentQuestionIndex: 0
      });
      setShowJournalOnboarding(false);
    }
  };

  const handleJournalSkip = (text) => {
    setShowJournalOnboarding(false);
    // Clear any existing messages to start fresh
    setMessages([]);
    // Generate a new session ID to ensure we don't save to the old conversation
    const newSessionId = getNextSessionId();
    setCurrentSessionId(newSessionId);
    console.log('📝 Starting new session after journal skip:', newSessionId);
    // Set the text from journal into the input field
    if (text && text.trim()) {
      setInput(text.trim());
    }
  };

  const handleAddSuggestedAdvisors = async (selectedAdvisors) => {
    // Separate existing advisors (to activate) from new advisors (to add)
    const existingNames = new Set(advisors.map(a => a.name));
    const toActivate = selectedAdvisors.filter(a => existingNames.has(a.name));
    const toAdd = selectedAdvisors.filter(a => !existingNames.has(a.name));

    // Activate existing advisors + add new advisors
    const updatedAdvisors = advisors.map(a =>
      toActivate.some(ta => ta.name === a.name) ? { ...a, active: true } : a
    );

    // Add completely new advisors
    const newAdvisorsWithActive = toAdd.map(advisor => ({
      ...advisor,
      active: true
    }));

    const finalAdvisors = [...updatedAdvisors, ...newAdvisorsWithActive];
    setAdvisors(finalAdvisors);

    // Don't show system message about added/activated advisors
    // Just silently add them and let them respond

    // Close modal
    setShowJournalSuggestions(false);

    // Trigger parallel advisor responses to the journal entry
    // Get the journal entry (first user message)
    const journalMessage = messages.find(m => m.type === 'user');
    if (journalMessage && finalAdvisors.filter(a => a.active).length > 0) {
      // Set loading state
      setIsLoading(true);

      try {
        // Call parallel advisors with the journal entry
        // Note: callParallelAdvisors expects (userMessage, activeAdvisors)
        await callParallelAdvisors(journalMessage.content, finalAdvisors.filter(a => a.active));
      } catch (error) {
        console.error('Error generating advisor responses:', error);
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Failed to generate advisor responses: ${error.message}`
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRegenerateSuggestions = async () => {
    try {
      setIsGeneratingSuggestions(true);

      // Get the first user message (journal entry)
      const journalMessage = messages.find(m => m.type === 'user');
      if (journalMessage) {
        // Pass previous names to avoid duplicates
        const suggestions = await generateAdvisorSuggestions(journalMessage.content, advisors, previousSuggestionNames);
        setJournalSuggestions(suggestions);

        // Add these new names to the previous list
        setPreviousSuggestionNames(prev => [...prev, ...suggestions.map(s => s.name)]);
      }

      setIsGeneratingSuggestions(false);
    } catch (error) {
      console.error('Error regenerating suggestions:', error);
      setIsGeneratingSuggestions(false);

      setMessages(prev => [...prev, {
        type: 'system',
        content: `Failed to regenerate suggestions: ${error.message}`
      }]);
    }
  };

  const handleSkipSuggestions = () => {
    setShowJournalSuggestions(false);
  };

  // Helper to create advisor object from form data
  const createAdvisorObject = ({ name, description, color }, active = true) => ({
    name,
    description,
    color,
    active
  });

  // Handler for creating custom perspective (opens AdvisorForm modal)
  const handleCreateCustomPerspective = () => {
    // Set a flag to indicate this is for the suggestions modal
    setEditingAdvisor({ isNewForSuggestions: true });
  };

  // Handler when custom perspective is saved from AdvisorForm
  const handleSaveCustomPerspective = (newAdvisor) => {
    // Add to custom perspectives array (auto-selected)
    setCustomPerspectives(prev => [...prev, newAdvisor]);
    console.log('Added custom perspective:', newAdvisor);
  };

  // DEPRECATED: High Council debate processing - Replaced by parallel advisor streaming
  // Process council debate sections for streaming-friendly collapsible display
  // const processCouncilDebates = (content) => {
  //   // Check if content starts with High Council debate format
  //   if (content.startsWith('<COUNCIL_DEBATE>')) {
  //     // Find where summary starts
  //     const summaryMatch = content.match(/## Council Summary/i);
  //
  //     if (summaryMatch) {
  //       // Split at summary
  //       const debateEnd = summaryMatch.index;
  //       const debateContent = content.substring('<COUNCIL_DEBATE>'.length, debateEnd);
  //       const summaryContent = content.substring(debateEnd);
  //       return {
  //         processedContent: summaryContent,
  //         debates: [debateContent]
  //       };
  //     } else {
  //       // No summary yet (still streaming), treat everything after opening tag as debate
  //       const debateContent = content.substring('<COUNCIL_DEBATE>'.length);
  //       return {
  //         processedContent: '',
  //         debates: [debateContent]
  //       };
  //     }
  //   }
  //
  //   // Fallback to original regex approach for completed responses
  //   const debateRegex = /<COUNCIL_DEBATE>([\s\S]*?)<\/COUNCIL_DEBATE>/g;
  //   const debates = [];
  //   let processedContent = content;
  //   let match;
  //
  //   while ((match = debateRegex.exec(content)) !== null) {
  //     const debateContent = match[1].trim();
  //     debates.push(debateContent);
  //     processedContent = processedContent.replace(match[0], `__DEBATE_PLACEHOLDER_${debates.length - 1}__`);
  //   }
  //
  //   return { processedContent, debates };
  // };

  const [messages, setMessages] = useState(() => {
    const baseMessages = [];
    
    // Add auth-specific welcome message
    if (useAuthSystem && user) {
      baseMessages.push({
        type: 'system',
        content: `Welcome back${user.email ? ', ' + user.email.split('@')[0] : ''}! You have 100 messages per day to explore complex problems with AI advisors. Your limit resets at midnight.`
      });
    }
    
    baseMessages.push({
      type: 'system',
      content: 'Start a conversation, add a perspective (+), draw from the Prompt Library (↙), or type /help for instructions.'
    });
    
    return baseMessages;
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metaphors, setMetaphors] = useState([]);
  // DEPRECATED: Questions feature temporarily disabled - can be reactivated by uncommenting
  // const [questions, setQuestions] = useState([]);
  // Initialize currentSessionId from persisted value, or generate new one
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const persisted = loadPersistedCurrentSession();
    if (persisted.sessionId) {
      // Check if it's a UUID (database conversation) or integer (localStorage session)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(persisted.sessionId);
      if (isUUID) {
        return persisted.sessionId; // Return UUID as-is
      } else {
        return parseInt(persisted.sessionId) || getNextSessionId();
      }
    }
    return getNextSessionId();
  });
  const [advisors, setAdvisors] = useState(() => {
    const saved = localStorage.getItem('space_advisors');
    const savedAdvisors = saved ? JSON.parse(saved) : [];
    
    // Auto-assign colors to advisors that don't have them
    let hasChanges = false;
    const updatedAdvisors = [];
    const assignedColors = [];
    
    // First pass: collect all existing colors
    savedAdvisors.forEach(advisor => {
      if (advisor.color) {
        assignedColors.push(advisor.color);
      }
    });
    
    // Second pass: assign colors to advisors without them
    savedAdvisors.forEach(advisor => {
      if (!advisor.color) {
        hasChanges = true;
        // Find next available color that hasn't been assigned yet
        const availableColors = ADVISOR_COLORS.filter(color => !assignedColors.includes(color));
        const newColor = availableColors.length > 0 ? availableColors[0] : ADVISOR_COLORS[assignedColors.length % ADVISOR_COLORS.length];
        assignedColors.push(newColor);
        updatedAdvisors.push({
          ...advisor,
          color: newColor
        });
      } else {
        updatedAdvisors.push(advisor);
      }
    });
    
    // If we made changes, save them back to localStorage
    if (hasChanges) {
      localStorage.setItem('space_advisors', JSON.stringify(updatedAdvisors));
    }
    
    return updatedAdvisors;
  });
  const [advisorGroups, setAdvisorGroups] = useState(() => {
    const saved = localStorage.getItem('space_advisor_groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGroups, setActiveGroups] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [reasoningMode, setReasoningMode] = useState(() => {
    const saved = localStorage.getItem('space_reasoning_mode');
    return saved ? saved === 'true' : false;
  });
  const inputRef = useRef(null);
  const [savedPrompts, setSavedPrompts] = useState(() => {
    const saved = localStorage.getItem('space_prompts');
    const userPrompts = saved ? JSON.parse(saved) : [];
    
    // Migrate existing prompts that may have 'content' instead of 'text'
    const migratedUserPrompts = userPrompts.map(p => ({
      name: p.name,
      text: p.text || p.content || '' // Use text if it exists, otherwise content, otherwise empty
    }));
    
    // Merge user prompts with defaults, giving precedence to user prompts
    const userPromptNames = new Set(migratedUserPrompts.map(p => p.name));
    const defaultPromptsWithTextProperty = defaultPrompts
      .filter(p => !userPromptNames.has(p.name))
      .map(p => ({ name: p.name, text: p.content })); // Map content to text
    const mergedPrompts = [
      ...migratedUserPrompts,
      ...defaultPromptsWithTextProperty
    ];
    
    // Save migrated prompts back to localStorage if migration occurred
    const needsMigration = userPrompts.some(p => p.content && !p.text);
    if (needsMigration) {
      localStorage.setItem('space_prompts', JSON.stringify(mergedPrompts));
    }
    
    return mergedPrompts;
  });
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [editAdvisorText, setEditAdvisorText] = useState('');
  const [worksheetMode, setWorksheetMode] = useState(false);
  const [worksheetStep, setWorksheetStep] = useState(0);
  const [worksheetAnswers, setWorksheetAnswers] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentWorksheetId, setCurrentWorksheetId] = useState(null);
  const memory = new MemorySystem();
  const [showAdvisorForm, setShowAdvisorForm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalRef = useRef(null);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('space_sidebar_collapsed');
    return saved === 'true';
  });
  const [maxTokens, setMaxTokens] = useState(() => {
    const saved = localStorage.getItem('space_max_tokens');
    return saved ? parseInt(saved) : 2048;
  });
  const [metaphorsExpanded, setMetaphorsExpanded] = useState(false);
  const [lastMetaphorAnalysisContent, setLastMetaphorAnalysisContent] = useState('');
  // DEPRECATED: Questions feature temporarily disabled
  // const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [advisorSuggestionsExpanded, setAdvisorSuggestionsExpanded] = useState(false);
  const [advisorSuggestions, setAdvisorSuggestions] = useState([]);
  const [voteHistory, setVoteHistory] = useState([]);
  const [showVotingModal, setShowVotingModal] = useState(false);
  // DEPRECATED: High Council Mode state
  // const [showHighCouncilModal, setShowHighCouncilModal] = useState(false);
  const [lastAdvisorAnalysisContent, setLastAdvisorAnalysisContent] = useState('');
  const [suggestedAdvisorName, setSuggestedAdvisorName] = useState('');
  const [contextLimit, setContextLimit] = useState(150000);
  // Already defined useAuthSystem at the top of component
  const [apiKeysSet, setApiKeysSet] = useState(useAuthSystem);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedKeys, setHasCheckedKeys] = useState(false);
  const [autoScroll, setAutoScroll] = useState(() => {
    const saved = localStorage.getItem('space_auto_scroll');
    return saved ? JSON.parse(saved) : false; // Default: off
  });
  
  // Handler to reset to welcome screen
  const resetToWelcome = () => {
    setShowWelcome(true);
  };
  const [openaiClient, setOpenaiClient] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showSessionPanel, setShowSessionPanel] = useState(false);


  const [showAddPromptForm, setShowAddPromptForm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAssertionsModal, setShowAssertionsModal] = useState(false);
  const [selectedAdvisorForAssertions, setSelectedAdvisorForAssertions] = useState(null);
  const [selectedResponseForEvaluation, setSelectedResponseForEvaluation] = useState(null);
  const [showEvaluationsModal, setShowEvaluationsModal] = useState(false);

  // Journal onboarding state
  const [showJournalOnboarding, setShowJournalOnboarding] = useState(false);
  const [journalSuggestions, setJournalSuggestions] = useState([]);
  const [showJournalSuggestions, setShowJournalSuggestions] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [customPerspectives, setCustomPerspectives] = useState([]);
  const [previousSuggestionNames, setPreviousSuggestionNames] = useState([]);

  // Context question flow state
  const [contextFlow, setContextFlow] = useState({
    active: false,
    initialEntry: '',
    questions: [],
    answers: [],
    currentQuestionIndex: 0
  });

  const [sessions, setSessions] = useState([]);
  const [sessionSelections, setSessionSelections] = useState(new Map()); // Map from title to session object
  const [currentSessionContexts, setCurrentSessionContexts] = useState([]); // Current @ reference contexts
  const [paragraphSpacing, setParagraphSpacing] = useState(() => {
    const saved = localStorage.getItem('space_paragraph_spacing');
    return saved ? parseFloat(saved) : 0.25;
  }); // Spacing between paragraphs

  // AI Model Settings - Always use OpenRouter
  const [openrouterModel, setOpenrouterModel] = useState(() => {
    // In production, always use Claude Sonnet 4
    if (!import.meta.env.DEV) {
      return 'anthropic/claude-sonnet-4';
    }
    // In development, allow user selection
    const saved = localStorage.getItem('space_openrouter_model');
    return saved || 'anthropic/claude-sonnet-4';
  });

  // Check for API keys after modal controller is initialized
  useEffect(() => {
    const checkKeys = async () => {
      try {
        // Skip API key checking in auth mode
        if (useAuthSystem) {
          console.log('🔑 Auth system enabled, skipping API key check');
          setApiKeysSet(true);
          
          // Welcome screen is now handled at App level for auth users
          
          return;
        }

        // Legacy mode: check for API keys
        if (!hasEncryptedData()) {
          console.log('❌ No encrypted keys found, showing welcome screen');
          const skipWelcome = localStorage.getItem('space_skip_welcome');
          if (!skipWelcome) {
            setShowWelcome(true);
          }
          return;
        }

        // In auth mode, we don't use encrypted storage
        console.log('🔒 Legacy encrypted keys found but auth mode is enabled');
        // Skip welcome screen since user has existing data but we're in auth mode
      } finally {
        // Always stop the loading state once initialization is complete
        setIsInitializing(false);
        setHasCheckedKeys(true);
      }
    };
    
    if (modalController && !hasCheckedKeys) {
      checkKeys();
    }
  }, [modalController, hasCheckedKeys, useAuthSystem]);

  // Auto-load current session after initialization (check persisted session first)
  useEffect(() => {
    // Wait for auth to complete if using auth system
    if (useAuthSystem && authData?.loading) {
      return;
    }
    
    if (!isInitializing && hasCheckedKeys && apiKeysSet && !showWelcome) {
      const persisted = loadPersistedCurrentSession();
      
      // Check if we have a persisted current session/conversation
      if (persisted.conversationId || persisted.sessionId) {
        console.log('🔄 Restoring persisted session:', { conversationId: persisted.conversationId, sessionId: persisted.sessionId });
        
        // Check if it's a UUID (database conversation) or integer (localStorage session)
        const isUUID = persisted.conversationId || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(persisted.sessionId);
        
        if (isUUID && useDatabaseStorage) {
          // Load from database
          const sessionIdToLoad = persisted.conversationId || persisted.sessionId;
          handleLoadSession(sessionIdToLoad);
        } else if (persisted.sessionId && !isUUID) {
          // If we have a localStorage session ID but now using database storage, try loading most recent database conversation
          if (useDatabaseStorage) {
            console.log('🔄 Persisted localStorage session but using database storage, loading most recent database conversation...');
            storage.listConversations().then(conversations => {
              if (conversations && conversations.length > 0) {
                const mostRecent = conversations[0]; // Already sorted by updated_at desc
                console.log('📂 Auto-loading most recent database conversation:', mostRecent.id, mostRecent.title);
                handleLoadSession(mostRecent.id);
              } else {
                console.log('📭 No database conversations found to auto-load');
              }
            }).catch(error => {
              console.error('Failed to load database conversations:', error);
            });
          } else {
            // Load from localStorage
            handleLoadSession(persisted.sessionId);
          }
        } else {
          // Fall back to most recent session
          console.log('🔄 No valid persisted session, loading most recent...');
          if (useDatabaseStorage) {
            // Try database first
            storage.listConversations().then(conversations => {
              if (conversations && conversations.length > 0) {
                const mostRecent = conversations[0];
                console.log('📂 Auto-loading most recent database conversation:', mostRecent.id, mostRecent.title);
                handleLoadSession(mostRecent.id);
              } else {
                // Fall back to localStorage
                const allSessions = loadSessions();
                if (allSessions.length > 0) {
                  const mostRecentSession = allSessions[0];
                  console.log('📂 Auto-loading most recent localStorage session:', mostRecentSession.id, mostRecentSession.title);
                  handleLoadSession(mostRecentSession.id);
                } else {
                  console.log('📭 No sessions found to auto-load');
                }
              }
            }).catch(error => {
              console.error('Failed to load database conversations, falling back to localStorage:', error);
              const allSessions = loadSessions();
              if (allSessions.length > 0) {
                const mostRecentSession = allSessions[0];
                console.log('📂 Auto-loading most recent localStorage session:', mostRecentSession.id, mostRecentSession.title);
                handleLoadSession(mostRecentSession.id);
              } else {
                console.log('📭 No sessions found to auto-load');
              }
            });
          } else {
            const allSessions = loadSessions();
            if (allSessions.length > 0) {
              const mostRecentSession = allSessions[0];
              console.log('📂 Auto-loading most recent session:', mostRecentSession.id, mostRecentSession.title);
              handleLoadSession(mostRecentSession.id);
            } else {
              console.log('📭 No sessions found to auto-load');
            }
          }
        }
      } else {
        // No persisted session - try to load most recent
        console.log('🔄 No persisted session, loading most recent...');
        if (useDatabaseStorage) {
          // Try database first
          storage.listConversations().then(conversations => {
            if (conversations && conversations.length > 0) {
              const mostRecent = conversations[0];
              console.log('📂 Auto-loading most recent database conversation:', mostRecent.id, mostRecent.title);
              handleLoadSession(mostRecent.id);
            } else {
              // Fall back to localStorage
              const allSessions = loadSessions();
              if (allSessions.length > 0) {
                const mostRecentSession = allSessions[0];
                console.log('📂 Auto-loading most recent localStorage session:', mostRecentSession.id, mostRecentSession.title);
                handleLoadSession(mostRecentSession.id);
              } else {
                console.log('📭 No sessions found to auto-load');
              }
            }
          }).catch(error => {
            console.error('Failed to load database conversations, falling back to localStorage:', error);
            const allSessions = loadSessions();
            if (allSessions.length > 0) {
              const mostRecentSession = allSessions[0];
              console.log('📂 Auto-loading most recent localStorage session:', mostRecentSession.id, mostRecentSession.title);
              handleLoadSession(mostRecentSession.id);
            } else {
              console.log('📭 No sessions found to auto-load');
            }
          });
        } else {
          const allSessions = loadSessions();
          if (allSessions.length > 0) {
            const mostRecentSession = allSessions[0];
            console.log('📂 Auto-loading most recent session:', mostRecentSession.id, mostRecentSession.title);
            handleLoadSession(mostRecentSession.id);
          } else {
            console.log('📭 No sessions found to auto-load');
          }
        }
      }
    }
  }, [isInitializing, hasCheckedKeys, apiKeysSet, showWelcome, useDatabaseStorage, user, useAuthSystem, storage]);

  // Persist current session/conversation ID whenever it changes
  useEffect(() => {
    if (currentConversationId || currentSessionId) {
      persistCurrentSession(currentSessionId, currentConversationId);
    }
  }, [currentSessionId, currentConversationId]);

  // Storage event listener to sync state across tabs and mobile/desktop views
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (debugMode) {
        console.log('[State Sync] Storage event detected:', {
          key: e.key,
          oldValue: e.oldValue?.substring(0, 50),
          newValue: e.newValue?.substring(0, 50),
          timestamp: Date.now()
        });
      }

      // Sync advisors across tabs/views
      if (e.key === 'space_advisors' && e.newValue) {
        try {
          const newAdvisors = JSON.parse(e.newValue);
          setAdvisors(newAdvisors);
          if (debugMode) {
            console.log('[State Sync] Advisors updated from storage:', {
              count: newAdvisors.length,
              active: newAdvisors.filter(a => a.active).length
            });
          }
        } catch (error) {
          console.error('[State Sync] Failed to parse advisors:', error);
        }
      }

      // Sync current session if it changed in another tab
      if (e.key === `space_session_${currentSessionId}` && e.newValue) {
        try {
          const session = JSON.parse(e.newValue);
          if (session.messages) {
            setMessages(session.messages);
            if (session.metaphors) setMetaphors(session.metaphors);
            if (session.advisorSuggestions) setAdvisorSuggestions(session.advisorSuggestions);
            if (session.voteHistory) setVoteHistory(session.voteHistory);
            
            if (debugMode) {
              console.log('[State Sync] Session reloaded from storage:', {
                sessionId: currentSessionId,
                messageCount: session.messages.length,
                metaphorCount: session.metaphors?.length || 0
              });
            }
          }
        } catch (error) {
          console.error('[State Sync] Failed to parse session:', error);
        }
      }

      // Sync advisor groups
      if (e.key === 'space_advisor_groups' && e.newValue) {
        try {
          const newGroups = JSON.parse(e.newValue);
          setAdvisorGroups(newGroups);
          if (debugMode) {
            console.log('[State Sync] Advisor groups updated:', newGroups.length);
          }
        } catch (error) {
          console.error('[State Sync] Failed to parse advisor groups:', error);
        }
      }

      // Sync settings
      if (e.key === 'space_reasoning_mode' && e.newValue !== null) {
        setReasoningMode(e.newValue === 'true');
      }
      if (e.key === 'space_sidebar_collapsed' && e.newValue !== null) {
        setSidebarCollapsed(e.newValue === 'true');
      }
      if (e.key === 'space_max_tokens' && e.newValue !== null) {
        setMaxTokens(parseInt(e.newValue));
      }
      if (e.key === 'space_auto_scroll' && e.newValue !== null) {
        setAutoScroll(JSON.parse(e.newValue));
      }
      if (e.key === 'space_paragraph_spacing' && e.newValue !== null) {
        setParagraphSpacing(parseFloat(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentSessionId, debugMode]);

  // Debounced state persistence for advisors
  useEffect(() => {
    if (!isInitializing && advisors.length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('space_advisors', JSON.stringify(advisors));
        if (debugMode) {
          console.log('[State Sync] Advisors persisted to localStorage:', {
            count: advisors.length,
            active: advisors.filter(a => a.active).length,
            timestamp: Date.now()
          });
        }
      }, 500); // Debounce writes by 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [advisors, isInitializing, debugMode]);

  // Debounced state persistence for advisor groups
  useEffect(() => {
    if (!isInitializing && advisorGroups.length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('space_advisor_groups', JSON.stringify(advisorGroups));
        if (debugMode) {
          console.log('[State Sync] Advisor groups persisted to localStorage:', {
            count: advisorGroups.length,
            timestamp: Date.now()
          });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [advisorGroups, isInitializing, debugMode]);

  // Debug logging for state divergence tracking
  useEffect(() => {
    if (debugMode) {
      const interval = setInterval(() => {
        console.log('[State Sync] Current state snapshot:', {
          advisorCount: advisors.length,
          activeAdvisors: advisors.filter(a => a.active).map(a => a.name),
          messageCount: messages.length,
          sessionId: currentSessionId,
          metaphorCount: metaphors.length,
          timestamp: Date.now(),
          isMobile: window.innerWidth < 768
        });
      }, 10000); // Log every 10 seconds when debug mode is on

      return () => clearInterval(interval);
    }
  }, [debugMode, advisors, messages, currentSessionId, metaphors]);

// Shared JSON response format for advisor responses (without synthesis)
const ADVISOR_JSON_FORMAT = `

## Response Format

Respond with valid JSON in this structure:

{
  "type": "advisor_response",
  "advisors": [
    {
      "id": "resp-advisor-name-${Date.now()}",
      "name": "Advisor Name",
      "response": "The advisor's complete response content here...",
      "timestamp": "${new Date().toISOString()}"
    }
  ]
}

Format requirements:
- Each advisor gets their own object in the advisors array
- Use the advisor's exact name as it appears in your persona list
- Include all response content in the "response" field
- Generate unique IDs using the pattern: resp-{advisor-name-lowercase}-{timestamp}
- Return ONLY valid JSON - no additional text before or after
- Do not use markdown code blocks around the JSON`;

const getSystemPrompt = useCallback(({ sessionContexts } = {}) => {
  let prompt = "";

  // Add advisor personas
  const activeAdvisors = advisors.filter(a => a.active);
  if (activeAdvisors.length > 0) {
    prompt += `You are currently embodying the following advisors:\n${activeAdvisors.map(a => `\n${a.name}: ${a.description}`).join('\n')}\n\n`;

    // Explicit instruction to include all advisors
    prompt += `CRITICAL: You must include ALL advisors listed above in your response, even if some have empty or minimal descriptions. Every advisor name that appears in your persona list must have a response in your output. Do not exclude any advisor based on lack of description.\n\n`;

    // Add conversation continuity instructions
    prompt += `## Conversation Continuity

Track the conversation's evolution. When the user has already explained their context, don't ask them to repeat it. Build on established shared understanding. Reference specific things the user has told you earlier in natural ways. Treat this as an ongoing relationship, not a series of isolated exchanges.\n\n`;

    // DEPRECATED: High Council Mode - Replaced by parallel advisor streaming
    /* if (councilMode) {
      prompt += `\n\n## HIGH COUNCIL MODE
IMPORTANT: Start your response with the exact text "<COUNCIL_DEBATE>" (this is required for the interface to work properly).

The advisors will engage in a structured debate, each maintaining their unique perspective throughout. Each advisor should:

- Stay true to their core philosophy and worldview
- Respond authentically from their own perspective
- Keep responses concise: 2-3 sentences maximum per turn
- Be direct and punchy - avoid lengthy explanations 
- Challenge other advisors when they genuinely disagree
- Build on points that align with their own thinking
- Never abandon their perspective just to reach agreement

CRITICAL: This must be a true DEBATE where advisors directly engage with each other's arguments, not separate speeches.

Structure the debate exactly as follows:

## ROUND 1: Initial Positions
Each advisor states their position on the question.

## ROUND 2: Direct Responses
Each advisor must directly address the other advisors by name, responding to specific points from Round 1:
- "Elon, you're wrong about X because..."
- "I agree with you, Sarah, but you're missing..."
- "That's complete nonsense, Marcus. Here's why..."

## ROUND 3: Final Positions
Each advisor directly challenges or supports the others' Round 2 arguments, speaking TO each other, not about them.

CRITICAL: Use ## for round headers (not **bold**). Always add a blank line before each round header. Example:

[ADVISOR: Name] Final sentence of previous round.

## ROUND 2: Direct Responses

[ADVISOR: Next Name] First response...

REQUIREMENTS:
- Advisors must reference each other by name and quote/paraphrase specific arguments
- No advisor can ignore what others have said
- Each response must build on the conversation, not restart it
- Use transition phrases that show you're responding: "But as [Name] just pointed out..." or "That contradicts [Name]'s argument that..."

MANDATORY FORMAT REQUIREMENTS:
- Each advisor speaks for 2-3 sentences maximum per turn
- Be concise and impactful, not verbose
- You MUST wrap the entire debate in these exact tags:

<COUNCIL_DEBATE>
**ROUND 1: Initial Positions**
[ADVISOR: Name] content...

**ROUND 2: Direct Responses** 
[ADVISOR: Name] responds to [Other Advisor]...

**ROUND 3: Final Positions**
[ADVISOR: Name] presents final stance...
</COUNCIL_DEBATE>

DO NOT FORGET THE <COUNCIL_DEBATE> TAGS. Without these tags, the debate will not display properly.

## Council Summary

After the debate section, provide:
- One sentence per advisor summarizing their final position
- Synthesis: 1-2 sentences on the overall outcome or remaining tensions`;
    } */
  }
  // If no advisors are active, no system prompt is needed
  
  // Add session context from @ references  
  const contextsToUse = sessionContexts || currentSessionContexts;
  if (contextsToUse.length > 0) {
    if (prompt) prompt += "\n\n";
    prompt += "## REFERENCED CONVERSATION CONTEXTS\n\n";
    prompt += "The user has referenced the following previous conversations for context:\n\n";
    
    contextsToUse.forEach((context, index) => {
      const date = new Date(context.timestamp).toLocaleDateString();
      prompt += `### Context ${index + 1}: "${context.title}" (Session ${context.sessionId}, ${date})\n`;
      prompt += `${context.summary}\n\n`;
    });
    
    prompt += "Use these conversation contexts to inform your response when relevant. The user's message may reference specific details from these conversations.\n";
  }
  
  // Add JSON format instructions at the END to make them most prominent
  if (activeAdvisors.length > 0) {
    prompt += ADVISOR_JSON_FORMAT;
  }
  
  return prompt;
}, [advisors, currentSessionContexts]);

const { callClaude } = useClaude({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, getSystemPrompt });
const { callOpenRouter } = useOpenRouter({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt, model: openrouterModel });
const { callParallelAdvisors } = useParallelAdvisors({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode });

  // Generate a creative starting prompt for new conversations
  const generateStartingPrompt = async () => {
    try {
      // Build headers based on auth mode
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const apiUrl = useAuthSystem 
        ? `${getApiEndpoint()}/api/chat/claude`  // Backend proxy
        : `${getApiEndpoint()}/v1/messages`;     // Direct API

      if (useAuthSystem) {
        // Auth mode: use bearer token
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Legacy mode: direct API access
        headers['x-api-key'] = anthropicKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4',
          messages: [{
            role: 'user',
            content: "Generate an interesting, thought-provoking question or scenario that would make for a great conversation starter. Something that would benefit from multiple perspectives and deep thinking."
          }],
          system: `You are generating conversation starters for SPACE Terminal - a system where users experiencing cognitive or emotional constriction can talk to multiple AI advisors about complex, high-stakes problems.

Users come to SPACE when they feel stuck between limited options, overwhelmed by complexity, or unable to integrate conflicting perspectives. Generate prompts that represent someone with:

- A specific high-stakes decision or situation (not abstract questions)
- Multiple stakeholders, complex tradeoffs, or conflicting priorities
- Real consequences that matter to the person
- Need for diverse perspectives they can't access alone
- Some details but not overwhelming background

Examples of good prompts:
- "I'm considering leaving my stable job to start a company, but I have a mortgage and two kids. My co-founder is pushing for a decision next week."
- "My elderly parent needs more care but refuses to move from their home. My siblings disagree on what to do and it's tearing our family apart."
- "We're launching our product next month but discovered a potential safety issue. Fixing it means delaying 6 months and possibly losing our lead investor."

Generate ONLY the user's message describing their situation, nothing else. Include specific details but keep it concise.`,
          max_tokens: 150,
          stream: true
        }),
      });

      if (!response.ok) return;

      // Stream the response into the input field
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedText = '';

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          
          try {
            const data = JSON.parse(dataMatch[1]);
            if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              const text = data.delta.text;
              for (let i = 0; i < text.length; i++) {
                const char = text[i];
                generatedText += char;
                setInput(generatedText);
                await sleep(Math.random() * 20 + 10); // 10-30ms delay per character
              }
            }
          } catch (e) {
            console.error('Error parsing streaming event:', e);
          }
        }
      }

      // Clean up the generated prompt
      const cleanPrompt = generatedText.trim().replace(/^["']|["']$/g, '');
      setInput(cleanPrompt);
      inputRef.current?.focus();
    } catch (error) {
      // Fallback to SPACE-appropriate prompts
      const fallbackPrompts = [
        "I'm being offered a promotion that would double my salary but require relocating my family across the country. My spouse loves their current job and my kids are thriving in their schools. The decision deadline is next Friday.",
        "My startup's lead developer just quit right before our Series A pitch next month. I could try to hire someone quickly, delay the fundraising, or attempt to handle the technical presentation myself despite limited coding experience.",
        "My business partner wants to pivot our successful but niche company into a crowded market with bigger potential. I think we should double down on what's working. We need to decide before our investor meeting next week.",
        "I discovered my teenage daughter has been lying about where she goes after school. When I confronted her, she broke down and said she's been seeing a therapist because she didn't want to worry me. I don't know how to handle this.",
        "My aging mother fell last week and the doctor says she shouldn't live alone anymore. She's refusing assisted living and wants me to move in with her, but I have my own family and demanding career. My brother lives across the country and thinks I'm overreacting.",
        "I've been offered my dream job at a startup, but it requires leaving my current company right as we're about to launch a major project I've led for two years. My team is counting on me, but this opportunity might not come again.",
        "My co-founder and I disagree on whether to accept an acquisition offer that would secure our futures but likely mean the end of our original vision. The buyer wants an answer by Monday.",
        "I need to choose between an experimental treatment for my chronic condition that could help significantly but has serious risks, or staying with my current management plan that's sustainable but limiting my quality of life."
      ];
      const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
      setInput(randomPrompt);
      inputRef.current?.focus();
    }
  };

  // Generate contextual test prompt using Claude
  const generateTestPrompt = async () => {
    const hasConversation = messages.length > 0 && !messages.every(m => m.type === 'system');
    
    if (!hasConversation) {
      // Generate a creative starting prompt for new conversations
      await generateStartingPrompt();
      return;
    }

    try {
      // Build conversation context
      const contextMessages = messages
        .filter((m) => (m.type === 'user' || m.type === 'assistant') && m.content?.trim() !== '')
        .slice(-10) // Last 10 messages for context
        .map((m) => ({ role: m.type, content: m.content }));

      // Add the prompt request
      contextMessages.push({
        role: 'user',
        content: "Based on our conversation so far, what would be a natural and interesting follow-up question or comment from the user? Generate only the user's message, nothing else."
      });

      // Build headers based on auth mode
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const apiUrl = useAuthSystem 
        ? `${getApiEndpoint()}/api/chat/claude`  // Backend proxy
        : `${getApiEndpoint()}/v1/messages`;     // Direct API

      if (useAuthSystem) {
        // Auth mode: use bearer token
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Legacy mode: direct API access
        headers['x-api-key'] = anthropicKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
      }

      // Make API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4',
          messages: contextMessages,
          system: `You are helping test a conversational AI system. Based on the conversation history, generate a natural follow-up message that a user would likely say next. 

Consider:
- The topic and flow of conversation so far
- Any questions that were raised but not fully explored
- Natural follow-up questions or requests for clarification
- Deeper exploration of themes already discussed
- Challenging or probing questions that test the advisors' perspectives

Generate ONLY the user's next message, nothing else. Make it feel authentic and conversational.`,
          max_tokens: 200,
          stream: true
        }),
      });

      if (!response.ok) return;

      // Stream the response into the input field
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedText = '';

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          
          try {
            const data = JSON.parse(dataMatch[1]);
            if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              const text = data.delta.text;
              for (let i = 0; i < text.length; i++) {
                const char = text[i];
                generatedText += char;
                setInput(generatedText);
                await sleep(Math.random() * 20 + 10); // 10-30ms delay per character
              }
            }
          } catch (e) {
            console.error('Error parsing streaming event:', e);
          }
        }
      }

      // Clean up the generated prompt
      const cleanPrompt = generatedText.trim().replace(/^["']|["']$/g, '');
      setInput(cleanPrompt);
      inputRef.current?.focus();
    } catch (error) {
      // Silently fail
      console.error('Test prompt generation failed:', error);
    }
  };

  // Keyboard shortcut for test prompts (Ctrl+T)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        generateTestPrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generateTestPrompt]);

  const loadSessions = () => {
    const sessions = [];
    const seenIds = new Set();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('space_session_')) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session && session.id && !seenIds.has(session.id)) {
              seenIds.add(session.id);
              sessions.push(session);
            }
          } catch (error) {
            console.warn(`Failed to parse session data for key ${key}:`, error);
            // Optionally remove corrupted data
            localStorage.removeItem(key);
          }
        }
      }
    }
    
    return sessions
      .filter(session => {
        // Only include sessions with actual user/assistant messages (not just system messages)
        const nonSystemMessages = session.messages.filter(m => m.type !== 'system');
        return nonSystemMessages.length > 0;
      })
      .sort((a, b) => {
        // Sort by most recent user message timestamp (descending - most recent first)
        const getLastUserMessageTime = (session) => {
          const userMessages = session.messages.filter(m => m.type === 'user');
          if (userMessages.length === 0) return new Date(session.timestamp);
          const lastUserMsg = userMessages[userMessages.length - 1];
          return new Date(lastUserMsg.timestamp || session.timestamp);
        };
        
        return getLastUserMessageTime(b) - getLastUserMessageTime(a);  // Descending order - most recent first
      })
      .map(session => ({
        ...session,
        messageCount: session.messages.filter(m => m.type !== 'system').length,
      }));
  };

  // Session management functions for SessionPanel
  const handleNewSession = async () => {
    const prevSessionId = currentSessionId;

    // Auto-generate summary for the session we're leaving
    generateSummaryForPreviousSession(prevSessionId);

    if (useDatabaseStorage) {
      // Create new conversation in database
      try {
        const conversation = await storage.createConversation(
          `Session ${new Date().toLocaleString()}`,
          {
            metaphors: [],
            advisorSuggestions: [],
            voteHistory: [],
            created: new Date().toISOString()
          }
        );

        setCurrentConversationId(conversation.id);
        setCurrentSessionId(conversation.id); // Use conversation ID as session ID
        persistCurrentSession(conversation.id, conversation.id); // Persist so it survives refresh
        console.log('🗃️ Created new database conversation:', conversation.id);
      } catch (error) {
        console.error('Failed to create database conversation, falling back to localStorage:', error);
        // Fall back to localStorage
        const newSessionId = getNextSessionId();
        setCurrentSessionId(newSessionId);
        setCurrentConversationId(null);
        persistCurrentSession(newSessionId, null); // Persist localStorage session ID
      }
    } else {
      // Legacy localStorage session
      const newSessionId = getNextSessionId();
      setCurrentSessionId(newSessionId);
      setCurrentConversationId(null);
      persistCurrentSession(newSessionId, null); // Persist localStorage session ID
    }

    setMessages([]);
    setMetaphors([]);
    setAdvisorSuggestions([]);
    setVoteHistory([]);

    // Show journal onboarding for new chat
    setShowJournalOnboarding(true);

    // Deactivate all advisors to trigger journal onboarding
    setAdvisors(prev => prev.map(a => ({ ...a, active: false })));

    // Track new session
    trackSession();
  };

  const handleLoadSession = async (sessionId) => {
    // Check if sessionId looks like a UUID (database ID) or integer (localStorage ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId);
    const isLocalStorageId = /^\d+$/.test(sessionId);
    
    if (useDatabaseStorage && isUUID) {
      // Load from database - sessionId is a proper UUID
      try {
        const conversation = await storage.loadConversation(sessionId);
        setCurrentConversationId(conversation.id);
        setCurrentSessionId(conversation.id);
        persistCurrentSession(conversation.id, conversation.id); // Persist so it survives refresh
        
        // Process messages to restore advisor_json format if needed and ensure timestamps
        const processedMessages = (conversation.messages || []).map((msg, idx) => {
          // If it's an assistant message that looks like JSON advisor format, restore it
          if (msg.type === 'assistant' && msg.content) {
            let jsonContent = msg.content.trim();
            
            // Handle markdown code block format
            if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
              jsonContent = jsonContent.slice(7, -3).trim();
            }
            
            // Check if it's valid advisor JSON
            if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
              try {
                const parsed = JSON.parse(jsonContent);
                if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
                  // Restore as advisor_json type with parsedAdvisors
                  return {
                    ...msg,
                    type: 'advisor_json',
                    content: jsonContent,
                    parsedAdvisors: parsed,
                    timestamp: msg.timestamp || new Date(Date.now() - (conversation.messages.length - idx) * 1000).toISOString()
                  };
                }
              } catch (e) {
                // Not valid JSON, keep as-is
              }
            }
          }
          
          // Ensure each message has a timestamp for stable React keys
          return {
            ...msg,
            timestamp: msg.timestamp || new Date(Date.now() - (conversation.messages.length - idx) * 1000).toISOString()
          };
        });
        
        setMessages(processedMessages);
        setMetaphors(conversation.metadata?.metaphors || []);
        setAdvisorSuggestions(conversation.metadata?.advisorSuggestions || []);
        setVoteHistory(conversation.metadata?.voteHistory || []);
        console.log('🗃️ Loaded database conversation:', conversation.id);
      } catch (error) {
        console.error('Failed to load database conversation:', error);
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Failed to load conversation: ${error.message}`
        }]);
      }
    } else if (isLocalStorageId) {
      // Legacy localStorage loading (works for both database and localStorage modes)
      const sessionData = localStorage.getItem(`space_session_${sessionId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setCurrentSessionId(session.id);
        setCurrentConversationId(null);
        persistCurrentSession(session.id, null); // Persist localStorage session ID
        
        // Process messages to restore advisor_json format if needed and ensure timestamps
        const processedMessages = session.messages.map((msg, idx) => {
          // If it's an assistant message that looks like JSON advisor format, restore it
          if (msg.type === 'assistant' && msg.content) {
            let jsonContent = msg.content.trim();
            
            // Handle markdown code block format
            if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
              jsonContent = jsonContent.slice(7, -3).trim();
            }
            
            // Check if it's valid advisor JSON
            if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
              try {
                const parsed = JSON.parse(jsonContent);
                if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
                  // Restore as advisor_json type with parsedAdvisors
                  return {
                    ...msg,
                    type: 'advisor_json',
                    content: jsonContent,
                    parsedAdvisors: parsed,
                    timestamp: msg.timestamp || new Date(Date.now() - (session.messages.length - idx) * 1000).toISOString()
                  };
                }
              } catch (e) {
                // Not valid JSON, keep as-is
              }
            }
          }
          
          // Ensure each message has a timestamp for stable React keys
          return {
            ...msg,
            timestamp: msg.timestamp || new Date(Date.now() - (session.messages.length - idx) * 1000).toISOString()
          };
        });
        
        setMessages(processedMessages);
        setMetaphors(session.metaphors || []);
        setAdvisorSuggestions(session.advisorSuggestions || []);
        setVoteHistory(session.voteHistory || []);
        console.log('🗃️ Loaded localStorage session:', sessionId);
      } else {
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Session ${sessionId} not found`
        }]);
      }
    } else {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Invalid session ID format: ${sessionId}`
      }]);
    }
  };

  const handleLoadPrevious = () => {
    const sessions = loadSessions();
    
    // Find the most recent session that the user has sent a message in, excluding current session
    const sessionsWithUserMessages = sessions.filter(session => {
      // Skip current session
      if (session.id === currentSessionId) return false;
      
      // Only include sessions where user has sent at least one message
      const userMessages = session.messages.filter(m => m.type === 'user');
      return userMessages.length > 0;
    });
    
    if (sessionsWithUserMessages.length === 0) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'No previous sessions with user messages found'
      }]);
      return;
    }
    
    // Sort by most recent user message timestamp (descending - most recent first)
    sessionsWithUserMessages.sort((a, b) => {
      const getLastUserMessageTime = (session) => {
        const userMessages = session.messages.filter(m => m.type === 'user');
        if (userMessages.length === 0) return new Date(0); // Fallback for sessions without user messages
        const lastUserMsg = userMessages[userMessages.length - 1];
        return new Date(lastUserMsg.timestamp || session.timestamp);
      };
      
      return getLastUserMessageTime(b) - getLastUserMessageTime(a); // Descending order
    });
    
    // Load the most recent session (first in sorted array)
    const mostRecentSession = sessionsWithUserMessages[0];
    setCurrentSessionId(mostRecentSession.id);
    
    // Process messages to restore advisor_json format if needed
    const processedMessages = mostRecentSession.messages.map(msg => {
      // If it's an assistant message that looks like JSON advisor format, restore it
      if (msg.type === 'assistant' && msg.content) {
        let jsonContent = msg.content.trim();
        
        // Handle markdown code block format
        if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
          jsonContent = jsonContent.slice(7, -3).trim();
        }
        
        // Check if it's valid advisor JSON
        if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
          try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
              // Restore as advisor_json type with parsedAdvisors
              return {
                ...msg,
                type: 'advisor_json',
                content: jsonContent,
                parsedAdvisors: parsed
              };
            }
          } catch (e) {
            // Not valid JSON, keep as-is
          }
        }
      }
      
      return msg;
    });
    
    setMessages(processedMessages);
    setMetaphors(mostRecentSession.metaphors || []);
    setAdvisorSuggestions(mostRecentSession.advisorSuggestions || []);
    setVoteHistory(mostRecentSession.voteHistory || []);
    
    console.log('🔄 Loaded most recent session with user messages:', mostRecentSession.id);
  };


  const handleResetAllSessions = () => {
    // Clear all sessions from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('space_session_')) {
        localStorage.removeItem(key);
      }
    });
    // Reset current session
    setCurrentSessionId(1);
    setMessages([{ type: 'system', content: 'All sessions cleared. Starting fresh with Session 1' }]);
    setMetaphors([]);
    // DEPRECATED: Questions feature temporarily disabled
    // setQuestions([]);
    setAdvisorSuggestions([]);
    setVoteHistory([]);
  };

  const handleDeleteSession = (sessionId) => {
    // Get session data to show title in deletion message
    const sessionData = localStorage.getItem(`space_session_${sessionId}`);
    let displayName = `Session ${sessionId}`;
    if (sessionData) {
      const session = JSON.parse(sessionData);
      displayName = session.title || `Session ${session.id}`;
    }
    
    localStorage.removeItem(`space_session_${sessionId}`);
    setMessages(prev => [...prev, {
      type: 'system',
      content: `Deleted "${displayName}"`
    }]);
  };

  // Export functions for GUI buttons
  const handleExportSession = (options = {}) => {
    try {
      // Load from localStorage to get complete session data
      const sessionData = localStorage.getItem(`space_session_${currentSessionId}`);
      if (!sessionData) {
        throw new Error('Session not found');
      }
      
      const session = JSON.parse(sessionData);
      
      // Validate session has messages
      if (!session.messages || !Array.isArray(session.messages)) {
        throw new Error('Session has no messages to export');
      }
      
      // Format session as markdown with metadata and export options
      const markdown = formatSessionAsMarkdown(session.messages, {
        title: session.title,
        advisors: session.advisors || [],
        timestamp: session.timestamp
      }, options);
      
      // Validate markdown content
      if (!markdown || markdown.length === 0) {
        throw new Error('Generated export is empty');
      }
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      
      // Validate blob creation
      if (blob.size === 0) {
        throw new Error('Export file is empty');
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Use session title for filename, sanitized
      let filename = `space-session-${currentSessionId}`;
      if (session.title) {
        const sanitizedTitle = session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        filename = `space-${sanitizedTitle}`;
      }
      
      a.download = `${filename}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Session exported successfully (${blob.size} bytes)`
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Error exporting session: ${error.message}`
      }]);
    }
  };

  const handleExportAll = () => {
    exportAllSessions();
  };

  const handleCommand = (text) => {
    console.log('handleCommand called with:', text);
    if (text.startsWith('/')) {
      console.log('Command detected');
      // Split the command but preserve case for args
      const parts = text.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      console.log('Parsed command:', command, 'args:', args);
      
      switch (command) {
        case '/sessions':
          console.log('Processing /sessions command');
          const sessions = loadSessions();
          console.log('Found sessions:', sessions);
          setMessages(prev => [...prev, {
            type: 'system',
            content: sessions.length ? 
              'Available sessions:\n' + sessions.map(s => {
                // Collect unique tags from all messages
                const tags = new Set();
                s.messages.forEach(msg => {
                  if (msg.tags) {
                    msg.tags.forEach(tag => tags.add(tag.value));
                  }
                });
                const tagList = Array.from(tags);
                
                return `Session #: ${s.id}\n` +
                  `  Created: ${new Date(s.timestamp).toLocaleString([], { 
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}\n` +
                  `  Messages: ${s.messageCount}\n` +
                  `  Tags: ${tagList.length ? tagList.join(', ') : 'none'}\n`;
              }).join('\n') :
              'No saved sessions found'
          }]);
          return true;


        case '/help':
          setShowHelpModal(true);
          return true;

        case '/new':
          const prevSessionId = currentSessionId;
          const newSessionId = getNextSessionId();
          
          // Auto-generate summary for the session we're leaving
          generateSummaryForPreviousSession(prevSessionId);
          
          setCurrentSessionId(newSessionId);
          setMessages([]);
          setMetaphors([]);
          // DEPRECATED: Questions feature temporarily disabled
          // setQuestions([]);
          
          // Track new session
          trackSession();
          
          return true;

        case '/load':
          if (args[0] === 'previous') {
            const sessions = loadSessions();
            if (sessions.length > 1) {  // Changed to check for at least 2 sessions
              const penultimate = sessions[sessions.length - 2];  // Changed to get second-to-last session
              setCurrentSessionId(penultimate.id);
              setMessages(penultimate.messages);
              setMetaphors(penultimate.metaphors || []);
              // DEPRECATED: Questions feature temporarily disabled
              // setQuestions(penultimate.questions || []);
              setAdvisorSuggestions(penultimate.advisorSuggestions || []);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Loaded previous session ${penultimate.id} from ${new Date(penultimate.timestamp).toLocaleString()}`
              }]);
            } else {
              setMessages(prev => [...prev, {
                type: 'system',
                content: sessions.length === 1 ? 'Only one session exists' : 'No previous sessions found'
              }]);
            }
            return true;
          }
          const sessionId = args[0];
          if (!sessionId) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Usage: /load <session_id>'
            }]);
            return true;
          }
          
          const sessionData = localStorage.getItem(`space_session_${sessionId}`);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            setCurrentSessionId(session.id);
            
            // Process messages to restore advisor_json format if needed
            const processedMessages = session.messages.map(msg => {
              // If it's an assistant message that looks like JSON advisor format, restore it
              if (msg.type === 'assistant' && msg.content) {
                let jsonContent = msg.content.trim();
                
                // Handle markdown code block format
                if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
                  jsonContent = jsonContent.slice(7, -3).trim();
                }
                
                // Check if it's valid advisor JSON
                if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
                  try {
                    const parsed = JSON.parse(jsonContent);
                    if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
                      // Restore as advisor_json type with parsedAdvisors
                      return {
                        ...msg,
                        type: 'advisor_json',
                        content: jsonContent,
                        parsedAdvisors: parsed
                      };
                    }
                  } catch (e) {
                    // Not valid JSON, keep as-is
                  }
                }
              }
              
              return msg;
            });
            
            setMessages(processedMessages);
            setMetaphors(session.metaphors || []);
            // DEPRECATED: Questions feature temporarily disabled
            // setQuestions(session.questions || []);
            setAdvisorSuggestions(session.advisorSuggestions || []);
          } else {
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Session ${sessionId} not found`
            }]);
          }
          return true;

        case '/reset':
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Are you sure you want to delete all saved sessions? This cannot be undone.\n\nType "/reset confirm" to proceed, otherwise do anything else to cancel.'
          }]);
          return true;

        case '/reset confirm':
          // Clear all sessions from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('space_session_')) {
              localStorage.removeItem(key);
            }
          });
          // Reset current session
          setCurrentSessionId(1);
          setMessages([{ type: 'system', content: 'All sessions cleared. Starting fresh with Session 1' }]);
          setMetaphors([]);
          // DEPRECATED: Questions feature temporarily disabled
          // setQuestions([]);
          return true;

        case '/advisor':
          if (!args[0]) {  // If no subcommand is provided
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Available advisor commands:
/advisor add      - Add a new advisor
/advisor edit     - Edit an advisor
/advisor delete   - Delete an advisor
/advisor list     - List all advisors
/advisor generate - Generate perspective suggestions from worksheet
/advisor finalize - Get detailed profiles for chosen advisors

Note: Advisor sharing is now available through the GUI menu (bottom-left → Import/Export Advisors)`
            }]);
            return true;  // Add this to prevent fall-through to debug command
          }

          switch(args[0]) {
            case 'generate':
              if (!args[1]) {
                return true;
              }

              const worksheetData = localStorage.getItem(`space_worksheet_${args[1]}`);
              if (!worksheetData) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet ${args[1]} not found`
                }]);
                return true;
              }

              const worksheet = JSON.parse(worksheetData);
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Starting advisor generation process...'
              }]);

              (async () => {
                try {
                  const response = await callClaude(`You are an intelligence gifted in reading a person's patterns and values and identifying what will benefit their growth and understanding. 

Attached is a worksheet filled out with information about myself. Read the worksheet, think carefully about what it reveals, and assemble a list of 10 potential advisors you think I would benefit from having an extended conversation with. 

There are no formal limits on perspective suggestions. 
* They can be real people or inspired by real people
* They can be fictional characters 
* They can be archetypal
* Or something stranger 

Please generate a mix of the above types. 

We will work together to evaluate these options and narrow them down until we have a panel of three advisors. The overall point is for me to leave this conversation with a set of three advisors I can instantiate as perspectival voices in a separate conversation with you. 

Ideally the set should be well-balanced and afford multiple ways of knowing and being.

For each advisor you suggest, give a brief explanation of why you think they might be a good match. Before naming the advisors, you may write out any patterns you observe in the worksheet that might be helpful for us in this process.

WORKSHEET DATA:
${JSON.stringify(worksheet.answers, null, 2)}`);

                  setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: response
                  }, {
                    type: 'system',
                    content: 'Discuss these suggestions with me to narrow down to your preferred three advisors. Then use "/advisor finalize" to get detailed profiles.'
                  }]);
                } catch (error) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Error generating advisors: ' + error.message
                  }]);
                }
              })();
              return true;

            case 'finalize':
              (async () => {
                try {
                  const recentMessages = messages
                    .filter(msg => msg.type === 'user' || msg.type === 'assistant')
                    .slice(-10)
                    .map(msg => `${msg.type}: ${msg.content}`)
                    .join('\n\n');

                  const response = await callClaude(`Based on our previous discussion about potential advisors:

${recentMessages}

Now, I'd like to generate the final output. Please include the following aspects for each of our chosen advisors:

* Name
* Title 
* Specific intellectual, philosophical or wisdom traditions or concepts they embody 
* Their unique voice and speaking style 
* The precise types of situations they are most skilled at addressing`);

                  setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: response
                  }, {
                    type: 'system',
                    content: 'You can now add these advisors using:\n/advisor add <name> "<description>"'
                  }]);
                } catch (error) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Error finalizing advisors: ' + error.message
                  }]);
                }
              })();
              return true;

            case 'add':
              setSuggestedAdvisorName('');
              setShowAdvisorForm(true);
              return true;

            case 'activate':
              if (!args[1]) {
                return true;
              }
              
              const fullTextActivate = args.join(' ');
              const firstQuoteActivate = fullTextActivate.indexOf('"');
              const lastQuoteActivate = fullTextActivate.indexOf('"', firstQuoteActivate + 1);
              
              if (firstQuoteActivate === -1 || lastQuoteActivate === -1) {
                return true;
              }

              const nameToActivate = fullTextActivate.slice(firstQuoteActivate + 1, lastQuoteActivate);
              const advisorToActivate = advisors.find(a => 
                a.name.toLowerCase() === nameToActivate.toLowerCase()
              );
              
              if (!advisorToActivate) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToActivate}" not found`
                }]);
                return true;
              }

              setAdvisors(prev => prev.map(a => 
                a.name.toLowerCase() === nameToActivate.toLowerCase() ? { ...a, active: true } : a
              ));
              return true;

            case 'deactivate':
              if (!args[1]) {
                return true;
              }
              
              const fullTextDeactivate = args.join(' ');
              const firstQuoteDeactivate = fullTextDeactivate.indexOf('"');
              const lastQuoteDeactivate = fullTextDeactivate.indexOf('"', firstQuoteDeactivate + 1);
              
              if (firstQuoteDeactivate === -1 || lastQuoteDeactivate === -1) {
                return true;
              }

              const nameToDeactivate = fullTextDeactivate.slice(firstQuoteDeactivate + 1, lastQuoteDeactivate);
              const advisorToDeactivate = advisors.find(a => 
                a.name.toLowerCase() === nameToDeactivate.toLowerCase()
              );
              
              if (!advisorToDeactivate) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToDeactivate}" not found`
                }]);
                return true;
              }

              if (!advisorToDeactivate.active) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${advisorToDeactivate.name}" is not currently active`
                }]);
                return true;
              }

              setAdvisors(prev => prev.map(a => 
                a.name.toLowerCase() === nameToDeactivate.toLowerCase() ? { ...a, active: false } : a
              ));
              return true;

            case 'list':
              // Advisor list now available in GUI sidebar
              return true;

            case 'edit':
              if (!args[1]) {
                return true;
              }
              
              const fullTextEdit = args.join(' ');
              const firstQuoteEdit = fullTextEdit.indexOf('"');
              const lastQuoteEdit = fullTextEdit.indexOf('"', firstQuoteEdit + 1);
              
              if (firstQuoteEdit === -1 || lastQuoteEdit === -1) {
                return true;
              }

              const nameToEdit = fullTextEdit.slice(firstQuoteEdit + 1, lastQuoteEdit);
              const advisorToEdit = advisors.find(a => 
                a.name.toLowerCase() === nameToEdit.toLowerCase()
              );
              
              if (!advisorToEdit) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToEdit}" not found`
                }]);
                return true;
              }

              setEditingAdvisor(advisorToEdit);
              return true;

            case 'delete':
              if (!args[1]) {
                return true;
              }
              
              const fullTextDelete = args.join(' ');
              const firstQuoteDelete = fullTextDelete.indexOf('"');
              const lastQuoteDelete = fullTextDelete.indexOf('"', firstQuoteDelete + 1);
              
              if (firstQuoteDelete === -1 || lastQuoteDelete === -1) {
                return true;
              }

              const nameToDelete = fullTextDelete.slice(firstQuoteDelete + 1, lastQuoteDelete);
              const advisorToDelete = advisors.find(a => 
                a.name.toLowerCase() === nameToDelete.toLowerCase()
              );
              
              if (!advisorToDelete) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToDelete}" not found`
                }]);
                return true;
              }

          setAdvisors(prev => prev.filter(a =>
            a.name.toLowerCase() !== nameToDelete.toLowerCase()
          ));
          return true;

        }


        case '/debug':
          console.log('Debug command received');
          const newDebugMode = !debugMode;
          setDebugMode(newDebugMode);
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`
          }]);
          return true;

        case '/reasoning':
        case '/think':
          const newReasoningMode = !reasoningMode;
          setReasoningMode(newReasoningMode);
          localStorage.setItem('space_reasoning_mode', newReasoningMode.toString());
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Reasoning mode ${newReasoningMode ? 'enabled' : 'disabled'}`
          }]);
          return true;

          case '/prompt':
            if (args[0] === 'use') {
              const promptName = args[1];
              const prompt = savedPrompts.find(p => p.name === promptName);
              if (prompt) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Using prompt: ${promptName}`
                }]);
                // Wrap the async operation in an IIFE
                (async () => {
                  try {
                    await callClaude(prompt.content || prompt.text);
                  } catch (error) {
                    setMessages(prev => [...prev, {
                      type: 'system',
                      content: `Error: ${error.message}`
                    }]);
                  }
                })();
              } else {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${promptName}" not found`
                }]);
              }
              return true;
            }
          switch(args[0]) {
            case 'add':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt add "name" <prompt_text>'
                }]);
                return true;
              }
              
              const fullTextAdd = args.join(' ');
              const firstQuoteAdd = fullTextAdd.indexOf('"');
              const lastQuoteAdd = fullTextAdd.indexOf('"', firstQuoteAdd + 1);
              
              if (firstQuoteAdd === -1 || lastQuoteAdd === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToAdd = fullTextAdd.slice(firstQuoteAdd + 1, lastQuoteAdd);
              const promptText = fullTextAdd.slice(lastQuoteAdd + 1).trim();
              
              if (!promptText) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt text is required'
                }]);
                return true;
              }

              setSavedPrompts(prev => [...prev, { name: nameToAdd, text: promptText }]);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Saved prompt: ${nameToAdd}`
              }]);
              return true;

            case 'delete':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt delete "name"'
                }]);
                return true;
              }
              
              const fullTextDelete = args.join(' ');
              const firstQuoteDelete = fullTextDelete.indexOf('"');
              const lastQuoteDelete = fullTextDelete.indexOf('"', firstQuoteDelete + 1);
              
              if (firstQuoteDelete === -1 || lastQuoteDelete === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToDelete = fullTextDelete.slice(firstQuoteDelete + 1, lastQuoteDelete);
              const promptToDelete = savedPrompts.find(p => 
                p.name.toLowerCase() === nameToDelete.toLowerCase()
              );
              
              if (!promptToDelete) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${nameToDelete}" not found`
                }]);
                return true;
              }

              setSavedPrompts(prev => prev.filter(p => 
                p.name.toLowerCase() !== nameToDelete.toLowerCase()
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Deleted prompt: ${nameToDelete}`
              }]);
              return true;

            case 'use':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt use "name"'
                }]);
                return true;
              }
              
              const fullTextUse = args.join(' ');
              const firstQuoteUse = fullTextUse.indexOf('"');
              const lastQuoteUse = fullTextUse.indexOf('"', firstQuoteUse + 1);
              
              if (firstQuoteUse === -1 || lastQuoteUse === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToUse = fullTextUse.slice(firstQuoteUse + 1, lastQuoteUse);
              const promptToUse = savedPrompts.find(p => 
                p.name.toLowerCase() === nameToUse.toLowerCase()
              );
              
              if (!promptToUse) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${nameToUse}" not found`
                }]);
                return true;
              }

              (async () => {
                setMessages(prev => [...prev, { type: 'user', content: promptToUse.text }]);
                setIsLoading(true);
                try {
                  const response = await callClaude(promptToUse.text);
                  setMessages(prev => [...prev, { type: 'assistant', content: response }]);
                } catch (error) {
                  setMessages(prev => [...prev, { 
                    type: 'system', 
                    content: 'Error: Failed to get response from Claude' 
                  }]);
                } finally {
                  setIsLoading(false);
                  setInput('');
                  focusInput();
                }
              })();
              return true;

            case 'edit':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt edit "name"'
                }]);
                return true;
              }
              
              const fullTextEdit = args.join(' ');
              const firstQuoteEdit = fullTextEdit.indexOf('"');
              const lastQuoteEdit = fullTextEdit.indexOf('"', firstQuoteEdit + 1);
              
              if (firstQuoteEdit === -1 || lastQuoteEdit === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToEdit = fullTextEdit.slice(firstQuoteEdit + 1, lastQuoteEdit);
              const promptToEdit = savedPrompts.find(p => 
                p.name.toLowerCase() === nameToEdit.toLowerCase()
              );
              
              if (!promptToEdit) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${nameToEdit}" not found`
                }]);
                return true;
              }

              setEditingPrompt(promptToEdit);
              setEditText(promptToEdit.text);
              return true;

            case 'list':
              // Prompt list now available in Prompt Library
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available prompt commands:\n' +
                  '/prompt add "name" <text> - Save a new prompt\n' +
                  '/prompt list - Show all saved prompts\n' +
                  '/prompt use "name" - Use a saved prompt\n' +
                  '/prompt edit "name" - Edit an existing prompt\n' +
                  '/prompt delete "name" - Delete a saved prompt'
              }]);
              return true;
          }

        case '/worksheet':
          if (!args[0]) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Available worksheet commands:\n' +
                '/worksheet list - Show available worksheets\n' +
                '/worksheet view <id> - View a completed worksheet\n' +
                '/worksheet start <id> - Start filling out a specific worksheet'
            }]);
            return true;
          }

          switch(args[0]) {
            case 'list':
              // Worksheet list data available through worksheet commands
              return true;

            case 'view':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /worksheet view <id>'
                }]);
                return true;
              }

              const worksheetData = localStorage.getItem(`space_worksheet_${args[1]}`);
              if (!worksheetData) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet ${args[1]} not found`
                }]);
                return true;
              }

              try {
                const worksheet = JSON.parse(worksheetData);
                const template = WORKSHEET_TEMPLATES[worksheet.templateId];
                
                if (!template) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `Error: Template ${worksheet.templateId} not found`
                  }]);
                  return true;
                }

                let content = `📝 Worksheet ${args[1]}\n`;
                content += `Completed: ${new Date(worksheet.timestamp).toLocaleString()}\n\n`;

                if (template.type === 'basic') {
                  // Handle basic worksheet format
                  template.questions.forEach(q => {
                    content += `Q: ${q.question}\n`;
                    content += `A: ${worksheet.answers[q.id] || 'No answer provided'}\n\n`;
                  });
                } else {
                  // Handle sectioned worksheet format
                  template.sections.forEach(section => {
                    content += `## ${section.name}\n\n`;
                    section.questions.forEach(q => {
                      content += `Q: ${q.question}\n`;
                      content += `A: ${worksheet.answers[q.id] || 'No answer provided'}\n\n`;
                    });
                  });
                }

                setMessages(prev => [...prev, {
                  type: 'system',
                  content: content
                }]);
                return true;
              } catch (error) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Error viewing worksheet: ${error.message}`
                }]);
                return true;
              }

            case 'start':
              const startId = args[1];
              if (!startId) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /worksheet start <id>'
                }]);
                return true;
              }

              const template = WORKSHEET_TEMPLATES[startId];
              if (template) {
                try {
                  setWorksheetMode(true);
                  setWorksheetStep(0);
                  setCurrentSection(0);  // Initialize section
                  setCurrentQuestion(0); // Initialize question
                  setCurrentWorksheetId(startId);
                  setWorksheetAnswers({});

                  // Different message format based on worksheet type
                  let startMessage;
                  if (template.sections) {
                    startMessage = `Starting ${template.name}\n\nSection: ${template.sections[0].name}\n\n${template.sections[0].questions[0].question}`;
                  } else {
                    startMessage = `Starting ${template.name}\n\n${template.questions[0].question}`;
                  }

                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `${startMessage}\n\nType your answer or /cancel to exit.`
                  }]);
                } catch (error) {
                  console.error('Worksheet start error:', error);
                  setWorksheetMode(false);
                  setCurrentWorksheetId(null);
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `Error starting worksheet: ${error.message}`
                  }]);
                }
              } else {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet template "${startId}" not found`
                }]);
              }
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Unknown command: ${command}`
              }]);
              return true;
          }

        case '/dossier':
          if (!args[0]) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Usage: /dossier <subject>'
            }]);
            return true;
          }
          const subject = args.join(' ');
          const dossierMsgs = memory.compileDossier(subject);
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Dossier for "${subject}" contains ${dossierMsgs.length} messages.`
          }]);
          return true;

        case '/memory':
          switch(args[0]) {
            case 'status':
              const sessions = memory.getAllSessions();
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Memory Status:
Sessions: ${sessions.length}
Total Messages: ${sessions.reduce((acc, s) => acc + s.messages.length, 0)}
Latest Session: ${sessions[0]?.timestamp || 'none'}`
              }]);
              return true;

            case 'search':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /memory search <query>'
                }]);
                return true;
              }
              const query = args.slice(1).join(' ');
              const relevant = memory.retrieveRelevantContext(query);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Found ${relevant.length} relevant messages:
${relevant.map((msg, i) => {
  // Split into paragraphs
  const paragraphs = msg.content.split(/\n\n+/);
  // Find paragraph(s) containing the search term
  const matchingParagraphs = paragraphs.filter(p => 
    p.toLowerCase().includes(query.toLowerCase())
  );
  // Calculate score for debugging
  const score = memory.calculateRelevance(msg, query);
  return `[${i + 1}] Score: ${score}\n[${msg.type}] ${matchingParagraphs.join('\n\n')}`
}).join('\n\n---\n\n')}`
              }]);
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available memory commands:\n' +
                  '/memory search <query> - Test memory retrieval'
              }]);
              return true;
          }

        // case '/tokens':
         //  if (!args[0] || isNaN(args[0]) || args[0] < 1 || args[0] > 8192) {
            // setMessages(prev => [...prev, {
              // type: 'system',
              // content: `Usage: /tokens <1-8192>
              // Current max tokens: ${maxTokens}

              // Note: Higher values allow for longer responses
              // - Default is 4096
              // - Maximum is 8192
              // - Minimum is 1`
            // }]);
            // return true;
          // }
          
          const newMaxTokens = parseInt(args[0]);
          setMaxTokens(newMaxTokens);
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Max tokens set to ${newMaxTokens}`
          }]);
          return true;

        case '/context':
          switch(args[0]) {
            case 'limit':
              if (!args[1] || isNaN(args[1])) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Usage: /context limit <number>
Current context limit: ${contextLimit.toLocaleString()} tokens

This setting controls when SPACE switches to managed context:
- Higher values send more history to Claude
- Lower values use less tokens but may lose context
- Default is 150,000`
                }]);
                return true;
              }
              
              const newLimit = parseInt(args[1].replace(/,/g, ''));
              setContextLimit(newLimit);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Context limit set to ${newLimit.toLocaleString()} tokens`
              }]);
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available context commands:\n/context limit <number> - Set token limit for context management'
              }]);
              return true;
          }

        case '/capture':
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim();
          
          if (!selection || !selectedText) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'No text selected. Please highlight some text before using /capture'
            }]);
            return true;
          }

          // Find which message contains the selection
          const range = selection.getRangeAt(0);
          let element = range.commonAncestorContainer;
          
          // Walk up the DOM tree until we find an element with an ID starting with 'msg-'
          while (element && (!element.id || !element.id.startsWith('msg-'))) {
            element = element.parentElement;
          }
          
          const messageId = element?.id;
          const messageIndex = messageId ? parseInt(messageId.replace('msg-', '')) : null;

          if (!messageIndex && messageIndex !== 0) {  // Check for both null and undefined
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Could not determine message position for link'
            }]);
            return true;
          }

          try {
            const timestamp = new Date().toISOString();
            const markdown = formatCaptureAsMarkdown(selectedText, timestamp, messageIndex);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `space-capture-${timestamp.split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Check if menu is still in document before trying to remove it
            if (menu.parentNode === document.body) {
              document.body.removeChild(menu);
            }
            
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Capture saved successfully'
            }]);
          } catch (error) {
            console.error('Error during capture:', error);
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Error saving capture'
            }]);
          }
          return true;

        case '/group':
          if (!args[0]) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Group Management Commands:

/group create <group_name>         - Create a new advisor group
/group add <group_name> <advisor>  - Add a perspective to a group
/group remove <group_name> <advisor> - Remove an advisor from a group
/group list                        - List all advisor groups

Examples:
/group create Psychologists
/group add Psychologists Carl Jung
/group remove Psychologists Carl Jung
/group list`
            }]);
            return true;
          }
          
          switch (args[0]) {
            case 'create':
              const groupName = args.slice(1).join(' ');
              if (!groupName) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Please provide a group name (e.g. "/group create Psychologists")'
                }]);
                return true;
              }
              if (advisorGroups.some(g => g.name === groupName)) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Group "${groupName}" already exists`
                }]);
                return true;
              }
              setAdvisorGroups(prev => [...prev, {
                name: groupName,
                description: '',
                advisors: [],
                active: false
              }]);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Created advisor group: ${groupName}`
              }]);
              return true;

            case 'add':
              if (args.length < 3) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Please provide both group name and advisor name (e.g. "/group add Psychologists Carl Jung")'
                }]);
                return true;
              }
              const [_, targetGroup, ...advisorName] = args;
              const advisor = advisors.find(a => a.name.toLowerCase() === advisorName.join(' ').toLowerCase());
              const group = advisorGroups.find(g => g.name.toLowerCase() === targetGroup.toLowerCase());
              
              if (!advisor) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${advisorName.join(' ')}" not found`
                }]);
                return true;
              }
              if (!group) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Group "${targetGroup}" not found`
                }]);
                return true;
              }
              if (group.advisors.includes(advisor.name)) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `${advisor.name} is already in group ${targetGroup}`
                }]);
                return true;
              }
              
              setAdvisorGroups(prev => prev.map(g => 
                g.name === targetGroup
                  ? { ...g, advisors: [...g.advisors, advisor.name] }
                  : g
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Added ${advisor.name} to group ${targetGroup}`
              }]);
              return true;

            case 'remove':
              if (args.length < 3) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Please provide both group name and advisor name (e.g. "/group remove Psychologists Carl Jung")'
                }]);
                return true;
              }
              const [__, rmGroup, ...rmAdvisorName] = args;
              const rmAdvisor = advisors.find(a => a.name.toLowerCase() === rmAdvisorName.join(' ').toLowerCase());
              const rmTargetGroup = advisorGroups.find(g => g.name.toLowerCase() === rmGroup.toLowerCase());
              
              if (!rmAdvisor || !rmTargetGroup) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Advisor or group not found'
                }]);
                return true;
              }
              
              if (!rmTargetGroup.advisors.includes(rmAdvisor.name)) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `${rmAdvisor.name} is not in group ${rmGroup}`
                }]);
                return true;
              }
              
              setAdvisorGroups(prev => prev.map(g => 
                g.name === rmGroup
                  ? { ...g, advisors: g.advisors.filter(a => a !== rmAdvisor.name) }
                  : g
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Removed ${rmAdvisor.name} from group ${rmGroup}`
              }]);
              return true;

            case 'list':
              // Advisor groups now managed through GUI
              return true;
          }

        case '/response':
          if (args[0] === 'length') {
            if (!args[1] || isNaN(args[1])) {
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Usage: /response length <number>
Current response length: ${maxTokens.toLocaleString()} tokens

This setting controls the maximum length of Claude's responses.
Default is 4,096 tokens.`
              }]);
              return true;
            }
            
            const newLimit = parseInt(args[1].replace(/,/g, ''));
            setMaxTokens(newLimit);
            localStorage.setItem('space_max_tokens', newLimit);
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Response length set to ${newLimit.toLocaleString()} tokens`
            }]);
            return true;
          }
          
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Available response commands:\n/response length <number> - Set maximum length for Claude responses'
          }]);
          return true;

        case '/keys':
          if (useAuthSystem) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'API key management disabled. Using authentication system.'
            }]);
            return true;
          }
          
          switch(args[0]) {
            case 'clear':
              removeEncrypted('space_anthropic_key');
              removeEncrypted('space_openai_key');
              removeEncrypted('space_gemini_key');
              setApiKeysSet(false);
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'API keys cleared. Please restart the terminal.'
              }]);
              return true;

            case 'status':
              (async () => {
                try {
                  // API key access not available in auth mode
                  const anthropicKey = null;
                  const openaiKey = null;
                  const geminiKey = null;
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `API Keys Status:
Anthropic: ${anthropicKey ? '✓ Set' : '✗ Not Set'}
OpenAI: ${openaiKey ? '✓ Set' : '✗ Not Set'}
Gemini: ${geminiKey ? '✓ Set' : '✗ Not Set'}`
                  }]);
                } catch (error) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `Error checking API keys: ${error.message}`
                  }]);
                }
              })();
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available key commands:\n' +
                  '/keys status - Check API key status\n' +
                  '/keys clear - Clear stored API keys'
              }]);
              return true;
          }

        case '/key':
          switch(args[0]) {
            case 'set':
              return (async () => {  // Wrap in async IIFE
                if (!args[1] || !args[2]) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Usage: /key set [anthropic/openai/gemini] <api-key>'
                  }]);
                  return true;
                }

                const service = args[1].toLowerCase();
                const newKey = args[2];

                if (service !== 'anthropic' && service !== 'openai' && service !== 'gemini') {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid service. Use "anthropic", "openai", or "gemini"'
                  }]);
                  return true;
                }

                // Validate key format
                if (service === 'anthropic' && !newKey.startsWith('sk-ant-')) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid Anthropic API key format'
                  }]);
                  return true;
                }

                if (service === 'openai' && !newKey.startsWith('sk-')) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid OpenAI API key format'
                  }]);
                  return true;
                }

                if (service === 'gemini' && !newKey.startsWith('AIza')) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid Gemini API key format'
                  }]);
                  return true;
                }

                // For Anthropic key, validate with API call
                if (service === 'anthropic') {
                  try {
                    const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': newKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                      },
                      body: JSON.stringify({
                        model: 'claude-sonnet-4',
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 10
                      })
                    });

                    if (!response.ok) {
                      await handleApiError(response);
                    }
                  } catch (error) {
                    setMessages(prev => [...prev, {
                      type: 'system',
                      content: `API key validation failed: ${error.message}`
                    }]);
                    return true;
                  }
                }

                // Store the new key securely
                await setEncrypted(`space_${service}_key`, newKey);

                // If OpenAI key, reinitialize the client
                if (service === 'openai') {
                  const client = new OpenAI({
                    apiKey: newKey,
                    dangerouslyAllowBrowser: true
                  });
                  setOpenaiClient(client);
                  console.log('✅ OpenAI client re-initialized after key update');
                }

                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `${service} API key updated successfully`
                }]);
                return true;
              })();

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available key commands:\n' +
                  '/key set [anthropic/openai/gemini] <api-key> - Update API key\n' +
                  '/keys status - Check API key status\n' +
                  '/keys clear - Clear stored API keys'
              }]);
              return true;
          }

        case '/council':
          // Let council mode detection handle this in normal message processing
          return false;

        default:
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Unknown command: ${command}`
          }]);
          return true;
      }
    }
    console.log('Not a command, returning false');
    return false;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called with input:', input);

    if (!input.trim() || isLoading) {
      console.log('Empty input or loading, returning');
      return;
    }

    // Handle commands first
    if (input.startsWith('/')) {
      console.log('Command detected:', input);
      const commandHandled = handleCommand(input);
      console.log('Command handled:', commandHandled);
      if (commandHandled) {
        setInput('');
        return;
      }
    }

    // Store input value before clearing
    const userInput = input;

    // Clear input immediately
    setInput('');

    // Existing message handling
    console.log('No command handled, proceeding to Claude response');
    try {
      setIsLoading(true);

      // Process @ references for context injection
      let processedInput = userInput;
      let sessionContexts = [];

      // DEPRECATED: High Council mode detection - Replaced by parallel advisor streaming
      // const councilRegex = /\/council\b/i;
      // const councilMode = councilRegex.test(processedInput);
      // if (councilMode) {
      //   processedInput = processedInput.replace(councilRegex, '').trim();
      // }
      
      // Handle new format: @"Session Title" - collect summaries for context injection
      const atTitleRegex = /@"([^"]+)"/g;
      const titleMatches = [...processedInput.matchAll(atTitleRegex)];
      console.log('📄 Found @ references:', titleMatches.map(m => m[1]));
      console.log('📄 Available session selections:', Array.from(sessionSelections.keys()));
      
      // Handle legacy format: @1, @2, etc. for backward compatibility
      const atRegex = /@(\d+)/g;
      const legacyMatches = [...processedInput.matchAll(atRegex)];

      // Process session references in parallel instead of sequential
      const sessionPromises = titleMatches.map(async (m) => {
        const title = m[1];
        const session = sessionSelections.get(title);
        console.log(`📄 Looking for session "${title}":`, session ? 'FOUND' : 'NOT FOUND');
        
        if (session) {
          const summary = await summarizeSession(session.id, { openaiClient });
          if (summary) {
            console.log(`📄 Adding context for "${title}" (Session ${session.id})`);
            return {
              title,
              sessionId: session.id,
              summary,
              timestamp: session.timestamp
            };
          }
        }
        return null;
      });

      // Process legacy format in parallel too
      const legacyPromises = legacyMatches.map(async (m) => {
        const sessionId = parseInt(m[1], 10);
        const summary = await summarizeSession(sessionId, { openaiClient });
        if (summary) {
          return { match: m[0], summary };
        }
        return null;
      });

      // Wait for all session processing to complete in parallel
      const [sessionResults, legacyResults] = await Promise.all([
        Promise.all(sessionPromises),
        Promise.all(legacyPromises)
      ]);

      // Add valid session contexts
      sessionContexts = sessionResults.filter(Boolean);

      // Apply legacy replacements
      for (const result of legacyResults.filter(Boolean)) {
        processedInput = processedInput.replace(result.match, result.summary);
      }

      // Start tag analysis in parallel with Claude response using shared instance
      const tagAnalysisPromise = (async () => {
        try {
          console.log('🏷️ Starting tag analysis for:', processedInput.substring(0, 100) + '...');
          const tags = await sharedTagAnalyzer.analyzeTags(processedInput, session);
          console.log('🏷️ Tags generated:', tags);
          if (debugMode) {
            console.log('🏷️ Debug mode active, tags:', tags);
          }
          return tags;
        } catch (error) {
          console.error('🏷️ Tag analysis error:', error);
          return [];
        }
      })();
      
      // Create the new message object without tags initially (will be updated)
      const newMessage = {
        type: 'user',
        content: processedInput,
        tags: [], // Will be updated after tag analysis completes
        timestamp: new Date().toISOString()
      };

      // Set session contexts for system prompt (temporarily for this call)
      console.log('📄 Setting session contexts:', sessionContexts);
      setCurrentSessionContexts(sessionContexts);

      // Add it to messages state
      await setMessages(prev => [...prev, newMessage]);

      // Use parallel advisors if any are selected, otherwise fall back to current system
      const activeAdvisors = advisors.filter(a => a.active);
      
      if (activeAdvisors.length > 0) {
        // Use parallel advisor system
        console.log('🎭 Using parallel advisors:', activeAdvisors.map(a => a.name));
        await callParallelAdvisors(newMessage.content, activeAdvisors);
      } else {
        // Fall back to current system for non-advisor responses
        console.log('🤖 No active advisors, using standard OpenRouter');
        // DEPRECATED: High Council mode removed
        // if (councilMode) {
        //   const systemPrompt = getSystemPrompt({ councilMode, sessionContexts });
        //   // console.log('🏛️ High Council System Prompt:', systemPrompt);
        // }
        await callOpenRouter(newMessage.content, () => getSystemPrompt({ sessionContexts }));
      }

      // Update message with tags after tag analysis completes (in background)
      tagAnalysisPromise.then(tags => {
        setMessages(prev => prev.map(msg => 
          msg === newMessage ? { ...msg, tags } : msg
        ));
      });

      // Clear session contexts after response
      setCurrentSessionContexts([]);

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      // Provide better error messages based on error type
      let errorMessage = 'Error: Failed to get response from OpenRouter';
      
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = "You've reached today's message limit (100 messages). Your limit will reset at midnight. Consider upgrading for more messages!";
      } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
        errorMessage = "Authentication error. Please sign in again.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: errorMessage 
      }]);
      // Clear session contexts on error
      setCurrentSessionContexts([]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const focusInput = () => {
    if (editingPrompt || editingAdvisor) {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    focusInput();
  }, [messages, isLoading]);

  // Load sessions for autocomplete
  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
  }, [currentSessionId]); // Reload when session changes

  useEffect(() => {
    if (savedPrompts.length > 0) {
      localStorage.setItem('space_prompts', JSON.stringify(savedPrompts));
    }
  }, [savedPrompts]);

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Save changes
      setSavedPrompts(prev => prev.map(p => 
        p.name === editingPrompt.name ? { ...p, text: editText } : p
      ));
      setEditingPrompt(null);
      setEditText('');
    } else if (e.key === 'Escape') {
      // Cancel editing
      setEditingPrompt(null);
      setEditText('');
    }
  };

  // Settings Menu Callback Functions
  const handleClearApiKeys = () => {
    if (useAuthSystem) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'API key management disabled. Using authentication system.'
      }]);
      return;
    }
    
    removeEncrypted('space_anthropic_key');
    removeEncrypted('space_openai_key');
    setApiKeysSet(false);
    setMessages(prev => [...prev, {
      type: 'system',
      content: 'API keys cleared. Please restart the terminal.'
    }]);
  };

  // Handle session selection from autocomplete
  const handleSessionSelect = (session, title) => {
    setSessionSelections(prev => new Map(prev.set(title, session)));
  };

  // Auto-generate summary for previous session when starting a new one
  const generateSummaryForPreviousSession = async (prevSessionId) => {
    if (!openaiClient || prevSessionId === currentSessionId) return;
    
    const sessionData = localStorage.getItem(`space_session_${prevSessionId}`);
    if (!sessionData) return;
    
    const session = JSON.parse(sessionData);
    const messageCount = session.messages.filter(m => m.type === 'user' || m.type === 'assistant').length;
    
    // Only generate summary for sessions with meaningful content that don't already have one
    if (messageCount >= 4 && !session.summary) {
      console.log(`📄 Auto-generating summary for completed session ${prevSessionId}`);
      try {
        await generateSessionSummary(session, openaiClient);
      } catch (error) {
        console.error('Error auto-generating summary:', error);
      }
    }
  };


  // Prompt Library handlers
  const handleUsePrompt = (prompt) => {
    setInput(prompt.text);
    setMessages(prev => [...prev, {
      type: 'system',
      content: `Loaded prompt: "${prompt.name}"`
    }]);
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setShowPromptLibrary(false);
  };

  const handleDeletePrompt = (prompt) => {
    setSavedPrompts(prev => prev.filter(p => p.name !== prompt.name));
    setMessages(prev => [...prev, {
      type: 'system',
      content: `Deleted prompt: "${prompt.name}"`
    }]);
  };

  const handleAddNewPrompt = () => {
    setShowPromptLibrary(false);
    setShowAddPromptForm(true);
  };

  const handleAddPromptSubmit = ({ name, text }) => {
    const newPrompt = { name, text };
    setSavedPrompts(prev => [...prev, newPrompt]);
    setMessages(prev => [...prev, {
      type: 'system',
      content: `Added new prompt: "${name}"`
    }]);
    setShowAddPromptForm(false);
    setShowPromptLibrary(true); // Reopen the prompt library after saving
  };

  // Add this helper function to format messages as markdown
  const formatSessionAsMarkdown = (messages, metadata = {}, options = {}) => {
    const { title, advisors = [], timestamp } = metadata;
    const { includePerspectives = true } = options;
    const date = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();
    
    let markdown = `# ${title || 'SPACE Terminal Session'}\n`;
    markdown += `Exported: ${date}\n\n`;
    
    // Include active perspectives if present and including perspectives
    if (includePerspectives && advisors.length > 0) {
      markdown += `## Active Perspectives\n`;
      advisors.forEach(advisor => {
        markdown += `- **${advisor.name}**: ${advisor.description || 'No description'}\n`;
      });
      markdown += `\n`;
    }
    
    // Filter messages based on export options
    const filteredMessages = includePerspectives 
      ? messages 
      : messages.filter(msg => msg.type === 'user');
    
    // Format messages with proper attribution
    filteredMessages.forEach((msg) => {
      // Skip help command outputs
      if (msg.content && msg.content.includes('SPACE Terminal v0.1 - Command Reference')) {
        return;
      }
      
      switch(msg.type) {
        case 'user':
          markdown += `\n### User\n${msg.content}\n`;
          break;
        case 'assistant':
          markdown += `\n### Assistant\n${msg.content}\n`;
          break;
        case 'parallel_advisor_response':
          // Handle parallel advisor responses with proper attribution
          if (msg.advisorResponses && typeof msg.advisorResponses === 'object') {
            Object.values(msg.advisorResponses).forEach((advisorResp) => {
              if (advisorResp && advisorResp.content && advisorResp.completed) {
                markdown += `\n### ${advisorResp.name}\n${advisorResp.content}\n`;
              }
            });
          }
          break;
        case 'advisor_response':
          // Handle legacy advisor responses with proper attribution
          if (msg.advisorData) {
            markdown += `\n### ${msg.advisorData.name}\n${msg.advisorData.content}\n`;
          } else if (msg.content) {
            markdown += `\n### Advisor\n${msg.content}\n`;
          }
          break;
        case 'system':
          // Only include non-help system messages
          if (!msg.content || !msg.content.includes('/help')) {
            markdown += `\n> ${msg.content || ''}\n`;
          }
          break;
      }
    });
    
    return markdown;
  };

  // Add this helper function at the top level
  const generateWorksheetId = (type) => {
    // Get existing worksheets
    const worksheets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('space_worksheet_')) {
        worksheets.push(key.replace('space_worksheet_', ''));
      }
    }
    
    // Count worksheets of this type
    const typeCount = worksheets.filter(id => id.startsWith(type)).length + 1;
    
    // Generate new ID
    return `${type}-${typeCount}`;
  };

  useEffect(() => {
    if (advisors.length > 0) {
      localStorage.setItem('space_advisors', JSON.stringify(advisors));
    } else {
      localStorage.removeItem('space_advisors');
    }
  }, [advisors]);

  useEffect(() => {
    if (advisorGroups.length > 0) {
      localStorage.setItem('space_advisor_groups', JSON.stringify(advisorGroups));
    }
  }, [advisorGroups]);


  const analyzeMetaphorsWithDuplicatePrevention = async (messages) => {
    if (!metaphorsExpanded || !openaiClient) return;

    const userMessages = messages.filter((m) => m.type === 'user').map((m) => m.content).join('\n');
    if (!userMessages.trim()) return;

    // Prevent duplicate analysis of same content
    if (userMessages === lastMetaphorAnalysisContent) {
      console.log('🔍 Skipping duplicate metaphor analysis');
      return;
    }
    setLastMetaphorAnalysisContent(userMessages);

    console.log('🔍 Metaphor analysis starting, user message chars:', userMessages.length);
    
    // Call the original analyzeMetaphors function
    await analyzeMetaphors(messages, {
      enabled: metaphorsExpanded,
      openaiClient,
      setMetaphors,
      debugMode,
      setMessages
    });
  };

  const analyzeAdvisorSuggestions = async (messages) => {
    if (!advisorSuggestionsExpanded || !openaiClient) return;

    const recentMessages = messages
      .slice(-3)
      .filter(msg => msg.type === 'assistant' || msg.type === 'user')
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join("\n\n");

    if (!recentMessages.trim()) return;

    // Prevent duplicate analysis of same content
    if (recentMessages === lastAdvisorAnalysisContent) {
      console.log('🔍 Skipping duplicate advisor analysis');
      return;
    }
    setLastAdvisorAnalysisContent(recentMessages);

    try {
      console.log('🔍 Perspective suggestions analysis starting, recent messages chars:', recentMessages.length);
      const promptContent = `Based on this recent conversation exchange, suggest exactly 5 specific advisors who could add valuable perspective to this discussion.

You may provide advisors in any of these categories:
1. Real historical figures, thinkers, or experts (living or dead)
2. Mythic figures, gods/goddesses, or legendary characters from various cultures
3. Professional roles or archetypal figures that bring useful frameworks
4. Fictional characters whose wisdom or approach would be illuminating

Choose the categories most appropriate, tonally and practically, for the conversation. *When in doubt,* focus on professional roles.

Be sensitive to the content and tone of the conversation. If the conversation is a serious discussion of a difficult situation, make serious, practical suggestions. If the conversation is playful or humorous, make playful, original perspective suggestions.

Always assume the user is highly intelligent, well-educated, and wants the most targeted and effective advisor for their situation.

Focus on advisors who would bring genuinely different perspectives, challenge assumptions, or offer specialized knowledge that could deepen the exploration.

When writing role-based titles, write them simply without articles. Use as much specificity as the context warrants. Always use title case.

Do NOT include parenthetical descriptions of the advisors, or anything other than a name or role.

Recent conversation:
${recentMessages}

Respond with JSON: {"suggestions": ["Advisor Name 1", "Advisor Name 2", "Advisor Name 3", "Advisor Name 4", "Advisor Name 5"]}`;
      
      const inputTokens = Math.ceil((100 + promptContent.length) / 4); // Estimate input tokens
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a helpful assistant that responds only in valid JSON format."
        }, {
          role: "user",
          content: promptContent
        }],
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      
      // Track usage
      const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);
      trackUsage('gpt', inputTokens, outputTokens);
      
      setAdvisorSuggestions(suggestions.suggestions || []);
    } catch (error) {
      console.error('Error generating perspective suggestions:', error);
    }
  };

  // Generate conversation title using gpt-4o-mini
  const generateConversationTitle = async (messages) => {
    if (!openaiClient) return null;
    
    try {
      // Use first few user/assistant messages for title generation
      const conversationText = messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .slice(0, 6) // Use first 6 messages to capture the conversation direction
        .map(msg => `${msg.type}: ${msg.content.slice(0, 200)}`) // Limit content length
        .join('\n');
        
      if (!conversationText.trim()) return null;
      
      const inputTokens = Math.ceil((200 + conversationText.length) / 4); // Estimate input tokens
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "Generate a concise, descriptive title (2-6 words) for this conversation. Focus on the main topic or question. Return only the title, no quotes or extra text. Examples: 'Python debugging help', 'Recipe for pasta', 'Career advice discussion'."
        }, {
          role: "user",
          content: `Generate a title for this conversation:\n\n${conversationText}`
        }],
        max_tokens: 30,
        temperature: 0.7
      });
      
      const title = response.choices[0].message.content.trim();
      
      // Track usage
      const outputTokens = Math.ceil(title.length / 4);
      trackUsage('gpt', inputTokens, outputTokens);
      
      return title;
    } catch (error) {
      console.error('Title generation failed:', error);
      return null;
    }
  };

  const generateAdvisorVote = async (advisor, question, options) => {
    if (!openaiClient) return { position: 'abstain', confidence: 0, reasoning: 'No API connection' };
    try {
      const optionsList = options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
      
      const prompt = `As ${advisor.name}, vote on this question from your perspective: "${question}"

Your persona: ${advisor.description}

Available options:
${optionsList}

Choose one of the numbered options above and respond with a JSON object containing:
- "position": The exact text of your chosen option (not the number)
- "confidence": Your confidence level (0-100)
- "reasoning": A brief explanation in your voice (1-2 sentences)

Example: {"position": "Option 2 text here", "confidence": 75, "reasoning": "This aligns with my philosophical understanding of human nature."}`;

      const inputTokens = Math.ceil((100 + prompt.length) / 4);
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a voting advisor. Choose from the provided options only. Respond in valid JSON format with the exact fields requested.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });
      
      const vote = JSON.parse(response.choices[0].message.content);
      const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);
      trackUsage('gpt', inputTokens, outputTokens);
      
      // Validate that the position matches one of the options
      let validPosition = vote.position;
      if (!options.some(opt => opt.toLowerCase().includes(validPosition.toLowerCase()) || validPosition.toLowerCase().includes(opt.toLowerCase()))) {
        // If no match found, default to first option
        validPosition = options[0];
      }
      
      const sanitizedVote = {
        position: validPosition,
        confidence: Math.max(0, Math.min(100, parseInt(vote.confidence) || 0)),
        reasoning: vote.reasoning || 'No reasoning provided'
      };
      
      return sanitizedVote;
    } catch (e) {
      console.error('Vote generation failed for', advisor.name, e);
      return { position: options[0] || 'abstain', confidence: 0, reasoning: 'Vote generation failed' };
    }
  };

  const handleModalVote = async (question, options) => {
    const active = advisors.filter(a => a.active);
    if (active.length === 0) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'No active advisors to vote. Please activate advisors first.'
      }]);
      return;
    }

    // Add "starting vote" message
    setMessages(prev => [...prev, {
      type: 'system',
      content: `**Starting Vote:** "${question}"\n**Options:** ${options.map((opt, i) => `${i + 1}. ${opt}`).join(', ')}`
    }]);

    const votes = [];
    for (const adv of active) {
      const vote = await generateAdvisorVote(adv, question, options);
      votes.push({ advisor: adv.name, ...vote });
    }
    
    setVoteHistory(prev => [...prev, { question, options, votes }]);
    
    // Create voting results message
    const tally = {};
    let totalConf = 0;
    votes.forEach(v => {
      tally[v.position] = (tally[v.position] || 0) + 1;
      totalConf += v.confidence;
    });
    const recommended = Object.entries(tally).sort((a,b)=>b[1]-a[1])[0][0];
    const avgConfidence = Math.round(totalConf / votes.length);
    
    let voteResults = `**Voting Results**\n\n`;
    votes.forEach(vote => {
      voteResults += `**${vote.advisor}:** ${vote.position} (${vote.confidence}% confidence)\n`;
      if (vote.reasoning) {
        voteResults += `  *"${vote.reasoning}"*\n`;
      }
      voteResults += `\n`;
    });
    voteResults += `**Summary:** ${tally[recommended]}/${active.length} advisors chose **${recommended}** (avg confidence: ${avgConfidence}%)`;
    
    setMessages(prev => [...prev, { 
      type: 'system', 
      content: voteResults
    }]);
  };

  // DEPRECATED: High Council Mode handler - Replaced by parallel advisor streaming
  // const handleStartHighCouncil = async (topic) => {
  //   const active = advisors.filter(a => a.active);
  //   if (active.length === 0) {
  //     setMessages(prev => [...prev, {
  //       type: 'system',
  //       content: 'No active advisors for High Council debate. Please activate advisors first.'
  //     }]);
  //     return;
  //   }

  //   // Set the input and trigger form submission
  //   const councilMessage = `/council ${topic}`;
  //   setInput(councilMessage);
  //
  //   // Trigger the form submission programmatically
  //   setTimeout(() => {
  //     const form = document.querySelector('form');
  //     if (form) {
  //       const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  //       form.dispatchEvent(submitEvent);
  //     }
  //   }, 100);
  // };

  // Auto-save to database when using auth system, localStorage as fallback
  useEffect(() => {
    // Only save sessions that have actual user/assistant messages (not just system messages)
    const nonSystemMessages = messages.filter(msg => msg.type !== 'system');
    if (nonSystemMessages.length > 0) {
      const saveSession = async () => {
        if (useDatabaseStorage && currentConversationId) {
          // Database storage: Save individual messages as they come
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && !lastMessage.saved) {
            // Validate that message has required fields before attempting to save
            if (!lastMessage.type || !lastMessage.content || lastMessage.content.trim() === '') {
              console.log('⏳ Skipping save of incomplete message:', { 
                type: lastMessage.type, 
                hasContent: !!lastMessage.content,
                contentLength: lastMessage.content?.length || 0 
              });
              return; // Skip saving incomplete messages
            }
            
            try {
              await storage.addMessage(
                currentConversationId,
                lastMessage.type,
                lastMessage.content,
                {
                  tags: lastMessage.tags || [],
                  timestamp: lastMessage.timestamp || new Date().toISOString()
                }
              );
              
              // Mark message as saved to prevent duplicate saves
              setMessages(prev => prev.map((msg, idx) => 
                idx === prev.length - 1 ? { ...msg, saved: true } : msg
              ));
              
              // Update conversation metadata (metaphors, perspective suggestions, etc.)
              await storage.saveSessionMetadata(currentConversationId, {
                metaphors,
                advisorSuggestions,
                voteHistory,
                lastActivity: new Date().toISOString()
              });
              
            } catch (error) {
              console.error('Failed to save to database:', error);
              // Don't fall back to localStorage in database mode - just log the error
              // Falling back would create localStorage sessions that trigger migration
            }
          }
        } else {
          // Legacy localStorage storage
          saveLegacySession();
        }
        
        async function saveLegacySession() {
          const sessionData = {
            id: currentSessionId,
            timestamp: new Date().toISOString(),
            messages: messages.map(msg => ({
              ...msg,
              tags: msg.tags || []
            })),
            metaphors,
            advisorSuggestions,
            voteHistory
          };

          // Generate title if this is a new session with enough content and no title yet
          const existingSession = localStorage.getItem(`space_session_${currentSessionId}`);
          const hasTitle = existingSession ? JSON.parse(existingSession).title : false;
          
          if (!hasTitle && nonSystemMessages.length >= 2) {
            // Generate title when we have a back-and-forth conversation
            const title = await generateConversationTitle(messages);
            if (title) {
              sessionData.title = title;
            }
          } else if (hasTitle) {
            // Preserve existing title and existing summary
            const existing = JSON.parse(existingSession);
            sessionData.title = existing.title;
            if (existing.summary) {
              sessionData.summary = existing.summary;
              sessionData.summaryTimestamp = existing.summaryTimestamp;
              sessionData.summaryMessageCount = existing.summaryMessageCount;
            }
          }

          // Auto-generate summary for long conversations (every 20 messages)
          if (nonSystemMessages.length > 0 && nonSystemMessages.length % 20 === 0 && openaiClient) {
            const existing = existingSession ? JSON.parse(existingSession) : null;
            if (!existing?.summary || existing.summaryMessageCount < nonSystemMessages.length - 10) {
              console.log(`📄 Auto-generating summary for long session ${currentSessionId} (${nonSystemMessages.length} messages)`);
              try {
                // Generate summary in background without blocking UI
                setTimeout(async () => {
                  await generateSessionSummary(sessionData, openaiClient);
                }, 1000);
              } catch (error) {
                console.error('Error auto-generating summary for long session:', error);
              }
            }
          }

          localStorage.setItem(`space_session_${currentSessionId}`, JSON.stringify(sessionData));
        }
      };

      saveSession();
    }
  }, [messages, metaphors, advisorSuggestions, voteHistory, currentSessionId, currentConversationId, useDatabaseStorage, storage, openaiClient]);

  // Trigger analysis when messages change and we have a Claude response (debounced for performance)
  useEffect(() => {
    if (messages.length > 1 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      // Only analyze after Claude responses (assistant messages) and not during streaming
      if (lastMessage.type === 'assistant' && !lastMessage.isStreaming && !lastMessage.isJsonStreaming) {
        // Debounce analysis to avoid excessive calls during streaming updates
        const debounceTimer = setTimeout(() => {
          analyzeMetaphorsWithDuplicatePrevention(messages);
          analyzeAdvisorSuggestions(messages);
        }, 500); // 500ms debounce to wait for streaming to complete
        
        return () => clearTimeout(debounceTimer);
      }
    }
  }, [messages, isLoading, metaphorsExpanded, advisorSuggestionsExpanded, openaiClient]);

  // Trigger metaphors analysis when expanded state changes
  useEffect(() => {
    if (metaphorsExpanded && messages.length > 0 && openaiClient) {
      analyzeMetaphorsWithDuplicatePrevention(messages);
    }
  }, [metaphorsExpanded, openaiClient]);

  // DEPRECATED: Questions feature temporarily disabled
  // // Trigger questions analysis when expanded state changes
  // useEffect(() => {
  //   if (questionsExpanded && messages.length > 0 && openaiClient) {
  //     analyzeForQuestions(messages, {
  //       enabled: questionsExpanded,
  //       openaiClient,
  //       setQuestions,
  //       debugMode,
  //       setMessages
  //     });
  //   }
  // }, [questionsExpanded, openaiClient]);

  // Trigger perspective suggestions analysis when expanded state changes
  useEffect(() => {
    if (advisorSuggestionsExpanded && messages.length > 0 && openaiClient) {
      analyzeAdvisorSuggestions(messages);
    }
  }, [advisorSuggestionsExpanded, openaiClient]);

  // Auto-scroll is now handled by browser's natural scroll behavior

  // DEPRECATED: This effect is now handled by the auto-load effect above (lines 810-854)
  // The auto-load effect handles both persisted session restoration and fallback to most recent session
  // This duplicate initialization effect has been removed to prevent conflicts

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      terminalRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatCaptureAsMarkdown = (selectedText, timestamp, messageIndex) => {
    const formattedDate = new Date(timestamp).toLocaleString();
    const deepLink = `${window.location.origin}${window.location.pathname}?session=${currentSessionId}&message=${messageIndex}`;
    
    return `# SPACE Terminal Capture
Captured on: ${formattedDate}

${selectedText}

[View in context](${deepLink})`;
  };

  const handleContextMenu = (e) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText) {
      e.preventDefault();
      
      // Find which message contains the selection
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;
      
      // Walk up the DOM tree until we find an element with an ID starting with 'msg-'
      while (element && (!element.id || !element.id.startsWith('msg-'))) {
        element = element.parentElement;
      }
      
      const messageId = element?.id;
      const messageIndex = messageId ? parseInt(messageId.replace('msg-', '')) : null;

      if (!messageIndex && messageIndex !== 0) {  // Check for both null and undefined
        setMessages(prev => [...prev, {
          type: 'system',
          content: 'Could not determine message position for link'
        }]);
        return;
      }
      
      const menu = document.createElement('div');
      menu.className = `
        absolute bg-gray-900 
        border border-green-400 
        rounded-md shadow-lg 
        py-1
      `;
      menu.style.left = `${e.pageX}px`;
      menu.style.top = `${e.pageY}px`;
      
      const captureButton = document.createElement('button');
      captureButton.className = `
        w-full px-4 py-2 
        text-left text-green-400 
        hover:bg-gray-800
      `;
      captureButton.textContent = 'Capture Selection';
      
      captureButton.onclick = () => {
        try {
          const timestamp = new Date().toISOString();
          const markdown = formatCaptureAsMarkdown(selectedText, timestamp, messageIndex);
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `space-capture-${timestamp.split('T')[0]}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Check if menu is still in document before trying to remove it
          if (menu.parentNode === document.body) {
            document.body.removeChild(menu);
          }
          
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Capture saved successfully'
          }]);
        } catch (error) {
          console.error('Error during capture:', error);
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Error saving capture'
          }]);
        }
      };
      
      menu.appendChild(captureButton);
      document.body.appendChild(menu);
      
      // Remove menu when clicking outside
      const removeMenu = (e) => {
        if (!menu.contains(e.target)) {
          document.body.removeChild(menu);
          document.removeEventListener('click', removeMenu);
        }
      };
      document.addEventListener('click', removeMenu);
    }
  };

  useEffect(() => {
    // Pre-initialize TagAnalyzer to avoid delays during first analysis
    sharedTagAnalyzer.preInitialize();
    
    // Check URL parameters on load
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const messageId = params.get('message');
    
    if (sessionId && messageId) {
      // Check if it's a UUID (database conversation) or integer (localStorage session)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId);
      
      if (isUUID && useDatabaseStorage) {
        // Load from database using handleLoadSession
        handleLoadSession(sessionId);
      } else {
        // Load from localStorage
        const sessionKey = `space_session_${sessionId}`;
        const sessionData = localStorage.getItem(sessionKey);
        
        if (sessionData) {
          const session = JSON.parse(sessionData);
          
          // Process messages to restore advisor_json format if needed
          const processedMessages = session.messages.map(msg => {
            // If it's an assistant message that looks like JSON advisor format, restore it
            if (msg.type === 'assistant' && msg.content) {
              let jsonContent = msg.content.trim();
              
              // Handle markdown code block format
              if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
                jsonContent = jsonContent.slice(7, -3).trim();
              }
              
              // Check if it's valid advisor JSON
              if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
                try {
                  const parsed = JSON.parse(jsonContent);
                  if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
                    // Restore as advisor_json type with parsedAdvisors
                    return {
                      ...msg,
                      type: 'advisor_json',
                      content: jsonContent,
                      parsedAdvisors: parsed
                    };
                  }
                } catch (e) {
                  // Not valid JSON, keep as-is
                }
              }
            }
            
            return msg;
          });
          
          setMessages(processedMessages);
          setCurrentSessionId(parseInt(sessionId));
          persistCurrentSession(parseInt(sessionId), null); // Persist localStorage session ID
          
          // Scroll to the specified message after render
        setTimeout(() => {
          const element = document.getElementById(`msg-${messageId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add highlight effect
            element.classList.add('bg-green-900/20');
            setTimeout(() => element.classList.remove('bg-green-900/20'), 2000);
          }
        }, 100);
      }
    }
  }, []);

  const handleAdvisorClick = (advisor) => {
    setAdvisors(prev => prev.map(a => 
      a.name === advisor.name 
        ? { ...a, active: !a.active }
        : a
    ));
  };

  const handleGroupClick = (group) => {
    const isActive = activeGroups.includes(group.name);
    if (isActive) {
      // Deactivate group and all its advisors
      setActiveGroups(prev => prev.filter(g => g !== group.name));
      setAdvisors(prev => prev.map(advisor => 
        group.advisors.includes(advisor.name) 
          ? { ...advisor, active: false }
          : advisor
      ));
    } else {
      // Activate group and all its advisors
      setActiveGroups(prev => [...prev, group.name]);
      setAdvisors(prev => prev.map(advisor => 
        group.advisors.includes(advisor.name) 
          ? { ...advisor, active: true }
          : advisor
      ));
    }
  };

  const handleAdvisorSuggestionClick = (suggestion) => {
    setSuggestedAdvisorName(suggestion);
    setShowAdvisorForm(true);
  };

  const handleAddGeneratedPerspective = async (perspective) => {
    // Assign unique color
    const assignedColors = advisors.map(a => a.color).filter(Boolean);
    const newColor = getNextAvailableColor(assignedColors);

    // Create new perspective with default system prompt
    const newPerspective = {
      name: perspective.name,
      description: perspective.rationale,
      color: newColor,
      active: true,
      systemPrompt: `You are ${perspective.name}. ${perspective.rationale} Provide your perspective based on this viewpoint.`
    };

    // Add to advisors list
    setAdvisors(prev => [...prev, newPerspective]);

    // Trigger immediate response if there are messages
    const lastUserMessage = messages.filter(m => m.type === 'user').slice(-1)[0];
    if (lastUserMessage) {
      await callParallelAdvisors([newPerspective], lastUserMessage.content);
    }
  };

  // Sidebar collapse/expand handler
  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('space_sidebar_collapsed', newCollapsed.toString());
  };

  const getCurrentQuestionId = () => {
    const template = WORKSHEET_TEMPLATES[currentWorksheetId];
    if (template.type === 'basic') {
      return template.questions[currentQuestion].id;
    }
    return template.sections[currentSection].questions[currentQuestion].id;
  };


  const exportAllSessions = () => {
    try {
      const sessions = [];
      
      // Iterate through localStorage to find all session keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('space_session_')) {
          try {
            const sessionData = localStorage.getItem(key);
            const session = JSON.parse(sessionData);
            
            // Validate session has required fields
            if (session && session.messages && Array.isArray(session.messages)) {
              sessions.push(session);
            } else {
              console.warn(`Skipping invalid session: ${key}`);
            }
          } catch (parseError) {
            console.error(`Failed to parse session ${key}:`, parseError);
          }
        }
      }
      
      // Check if we found any valid sessions
      if (sessions.length === 0) {
        throw new Error('No valid sessions found to export');
      }
      
      // Create export data
      const exportData = JSON.stringify(sessions, null, 2);
      
      // Validate export data
      if (!exportData || exportData.length === 0) {
        throw new Error('Generated export is empty');
      }
      
      const blob = new Blob([exportData], { type: 'application/json' });
      
      // Validate blob creation
      if (blob.size === 0) {
        throw new Error('Export file is empty');
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Add timestamp to filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      a.download = `space-all-sessions-${timestamp}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessages(prev => [...prev, {
        type: 'system',
        content: `All sessions exported successfully (${sessions.length} sessions, ${blob.size} bytes)`
      }]);
    } catch (error) {
      console.error('Export all failed:', error);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Export failed: ${error.message}`
      }]);
    }
  };

  return (
    <>
      
      {isInitializing ? (
        // Loading state to prevent flash of wrong screen
        <div className="w-full h-screen bg-black flex items-center justify-center">
          <div className="text-green-400 animate-pulse">Loading SPACE Terminal...</div>
        </div>
      ) : showWelcome && !useAuthSystem ? (
        // Welcome screen only shown in legacy mode (auth mode handles this at App level)
        <WelcomeScreen 
          onGetStarted={() => setShowWelcome(false)}
        />
      ) : !apiKeysSet ? (
        // Only shown in legacy mode (useAuthSystem=false) when no API keys are set
        <ApiKeySetup 
          onComplete={({ anthropicKey, openaiKey }) => {
            const client = new OpenAI({
              apiKey: openaiKey,
              dangerouslyAllowBrowser: true
            });
            setOpenaiClient(client);
            console.log('✅ OpenAI client initialized on API key setup complete');
            setApiKeysSet(true);
            setShowWelcome(false); // Ensure welcome screen doesn't show again
          }} 
        />
      ) : (
        // Regular terminal UI with responsive layout
        <ResponsiveContainer
          mobileLayout={
            <MobileLayout
              advisors={advisors}
              setAdvisors={setAdvisors}
              messages={messages}
              setMessages={setMessages}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              handleSubmit={handleSubmit}
              metaphors={metaphors}
              advisorSuggestions={advisorSuggestions}
              handleAdvisorSuggestionClick={handleAdvisorSuggestionClick}
              setShowAdvisorForm={setShowAdvisorForm}
              setShowSettingsMenu={setShowSettingsMenu}
              setShowPromptLibrary={setShowPromptLibrary}
              setShowSessionPanel={setShowSessionPanel}
              setShowHelpModal={setShowHelpModal}
              setShowInfoModal={setShowInfoModal}
              // Pass message rendering functions
              // DEPRECATED: processCouncilDebates removed with High Council mode
              paragraphSpacing={paragraphSpacing}
              setSelectedAdvisorForAssertions={setSelectedAdvisorForAssertions}
              setShowAssertionsModal={setShowAssertionsModal}
              getSystemPrompt={getSystemPrompt}
            />
          }
          desktopLayout={
            <div
              ref={terminalRef}
              className="w-full h-screen font-serif flex relative bg-gradient-to-b from-amber-50 to-amber-100 text-gray-800 dark:bg-gradient-to-b dark:from-gray-900 dark:to-black dark:text-green-400"
              onContextMenu={handleContextMenu}
              style={{
                /* Custom scrollbar styling for webkit browsers */
                scrollbarWidth: 'thin',
                scrollbarColor: '#374151 transparent'
              }}
            >
              {/* Left Sidebar - Collapsible */}
              {!sidebarCollapsed && (
                <div className="w-64 border-r border-gray-300 dark:border-gray-800 overflow-y-auto scrollbar-terminal flex-shrink-0 flex flex-col">
                  {/* Header with title and collapse button */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">SPACE Terminal</h1>
                    <button
                      onClick={toggleSidebar}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Close sidebar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* New Chat Button */}
                  <div className="p-4">
                    <button
                      onClick={handleNewSession}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      New Chat
                    </button>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto px-4">
                    <GroupableModule
                      title="Perspectives"
                      groups={advisorGroups}
                      items={advisors}
                      onItemClick={handleAdvisorClick}
                      onGroupClick={handleGroupClick}
                      activeItems={advisors.filter(a => a.active)}
                      activeGroups={activeGroups}
                      onAddClick={() => {
                        setSuggestedAdvisorName('');
                        setShowAdvisorForm(true);
                      }}
                      setEditingAdvisor={setEditingAdvisor}
                      setAdvisors={setAdvisors}
                      setMessages={setMessages}
                    />

                    <PerspectiveGenerator
                      messages={messages}
                      existingAdvisors={advisors}
                      onAddPerspective={handleAddGeneratedPerspective}
                      trackUsage={trackUsage}
                      onEditAdvisor={setEditingAdvisor}
                    />

                    {/* Accordion Menu */}
                    <div className="mt-6 mb-4">
                      <AccordionMenu
                        onSettingsClick={() => setShowSettingsMenu(true)}
                        onPromptLibraryClick={() => setShowPromptLibrary(true)}
                        onSessionManagerClick={() => setShowSessionPanel(true)}
                        onNewSessionClick={handleNewSession}
                        onExportClick={() => setShowExportMenu(true)}
                        onDossierClick={() => setShowDossierModal(true)}
                        onEvaluationsClick={() => setShowEvaluationsModal(true)}
                        onImportExportAdvisorsClick={() => setShowImportExportModal(true)}
                        onVotingClick={() => setShowVotingModal(true)}
                        onHelpClick={() => setShowHelpModal(true)}
                        onFullscreenClick={toggleFullscreen}
                        isFullscreen={isFullscreen}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Expand Button (when sidebar is collapsed) */}
              {sidebarCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="absolute top-2 left-2 z-10 p-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors shadow-md"
                  title="Expand sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* Main Column */}
              <div className="flex-1 flex flex-col min-h-0">
                {showJournalOnboarding ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <JournalOnboarding
                      onSubmit={handleJournalSubmit}
                      onSkip={handleJournalSkip}
                      contextFlow={contextFlow.active ? {
                        phase: 'questions',
                        currentQuestion: contextFlow.questions[contextFlow.currentQuestionIndex],
                        questionIndex: contextFlow.currentQuestionIndex,
                        currentAnswer: contextFlow.answers[contextFlow.currentQuestionIndex] || '',
                        hasNextQuestion: !!contextFlow.questions[contextFlow.currentQuestionIndex + 1]
                      } : null}
                      onAnswerQuestion={handleAnswerQuestion}
                      onSkipQuestion={handleSkipQuestion}
                      onNavigateQuestion={handleNavigateQuestion}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto">
                      <div className="max-w-3xl mx-auto px-4 py-8">
                        {messages.map((msg, idx) => (
                          <MessageRenderer
                            key={msg.timestamp ? `${msg.timestamp}-${idx}` : `${idx}-${msg.content?.slice(0, 20) || 'empty'}`}
                            msg={msg}
                            idx={idx}
                            advisors={advisors}
                            paragraphSpacing={paragraphSpacing}
                            onAssertionsClick={(advisorData, msgs, getPrompt) => {
                              console.log('🎯 Assertions clicked for:', advisorData);
                              setSelectedAdvisorForAssertions({
                                ...advisorData,
                                conversationContext: {
                                  messages: [...msgs],
                                  advisors: [...advisors],
                                  systemPrompt: getPrompt(),
                                  timestamp: new Date().toISOString()
                                }
                              });
                              setShowAssertionsModal(true);
                            }}
                            messages={messages}
                            getSystemPrompt={getSystemPrompt}
                          />
                        ))}
                        {isLoading && <div className="text-amber-600 dark:text-amber-400 my-4">Loading...</div>}
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="py-6">
                      <div className="max-w-3xl mx-auto px-4">
                      {editingPrompt ? (
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          className="w-full h-40 bg-white text-gray-800 font-serif p-2 border border-gray-300 focus:outline-none resize-none dark:bg-black dark:text-green-400 dark:border-green-400"
                          placeholder="Edit your prompt..."
                          autoFocus
                          autoComplete="off"
                          spellCheck="true"
                          data-role="text-editor"
                        />
                      ) : editingAdvisor ? (
                        <textarea
                          value={editAdvisorText}
                          onChange={(e) => setEditAdvisorText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              // Save changes
                              setAdvisors(prev => prev.map(a =>
                                a.name === editingAdvisor.name ? { ...a, description: editAdvisorText } : a
                              ));
                              setEditingAdvisor(null);
                              setEditAdvisorText('');
                            } else if (e.key === 'Escape') {
                              // Cancel editing
                              setEditingAdvisor(null);
                              setEditAdvisorText('');
                            }
                          }}
                          className="w-full h-40 bg-white text-gray-800 font-serif p-2 border border-gray-300 focus:outline-none resize-none dark:bg-black dark:text-green-400 dark:border-green-400"
                          placeholder="Edit advisor description..."
                          autoFocus
                          autoComplete="off"
                          spellCheck="true"
                          data-role="text-editor"
                        />
                      ) : (
                        <ExpandingInput
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onSubmit={handleSubmit}
                          isLoading={isLoading}
                          sessions={sessions}
                          onSessionSelect={handleSessionSelect}
                        />
                      )}
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* Info Button - Top Right */}
              <div className="fixed top-4 right-4 z-50">
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-black border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
                  title="About SPACE Terminal"
                  onClick={() => setShowInfoModal(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          }
        />
      )}

      {showAdvisorForm && (
            <AdvisorForm
              initialName={suggestedAdvisorName}
              existingAdvisors={advisors}
              onSubmit={(formData) => {
                const newAdvisor = createAdvisorObject(formData, true);
                setAdvisors(prev => [...prev, newAdvisor]);
                setShowAdvisorForm(false);
                setSuggestedAdvisorName('');
              }}
              onCancel={() => {
                setShowAdvisorForm(false);
                setSuggestedAdvisorName('');
              }}
            />
          )}

          {/* AdvisorForm for creating custom perspectives in suggestions modal */}
          {editingAdvisor?.isNewForSuggestions && (
            <AdvisorForm
              initialName=""
              existingAdvisors={advisors}
              onSubmit={(formData) => {
                const newAdvisor = createAdvisorObject(formData, false);
                handleSaveCustomPerspective(newAdvisor);
                setEditingAdvisor(null);
              }}
              onCancel={() => {
                setEditingAdvisor(null);
              }}
            />
          )}

          {editingAdvisor && !editingAdvisor.isNewForSuggestions && (
            <EditAdvisorForm
              advisor={editingAdvisor}
              onSubmit={({ name, description, color }) => {
                setAdvisors(prev => prev.map(a => 
                  a.name === editingAdvisor.name 
                    ? { ...a, name, description, color }
                    : a
                ));
                setEditingAdvisor(null);
              }}
              onCancel={() => {
                setEditingAdvisor(null);
              }}
            />
          )}

          {editingPrompt && (
            <EditPromptForm
              prompt={editingPrompt}
              onSubmit={({ name, text }) => {
                setSavedPrompts(prev => prev.map(p => 
                  p.name === editingPrompt.name 
                    ? { ...p, name, text }
                    : p
                ));
                setEditingPrompt(null);
                setEditText('');
              }}
              onCancel={() => {
                setEditingPrompt(null);
                setEditText('');
              }}
            />
          )}

      {/* Settings Menu Component */}
      <SettingsMenu
        isOpen={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        debugMode={debugMode}
        setDebugMode={setDebugMode}
        reasoningMode={reasoningMode}
        setReasoningMode={setReasoningMode}
        contextLimit={contextLimit}
        setContextLimit={setContextLimit}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        onClearApiKeys={handleClearApiKeys}
        theme={theme}
        toggleTheme={toggleTheme}
        paragraphSpacing={paragraphSpacing}
        setParagraphSpacing={setParagraphSpacing}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        openrouterModel={openrouterModel}
        setOpenrouterModel={import.meta.env.DEV ? setOpenrouterModel : () => {}}
      />

      {/* Prompt Library Component */}
      <PromptLibrary
        isOpen={showPromptLibrary}
        onClose={() => setShowPromptLibrary(false)}
        savedPrompts={savedPrompts}
        onUsePrompt={handleUsePrompt}
        onEditPrompt={handleEditPrompt}
        onDeletePrompt={handleDeletePrompt}
        onAddNewPrompt={handleAddNewPrompt}
      />

      {/* Voting Modal Component */}
      <VotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        advisors={advisors}
        onSubmitVote={handleModalVote}
      />

      {/* DEPRECATED: High Council Modal - Replaced by parallel advisor streaming */}
      {/* <HighCouncilModal
        isOpen={showHighCouncilModal}
        onClose={() => setShowHighCouncilModal(false)}
        onStartCouncil={handleStartHighCouncil}
      /> */}

      {/* Add Prompt Form Component */}
      <AddPromptForm
        isOpen={showAddPromptForm}
        onSubmit={handleAddPromptSubmit}
        onCancel={() => setShowAddPromptForm(false)}
      />

      {/* Session Panel Component */}
      <SessionPanel
        isOpen={showSessionPanel}
        onClose={() => setShowSessionPanel(false)}
        currentSessionId={currentSessionId || currentConversationId}
        onNewSession={handleNewSession}
        onLoadSession={handleLoadSession}
        onLoadPrevious={handleLoadPrevious}
        onResetAllSessions={handleResetAllSessions}
        onDeleteSession={handleDeleteSession}
        useDatabaseStorage={useDatabaseStorage}
        storage={storage}
      />

      {/* Export Menu Component */}
      <ExportMenu
        isOpen={showExportMenu}
        onClose={() => setShowExportMenu(false)}
        onExportSession={handleExportSession}
        onExportAll={handleExportAll}
        currentSessionId={currentSessionId}
        sessionTitle={(() => {
          const sessionData = localStorage.getItem(`space_session_${currentSessionId}`);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            return session.title;
          }
          return null;
        })()}
      />

      <DossierModal
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
        onJumpToSession={(sessionId) => {
          setShowDossierModal(false);
          handleLoadSession(sessionId);
        }}
      />

      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
        advisors={advisors}
        onImport={handleAdvisorImport}
      />

      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* DEPRECATED: Migration Modal - No longer needed */}
      {/* <MigrationModal
        isOpen={showMigrationModal}
        onComplete={() => {
          console.log('🔄 Migration completed, closing modal');
          console.log('🔄 Current showMigrationModal state:', showMigrationModal);
          // Mark migration as completed immediately to prevent re-opening
          localStorage.setItem('space_migration_status', 'completed');
          localStorage.setItem('space_migration_date', new Date().toISOString());
          setShowMigrationModal(false);
          console.log('🔄 Called setShowMigrationModal(false)');
          // Force a check after state update
          setTimeout(() => {
            console.log('🔄 showMigrationModal state after setState:', showMigrationModal);
          }, 100);
        }}
      /> */}

      {/* Assertions Modal Component */}
      <AssertionsModal
        isOpen={showAssertionsModal}
        onClose={() => {
          setShowAssertionsModal(false);
          setSelectedAdvisorForAssertions(null);
        }}
        onSaveAndEvaluate={(assertionsData) => {
          setShowAssertionsModal(false);
          setSelectedResponseForEvaluation(assertionsData);
          setSelectedAdvisorForAssertions(null);
          setShowEvaluationsModal(true);
        }}
        advisorResponse={selectedAdvisorForAssertions}
        conversationContext={selectedAdvisorForAssertions?.conversationContext || {
          messages: [...messages],
          advisors: [...advisors],
          systemPrompt: getSystemPrompt(),
          timestamp: new Date().toISOString()
        }}
        onSave={(assertionsData) => {
          console.log('🎯 Assertions saved:', assertionsData);
          // TODO: Show success message or update UI
        }}
      />

      {/* Evaluations Modal Component */}
      <EvaluationsModal
        isOpen={showEvaluationsModal}
        onClose={() => {
          setShowEvaluationsModal(false);
          setSelectedResponseForEvaluation(null);
        }}
        initialResponse={selectedResponseForEvaluation}
        advisors={advisors}
        onUpdateAdvisor={(advisorName, updatedProperties) => {
          setAdvisors(prev => prev.map(a =>
            a.name === advisorName
              ? { ...a, ...updatedProperties }
              : a
          ));
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Updated advisor "${advisorName}" with optimized prompt.`
          }]);
        }}
      />

      <AdvisorSuggestionsModal
        isOpen={showJournalSuggestions}
        suggestions={journalSuggestions}
        existingAdvisors={advisors}
        onAddSelected={handleAddSuggestedAdvisors}
        onRegenerate={handleRegenerateSuggestions}
        onSkip={handleSkipSuggestions}
        isRegenerating={isGeneratingSuggestions}
        onEditAdvisor={setEditingAdvisor}
        customPerspectives={customPerspectives}
        onCreateCustom={handleCreateCustomPerspective}
      />
    </>
  );
}

export default Terminal;
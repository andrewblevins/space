import { useState, useEffect, useRef } from 'react';
import AdvisorSuggestionsModal from './AdvisorSuggestionsModal';
import { generatePerspectives, formatMessagesAsContext } from '../utils/perspectiveGeneration';

/**
 * Component for generating perspective suggestions in a modal
 * @param {object} props
 * @param {Array} props.messages - Conversation messages for context
 * @param {Array} props.existingAdvisors - Currently saved advisors
 * @param {Function} props.onAddPerspective - Callback when adding perspectives
 * @param {Function} props.trackUsage - Usage tracking function
 * @param {Function} props.onEditAdvisor - Callback when editing an advisor
 * @param {boolean} props.disabled - Whether the generator button should be disabled
 * @param {'subtle' | 'terminal' | 'hybrid'} [props.variant='subtle'] - Style variant
 */
export function PerspectiveGenerator({
  messages,
  existingAdvisors = [],
  onAddPerspective,
  trackUsage,
  onEditAdvisor,
  disabled = false,
  variant = 'subtle'
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedPerspectives, setGeneratedPerspectives] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Use ref to always have access to the latest messages (prevents stale closure issues)
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Clear generated perspectives when messages change significantly (session switch)
  const prevMessageCount = useRef(messages.length);
  useEffect(() => {
    // If messages were cleared (session switch), clear generated perspectives
    if (messages.length === 0 || messages.length < prevMessageCount.current - 2) {
      setGeneratedPerspectives([]);
      setIsModalOpen(false);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  const hasMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant').length > 0;
  const isDisabled = disabled || !hasMessages;

  const handleGeneratePerspectives = async () => {
    if (isDisabled) return;

    // Open modal and start generating
    setIsModalOpen(true);
    setIsGenerating(true);

    try {
      // CRITICAL: Use messagesRef.current to get the LATEST messages at call time
      // This prevents stale closure issues when switching sessions
      const currentMessages = messagesRef.current;
      
      // Debug logging
      const userAssistantMessages = currentMessages.filter(m => m.type === 'user' || m.type === 'assistant');
      console.log('🎯 Generate Perspectives called with:', {
        totalMessages: currentMessages.length,
        userAssistantMessages: userAssistantMessages.length,
        firstUserMessage: userAssistantMessages[0]?.content?.substring(0, 50) + '...',
        lastMessage: userAssistantMessages[userAssistantMessages.length - 1]?.content?.substring(0, 50) + '...'
      });
      
      // Format recent messages as context
      const context = formatMessagesAsContext(currentMessages);
      const existingNames = existingAdvisors.map(a => a.name);

      // Generate perspectives using shared utility
      const perspectives = await generatePerspectives(context, existingNames, 'conversation');

      // Add unique IDs to each perspective
      const perspectivesWithIds = perspectives.map((p, idx) => ({
        ...p,
        id: `${Date.now()}-${idx}`
      }));

      setGeneratedPerspectives(perspectivesWithIds);

      // Track usage if handler provided (estimate tokens)
      if (trackUsage) {
        const inputTokens = Math.ceil((500 + context.length) / 4);
        const outputTokens = Math.ceil(JSON.stringify(perspectives).length / 4);
        trackUsage('claude', inputTokens, outputTokens);
      }

    } catch (error) {
      console.error('Error generating perspectives:', error);
      setIsModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSelected = (selectedPerspectives) => {
    // Add all selected perspectives
    selectedPerspectives.forEach(p => {
      onAddPerspective({
        name: p.name,
        description: p.description || ''
      });
    });

    setIsModalOpen(false);
    setGeneratedPerspectives([]);
  };

  const handleSkip = () => {
    setIsModalOpen(false);
    setGeneratedPerspectives([]);
  };

  // Style configurations based on variant
  const containerStyles = {
    subtle: "mt-4 border-t border-gray-300 dark:border-gray-700 pt-3",
    terminal: "mt-3 border-t border-green-500/20 pt-3",
    hybrid: "mt-4 border-t border-gray-300 dark:border-green-500/20 pt-3",
  };

  const buttonStyles = {
    subtle: {
      enabled: 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
      disabled: 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800',
    },
    terminal: {
      enabled: 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400',
      disabled: 'border-green-500/20 bg-black/20',
    },
    hybrid: {
      enabled: 'border-green-600 dark:border-green-500/50 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20',
      disabled: 'border-gray-300 dark:border-green-500/20 bg-gray-100 dark:bg-black/20',
    },
  };

  const textStyles = {
    subtle: "text-gray-800 dark:text-gray-200",
    terminal: "text-green-400",
    hybrid: "text-gray-800 dark:text-green-400",
  };

  const hintStyles = {
    subtle: "text-gray-500 dark:text-gray-400",
    terminal: "text-green-500/60",
    hybrid: "text-gray-500 dark:text-green-500/60",
  };

  const currentButtonStyle = buttonStyles[variant] || buttonStyles.subtle;

  return (
    <>
      <div className={containerStyles[variant] || containerStyles.subtle}>
        {/* Generate Button */}
        <button
          onClick={handleGeneratePerspectives}
          disabled={isDisabled}
          className={`
            w-full p-3 rounded-lg border transition-colors text-left
            ${!isDisabled
              ? `${currentButtonStyle.enabled} cursor-pointer`
              : `${currentButtonStyle.disabled} cursor-not-allowed opacity-50`
            }
          `}
        >
          <div className="flex items-center justify-between">
            <span className={`font-medium ${textStyles[variant] || textStyles.subtle}`}>
              Generate Perspectives
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          {!hasMessages && !disabled && (
            <p className={`text-xs mt-1 ${hintStyles[variant] || hintStyles.subtle}`}>
              Start a conversation to generate perspectives
            </p>
          )}
        </button>
      </div>

      {/* Suggestions Modal - without existing advisors */}
      <AdvisorSuggestionsModal
        isOpen={isModalOpen}
        suggestions={generatedPerspectives}
        existingAdvisors={[]} // Don't show existing advisors section
        onAddSelected={handleAddSelected}
        onRegenerate={handleGeneratePerspectives}
        onSkip={handleSkip}
        isRegenerating={isGenerating}
        hideSkipButton={true} // Hide "Start Without" button
        generatingText="Generating..." // Show "Generating..." instead of "Regenerating..."
        onEditAdvisor={onEditAdvisor}
      />
    </>
  );
}

export default PerspectiveGenerator;

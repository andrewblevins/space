import { useState, useEffect, useRef } from 'react';
import AdvisorSuggestionsModal from './AdvisorSuggestionsModal';
import { formatMessagesAsContext } from '../utils/perspectiveGeneration';

// Shared color theme configurations
const colorThemes = {
  green: { border: 'border-term-600/20', borderEnabled: 'border-term-600/50', bg: 'bg-term-500/10', hoverBg: 'hover:bg-term-500/20', hoverBorder: 'hover:border-term-500', text: 'text-term-400', textDim: 'text-term-500/60' },
  mahogany: { border: 'border-rose-900/30', borderEnabled: 'border-rose-700/50', bg: 'bg-rose-900/20', hoverBg: 'hover:bg-rose-900/30', hoverBorder: 'hover:border-rose-600', text: 'text-rose-300', textDim: 'text-rose-400/60' },
  burgundy: { border: 'border-red-900/30', borderEnabled: 'border-red-800/50', bg: 'bg-red-900/20', hoverBg: 'hover:bg-red-900/30', hoverBorder: 'hover:border-red-700', text: 'text-red-300', textDim: 'text-red-400/60' },
  amber: { border: 'border-amber-500/20', borderEnabled: 'border-amber-500/50', bg: 'bg-amber-500/10', hoverBg: 'hover:bg-amber-500/20', hoverBorder: 'hover:border-amber-400', text: 'text-amber-400', textDim: 'text-amber-500/60' },
  cyan: { border: 'border-cyan-500/20', borderEnabled: 'border-cyan-500/50', bg: 'bg-cyan-500/10', hoverBg: 'hover:bg-cyan-500/20', hoverBorder: 'hover:border-cyan-400', text: 'text-cyan-400', textDim: 'text-cyan-500/60' },
  violet: { border: 'border-violet-500/20', borderEnabled: 'border-violet-500/50', bg: 'bg-violet-500/10', hoverBg: 'hover:bg-violet-500/20', hoverBorder: 'hover:border-violet-400', text: 'text-violet-400', textDim: 'text-violet-500/60' },
  copper: { border: 'border-term-700/20', borderEnabled: 'border-term-600/50', bg: 'bg-term-700/10', hoverBg: 'hover:bg-term-700/20', hoverBorder: 'hover:border-term-500', text: 'text-term-300', textDim: 'text-term-400/60' },
  slate: { border: 'border-slate-500/20', borderEnabled: 'border-slate-500/50', bg: 'bg-slate-500/10', hoverBg: 'hover:bg-slate-500/20', hoverBorder: 'hover:border-slate-400', text: 'text-slate-300', textDim: 'text-slate-400/60' },
};

/**
 * Component for generating perspective suggestions in a modal
 * @param {object} props
 * @param {Array} props.messages - Conversation messages for context
 * @param {string} props.currentInput - Current text in the input field (for context when no messages)
 * @param {Array} props.existingAdvisors - Currently saved advisors
 * @param {Function} props.onAddPerspective - Callback when adding perspectives
 * @param {Function} props.trackUsage - Usage tracking function
 * @param {Function} props.onEditAdvisor - Callback when editing an advisor
 * @param {boolean} props.disabled - Whether the generator button should be disabled
 * @param {'subtle' | 'terminal' | 'hybrid'} [props.variant='subtle'] - Style variant
 * @param {string} [props.colorTheme='green'] - Color theme
 */
export function PerspectiveGenerator({
  messages,
  currentInput = '',
  existingAdvisors = [],
  onAddPerspective,
  trackUsage,
  onEditAdvisor,
  disabled = false,
  variant = 'subtle',
  colorTheme = 'copper'
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedPerspectives, setGeneratedPerspectives] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState({
    isStreaming: false,
    count: 0,
    total: 8
  });

  // Use refs to always have access to the latest values (prevents stale closure issues)
  const messagesRef = useRef(messages);
  const currentInputRef = useRef(currentInput);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    currentInputRef.current = currentInput;
  }, [currentInput]);

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

  const isDisabled = disabled;

  const handleGeneratePerspectives = async () => {
    if (isDisabled) return;

    // Open modal and start generating
    setIsModalOpen(true);
    setIsGenerating(true);
    setStreamingStatus({ isStreaming: true, count: 0, total: 8 });

    try {
      // CRITICAL: Use messagesRef.current to get the LATEST messages at call time
      // This prevents stale closure issues when switching sessions
      const currentMessages = messagesRef.current;

      // Debug logging
      const userAssistantMessages = currentMessages.filter(m => m.type === 'user' || m.type === 'assistant');
      const inputText = currentInputRef.current;
      console.log('🎯 Generate Perspectives called with:', {
        totalMessages: currentMessages.length,
        userAssistantMessages: userAssistantMessages.length,
        currentInput: inputText?.substring(0, 50) + (inputText?.length > 50 ? '...' : ''),
        firstUserMessage: userAssistantMessages[0]?.content?.substring(0, 50) + '...',
        lastMessage: userAssistantMessages[userAssistantMessages.length - 1]?.content?.substring(0, 50) + '...'
      });

      // Format recent messages as context, or use current input if no messages yet
      let context = formatMessagesAsContext(currentMessages);
      if (!context && inputText && inputText.trim()) {
        // Use the current input text as context when there are no messages
        context = `User: ${inputText.trim()}`;
      }
      const existingNames = existingAdvisors.map(a => a.name);

      // Import streaming function and color utility
      const { generatePerspectivesStream } = await import('../utils/perspectiveGeneration');
      const { getNextAvailableColor } = await import('../lib/advisorColors');

      const assignedColors = existingAdvisors.map(a => a.color).filter(Boolean);

      // Generate perspectives with streaming
      const perspectives = await generatePerspectivesStream(
        context,
        existingNames,
        'conversation',
        (partialPerspectives) => {
          // Streaming callback - assign IDs and update
          const perspectivesWithIds = partialPerspectives.map((p, idx) => {
            const newColor = getNextAvailableColor([...assignedColors].slice(0, idx));
            return {
              ...p,
              id: p.id || `${Date.now()}-${idx}`,
              color: newColor,
              active: false
            };
          });

          setGeneratedPerspectives(perspectivesWithIds);
          setStreamingStatus({
            isStreaming: true,
            count: perspectivesWithIds.length,
            total: 8
          });
        }
      );

      // Add unique IDs to final complete perspectives
      const perspectivesWithIds = perspectives.map((p, idx) => ({
        ...p,
        id: `${Date.now()}-${idx}`
      }));

      setGeneratedPerspectives(perspectivesWithIds);
      setStreamingStatus({ isStreaming: false, count: 8, total: 8 });

      // Track usage if handler provided (estimate tokens)
      if (trackUsage) {
        const inputTokens = Math.ceil((500 + context.length) / 4);
        const outputTokens = Math.ceil(JSON.stringify(perspectives).length / 4);
        trackUsage('claude', inputTokens, outputTokens);
      }

    } catch (error) {
      console.error('Error generating perspectives:', error);
      setStreamingStatus({ isStreaming: false, count: 0, total: 8 });
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

  const ct = colorThemes[colorTheme] || colorThemes.green;

  // Style configurations based on variant
  const containerStyles = {
    subtle: "mt-4 border-t border-gray-300 dark:border-stone-700 pt-3",
    terminal: `mt-3 border-t ${ct.border} pt-3`,
    hybrid: `mt-4 border-t border-gray-300 dark:${ct.border} pt-3`,
  };

  const buttonStyles = {
    subtle: {
      enabled: 'border-term-700 dark:border-term-600 bg-term-50 dark:bg-term-950/20 hover:bg-term-100 dark:hover:bg-term-950/30',
      disabled: 'border-gray-300 dark:border-stone-700 bg-gray-100 dark:bg-stone-800',
    },
    terminal: {
      enabled: `${ct.borderEnabled} ${ct.bg} ${ct.hoverBg} ${ct.hoverBorder}`,
      disabled: `${ct.border} bg-black/20`,
    },
    hybrid: {
      enabled: `border-term-700 dark:${ct.borderEnabled} bg-term-50 dark:${ct.bg} hover:bg-term-100 dark:${ct.hoverBg}`,
      disabled: `border-gray-300 dark:${ct.border} bg-gray-100 dark:bg-black/20`,
    },
  };

  const textStyles = {
    subtle: "text-gray-800 dark:text-term-100",
    terminal: ct.text,
    hybrid: `text-gray-800 dark:${ct.text}`,
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
              Suggest Perspectives
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-term-600 dark:text-term-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
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
        streamingStatus={streamingStatus}
      />
    </>
  );
}

export default PerspectiveGenerator;

import { memo } from "react";
import { AdvisorResponseCard } from './AdvisorResponseCard';
import ThinkingBlock from '../ThinkingBlock';

/**
 * Grid layout component for parallel advisor responses
 * Displays advisor cards in a responsive multi-column grid
 *
 * @param {object} props
 * @param {object} props.message - The parallel_advisor_response message object
 * @param {Array} props.advisors - Array of all advisor configurations
 * @param {Function} props.onAssertionsClick - Callback for assertions button
 * @param {Array} props.messages - All messages (for assertions context)
 * @param {Function} props.getSystemPrompt - System prompt generator
 */
export const ParallelAdvisorGrid = memo(({
  message,
  advisors,
  onAssertionsClick,
  messages,
  getSystemPrompt
}) => {
  // Sort advisor responses by the order they appear in the advisors list
  const sortedAdvisorEntries = Object.entries(message.advisorResponses).sort((a, b) => {
    const [, dataA] = a;
    const [, dataB] = b;

    const indexA = advisors.findIndex(adv => adv.name === dataA.name);
    const indexB = advisors.findIndex(adv => adv.name === dataB.name);

    // If not found, put at end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  // Dynamically determine grid columns based on number of advisors
  const advisorCount = sortedAdvisorEntries.length;
  const getGridClasses = () => {
    if (advisorCount === 1) {
      // Single advisor: full width on all screen sizes
      return "grid grid-cols-1 gap-4 items-start";
    } else if (advisorCount === 2) {
      // Two advisors: stack on mobile, side-by-side on medium+
      return "grid grid-cols-1 md:grid-cols-2 gap-4 items-start";
    } else {
      // Three or more advisors: stack on mobile, 2 cols on medium, 3 cols on large
      return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start";
    }
  };

  return (
    <div>
      {/* Global streaming indicator - only show when not all completed */}
      {!message.allCompleted && (
        <div className="mb-3 text-sm text-green-600 dark:text-green-400 italic">
          ⚡ Parallel streaming in progress...
        </div>
      )}

      {/* Dynamic responsive grid layout */}
      <div className={getGridClasses()}>
        {sortedAdvisorEntries.map(([advisorId, advisorData]) => {
          // Create advisor object compatible with AdvisorResponseCard
          const advisorForCard = {
            id: advisorId,
            name: advisorData.name,
            response: advisorData.content,
            timestamp: message.timestamp,
            isStreaming: !advisorData.completed
          };

          return (
            <div key={advisorId} className="flex flex-col">
              {/* Thinking block if present */}
              {advisorData.thinking && <ThinkingBlock content={advisorData.thinking} />}

              {/* Advisor card */}
              <AdvisorResponseCard
                advisor={advisorForCard}
                allAdvisors={advisors}
                onAssertionsClick={(advisorData) => onAssertionsClick(advisorData, messages, getSystemPrompt)}
                compact={true}
                totalAdvisorCount={advisorCount}
              />

              {/* Error indicator if present */}
              {advisorData.error && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400 italic">
                  ⚠ Error with this advisor
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ParallelAdvisorGrid.displayName = 'ParallelAdvisorGrid';

export default ParallelAdvisorGrid;

import React, { memo } from 'react';
import { MemoizedMarkdownMessage } from './MemoizedMarkdownMessage';
import { AdvisorResponseCard } from './AdvisorResponseCard';
import { ParallelAdvisorGrid } from './ParallelAdvisorGrid';
import ThinkingBlock from '../ThinkingBlock';
// DEPRECATED: DebateBlock no longer used after High Council removal
// import DebateBlock from '../DebateBlock';

/**
 * Individual message renderer component with React.memo optimization
 * This prevents re-rendering of unchanged messages during streaming
 */
const MessageRenderer = memo(({
  msg,
  idx,
  advisors,
  paragraphSpacing,
  onAssertionsClick,
  messages,
  getSystemPrompt
}) => {
  // Create stable key for this message
  const messageKey = msg.timestamp ? `${msg.timestamp}-${idx}` : `${idx}-${msg.content?.slice(0, 20) || 'empty'}`;
  
  const getMessageClassName = (type) => {
    switch (type) {
      case 'user':
        return 'text-gray-900 dark:text-gray-100 whitespace-pre-wrap border-l-4 border-gray-300 dark:border-gray-600 pl-4';
      case 'assistant':
        return 'text-gray-800 dark:text-gray-200';
      case 'system':
        return 'text-gray-800 dark:text-gray-200';
      case 'debug':
        return 'text-amber-600 dark:text-amber-400 whitespace-pre-wrap';
      default:
        return 'text-green-600 dark:text-green-400 whitespace-pre-wrap';
    }
  };

  const renderMessageContent = () => {
    switch (msg.type) {
      case 'system':
        return (
          <MemoizedMarkdownMessage 
            content={msg.content} 
            advisors={advisors} 
            paragraphSpacing={paragraphSpacing} 
          />
        );

      case 'advisor_json':
        // Dynamically determine grid columns based on number of advisors
        const advisorCount = msg.parsedAdvisors.advisors.length;
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
            {msg.thinking && <ThinkingBlock content={msg.thinking} />}
            {msg.isStreaming && (
              <div className="mb-2 text-sm text-green-600 dark:text-green-400 italic">
                ⚡ Streaming advisor responses...
              </div>
            )}
            <div className={getGridClasses()}>
              {msg.parsedAdvisors.advisors.map((advisor, advisorIdx) => (
                <AdvisorResponseCard
                  key={`${advisor.id || advisor.name}-${advisorIdx}`}
                  advisor={advisor}
                  allAdvisors={advisors}
                  onAssertionsClick={(advisorData) => onAssertionsClick(advisorData, messages, getSystemPrompt)}
                  compact={true}
                  totalAdvisorCount={advisorCount}
                />
              ))}
            </div>
            {/* Show synthesis if it exists (for council mode or other cases) */}
            {msg.parsedAdvisors.synthesis && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Synthesis</h4>
                <MemoizedMarkdownMessage 
                  content={msg.parsedAdvisors.synthesis} 
                  advisors={advisors} 
                  paragraphSpacing={paragraphSpacing} 
                />
              </div>
            )}
          </div>
        );

      case 'parallel_advisor_response':
        return (
          <ParallelAdvisorGrid
            message={msg}
            advisors={advisors}
            onAssertionsClick={onAssertionsClick}
            messages={messages}
            getSystemPrompt={getSystemPrompt}
          />
        );

      case 'assistant':
        // DEPRECATED: High Council debate processing removed
        // Just render as normal assistant message
        return (
          <div>
            {msg.thinking && <ThinkingBlock content={msg.thinking} />}
            {msg.isJsonStreaming && (
              <div className="mb-2 text-sm text-blue-600 dark:text-blue-400 italic">
                ⚡ Streaming advisor responses...
              </div>
            )}
            <MemoizedMarkdownMessage
              content={msg.content}
              advisors={advisors}
              paragraphSpacing={paragraphSpacing}
            />
          </div>
        );

      default:
        return msg.content;
    }
  };

  return (
    <div
      key={messageKey}
      id={`msg-${idx}`}
      className={`mb-4 break-words text-lg ${getMessageClassName(msg.type)}`}
    >
      {renderMessageContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Simple reference check - if props are identical objects, skip render
  return prevProps.msg === nextProps.msg && 
         prevProps.paragraphSpacing === nextProps.paragraphSpacing;
});

MessageRenderer.displayName = 'MessageRenderer';

export default MessageRenderer;
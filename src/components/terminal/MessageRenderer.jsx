import React, { memo } from 'react';
import { MemoizedMarkdownMessage } from './MemoizedMarkdownMessage';
import { AdvisorResponseCard } from './AdvisorResponseCard';
import ThinkingBlock from '../ThinkingBlock';
import DebateBlock from '../DebateBlock';

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
  processCouncilDebates,
  messages,
  getSystemPrompt
}) => {
  // Create stable key for this message
  const messageKey = msg.timestamp ? `${msg.timestamp}-${idx}` : `${idx}-${msg.content?.slice(0, 20) || 'empty'}`;
  
  const getMessageClassName = (type) => {
    switch (type) {
      case 'user':
        return 'text-green-600 dark:text-green-400 whitespace-pre-wrap';
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
        return (
          <div>
            {msg.thinking && <ThinkingBlock content={msg.thinking} />}
            {msg.isStreaming && (
              <div className="mb-2 text-sm text-green-600 dark:text-green-400 italic">
                ⚡ Streaming advisor responses...
              </div>
            )}
            {msg.parsedAdvisors.advisors.map((advisor, advisorIdx) => (
              <AdvisorResponseCard
                key={`${advisor.id || advisor.name}-${advisorIdx}`}
                advisor={advisor}
                allAdvisors={advisors}
                onAssertionsClick={(advisorData) => onAssertionsClick(advisorData, messages, getSystemPrompt)}
              />
            ))}
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
          <div>
            {!msg.allCompleted && (
              <div className="mb-2 text-sm text-green-600 dark:text-green-400 italic">
                ⚡ Parallel streaming in progress...
              </div>
            )}
            {Object.entries(msg.advisorResponses).map(([advisorId, advisorData]) => {
              // Create advisor object compatible with AdvisorResponseCard
              const advisorForCard = {
                id: advisorId,
                name: advisorData.name,
                response: advisorData.content,
                timestamp: msg.timestamp
              };

              return (
                <div key={advisorId}>
                  {advisorData.thinking && <ThinkingBlock content={advisorData.thinking} />}
                  <AdvisorResponseCard
                    advisor={advisorForCard}
                    allAdvisors={advisors}
                    onAssertionsClick={(advisorData) => onAssertionsClick(advisorData, messages, getSystemPrompt)}
                  />
                  {advisorData.error && (
                    <div className="mb-2 text-sm text-red-600 dark:text-red-400 italic">
                      ⚠ Error with this advisor
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'assistant':
        const { processedContent, debates } = processCouncilDebates(msg.content);
        return (
          <div>
            {msg.thinking && <ThinkingBlock content={msg.thinking} />}
            {msg.isJsonStreaming && (
              <div className="mb-2 text-sm text-blue-600 dark:text-blue-400 italic">
                ⚡ Streaming advisor responses...
              </div>
            )}
            {debates.map((debate, debateIdx) => (
              <DebateBlock 
                key={debateIdx} 
                content={debate} 
                advisors={advisors} 
                paragraphSpacing={paragraphSpacing} 
              />
            ))}
            <MemoizedMarkdownMessage 
              content={processedContent.replace(/__DEBATE_PLACEHOLDER_\d+__/g, '')} 
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
      className={`mb-4 break-words ${getMessageClassName(msg.type)}`}
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
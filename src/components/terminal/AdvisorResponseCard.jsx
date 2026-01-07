import { memo, useState } from "react";
import ReactMarkdown from 'react-markdown';

/**
 * Component to render individual advisor responses from JSON format with assertion button
 * @param {object} props
 * @param {object} props.advisor - Single advisor response object
 * @param {Array} props.allAdvisors - Array of all advisor configurations for color mapping
 * @param {Function} props.onAssertionsClick - Callback when assertions button is clicked
 * @param {boolean} props.compact - Use compact styling for grid layout (default: false)
 * @param {number} props.totalAdvisorCount - Total number of advisors in current response (default: undefined)
 * @param {Array} props.allAdvisorsInMessage - Array of all advisor objects from the same message (for fullscreen modal)
 * @param {Function} props.onCardClick - Callback when card is clicked (takes advisor index)
 * @param {number} props.cardIndex - Index of this card in the message
 */
export const AdvisorResponseCard = memo(({ advisor, allAdvisors = [], onAssertionsClick, compact = false, totalAdvisorCount, allAdvisorsInMessage = [], onCardClick, cardIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find advisor configuration for color
  const advisorConfig = allAdvisors.find(a => 
    a.name.toLowerCase() === advisor.name.toLowerCase()
  );
  const colorClass = advisorConfig?.color || 'bg-gray-500';
  
  // Preprocess response content for better streaming display
  const processResponseContent = (content) => {
    if (!content) return '';
    
    // Handle streaming content that might be incomplete
    let processed = content;
    
    // Ensure proper paragraph breaks for streaming content
    // ReactMarkdown needs proper markdown formatting, so ensure double newlines are preserved
    processed = processed.replace(/\n\n+/g, '\n\n');
    
    // No ellipsis added - let content stream naturally
    return processed;
  };

  // Custom streaming-aware renderer for better real-time formatting
  const StreamingMarkdownRenderer = ({ content }) => {
    // Pre-process content to ensure proper markdown formatting during streaming
    const processedContent = processResponseContent(content);
    
    // Split content by double newlines to create paragraphs
    const paragraphs = processedContent.split(/\n\n+/).filter(p => p.trim());
    
    return (
      <div className="text-left font-serif w-full">
        {paragraphs.map((paragraph, index) => (
          <ReactMarkdown
            key={index}
            className="mb-3"
            components={{
              p: ({ children }) => <p className="font-serif w-full text-gray-800 dark:text-term-100 leading-relaxed">{children}</p>,
              em: ({ children }) => <em className="italic">{children}</em>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              code: ({ node, inline, className, children, ...props }) => {
                return inline ? (
                  <code className="text-term-600 dark:text-term-400 font-mono bg-stone-200 dark:bg-stone-900 px-1 rounded" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-stone-200 dark:bg-stone-900 p-4 rounded-md my-2 overflow-x-auto whitespace-pre-wrap break-all w-full">
                    <code className="font-mono block text-gray-800 dark:text-term-100" {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {paragraph}
          </ReactMarkdown>
        ))}
      </div>
    );
  };

  // Truncation logic for collapsible cards
  const TRUNCATE_THRESHOLD = 250; // characters
  // Only show toggle if response is long enough AND there are multiple advisors
  // When there's a single advisor, always show full content (no truncation)
  const shouldShowToggle = totalAdvisorCount !== 1 && 
                          advisor.response && 
                          advisor.response.length > TRUNCATE_THRESHOLD;

  // Determine display content based on expand state
  const getDisplayContent = () => {
    if (!shouldShowToggle) {
      return advisor.response; // Short responses show in full
    }

    if (isExpanded) {
      return advisor.response; // Expanded state
    }

    // Collapsed state - truncate to ~3 lines
    // Find first 2-3 sentence boundaries within 250 chars
    const sentences = advisor.response.match(/[^.!?]+[.!?]+/g) || [];
    let preview = '';
    for (const sentence of sentences) {
      if ((preview + sentence).length > TRUNCATE_THRESHOLD) break;
      preview += sentence;
    }

    // Fallback to character limit if no sentence boundaries found
    return preview || advisor.response.slice(0, TRUNCATE_THRESHOLD) + '...';
  };

  const displayContent = getDisplayContent();

  const handleAssertionsClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking Assert button
    if (onAssertionsClick) {
      onAssertionsClick(advisor);
    }
  };

  const handleCardClick = () => {
    // Only open modal if there are multiple advisors and callback is provided
    if (allAdvisorsInMessage.length > 1 && onCardClick && cardIndex !== undefined) {
      onCardClick(cardIndex);
    }
  };

  // Determine if card should be clickable
  const isClickable = allAdvisorsInMessage.length > 1 && onCardClick && cardIndex !== undefined;

  // Determine styling based on compact mode
  const cardClasses = compact
    ? `border border-gray-300 dark:border-stone-700 rounded-lg p-3 bg-white dark:bg-stone-900 h-full transition-shadow ${isClickable ? 'hover:shadow-lg cursor-pointer' : 'hover:shadow-md'}`
    : `border border-gray-300 dark:border-stone-700 rounded-lg p-4 mb-4 bg-white dark:bg-stone-900 ${isClickable ? 'hover:shadow-lg cursor-pointer' : ''}`;

  const headerClasses = compact
    ? "flex items-center justify-between mb-2"
    : "flex items-center justify-between mb-3";

  const titleClasses = compact
    ? "font-bold font-serif text-base text-gray-800 dark:text-term-100 flex items-center"
    : "font-bold font-serif text-lg text-gray-800 dark:text-term-100 flex items-center";

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      {/* Header with advisor name and assertions button */}
      <div className={headerClasses}>
        <h3 className={titleClasses}>
          <span className={`w-2 h-2 rounded-full ${colorClass} mr-2`}></span>
          {advisor.name}
        </h3>
{/* Assert button temporarily disabled - may be replaced with Instruct feature
        <button
          onClick={handleAssertionsClick}
          className="flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          title="Add assertions for this response"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Assert
        </button>
*/}
      </div>

      {/* Response content */}
      <div className="text-gray-800 dark:text-term-100">
        <StreamingMarkdownRenderer content={displayContent} />
      </div>

      {/* Show more/less button */}
      {shouldShowToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking Show more/less
            setIsExpanded(!isExpanded);
          }}
          className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center transition-colors group"
          aria-label={isExpanded ? `Collapse response from ${advisor.name}` : `Expand response from ${advisor.name}`}
        >
          <span>{isExpanded ? 'Show less' : 'Show more'}</span>
          <svg
            className={`w-4 h-4 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default AdvisorResponseCard;
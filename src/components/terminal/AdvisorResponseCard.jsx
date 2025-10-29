import { memo } from "react";
import ReactMarkdown from 'react-markdown';

/**
 * Component to render individual advisor responses from JSON format with assertion button
 * @param {object} props
 * @param {object} props.advisor - Single advisor response object
 * @param {Array} props.allAdvisors - Array of all advisor configurations for color mapping
 * @param {Function} props.onAssertionsClick - Callback when assertions button is clicked
 * @param {boolean} props.compact - Use compact styling for grid layout (default: false)
 */
export const AdvisorResponseCard = memo(({ advisor, allAdvisors = [], onAssertionsClick, compact = false }) => {
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
              p: ({ children }) => <p className="font-serif w-full text-gray-800 dark:text-gray-200 leading-relaxed">{children}</p>,
              em: ({ children }) => <em className="italic">{children}</em>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              code: ({ node, inline, className, children, ...props }) => {
                return inline ? (
                  <code className="text-green-600 dark:text-green-400 font-mono bg-stone-200 dark:bg-gray-900 px-1 rounded" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-stone-200 dark:bg-gray-900 p-4 rounded-md my-2 overflow-x-auto whitespace-pre-wrap break-all w-full">
                    <code className="font-mono block text-gray-800 dark:text-gray-200" {...props}>
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

  const handleAssertionsClick = () => {
    if (onAssertionsClick) {
      onAssertionsClick(advisor);
    }
  };

  // Determine styling based on compact mode
  const cardClasses = compact
    ? "border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900 h-full hover:shadow-md transition-shadow"
    : "border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-900";

  const headerClasses = compact
    ? "flex items-center justify-between mb-2"
    : "flex items-center justify-between mb-3";

  const titleClasses = compact
    ? "font-bold font-serif text-base text-gray-800 dark:text-gray-200 flex items-center"
    : "font-bold font-serif text-lg text-gray-800 dark:text-gray-200 flex items-center";

  return (
    <div className={cardClasses}>
      {/* Header with advisor name and assertions button */}
      <div className={headerClasses}>
        <h3 className={titleClasses}>
          <span className={`w-2 h-2 rounded-full ${colorClass} mr-2`}></span>
          {advisor.name}
        </h3>
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
      </div>

      {/* Response content */}
      <div className="text-gray-800 dark:text-gray-200">
        <StreamingMarkdownRenderer content={advisor.response} />
      </div>

      {/* Metadata */}
      {advisor.timestamp && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {new Date(advisor.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
});

export default AdvisorResponseCard;
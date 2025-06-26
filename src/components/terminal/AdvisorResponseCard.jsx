import { memo } from "react";
import ReactMarkdown from 'react-markdown';

/**
 * Component to render individual advisor responses from JSON format with assertion button
 * @param {object} props
 * @param {object} props.advisor - Single advisor response object
 * @param {Array} props.allAdvisors - Array of all advisor configurations for color mapping
 * @param {Function} props.onAssertionsClick - Callback when assertions button is clicked
 */
export const AdvisorResponseCard = memo(({ advisor, allAdvisors = [], onAssertionsClick }) => {
  // Find advisor configuration for color
  const advisorConfig = allAdvisors.find(a => 
    a.name.toLowerCase() === advisor.name.toLowerCase()
  );
  const colorClass = advisorConfig?.color || 'bg-gray-500';

  const handleAssertionsClick = () => {
    if (onAssertionsClick) {
      onAssertionsClick(advisor);
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-900">
      {/* Header with advisor name and assertions button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold font-serif text-lg text-gray-800 dark:text-gray-200 flex items-center">
          <span className={`w-2 h-2 rounded-full ${colorClass} mr-3`}></span>
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
        <ReactMarkdown
          className="text-left font-serif w-full"
          components={{
            h1: ({ children }) => <h1 className="text-blue-600 dark:text-blue-400 font-bold font-serif">{children}</h1>,
            h2: ({ children }) => <h2 className="text-green-600 dark:text-green-400 font-bold font-serif">{children}</h2>,
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <pre className="bg-stone-200 dark:bg-gray-900 p-4 rounded-md my-2 overflow-x-auto whitespace-pre-wrap break-all w-full">
                  <code className={`${match ? `language-${match[1]}` : ''} font-mono block text-gray-800 dark:text-gray-200`} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="text-green-600 dark:text-green-400 font-mono bg-stone-200 dark:bg-gray-900 px-1 rounded" {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="font-serif w-full text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 w-full text-gray-800 dark:text-gray-200">{children}</ul>,
            li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
          }}
        >
          {advisor.response}
        </ReactMarkdown>
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
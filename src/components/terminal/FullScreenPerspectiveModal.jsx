import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Full-screen modal for viewing advisor perspectives with tab navigation
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Array} props.advisors - Array of advisor objects from the message
 * @param {number} props.selectedIndex - Index of the initially selected advisor
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onAssertionsClick - Callback when assertions button is clicked
 * @param {Array} props.allAdvisors - Array of all advisor configurations for color mapping
 */
export function FullScreenPerspectiveModal({
  isOpen,
  advisors = [],
  selectedIndex = 0,
  onClose,
  onAssertionsClick,
  allAdvisors = []
}) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const modalRef = useRef(null);
  const tabsRef = useRef(null);

  // Update current index when selectedIndex prop changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : advisors.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex((prev) => (prev < advisors.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, advisors.length, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || advisors.length === 0) return null;

  const currentAdvisor = advisors[currentIndex];
  
  // Find advisor configuration for color
  const advisorConfig = allAdvisors.find(a => 
    a.name.toLowerCase() === currentAdvisor.name.toLowerCase()
  );
  const colorClass = advisorConfig?.color || 'bg-gray-500';

  // Preprocess response content for better markdown display
  const processResponseContent = (content) => {
    if (!content) return '';
    return content.replace(/\n\n+/g, '\n\n');
  };

  // Custom markdown renderer
  const StreamingMarkdownRenderer = ({ content }) => {
    const processedContent = processResponseContent(content);
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
    if (onAssertionsClick && currentAdvisor) {
      onAssertionsClick(currentAdvisor);
    }
  };

  const handleTabClick = (index) => {
    setCurrentIndex(index);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 md:p-8"
      onClick={handleBackdropClick}
      ref={modalRef}
      tabIndex={-1}
    >
      <div
        className="w-full max-w-6xl h-full flex flex-col bg-amber-50 dark:bg-gray-900 rounded-lg shadow-2xl border border-green-600"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="flex flex-col border-b border-green-600">
          {/* Tabs */}
          <div 
            className="flex overflow-x-auto scrollbar-hide px-4 pt-4 gap-2"
            ref={tabsRef}
          >
            {advisors.map((advisor, index) => {
              const advisorConfigForTab = allAdvisors.find(a => 
                a.name.toLowerCase() === advisor.name.toLowerCase()
              );
              const tabColorClass = advisorConfigForTab?.color || 'bg-gray-500';
              const isActive = index === currentIndex;

              return (
                <button
                  key={index}
                  onClick={() => handleTabClick(index)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-green-600 dark:bg-green-700 text-white border-b-2 border-green-400'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  aria-label={`View perspective from ${advisor.name}`}
                >
                  <span className={`w-2 h-2 rounded-full ${tabColorClass}`}></span>
                  <span className="font-medium">{advisor.name}</span>
                </button>
              );
            })}
          </div>

          {/* Header bar with advisor info and actions */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
              <h3 className="text-green-600 dark:text-green-400 font-medium text-lg">
                {currentAdvisor.name}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Perspective {currentIndex + 1} of {advisors.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Assert button temporarily disabled - may be replaced with Instruct feature
              {onAssertionsClick && (
                <button
                  onClick={handleAssertionsClick}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  title="Add assertions for this response"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
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
              )}
              */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-green-400 transition-colors p-1"
                title="Close (Esc)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="text-gray-800 dark:text-gray-200">
            <StreamingMarkdownRenderer content={currentAdvisor.response || currentAdvisor.content || ''} />
          </div>
        </div>

        {/* Footer with navigation hints */}
        <div className="p-3 border-t border-green-600 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
          <span>Click tabs or use ← → arrow keys to switch perspectives</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default FullScreenPerspectiveModal;


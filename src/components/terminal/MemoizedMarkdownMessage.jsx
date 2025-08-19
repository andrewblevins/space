import { memo, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import { ADVISOR_COLORS } from '../../lib/advisorColors';
import { performanceLogger } from '../../utils/performanceLogger';

/**
 * Render markdown content using ReactMarkdown with advisor name color-coding.
 * OPTIMIZED: Enhanced memoization and reduced re-computation
 * @param {object} props
 * @param {string} props.content
 * @param {Array} props.advisors - Array of advisor objects with color information
 * @param {number} props.paragraphSpacing - Spacing between paragraphs (default: 0.25)
 */
export const MemoizedMarkdownMessage = memo(({ content, advisors = [], paragraphSpacing = 0.25 }) => {
  const renderKey = performanceLogger.startRender('MemoizedMarkdownMessage', advisors.length);
  
  // OPTIMIZATION: Memoize expensive computations
  const hasAdvisorMarkers = useMemo(() => content.includes('[ADVISOR:'), [content]);
  const processedContent = useMemo(() => content.replace(/\n\n+/g, '\n\n'), [content]);
  
  // Memoize advisor name lookup map for better performance
  const advisorMap = useMemo(() => {
    const map = new Map();
    advisors.forEach(advisor => {
      map.set(advisor.name.toLowerCase(), advisor);
    });
    return map;
  }, [advisors]);
  
  // Parse and render advisor names with colors - OPTIMIZED
  const processContent = useMemo(() => (text) => {
    const parts = text.split(/(\[ADVISOR:\s*[^\]]+\])/);
    let fallbackColorIndex = 0;
    
    return parts.map((part, index) => {
      const advisorMatch = part.match(/\[ADVISOR:\s*([^\]]+)\]/);
      if (advisorMatch) {
        const advisorName = advisorMatch[1].trim();
        // OPTIMIZED: Use memoized map lookup instead of array.find()
        const advisor = advisorMap.get(advisorName.toLowerCase());
        const colorClass = advisor?.color || ADVISOR_COLORS[fallbackColorIndex % ADVISOR_COLORS.length];
        fallbackColorIndex++;
        return (
          <h3 key={`advisor-${index}-${advisorName}`} className="font-bold font-serif text-lg mb-3 mt-6 text-gray-800 dark:text-gray-200 flex items-center">
            <span className={`w-2 h-2 rounded-full ${colorClass} mr-3`}></span>
            {advisorName}
          </h3>
        );
      }
      return part;
    }).filter(part => typeof part === 'string' ? part.trim() : true);
  }, [advisorMap]); // Memoize this function too
  
  // Memoize ReactMarkdown components to prevent recreation on every render
  const markdownComponents = useMemo(() => ({
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
    p: ({ children }) => <p className="font-serif w-full text-gray-800 dark:text-gray-200" style={{ marginBottom: `${paragraphSpacing}rem`, lineHeight: '1.7' }}>{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 w-full text-gray-800 dark:text-gray-200" style={{ marginBottom: `${paragraphSpacing}rem` }}>{children}</ul>,
    li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
  }), [paragraphSpacing]);

  // If content has advisor markers, render with special processing
  if (hasAdvisorMarkers) {
    const processedParts = processContent(content);
    const result = (
      <div className="text-left font-serif w-full">
                {processedParts.map((part, index) => 
          typeof part === 'string' ? (
            <ReactMarkdown
              key={`md-${index}-${part.slice(0, 20)}`}
               className="text-left font-serif w-full"
               components={markdownComponents}
             >
               {part.replace(/\n\n+/g, '\n\n')}
             </ReactMarkdown>
          ) : part
        )}
      </div>
    );
    performanceLogger.endRender(renderKey, 'MemoizedMarkdownMessage');
    return result;
  }

  // Regular content without advisor markers - use paragraph spacing setting
  const result = (
    <ReactMarkdown
      className="text-left font-serif w-full"
      components={markdownComponents}
    >
      {processedContent}
    </ReactMarkdown>
  );
  
  performanceLogger.endRender(renderKey, 'MemoizedMarkdownMessage');
  return result;
}, (prevProps, nextProps) => {
  // OPTIMIZATION: Custom comparison function for better memoization
  return (
    prevProps.content === nextProps.content &&
    prevProps.paragraphSpacing === nextProps.paragraphSpacing &&
    prevProps.advisors.length === nextProps.advisors.length &&
    prevProps.advisors.every((advisor, i) => 
      advisor.name === nextProps.advisors[i]?.name &&
      advisor.color === nextProps.advisors[i]?.color
    )
  );
});

export default MemoizedMarkdownMessage;

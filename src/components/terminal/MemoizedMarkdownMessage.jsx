import { memo } from "react";
import ReactMarkdown from 'react-markdown';
import { ADVISOR_COLORS } from '../../lib/advisorColors';

/**
 * Render markdown content using ReactMarkdown with advisor name color-coding.
 * @param {object} props
 * @param {string} props.content
 * @param {Array} props.advisors - Array of advisor objects with color information
 */
export const MemoizedMarkdownMessage = memo(({ content, advisors = [] }) => {
  // Parse and render advisor names with colors
  const processContent = (text) => {
    const parts = text.split(/(\[ADVISOR:\s*[^\]]+\])/);
    let fallbackColorIndex = 0;
    
    return parts.map((part, index) => {
      const advisorMatch = part.match(/\[ADVISOR:\s*([^\]]+)\]/);
      if (advisorMatch) {
        const advisorName = advisorMatch[1].trim();
        // Look up advisor in advisors array to get their specific color
        const advisor = advisors.find(a => a.name.toLowerCase() === advisorName.toLowerCase());
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
  };

  // If content has advisor markers, render with special processing
  if (content.includes('[ADVISOR:')) {
    const processedParts = processContent(content);
    return (
      <div className="text-left font-serif w-full">
                {processedParts.map((part, index) => 
          typeof part === 'string' ? (
            <ReactMarkdown
              key={`md-${index}-${part.slice(0, 20)}`}
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
                 p: ({ children }) => <p className="font-serif w-full text-gray-800 dark:text-gray-200" style={{ marginBottom: '12px', lineHeight: '1.7' }}>{children}</p>,
                 ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 w-full text-gray-800 dark:text-gray-200">{children}</ul>,
                 li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
               }}
             >
               {part.replace(/\n\n+/g, '\n\n')}
             </ReactMarkdown>
          ) : part
        )}
      </div>
    );
  }

    // Regular content without advisor markers - reduce paragraph spacing
  console.log('🔍 Original content:', JSON.stringify(content));
  const processedContent = content.replace(/\n\n+/g, '\n\n'); // Keep paragraph breaks but will use tiny spacing
  console.log('🔍 Processed content:', JSON.stringify(processedContent));
  console.log('🔍 Double newlines found:', content.includes('\n\n'));
  
  return (
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
        p: ({ children }) => <p className="font-serif w-full text-gray-800 dark:text-gray-200" style={{ marginBottom: '12px', lineHeight: '1.5' }}>{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 w-full text-gray-800 dark:text-gray-200">{children}</ul>,
        li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
});

export default MemoizedMarkdownMessage;

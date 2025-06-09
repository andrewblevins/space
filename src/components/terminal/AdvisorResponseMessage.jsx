import { memo } from "react";
import ReactMarkdown from 'react-markdown';

/**
 * Colors for advisor names - cycling through different colors
 */
const ADVISOR_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-purple-600 dark:text-purple-400', 
  'text-emerald-600 dark:text-emerald-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-indigo-600 dark:text-indigo-400',
  'text-teal-600 dark:text-teal-400',
  'text-orange-600 dark:text-orange-400'
];

/**
 * Parse content with [ADVISOR: Name] delimiters for color-coded names
 */
const parseAdvisorContent = (content) => {
  // Split content by advisor markers, but keep the markers
  const parts = content.split(/(\[ADVISOR:\s*[^\]]+\])/);
  
  const sections = [];
  let currentAdvisor = null;
  let advisorIndex = 0;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this part is an advisor marker
    const advisorMatch = part.match(/\[ADVISOR:\s*([^\]]+)\]/);
    if (advisorMatch) {
      currentAdvisor = {
        name: advisorMatch[1].trim(),
        colorClass: ADVISOR_COLORS[advisorIndex % ADVISOR_COLORS.length],
        content: ''
      };
      advisorIndex++;
      sections.push(currentAdvisor);
    } else if (currentAdvisor && part.trim()) {
      // Add content to current advisor
      currentAdvisor.content += part;
    } else if (!currentAdvisor && part.trim()) {
      // Content without advisor marker - treat as general content
      sections.push({
        name: null,
        colorClass: null,
        content: part
      });
    }
  }
  
  return sections;
};

/**
 * Component to render advisor responses with color-coded names and fluid streaming
 * @param {object} props
 * @param {string} props.content - The response content with [ADVISOR: Name] markers
 * @param {number} props.paragraphSpacing - Spacing between paragraphs (default: 2)
 */
export const AdvisorResponseMessage = memo(({ content, paragraphSpacing = 2 }) => {
  // Parse the content into advisor sections
  const sections = parseAdvisorContent(content);
  
  // If no advisor markers found, render as markdown
  if (sections.length === 1 && !sections[0].name) {
        return (
      <div 
        className="markdown-content"
        style={{ '--paragraph-spacing': `${paragraphSpacing}rem` }}
      >
        <ReactMarkdown
          className="text-left font-serif w-full"
          components={{
          h1: ({ children }) => <h1 className="text-blue-600 dark:text-blue-400 font-bold font-serif">{children}</h1>,
          h2: ({ children }) => <h2 className="text-green-600 dark:text-green-400 font-bold font-serif">{children}</h2>,
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-stone-200 dark:bg-gray-900 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-all w-full" style={{ marginTop: '0', marginBottom: `${paragraphSpacing}rem` }}>
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
          p: ({ children }) => (
            <p className="whitespace-pre-wrap font-serif w-full text-gray-800 dark:text-gray-200">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul 
              className="list-disc pl-4 w-full text-gray-800 dark:text-gray-200"
              style={{ marginTop: '0', marginBottom: `${paragraphSpacing}rem` }}
            >
              {children}
            </ul>
          ),
          li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
        }}
              >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Render advisor sections with color-coded names
  return (
    <div className="text-left font-serif w-full">
      {sections.map((section, index) => (
        <div key={index} className={index > 0 ? 'mt-6' : ''}>
          {section.name && (
            <h3 className={`${section.colorClass} font-bold font-serif text-lg mb-3`}>
              {section.name}
            </h3>
          )}
          
          <div 
            className="text-gray-800 dark:text-gray-200 markdown-content"
            style={{ '--paragraph-spacing': `${paragraphSpacing}rem` }}
          >
            <ReactMarkdown
              className="text-left font-serif w-full"
              components={{
                h1: ({ children }) => <h1 className="text-blue-600 dark:text-blue-400 font-bold font-serif">{children}</h1>,
                h2: ({ children }) => <h2 className="text-green-600 dark:text-green-400 font-bold font-serif">{children}</h2>,
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <pre className="bg-stone-200 dark:bg-gray-900 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-all w-full" style={{ marginTop: '0', marginBottom: `${paragraphSpacing}rem` }}>
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
                p: ({ children }) => (
                  <p className="whitespace-pre-wrap font-serif w-full text-gray-800 dark:text-gray-200">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul 
                    className="list-disc pl-4 w-full text-gray-800 dark:text-gray-200"
                    style={{ marginTop: '0', marginBottom: `${paragraphSpacing}rem` }}
                  >
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
              }}
            >
              {section.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
});

export default AdvisorResponseMessage; 
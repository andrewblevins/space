import { memo } from "react";
import ReactMarkdown from 'react-markdown';

/**
 * Render markdown content using ReactMarkdown.
 * @param {object} props
 * @param {string} props.content
 */
export const MemoizedMarkdownMessage = memo(({ content }) => (
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
      p: ({ children }) => <p className="whitespace-pre-wrap font-serif mb-2 w-full text-gray-800 dark:text-gray-200">{children}</p>,
      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 w-full text-gray-800 dark:text-gray-200">{children}</ul>,
      li: ({ children }) => <li className="text-gray-800 dark:text-gray-200">{children}</li>,
    }}
  >
    {content}
  </ReactMarkdown>
));

export default MemoizedMarkdownMessage;

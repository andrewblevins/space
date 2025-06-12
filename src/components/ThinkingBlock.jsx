import React, { useState } from 'react';

const ThinkingBlock = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || content.trim() === '') return null;

  return (
    <div className="my-4 border border-blue-400/30 rounded-lg bg-blue-900/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center">
          <div className="w-5 h-5 mr-2 flex items-center justify-center">
            <svg 
              className={`w-3 h-3 text-blue-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <span className="text-blue-400 font-medium text-sm">
            Thinking
          </span>
        </div>
        <div className="text-xs text-blue-400/70">
          {isExpanded ? 'Hide' : 'Show'} reasoning
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="bg-blue-900/20 rounded p-3 text-sm text-blue-100 font-mono whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
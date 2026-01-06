import React, { useState, useRef, useEffect } from 'react';

/**
 * TouchInput component optimized for mobile devices
 * Features: Virtual keyboard optimization, touch-friendly sizing, auto-resize
 */
const TouchInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading, 
  placeholder 
}) => {
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120);
      textarea.style.height = newHeight + 'px';
    }
  }, [value]);

  // Handle virtual keyboard appearance
  useEffect(() => {
    const handleResize = () => {
      if (isFocused && textareaRef.current) {
        // Small delay to allow keyboard animation to complete
        setTimeout(() => {
          textareaRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300);
      }
    };

    if (isFocused) {
      window.addEventListener('resize', handleResize);
      // Also scroll into view when focused
      handleResize();
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [isFocused]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`
          w-full 
          min-h-[44px] 
          max-h-[120px] 
          font-sans 
          p-3 
          border 
          border-orange-700 
          focus:outline-none 
          focus:ring-2 
          focus:ring-orange-600 
          focus:border-transparent
          rounded-md 
          resize-none 
          bg-amber-50 
          text-gray-800 
          dark:bg-stone-900 
          dark:text-white 
          dark:border-orange-700 
          dark:focus:ring-orange-500
          placeholder:text-amber-600 dark:placeholder:text-orange-300
          text-base
          leading-relaxed
          ${isFocused ? 'shadow-lg' : ''}
          transition-shadow
          duration-200
        `}
        placeholder={placeholder}
        disabled={isLoading}
        autoComplete="off"
        autoCapitalize="sentences"
        autoCorrect="on"
        spellCheck="true"
        rows="1"
        // Mobile-specific attributes
        enterKeyHint="send"
        inputMode="text"
      />
      {isFocused && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      )}
    </div>
  );
};

export default TouchInput; 
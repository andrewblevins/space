import { useState, useRef, useEffect } from "react";
import SessionAutocomplete from "./SessionAutocomplete";

/**
 * Textarea that can be resized vertically by dragging the handle.
 * Now includes session autocomplete when user types @
 * @param {object} props
 * @param {string} props.value
 * @param {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} props.onChange
 * @param {(e: React.KeyboardEvent<HTMLTextAreaElement>) => void} props.onSubmit
 * @param {boolean} props.isLoading
 * @param {Array} props.sessions - Array of session objects for autocomplete
 * @param {(session: object) => void} props.onSessionSelect - Called when user selects a session from autocomplete
 */
export function ExpandingInput({ value, onChange, onSubmit, isLoading, sessions = [], onSessionSelect }) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSearch, setAutocompleteSearch] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [atPosition, setAtPosition] = useState(-1); // Track where the @ symbol is
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef(null);
  const fullscreenTextareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight (content height)
      const newHeight = Math.min(textareaRef.current.scrollHeight, 400); // Max 400px
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Detect @ symbol and manage autocomplete
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Call the original onChange
    onChange(e);
    
    // Check if user just typed @ or is in the middle of an @ reference
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      // Found @ followed by optional word characters at cursor position
      const searchTerm = atMatch[1]; // Text after @
      const atPos = cursorPos - atMatch[0].length; // Position of @ symbol
      
      setAtPosition(atPos);
      setAutocompleteSearch(searchTerm);
      setShowAutocomplete(true);
      
      // Calculate position for dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const textareaRect = textarea.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 300; // Max height from SessionAutocomplete
        
        // Check if there's enough space below the textarea
        const spaceBelow = viewportHeight - textareaRect.bottom;
        const spaceAbove = textareaRect.top;
        
        let top, showAbove;
        
        if (spaceBelow >= dropdownHeight + 10) {
          // Enough space below - show dropdown below textarea
          top = textareaRect.bottom + 5;
          showAbove = false;
        } else if (spaceAbove >= dropdownHeight + 10) {
          // Not enough space below but enough above - show dropdown above textarea
          top = textareaRect.top - dropdownHeight - 5;
          showAbove = true;
        } else {
          // Limited space both ways - choose the side with more space
          if (spaceAbove > spaceBelow) {
            top = Math.max(10, textareaRect.top - dropdownHeight - 5);
            showAbove = true;
          } else {
            top = textareaRect.bottom + 5;
            showAbove = false;
          }
        }
        
        setAutocompletePosition({
          top,
          left: textareaRect.left,
          showAbove
        });
      }
    } else {
      // No @ found at cursor, hide autocomplete
      setShowAutocomplete(false);
      setAtPosition(-1);
      setAutocompleteSearch('');
    }
  };

  const handleKeyDown = (e) => {
    // If autocomplete is open, let it handle navigation keys
    if (showAutocomplete && ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      // SessionAutocomplete will handle these keys
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setShowAutocomplete(false); // Close autocomplete on submit
      onSubmit(e);
    }
  };

  // Handle session selection from autocomplete
  const handleSessionSelect = (session) => {
    if (atPosition === -1 || !onSessionSelect) return;
    
    const title = session.title || `Session ${session.id}`;
    const beforeAt = value.slice(0, atPosition);
    const afterSearch = value.slice(atPosition + 1 + autocompleteSearch.length);
    const newValue = beforeAt + `@"${title}"` + afterSearch;
    
    // Create synthetic event to update the value
    const syntheticEvent = {
      target: { value: newValue }
    };
    onChange(syntheticEvent);
    
    // Store session for summary insertion
    onSessionSelect(session, title);
    
    setShowAutocomplete(false);
    setAtPosition(-1);
    setAutocompleteSearch('');
    
    // Focus back to textarea
    if (textareaRef.current) {
      const newCursorPos = beforeAt.length + title.length + 3; // +3 for @""
      setTimeout(() => {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }, 0);
    }
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAutocomplete(false);
    };
    
    if (showAutocomplete) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAutocomplete]);

  // Focus fullscreen textarea when modal opens
  useEffect(() => {
    if (isFullscreen && fullscreenTextareaRef.current) {
      fullscreenTextareaRef.current.focus();
    }
  }, [isFullscreen]);

  return (
    <>
      <div className="flex-1 relative">
        <div className="relative border border-orange-700 dark:border-orange-800/60 rounded-lg bg-white dark:bg-stone-900 shadow-sm">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className={`
              w-full
              min-h-[100px]
              max-h-[400px]
              font-sans
              text-base
              p-4
              pr-12
              border-none
              focus:outline-none
              rounded-lg
              resize-none
              bg-transparent text-gray-800 dark:text-white
              placeholder:text-amber-600 dark:placeholder:text-orange-300
              ${isLoading ? 'opacity-50' : ''}
            `}
            placeholder={isLoading ? 'Waiting for response...' : 'Type your message... (use @ to reference past sessions)'}
            disabled={isLoading}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="true"
            data-role="chat-input"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
          />

          {/* Fullscreen button - top right of textarea */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-orange-400 transition-colors z-10"
            title="Expand writing area"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      
      <SessionAutocomplete
        show={showAutocomplete}
        searchTerm={autocompleteSearch}
        sessions={sessions}
        onSelect={handleSessionSelect}
        onClose={() => setShowAutocomplete(false)}
        position={autocompletePosition}
      />
    </div>

    {/* Fullscreen writing modal */}
    {isFullscreen && (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
        onClick={() => setIsFullscreen(false)}
      >
        <div
          className="w-full max-w-4xl h-full flex flex-col bg-amber-50 dark:bg-stone-900 rounded-lg shadow-2xl border border-orange-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-orange-700">
            <h3 className="text-orange-600 dark:text-orange-400 font-medium">Focus Writing Mode</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsFullscreen(false);
                  onSubmit(e);
                }}
                disabled={isLoading || !value.trim()}
                className="px-4 py-2 bg-orange-700 text-white rounded hover:bg-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Send (⏎)
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-gray-400 hover:text-orange-400 transition-colors"
                title="Close (Esc)"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={fullscreenTextareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsFullscreen(false);
              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsFullscreen(false);
                onSubmit(e);
              }
            }}
            className="flex-1 w-full p-6 font-sans text-lg resize-none focus:outline-none bg-amber-50 text-gray-800 dark:bg-stone-900 dark:text-white placeholder:text-amber-600 dark:placeholder:text-orange-300"
            placeholder="Write your thoughts... (⌘/Ctrl+Enter to send, Esc to close)"
            disabled={isLoading}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="true"
          />

          {/* Footer info */}
          <div className="p-3 border-t border-orange-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
            <span>Use @ to reference past sessions</span>
            <span>{value.length} characters</span>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ExpandingInput;

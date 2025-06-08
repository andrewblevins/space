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
  const [height, setHeight] = useState('100px');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSearch, setAutocompleteSearch] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [atPosition, setAtPosition] = useState(-1); // Track where the @ symbol is
  const textareaRef = useRef(null);

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

  return (
    <div className="flex-1">
      <div
        className="w-full h-1 cursor-ns-resize bg-green-400/10 hover:bg-green-400/20 transition-colors"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = parseInt(height);

          const handleMouseMove = (moveEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newHeight = Math.min(400, Math.max(100, startHeight + deltaY));
            setHeight(`${newHeight}px`);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{ height }}
        className={`
          w-full
          min-h-[100px]
          max-h-[400px]
          font-serif
          p-4
          border
          border-green-600
          focus:outline-none
          rounded-md
          resize-none
          bg-amber-50 text-gray-800 dark:bg-black dark:text-green-400
          ${isLoading ? 'opacity-50' : ''}
        `}
        placeholder={isLoading ? 'Waiting for response...' : 'Type your message... (use @ to reference past sessions)'}
        disabled={isLoading}
        autoComplete="off"
        spellCheck="true"
        data-role="chat-input"
      />
      
      <SessionAutocomplete
        show={showAutocomplete}
        searchTerm={autocompleteSearch}
        sessions={sessions}
        onSelect={handleSessionSelect}
        onClose={() => setShowAutocomplete(false)}
        position={autocompletePosition}
      />
    </div>
  );
}

export default ExpandingInput;

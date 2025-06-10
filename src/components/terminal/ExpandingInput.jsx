import { useState, useRef, useEffect } from "react";
import SessionAutocomplete from "./SessionAutocomplete";

/**
 * Textarea that can be resized vertically by dragging the handle.
 * Now includes session autocomplete when user types @ and file upload support
 * @param {object} props
 * @param {string} props.value
 * @param {(e: React.ChangeEvent<HTMLTextAreaElement>) => void} props.onChange
 * @param {(e: React.KeyboardEvent<HTMLTextAreaElement>) => void} props.onSubmit
 * @param {boolean} props.isLoading
 * @param {Array} props.sessions - Array of session objects for autocomplete
 * @param {(session: object) => void} props.onSessionSelect - Called when user selects a session from autocomplete
 * @param {Array} props.attachedFiles - Currently attached files
 * @param {(files: FileList) => void} props.onFilesAttached - Called when files are attached
 * @param {(fileId: string) => void} props.onFileRemoved - Called when a file is removed
 */
export function ExpandingInput({ value, onChange, onSubmit, isLoading, sessions = [], onSessionSelect, attachedFiles = [], onFilesAttached, onFileRemoved }) {
  const [height, setHeight] = useState('130px');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSearch, setAutocompleteSearch] = useState('');
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [atPosition, setAtPosition] = useState(-1); // Track where the @ symbol is
  const [isManuallyResized, setIsManuallyResized] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-expand/shrink textarea based on content (only when not manually resized)
  useEffect(() => {
    if (textareaRef.current && !isManuallyResized) {
      const textarea = textareaRef.current;
      const currentHeight = parseInt(height);
      
      // Temporarily set height to auto to measure scroll height
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      // Restore current height
      textarea.style.height = height;
      
      // Calculate optimal height with padding
      const optimalHeight = Math.min(500, Math.max(130, scrollHeight + 8));
      
      // Update height if it's different from current
      if (optimalHeight !== currentHeight) {
        setHeight(`${optimalHeight}px`);
      }
    }
  }, [value, isManuallyResized]);

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
    
    // Cmd/Ctrl + Enter to submit
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setShowAutocomplete(false); // Close autocomplete on submit
      onSubmit(e);
    }
    // Regular Enter just adds new line (default behavior)
  };

  const handleSubmit = () => {
    setShowAutocomplete(false);
    onSubmit({ target: textareaRef.current });
    // Reset to default height and re-enable auto-resizing after sending message
    setHeight('130px');
    setIsManuallyResized(false);
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

  // Handle file attachment
  const handleFileAttachment = (e) => {
    const files = e.target.files;
    if (files && files.length > 0 && onFilesAttached) {
      onFilesAttached(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && onFilesAttached) {
      onFilesAttached(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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
          e.preventDefault();
          const startY = e.clientY;
          const startHeight = parseInt(height);

          const handleMouseMove = (moveEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newHeight = Math.min(500, Math.max(130, startHeight + deltaY));
            setHeight(`${newHeight}px`);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Mark as manually resized to disable auto-resize
            setIsManuallyResized(true);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
      {/* File attachments display */}
      {attachedFiles && attachedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-gray-800 border border-green-200 dark:border-gray-600 rounded-md text-sm">
              <span className="text-green-700 dark:text-green-400">
                {file.type?.startsWith('image/') ? '🖼️' : file.type?.includes('pdf') ? '📄' : '📎'} {file.name}
              </span>
              {onFileRemoved && (
                <button
                  onClick={() => onFileRemoved(file.id || index)}
                  className="text-green-600 hover:text-red-600 dark:text-green-400 dark:hover:text-red-400 transition-colors"
                  title="Remove file"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div 
        className="relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{ height }}
          className={`
            w-full
            min-h-[130px]
            max-h-[500px]
            font-serif
            p-4
            pr-32
            pb-12
            border
            border-green-600
            focus:outline-none
            rounded-md
            resize-none
            bg-amber-50 text-gray-800 dark:bg-black dark:text-green-400
            ${isLoading ? 'opacity-50' : ''}
          `}
          placeholder={isLoading ? 'Waiting for response...' : 'Type your message... (Enter for new line, drag files to attach)'}
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
        <button
          onClick={() => {
            if (!isLoading && value.trim()) {
              handleSubmit();
            }
          }}
          className={`
            absolute
            bottom-3
            right-3
            px-4
            py-2
            font-serif
            text-sm
            font-medium
            rounded-md
            border-2
            border-green-600
            bg-amber-50
            text-green-700
            hover:bg-green-50
            hover:border-green-700
            active:bg-green-100
            active:scale-95
            focus:outline-none
            focus:ring-2
            focus:ring-green-500
            transition-all
            duration-150
            dark:bg-black
            dark:text-green-400
            dark:hover:bg-gray-900
            dark:hover:border-green-500
            dark:active:bg-gray-800
          `}
        >
          {navigator.platform.includes('Mac') ? '⌘+Enter' : 'Ctrl+Enter'}
        </button>
        
        {/* File upload icon */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`
            absolute
            bottom-3
            right-28
            p-1
            text-green-600
            hover:text-green-700
            hover:bg-green-50
            disabled:opacity-50
            disabled:cursor-not-allowed
            rounded
            transition-colors
            dark:text-green-400
            dark:hover:text-green-300
            dark:hover:bg-gray-800
          `}
          title="Attach files (images, PDFs, documents)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.doc,.docx,.rtf,.csv,.json,.xml,.html"
          onChange={handleFileAttachment}
          className="hidden"
        />
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
  );
}

export default ExpandingInput;

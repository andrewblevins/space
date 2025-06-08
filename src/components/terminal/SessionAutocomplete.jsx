import React, { useState, useEffect, useRef } from 'react';

/**
 * Autocomplete dropdown for session references when user types @
 * @param {object} props
 * @param {boolean} props.show - Whether to show the dropdown
 * @param {string} props.searchTerm - The text after @ to filter by
 * @param {Array} props.sessions - Array of session objects with id, title, messageCount, timestamp
 * @param {(session: object) => void} props.onSelect - Called when user selects a session
 * @param {() => void} props.onClose - Called when dropdown should close
 * @param {object} props.position - Position object with top, left, showAbove for absolute positioning
 */
export function SessionAutocomplete({ 
  show, 
  searchTerm, 
  sessions, 
  onSelect, 
  onClose, 
  position = { top: 0, left: 0, showAbove: false } 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    const title = session.title || `Session ${session.id}`;
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 8); // Limit to 8 results for performance

  // Reset selected index when filtered sessions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, sessions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!show) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSessions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSessions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredSessions[selectedIndex]) {
            onSelect(filteredSessions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, selectedIndex, filteredSessions, onSelect, onClose]);

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const sessionTime = new Date(timestamp);
    const diffMs = now - sessionTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return sessionTime.toLocaleDateString();
  };

  if (!show || filteredSessions.length === 0) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className={`fixed z-50 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-md w-80 ${
        position.showAbove ? 'shadow-2xl' : 'shadow-lg'
      }`}
      style={{
        top: position.top,
        left: position.left,
        maxHeight: position.showAbove 
          ? Math.min(300, position.top - 10) + 'px'  // Limit height when above to avoid going off-screen
          : '300px',
        overflowY: 'auto'
      }}
    >
      <div className="p-2">
        {position.showAbove && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
          {searchTerm ? `Sessions matching "${searchTerm}"` : 'Recent sessions'}
        </div>
        {filteredSessions.map((session, index) => {
          const title = session.title || `Session ${session.id}`;
          const isSelected = index === selectedIndex;
          
          return (
            <div
              key={session.id}
              className={`
                p-3 rounded-md cursor-pointer transition-colors border
                ${isSelected 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600' 
                  : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
              onClick={() => onSelect(session)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {session.messageCount} messages • {formatRelativeTime(session.timestamp)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                  @{session.id}
                </div>
              </div>
            </div>
          );
        })}
        
        {searchTerm && filteredSessions.length === 0 && (
          <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
            No sessions found matching "{searchTerm}"
          </div>
        )}
        
        {!position.showAbove && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-2 border-t border-gray-200 dark:border-gray-700 pt-2">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionAutocomplete;
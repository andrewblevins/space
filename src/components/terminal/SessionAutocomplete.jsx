import React, { useState, useEffect, useRef } from 'react';

/**
 * Autocomplete dropdown for @ references — sessions and (in vault mode)
 * markdown files in the vault.
 *
 * @param {object} props
 * @param {boolean} props.show - Whether to show the dropdown
 * @param {string} props.searchTerm - The text after @ to filter by
 * @param {Array} props.sessions - Array of session objects with id, title, messageCount, timestamp
 * @param {Array} [props.vaultFiles] - Array of {path, name, mtime} from the vault
 * @param {(session: object) => void} props.onSelect - Called when user selects a session
 * @param {(file: object) => void} [props.onVaultFileSelect] - Called when user selects a vault file
 * @param {() => void} props.onClose - Called when dropdown should close
 * @param {object} props.position - Position object with top, left, showAbove for absolute positioning
 */
export function SessionAutocomplete({
  show,
  searchTerm,
  sessions,
  vaultFiles = [],
  onSelect,
  onVaultFileSelect,
  onClose,
  position = { top: 0, left: 0, showAbove: false }
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    const title = session.title || `Session ${session.id}`;
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  }).slice(0, 5); // Leave room for vault files in the merged list

  // Vault files are pre-filtered by the parent (which calls searchVaultFiles
  // with the search term), so we just slice for display.
  const filteredVaultFiles = (vaultFiles || []).slice(0, 5);

  // Build a unified list for keyboard navigation. Sessions first, then files.
  const items = [
    ...filteredSessions.map((s) => ({ kind: 'session', value: s })),
    ...filteredVaultFiles.map((f) => ({ kind: 'file', value: f })),
  ];

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, sessions, vaultFiles]);

  const selectItem = (item) => {
    if (!item) return;
    if (item.kind === 'session') onSelect(item.value);
    else if (item.kind === 'file' && onVaultFileSelect) onVaultFileSelect(item.value);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!show) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) selectItem(items[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, selectedIndex, items, onSelect, onVaultFileSelect, onClose]);

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

  if (!show || items.length === 0) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className={`fixed z-50 bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-600 rounded-lg shadow-lg max-w-md w-80 ${
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
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-2 border-b border-gray-200 dark:border-stone-700 pb-2">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        )}
        
        {filteredSessions.length > 0 && (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
              {searchTerm ? `Sessions matching "${searchTerm}"` : 'Recent sessions'}
            </div>
            {filteredSessions.map((session, sIdx) => {
              const title = session.title || `Session ${session.id}`;
              const itemIndex = sIdx;
              const isSelected = itemIndex === selectedIndex;

              return (
                <div
                  key={`s-${session.id}`}
                  className={`
                    p-3 rounded-md cursor-pointer transition-colors border
                    ${isSelected
                      ? 'bg-term-50 dark:bg-term-950/20 border-term-400 dark:border-term-700'
                      : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                  onClick={() => onSelect(session)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
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
          </>
        )}

        {/* VAULT: vault markdown files section */}
        {filteredVaultFiles.length > 0 && (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 mt-3 px-2">
              {searchTerm ? `Vault files matching "${searchTerm}"` : 'Vault files'}
            </div>
            {filteredVaultFiles.map((file, fIdx) => {
              const itemIndex = filteredSessions.length + fIdx;
              const isSelected = itemIndex === selectedIndex;
              return (
                <div
                  key={`f-${file.path}`}
                  className={`
                    p-3 rounded-md cursor-pointer transition-colors border
                    ${isSelected
                      ? 'bg-term-50 dark:bg-term-950/20 border-term-400 dark:border-term-700'
                      : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                  onClick={() => onVaultFileSelect && onVaultFileSelect(file)}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        📄 {file.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {file.path}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
        
        {!position.showAbove && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-2 border-t border-gray-200 dark:border-stone-700 pt-2">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionAutocomplete;
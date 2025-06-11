import React, { useState, useEffect } from 'react';

const SessionPanel = ({
  isOpen,
  onClose,
  currentSessionId,
  onNewSession,
  onLoadSession,
  onLoadPrevious,
  onResetAllSessions,
  onDeleteSession
}) => {
  const [sessions, setSessions] = useState([]);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Load sessions from localStorage
  const loadSessions = () => {
    const sessionList = [];
    const seenIds = new Set();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('space_session_')) {
        try {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session && session.id && !seenIds.has(session.id)) {
              seenIds.add(session.id);
              sessionList.push(session);
            }
          }
        } catch (error) {
          console.warn(`Failed to parse session data: ${key}`, error);
          // Optionally remove corrupted session data
          localStorage.removeItem(key);
        }
      }
    }
    
    return sessionList
      .filter(session => {
        // Only include sessions with actual user/assistant messages (not just system messages)
        const nonSystemMessages = session.messages.filter(m => m.type !== 'system');
        return nonSystemMessages.length > 0;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
      .map(session => ({
        ...session,
        messageCount: session.messages.filter(m => m.type !== 'system').length,
      }));
  };

  useEffect(() => {
    if (isOpen) {
      // Clean up any empty sessions that might exist from before this change
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('space_session_'));
      allKeys.forEach(key => {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session && session.messages) {
              const nonSystemMessages = session.messages.filter(m => m.type !== 'system');
              if (nonSystemMessages.length === 0) {
                localStorage.removeItem(key);
              }
            } else {
              // Remove corrupted session data
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.warn(`Failed to parse session data for cleanup: ${key}`, error);
            localStorage.removeItem(key);
          }
        }
      });
      
      setSessions(loadSessions());
    }
  }, [isOpen, currentSessionId]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLoadSession = (sessionId) => {
    onLoadSession(sessionId);
    setSessions(loadSessions()); // Refresh to update current indicator
  };

  const handleDeleteSession = (sessionId) => {
    onDeleteSession(sessionId);
    setSessions(loadSessions()); // Refresh list
  };

  const handleNewSession = () => {
    onNewSession();
    setSessions(loadSessions()); // Refresh to show new session
  };

  const handleResetAll = () => {
    onResetAllSessions();
    setShowResetConfirmation(false);
    setSessions([]); // Clear the list
    onClose(); // Close panel after reset
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-amber-50 dark:bg-gray-900 border border-green-600 dark:border-green-400 rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-green-400 text-xl font-semibold">Session Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close Session Manager"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 space-y-3">
          <button
            onClick={handleNewSession}
            className="w-full px-4 py-2 bg-black border border-green-400 rounded text-green-400 hover:bg-green-400 hover:text-black transition-colors"
          >
            New Session
          </button>
          
          {sessions.length > 1 && (
            <button
              onClick={onLoadPrevious}
              className="w-full px-4 py-2 bg-black border border-blue-400 rounded text-blue-400 hover:bg-blue-400 hover:text-black transition-colors"
            >
              Load Previous Session
            </button>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-green-400 font-medium mb-3">Sessions ({sessions.length})</h3>
          
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-sm">No sessions found</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className={`p-3 rounded border ${
                    session.id === currentSessionId 
                      ? 'border-green-400 bg-green-400 bg-opacity-10' 
                      : 'border-gray-600 bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {session.id === currentSessionId ? (
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2" title="Current Session"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-600 rounded-full mr-2"></div>
                      )}
                      <span className="text-green-400 font-medium">
                        {session.title || `Session ${session.id}`}
                      </span>
                    </div>
                    {session.id === currentSessionId && (
                      <span className="text-xs text-green-400 bg-green-400 bg-opacity-20 px-2 py-1 rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">
                    {session.messageCount} messages • {formatTimestamp(session.timestamp)}
                  </p>

                  {session.id !== currentSessionId && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLoadSession(session.id)}
                        className="flex-1 px-3 py-1 text-xs bg-black border border-green-400 rounded text-green-400 hover:bg-green-400 hover:text-black transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-3 py-1 text-xs bg-black border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-black transition-colors"
                        title="Delete Session"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          {sessions.length > 0 && (
            <button
              onClick={() => setShowResetConfirmation(true)}
              className="w-full px-4 py-2 bg-black border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-black transition-colors"
            >
              Reset All Sessions
            </button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-gray-900 border border-red-400 rounded-lg p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-red-400 text-lg font-semibold mb-2">Reset All Sessions?</h3>
              <p className="text-gray-300 text-sm">
                This will permanently delete all {sessions.length} saved sessions and start fresh with Session 1.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="flex-1 px-4 py-2 bg-black border border-gray-400 rounded text-gray-400 hover:bg-gray-400 hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 px-4 py-2 bg-black border border-red-400 rounded text-red-400 hover:bg-red-400 hover:text-black transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionPanel;
import React from 'react';

const ExportMenu = ({
  isOpen,
  onClose,
  onExportSession,
  onExportAll,
  currentSessionId,
  sessionTitle
}) => {
  if (!isOpen) return null;

  const handleExportSession = () => {
    onExportSession();
    onClose(); // Close menu after action
  };

  const handleExportAll = () => {
    onExportAll();
    onClose(); // Close menu after action
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-green-400 rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-green-400 text-xl font-semibold">Export Options</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close Export Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Export Current Session */}
          <button
            onClick={handleExportSession}
            className="w-full text-left p-4 bg-black border border-green-400 rounded hover:bg-green-400 hover:text-black transition-colors group"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg 
                  className="w-5 h-5 text-green-400 group-hover:text-black transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-green-400 group-hover:text-black font-medium transition-colors">
                  Export Current Session
                </h3>
                <p className="text-gray-400 group-hover:text-gray-700 text-sm mt-1 transition-colors">
                  {sessionTitle 
                    ? `Export "${sessionTitle}" as markdown file`
                    : `Export Session ${currentSessionId} as markdown file`
                  }
                </p>
                <p className="text-gray-500 group-hover:text-gray-600 text-xs mt-1 transition-colors">
                  Downloads: {sessionTitle 
                    ? `space-${sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
                    : `space-session-${currentSessionId}.md`
                  }
                </p>
              </div>
            </div>
          </button>

          {/* Export All Sessions */}
          <button
            onClick={handleExportAll}
            className="w-full text-left p-4 bg-black border border-blue-400 rounded hover:bg-blue-400 hover:text-black transition-colors group"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <svg 
                  className="w-5 h-5 text-blue-400 group-hover:text-black transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-blue-400 group-hover:text-black font-medium transition-colors">
                  Export All Sessions
                </h3>
                <p className="text-gray-400 group-hover:text-gray-700 text-sm mt-1 transition-colors">
                  Export all saved sessions with complete conversation history
                </p>
                <p className="text-gray-500 group-hover:text-gray-600 text-xs mt-1 transition-colors">
                  Downloads: all-sessions.json
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Export functionality preserves all message content, timestamps, and metadata
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportMenu;
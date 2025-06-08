import React from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-green-600 rounded-lg w-full max-w-2xl mx-4 dark:bg-gray-900 dark:border-green-400 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-green-400 text-xl font-semibold">SPACE Terminal - How to Use</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close Help"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-6">
            {/* What is SPACE */}
            <section>
              <h3 className="text-green-400 font-semibold mb-3">What is SPACE Terminal?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                SPACE is a terminal-style interface for conversations with AI advisors. Create different AI personas, 
                have them collaborate on problems, and build up knowledge over time through enhanced memory and tagging.
              </p>
            </section>

            {/* Getting Started */}
            <section>
              <h3 className="text-green-400 font-semibold mb-3">Getting Started</h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p><strong>1. Set up API keys:</strong> Use the Settings menu (⚙️) to add your Anthropic and OpenAI API keys</p>
                <p><strong>2. Create advisors:</strong> Click the + button to add AI advisors with different perspectives</p>
                <p><strong>3. Start chatting:</strong> Type in the terminal to have conversations with your active advisors</p>
              </div>
            </section>

            {/* Key Features */}
            <section>
              <h3 className="text-green-400 font-semibold mb-3">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-green-400 font-medium mb-2">🎨 Interface</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                    <li>• Light/dark theme toggle in Settings</li>
                    <li>• Advisor panel on the left</li>
                    <li>• Analysis panels on the right</li>
                    <li>• Main conversation in center</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-green-400 font-medium mb-2">🏷️ Memory & Knowledge</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                    <li>• Knowledge Dossier tracks conversation topics</li>
                    <li>• Use @1, @2, etc. to reference past sessions</li>
                    <li>• Search and browse your conversation history</li>
                    <li>• Tags automatically organize by category</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-green-400 font-medium mb-2">👥 Advisors</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                    <li>• Create advisors with unique perspectives</li>
                    <li>• Attach files (PDF, TXT, MD) to advisors</li>
                    <li>• Share advisor profiles via file export</li>
                    <li>• Toggle advisors on/off for conversations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-green-400 font-medium mb-2">🔧 Management</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                    <li>• Session management and history</li>
                    <li>• Export conversations as Markdown</li>
                    <li>• Performance settings and API limits</li>
                    <li>• Prompt library for reusable templates</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Quick Tips */}
            <section>
              <h3 className="text-green-400 font-semibold mb-3">Quick Tips</h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm">
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• <strong>Triangle buttons (▼):</strong> Click to analyze conversation for metaphors or get advisor suggestions</li>
                  <li>• <strong>Menu access:</strong> All features accessible via the bottom-left menu</li>
                  <li>• <strong>Session references:</strong> Type @1, @2, etc. to pull in summaries from previous sessions</li>
                  <li>• <strong>File attachments:</strong> Use the 📚 Library button when creating advisors to attach reference materials</li>
                  <li>• <strong>Knowledge search:</strong> Use View Dossier to explore and search your conversation history</li>
                  <li>• <strong>Settings:</strong> Adjust theme, performance, and API settings in the Settings menu</li>
                </ul>
              </div>
            </section>

            {/* Commands */}
            <section>
              <h3 className="text-green-400 font-semibold mb-3">Available Commands</h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-300">
                  <div>
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/help</code> - Show this help</p>
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/new</code> - Start a new session</p>
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/clear</code> - Clear the terminal</p>
                  </div>
                  <div>
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/debug</code> - Toggle debug mode</p>
                    <p><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@N</code> - Reference session N</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <section className="pt-4 border-t border-gray-300 dark:border-gray-600">
              <p className="text-center text-xs text-gray-500">
                SPACE Terminal v0.2.2 • All features accessible through GUI menus
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
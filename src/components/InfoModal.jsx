import React, { useState } from 'react';

const InfoModal = ({ isOpen, onClose }) => {
  const [showChangelog, setShowChangelog] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-green-600 rounded-lg w-full max-w-4xl mx-4 dark:bg-gray-900 dark:border-green-400 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            {showChangelog && (
              <button
                onClick={() => setShowChangelog(false)}
                className="text-gray-400 hover:text-green-400 transition-colors"
                title="Back to About"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-green-400 text-xl font-semibold">
              {showChangelog ? 'Changelog v0.2.2' : 'About SPACE Terminal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {showChangelog ? (
            <ChangelogContent />
          ) : (
            <AboutContent onShowChangelog={() => setShowChangelog(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

const AboutContent = ({ onShowChangelog }) => {
  return (
    <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-green-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.2</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                An experimental interface for conversations with AI advisors
              </p>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <h4 className="text-green-400 font-medium mb-2">About</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                SPACE stands for Simple Perspective-Augmenting Conversation Environment. 
                Create AI advisors with different perspectives and have collaborative conversations 
                that build knowledge over time.
              </p>
              
              <h4 className="text-green-400 font-medium mb-2">Features</h4>
              <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                <li>• Generate advisors frictionlessly</li>
                <li>• Metaphor pattern tracking</li>
                <li>• Reference previous conversations</li>
                <li>• Automatic knowledge tags</li>
              </ul>
              
              <div className="mt-3">
                <button
                  onClick={onShowChangelog}
                  className="text-green-600 dark:text-green-400 hover:underline text-sm flex items-center gap-1"
                >
                  📋 View v0.2.2 Changelog
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <h4 className="text-green-400 font-medium mb-2">Creator</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Created by{' '}
                <a 
                  href="https://www.andrewshadeblevins.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  Andrew Blevins
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                For feedback or bug reports, email{' '}
                <a 
                  href="mailto:andrew.s.blevins@gmail.com"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  andrew.s.blevins@gmail.com
                </a>
              </p>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <p className="text-center text-xs text-gray-500">
                All data stored locally in your browser • Privacy-focused design
              </p>
            </div>
    </div>
  );
};

const ChangelogContent = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-green-400 text-lg font-semibold mb-2">What's New in v0.2.2</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          A comprehensive update with enhanced features and capabilities
        </p>
      </div>

      <div className="space-y-4">
        <section>
          <h4 className="text-green-400 font-medium mb-2">🔍 Enhanced Session System</h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
            <li>• Smart autocomplete dropdown when typing @ symbol</li>
            <li>• Session title search with real-time filtering</li>
            <li>• Multiple session references in single message</li>
            <li>• Background context injection like Cursor's @Past Chats</li>
            <li>• Progressive summary caching for instant references</li>
          </ul>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-2">🎨 Interface Improvements</h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
            <li>• Light/dark theme toggle with cream background option</li>
            <li>• Modular Settings menu with organized tabs</li>
            <li>• Smart dropdown positioning that avoids screen clipping</li>
            <li>• Keyboard navigation with arrow keys and shortcuts</li>
          </ul>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-2">🏷️ Knowledge Management</h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
            <li>• Enhanced tagging system with 7 categories</li>
            <li>• Knowledge Dossier with Browse, Search, and Recent tabs</li>
            <li>• Cross-session memory compilation</li>
            <li>• Click-to-navigate functionality for tagged messages</li>
          </ul>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-2">👥 Advisor Features</h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
            <li>• File attachment support (PDF, TXT, MD)</li>
            <li>• Browser-compatible PDF parsing</li>
            <li>• Import/export system with drag-and-drop</li>
            <li>• Enhanced description generation from materials</li>
          </ul>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-2">🔧 Technical Improvements</h4>
          <ul className="space-y-1 text-gray-600 dark:text-gray-300 text-sm">
            <li>• Comprehensive API testing framework</li>
            <li>• React performance optimizations</li>
            <li>• Browser compatibility fixes</li>
            <li>• Enhanced error handling throughout</li>
          </ul>
        </section>

        <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
          <p className="text-center text-xs text-gray-500">
            For complete details, see the full changelog in the project repository
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
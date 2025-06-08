import React from 'react';

const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-green-600 rounded-lg w-full max-w-md mx-4 dark:bg-gray-900 dark:border-green-400"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-green-400 text-xl font-semibold">About SPACE Terminal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close Info"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 pt-0">
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
                <li>• Multiple AI advisor perspectives</li>
                <li>• Knowledge dossier and session memory</li>
                <li>• Light/dark theme support</li>
                <li>• Conversation export and sharing</li>
                <li>• Advanced context management</li>
              </ul>
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
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
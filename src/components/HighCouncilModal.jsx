import React, { useState } from 'react';
import { trackFeature } from '../utils/analytics';

const HighCouncilModal = ({ isOpen, onClose, onStartCouncil }) => {
  const [topic, setTopic] = useState('');

  if (!isOpen) return null;

  const handleStart = () => {
    if (topic.trim()) {
      trackFeature('high_council');
      onStartCouncil(topic.trim());
      setTopic('');
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && topic.trim()) {
      handleStart();
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-green-600 rounded-lg w-full max-w-md mx-4 dark:bg-gray-900 dark:border-green-400"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-green-400 text-xl font-semibold">High Council Debate</h2>
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

        <div className="px-6 pb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Start a structured debate between your advisors on a specific topic.
          </p>
          
          <div className="mb-4">
            <label className="text-green-400 font-medium block mb-2">
              Debate Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What should the advisors debate?"
              className="w-full bg-stone-50 text-gray-800 border border-stone-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 dark:bg-black dark:text-green-400 dark:border-green-400"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-stone-50 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors dark:bg-black dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={!topic.trim()}
              className="flex-1 px-4 py-2 bg-green-400 text-black rounded hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Debate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighCouncilModal;
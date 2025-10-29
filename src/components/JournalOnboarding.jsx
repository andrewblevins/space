import React, { useState } from 'react';

const PROMPTS = [
  "What's on your mind right now?",
  "What are you working through today?",
  "What question or situation brought you here?",
  "What's been occupying your thoughts lately?"
];

const JournalOnboarding = ({ onSubmit, onSkip }) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Random prompt selection (could be stored in state to avoid changing on re-renders)
  const [selectedPrompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const canGenerate = wordCount >= 25; // ~100 words minimum, adjusting to 25 for testing

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      await onSubmit(text);
    } catch (error) {
      console.error('Error generating advisors:', error);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent form submission on Enter alone
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h2 className="text-2xl font-serif text-gray-800 dark:text-green-400 mb-4">
          {selectedPrompt}
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Take a moment to write freely about what you're thinking about, working on, or struggling with. This is for you—be as messy or structured as you like."
          className="w-full h-64 p-4 font-serif text-lg bg-amber-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-400 dark:focus:border-green-400 resize-none"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {wordCount < 25 ? (
              <span>Write at least 25 words to generate advisors ({wordCount}/25)</span>
            ) : (
              <span className="text-green-600 dark:text-green-400">✓ Ready to generate advisors</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onSkip}
              disabled={isGenerating}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Skip - I'll add my own
            </button>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Advisors'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalOnboarding;

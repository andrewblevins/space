import React, { useState } from 'react';

const JournalOnboarding = ({
  onSubmit,
  onSkip,
  contextFlow = null, // { phase: 'initial' | 'questions', currentQuestion: string, questionIndex: number }
  onAnswerQuestion = null, // (answer, skipToGenerate) => void
  onSkipQuestion = null // () => void
}) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const canGenerate = wordCount >= 25;

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

  // Handle context question flow
  const handleContinue = () => {
    if (onAnswerQuestion) {
      onAnswerQuestion(text, false);
      setText('');
    }
  };

  const handleSkipQuestionClick = () => {
    if (onSkipQuestion) {
      onSkipQuestion();
      setText('');
    }
  };

  const handleGenerateNow = () => {
    if (onAnswerQuestion) {
      onAnswerQuestion(text, true); // skipToGenerate = true
      setText('');
    }
  };

  // Show question flow if in questions phase
  if (contextFlow && contextFlow.phase === 'questions') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Question {contextFlow.questionIndex + 1} of 3
            </div>
            <h2 className="text-xl font-serif text-gray-700 dark:text-gray-300">
              {contextFlow.currentQuestion}
            </h2>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your answer..."
            className="w-full h-48 p-4 font-serif text-lg bg-amber-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-400 dark:focus:border-green-400 resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handleGenerateNow}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline"
            >
              Generate Perspectives Now
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleSkipQuestionClick}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Skip Question
              </button>

              <button
                onClick={handleContinue}
                className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show initial journal entry
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h2 className="text-2xl font-serif text-gray-800 dark:text-green-400 mb-4">
          What's on your mind?
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Take a moment to write freely about what you're thinking about, working on, or struggling with."
          className="w-full h-64 p-4 font-serif text-lg bg-amber-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-green-400 dark:focus:border-green-400 resize-none"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {wordCount < 25 ? (
              <span>Write at least 25 words to generate perspectives ({wordCount}/25)</span>
            ) : (
              <span className="text-green-600 dark:text-green-400">✓ Ready to generate perspectives</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onSkip(text)}
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
              {isGenerating ? 'Generating...' : 'Generate Perspectives'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalOnboarding;

import React, { useState } from 'react';

const JournalOnboarding = ({
  onSubmit,
  onSkip,
  contextFlow = null, // { phase: 'initial' | 'questions', currentQuestion: string, questionIndex: number, currentAnswer: string }
  onAnswerQuestion = null, // (answer, skipToGenerate) => void
  onSkipQuestion = null, // () => void
  onNavigateQuestion = null // (direction: 'back' | 'forward') => void
}) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Load current answer when question changes OR when entering questions phase
  React.useEffect(() => {
    console.log('🔄 JournalOnboarding useEffect triggered:', {
      phase: contextFlow?.phase,
      questionIndex: contextFlow?.questionIndex,
      currentAnswer: contextFlow?.currentAnswer,
      isGenerating
    });

    if (contextFlow && contextFlow.phase === 'questions') {
      setText(contextFlow.currentAnswer || '');
      // Reset generating state when question loads
      console.log('✅ Resetting isGenerating to false');
      setIsGenerating(false);
    }
  }, [contextFlow?.phase, contextFlow?.questionIndex]);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const canGenerate = wordCount >= 25;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    console.log('🚀 handleGenerate: Setting isGenerating to true');
    setIsGenerating(true);
    try {
      await onSubmit(text);
    } catch (error) {
      console.error('Error generating advisors:', error);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    // Handle Shift+Enter to proceed
    if (e.key === 'Enter' && e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();

      // In question phase, proceed to next question
      if (contextFlow && contextFlow.phase === 'questions') {
        handleContinue();
      }
      // In initial phase, proceed if we have enough words
      else if (canGenerate && !isGenerating) {
        handleGenerate();
      }
    }
  };

  // Handle context question flow
  const handleContinue = () => {
    if (onAnswerQuestion) {
      // Only set generating state on the LAST question (index 2 = question 3)
      // When clicking Continue on question 3, we're generating perspectives
      const isLastQuestion = contextFlow && contextFlow.questionIndex === 2;
      if (isLastQuestion) {
        setIsGenerating(true);
      }
      onAnswerQuestion(text, false);
    }
  };

  const handleSkipQuestionClick = () => {
    if (onSkipQuestion) {
      onSkipQuestion();
    }
  };

  const handleGenerateNow = () => {
    if (onAnswerQuestion) {
      setIsGenerating(true);
      onAnswerQuestion(text, true); // skipToGenerate = true
    }
  };

  const handleBack = () => {
    if (onNavigateQuestion) {
      // Save current answer before going back
      onNavigateQuestion('back', text);
    }
  };

  const handleForward = () => {
    if (onNavigateQuestion) {
      // Save current answer before going forward
      onNavigateQuestion('forward', text);
    }
  };

  // Show question flow if in questions phase
  if (contextFlow && contextFlow.phase === 'questions') {
    const canGoBack = contextFlow.questionIndex > 0;
    const canGoForward = contextFlow.questionIndex < 2 && contextFlow.hasNextQuestion;
    const isLastQuestion = contextFlow.questionIndex === 2;

    console.log('📋 Rendering question phase:', {
      questionIndex: contextFlow.questionIndex,
      isLastQuestion,
      isGenerating,
      buttonText: isGenerating ? 'Generating...' : (isLastQuestion ? 'Generate Perspectives' : 'Continue')
    });

    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <div className="mb-4">
            <div className="text-sm text-amber-700 dark:text-term-300 mb-2 flex items-center justify-between">
              <span>Question {contextFlow.questionIndex + 1} of 3</span>
              <div className="flex gap-2">
                {canGoBack && (
                  <button
                    onClick={handleBack}
                    className="text-xs px-2 py-1 rounded border border-amber-400 dark:border-term-700 text-amber-700 dark:text-term-300 hover:bg-amber-100 dark:hover:bg-term-900/30 transition-colors"
                  >
                    ← Back
                  </button>
                )}
                {canGoForward && (
                  <button
                    onClick={handleForward}
                    className="text-xs px-2 py-1 rounded border border-amber-400 dark:border-term-700 text-amber-700 dark:text-term-300 hover:bg-amber-100 dark:hover:bg-term-900/30 transition-colors"
                  >
                    Forward →
                  </button>
                )}
              </div>
            </div>

            {/* Explanation text for question 1 */}
            {contextFlow.questionIndex === 0 && (
              <p className="text-sm text-amber-700 dark:text-term-300/80 mb-3">
                The following questions will be used to suggest relevant perspectives. This exchange will also build the starting context for your conversation.
              </p>
            )}

            <h2 className="text-xl font-serif text-gray-700 dark:text-term-200">
              {contextFlow.currentQuestion}
            </h2>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your answer..."
            className="w-full h-48 p-4 font-sans text-lg bg-amber-50 dark:bg-stone-900 text-gray-800 dark:text-white placeholder:text-amber-600 dark:placeholder:text-term-300 border-2 border-amber-200 dark:border-term-900/50 rounded-lg focus:outline-none focus:border-term-500 dark:focus:border-term-500 resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onSkip(text)}
                disabled={isGenerating}
                className="text-sm text-amber-700 dark:text-term-300 hover:text-amber-900 dark:hover:text-term-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors underline"
              >
                Skip to Chat
              </button>
              {/* Only show "Generate Perspectives Now" if NOT on last question */}
              {!isLastQuestion && (
                <button
                  onClick={handleGenerateNow}
                  disabled={isGenerating}
                  className="text-sm text-amber-700 dark:text-term-300 hover:text-amber-900 dark:hover:text-term-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors underline flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Perspectives Now'
                  )}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipQuestionClick}
                disabled={isGenerating}
                className="px-4 py-2 text-amber-700 dark:text-term-300 hover:text-amber-900 dark:hover:text-term-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Skip Question
              </button>

              <button
                onClick={handleContinue}
                disabled={isGenerating}
                className="px-6 py-2 bg-term-700 dark:bg-term-800 text-white rounded-lg hover:bg-term-800 dark:hover:bg-term-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Perspectives...
                  </>
                ) : (isLastQuestion ? 'Generate Perspectives' : 'Continue')}
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
        <h2 className="text-2xl font-serif text-amber-800 dark:text-term-300 mb-4">
          What's on your mind?
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Take a moment to write freely about what you're thinking about, working on, or struggling with."
          className="w-full h-64 p-4 font-sans text-lg bg-amber-50 dark:bg-stone-900 text-gray-800 dark:text-white placeholder:text-amber-600 dark:placeholder:text-term-300 border-2 border-amber-200 dark:border-term-900/50 rounded-lg focus:outline-none focus:border-term-500 dark:focus:border-term-500 resize-none"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-amber-700 dark:text-term-300">
            {wordCount < 25 ? (
              <span>Write at least 25 words to continue ({wordCount}/25)</span>
            ) : (
              <span className="text-term-600 dark:text-term-400">✓ Ready to continue</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onSkip(text)}
              disabled={isGenerating}
              className="px-4 py-2 text-amber-700 dark:text-term-300 hover:text-amber-900 dark:hover:text-term-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Skip to Chat
            </button>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="px-6 py-2 bg-term-700 dark:bg-term-800 text-white rounded-lg hover:bg-term-800 dark:hover:bg-term-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalOnboarding;

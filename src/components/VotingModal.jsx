import React, { useState } from 'react';
import { trackFeature } from '../utils/analytics';

const VotingModal = ({ isOpen, onClose, advisors, onSubmitVote }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const activeAdvisors = advisors.filter(a => a.active);
    if (activeAdvisors.length === 0) {
      alert('Please activate at least one advisor to vote');
      return;
    }

    setIsSubmitting(true);
    trackFeature('voting');
    await onSubmitVote(question.trim(), validOptions);
    setIsSubmitting(false);
    
    // Reset form
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  const handleCancel = () => {
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  const activeAdvisorCount = advisors.filter(a => a.active).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div
        className="bg-gray-900 border border-term-500 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sage-400 text-xl font-semibold">Create Advisor Vote</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-term-400 transition-colors"
            title="Cancel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Field */}
          <div>
            <label className="text-term-400 font-medium block mb-2">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question for the advisors..."
              className="w-full bg-stone-900 text-white font-sans border border-term-700 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-term-600 resize-none placeholder:text-sage-400"
              rows={3}
              autoFocus
              autoComplete="off"
              spellCheck="true"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-term-400 font-medium block mb-2">
              Voting Options
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm w-8">{index + 1}.</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 bg-stone-900 text-white font-sans border border-term-700 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-term-600 placeholder:text-sage-400"
                    autoComplete="off"
                    spellCheck="true"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove option"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-term-400 hover:text-term-300 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Option
              </button>
            )}
          </div>

          {/* Advisor Info */}
          <div className="bg-gray-800/50 rounded p-3">
            <div className="text-sm text-gray-300">
              <span className="text-term-400 font-medium">{activeAdvisorCount}</span> active advisor{activeAdvisorCount !== 1 ? 's' : ''} will vote:
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {advisors.filter(a => a.active).map(advisor => (
                <span key={advisor.name} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {advisor.name}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-black border border-gray-400 rounded text-gray-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !question.trim() || options.filter(opt => opt.trim()).length < 2}
              className="px-4 py-2 bg-black border border-term-500 rounded text-term-400 hover:bg-term-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Vote...' : 'Start Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VotingModal;
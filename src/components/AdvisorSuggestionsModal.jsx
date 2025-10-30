import React, { useState } from 'react';
import { CustomPerspectiveCreator } from './CustomPerspectiveCreator';

const AdvisorSuggestionsModal = ({ suggestions, existingAdvisors, onAddSelected, onRegenerate, onSkip, isOpen, isRegenerating, onEditAdvisor, hideSkipButton = false, generatingText = 'Regenerating...', onGenerateCustomDescription, onAddCustomPerspective, isGeneratingCustom }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());

  if (!isOpen) return null;

  // Debug: Log existing advisors
  console.log('🔍 AdvisorSuggestionsModal - existingAdvisors:', existingAdvisors);
  console.log('🔍 existingAdvisors length:', existingAdvisors?.length);

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    // Combine existing advisors and new suggestions based on selection
    const selectedExisting = (existingAdvisors || []).filter(a => selectedIds.has(a.name));
    const selectedNew = suggestions.filter(s => selectedIds.has(s.id));
    onAddSelected([...selectedExisting, ...selectedNew]);
  };

  const handleAddAll = () => {
    // Add all existing advisors and all new suggestions
    onAddSelected([...(existingAdvisors || []), ...suggestions]);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-50 dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-gray-800 dark:text-green-400">
              Suggested Perspectives
            </h2>
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Based on your entry, here are some perspectives that might be valuable:
          </p>
        </div>

        {/* Advisor List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Existing Advisors Section */}
          {existingAdvisors && existingAdvisors.length > 0 && (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Your Existing Perspectives
                </h3>
                <div className="space-y-3">
                  {existingAdvisors.map((advisor) => {
                    const isSelected = selectedIds.has(advisor.name);
                    const isExpanded = expandedIds.has(advisor.name);
                    const shouldTruncate = advisor.description && advisor.description.length > 150;

                    return (
                      <div
                        key={advisor.name}
                        className={`border-2 rounded-lg p-4 transition-all ${
                          isSelected
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {advisor.color && (
                                <span className={`w-3 h-3 rounded-full ${advisor.color}`}></span>
                              )}
                              <h3 className="text-lg font-serif font-medium text-gray-800 dark:text-green-400">
                                {advisor.name}
                              </h3>
                            </div>

                            {advisor.description && (
                              <p className="text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-line">
                                {shouldTruncate && !isExpanded
                                  ? advisor.description.slice(0, 150) + '...'
                                  : advisor.description}
                                {shouldTruncate && (
                                  <button
                                    onClick={() => toggleExpanded(advisor.name)}
                                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                  >
                                    {isExpanded ? 'Show less' : 'Show more'}
                                  </button>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {onEditAdvisor && (
                              <button
                                onClick={() => onEditAdvisor(advisor)}
                                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                                title="Edit perspective"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => toggleSelection(advisor.name)}
                              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                              title={isSelected ? 'Deselect' : 'Select to activate'}
                            >
                              {isSelected ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-gray-700 my-4"></div>

              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                New Perspective Suggestions
              </h3>
            </>
          )}

          {suggestions.map((advisor) => {
            const isSelected = selectedIds.has(advisor.id);
            const isExpanded = expandedIds.has(advisor.id);
            const shouldTruncate = advisor.description && advisor.description.length > 150;

            return (
              <div
                key={advisor.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  isSelected
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {advisor.color && (
                        <span className={`w-3 h-3 rounded-full ${advisor.color}`}></span>
                      )}
                      <h3 className="text-lg font-serif font-medium text-gray-800 dark:text-green-400">
                        {advisor.name}
                      </h3>
                    </div>

                    {advisor.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-line">
                        {shouldTruncate && !isExpanded
                          ? advisor.description.slice(0, 150) + '...'
                          : advisor.description}
                        {shouldTruncate && (
                          <button
                            onClick={() => toggleExpanded(advisor.id)}
                            className="ml-2 text-green-600 dark:text-green-400 hover:underline text-sm"
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onEditAdvisor && (
                      <button
                        onClick={() => onEditAdvisor(advisor)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Edit perspective"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => toggleSelection(advisor.id)}
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-green-600 dark:bg-green-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      title={isSelected ? 'Remove from selection' : 'Add to selection'}
                    >
                      {isSelected ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Custom Perspective Creator */}
          {onGenerateCustomDescription && onAddCustomPerspective && (
            <CustomPerspectiveCreator
              onAdd={onAddCustomPerspective}
              onGenerateDescription={onGenerateCustomDescription}
              isGenerating={isGeneratingCustom}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRegenerating ? generatingText : 'Regenerate'}
            </button>
            {!hideSkipButton && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Start Without
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddAll}
              className="px-4 py-2 border border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              Add All
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorSuggestionsModal;

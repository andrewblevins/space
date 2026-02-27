import React, { useState, useEffect, useRef } from 'react';

const AdvisorSuggestionsModal = ({ suggestions, existingAdvisors, onAddSelected, onRegenerate, onSkip, isOpen, isRegenerating, onEditAdvisor, hideSkipButton = false, generatingText = 'Regenerating...', customPerspectives = [], onCreateCustom, streamingStatus = null }) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [visibleIds, setVisibleIds] = useState(new Set());
  const prevCountRef = useRef(0);

  // Auto-select custom perspectives when they're added
  useEffect(() => {
    if (customPerspectives.length > 0) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        customPerspectives.forEach(advisor => {
          const advisorId = advisor.id || advisor.name.toLowerCase().replace(/\s+/g, '-');
          newSet.add(advisorId);
        });
        return newSet;
      });
    }
  }, [customPerspectives]);

  // Stagger entrance animation for new cards
  useEffect(() => {
    if (suggestions.length > prevCountRef.current) {
      const newCards = suggestions.slice(prevCountRef.current);
      if (newCards.length === 1) {
        // Single new card (streaming) — show immediately
        setVisibleIds(prev => new Set([...prev, newCards[0].id]));
      } else {
        // Batch of new cards — stagger entrance
        newCards.forEach((advisor, idx) => {
          setTimeout(() => {
            setVisibleIds(prev => new Set([...prev, advisor.id]));
          }, idx * 80);
        });
      }
    }
    prevCountRef.current = suggestions.length;
  }, [suggestions.length]);

  // Reset visible IDs when modal opens fresh
  useEffect(() => {
    if (!isOpen) {
      setVisibleIds(new Set());
      prevCountRef.current = 0;
    } else if (suggestions.length > 0 && !streamingStatus?.isStreaming) {
      // Modal opened with pre-loaded suggestions (non-streaming) — show all immediately
      setVisibleIds(new Set(suggestions.map(s => s.id)));
      prevCountRef.current = suggestions.length;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isStreaming = streamingStatus?.isStreaming;
  const streamCount = streamingStatus?.count || 0;
  const streamTotal = streamingStatus?.total || 8;

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
    // Combine existing advisors, new suggestions, and custom perspectives based on selection
    const selectedExisting = (existingAdvisors || []).filter(a => selectedIds.has(a.name));
    const selectedNew = suggestions.filter(s => selectedIds.has(s.id));
    const selectedCustom = customPerspectives.filter(cp => {
      const advisorId = cp.id || cp.name.toLowerCase().replace(/\s+/g, '-');
      return selectedIds.has(advisorId);
    });
    onAddSelected([...selectedExisting, ...selectedNew, ...selectedCustom]);
  };

  const handleAddAll = () => {
    // Add all existing advisors, all new suggestions, and all custom perspectives
    onAddSelected([...(existingAdvisors || []), ...suggestions, ...customPerspectives]);
  };

  // Format category label
  const categoryLabels = {
    'named_figure': 'Human',
    'mythic_fictional': 'Mythic',
    'role': 'Role',
    'challenger': 'Challenger'
  };

  const renderAdvisorCard = (advisor, keyProp, isExisting = false) => {
    const idKey = isExisting ? advisor.name : advisor.id;
    const isSelected = selectedIds.has(idKey);
    const isExpanded = expandedIds.has(idKey);
    const shouldTruncate = advisor.description && advisor.description.length > 150;
    const isVisible = isExisting || visibleIds.has(advisor.id);
    const isPartial = advisor.isPartial;
    const categoryLabel = advisor.category ? categoryLabels[advisor.category] || advisor.category : null;

    return (
      <div
        key={keyProp}
        className={`border-2 rounded-lg p-4 transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        } ${
          isPartial ? 'opacity-80' : ''
        } ${
          isSelected
            ? isExisting
              ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-term-600 dark:border-term-500 bg-term-50 dark:bg-term-950/20'
            : 'border-gray-300 dark:border-stone-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {advisor.color && (
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${advisor.color}`}></span>
              )}
              <h3 className="text-lg font-serif font-medium text-sage-600 dark:text-sage-400">
                {advisor.name}
              </h3>
              {categoryLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-stone-700 text-gray-500 dark:text-gray-400">
                  {categoryLabel}
                </span>
              )}
            </div>

            {advisor.description && (
              <p className={`text-gray-700 dark:text-term-200 mb-2 whitespace-pre-line ${isPartial ? 'italic text-gray-500 dark:text-term-300' : ''}`}>
                {shouldTruncate && !isExpanded
                  ? advisor.description.slice(0, 150) + '...'
                  : advisor.description}
                {shouldTruncate && (
                  <button
                    onClick={() => toggleExpanded(idKey)}
                    className={`ml-2 ${isExisting ? 'text-blue-600 dark:text-blue-400' : 'text-term-600 dark:text-term-400'} hover:underline text-sm`}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEditAdvisor && !isPartial && (
              <button
                onClick={() => onEditAdvisor(advisor)}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Edit perspective"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => toggleSelection(idKey)}
              disabled={isPartial}
              className={`flex-shrink-0 ${isExisting ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg flex items-center justify-center transition-colors ${
                isPartial
                  ? 'bg-gray-100 dark:bg-stone-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : isSelected
                    ? isExisting
                      ? 'bg-blue-600 dark:bg-blue-700 text-white'
                      : 'bg-term-700 dark:bg-term-800 text-white'
                    : 'bg-gray-200 dark:bg-stone-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title={isPartial ? 'Loading...' : isSelected ? 'Remove from selection' : 'Add to selection'}
            >
              {isSelected ? (
                <svg className={`${isExisting ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className={`${isExisting ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-50 dark:bg-stone-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-300 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif text-gray-800 dark:text-term-400">
              Choose Your Panel
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
          {isStreaming ? (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Generating perspectives{streamCount > 0 ? ` (${streamCount} of ${streamTotal})` : ''}
              <span className="inline-block ml-1 animate-pulse">...</span>
            </p>
          ) : (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Select the perspectives you'd like to hear from:
            </p>
          )}
        </div>

        {/* Advisor List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Suggested Perspectives Section (New Suggestions) */}
          {(suggestions.length > 0 || isStreaming) && (
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Suggested
            </h3>
          )}

          {suggestions.map((advisor) => renderAdvisorCard(advisor, advisor.id, false))}

          {/* Inline loading indicator while streaming */}
          {isStreaming && suggestions.length < streamTotal && (
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 py-2">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 dark:border-stone-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Loading more perspectives...</span>
            </div>
          )}

          {/* Create Your Own Perspective Button */}
          {onCreateCustom && (
            <div className="mt-4">
              <button
                onClick={onCreateCustom}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-term-200 bg-gray-50 dark:bg-stone-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-term-600 dark:text-term-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Create Your Own Perspective</span>
              </button>
            </div>
          )}

          {/* Previous Perspectives Section (Existing Advisors) */}
          {existingAdvisors && existingAdvisors.length > 0 && (
            <>
              {/* Divider */}
              <div className="border-t border-gray-300 dark:border-stone-700 mt-6 pt-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Previous Perspectives
                </h3>
              </div>

              <div className="space-y-3">
                {existingAdvisors.map((advisor) => renderAdvisorCard(advisor, advisor.name, true))}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-300 dark:border-stone-700 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating || isStreaming}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRegenerating || isStreaming ? generatingText : 'Regenerate'}
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
              disabled={isStreaming || suggestions.length === 0}
              className="px-4 py-2 border border-term-700 dark:border-term-500 text-term-600 dark:text-term-400 rounded-lg hover:bg-term-50 dark:hover:bg-term-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add All
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedIds.size === 0 || isStreaming}
              className="px-6 py-2 bg-term-700 dark:bg-term-800 text-white rounded-lg hover:bg-term-800 dark:hover:bg-term-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

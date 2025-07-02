import React, { useState, useEffect } from 'react';
import { saveAssertions, loadAssertions } from '../utils/evaluationHelpers';

const AssertionsModal = ({ 
  isOpen, 
  onClose, 
  advisorResponse, 
  conversationContext,
  onSave,
  onSaveAndEvaluate
}) => {
  const [assertions, setAssertions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingAssertions, setExistingAssertions] = useState(null);

  useEffect(() => {
    if (isOpen && advisorResponse) {
      // Load existing assertions if they exist
      const existing = loadAssertions(advisorResponse.id);
      if (existing) {
        setExistingAssertions(existing);
        // Pre-populate with existing assertions
        const assertionTexts = existing.assertions.map(a => a.text).join('\n');
        setAssertions(assertionTexts);
      } else {
        setExistingAssertions(null);
        setAssertions('');
      }
    }
  }, [isOpen, advisorResponse]);

  const saveAssertionsData = async () => {
    if (!advisorResponse || !assertions.trim()) {
      return null;
    }

      // Parse assertions (one per line)
      const assertionLines = assertions
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (assertionLines.length === 0) {
      return null;
      }

      // Create assertion objects
      const assertionObjects = assertionLines.map((text, index) => ({
        id: `assert-${Date.now()}-${index}`,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Create the assertions data structure
      const assertionsData = {
        responseId: advisorResponse.id,
        responseContent: advisorResponse.response,
        advisorName: advisorResponse.name,
        conversationContext: {
          ...conversationContext,
          timestamp: conversationContext.timestamp || new Date().toISOString()
        },
        assertions: assertionObjects,
        evaluations: existingAssertions?.evaluations || [],
        optimizations: existingAssertions?.optimizations || [],
        createdAt: existingAssertions?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage
      saveAssertions(advisorResponse.id, assertionsData);

      // Callback for parent component
      if (onSave) {
        onSave(assertionsData);
      }

    return assertionsData;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await saveAssertionsData();
      if (result) {
      onClose();
      }
    } catch (error) {
      console.error('Failed to save assertions:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndEvaluate = async () => {
    setIsLoading(true);
    try {
      const result = await saveAssertionsData();
      if (result && onSaveAndEvaluate) {
        onSaveAndEvaluate(result);
      }
    } catch (error) {
      console.error('Failed to save assertions:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.metaKey) {
      // Cmd+Enter to save
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Add Assertions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Advisor Response Preview */}
        {advisorResponse && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {advisorResponse.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {advisorResponse.response.substring(0, 200)}
              {advisorResponse.response.length > 200 ? '...' : ''}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter assertions about this response, one per line. These will be used to evaluate and optimize the advisor's output.
          </p>
          {existingAssertions && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Editing existing assertions ({existingAssertions.assertions.length} found)
            </p>
          )}
        </div>

        {/* Assertions Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assertions
          </label>
          <textarea
            value={assertions}
            onChange={(e) => setAssertions(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none"
            placeholder="Response should mention specific psychological frameworks&#10;Response should provide actionable insights&#10;Response should cite relevant research or evidence"
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tip: Use Cmd+Enter to save quickly
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !assertions.trim()}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Only'
            )}
          </button>
          {onSaveAndEvaluate && (
            <button
              onClick={handleSaveAndEvaluate}
              disabled={isLoading || !assertions.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Save & Evaluate
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssertionsModal;
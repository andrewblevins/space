import React, { useState, useEffect } from 'react';
import { getAllResponsesWithAssertions, evaluateAssertions } from '../utils/evaluationHelpers';
import { useGemini } from '../hooks/useGemini';

const EvaluationsModal = ({ isOpen, onClose }) => {
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const { callGemini } = useGemini();

  useEffect(() => {
    if (isOpen) {
      // Load all responses with assertions
      const responsesWithAssertions = getAllResponsesWithAssertions();
      setResponses(responsesWithAssertions);
      setSelectedResponse(null);
    }
  }, [isOpen]);

  const handleResponseClick = (response) => {
    setSelectedResponse(response);
  };

  const handleEvaluate = async () => {
    if (!selectedResponse) return;

    setIsEvaluating(true);
    try {
      const evaluationResult = await evaluateAssertions(
        selectedResponse.responseContent,
        selectedResponse.assertions,
        callGemini
      );

      // Update the response with the new evaluation
      const updatedResponse = {
        ...selectedResponse,
        evaluations: [...(selectedResponse.evaluations || []), evaluationResult],
        updatedAt: new Date().toISOString()
      };

      // Save updated response back to localStorage
      localStorage.setItem(
        `space_assertions_${selectedResponse.responseId}`,
        JSON.stringify(updatedResponse)
      );

      // Update local state
      setSelectedResponse(updatedResponse);
      setResponses(prev => prev.map(r => 
        r.responseId === selectedResponse.responseId ? updatedResponse : r
      ));

    } catch (error) {
      console.error('Evaluation failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOptimize = () => {
    // TODO: Implement optimization modal
    console.log('🔧 Optimize clicked for:', selectedResponse);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        
        {/* Left Panel - Response List */}
        <div className="w-1/3 border-r border-gray-300 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-300 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Responses with Assertions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {responses.length} response{responses.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {responses.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>No responses with assertions found.</p>
                <p className="text-sm mt-2">
                  Click the "Assert" button on advisor responses to create assertions.
                </p>
              </div>
            ) : (
              responses.map((response, index) => (
                <div
                  key={response.responseId}
                  onClick={() => handleResponseClick(response)}
                  className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedResponse?.responseId === response.responseId 
                      ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700' 
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {response.advisorName}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(response.conversationContext.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {response.responseContent.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {response.assertions.length} assertion{response.assertions.length !== 1 ? 's' : ''}
                    </span>
                    {response.evaluations && response.evaluations.length > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        {response.evaluations.length} eval{response.evaluations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Response Details */}
        <div className="w-2/3 flex flex-col">
          <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {selectedResponse ? 'Response Details' : 'Select a Response'}
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

          <div className="flex-1 overflow-y-auto p-4">
            {selectedResponse ? (
              <div>
                {/* Response Content */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {selectedResponse.advisorName} Response
                  </h3>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedResponse.responseContent}
                    </p>
                  </div>
                </div>

                {/* Assertions */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Assertions ({selectedResponse.assertions.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedResponse.assertions.map((assertion, index) => (
                      <div key={assertion.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {index + 1}. {assertion.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previous Evaluations */}
                {selectedResponse.evaluations && selectedResponse.evaluations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Previous Evaluations ({selectedResponse.evaluations.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedResponse.evaluations.map((evaluation, evalIndex) => (
                        <div key={evaluation.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {formatDate(evaluation.timestamp)}
                            </span>
                            <span className={`text-sm font-medium ${
                              evaluation.overallPassed 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {evaluation.overallPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {evaluation.results.map((result, resultIndex) => (
                              <div key={resultIndex} className="flex items-start space-x-2 text-sm">
                                <span className={`font-medium ${
                                  result.passed 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {result.passed ? '✓' : '✗'}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {result.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                             flex items-center"
                  >
                    {isEvaluating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Evaluating...
                      </>
                    ) : (
                      'Evaluate'
                    )}
                  </button>
                  <button
                    onClick={handleOptimize}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Optimize
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>Select a response from the list to view details and run evaluations.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationsModal;
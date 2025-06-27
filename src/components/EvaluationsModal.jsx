import React, { useState, useEffect } from 'react';
import { getAllResponsesWithAssertions, evaluateAssertions } from '../utils/evaluationHelpers';
import { useGemini } from '../hooks/useGemini';
import useClaude from '../hooks/useClaude';

const EvaluationsModal = ({ isOpen, onClose }) => {
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState({ current: 0, total: 10 });
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const { callGemini } = useGemini();
  
  // Create a minimal Claude hook instance for testing optimized prompts
  const { callClaude } = useClaude({ 
    messages: [], 
    setMessages: () => {}, 
    maxTokens: 1000, 
    contextLimit: 16000, 
    memory: null, 
    debugMode: false, 
    reasoningMode: false, 
    getSystemPrompt: () => ""
  });

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

  const handleOptimize = async () => {
    if (!selectedResponse) return;

    setIsOptimizing(true);
    setOptimizationProgress({ current: 0, total: 10 });
    setOptimizationResult(null);
    setShowOptimizationModal(true);

    try {
      // Find the advisor that produced this response
      const targetAdvisor = selectedResponse.conversationContext.advisors?.find(
        advisor => advisor.name === selectedResponse.advisorName
      );

      if (!targetAdvisor) {
        throw new Error('Could not find advisor configuration for optimization');
      }

      const originalPrompt = targetAdvisor.description;
      const failedAssertions = selectedResponse.assertions.filter(assertion => {
        // Check if this assertion failed in the most recent evaluation
        const latestEval = selectedResponse.evaluations?.[selectedResponse.evaluations.length - 1];
        if (!latestEval) return true; // No evaluation yet, assume all need optimization
        
        const assertionResult = latestEval.results.find(r => r.assertionId === assertion.id);
        return !assertionResult?.passed;
      });

      if (failedAssertions.length === 0) {
        throw new Error('No failed assertions to optimize for');
      }

      let bestPrompt = originalPrompt;
      let bestResult = null;
      let bestScore = 0;

      // Run optimization iterations
      for (let iteration = 1; iteration <= 10; iteration++) {
        setOptimizationProgress({ current: iteration, total: 10 });

        // Generate improved prompt using Gemini
        const optimizationPrompt = `Current advisor prompt for ${selectedResponse.advisorName}:
${bestPrompt}

This advisor's response failed these assertions:
${failedAssertions.map((assertion, index) => `${index + 1}. ${assertion.text}`).join('\n')}

The original response was:
${selectedResponse.responseContent}

Suggest an improved advisor prompt that would help produce responses meeting all assertions. Keep the same expertise level and personality, just enhance the approach.

Improved prompt:`;

        const geminiResult = await callGemini(optimizationPrompt, {
          temperature: 0.3,
          maxOutputTokens: 500
        });

        const improvedPrompt = geminiResult.choices[0].message.content.trim();

        // Create a temporary system prompt with the improved advisor
        const testSystemPrompt = `You are currently embodying the following advisor:

${selectedResponse.advisorName}: ${improvedPrompt}

Please respond to user questions from this advisor's perspective, maintaining their expertise and approach.`;

        // Test the improved prompt with the original conversation context
        const contextMessages = selectedResponse.conversationContext.messages || [];
        const lastUserMessage = contextMessages.reverse().find(msg => msg.type === 'user');
        
        if (!lastUserMessage) {
          throw new Error('Could not find original user message for testing');
        }

        // Get test response from Claude
        const testResponse = await callClaude(lastUserMessage.content, () => testSystemPrompt);

        // Evaluate the test response
        const evaluationResult = await evaluateAssertions(
          testResponse,
          selectedResponse.assertions,
          callGemini
        );

        // Calculate score (number of assertions passed)
        const score = evaluationResult.results.filter(r => r.passed).length;

        // Keep best result
        if (score > bestScore) {
          bestScore = score;
          bestPrompt = improvedPrompt;
          bestResult = {
            prompt: improvedPrompt,
            evaluation: evaluationResult,
            iteration: iteration,
            score: score,
            totalAssertions: selectedResponse.assertions.length
          };
        }

        // If all assertions pass, we're done
        if (evaluationResult.overallPassed) {
          break;
        }
      }

      // Set final result
      setOptimizationResult({
        originalPrompt,
        bestPrompt,
        result: bestResult,
        success: bestResult?.evaluation.overallPassed || false,
        improvementCount: bestScore,
        totalAssertions: selectedResponse.assertions.length
      });

    } catch (error) {
      console.error('Optimization failed:', error);
      setOptimizationResult({
        error: error.message,
        success: false
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAcceptOptimization = () => {
    if (!optimizationResult || !selectedResponse) return;

    // Store the optimization result in the assertions data
    const optimizationData = {
      id: `opt-${Date.now()}`,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      originalPrompt: optimizationResult.originalPrompt,
      finalPrompt: optimizationResult.bestPrompt,
      success: optimizationResult.success,
      totalIterations: optimizationResult.result?.iteration || 10,
      improvementCount: optimizationResult.improvementCount,
      totalAssertions: optimizationResult.totalAssertions
    };

    // Update the response with optimization data
    const updatedResponse = {
      ...selectedResponse,
      optimizations: [...(selectedResponse.optimizations || []), optimizationData],
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem(
      `space_assertions_${selectedResponse.responseId}`,
      JSON.stringify(updatedResponse)
    );

    // Update local state
    setSelectedResponse(updatedResponse);
    setResponses(prev => prev.map(r => 
      r.responseId === selectedResponse.responseId ? updatedResponse : r
    ));

    // TODO: Actually update the advisor in the main application
    // This would require access to the main advisor state management
    console.log('🎯 Optimization accepted - would update advisor:', {
      advisorName: selectedResponse.advisorName,
      newPrompt: optimizationResult.bestPrompt
    });

    // Close optimization modal
    setShowOptimizationModal(false);
    setOptimizationResult(null);
  };

  const handleCancelOptimization = () => {
    setIsOptimizing(false);
    setShowOptimizationModal(false);
    setOptimizationResult(null);
    setOptimizationProgress({ current: 0, total: 10 });
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
                    disabled={isOptimizing}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isOptimizing ? 'Optimizing...' : 'Optimize'}
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

      {/* Optimization Modal Overlay */}
      {showOptimizationModal && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {isOptimizing ? (
              /* Progress View */
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Optimizing {selectedResponse?.advisorName}
                </h3>
                <div className="flex items-center justify-center mb-4">
                  <svg className="animate-spin h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">
                    Iteration {optimizationProgress.current} of {optimizationProgress.total}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Testing improved prompts against your assertions...
                </p>
                <button
                  onClick={handleCancelOptimization}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : optimizationResult ? (
              /* Results View */
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Optimization Results
                </h3>
                
                {optimizationResult.error ? (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                    <p className="text-red-800 dark:text-red-200">
                      Error: {optimizationResult.error}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                      <p className="text-blue-800 dark:text-blue-200">
                        {optimizationResult.success ? (
                          `✅ Success! All ${optimizationResult.totalAssertions} assertions now pass.`
                        ) : (
                          `⚠️ Improved ${optimizationResult.improvementCount} of ${optimizationResult.totalAssertions} assertions.`
                        )}
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Original Prompt:</h4>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                          {optimizationResult.originalPrompt}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Optimized Prompt:</h4>
                        <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded text-sm">
                          {optimizationResult.bestPrompt}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex space-x-3">
                  {!optimizationResult.error && (
                    <button
                      onClick={handleAcceptOptimization}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Accept & Apply
                    </button>
                  )}
                  <button
                    onClick={handleCancelOptimization}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    {optimizationResult.error ? 'Close' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationsModal;
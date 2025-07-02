import React, { useState, useEffect } from 'react';
import { getAllResponsesWithAssertions, evaluateAssertions } from '../utils/evaluationHelpers';
import { useGemini } from '../hooks/useGemini';
import useClaude from '../hooks/useClaude';

const EvaluationsModal = ({ isOpen, onClose, advisors = [], onUpdateAdvisor, initialResponse = null }) => {
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedAssertions, setSelectedAssertions] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState({ current: 0, total: 10 });
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const { callGemini } = useGemini();
  
  // Create an isolated Claude hook instance for testing optimized prompts
  // This uses no state updates to prevent triggering the Terminal's auto-save useEffect
  const noOpSetMessages = () => {}; 
  
  const { callClaude } = useClaude({ 
    messages: [], // Always empty to prevent any message history
    setMessages: noOpSetMessages, // No-op to prevent any state updates
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
      
      // If an initial response is provided, select it
      if (initialResponse) {
        // Find the response in the loaded data (it might have been updated)
        const matchingResponse = responsesWithAssertions.find(r => r.responseId === initialResponse.responseId);
        setSelectedResponse(matchingResponse || initialResponse);
      } else {
      setSelectedResponse(null);
      }
      
      // Reset selected assertions when modal opens
      setSelectedAssertions(new Set());
    }
  }, [isOpen, initialResponse]);

  // Helper function to get all assertions across all responses for the selected advisor
  const getAllAssertionsForAdvisor = () => {
    if (!selectedResponse) return [];
    
    const advisorResponses = responses.filter(r => r.advisorName === selectedResponse.advisorName);
    const allAssertions = [];
    
    advisorResponses.forEach(response => {
      response.assertions.forEach(assertion => {
        allAssertions.push({
          ...assertion,
          responseId: response.responseId,
          responseContent: response.responseContent,
          conversationContext: response.conversationContext,
          sourceDescription: response.responseContent.substring(0, 100) + '...'
        });
      });
    });
    
    return allAssertions;
  };

  // Handle assertion selection
  const handleAssertionToggle = (assertionId) => {
    const newSelected = new Set(selectedAssertions);
    if (newSelected.has(assertionId)) {
      newSelected.delete(assertionId);
    } else {
      newSelected.add(assertionId);
    }
    setSelectedAssertions(newSelected);
  };

  const handleResponseClick = (response) => {
    setSelectedResponse(response);
    // Reset selected assertions when switching responses
    setSelectedAssertions(new Set());
  };

  const handleEvaluate = async () => {
    if (!selectedResponse) return;

    setIsEvaluating(true);
    try {
      // If no assertions are selected, evaluate all assertions from the current response
      // If assertions are selected, evaluate only those selected assertions
      let assertionsToEvaluate;
      let evaluationScope;
      
      if (selectedAssertions.size === 0) {
        // Default behavior: evaluate all assertions from current response
        assertionsToEvaluate = selectedResponse.assertions;
        evaluationScope = 'current_response';
        console.log('📋 Evaluating all assertions from current response:', assertionsToEvaluate.map(a => a.text));
      } else {
        // New behavior: evaluate only selected assertions
        const allAssertions = getAllAssertionsForAdvisor();
        assertionsToEvaluate = allAssertions.filter(assertion => 
          selectedAssertions.has(assertion.id)
        );
        evaluationScope = 'selected_assertions';
        console.log('📋 Evaluating selected assertions:', assertionsToEvaluate.map(a => a.text));
      }

      if (assertionsToEvaluate.length === 0) {
        console.warn('No assertions to evaluate');
        return;
      }

      // For selected assertions from different responses, we need to test each in its original context
      if (evaluationScope === 'selected_assertions') {
        console.log('🧠 Testing selected assertions in their original contexts...');
        
        const allResults = [];
        let totalPassed = 0;

        for (const assertion of assertionsToEvaluate) {
          console.log(`🧠 Testing assertion: "${assertion.text}" from response ${assertion.responseId}`);
          
          // Use the response content from the assertion's original context
          const responseContent = assertion.responseContent;
          
          // Evaluate this single assertion
          const singleAssertionEval = await evaluateAssertions(
            responseContent,
            [assertion], // Test just this one assertion
            callGemini
          );

          if (singleAssertionEval.results[0]?.passed) {
            totalPassed++;
            console.log(`✅ Assertion passed: ${assertion.text}`);
          } else {
            console.log(`❌ Assertion failed: ${assertion.text} - ${singleAssertionEval.results[0]?.reason}`);
          }

          allResults.push({
            ...singleAssertionEval.results[0],
            assertionText: assertion.text,
            sourceResponse: assertion.responseId
          });
        }

        // Create a combined evaluation result
        const combinedEvaluationResult = {
          id: `eval_${Date.now()}`,
          timestamp: new Date().toISOString(),
          results: allResults,
          overallPassed: totalPassed === assertionsToEvaluate.length,
          score: totalPassed,
          totalAssertions: assertionsToEvaluate.length,
          evaluationScope: 'selected_assertions'
        };

        console.log(`📊 Combined evaluation result: ${totalPassed}/${assertionsToEvaluate.length} assertions passed`);

        // For selected assertions, we'll add this evaluation to the current response for display
        const updatedResponse = {
          ...selectedResponse,
          evaluations: [...(selectedResponse.evaluations || []), combinedEvaluationResult],
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

      } else {
        // Original behavior for current response assertions
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
      }

    } catch (error) {
      console.error('Evaluation failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedResponse) return;

    // Get all selected assertions
    const allAssertions = getAllAssertionsForAdvisor();
    const selectedAssertionObjects = allAssertions.filter(assertion => 
      selectedAssertions.has(assertion.id)
    );

    if (selectedAssertionObjects.length === 0) {
      alert('Please select at least one assertion to optimize against.');
      return;
    }

    console.log('🚀 Starting optimization process for:', selectedResponse.advisorName);
    console.log('📋 Selected assertions:', selectedAssertionObjects.map(a => a.text));

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
      console.log('📝 Original prompt:', originalPrompt);

      // For optimization, we'll assume all selected assertions need to be met
      // In a more sophisticated version, we could run evaluations first
      const failedAssertions = selectedAssertionObjects;

      console.log('❌ Assertions to optimize for:', failedAssertions.map(a => a.text));

      let bestPrompt = originalPrompt;
      let bestResult = null;
      let bestScore = 0;
      let previousAttempts = []; // Track failed attempts for learning

      console.log('🔄 Starting 10-iteration optimization loop...');

      // Run optimization iterations
      for (let iteration = 1; iteration <= 10; iteration++) {
        console.log(`🔄 Iteration ${iteration}/10 - Testing new prompt...`);
        setOptimizationProgress({ current: iteration, total: 10 });

        // Build adaptive prompt that learns from failures
        let optimizationPrompt = `CURRENT ADVISOR DESCRIPTION for ${selectedResponse.advisorName}:
${originalPrompt}

FAILED ASSERTIONS that need to be addressed:
${failedAssertions.map((assertion, index) => `${index + 1}. ${assertion.text} (from: "${assertion.sourceDescription}")`).join('\n')}`;

        // Add learning from previous failures
        if (previousAttempts.length > 0) {
          console.log(`🧠 Learning from ${previousAttempts.length} previous failed attempt(s):`);
          previousAttempts.forEach((attempt, index) => {
            console.log(`   📋 Failed Attempt ${index + 1}: ${attempt.stillFailing.length} assertions still failing`);
            console.log(`      Approach: ${attempt.approach}`);
            console.log(`      Failed: ${attempt.stillFailing.join(', ')}`);
          });
          console.log(`🎯 Asking Gemini to try a different approach...`);
          
          optimizationPrompt += `\n\nPrevious attempts that didn't improve the score:`;
          previousAttempts.forEach((attempt, index) => {
            optimizationPrompt += `\n\nAttempt ${index + 1}:
- Approach: ${attempt.approach}
- Still failed: ${attempt.stillFailing.join(', ')}`;
          });
          optimizationPrompt += `\n\nTry a different approach than the previous attempts. Focus on the assertions that keep failing.`;
        } else {
          console.log(`🆕 First optimization attempt - no previous failures to learn from`);
        }

        optimizationPrompt += `\n\nCreate an improved advisor description that meets all the requirements while preserving the advisor's core identity and expertise. Follow this conservative approach:

1. **PRESERVE FIRST**: Keep the advisor's name, core expertise, background, and personality intact
2. **MINIMAL CHANGES**: Only add specific instructions or constraints needed to satisfy the failed assertions
3. **ADDITIVE APPROACH**: Append behavioral guidelines or response formatting rules rather than rewriting the entire description
4. **TARGETED FIXES**: Address each failed assertion with the smallest possible change

For example:
- If an assertion requires avoiding certain words, add: "Never begin responses with [specific words]"
- If an assertion requires a specific format, add: "Always structure responses as [format]"
- If an assertion requires certain content, add: "Include [specific elements] in every response"

Only consider major rewrites if:
- The original description directly contradicts the assertions
- Multiple assertions require fundamentally incompatible approaches
- The advisor's core identity prevents meeting the requirements

Return ONLY the improved advisor description, no explanations or meta-commentary.`;

        console.log(`🤖 Asking Gemini for prompt improvement (attempt ${iteration})...`);
        console.log(`📤 Sending optimization prompt to Gemini:`, optimizationPrompt);
        const geminiResult = await callGemini(optimizationPrompt, {
          temperature: 0.7,
          maxOutputTokens: 1500
        });

        let improvedPrompt = geminiResult.choices[0].message.content.trim();
        
        // Clean up the response - remove any meta-commentary while preserving any writing style
        // Look for common meta-commentary patterns and extract the actual description
        const metaPatterns = [
          /^(?:Here's an improved.*?:[\s\S]*?)(?=\*\*(?:Description|Advisor):\*\*)(.*?)(?=\*\*.*?:)/s,
          /\*\*(?:Description|Advisor|Improved):\*\*(.*?)(?=\*\*(?:Key improvements|Example|Notes).*?:)/s,
          /(?:Improved (?:description|advisor):|IMPROVED (?:DESCRIPTION|ADVISOR):)(.*?)(?=\n\n\*\*|$)/s,
        ];
        
        for (const pattern of metaPatterns) {
          const match = improvedPrompt.match(pattern);
          if (match && match[1]) {
            improvedPrompt = match[1].trim();
            break;
          }
        }
        
        // If the response still contains obvious meta-commentary markers, try to extract the core description
        if (improvedPrompt.includes('**') || improvedPrompt.includes('Key improvements') || improvedPrompt.includes('Example') || improvedPrompt.includes('Notes:')) {
          // Split by double asterisks and take the largest meaningful chunk
          const sections = improvedPrompt.split(/\*\*[^*]+\*\*/);
          let longestSection = '';
          
          for (const section of sections) {
            const cleaned = section.trim();
            if (cleaned.length > longestSection.length && 
                !cleaned.toLowerCase().includes('key improvement') && 
                !cleaned.toLowerCase().includes('example') &&
                !cleaned.toLowerCase().includes('note:') &&
                cleaned.length > 50) { // Minimum meaningful length
              longestSection = cleaned;
            }
          }
          
          if (longestSection) {
            improvedPrompt = longestSection;
          }
        }
        
        // Final cleanup - remove any remaining formatting artifacts
        improvedPrompt = improvedPrompt
          .replace(/^\*\*.*?\*\*\s*/g, '') // Remove bold headers at start
          .replace(/\*\*.*?\*\*$/g, '') // Remove bold headers at end  
          .trim();
        console.log(`✨ Iteration ${iteration} - Improved prompt:`, improvedPrompt);

        // Test the improved prompt against each selected assertion in its original context
        console.log(`🧠 Testing improved prompt against ${failedAssertions.length} selected assertions...`);
        
        // Parallelize Claude testing calls
        const testPromises = failedAssertions.map(async (assertion) => {
          // Create a temporary system prompt with the improved advisor
          const testSystemPrompt = `You are currently embodying the following advisor:

${selectedResponse.advisorName}: ${improvedPrompt}

Please respond to user questions from this advisor's perspective, maintaining their expertise and approach.`;

          // Get the original context for this assertion
          const contextMessages = assertion.conversationContext.messages || [];
          const lastUserMessage = contextMessages.slice().reverse().find(msg => msg.type === 'user');
          
          if (!lastUserMessage) {
            console.warn(`⚠️ Could not find original user message for assertion: ${assertion.text}`);
            return {
              assertion: assertion.text,
              testResponse: null,
              error: 'No original user message found'
            };
          }

          // Get test response from Claude using the original context
          console.log(`🧠 Testing assertion "${assertion.text}" with original prompt: "${lastUserMessage.content}"`);
          const testResponse = await callClaude(lastUserMessage.content, () => testSystemPrompt);
          console.log(`💬 Claude test response:`, testResponse.substring(0, 100) + '...');

          return {
            assertion: assertion.text,
            testResponse,
            assertionObj: assertion
          };
        });

        // Wait for all Claude tests to complete
        const testResults = await Promise.all(testPromises);
        console.log(`✅ All ${testResults.length} Claude tests completed in parallel`);

        // Batch evaluate all assertions in a single Gemini call
        const validTestResults = testResults.filter(result => result.testResponse && !result.error);
        
        if (validTestResults.length === 0) {
          console.warn('⚠️ No valid test results to evaluate');
          continue;
        }

        // Create batch evaluation prompt
        const batchEvaluationPrompt = `Please evaluate the following advisor responses against their respective assertions. For each response-assertion pair, determine if the assertion is satisfied and provide a brief reason.

${validTestResults.map((result, index) => `
Response ${index + 1}:
Assertion: "${result.assertion}"
Response: "${result.testResponse}"
`).join('\n')}

Please respond with a JSON array containing ${validTestResults.length} objects, each with:
- "passed": boolean (true if assertion is satisfied)
- "reason": string (brief explanation of why it passed or failed)

Format: [{"passed": true/false, "reason": "explanation"}, ...]`;

        console.log(`🤖 Batch evaluating ${validTestResults.length} assertions with single Gemini call...`);
        const batchEvalResult = await callGemini(batchEvaluationPrompt, {
          temperature: 0.1,
          maxOutputTokens: 1000
        });

        let batchResults;
        try {
          const content = batchEvalResult.choices[0].message.content.trim();
          // Extract JSON from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            batchResults = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON array found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse batch evaluation results:', parseError);
          // Fallback to individual evaluations if batch fails
          console.log('📝 Falling back to individual evaluations...');
          batchResults = [];
          for (const result of validTestResults) {
            const singleEval = await evaluateAssertions(
              result.testResponse,
              [result.assertionObj],
              callGemini
            );
            batchResults.push({
              passed: singleEval.results[0]?.passed || false,
              reason: singleEval.results[0]?.reason || 'Unknown error'
            });
          }
        }

        // Process batch results
        let totalPassed = 0;
        let allResults = [];

        validTestResults.forEach((testResult, index) => {
          const evalResult = batchResults[index] || { passed: false, reason: 'Evaluation failed' };
          
          if (evalResult.passed) {
            totalPassed++;
            console.log(`✅ Assertion passed: ${testResult.assertion}`);
          } else {
            console.log(`❌ Assertion failed: ${testResult.assertion} - ${evalResult.reason}`);
          }

          allResults.push({
            assertion: testResult.assertion,
            passed: evalResult.passed,
            reason: evalResult.reason
          });
        });

        console.log(`📊 Batch evaluation completed: ${totalPassed}/${validTestResults.length} assertions passed`);

        // Calculate score (number of assertions passed)
        const score = totalPassed;
        console.log(`📊 Iteration ${iteration} - Score: ${score}/${failedAssertions.length} assertions passed`);
        
        // Log individual assertion results
        allResults.forEach((result, index) => {
          const status = result.passed ? '✅' : '❌';
          console.log(`   ${status} Assertion ${index + 1}: ${result.reason}`);
        });

        // Keep best result
        if (score > bestScore) {
          console.log(`🎯 New best score! ${score}/${failedAssertions.length} (previous: ${bestScore})`);
          bestScore = score;
          bestPrompt = improvedPrompt;
          bestResult = {
            prompt: improvedPrompt,
            results: allResults,
            iteration: iteration,
            score: score,
            totalAssertions: failedAssertions.length,
            overallPassed: score === failedAssertions.length
          };
        } else {
          console.log(`📈 No improvement. Keeping previous best: ${bestScore}/${failedAssertions.length}`);
          
          // Track failed attempts for learning
          const stillFailingAssertions = allResults.filter(r => !r.passed).map(r => r.assertion);
          const approachDescription = improvedPrompt.substring(0, 100) + '...';
          
          previousAttempts.push({
            approach: approachDescription,
            stillFailing: stillFailingAssertions
          });
          
          console.log(`📝 Logged failed attempt: ${stillFailingAssertions.length} assertions still failing`);
        }

        // If all assertions pass, we're done
        if (score === failedAssertions.length) {
          console.log(`🎉 All assertions passed! Optimization complete at iteration ${iteration}`);
          break;
        }
      }

      // Set final result
      console.log(`🏁 Optimization complete!`);
      console.log(`📝 Final optimized prompt:`, bestPrompt);
      console.log(`📊 Final score: ${bestScore}/${failedAssertions.length} assertions passed`);
      console.log(`🎯 Success: ${bestResult?.overallPassed ? 'YES' : 'NO'}`);
      
      // Summary of learning journey
      if (previousAttempts.length > 0) {
        console.log(`\n🧠 OPTIMIZATION LEARNING SUMMARY:`);
        console.log(`   Total failed attempts: ${previousAttempts.length}`);
        console.log(`   Learning iterations: ${previousAttempts.length + 1}`);
        
        // Find which assertions were consistently problematic
        const allFailedAssertions = previousAttempts.flatMap(attempt => attempt.stillFailing);
        const failureCount = {};
        allFailedAssertions.forEach(assertion => {
          failureCount[assertion] = (failureCount[assertion] || 0) + 1;
        });
        
        if (Object.keys(failureCount).length > 0) {
          console.log(`   Most challenging assertions:`);
          Object.entries(failureCount)
            .sort(([,a], [,b]) => b - a)
            .forEach(([assertion, count]) => {
              console.log(`     "${assertion}" failed ${count} time(s)`);
            });
        }
        
        console.log(`   Final approach succeeded: ${bestResult?.overallPassed ? 'YES' : 'PARTIAL'}`);
      } else {
        console.log(`\n🎯 FIRST ATTEMPT SUCCESS - No learning iterations needed!`);
      }

      setOptimizationResult({
        originalPrompt,
        bestPrompt,
        result: bestResult,
        success: bestResult?.overallPassed || false,
        improvementCount: bestScore,
        totalAssertions: failedAssertions.length
      });

    } catch (error) {
      console.error('❌ Optimization failed:', error);
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

    console.log('✅ User accepted optimization for:', selectedResponse.advisorName);
    console.log('📝 Accepted prompt:', optimizationResult.bestPrompt);

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

    // Update the advisor in the main application
    if (onUpdateAdvisor) {
      onUpdateAdvisor(selectedResponse.advisorName, {
        description: optimizationResult.bestPrompt
      });
      console.log('🎯 Optimization accepted - updated advisor:', {
        advisorName: selectedResponse.advisorName,
        newPrompt: optimizationResult.bestPrompt
      });
    } else {
      console.warn('⚠️ onUpdateAdvisor callback not provided - cannot update advisor');
    }

    // Close optimization modal
    setShowOptimizationModal(false);
    setOptimizationResult(null);
  };

  const handleCancelOptimization = () => {
    console.log('❌ User cancelled optimization');
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

                {/* All Assertions for this Advisor */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    All Assertions for {selectedResponse.advisorName} ({getAllAssertionsForAdvisor().length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Select assertions to optimize against:
                  </p>
                  <div className="space-y-3">
                    {getAllAssertionsForAdvisor().map((assertion, index) => {
                      const isFromCurrentResponse = assertion.responseId === selectedResponse.responseId;
                      return (
                        <div 
                          key={assertion.id} 
                          className={`p-3 rounded border ${
                            isFromCurrentResponse 
                              ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600' 
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              id={`assertion-${assertion.id}`}
                              checked={selectedAssertions.has(assertion.id)}
                              onChange={() => handleAssertionToggle(assertion.id)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <label 
                                  htmlFor={`assertion-${assertion.id}`}
                                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer block"
                                >
                                  {assertion.text}
                                </label>
                                {isFromCurrentResponse && (
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                                    This Response
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Source: {assertion.sourceDescription}
                        </p>
                      </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedAssertions.size > 0 && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {selectedAssertions.size} assertion{selectedAssertions.size !== 1 ? 's' : ''} selected for optimization
                      </p>
                    </div>
                  )}
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
                    ) : selectedAssertions.size > 0 ? (
                      `Evaluate Selected (${selectedAssertions.size})`
                    ) : (
                      'Evaluate This Response'
                    )}
                  </button>
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing || selectedAssertions.size === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isOptimizing ? 'Optimizing...' : `Optimize (${selectedAssertions.size} selected)`}
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
/**
 * Utility functions for the evaluation system
 */

/**
 * Evaluate a response against multiple assertions using Gemini
 * @param {string} response - The advisor response to evaluate
 * @param {Array} assertions - Array of assertion objects with {id, text}
 * @param {Function} callGemini - The Gemini API call function
 * @returns {Promise<Object>} Evaluation results
 */
export async function evaluateAssertions(response, assertions, callGemini) {

  if (!assertions || assertions.length === 0) {
    throw new Error('No assertions provided for evaluation');
  }

  // Validate assertions structure
  assertions.forEach((assertion, index) => {
    if (!assertion) {
      throw new Error(`Assertion at index ${index} is null or undefined`);
    }
    if (!assertion.id) {
      console.warn(`Assertion at index ${index} missing ID:`, assertion);
      throw new Error(`Assertion at index ${index} is missing required 'id' property`);
    }
    if (!assertion.text) {
      throw new Error(`Assertion at index ${index} is missing required 'text' property`);
    }
  });

  // Build the evaluation prompt
  const assertionsList = assertions.map((assertion, index) => 
    `${index + 1}. ${assertion.text}`
  ).join('\n');

  const prompt = `Evaluate whether this AI advisor's response meets the following assertions.

Response:
${response}

Assertions:
${assertionsList}

Return your evaluation as JSON in this exact format. You must evaluate EXACTLY ${assertions.length} assertion(s), no more, no less:
{
  "results": [
    ${assertions.map((_, index) => `{"id": ${index + 1}, "pass": true/false, "reason": "explanation for assertion ${index + 1}"}`).join(',\n    ')}
  ]
}`;

      // Removed debugging logs - now handled by optimization process

  try {
    const result = await callGemini(prompt, {
      temperature: 0.1,
      maxOutputTokens: 1000
    });

    const content = result.choices[0].message.content;
    
    // Parse the JSON response
    let parsedResults;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResults = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini evaluation response:', content);
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
    }

    // Validate the response structure
    if (!parsedResults.results || !Array.isArray(parsedResults.results)) {
      throw new Error('Invalid evaluation response structure');
    }

    // Validate that the number of results matches the number of assertions
    if (parsedResults.results.length !== assertions.length) {
      console.error('Mismatch between assertions and results:', {
        assertionsCount: assertions.length,
        resultsCount: parsedResults.results.length,
        assertions: assertions.map(a => a.text),
        results: parsedResults.results
      });
      throw new Error(`Result count mismatch: sent ${assertions.length} assertions, got ${parsedResults.results.length} results`);
    }

    // Map the results back to assertion IDs
    const mappedResults = parsedResults.results.map((result, index) => {
      const assertion = assertions[index];
      if (!assertion) {
        console.warn(`No assertion found at index ${index}. Assertions:`, assertions);
        throw new Error(`Assertion mismatch: expected assertion at index ${index}`);
      }
      if (!assertion.id) {
        console.warn(`Assertion at index ${index} has no ID:`, assertion);
        throw new Error(`Assertion at index ${index} is missing ID property`);
      }
      return {
        assertionId: assertion.id,
        assertionIndex: index + 1,
        passed: result.pass,
        reason: result.reason
      };
    });

    const overallPassed = mappedResults.every(r => r.passed);

    return {
      id: `eval-${Date.now()}`,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-flash-lite',
      results: mappedResults,
      overallPassed,
      batchRequest: true,
      usage: result.usage
    };
  } catch (error) {
    console.error('Evaluation failed:', error);
    throw new Error(`Evaluation failed: ${error.message}`);
  }
}

/**
 * Generate storage key for assertions
 * @param {string} responseId - The response ID
 * @returns {string} Storage key
 */
export function getAssertionsStorageKey(responseId) {
  return `space_assertions_${responseId}`;
}

/**
 * Save assertions to localStorage
 * @param {string} responseId - The response ID  
 * @param {Object} assertionsData - The assertions data to store
 */
export function saveAssertions(responseId, assertionsData) {
  const key = getAssertionsStorageKey(responseId);
  localStorage.setItem(key, JSON.stringify(assertionsData));
}

/**
 * Load assertions from localStorage
 * @param {string} responseId - The response ID
 * @returns {Object|null} Assertions data or null if not found
 */
export function loadAssertions(responseId) {
  const key = getAssertionsStorageKey(responseId);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Get all responses that have assertions
 * @returns {Array} Array of response objects with assertions
 */
export function getAllResponsesWithAssertions() {
  const responses = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('space_assertions_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        responses.push(data);
      } catch (error) {
        console.warn(`Failed to parse assertions data for key ${key}:`, error);
      }
    }
  }
  
  // Sort by most recent first
  return responses.sort((a, b) => 
    new Date(b.conversationContext?.timestamp || 0) - new Date(a.conversationContext?.timestamp || 0)
  );
}
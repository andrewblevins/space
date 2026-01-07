import { getNextAvailableColor } from '../lib/advisorColors';
import { generatePerspectives, generatePerspectivesStream } from './perspectiveGeneration';

/**
 * Generate advisor suggestions from a journal entry (used in onboarding flow)
 * Wraps the core perspective generation with color assignment and ID generation
 */
export const generateAdvisorSuggestions = async (journalEntry, existingAdvisors = [], previousNames = []) => {
  try {
    // Generate perspectives using shared utility
    const perspectives = await generatePerspectives(journalEntry, previousNames, 'journal');

    // Assign colors and IDs to advisors
    const assignedColors = existingAdvisors.map(a => a.color).filter(Boolean);
    const suggestions = perspectives.map((perspective, index) => {
      const newColor = getNextAvailableColor(assignedColors);
      assignedColors.push(newColor);
      return {
        id: `suggestion-${Date.now()}-${index}`,
        name: perspective.name,
        description: perspective.description,
        rationale: perspective.rationale,
        category: perspective.category,
        color: newColor,
        active: false
      };
    });

    return suggestions;

  } catch (error) {
    console.error('Error generating advisor suggestions:', error);
    throw error;
  }
};

/**
 * Streaming version for journal onboarding flow
 * Wraps generatePerspectivesStream with color assignment
 * @param {string} journalEntry - Journal entry text
 * @param {Array} existingAdvisors - Already created advisors (for color assignment)
 * @param {Array} previousNames - Names to exclude from suggestions
 * @param {Function} onUpdate - Callback for progressive updates
 * @returns {Promise<Array>} Array of complete advisor suggestions with colors
 */
export const generateAdvisorSuggestionsStream = async (
  journalEntry,
  existingAdvisors = [],
  previousNames = [],
  onUpdate = null
) => {
  try {
    const assignedColors = existingAdvisors.map(a => a.color).filter(Boolean);

    const handleStreamUpdate = (perspectives) => {
      if (!onUpdate) return;

      // Assign colors and IDs to streaming perspectives
      const suggestions = perspectives.map((perspective, index) => {
        const newColor = getNextAvailableColor([...assignedColors].slice(0, index));
        return {
          ...perspective,
          id: perspective.id || `suggestion-${Date.now()}-${index}`,
          color: newColor,
          active: false
        };
      });

      onUpdate(suggestions);
    };

    // Generate with streaming
    const perspectives = await generatePerspectivesStream(
      journalEntry,
      previousNames,
      'journal',
      handleStreamUpdate
    );

    // Final color assignment for complete perspectives
    const suggestions = perspectives.map((perspective, index) => {
      const newColor = getNextAvailableColor(assignedColors);
      assignedColors.push(newColor);
      return {
        id: `suggestion-${Date.now()}-${index}`,
        name: perspective.name,
        description: perspective.description,
        rationale: perspective.rationale,
        category: perspective.category,
        color: newColor,
        active: false
      };
    });

    return suggestions;
  } catch (error) {
    console.error('Error generating advisor suggestions:', error);
    throw error;
  }
};

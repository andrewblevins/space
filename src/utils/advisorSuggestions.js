import { getNextAvailableColor } from '../lib/advisorColors';
import { generatePerspectives } from './perspectiveGeneration';

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

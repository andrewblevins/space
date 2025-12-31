import { useState } from 'react';
import AdvisorSuggestionsModal from './AdvisorSuggestionsModal';

/**
 * Component for generating perspective suggestions in a modal
 * @param {object} props
 * @param {Array} props.messages - Conversation messages for context
 * @param {Array} props.existingAdvisors - Currently saved advisors
 * @param {Function} props.onAddPerspective - Callback when adding perspectives
 * @param {Function} props.trackUsage - Usage tracking function
 * @param {Function} props.onEditAdvisor - Callback when editing an advisor
 * @param {boolean} props.disabled - Whether the generator button should be disabled
 */
export function PerspectiveGenerator({
  messages,
  existingAdvisors = [],
  onAddPerspective,
  trackUsage,
  onEditAdvisor,
  disabled = false
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedPerspectives, setGeneratedPerspectives] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const hasMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant').length > 0;
  const isDisabled = disabled || !hasMessages;

  const generatePerspectives = async () => {
    if (isDisabled) return;

    // Open modal and start generating
    setIsModalOpen(true);
    setIsGenerating(true);

    try {
      const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';

      // Get auth session if using auth system
      let session = null;
      if (useAuthSystem) {
        const { supabase } = await import('../lib/supabase');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        session = currentSession;
        if (!session) {
          console.error('Not signed in');
          return;
        }
      }

      // Use OpenRouter API endpoint
      const { getApiEndpoint } = await import('../utils/apiConfig');
      const apiUrl = useAuthSystem
        ? `${getApiEndpoint()}/api/chat/openrouter`
        : 'https://openrouter.ai/api/v1/chat/completions';

      // Set up headers
      const headers = {
        'Content-Type': 'application/json'
      };

      if (useAuthSystem) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Get OpenRouter API key from secure storage
        const { getDecryptedKey } = await import('../utils/secureStorage');
        const openrouterKey = await getDecryptedKey('openrouter');
        if (!openrouterKey) {
          console.error('OpenRouter API key not set');
          return;
        }
        headers['Authorization'] = `Bearer ${openrouterKey}`;
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'SPACE Terminal';
      }

      const recentMessages = messages
        .slice(-6) // Last 6 messages (3 exchanges)
        .filter(msg => msg.type === 'assistant' || msg.type === 'user')
        .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join("\n\n");

      const existingNames = existingAdvisors.map(a => a.name);
      const excludeClause = existingNames.length > 0
        ? `\n\nIMPORTANT: Do NOT suggest any of these existing perspectives: ${existingNames.join(', ')}`
        : '';

      const promptContent = `Based on this recent conversation exchange, suggest exactly 5 specific perspectives that could add valuable insight to this discussion.

IMPORTANT: Include a diverse mix across these categories:
- At least 1-2 real historical figures, thinkers, or experts (living or dead)
- At least 1-2 role-based perspectives (professional roles, mythological figures, or frameworks)
- At least 1 perspective from wisdom traditions, philosophical schools, or cultural approaches
- At least 1 perspective that is antagonistic to the user's apparent values and/or framing - someone who would challenge their assumptions in an abrasive or uncomfortable way

Be sensitive to the content and tone of the conversation. If the conversation is a serious discussion of a difficult situation, make serious, practical suggestions. If the conversation is playful or humorous, make playful, original perspective suggestions.

Always assume the user is highly intelligent, well-educated, and wants the most targeted and effective perspective for their situation.

Focus on perspectives that would bring genuinely different viewpoints, challenge assumptions, or offer specialized knowledge that could deepen the exploration.

When writing role-based titles, write them simply without articles. Use as much specificity as the context warrants. Always use title case. For mythological or symbolic figures, use only the figure name itself without any suffix like "Archetype" or "Figure".

Do NOT include parenthetical descriptions of the perspectives, or anything other than a name or role.${excludeClause}

Recent conversation:
${recentMessages}

For each perspective, generate a description using these instructions:

You are generating a description of an AI advisor that will be used to instruct that entity in a conversation. Your description should be written in second-person (addressing the advisor as "you") and should instruct them on their identity, expertise, and approach. Include instructions about any specific lineages, practices, or frameworks they should embody, and how they should approach problems. Imitate the advisor, writing in their own distinct voice, as gleaned from any writings or public communications they have made. Do not include the advisor's name in the description. Do not include action cues, stage directions, or physical descriptions.

Respond with JSON: {
  "perspectives": [
    {"name": "Perspective Name", "description": "Second-person description instructing this perspective on their identity, expertise, and approach..."},
    ...
  ]
}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [{
            role: 'system',
            content: 'You are a helpful assistant that responds only in valid JSON format.'
          }, {
            role: 'user',
            content: promptContent
          }],
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response - handle cases where Claude includes extra text
      let result;
      try {
        // Try to extract JSON if there's extra text or markdown
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = JSON.parse(content);
        }
      } catch (e) {
        console.error('Failed to parse perspective suggestions:', content);
        throw new Error('Failed to parse perspective suggestions from API response');
      }
      
      if (!result.perspectives || !Array.isArray(result.perspectives)) {
        throw new Error('Invalid response format - missing perspectives array');
      }

      // Track usage if handler provided
      if (trackUsage) {
        const inputTokens = Math.ceil((100 + promptContent.length) / 4);
        const outputTokens = Math.ceil(data.choices[0].message.content.length / 4);
        trackUsage('claude', inputTokens, outputTokens);
      }

      // Add unique IDs to each perspective
      const perspectivesWithIds = (result.perspectives || []).map((p, idx) => ({
        ...p,
        id: `${Date.now()}-${idx}`
      }));

      setGeneratedPerspectives(perspectivesWithIds);

    } catch (error) {
      console.error('Error generating perspectives:', error);
      setIsModalOpen(false); // Close modal on error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSelected = (selectedPerspectives) => {
    // Add all selected perspectives
    selectedPerspectives.forEach(p => {
      onAddPerspective({
        name: p.name,
        description: p.description || ''
      });
    });

    setIsModalOpen(false);
    setGeneratedPerspectives([]);
  };

  const handleSkip = () => {
    setIsModalOpen(false);
    setGeneratedPerspectives([]);
  };

  return (
    <>
      <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-4">
        {/* Generate Button */}
        <button
          onClick={generatePerspectives}
          disabled={isDisabled}
          className={`
            w-full p-3 rounded-lg border transition-colors text-left
            ${!isDisabled
              ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer'
              : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Generate Perspectives
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          {!hasMessages && !disabled && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Start a conversation to generate perspectives
            </p>
          )}
        </button>
      </div>

      {/* Suggestions Modal - without existing advisors */}
      <AdvisorSuggestionsModal
        isOpen={isModalOpen}
        suggestions={generatedPerspectives}
        existingAdvisors={[]} // Don't show existing advisors section
        onAddSelected={handleAddSelected}
        onRegenerate={generatePerspectives}
        onSkip={handleSkip}
        isRegenerating={isGenerating}
        hideSkipButton={true} // Hide "Start Without" button
        generatingText="Generating..." // Show "Generating..." instead of "Regenerating..."
        onEditAdvisor={onEditAdvisor}
      />
    </>
  );
}

export default PerspectiveGenerator;

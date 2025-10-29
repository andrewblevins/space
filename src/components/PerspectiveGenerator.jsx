import { useState } from 'react';

/**
 * Component for actively generating perspective suggestions with inline quick-edit
 * @param {object} props
 * @param {Array} props.messages - Conversation messages for context
 * @param {Array} props.existingAdvisors - Currently saved advisors
 * @param {Function} props.onAddPerspective - Callback when adding a perspective
 * @param {object} props.openaiClient - OpenAI client for generation
 * @param {Function} props.trackUsage - Usage tracking function
 */
export function PerspectiveGenerator({
  messages,
  existingAdvisors = [],
  onAddPerspective,
  openaiClient,
  trackUsage
}) {
  const [generatedPerspectives, setGeneratedPerspectives] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerationTimestamp, setLastGenerationTimestamp] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedNames, setEditedNames] = useState({});

  const hasMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant').length > 0;

  const generatePerspectives = async () => {
    if (!openaiClient || !hasMessages) return;

    setIsGenerating(true);

    try {
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

You may suggest perspectives from any of these categories:
1. Real historical figures, thinkers, or experts (living or dead)
2. Mythic figures, gods/goddesses, or legendary characters from various cultures
3. Professional roles or archetypal figures that bring useful frameworks
4. Fictional characters whose wisdom or approach would be illuminating

Choose the categories most appropriate, tonally and practically, for the conversation. *When in doubt,* focus on professional roles.

Be sensitive to the content and tone of the conversation. If the conversation is a serious discussion of a difficult situation, make serious, practical suggestions. If the conversation is playful or humorous, make playful, original perspective suggestions.

Always assume the user is highly intelligent, well-educated, and wants the most targeted and effective perspective for their situation.

Focus on perspectives that would bring genuinely different viewpoints, challenge assumptions, or offer specialized knowledge that could deepen the exploration.

When writing role-based titles, write them simply without articles. Use as much specificity as the context warrants. Always use title case.

Do NOT include parenthetical descriptions of the perspectives, or anything other than a name or role.${excludeClause}

Recent conversation:
${recentMessages}

For each perspective, provide:
1. name: The perspective name/title (concise)
2. rationale: Brief explanation (1-2 sentences) of why this perspective is relevant to the current conversation

Respond with JSON: {
  "perspectives": [
    {"name": "Perspective Name", "rationale": "Why this perspective is valuable here"},
    ...
  ]
}`;

      const inputTokens = Math.ceil((100 + promptContent.length) / 4);
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a helpful assistant that responds only in valid JSON format."
        }, {
          role: "user",
          content: promptContent
        }],
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content);
      const outputTokens = Math.ceil(response.choices[0].message.content.length / 4);

      if (trackUsage) {
        trackUsage('gpt', inputTokens, outputTokens);
      }

      // Add unique IDs to each perspective
      const perspectivesWithIds = (result.perspectives || []).map((p, idx) => ({
        ...p,
        id: `${Date.now()}-${idx}`
      }));

      setGeneratedPerspectives(perspectivesWithIds);
      setLastGenerationTimestamp(Date.now());
      setEditedNames({});
      setEditingId(null);

    } catch (error) {
      console.error('Error generating perspectives:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddPerspective = (perspective) => {
    const finalName = editedNames[perspective.id] || perspective.name;
    onAddPerspective({
      name: finalName,
      rationale: perspective.rationale
    });

    // Remove from list after adding
    setGeneratedPerspectives(prev => prev.filter(p => p.id !== perspective.id));
  };

  const handleDismiss = (perspectiveId) => {
    setGeneratedPerspectives(prev => prev.filter(p => p.id !== perspectiveId));
  };

  const handleNameEdit = (perspectiveId, newName) => {
    setEditedNames(prev => ({ ...prev, [perspectiveId]: newName }));
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return null;
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-4">
      {/* Generate Button */}
      <button
        onClick={generatePerspectives}
        disabled={!hasMessages || isGenerating}
        className={`
          w-full p-3 rounded-lg border transition-colors text-left
          ${hasMessages && !isGenerating
            ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer'
            : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {isGenerating ? 'Generating Perspectives...' : 'Generate Perspectives'}
          </span>
          {isGenerating && (
            <svg className="animate-spin h-5 w-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>
        {lastGenerationTimestamp && !isGenerating && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last generated {getTimeSince(lastGenerationTimestamp)}
          </div>
        )}
      </button>

      {/* Generated Perspectives */}
      {generatedPerspectives.length > 0 && (
        <div className="mt-4 space-y-3">
          {generatedPerspectives.map((perspective) => {
            const isEditing = editingId === perspective.id;
            const displayName = editedNames[perspective.id] || perspective.name;

            return (
              <div
                key={perspective.id}
                className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                {/* Name (editable) */}
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => handleNameEdit(perspective.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingId(null);
                      if (e.key === 'Escape') {
                        setEditedNames(prev => {
                          const newEdited = { ...prev };
                          delete newEdited[perspective.id];
                          return newEdited;
                        });
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    className="w-full px-2 py-1 rounded border border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <div
                    onClick={() => setEditingId(perspective.id)}
                    className="font-medium text-gray-900 dark:text-gray-100 cursor-text hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    {displayName}
                  </div>
                )}

                {/* Rationale */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {perspective.rationale}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleAddPerspective(perspective)}
                    className="flex-1 px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => handleDismiss(perspective.id)}
                    className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}

          {/* Regenerate Button */}
          <button
            onClick={generatePerspectives}
            disabled={isGenerating}
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate New Set
          </button>
        </div>
      )}
    </div>
  );
}

export default PerspectiveGenerator;

import { getApiEndpoint } from './apiConfig';
import { handleApiError } from './apiErrorHandler';

/**
 * Core prompt template for perspective generation
 * Used by both journal onboarding and mid-conversation generation
 */
const buildPerspectivePrompt = (context, excludeNames = [], contextType = 'journal') => {
  const excludeClause = excludeNames.length > 0
    ? `\n\nIMPORTANT: Do NOT suggest any of these perspectives (already suggested or exist): ${excludeNames.join(', ')}. Generate completely different perspectives.`
    : '';

  const contextIntro = contextType === 'journal'
    ? `The user has written this journal entry to begin exploring their thoughts:\n\n${context}`
    : `Based on this recent conversation exchange:\n\n${context}`;

  const contextWord = contextType === 'journal' ? 'entry' : 'conversation';

  return `${contextIntro}

Read this ${contextWord} closely. Notice the specific situation, the underlying tensions, what's at stake, what's being avoided, what frameworks are implicitly at play. Then suggest 8 perspectives that would genuinely illuminate THIS particular ${contextWord} - not generic advice-givers, but voices that speak directly to what you've observed.${excludeClause}

GENERATE PERSPECTIVES FROM THESE FOUR CATEGORIES (2 each):

1. NAMED FIGURES — Real people (historical or living) whose specific body of work, intellectual style, or life experience speaks to something in this ${contextWord}. Choose people whose actual writings or known positions would create genuine engagement with the material - not famous-for-being-famous thinkers, but voices whose PARTICULAR contributions matter here. Dig deep. Consider philosophers, writers, scientists, practitioners, activists, artists - anyone whose documented thought would be genuinely relevant.

2. MYTHIC & FICTIONAL BEINGS — Gods, tricksters, culture heroes, legendary figures, or fictional characters whose archetypal energy or narrative role resonates with the ${contextWord}'s themes. These should feel like they belong - tonally right, symbolically apt. A trickster for situations needing disruption, a death-deity for transitions, a questing hero for journeys. Draw from any tradition: Greek, Norse, Hindu, Indigenous, African, East Asian, literary, cinematic. Match the figure to the felt-sense of the ${contextWord}.

3. ROLES & FRAMEWORKS — Professional or practical perspectives when specific expertise or methodology would help. These should be unusually specific to the situation - not "therapist" but the particular kind of therapeutic lens that fits; not "business advisor" but the specific strategic framework that applies. Think about what kind of practitioner would have seen exactly this situation before.

4. CHALLENGERS — Figures (named people, not generic "devil's advocate") who would genuinely push back on the ${contextWord}'s apparent assumptions, values, or framing. Choose someone whose known positions would create productive friction. This should feel uncomfortable but illuminating - the voice the user might not want to hear but needs to.

YOUR SUGGESTIONS MUST BE:
- Specific to THIS ${contextWord}, not generically applicable to any situation
- Non-obvious choices that show you've actually listened
- Capable of genuine depth - voices with real substance to draw on
- Balanced between support and challenge

AVOID:
- The most famous/default figure in any domain (dig past the obvious)
- Generic role descriptions (be specific about orientation and approach)
- Safe or flattering choices - include perspectives that will create productive discomfort
- Anything that feels like a "greatest hits" list of thinkers

NAMING:
- Named figures: Use their actual name
- Mythic/fictional: Use the figure's name directly (no "Archetype" suffix)
- Roles: Be specific, no articles (e.g., "Somatic Experiencing Practitioner" not "A Therapist")

For each perspective, write a 2-3 sentence description in second-person ("you") that instructs this perspective on their identity and approach. For named figures, capture their actual intellectual voice and style. For mythic beings, embody their specific archetypal qualities. Make each description feel like it could only describe THIS perspective.

Descriptions should be reusable across multiple conversations - don't reference specifics from this ${contextWord}. Write timeless descriptions of how this perspective thinks and engages. Capture the relevance to this particular ${contextWord} in the rationale field, not the description.

Return ONLY valid JSON:
{
  "perspectives": [
    {
      "name": "Name",
      "category": "named_figure|mythic_fictional|role|challenger",
      "description": "You are... [second-person instructions capturing this specific voice]",
      "rationale": "One sentence on why THIS perspective for THIS ${contextWord}"
    }
  ]
}`;
};

/**
 * Set up authentication headers for API calls
 * Handles both auth system and legacy BYOK modes
 */
const setupApiAuth = async () => {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (useAuthSystem) {
    const { supabase } = await import('../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please sign in to generate perspectives');
    }
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else {
    const { getDecryptedKey } = await import('./secureStorage');
    const openrouterKey = await getDecryptedKey('openrouter');
    if (!openrouterKey) {
      throw new Error('Please set your OpenRouter API key first');
    }
    headers['Authorization'] = `Bearer ${openrouterKey}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'SPACE Terminal';
  }

  const apiUrl = useAuthSystem
    ? `${getApiEndpoint()}/api/chat/openrouter`
    : 'https://openrouter.ai/api/v1/chat/completions';

  return { headers, apiUrl };
};

/**
 * Parse JSON response from LLM, handling common issues
 */
const parseJsonResponse = (content) => {
  try {
    // Try to extract JSON if there's extra text or markdown
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse perspective response:', content);
    throw new Error('Failed to parse perspectives from API response');
  }
};

/**
 * Core perspective generation function
 * @param {string} context - The context text (journal entry or formatted messages)
 * @param {string[]} excludeNames - Names to exclude from suggestions
 * @param {string} contextType - 'journal' or 'conversation'
 * @returns {Promise<Array>} Array of perspective objects with name, category, description, rationale
 */
export const generatePerspectives = async (context, excludeNames = [], contextType = 'journal') => {
  const { headers, apiUrl } = await setupApiAuth();
  const prompt = buildPerspectivePrompt(context, excludeNames, contextType);

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
        content: prompt
      }],
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const parsed = parseJsonResponse(content);

  if (!parsed.perspectives || !Array.isArray(parsed.perspectives)) {
    throw new Error('Invalid response format - missing perspectives array');
  }

  return parsed.perspectives;
};

/**
 * Format conversation messages into context string
 */
export const formatMessagesAsContext = (messages, maxMessages = 6) => {
  return messages
    .slice(-maxMessages)
    .filter(msg => msg.type === 'assistant' || msg.type === 'user')
    .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');
};


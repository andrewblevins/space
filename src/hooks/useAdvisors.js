import { useState, useCallback, useEffect } from 'react';
import { getNextAvailableColor, ADVISOR_COLORS } from '../lib/advisorColors';

/**
 * Custom hook for managing advisor state and operations in SPACE Terminal
 * Extracts all advisor-related functionality from Terminal.jsx
 */
export function useAdvisors() {
  // Core advisor state with localStorage persistence
  const [advisors, setAdvisors] = useState(() => {
    const saved = localStorage.getItem('space_advisors');
    const savedAdvisors = saved ? JSON.parse(saved) : [];
    
    // Auto-assign colors to advisors that don't have them
    let hasChanges = false;
    const updatedAdvisors = [];
    
    // First pass: collect existing colors
    const usedColors = new Set();
    savedAdvisors.forEach(advisor => {
      if (advisor.color) {
        usedColors.add(advisor.color);
      }
    });
    
    // Second pass: assign colors to advisors without them
    savedAdvisors.forEach(advisor => {
      if (!advisor.color) {
        const availableColor = getNextAvailableColor(usedColors);
        updatedAdvisors.push({
          ...advisor,
          color: availableColor,
          id: advisor.id || `advisor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        usedColors.add(availableColor);
        hasChanges = true;
      } else {
        updatedAdvisors.push({
          ...advisor,
          id: advisor.id || `advisor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
      }
    });
    
    // If we made changes, save them back to localStorage
    if (hasChanges) {
      localStorage.setItem('space_advisors', JSON.stringify(updatedAdvisors));
    }
    
    return updatedAdvisors;
  });

  // Advisor groups state
  const [advisorGroups, setAdvisorGroups] = useState(() => {
    const saved = localStorage.getItem('space_advisor_groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Advisor suggestions state
  const [advisorSuggestions, setAdvisorSuggestions] = useState([]);
  const [advisorSuggestionsExpanded, setAdvisorSuggestionsExpanded] = useState(false);

  // Vote history state
  const [voteHistory, setVoteHistory] = useState([]);

  // Persist advisors to localStorage
  useEffect(() => {
    if (advisors.length > 0) {
      localStorage.setItem('space_advisors', JSON.stringify(advisors));
    } else {
      localStorage.removeItem('space_advisors');
    }
  }, [advisors]);

  // Persist advisor groups to localStorage
  useEffect(() => {
    if (advisorGroups.length > 0) {
      localStorage.setItem('space_advisor_groups', JSON.stringify(advisorGroups));
    } else {
      localStorage.removeItem('space_advisor_groups');
    }
  }, [advisorGroups]);

  // Get active advisors
  const getActiveAdvisors = useCallback(() => {
    return advisors.filter(a => a.active);
  }, [advisors]);

  // Add a new advisor
  const addAdvisor = useCallback((advisorData) => {
    const existingNames = new Set(advisors.map(a => a.name.toLowerCase()));
    
    if (existingNames.has(advisorData.name.toLowerCase())) {
      throw new Error(`Advisor "${advisorData.name}" already exists`);
    }

    const usedColors = new Set(advisors.map(a => a.color));
    const newAdvisor = {
      id: `advisor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: advisorData.name,
      description: advisorData.description || '',
      active: advisorData.active !== undefined ? advisorData.active : true,
      color: advisorData.color || getNextAvailableColor(usedColors),
      ...advisorData
    };

    setAdvisors(prev => [...prev, newAdvisor]);
    return newAdvisor;
  }, [advisors]);

  // Update an existing advisor
  const updateAdvisor = useCallback((advisorId, updates) => {
    setAdvisors(prev => prev.map(advisor => 
      advisor.id === advisorId || advisor.name === advisorId
        ? { ...advisor, ...updates }
        : advisor
    ));
  }, []);

  // Delete an advisor
  const deleteAdvisor = useCallback((advisorId) => {
    setAdvisors(prev => prev.filter(advisor => 
      advisor.id !== advisorId && advisor.name !== advisorId
    ));
  }, []);

  // Toggle advisor active state
  const toggleAdvisorActive = useCallback((advisorId) => {
    setAdvisors(prev => prev.map(advisor => 
      (advisor.id === advisorId || advisor.name === advisorId)
        ? { ...advisor, active: !advisor.active }
        : advisor
    ));
  }, []);

  // Activate advisor by name
  const activateAdvisor = useCallback((advisorName) => {
    const advisor = advisors.find(a => a.name.toLowerCase() === advisorName.toLowerCase());
    if (!advisor) {
      throw new Error(`Advisor "${advisorName}" not found`);
    }

    setAdvisors(prev => prev.map(a => 
      a.name.toLowerCase() === advisorName.toLowerCase() 
        ? { ...a, active: true } 
        : a
    ));
  }, [advisors]);

  // Deactivate advisor by name
  const deactivateAdvisor = useCallback((advisorName) => {
    const advisor = advisors.find(a => a.name.toLowerCase() === advisorName.toLowerCase());
    if (!advisor) {
      throw new Error(`Advisor "${advisorName}" not found`);
    }

    setAdvisors(prev => prev.map(a => 
      a.name.toLowerCase() === advisorName.toLowerCase() 
        ? { ...a, active: false } 
        : a
    ));
  }, [advisors]);

  // Find advisor by name
  const findAdvisorByName = useCallback((name) => {
    return advisors.find(a => a.name.toLowerCase() === name.toLowerCase());
  }, [advisors]);

  // Import advisors (replace or add mode)
  const importAdvisors = useCallback((importedAdvisors, mode = 'add') => {
    if (mode === 'replace') {
      setAdvisors(importedAdvisors);
      return {
        added: importedAdvisors.length,
        duplicates: 0
      };
    } else {
      // Add mode - append to existing advisors, avoiding duplicates
      const existingNames = new Set(advisors.map(a => a.name.toLowerCase()));
      const newAdvisors = importedAdvisors.filter(a => !existingNames.has(a.name.toLowerCase()));
      const duplicates = importedAdvisors.length - newAdvisors.length;
      
      setAdvisors(prev => [...prev, ...newAdvisors]);
      
      return {
        added: newAdvisors.length,
        duplicates
      };
    }
  }, [advisors]);

  // Generate system prompt for current advisor configuration
  const getSystemPrompt = useCallback(({ councilMode = false, sessionContexts = [] } = {}) => {
    let prompt = "";
    
    // Add advisor personas
    const activeAdvisors = getActiveAdvisors();
    if (activeAdvisors.length > 0) {
      prompt += `You are currently embodying the following advisors:\n${activeAdvisors.map(a => `\n${a.name}: ${a.description}`).join('\n')}\n\n`;
      
      // Explicit instruction to include all advisors
      prompt += `CRITICAL: You must include ALL advisors listed above in your response, even if some have empty or minimal descriptions. Every advisor name that appears in your persona list must have a response in your output. Do not exclude any advisor based on lack of description.\n\n`;
      
      // Add conversation continuity instructions
      prompt += `## CONVERSATION CONTINUITY\n\nIMPORTANT: You are continuing an ongoing conversation with this user. Do not re-introduce topics, concepts, or ask questions that have already been addressed in the conversation history. Build upon what has been established rather than starting fresh each time. Reference previous exchanges naturally and maintain the flow of the conversation.\n\n`;
      
      if (councilMode) {
        prompt += `\n\n## HIGH COUNCIL MODE
IMPORTANT: Start your response with the exact text "<COUNCIL_DEBATE>" (this is required for the interface to work properly).

The advisors will engage in a structured debate, each maintaining their unique perspective throughout. Each advisor should:

- Stay true to their core philosophy and worldview
- Respond authentically from their own perspective
- Keep responses concise: 2-3 sentences maximum per turn
- Be direct and punchy - avoid lengthy explanations 
- Challenge other advisors when they genuinely disagree
- Build on points that align with their own thinking
- Never abandon their perspective just to reach agreement

CRITICAL: This must be a true DEBATE where advisors directly engage with each other's arguments, not separate speeches.

Structure the debate exactly as follows:

## ROUND 1: Initial Positions
Each advisor states their position on the question.

## ROUND 2: Direct Responses
Each advisor must directly address the other advisors by name, responding to specific points from Round 1:
- "Elon, you're wrong about X because..."
- "I agree with you, Sarah, but you're missing..."
- "That's complete nonsense, Marcus. Here's why..."

## ROUND 3: Final Positions
Each advisor directly challenges or supports the others' Round 2 arguments, speaking TO each other, not about them.

CRITICAL: Use ## for round headers (not **bold**). Always add a blank line before each round header. Example:

[ADVISOR: Name] Final sentence of previous round.

## ROUND 2: Direct Responses

[ADVISOR: Next Name] First response...

REQUIREMENTS:
- Advisors must reference each other by name and quote/paraphrase specific arguments
- No advisor can ignore what others have said
- Each response must build on the conversation, not restart it
- Use transition phrases that show you're responding: "But as [Name] just pointed out..." or "That contradicts [Name]'s argument that..."

MANDATORY FORMAT REQUIREMENTS:
- Each advisor speaks for 2-3 sentences maximum per turn
- Be concise and impactful, not verbose
- You MUST wrap the entire debate in these exact tags:

<COUNCIL_DEBATE>
**ROUND 1: Initial Positions**
[ADVISOR: Name] content...

**ROUND 2: Direct Responses** 
[ADVISOR: Name] responds to [Other Advisor]...

**ROUND 3: Final Positions**
[ADVISOR: Name] presents final stance...
</COUNCIL_DEBATE>

DO NOT FORGET THE <COUNCIL_DEBATE> TAGS. Without these tags, the debate will not display properly.

## Council Summary

After the debate section, provide:
- One sentence per advisor summarizing their final position
- Synthesis: 1-2 sentences on the overall outcome or remaining tensions`;
      }
    }
    // If no advisors are active, no system prompt is needed
    
    // Add session context from @ references  
    if (sessionContexts.length > 0) {
      if (prompt) prompt += "\n\n";
      prompt += "## REFERENCED CONVERSATION CONTEXTS\n\n";
      prompt += "The user has referenced the following previous conversations for context:\n\n";
      
      sessionContexts.forEach((context, index) => {
        const date = new Date(context.timestamp).toLocaleDateString();
        prompt += `### Context ${index + 1}: "${context.title}" (Session ${context.sessionId}, ${date})\n`;
        prompt += `${context.summary}\n\n`;
      });
      
      prompt += "Use these conversation contexts to inform your response when relevant. The user's message may reference specific details from these conversations.\n";
    }
    
    // Add JSON format instructions at the END to make them most prominent (only for non-council mode)
    if (activeAdvisors.length > 0 && !councilMode) {
      const ADVISOR_JSON_FORMAT = `

## RESPONSE FORMAT

You must respond in this exact JSON format:

{
  "type": "advisor_response",
  "advisors": [
    {
      "id": "resp-advisor-name-${Date.now()}",
      "name": "Advisor Name",
      "response": "The advisor's complete response content here"
    }
  ]
}

MANDATORY FORMATTING RULES - FAILURE TO FOLLOW WILL BREAK THE SYSTEM:
1. Each advisor gets their own object in the advisors array
2. Use the advisor's exact name as it appears in your persona list
3. Include all response content in the "response" field
4. Use proper JSON formatting with escaped quotes
5. The entire response must be valid JSON

THIS FORMAT IS REQUIRED FOR EVERY RESPONSE - DO NOT DEVIATE`;

      prompt += ADVISOR_JSON_FORMAT;
    }
    
    return prompt;
  }, [getActiveAdvisors]);

  // Generate individual system prompt for a specific advisor (for multi-threading)
  const getIndividualSystemPrompt = useCallback((advisor, options = {}) => {
    if (!advisor) return '';
    
    let prompt = `You are embodying the following advisor:\n\n${advisor.name}: ${advisor.description}\n\n`;
    
    prompt += `CRITICAL: You are responding as ${advisor.name} only. Do not speak for or as other advisors. Maintain your unique perspective and voice throughout the response.\n\n`;
    
    prompt += `## CONVERSATION CONTINUITY\n\nIMPORTANT: You are continuing an ongoing conversation with this user. You can see the conversation history including responses from other advisors to previous messages, but you are responding independently to the user's most recent message. Build upon what has been established rather than starting fresh each time.\n\n`;
    
    // Add session context if provided
    if (options.sessionContexts && options.sessionContexts.length > 0) {
      prompt += "## REFERENCED CONVERSATION CONTEXTS\n\n";
      prompt += "The user has referenced the following previous conversations for context:\n\n";
      
      options.sessionContexts.forEach((context, index) => {
        const date = new Date(context.timestamp).toLocaleDateString();
        prompt += `### Context ${index + 1}: "${context.title}" (Session ${context.sessionId}, ${date})\n`;
        prompt += `${context.summary}\n\n`;
      });
      
      prompt += "Use these conversation contexts to inform your response when relevant.\n\n";
    }
    
    prompt += `## RESPONSE FORMAT\n\nRespond naturally as ${advisor.name}. Do not use JSON format - just provide your direct response as this advisor would speak.`;
    
    return prompt;
  }, []);

  // Group management functions
  const addAdvisorGroup = useCallback((groupData) => {
    const newGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: groupData.name,
      description: groupData.description || '',
      advisors: groupData.advisors || [],
      active: groupData.active || false
    };

    setAdvisorGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, []);

  const deleteAdvisorGroup = useCallback((groupId) => {
    setAdvisorGroups(prev => prev.filter(group => 
      group.id !== groupId && group.name !== groupId
    ));
  }, []);

  const addAdvisorToGroup = useCallback((groupName, advisorName) => {
    const advisor = findAdvisorByName(advisorName);
    const group = advisorGroups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
    
    if (!advisor) {
      throw new Error(`Advisor "${advisorName}" not found`);
    }
    if (!group) {
      throw new Error(`Group "${groupName}" not found`);
    }
    if (group.advisors.includes(advisor.name)) {
      throw new Error(`Advisor "${advisorName}" is already in group "${groupName}"`);
    }
    
    setAdvisorGroups(prev => prev.map(g => 
      g.name === groupName
        ? { ...g, advisors: [...g.advisors, advisor.name] }
        : g
    ));
  }, [advisorGroups, findAdvisorByName]);

  const removeAdvisorFromGroup = useCallback((groupName, advisorName) => {
    const advisor = findAdvisorByName(advisorName);
    const group = advisorGroups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
    
    if (!advisor) {
      throw new Error(`Advisor "${advisorName}" not found`);
    }
    if (!group) {
      throw new Error(`Group "${groupName}" not found`);
    }
    if (!group.advisors.includes(advisor.name)) {
      throw new Error(`Advisor "${advisorName}" is not in group "${groupName}"`);
    }
    
    setAdvisorGroups(prev => prev.map(g => 
      g.name === groupName
        ? { ...g, advisors: g.advisors.filter(a => a !== advisor.name) }
        : g
    ));
  }, [advisorGroups, findAdvisorByName]);

  // Advisor statistics
  const getAdvisorStats = useCallback(() => {
    const active = getActiveAdvisors();
    return {
      total: advisors.length,
      active: active.length,
      inactive: advisors.length - active.length,
      groups: advisorGroups.length
    };
  }, [advisors, advisorGroups, getActiveAdvisors]);

  return {
    // State
    advisors,
    advisorGroups,
    advisorSuggestions,
    advisorSuggestionsExpanded,
    voteHistory,
    
    // Actions
    setAdvisors,
    setAdvisorGroups,
    setAdvisorSuggestions,
    setAdvisorSuggestionsExpanded,
    setVoteHistory,
    
    // Advisor CRUD
    addAdvisor,
    updateAdvisor,
    deleteAdvisor,
    toggleAdvisorActive,
    activateAdvisor,
    deactivateAdvisor,
    findAdvisorByName,
    importAdvisors,
    
    // System prompt generation
    getSystemPrompt,
    getIndividualSystemPrompt,
    
    // Group management
    addAdvisorGroup,
    deleteAdvisorGroup,
    addAdvisorToGroup,
    removeAdvisorFromGroup,
    
    // Computed values
    getActiveAdvisors,
    getAdvisorStats
  };
}

export default useAdvisors;
/**
 * Pure parsing functions for streaming perspective JSON.
 * Separated from perspectiveGeneration.js for testability (no import.meta dependencies).
 */

/**
 * Extract a JSON string value starting at a given position, handling escape sequences.
 * Returns the unescaped value and whether the closing quote was found.
 */
export const extractStringValue = (str, startIdx) => {
  let value = '';
  let escaped = false;
  for (let i = startIdx; i < str.length; i++) {
    const ch = str[i];
    if (escaped) {
      if (ch === 'n') value += '\n';
      else if (ch === 't') value += '\t';
      else if (ch === '"') value += '"';
      else if (ch === '\\') value += '\\';
      else if (ch === '/') value += '/';
      else value += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') return { value, closed: true };
    value += ch;
  }
  return { value, closed: false };
};

/**
 * Extract fields from a (possibly incomplete) perspective JSON object string.
 */
export const parseFieldsFromObject = (objStr, isClosed) => {
  const fields = ['name', 'category', 'description', 'rationale'];
  const result = {};
  let allFieldsComplete = true;

  for (const field of fields) {
    const pattern = new RegExp(`"${field}"\\s*:\\s*"`);
    const match = pattern.exec(objStr);
    if (!match) {
      result[field] = undefined;
      allFieldsComplete = false;
      continue;
    }
    const { value, closed } = extractStringValue(objStr, match.index + match[0].length);
    result[field] = value;
    if (!closed) allFieldsComplete = false;
  }

  // Need at least a name to show anything
  if (result.name === undefined) return null;

  return {
    name: result.name || 'Loading...',
    category: result.category || '',
    description: result.description !== undefined ? result.description : '',
    rationale: result.rationale || '',
    isComplete: isClosed && allFieldsComplete && !!(result.name && result.category && result.description && result.rationale),
    isPartial: !isClosed || !allFieldsComplete || !(result.name && result.category && result.description && result.rationale),
  };
};

/**
 * Parse streaming perspective JSON - extract complete and partial perspectives.
 * Uses character scanning to handle incomplete JSON objects and unclosed strings.
 */
export const parseStreamingPerspectives = (buffer) => {
  const perspectives = [];

  try {
    const arrayStartMatch = buffer.match(/"perspectives"\s*:\s*\[/);
    if (!arrayStartMatch) return perspectives;

    const arrayStartIdx = arrayStartMatch.index + arrayStartMatch[0].length;
    const content = buffer.slice(arrayStartIdx);

    // Scan for object boundaries, tracking brace depth and string state
    let depth = 0;
    let objectStart = -1;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < content.length; i++) {
      const ch = content[i];

      if (escaped) { escaped = false; continue; }
      if (ch === '\\' && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;

      if (ch === '{') {
        if (depth === 0) objectStart = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          const objStr = content.slice(objectStart, i + 1);
          const parsed = parseFieldsFromObject(objStr, true);
          if (parsed) perspectives.push(parsed);
          objectStart = -1;
        }
      }
    }

    // Parse the last unclosed object (actively streaming)
    if (depth > 0 && objectStart !== -1) {
      const partialStr = content.slice(objectStart);
      const parsed = parseFieldsFromObject(partialStr, false);
      if (parsed) perspectives.push(parsed);
    }
  } catch (e) {
    console.error('Error parsing streaming perspectives:', e);
  }

  return perspectives;
};

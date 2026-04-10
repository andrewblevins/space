// VAULT: markdown <-> messages serialization.
//
// Mirrors the section format produced by Terminal.jsx's formatSessionAsMarkdown
// (Terminal.jsx:2292–2338), but uses `##` headings to match the on-disk
// conversation.md format defined in docs/reshape/mvp-proposal.md. The sidecar
// is authoritative; this module exists so the React side can preview/parse
// without round-tripping through HTTP.

const KNOWN_HEADINGS = new Set(['User', 'Assistant']);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convert an in-memory messages[] array into the conversation.md body
 * (sections only — frontmatter is the sidecar's job).
 *
 * @param {Array} messages
 * @param {Array<string>} [advisorNames] — informational; not strictly required
 *        for serialization but useful for the inverse parser to recognize
 *        advisor sections.
 * @returns {string}
 */
export function messagesToMarkdownSections(messages, advisorNames = []) {
  let out = '';

  for (const msg of messages || []) {
    if (!msg) continue;

    // Skip help command output, matching formatSessionAsMarkdown.
    if (msg.content && typeof msg.content === 'string' &&
        msg.content.includes('SPACE Terminal v0.1 - Command Reference')) {
      continue;
    }

    switch (msg.type) {
      case 'user':
        out += `\n## User\n${msg.content || ''}\n`;
        break;
      case 'assistant':
        out += `\n## Assistant\n${msg.content || ''}\n`;
        break;
      case 'parallel_advisor_response':
        if (msg.advisorResponses && typeof msg.advisorResponses === 'object') {
          for (const resp of Object.values(msg.advisorResponses)) {
            if (resp && resp.content && resp.completed) {
              out += `\n## ${resp.name}\n${resp.content}\n`;
            }
          }
        }
        break;
      case 'advisor_response':
        if (msg.advisorData) {
          out += `\n## ${msg.advisorData.name}\n${msg.advisorData.content || ''}\n`;
        } else if (msg.content) {
          out += `\n## Advisor\n${msg.content}\n`;
        }
        break;
      case 'system':
        if (msg.content && !msg.content.includes('/help')) {
          out += `\n> ${msg.content}\n`;
        }
        break;
      default:
        // Unknown types: emit as a quoted block so nothing is lost.
        if (msg.content) out += `\n> ${msg.content}\n`;
        break;
    }
  }

  // Trim leading newline so the result starts cleanly.
  return out.replace(/^\n/, '');
}

/**
 * Inverse of messagesToMarkdownSections. Best-effort.
 *
 * @param {string} markdownBody — body without frontmatter
 * @param {Array<string>} [advisorNames] — names that should be parsed as
 *        advisor responses. If omitted, any heading other than User/Assistant
 *        becomes an advisor_response.
 * @returns {Array}
 */
export function sectionsToMessages(markdownBody, advisorNames = []) {
  if (!markdownBody || typeof markdownBody !== 'string') return [];

  const lines = markdownBody.split('\n');
  const sections = [];
  let current = null;

  const headingRe = /^##\s+(.+?)\s*$/;

  for (const line of lines) {
    const m = line.match(headingRe);
    if (m) {
      if (current) sections.push(current);
      current = { heading: m[1].trim(), content: '' };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
    // Lines before the first heading are dropped (frontmatter is upstream).
  }
  if (current) sections.push(current);

  const advisorSet = new Set(advisorNames);

  return sections.map(({ heading, content }) => {
    const trimmed = content.replace(/^\n+/, '').replace(/\n+$/, '');
    if (heading === 'User') {
      return { type: 'user', content: trimmed };
    }
    if (heading === 'Assistant') {
      return { type: 'assistant', content: trimmed };
    }
    if (advisorSet.size === 0 || advisorSet.has(heading)) {
      return {
        type: 'advisor_response',
        advisorData: { name: heading, content: trimmed },
        content: trimmed,
      };
    }
    return { type: 'unknown', heading, content: trimmed };
  });
}

// Exported for tests; not part of the public surface.
export const __internal = { KNOWN_HEADINGS, escapeRegex };

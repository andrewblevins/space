// VAULT: round-trip tests for vaultMarkdown.

import {
  messagesToMarkdownSections,
  sectionsToMessages,
} from '../vaultMarkdown.js';

describe('vaultMarkdown round-trip', () => {
  test('user + assistant + advisor sections round-trip', () => {
    const messages = [
      { type: 'user', content: 'What should I do about SPACE?' },
      {
        type: 'parallel_advisor_response',
        advisorResponses: {
          a: { name: 'The Pragmatist', content: 'Ship it.', completed: true },
          b: { name: 'The Mystic', content: 'Listen first.', completed: true },
        },
      },
      { type: 'user', content: 'Say more.' },
      { type: 'assistant', content: 'Sure.' },
    ];

    const md = messagesToMarkdownSections(messages, ['The Pragmatist', 'The Mystic']);
    expect(md).toContain('## User');
    expect(md).toContain('## The Pragmatist');
    expect(md).toContain('## The Mystic');
    expect(md).toContain('## Assistant');

    const parsed = sectionsToMessages(md, ['The Pragmatist', 'The Mystic']);

    expect(parsed[0]).toEqual({ type: 'user', content: 'What should I do about SPACE?' });
    expect(parsed[1]).toMatchObject({
      type: 'advisor_response',
      advisorData: { name: 'The Pragmatist', content: 'Ship it.' },
    });
    expect(parsed[2]).toMatchObject({
      type: 'advisor_response',
      advisorData: { name: 'The Mystic', content: 'Listen first.' },
    });
    expect(parsed[3]).toEqual({ type: 'user', content: 'Say more.' });
    expect(parsed[4]).toEqual({ type: 'assistant', content: 'Sure.' });
  });

  test('unknown headings are preserved as type=unknown', () => {
    const md = '## Stranger\nhello\n';
    const parsed = sectionsToMessages(md, ['The Pragmatist']);
    expect(parsed).toEqual([{ type: 'unknown', heading: 'Stranger', content: 'hello' }]);
  });

  test('skips help command output', () => {
    const messages = [
      { type: 'user', content: 'SPACE Terminal v0.1 - Command Reference: blah' },
      { type: 'user', content: 'real message' },
    ];
    const md = messagesToMarkdownSections(messages);
    expect(md).not.toContain('Command Reference');
    expect(md).toContain('real message');
  });
});

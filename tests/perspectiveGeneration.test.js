import { parseStreamingPerspectives } from '../src/utils/perspectiveParser';

describe('parseStreamingPerspectives', () => {
  it('returns empty array for empty buffer', () => {
    expect(parseStreamingPerspectives('')).toEqual([]);
  });

  it('returns empty array when no perspectives array found', () => {
    expect(parseStreamingPerspectives('{"something": "else"}')).toEqual([]);
  });

  it('returns empty array for perspectives array with no objects yet', () => {
    expect(parseStreamingPerspectives('{"perspectives": [')).toEqual([]);
  });

  it('parses one complete perspective', () => {
    const buffer = '{"perspectives": [{"name": "Stoic", "category": "role", "description": "You are a stoic philosopher.", "rationale": "Good for calm reflection."}]}';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Stoic',
      category: 'role',
      description: 'You are a stoic philosopher.',
      rationale: 'Good for calm reflection.',
      isComplete: true,
      isPartial: false,
    });
  });

  it('parses partial perspective with only name', () => {
    const buffer = '{"perspectives": [{"name": "Stoic"';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Stoic');
    expect(result[0].isPartial).toBe(true);
    expect(result[0].isComplete).toBe(false);
  });

  it('parses partial perspective with name and partial description', () => {
    const buffer = '{"perspectives": [{"name": "Stoic", "category": "role", "description": "You are a sto';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Stoic');
    expect(result[0].category).toBe('role');
    expect(result[0].description).toBe('You are a sto');
    expect(result[0].isPartial).toBe(true);
  });

  it('parses partial perspective with complete description but no rationale yet', () => {
    const buffer = '{"perspectives": [{"name": "Stoic", "category": "role", "description": "You are a stoic philosopher."';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('You are a stoic philosopher.');
    expect(result[0].rationale).toBe('');
    expect(result[0].isPartial).toBe(true);
  });

  it('parses multiple complete perspectives', () => {
    const buffer = '{"perspectives": [{"name": "A", "category": "role", "description": "Desc A", "rationale": "Rat A"}, {"name": "B", "category": "challenger", "description": "Desc B", "rationale": "Rat B"}]}';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('A');
    expect(result[0].isComplete).toBe(true);
    expect(result[1].name).toBe('B');
    expect(result[1].isComplete).toBe(true);
  });

  it('parses mix of complete and one trailing partial', () => {
    const buffer = '{"perspectives": [{"name": "A", "category": "role", "description": "Desc A", "rationale": "Rat A"}, {"name": "B", "category": "challenger", "description": "Working on';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(2);
    expect(result[0].isComplete).toBe(true);
    expect(result[1].name).toBe('B');
    expect(result[1].description).toBe('Working on');
    expect(result[1].isPartial).toBe(true);
  });

  it('handles escaped characters in description', () => {
    const buffer = '{"perspectives": [{"name": "Test", "category": "role", "description": "Line one\\nLine two\\tTabbed \\"quoted\\"", "rationale": "Reason"}]}';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Line one\nLine two\tTabbed "quoted"');
    expect(result[0].isComplete).toBe(true);
  });

  it('handles escaped characters in partial description', () => {
    const buffer = '{"perspectives": [{"name": "Test", "category": "role", "description": "Line one\\nLine two';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('Line one\nLine two');
    expect(result[0].isPartial).toBe(true);
  });

  it('handles escaped backslash followed by quote', () => {
    const buffer = '{"perspectives": [{"name": "Test", "category": "role", "description": "A path C:\\\\Users\\\\foo", "rationale": "Why"}]}';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('A path C:\\Users\\foo');
  });

  it('returns no results when name has not arrived yet', () => {
    const buffer = '{"perspectives": [{"na';
    const result = parseStreamingPerspectives(buffer);
    expect(result).toEqual([]);
  });

  it('handles whitespace in JSON formatting', () => {
    const buffer = `{
  "perspectives": [
    {
      "name": "Philosopher",
      "category": "role",
      "description": "Deep thinker.",
      "rationale": "Good perspective."
    }
  ]
}`;
    const result = parseStreamingPerspectives(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Philosopher');
    expect(result[0].isComplete).toBe(true);
  });

  it('progressive streaming: shows growing description', () => {
    // Simulate progressive streaming updates
    const base = '{"perspectives": [{"name": "Stoic", "category": "role", "description": "';

    const result1 = parseStreamingPerspectives(base + 'You');
    expect(result1[0].description).toBe('You');

    const result2 = parseStreamingPerspectives(base + 'You are a');
    expect(result2[0].description).toBe('You are a');

    const result3 = parseStreamingPerspectives(base + 'You are a stoic philosopher.');
    expect(result3[0].description).toBe('You are a stoic philosopher.');

    // All should be partial since description string isn't closed
    expect(result1[0].isPartial).toBe(true);
    expect(result2[0].isPartial).toBe(true);
    expect(result3[0].isPartial).toBe(true);
  });
});

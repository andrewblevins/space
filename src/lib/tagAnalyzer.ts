// Improved prompt for better entity and topic extraction
const TAGGING_PROMPT = `Extract key information as tags to help identify this message's relevance in future conversations.

Focus on these categories:
1. Named Entities:
   - People (e.g. 'steve jobs', 'marie curie')
   - Places (e.g. 'silicon valley', 'new york')
   - Organizations (e.g. 'google', 'united nations')
   
2. Topics and Concepts:
   - Main themes (e.g. 'artificial intelligence', 'psychology')
   - Specific techniques or methods (e.g. 'machine learning', 'cognitive therapy')
   - Fields or domains (e.g. 'technology', 'mental health')

3. Activities and States:
   - Actions or processes (e.g. 'career transition', 'learning')
   - Projects or initiatives (e.g. 'startup launch', 'book writing')
   - States or conditions (e.g. 'job search', 'grief')

Guidelines:
- Keep proper nouns as natural multi-word phrases
- Include both specific and general concepts
- Preserve important compound terms
- Use lowercase for all tags
- Aim for 5-15 relevant tags

Respond with only a JSON array of tags.
Example: {
  "tags": [
    "steve jobs",
    "apple",
    "product design",
    "leadership",
    "technology innovation",
    "startup culture",
    "silicon valley"
  ]
}`

export default class TagAnalyzer {
  async analyzeTags(content: string): Promise<string[]> {
    try {
      console.log('🔍 TagAnalyzer - Starting analysis:', {
        contentPreview: content.substring(0, 100) + '...',
        contentLength: content.length
      });
      
      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{
            role: "system",
            content: TAGGING_PROMPT
          }, {
            role: "user",
            content
          }],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze tags');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content || '{}');
      
      console.log('🔍 TagAnalyzer - Parsed result:', {
        content: content.substring(0, 50) + '...',
        tags: result.tags,
        fullResult: result
      });
      
      return result.tags || [];
    } catch (error) {
      console.error('🔍 TagAnalyzer - Error:', {
        error,
        content: content.substring(0, 50) + '...'
      });
      throw error;
    }
  }
} 
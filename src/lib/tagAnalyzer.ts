import { OpenAI } from 'openai';

export default class TagAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async analyzeTags(content: string): Promise<string[]> {
    try {
      console.log('🔍 TagAnalyzer - Starting analysis:', {
        contentPreview: content.substring(0, 100) + '...',
        contentLength: content.length
      });
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "Extract as many main topic tags from this message as might be useful for identifying its relevance to future conversations. Include names of people mentioned and other proper nouns. (If a proper noun is more than one word, list it as a single tag.) Respond with only a JSON array of lowercase, single-word tags. Example: ['meditation', 'consciousness', 'John']"
        }, {
          role: "user",
          content
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      console.log('🔍 TagAnalyzer - Raw OpenAI response:', response.choices[0].message.content);

      const result = JSON.parse(response.choices[0].message.content || '{}');
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
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
      console.log('Analyzing content for tags:', content);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "Extract 1-3 main topic tags from this message. Respond with only a JSON array of lowercase, single-word tags. Example: ['meditation', 'consciousness', 'growth']"
        }, {
          role: "user",
          content
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      console.log('OpenAI response:', response.choices[0].message.content);
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      console.log('Parsed tags:', result.tags);
      
      return result.tags || [];
    } catch (error) {
      console.error('Tag analysis error:', error);
      throw error;
    }
  }
} 
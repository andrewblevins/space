import { OpenAI } from 'openai';
import { getDecrypted } from '../utils/secureStorage';
import { Tag } from '../types/tags';
import { trackUsage } from '../utils/usageTracking';


// Overhauled prompt for structured tagging with categories
const TAGGING_PROMPT = `Identify important people, places, organizations, topics and activities mentioned in the user's message. Return them as JSON objects with "value" and "category" fields. Categories may be: person, place, organization, topic, activity, state, or other. Use lowercase for the value and provide 5-15 items when possible.

Example response:
{
  "tags": [
    { "value": "steve jobs", "category": "person" },
    { "value": "apple", "category": "organization" }
  ]
}`;
export default class TagAnalyzer {
  private openai: OpenAI | null;
  private initialized: boolean = false;

  constructor() {
    this.openai = null;
    this.initialized = false;
  }

  private async initialize() {
    if (this.initialized) return;
    
    try {
      const openaiKey = await getDecrypted('space_openai_key');
      if (!openaiKey) {
        throw new Error('OpenAI API key not found in secure storage');
      }

      this.openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize TagAnalyzer:', error);
      throw error;
    }
  }

  // Public method for pre-initialization during app startup
  async preInitialize(): Promise<void> {
    try {
      await this.initialize();
      console.log('🏷️ TagAnalyzer pre-initialized successfully');
    } catch (error) {
      console.warn('🏷️ TagAnalyzer pre-initialization failed:', error.message);
      // Don't throw - initialization will be retried during first analysis
    }
  }

  async analyzeTags(content: string): Promise<Tag[]> {
    try {
      await this.initialize();
      
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }
      
      console.log('🔍 TagAnalyzer - Starting analysis:', {
        contentPreview: content.substring(0, 100) + '...',
        contentLength: content.length
      });
      
      const inputTokens = Math.ceil((TAGGING_PROMPT.length + content.length) / 4); // Estimate input tokens
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: TAGGING_PROMPT
        }, {
          role: "user",
          content
        }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      console.log('🔍 TagAnalyzer - Raw OpenAI response:', response.choices[0].message.content);

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Track usage
      const outputTokens = Math.ceil((response.choices[0].message.content || '').length / 4);
      trackUsage('gpt', inputTokens, outputTokens);
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

// Export a shared instance for use across the app
export const sharedTagAnalyzer = new TagAnalyzer(); 
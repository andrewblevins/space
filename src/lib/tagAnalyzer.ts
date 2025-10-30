import { OpenAI } from 'openai';
import { getDecrypted } from '../utils/secureStorage';
import { Tag } from '../types/tags';
import { trackUsage } from '../utils/usageTracking';


// Prompt for extracting concise tags useful for later retrieval
const TAGGING_PROMPT = `Extract short tags that would help a user search for this
message later. Focus on notable people, places, organizations, key topics, and
major actions. Ignore filler details or generic words. Return 5-10 tags as JSON
objects with "value" (lowercase) and "category". Categories: person, place,
organization, topic, activity, state, other.

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
      // In auth mode, tag analysis is handled by the backend
      const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
      if (useAuthSystem) {
        // Skip initialization - backend handles OpenAI calls
        this.initialized = true;
        return;
      }
      
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

  async analyzeTags(content: string, session: any = null): Promise<Tag[]> {
    try {
      await this.initialize();
      
      const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
      
      if (useAuthSystem) {
        // Use backend API for tag analysis in auth mode
        console.log('🏷️ TagAnalyzer using backend API in auth mode');
        
        const inputTokens = Math.ceil((TAGGING_PROMPT.length + content.length) / 4);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (session && session.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const response = await fetch('/api/chat/openai', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
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
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Backend API call failed: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const apiResponse = await response.json();

        // Check if response has the expected OpenAI structure
        if (!apiResponse.choices || !apiResponse.choices[0] || !apiResponse.choices[0].message) {
          console.error('🔍 TagAnalyzer - Unexpected API response structure:', apiResponse);
          throw new Error(`Unexpected API response structure: ${JSON.stringify(apiResponse)}`);
        }

        console.log('🔍 TagAnalyzer - Raw backend response:', apiResponse.choices[0].message.content);

        const result = JSON.parse(apiResponse.choices[0].message.content || '{}');
        
        // Track usage
        const outputTokens = Math.ceil((apiResponse.choices[0].message.content || '').length / 4);
        trackUsage('gpt', inputTokens, outputTokens);
        
        return result.tags || [];
      } else {
        // Use client-side OpenAI in legacy mode
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
      }
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
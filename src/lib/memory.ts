import { Tag } from '../types/tags';

interface Message {
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  tags?: Tag[];
}

interface Session {
  id: number;
  timestamp: string;
  messages: Message[];
  metaphors: string[];
  questions: string[];
}

interface ScoredMessage {
  message: Message;
  score: number;
}

export class MemorySystem {
  // Get all available sessions
  getAllSessions(): Session[] {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('space_session_')) {
        const session = JSON.parse(localStorage.getItem(key) || '');
        sessions.push(session);
      }
    }
    return sessions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Basic retrieval strategy - get relevant messages across sessions
  retrieveRelevantContext(query: string, currentMessages: Message[] = []): Message[] {
    if (currentMessages.length === 0) {
      const sessions = this.getAllSessions();
      currentMessages = sessions.flatMap(s => s.messages);
    }

    const queryWords = query.toLowerCase().split(/\s+/);
    
    console.log('Memory Debug:', {
      query,
      queryWords,
      messageCount: currentMessages.length,
      messageSample: currentMessages.slice(0, 3).map(msg => ({
        content: msg.content.substring(0, 50) + '...',
        tags: msg.tags
      }))
    });
    
    const relevantMessages = currentMessages
      .filter(msg => {
        if (!msg.tags || msg.type === 'system') return false;
        
        const matches = msg.tags.filter(tag =>
          queryWords.some(word => {
            const normalized = word.replace(/[.,?!]/g, '');
            const isMatch = tag.value.toLowerCase() === normalized;
            if (isMatch) {
              console.log(`Match found: tag "${tag.value}" matches query word "${word}"`);
            }
            return isMatch;
          })
        );

        if (matches.length > 0) {
          console.log('Found relevant message:', {
            content: msg.content.substring(0, 50) + '...',
            tags: msg.tags,
            matchingWords: matches,
            queryWords
          });
        }
        
        return matches.length > 0;
      });

    console.log('Relevant messages found:', relevantMessages.length);
    
    return relevantMessages;
  }

  private calculateRelevance(message: Message, query: string): number {
    if (message.type === 'system') return 0;
    
    let score = 0;
    const content = message.content.toLowerCase();
    const queryLower = query.toLowerCase();

    // Basic text matching
    if (content.includes(queryLower)) {
      score += 1;
      
      // Bonus points for exact matches
      if (content === queryLower) {
        score += 2;
      }
      
      // Bonus points for matches at start of message
      if (content.startsWith(queryLower)) {
        score += 1;
      }
    }

    // Tag matching
    if (message.tags) {
      // Bonus points if query matches any tags
      message.tags.forEach(tag => {
        if (tag.value.toLowerCase().includes(queryLower)) {
          score += 1;
        }
      });
    }

    return score;
  }

  // Build a simple dossier of messages related to a subject
  compileDossier(subject: string): Message[] {
    const allSessions = this.getAllSessions();
    const allMessages = allSessions.flatMap(s => s.messages);
    const query = subject.toLowerCase();

    return allMessages
      .filter(m => {
        if (m.type === 'system') return false;
        if (m.tags && m.tags.some(t => t.value.toLowerCase().includes(query))) {
          return true;
        }
        return m.content.toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime());
  }
}

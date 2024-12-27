interface Message {
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
  tags?: string[];  // Simple array of string tags
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
  retrieveRelevantContext(query: string, currentMessages: Message[]): Message[] {
    return currentMessages
      .filter(msg => msg.type === 'user' || msg.type === 'assistant')
      .map(msg => ({ 
        message: msg, 
        score: this.calculateRelevance(msg, query) 
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)  // Get top 3 most relevant messages
      .map(item => item.message);
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
        if (tag.toLowerCase().includes(queryLower)) {
          score += 1;
        }
      });
    }

    return score;
  }
} 
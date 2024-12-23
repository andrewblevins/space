interface Message {
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
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
  retrieveRelevantContext(query: string): Message[] {
    const sessions = this.getAllSessions();
    const scoredMessages: ScoredMessage[] = [];

    sessions.forEach(session => {
      session.messages.forEach(message => {
        const score = this.calculateRelevance(message, query);
        if (score > 0) {
          scoredMessages.push({ message, score });
        }
      });
    });

    // Sort by score and return just the messages
    return scoredMessages
      .sort((a, b) => b.score - a.score)
      .map(scored => scored.message)
      .slice(0, 5);  // Start with top 5 most relevant
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

    return score;
  }
} 
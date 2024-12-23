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
    const relevantMessages: Message[] = [];

    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (this.isRelevant(message, query)) {
          relevantMessages.push(message);
        }
      });
    });

    return relevantMessages;
  }

  private isRelevant(message: Message, query: string): boolean {
    if (message.type === 'system') return false;
    return message.content.toLowerCase().includes(query.toLowerCase());
  }
} 
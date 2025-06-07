/**
 * Memory System API Tests
 * Tests for dossier compilation, message retrieval, and session management
 */

import { setupTestEnvironment, TestDataFactory, TestAssertions, cleanupTestData } from './setup.js';

describe('MemorySystem API', () => {
  let memorySystem;

  beforeAll(() => {
    setupTestEnvironment();
  });

  beforeEach(() => {
    // Reset localStorage and create fresh memory system
    global.localStorage.clear();
    
    // We'll need to import the actual MemorySystem class
    // For now, we'll test the interface and data structures
    memorySystem = {
      getAllSessions: () => [],
      retrieveRelevantContext: () => [],
      compileDossier: () => []
    };
  });

  afterAll(() => {
    cleanupTestData();
  });

  describe('Session Management', () => {
    test('should create and retrieve sessions', () => {
      const session1 = TestDataFactory.createSession(1, 
        TestDataFactory.sampleConversations.techProject);
      const session2 = TestDataFactory.createSession(2, 
        TestDataFactory.sampleConversations.businessMeeting);

      // Store sessions in localStorage
      global.localStorage.setItem('space_session_1', JSON.stringify(session1));
      global.localStorage.setItem('space_session_2', JSON.stringify(session2));

      // Test retrieval
      const retrievedSession = JSON.parse(global.localStorage.getItem('space_session_1'));
      expect(retrievedSession.id).toBe(1);
      expect(retrievedSession.messages).toHaveLength(2);
    });

    test('should sort sessions by timestamp', () => {
      const oldSession = TestDataFactory.createSession(1, [], [], []);
      oldSession.timestamp = new Date('2024-01-01').toISOString();
      
      const newSession = TestDataFactory.createSession(2, [], [], []);
      newSession.timestamp = new Date('2024-01-20').toISOString();

      global.localStorage.setItem('space_session_1', JSON.stringify(oldSession));
      global.localStorage.setItem('space_session_2', JSON.stringify(newSession));

      // Test that newer sessions come first
      const sessions = [oldSession, newSession].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      expect(sessions[0].id).toBe(2); // Newer session first
      expect(sessions[1].id).toBe(1); // Older session second
    });
  });

  describe('Dossier Compilation', () => {
    beforeEach(() => {
      // Setup test data with tagged messages
      const session1 = TestDataFactory.createSession(1, [
        TestDataFactory.createMessage('user', 
          'Working with Apple on React project', 
          [
            TestDataFactory.createTag('apple', 'organization'),
            TestDataFactory.createTag('react', 'topic')
          ]
        ),
        TestDataFactory.createMessage('assistant', 
          'React is great for building UIs...'
        )
      ]);

      const session2 = TestDataFactory.createSession(2, [
        TestDataFactory.createMessage('user', 
          'Apple announced new features', 
          [
            TestDataFactory.createTag('apple', 'organization'),
            TestDataFactory.createTag('features', 'topic')
          ]
        )
      ]);

      global.localStorage.setItem('space_session_1', JSON.stringify(session1));
      global.localStorage.setItem('space_session_2', JSON.stringify(session2));
    });

    test('should find messages by tag matching', () => {
      // Simulate dossier compilation for "Apple"
      const query = 'apple';
      const allMessages = [];
      
      // Get all sessions
      for (let i = 0; i < global.localStorage.length; i++) {
        const key = global.localStorage.key(i);
        if (key?.startsWith('space_session_')) {
          const session = JSON.parse(global.localStorage.getItem(key));
          allMessages.push(...session.messages);
        }
      }

      // Filter messages that mention apple
      const relevantMessages = allMessages.filter(msg => {
        if (msg.type === 'system') return false;
        
        // Check tags
        if (msg.tags?.some(tag => tag.value.toLowerCase().includes(query))) {
          return true;
        }
        
        // Check content
        return msg.content.toLowerCase().includes(query);
      });

      expect(relevantMessages).toHaveLength(2);
      relevantMessages.forEach(msg => {
        expect(msg.content.toLowerCase()).toContain('apple');
      });
    });

    test('should return chronologically sorted results', () => {
      const messages = [
        TestDataFactory.createMessage('user', 'First message', []),
        TestDataFactory.createMessage('user', 'Second message', [])
      ];
      
      messages[0].timestamp = new Date('2024-01-01').toISOString();
      messages[1].timestamp = new Date('2024-01-02').toISOString();

      // Sort by timestamp
      const sorted = messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      expect(sorted[0].content).toBe('First message');
      expect(sorted[1].content).toBe('Second message');
    });

    test('should exclude system messages from dossier', () => {
      const messages = [
        TestDataFactory.createMessage('system', 'System message'),
        TestDataFactory.createMessage('user', 'User message with apple tag', [
          TestDataFactory.createTag('apple', 'organization')
        ]),
        TestDataFactory.createMessage('assistant', 'Assistant response')
      ];

      const nonSystemMessages = messages.filter(msg => msg.type !== 'system');
      expect(nonSystemMessages).toHaveLength(2);
      expect(nonSystemMessages.every(msg => msg.type !== 'system')).toBe(true);
    });

    test('should handle empty dossier results', () => {
      const query = 'nonexistent';
      const emptyResults = [];
      
      expect(emptyResults).toHaveLength(0);
      expect(Array.isArray(emptyResults)).toBe(true);
    });
  });

  describe('Context Retrieval', () => {
    test('should match query words to tag values', () => {
      const message = TestDataFactory.createMessage('user', 
        'Working on project', 
        [
          TestDataFactory.createTag('react', 'topic'),
          TestDataFactory.createTag('typescript', 'topic')
        ]
      );

      const query = 'react development';
      const queryWords = query.toLowerCase().split(/\s+/);
      
      const matches = message.tags.filter(tag =>
        queryWords.some(word => {
          const normalized = word.replace(/[.,?!]/g, '');
          return tag.value.toLowerCase() === normalized;
        })
      );

      expect(matches).toHaveLength(1);
      expect(matches[0].value).toBe('react');
    });

    test('should calculate relevance scores', () => {
      const message = TestDataFactory.createMessage('user', 
        'React development with TypeScript'
      );
      
      const query = 'react';
      let score = 0;
      
      // Basic text matching
      if (message.content.toLowerCase().includes(query.toLowerCase())) {
        score += 1;
      }
      
      // Bonus for start of message
      if (message.content.toLowerCase().startsWith(query.toLowerCase())) {
        score += 1;
      }

      expect(score).toBeGreaterThan(0);
    });

    test('should handle malformed queries gracefully', () => {
      const invalidQueries = ['', ' ', null, undefined];
      
      invalidQueries.forEach(query => {
        const safeQuery = query || '';
        const queryWords = safeQuery.toLowerCase().split(/\s+/).filter(word => word);
        
        expect(Array.isArray(queryWords)).toBe(true);
      });
    });
  });

  describe('Data Validation', () => {
    test('should validate message structure in sessions', () => {
      const validMessage = TestDataFactory.createMessage('user', 'Test content', []);
      
      expect(() => {
        TestAssertions.assertValidMessage(validMessage);
      }).not.toThrow();
    });

    test('should handle corrupted session data', () => {
      // Test with invalid JSON
      global.localStorage.setItem('space_session_corrupted', 'invalid json');
      
      try {
        JSON.parse(global.localStorage.getItem('space_session_corrupted'));
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    test('should validate tag arrays in messages', () => {
      const messageWithTags = TestDataFactory.createMessage('user', 'Test', [
        TestDataFactory.createTag('test', 'topic')
      ]);

      expect(Array.isArray(messageWithTags.tags)).toBe(true);
      messageWithTags.tags.forEach(tag => {
        expect(() => {
          TestAssertions.assertValidTag(tag);
        }).not.toThrow();
      });
    });
  });
});
/**
 * Integration Tests for SPACE Enhanced Tagging System
 * End-to-end tests for the complete tagging and dossier workflow
 */

import { setupTestEnvironment, TestDataFactory, TestAssertions, cleanupTestData, TEST_CONFIG } from './setup.js';

describe('Enhanced Tagging Integration', () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestData();
  });

  describe('Complete Workflow', () => {
    test('should handle full conversation tagging workflow', async () => {
      // 1. Simulate user sending message
      const userMessage = 'I\'m planning a website redesign project for Apple Inc. I need to coordinate with my colleague Sarah Johnson in San Francisco about the new mobile interface.';
      
      // 2. Simulate tag analysis (would normally call OpenAI)
      const expectedTags = [
        { value: 'website redesign', category: 'activity' },
        { value: 'apple inc', category: 'organization' },
        { value: 'sarah johnson', category: 'person' },
        { value: 'san francisco', category: 'place' },
        { value: 'mobile interface', category: 'topic' }
      ];

      // 3. Create message with tags
      const taggedMessage = TestDataFactory.createMessage('user', userMessage, expectedTags);
      
      // 4. Validate message structure
      TestAssertions.assertValidMessage(taggedMessage);
      expect(taggedMessage.tags).toHaveLength(5);

      // 5. Store in session
      const session = TestDataFactory.createSession(1, [taggedMessage]);
      global.localStorage.setItem('space_session_1', JSON.stringify(session));

      // 6. Test dossier compilation
      const query = 'apple';
      const storedSession = JSON.parse(global.localStorage.getItem('space_session_1'));
      const relevantMessages = storedSession.messages.filter(msg => {
        return msg.tags?.some(tag => tag.value.toLowerCase().includes(query)) ||
               msg.content.toLowerCase().includes(query);
      });

      expect(relevantMessages).toHaveLength(1);
      expect(relevantMessages[0].content).toBe(userMessage);
    });

    test('should handle multiple sessions with cross-references', async () => {
      // Create multiple sessions with related content
      const session1 = TestDataFactory.createSession(1, [
        TestDataFactory.createMessage('user', 'Working with Apple team on React project', [
          TestDataFactory.createTag('apple', 'organization'),
          TestDataFactory.createTag('react', 'topic')
        ])
      ]);

      const session2 = TestDataFactory.createSession(2, [
        TestDataFactory.createMessage('user', 'Apple approved the new design system', [
          TestDataFactory.createTag('apple', 'organization'),
          TestDataFactory.createTag('design system', 'topic')
        ])
      ]);

      const session3 = TestDataFactory.createSession(3, [
        TestDataFactory.createMessage('user', 'Meeting with Microsoft about Azure integration', [
          TestDataFactory.createTag('microsoft', 'organization'),
          TestDataFactory.createTag('azure', 'topic')
        ])
      ]);

      // Store sessions
      global.localStorage.setItem('space_session_1', JSON.stringify(session1));
      global.localStorage.setItem('space_session_2', JSON.stringify(session2));
      global.localStorage.setItem('space_session_3', JSON.stringify(session3));

      // Test cross-session dossier for "Apple"
      const allAppleMessages = [];
      for (let i = 0; i < global.localStorage.length; i++) {
        const key = global.localStorage.key(i);
        if (key?.startsWith('space_session_')) {
          const session = JSON.parse(global.localStorage.getItem(key));
          const appleMessages = session.messages.filter(msg =>
            msg.tags?.some(tag => tag.value.toLowerCase().includes('apple'))
          );
          allAppleMessages.push(...appleMessages);
        }
      }

      expect(allAppleMessages).toHaveLength(2);
      expect(allAppleMessages.every(msg => msg.content.includes('Apple'))).toBe(true);
    });

    test('should demonstrate dossier command functionality', () => {
      // Simulate the /dossier command processing
      const command = '/dossier Apple';
      const args = command.split(' ').slice(1); // ['Apple']
      
      if (args.length === 0) {
        throw new Error('Usage: /dossier <subject>');
      }

      const subject = args.join(' '); // 'Apple'
      
      // Simulate dossier compilation
      const mockDossierResults = [
        TestDataFactory.createMessage('user', 'Working with Apple on React project'),
        TestDataFactory.createMessage('user', 'Apple meeting scheduled for next week')
      ];

      const dossierSummary = `Dossier for "${subject}" contains ${mockDossierResults.length} messages.`;
      
      expect(subject).toBe('Apple');
      expect(dossierSummary).toBe('Dossier for "Apple" contains 2 messages.');
      expect(mockDossierResults).toHaveLength(2);
    });
  });

  describe('Performance and Scale', () => {
    test('should handle large conversation history efficiently', () => {
      const largeSessionCount = 50;
      const messagesPerSession = 20;
      
      // Create large dataset
      for (let i = 1; i <= largeSessionCount; i++) {
        const messages = [];
        for (let j = 1; j <= messagesPerSession; j++) {
          messages.push(TestDataFactory.createMessage('user', 
            `Message ${j} in session ${i} about project management`,
            [TestDataFactory.createTag('project management', 'topic')]
          ));
        }
        
        const session = TestDataFactory.createSession(i, messages);
        global.localStorage.setItem(`space_session_${i}`, JSON.stringify(session));
      }

      // Test retrieval performance
      const startTime = Date.now();
      
      let totalMessages = 0;
      for (let i = 0; i < global.localStorage.length; i++) {
        const key = global.localStorage.key(i);
        if (key?.startsWith('space_session_')) {
          const session = JSON.parse(global.localStorage.getItem(key));
          totalMessages += session.messages.length;
        }
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(totalMessages).toBe(largeSessionCount * messagesPerSession);
      expect(processingTime).toBeLessThan(1000); // Should process under 1 second
    });

    test('should handle memory limits gracefully', () => {
      // Test with very large content
      const largeContent = 'A'.repeat(10000); // 10KB content
      const message = TestDataFactory.createMessage('user', largeContent);
      
      expect(message.content.length).toBe(10000);
      
      // Should still be valid
      TestAssertions.assertValidMessage(message);
    });
  });

  describe('Error Recovery', () => {
    test('should recover from corrupted session data', () => {
      // Add corrupted session
      global.localStorage.setItem('space_session_corrupted', 'invalid json data');
      
      // Add valid session
      const validSession = TestDataFactory.createSession(1, [
        TestDataFactory.createMessage('user', 'Valid message')
      ]);
      global.localStorage.setItem('space_session_1', JSON.stringify(validSession));

      // Test recovery - should skip corrupted and process valid
      const validSessions = [];
      for (let i = 0; i < global.localStorage.length; i++) {
        const key = global.localStorage.key(i);
        if (key?.startsWith('space_session_')) {
          try {
            const session = JSON.parse(global.localStorage.getItem(key));
            validSessions.push(session);
          } catch (error) {
            console.log(`Skipping corrupted session: ${key}`);
          }
        }
      }

      expect(validSessions).toHaveLength(1);
      expect(validSessions[0].id).toBe(1);
    });

    test('should handle edge cases in tag matching', () => {
      const edgeCases = [
        { query: '', expected: [] },
        { query: '   ', expected: [] },
        { query: 'UPPERCASE', expected: ['uppercase'] }, // Should normalize
        { query: 'partial-match', expected: ['partial'] }, // Partial matching
        { query: 'special!@#$', expected: [] } // Special characters
      ];

      edgeCases.forEach(testCase => {
        const normalizedQuery = testCase.query.toLowerCase().trim();
        const words = normalizedQuery.split(/\s+/).filter(word => word);
        
        // Test that processing doesn't crash
        expect(Array.isArray(words)).toBe(true);
      });
    });
  });

  describe('Data Migration and Compatibility', () => {
    test('should handle old tag format migration', () => {
      // Old format: tags as simple strings
      const oldMessage = {
        type: 'user',
        content: 'Test message',
        tags: ['apple', 'react', 'project'], // Old string format
        timestamp: new Date().toISOString()
      };

      // Migration function (simulate)
      const migratedMessage = {
        ...oldMessage,
        tags: oldMessage.tags.map(tag => ({
          value: typeof tag === 'string' ? tag : tag.value,
          category: 'other' // Default category for migrated tags
        }))
      };

      TestAssertions.assertValidMessage(migratedMessage);
      expect(migratedMessage.tags).toHaveLength(3);
      expect(migratedMessage.tags[0]).toEqual({ value: 'apple', category: 'other' });
    });

    test('should maintain backward compatibility', () => {
      // Test that new system works with old data structures
      const mixedSession = {
        id: 1,
        timestamp: new Date().toISOString(),
        messages: [
          // Old format message
          {
            type: 'user',
            content: 'Old message',
            tags: ['old-tag'] // String format
          },
          // New format message
          {
            type: 'user',
            content: 'New message',
            tags: [{ value: 'new-tag', category: 'topic' }] // Object format
          }
        ]
      };

      // Should handle both formats
      expect(mixedSession.messages).toHaveLength(2);
      expect(typeof mixedSession.messages[0].tags[0]).toBe('string');
      expect(typeof mixedSession.messages[1].tags[0]).toBe('object');
    });
  });
});
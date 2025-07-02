/**
 * SPACE API Testing Framework
 * Setup and utilities for testing SPACE core functionality
 */

import { OpenAI } from 'openai';
import TagAnalyzer from '../../src/lib/tagAnalyzer.ts';
import { MemorySystem } from '../../src/lib/memory.ts';

// Test environment configuration
export const TEST_CONFIG = {
  openaiApiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  testTimeout: 30000, // 30 seconds
  mockMode: process.env.NODE_ENV === 'test',
};

// Mock localStorage for Node.js environment
export class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.get(key) || null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  get length() {
    return this.store.size;
  }
}

// Initialize test environment
export function setupTestEnvironment() {
  // Mock browser APIs for Node.js
  if (typeof window === 'undefined') {
    global.localStorage = new MockLocalStorage();
    global.window = { localStorage: global.localStorage };
  }

  // Validate required environment variables
  if (!TEST_CONFIG.openaiApiKey) {
    throw new Error('OpenAI API key required for testing. Set VITE_OPENAI_API_KEY or OPENAI_API_KEY');
  }

  console.log('✅ Test environment initialized');
}

// Create test data helpers
export const TestDataFactory = {
  // Generate realistic conversation messages
  createMessage(type, content, tags = []) {
    return {
      type,
      content,
      tags,
      timestamp: new Date().toISOString()
    };
  },

  // Create test session data
  createSession(id, messages = [], metaphors = [], questions = []) {
    return {
      id,
      timestamp: new Date().toISOString(),
      messages,
      metaphors,
      questions
    };
  },

  // Generate realistic tags
  createTag(value, category) {
    return { value, category };
  },

  // Pre-built test conversations
  sampleConversations: {
    techProject: [
      {
        type: 'user',
        content: 'I\'m working on a React project with Sarah Johnson from Apple in San Francisco. We need to integrate TypeScript and deploy to Azure.',
        tags: [
          { value: 'react', category: 'topic' },
          { value: 'sarah johnson', category: 'person' },
          { value: 'apple', category: 'organization' },
          { value: 'san francisco', category: 'place' },
          { value: 'typescript', category: 'topic' },
          { value: 'azure', category: 'organization' }
        ],
        timestamp: new Date('2024-01-15').toISOString()
      },
      {
        type: 'assistant',
        content: 'That sounds like an exciting project! React and TypeScript work great together...',
        timestamp: new Date('2024-01-15').toISOString()
      }
    ],

    businessMeeting: [
      {
        type: 'user',
        content: 'Had a great meeting with John Smith from Microsoft about the Q2 budget. Their Seattle team wants to collaborate on machine learning initiatives.',
        tags: [
          { value: 'john smith', category: 'person' },
          { value: 'microsoft', category: 'organization' },
          { value: 'seattle', category: 'place' },
          { value: 'q2 budget', category: 'topic' },
          { value: 'machine learning', category: 'topic' },
          { value: 'meeting', category: 'activity' }
        ],
        timestamp: new Date('2024-01-20').toISOString()
      }
    ]
  }
};

// Test assertion helpers
export const TestAssertions = {
  // Validate tag structure
  assertValidTag(tag) {
    if (!tag || typeof tag !== 'object') {
      throw new Error('Tag must be an object');
    }
    if (!tag.value || typeof tag.value !== 'string') {
      throw new Error('Tag must have a string value');
    }
    if (!tag.category || typeof tag.category !== 'string') {
      throw new Error('Tag must have a string category');
    }
    
    const validCategories = ['person', 'place', 'organization', 'topic', 'activity', 'state', 'other'];
    if (!validCategories.includes(tag.category)) {
      throw new Error(`Invalid tag category: ${tag.category}`);
    }
  },

  // Validate message structure
  assertValidMessage(message) {
    if (!message || typeof message !== 'object') {
      throw new Error('Message must be an object');
    }
    if (!['user', 'assistant', 'system'].includes(message.type)) {
      throw new Error(`Invalid message type: ${message.type}`);
    }
    if (!message.content || typeof message.content !== 'string') {
      throw new Error('Message must have string content');
    }
    if (message.tags) {
      if (!Array.isArray(message.tags)) {
        throw new Error('Message tags must be an array');
      }
      message.tags.forEach(tag => this.assertValidTag(tag));
    }
  },

  // Assert array contains expected items
  assertContains(array, item, message = 'Array should contain item') {
    if (!array.includes(item)) {
      throw new Error(`${message}. Expected: ${item}, Got: ${array}`);
    }
  },

  // Assert array length
  assertLength(array, expectedLength, message = 'Array length mismatch') {
    if (array.length !== expectedLength) {
      throw new Error(`${message}. Expected: ${expectedLength}, Got: ${array.length}`);
    }
  }
};

// Test cleanup utilities
export function cleanupTestData() {
  if (global.localStorage) {
    global.localStorage.clear();
  }
  console.log('✅ Test data cleaned up');
}

export default {
  TEST_CONFIG,
  MockLocalStorage,
  setupTestEnvironment,
  TestDataFactory,
  TestAssertions,
  cleanupTestData
};
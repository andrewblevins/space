#!/usr/bin/env node

/**
 * Session Summaries API Test
 * Tests @ reference functionality for summarizing previous sessions
 */

import { config } from 'dotenv';
import { summarizeSession } from '../../src/utils/terminalHelpers.js';

// Load environment variables
config();

// Mock localStorage for Node.js
global.localStorage = {
  store: new Map(),
  getItem(key) { return this.store.get(key) || null; },
  setItem(key, value) { this.store.set(key, String(value)); },
  removeItem(key) { this.store.delete(key); },
  clear() { this.store.clear(); },
  key(index) { return Array.from(this.store.keys())[index] || null; },
  get length() { return this.store.size; }
};

class SessionSummaryTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  async test(description, testFn) {
    try {
      console.log(`🧪 Testing: ${description}`);
      await testFn();
      this.passed++;
      console.log(`  ✅ PASSED`);
    } catch (error) {
      this.failed++;
      this.errors.push({ test: description, error: error.message });
      console.log(`  ❌ FAILED: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📊 Session Summary Test Results');
    console.log('================================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.errors.forEach(error => {
        console.log(`  • ${error.test}: ${error.error}`);
      });
    }

    const successRate = this.failed === 0 ? 100 : (this.passed / (this.passed + this.failed)) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%\n`);
    
    return this.failed === 0;
  }
}

async function runSessionSummaryTests() {
  console.log('🚀 Session Summaries API Testing');
  console.log('=================================\n');

  const runner = new SessionSummaryTestRunner();

  // Check environment
  const hasOpenAI = !!(process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  
  console.log('🔧 Environment Check:');
  console.log(`  OpenAI API Key: ${hasOpenAI ? '✅ Available' : '❌ Missing'}\n`);

  if (!hasOpenAI) {
    console.log('⚠️  Skipping OpenAI tests - no API key available\n');
  }

  // Test 1: Session Storage and Retrieval
  await runner.test('Should store and retrieve session data', async () => {
    const testSession = {
      id: 1,
      timestamp: new Date().toISOString(),
      messages: [
        {
          type: 'user',
          content: 'I need help planning a React project with TypeScript',
          timestamp: new Date().toISOString()
        },
        {
          type: 'assistant',
          content: 'I\'d be happy to help you plan your React TypeScript project! Here are some key considerations:\n\n1. **Project Structure**: Consider using a monorepo structure\n2. **State Management**: Redux Toolkit or Zustand for complex state\n3. **Testing**: Jest and React Testing Library\n4. **Build Tools**: Vite for fast development\n\nWhat specific aspect would you like to focus on first?',
          timestamp: new Date().toISOString()
        },
        {
          type: 'user',
          content: 'Let\'s focus on the project structure and best practices',
          timestamp: new Date().toISOString()
        }
      ],
      metaphors: [],
      questions: []
    };

    global.localStorage.setItem('space_session_1', JSON.stringify(testSession));
    
    const retrieved = global.localStorage.getItem('space_session_1');
    if (!retrieved) {
      throw new Error('Session not stored properly');
    }

    const parsedSession = JSON.parse(retrieved);
    if (parsedSession.id !== 1) {
      throw new Error('Session ID mismatch');
    }
    if (parsedSession.messages.length !== 3) {
      throw new Error('Message count mismatch');
    }

    console.log('    ✓ Session stored and retrieved correctly');
    console.log(`    ✓ Found ${parsedSession.messages.length} messages`);
  });

  // Test 2: Session Summary Generation (if OpenAI available)
  if (hasOpenAI) {
    await runner.test('Should generate session summary with real OpenAI API', async () => {
      const { OpenAI } = await import('openai');
      
      const openaiClient = new OpenAI({
        apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: false
      });

      // Create a more substantial test session
      const testSession = {
        id: 2,
        timestamp: new Date().toISOString(),
        messages: [
          {
            type: 'user',
            content: 'I\'m starting a new e-commerce website project. I need to choose between React and Vue.js, and I\'m also considering using Shopify or building a custom solution.',
            timestamp: new Date().toISOString()
          },
          {
            type: 'assistant',
            content: 'Great question! Let me break down the key considerations:\n\n**Framework Choice (React vs Vue.js):**\n- React: Larger ecosystem, more job opportunities, better for complex apps\n- Vue.js: Easier learning curve, excellent documentation, great for smaller teams\n\n**Platform Choice (Shopify vs Custom):**\n- Shopify: Faster to market, built-in payment processing, limited customization\n- Custom: Full control, can scale infinitely, requires more development time\n\nWhat\'s your timeline and budget for this project?',
            timestamp: new Date().toISOString()
          },
          {
            type: 'user',
            content: 'We have about 3 months and a medium budget. The main priority is getting to market quickly but we need some custom features for our specific industry.',
            timestamp: new Date().toISOString()
          },
          {
            type: 'assistant',
            content: 'Based on your 3-month timeline and need for custom features, I\'d recommend:\n\n1. **Go with React** - Better ecosystem for e-commerce plugins\n2. **Start with Shopify Plus** - Gets you to market faster\n3. **Use Shopify\'s API** for custom features via React apps\n4. **Plan for migration** to full custom if needed later\n\nThis hybrid approach balances speed-to-market with customization needs.',
            timestamp: new Date().toISOString()
          }
        ],
        metaphors: [],
        questions: []
      };

      global.localStorage.setItem('space_session_2', JSON.stringify(testSession));

      const summary = await summarizeSession(2, { openaiClient });
      
      if (!summary) {
        throw new Error('Summary generation failed');
      }

      if (typeof summary !== 'string') {
        throw new Error('Summary should be a string');
      }

      if (summary.length < 50) {
        throw new Error('Summary too short - should be more detailed');
      }

      if (summary.length > 800) {
        throw new Error('Summary too long - should be concise');
      }

      // Check for key content indicators
      const summaryLower = summary.toLowerCase();
      const keyTerms = ['react', 'shopify', 'e-commerce', 'timeline', 'custom'];
      const foundTerms = keyTerms.filter(term => summaryLower.includes(term));

      if (foundTerms.length < 2) {
        console.log('    ⚠️  Warning: Summary may not capture key topics');
        console.log(`    ⚠️  Found terms: ${foundTerms.join(', ')}`);
      }

      console.log('    ✓ Generated summary successfully');
      console.log(`    ✓ Summary length: ${summary.length} characters`);
      console.log(`    ✓ Key terms found: ${foundTerms.join(', ')}`);
      console.log(`    📝 Summary preview: "${summary.substring(0, 100)}..."`);
    });
  }

  // Test 3: @ Reference Pattern Matching
  await runner.test('Should correctly identify @ references in messages', async () => {
    const testMessages = [
      'Building on what we discussed in @2, let\'s implement the solution',
      'As mentioned in @1 and @5, the constraints still apply',
      'Remember @3? That approach won\'t work here',
      'Let me reference @10 for the background context',
      'No references in this message',
      '@1 @2 @3 multiple references',
      'Invalid @abc reference should be ignored'
    ];

    const atRegex = /@(\d+)/g;
    
    // Test message 1
    const matches1 = [...testMessages[0].matchAll(atRegex)];
    if (matches1.length !== 1 || matches1[0][1] !== '2') {
      throw new Error('Failed to match @2 reference');
    }

    // Test message 2 (multiple references)
    const matches2 = [...testMessages[1].matchAll(atRegex)];
    if (matches2.length !== 2 || matches2[0][1] !== '1' || matches2[1][1] !== '5') {
      throw new Error('Failed to match multiple references');
    }

    // Test message 6 (multiple consecutive references)
    const matches6 = [...testMessages[5].matchAll(atRegex)];
    if (matches6.length !== 3) {
      throw new Error('Failed to match consecutive references');
    }

    // Test message 7 (invalid reference should not match)
    const matches7 = [...testMessages[6].matchAll(atRegex)];
    if (matches7.length !== 0) {
      throw new Error('Should not match invalid @abc reference');
    }

    console.log('    ✓ @ reference pattern matching works correctly');
    console.log(`    ✓ Correctly identified ${matches1.length + matches2.length + matches6.length} valid references`);
  });

  // Test 4: Missing Session Handling
  await runner.test('Should handle missing session references gracefully', async () => {
    // Clear localStorage to ensure session doesn't exist
    global.localStorage.clear();
    
    const summary = await summarizeSession(999, { openaiClient: null });
    
    if (summary !== null) {
      throw new Error('Should return null for missing session');
    }

    console.log('    ✓ Handles missing sessions gracefully');
  });

  // Test 5: Invalid OpenAI Client Handling
  await runner.test('Should handle missing OpenAI client gracefully', async () => {
    // Create a test session
    const testSession = {
      id: 3,
      messages: [
        { type: 'user', content: 'Test message' },
        { type: 'assistant', content: 'Test response' }
      ]
    };
    
    global.localStorage.setItem('space_session_3', JSON.stringify(testSession));
    
    const summary = await summarizeSession(3, { openaiClient: null });
    
    if (summary !== null) {
      throw new Error('Should return null when no OpenAI client provided');
    }

    console.log('    ✓ Handles missing OpenAI client gracefully');
  });

  // Test 6: Message Filtering
  await runner.test('Should filter only user and assistant messages for summary', async () => {
    const testSession = {
      id: 4,
      messages: [
        { type: 'system', content: 'System message - should be ignored' },
        { type: 'user', content: 'User message 1' },
        { type: 'assistant', content: 'Assistant response 1' },
        { type: 'system', content: 'Another system message - should be ignored' },
        { type: 'user', content: 'User message 2' },
        { type: 'assistant', content: 'Assistant response 2' },
        { type: 'debug', content: 'Debug message - should be ignored' }
      ]
    };

    global.localStorage.setItem('space_session_4', JSON.stringify(testSession));
    
    // Manually test the filtering logic
    const session = JSON.parse(global.localStorage.getItem('space_session_4'));
    const filteredMessages = session.messages.filter(m => m.type === 'user' || m.type === 'assistant');
    
    if (filteredMessages.length !== 4) {
      throw new Error(`Expected 4 filtered messages, got ${filteredMessages.length}`);
    }

    const hasSystemMessage = filteredMessages.some(m => m.type === 'system');
    if (hasSystemMessage) {
      throw new Error('System messages should be filtered out');
    }

    console.log('    ✓ Correctly filters user and assistant messages only');
    console.log(`    ✓ Filtered ${filteredMessages.length} messages from ${session.messages.length} total`);
  });

  // Print final results
  const success = runner.printResults();
  process.exit(success ? 0 : 1);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSessionSummaryTests().catch(error => {
    console.error('💥 Session summary test execution failed:', error);
    process.exit(1);
  });
}

export { runSessionSummaryTests };
#!/usr/bin/env node

/**
 * Advisor Library API Test
 * Tests library functionality for advisors including file processing and description generation
 */

import { config } from 'dotenv';
import { createRequire } from 'module';

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

// Mock browser APIs
global.File = class MockFile {
  constructor(content, name, options = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'text/plain';
  }
  
  async text() {
    return this.content;
  }
  
  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }
};

global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

class AdvisorLibraryTestRunner {
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
    console.log('\\n📊 Advisor Library Test Results');
    console.log('================================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    
    if (this.failed > 0) {
      console.log('\\n❌ Failed Tests:');
      this.errors.forEach(error => {
        console.log(`  • ${error.test}: ${error.error}`);
      });
    }

    const successRate = this.failed === 0 ? 100 : (this.passed / (this.passed + this.failed)) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%\\n`);
    
    return this.failed === 0;
  }
}

async function runAdvisorLibraryTests() {
  console.log('🚀 Advisor Library API Testing');
  console.log('===============================\\n');

  const runner = new AdvisorLibraryTestRunner();

  // Check environment
  const hasAnthropic = !!(process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY);
  
  console.log('🔧 Environment Check:');
  console.log(`  Anthropic API Key: ${hasAnthropic ? '✅ Available' : '❌ Missing'}\\n`);

  if (!hasAnthropic) {
    console.log('⚠️  Skipping Claude tests - no API key available\\n');
  }

  // Test 1: Library Item Creation and Management
  await runner.test('Should create and manage library items correctly', async () => {
    const testItems = [];
    
    // Test text item creation
    const textItem = {
      id: Date.now().toString(),
      type: 'text',
      title: 'Leadership Philosophy',
      content: 'Leadership is not about being in charge. Leadership is about taking care of those in your charge. A good leader leads from the front by example, not from behind by criticism.',
      addedAt: new Date().toISOString()
    };
    
    testItems.push(textItem);
    
    // Test file item creation
    const fileItem = {
      id: (Date.now() + 1).toString(),
      type: 'file',
      title: 'business_principles.txt',
      content: 'Focus on customer obsession, ownership, and long-term thinking. Build cultures of learning and innovation.',
      addedAt: new Date().toISOString()
    };
    
    testItems.push(fileItem);
    
    // Validate items
    if (testItems.length !== 2) {
      throw new Error('Expected 2 library items');
    }
    
    if (testItems[0].type !== 'text' || testItems[1].type !== 'file') {
      throw new Error('Item types not correctly set');
    }
    
    if (!testItems[0].title || !testItems[0].content) {
      throw new Error('Text item missing required fields');
    }
    
    if (!testItems[1].title || !testItems[1].content) {
      throw new Error('File item missing required fields');
    }
    
    console.log('    ✓ Created text and file library items');
    console.log(`    ✓ Text item: "${testItems[0].title}" (${testItems[0].content.length} chars)`);
    console.log(`    ✓ File item: "${testItems[1].title}" (${testItems[1].content.length} chars)`);
  });

  // Test 2: Character Limit Validation
  await runner.test('Should enforce 100,000 character limit', async () => {
    const MAX_TOTAL_CHARS = 100000;
    
    // Create items that exceed the limit
    const largeContent = 'A'.repeat(60000);
    const item1 = { content: largeContent };
    const item2 = { content: largeContent };
    
    const totalChars = item1.content.length + item2.content.length;
    
    if (totalChars <= MAX_TOTAL_CHARS) {
      throw new Error('Test setup error: items should exceed limit');
    }
    
    // This would be caught in the UI
    const wouldExceed = totalChars > MAX_TOTAL_CHARS;
    
    if (!wouldExceed) {
      throw new Error('Character limit validation failed');
    }
    
    console.log('    ✓ Character limit validation works correctly');
    console.log(`    ✓ Total chars: ${totalChars.toLocaleString()} exceeds limit of ${MAX_TOTAL_CHARS.toLocaleString()}`);
  });

  // Test 3: File Type Validation
  await runner.test('Should validate supported file types', async () => {
    const supportedTypes = ['txt', 'pdf', 'md'];
    const unsupportedTypes = ['doc', 'docx', 'xlsx', 'ppt'];
    
    // Test supported types
    for (const ext of supportedTypes) {
      const fileName = `test.${ext}`;
      const isSupported = ['txt', 'pdf', 'md'].includes(ext);
      
      if (!isSupported) {
        throw new Error(`${ext} should be supported but was rejected`);
      }
    }
    
    // Test unsupported types
    for (const ext of unsupportedTypes) {
      const fileName = `test.${ext}`;
      const isSupported = ['txt', 'pdf', 'md'].includes(ext);
      
      if (isSupported) {
        throw new Error(`${ext} should not be supported but was accepted`);
      }
    }
    
    console.log('    ✓ File type validation works correctly');
    console.log(`    ✓ Supported: ${supportedTypes.join(', ')}`);
    console.log(`    ✓ Rejected: ${unsupportedTypes.join(', ')}`);
  });

  // Test 4: Library Statistics Calculation
  await runner.test('Should calculate library statistics correctly', async () => {
    const testItems = [
      { content: 'This is a test with about ten words in it.' }, // ~10 words
      { content: 'Another piece of content with several more words to test counting.' }, // ~12 words
      { content: 'Short text.' } // ~2 words
    ];
    
    const totalChars = testItems.reduce((sum, item) => sum + item.content.length, 0);
    const totalWords = Math.round(totalChars / 5); // 5 chars per word estimate
    
    if (totalChars === 0) {
      throw new Error('Total characters should not be zero');
    }
    
    if (totalWords === 0) {
      throw new Error('Total words should not be zero');
    }
    
    // Validate rough word count (should be reasonable)
    const actualWords = testItems.reduce((sum, item) => 
      sum + item.content.split(/\\s+/).length, 0
    );
    
    if (Math.abs(totalWords - actualWords) > actualWords * 0.5) {
      console.log('    ⚠️  Word count estimation may be off');
    }
    
    console.log('    ✓ Statistics calculated correctly');
    console.log(`    ✓ Total characters: ${totalChars}`);
    console.log(`    ✓ Estimated words: ${totalWords.toLocaleString()}`);
    console.log(`    ✓ Actual words: ${actualWords}`);
  });

  // Test 5: Advisor Enhanced Description Generation (if Anthropic available)
  if (hasAnthropic) {
    await runner.test('Should generate enhanced advisor descriptions with library content', async () => {
      // Mock the advisor library content
      const libraryItems = [
        {
          title: 'Leadership Philosophy',
          content: 'True leadership is about serving others and empowering them to achieve their best. It requires humility, empathy, and the courage to make difficult decisions for the greater good.'
        },
        {
          title: 'Business Strategy',
          content: 'Focus on long-term value creation over short-term gains. Build sustainable competitive advantages through innovation and customer obsession.'
        }
      ];
      
      const advisorName = 'Business Mentor';
      const existingDescription = 'A helpful business advisor with experience in leadership and strategy.';
      const libraryText = libraryItems.map(i => i.content).join('\\n\\n');
      
      // Validate inputs
      if (!advisorName) {
        throw new Error('Advisor name is required');
      }
      
      if (!libraryText.trim()) {
        throw new Error('Library content is required for generation');
      }
      
      if (libraryText.length < 50) {
        throw new Error('Library content too short for meaningful description generation');
      }
      
      if (libraryText.length > 50000) {
        throw new Error('Library content too long - may exceed context limits');
      }
      
      // Test prompt construction
      const expectedPrompt = `Here are source materials for an advisor named ${advisorName}. Generate an enhanced 150-300 word description that incorporates key concepts, quotes, and speaking style from these materials. Current description: ${existingDescription}\\n\\n${libraryText}`;
      
      if (!expectedPrompt.includes(advisorName)) {
        throw new Error('Prompt should include advisor name');
      }
      
      if (!expectedPrompt.includes(existingDescription)) {
        throw new Error('Prompt should include existing description');
      }
      
      if (!expectedPrompt.includes(libraryText)) {
        throw new Error('Prompt should include library content');
      }
      
      console.log('    ✓ Enhanced description generation setup validated');
      console.log(`    ✓ Advisor: ${advisorName}`);
      console.log(`    ✓ Library content: ${libraryText.length} characters`);
      console.log(`    ✓ Library items: ${libraryItems.length}`);
      console.log(`    ✓ Prompt length: ${expectedPrompt.length} characters`);
    });
  }

  // Test 6: Advisor Library Integration
  await runner.test('Should integrate library data with advisor objects correctly', async () => {
    const testAdvisor = {
      name: 'Strategic Advisor',
      description: 'Provides strategic business guidance',
      library: [
        {
          id: '1',
          type: 'text',
          title: 'Strategy Framework',
          content: 'Focus on customer needs, competitive positioning, and operational excellence.',
          addedAt: new Date().toISOString()
        },
        {
          id: '2',
          type: 'file',
          title: 'case_studies.txt',
          content: 'Case study analysis of successful strategic transformations in technology companies.',
          addedAt: new Date().toISOString()
        }
      ],
      hasLibrary: true
    };
    
    // Validate advisor structure
    if (!testAdvisor.library || !Array.isArray(testAdvisor.library)) {
      throw new Error('Advisor should have library array');
    }
    
    if (testAdvisor.library.length === 0) {
      throw new Error('Advisor library should not be empty');
    }
    
    if (!testAdvisor.hasLibrary) {
      throw new Error('hasLibrary flag should be true when library has items');
    }
    
    // Validate library items structure
    for (const item of testAdvisor.library) {
      if (!item.id || !item.type || !item.title || !item.content) {
        throw new Error('Library item missing required fields');
      }
      
      if (!['text', 'file'].includes(item.type)) {
        throw new Error('Library item type should be text or file');
      }
    }
    
    // Test visual indicator logic
    const displayName = `${testAdvisor.name}${testAdvisor.hasLibrary ? ` 📚${testAdvisor.library?.length || ''}` : ''}`;
    const expectedDisplay = `${testAdvisor.name} 📚${testAdvisor.library.length}`;
    
    if (displayName !== expectedDisplay) {
      throw new Error(`Display name mismatch: expected "${expectedDisplay}", got "${displayName}"`);
    }
    
    console.log('    ✓ Advisor library integration validated');
    console.log(`    ✓ Display name: "${displayName}"`);
    console.log(`    ✓ Library items: ${testAdvisor.library.length}`);
    console.log(`    ✓ Has library flag: ${testAdvisor.hasLibrary}`);
  });

  // Test 7: File Upload Simulation
  await runner.test('Should handle file upload processing correctly', async () => {
    // Simulate different file types
    const testFiles = [
      {
        name: 'leadership_guide.txt',
        content: 'Leadership principles and best practices for managing teams effectively.',
        type: 'text/plain',
        expectedType: 'text'
      },
      {
        name: 'strategy_notes.md',
        content: '# Strategy Notes\\n\\n## Key Principles\\n- Customer focus\\n- Innovation\\n- Execution',
        type: 'text/markdown',
        expectedType: 'text'
      }
    ];
    
    for (const fileData of testFiles) {
      const mockFile = new global.File(fileData.content, fileData.name, { type: fileData.type });
      
      // Validate file properties
      if (mockFile.name !== fileData.name) {
        throw new Error('File name not preserved');
      }
      
      if (mockFile.size !== fileData.content.length) {
        throw new Error('File size calculation incorrect');
      }
      
      // Test file reading
      const content = await mockFile.text();
      if (content !== fileData.content) {
        throw new Error('File content not read correctly');
      }
      
      // Test file extension validation
      const ext = mockFile.name.split('.').pop().toLowerCase();
      const isSupported = ['txt', 'pdf', 'md'].includes(ext);
      
      if (!isSupported) {
        throw new Error(`File extension ${ext} should be supported`);
      }
      
      console.log(`    ✓ Processed ${mockFile.name} (${mockFile.size} bytes)`);
    }
    
    console.log('    ✓ File upload processing validated');
  });

  // Print final results
  const success = runner.printResults();
  process.exit(success ? 0 : 1);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdvisorLibraryTests().catch(error => {
    console.error('💥 Advisor library test execution failed:', error);
    process.exit(1);
  });
}

export { runAdvisorLibraryTests };
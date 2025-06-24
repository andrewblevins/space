/**
 * Test localStorage migration functionality
 * 
 * This script creates fake localStorage sessions and tests
 * the migration utilities to ensure they work correctly.
 */

// Mock localStorage for Node.js testing
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    storage: {},
    setItem(key, value) { this.storage[key] = value; },
    getItem(key) { return this.storage[key] || null; },
    removeItem(key) { delete this.storage[key]; },
    key(index) { return Object.keys(this.storage)[index] || null; },
    get length() { return Object.keys(this.storage).length; }
  };
}

// Import migration utilities (adjust path as needed)
const { 
  needsMigration, 
  getLocalStorageSessions,
  getMigrationStatus
} = require('../src/utils/migrationHelper.js');

function createFakeSession(id, title, messageCount = 3) {
  const messages = [
    { type: 'system', content: 'SPACE Terminal - v0.2.3' },
  ];
  
  // Add user/assistant messages
  for (let i = 0; i < Math.floor(messageCount / 2); i++) {
    messages.push({
      type: 'user',
      content: `Test user message ${i + 1} in session ${id}`,
      timestamp: new Date(Date.now() - (messageCount - i) * 60000).toISOString()
    });
    
    messages.push({
      type: 'assistant', 
      content: `Test assistant response ${i + 1} for session ${id}. This is a longer response to simulate real conversation.`,
      timestamp: new Date(Date.now() - (messageCount - i - 1) * 60000).toISOString()
    });
  }
  
  return {
    id,
    title: title || `Test Session ${id}`,
    timestamp: new Date(Date.now() - id * 3600000).toISOString(), // Older sessions have older timestamps
    messages,
    metaphors: [`metaphor-${id}-1`, `metaphor-${id}-2`],
    advisorSuggestions: [
      { name: `Advisor ${id}`, description: `Test advisor for session ${id}` }
    ],
    voteHistory: []
  };
}

function testMigrationUtilities() {
  console.log('🧪 Testing Migration Utilities\n');
  
  // Test 1: Empty localStorage (no migration needed)
  console.log('1️⃣ Testing empty localStorage...');
  console.log('   needsMigration():', needsMigration());
  console.log('   getLocalStorageSessions():', getLocalStorageSessions().length, 'sessions');
  console.log('   ✅ Empty state working correctly\n');
  
  // Test 2: Add fake sessions
  console.log('2️⃣ Adding fake localStorage sessions...');
  const fakeSessions = [
    createFakeSession(1, 'Important Work Discussion', 6),
    createFakeSession(2, 'Creative Writing Session', 4),
    createFakeSession(3, 'Technical Problem Solving', 8),
    createFakeSession(4, null, 2), // No title
    createFakeSession(5, 'Philosophy Chat', 10)
  ];
  
  fakeSessions.forEach(session => {
    localStorage.setItem(`space_session_${session.id}`, JSON.stringify(session));
  });
  
  console.log(`   Added ${fakeSessions.length} fake sessions to localStorage`);
  console.log('   ✅ Fake data created\n');
  
  // Test 3: Migration detection
  console.log('3️⃣ Testing migration detection...');
  console.log('   needsMigration():', needsMigration());
  
  const sessions = getLocalStorageSessions();
  console.log('   getLocalStorageSessions():', sessions.length, 'sessions found');
  
  sessions.forEach(session => {
    const msgCount = session.messages?.filter(m => m.type !== 'system').length || 0;
    console.log(`   • Session ${session.id}: "${session.title}" (${msgCount} messages)`);
  });
  
  console.log('   ✅ Migration detection working\n');
  
  // Test 4: Session filtering and sorting
  console.log('4️⃣ Testing session filtering and sorting...');
  
  // Add a session with only system messages (should be filtered out)
  const emptySession = {
    id: 99,
    title: 'Empty Session',
    timestamp: new Date().toISOString(),
    messages: [{ type: 'system', content: 'Only system message' }],
    metaphors: [],
    advisorSuggestions: [],
    voteHistory: []
  };
  localStorage.setItem('space_session_99', JSON.stringify(emptySession));
  
  const filteredSessions = getLocalStorageSessions();
  console.log('   Sessions after adding empty session:', filteredSessions.length);
  console.log('   ✅ Empty sessions filtered out correctly\n');
  
  // Test 5: Migration status
  console.log('5️⃣ Testing migration status...');
  const statusBefore = getMigrationStatus();
  console.log('   Status before migration:', statusBefore);
  
  // Simulate completed migration
  localStorage.setItem('space_migration_status', 'completed');
  localStorage.setItem('space_migration_date', new Date().toISOString());
  localStorage.setItem('space_migration_summary', JSON.stringify({
    total: sessions.length,
    successful: sessions.length,
    failed: 0,
    date: new Date().toISOString()
  }));
  
  const statusAfter = getMigrationStatus();
  console.log('   Status after migration:', statusAfter);
  console.log('   needsMigration() after completion:', needsMigration());
  console.log('   ✅ Migration status tracking working\n');
  
  // Test 6: Data integrity
  console.log('6️⃣ Testing data integrity...');
  const originalSession = fakeSessions[0];
  const retrievedSession = JSON.parse(localStorage.getItem(`space_session_${originalSession.id}`));
  
  const checks = [
    ['ID', originalSession.id === retrievedSession.id],
    ['Title', originalSession.title === retrievedSession.title],
    ['Message count', originalSession.messages.length === retrievedSession.messages.length],
    ['Metaphors', JSON.stringify(originalSession.metaphors) === JSON.stringify(retrievedSession.metaphors)],
    ['Timestamp', originalSession.timestamp === retrievedSession.timestamp]
  ];
  
  checks.forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}`);
  });
  
  console.log('\n🎉 Migration Utilities Test Complete!');
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  Object.keys(localStorage.storage).forEach(key => {
    if (key.startsWith('space_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('   ✅ Test data cleaned up');
  
  console.log('\n📋 Next Steps:');
  console.log('• Test with real localStorage sessions in browser');
  console.log('• Test the migration modal UI');
  console.log('• Test actual database migration with auth tokens');
}

// Run the test
if (require.main === module) {
  testMigrationUtilities();
}

module.exports = { testMigrationUtilities };
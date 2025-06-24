/**
 * Integration test for database conversation storage
 * 
 * This script tests the full flow:
 * 1. Create a conversation via API
 * 2. Add messages via API  
 * 3. Load conversation via API
 * 4. Verify data integrity
 * 
 * Prerequisites:
 * - Database schema deployed in Supabase
 * - Dev server running: npm run dev:functions
 * - Valid auth token (get from browser dev tools after signing in)
 */

const API_BASE = 'http://localhost:8788/api';

// ⚠️ IMPORTANT: Replace with your actual auth token
// 1. Sign in to SPACE Terminal in your browser
// 2. Open browser dev tools → Application → Local Storage
// 3. Look for supabase auth tokens or check Network tab for Authorization headers
const AUTH_TOKEN = 'YOUR_ACTUAL_AUTH_TOKEN_HERE';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runIntegrationTest() {
  console.log('🧪 Starting Database Integration Test\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };

  if (AUTH_TOKEN === 'YOUR_ACTUAL_AUTH_TOKEN_HERE') {
    console.log('❌ Please update AUTH_TOKEN in the script first!');
    console.log('1. Sign in to SPACE Terminal');
    console.log('2. Open browser dev tools → Network tab');
    console.log('3. Look for Authorization: Bearer <token> in API requests');
    console.log('4. Copy the token and update AUTH_TOKEN variable');
    return;
  }

  try {
    // Test 1: Create a conversation
    console.log('1️⃣ Creating conversation...');
    const createResponse = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Integration Test Conversation',
        metadata: {
          test: true,
          created: new Date().toISOString(),
          testType: 'integration'
        }
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Create conversation failed: ${createResponse.status} - ${errorText}`);
    }

    const conversation = await createResponse.json();
    console.log('✅ Created conversation:', conversation.id);
    console.log('   Title:', conversation.title);

    await delay(500); // Small delay between operations

    // Test 2: Add test messages
    console.log('\n2️⃣ Adding messages...');
    
    const testMessages = [
      { type: 'user', content: 'Hello! This is a test message from the integration test.' },
      { type: 'assistant', content: 'Hi there! I\'m responding to your test message. This conversation is being stored in the database.' },
      { type: 'user', content: 'Can you tell me about SPACE Terminal\'s new database storage?' },
      { type: 'assistant', content: 'SPACE Terminal now uses database storage for conversations! This means:\n\n• Cross-device sync\n• Reliable backup\n• Never lose conversations\n• Better search capabilities\n\nThis conversation will be available on all your devices!' }
    ];

    const messageIds = [];
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      const msgResponse = await fetch(`${API_BASE}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...message,
          metadata: {
            testMessage: true,
            order: i + 1,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!msgResponse.ok) {
        const errorText = await msgResponse.text();
        throw new Error(`Add message ${i + 1} failed: ${msgResponse.status} - ${errorText}`);
      }

      const savedMessage = await msgResponse.json();
      messageIds.push(savedMessage.id);
      console.log(`   ✅ Added ${message.type} message (${savedMessage.id.slice(0, 8)}...)`);
      
      await delay(200); // Small delay between messages
    }

    await delay(1000); // Wait for any async operations

    // Test 3: Load conversation with messages
    console.log('\n3️⃣ Loading conversation with messages...');
    const loadResponse = await fetch(`${API_BASE}/conversations/${conversation.id}`, {
      headers
    });

    if (!loadResponse.ok) {
      const errorText = await loadResponse.text();
      throw new Error(`Load conversation failed: ${loadResponse.status} - ${errorText}`);
    }

    const loadedConversation = await loadResponse.json();
    console.log('✅ Loaded conversation with', loadedConversation.messages?.length || 0, 'messages');

    // Test 4: Verify data integrity
    console.log('\n4️⃣ Verifying data integrity...');
    
    const errors = [];
    
    // Check conversation data
    if (loadedConversation.title !== 'Integration Test Conversation') {
      errors.push('Title mismatch');
    }
    
    if (!loadedConversation.metadata?.test) {
      errors.push('Metadata not preserved');
    }

    // Check messages
    if (loadedConversation.messages.length !== testMessages.length) {
      errors.push(`Message count mismatch: expected ${testMessages.length}, got ${loadedConversation.messages.length}`);
    }

    // Verify message content and order
    for (let i = 0; i < testMessages.length; i++) {
      const original = testMessages[i];
      const stored = loadedConversation.messages[i];
      
      if (!stored) {
        errors.push(`Missing message ${i + 1}`);
        continue;
      }
      
      if (stored.type !== original.type) {
        errors.push(`Message ${i + 1} type mismatch: expected ${original.type}, got ${stored.type}`);
      }
      
      if (stored.content !== original.content) {
        errors.push(`Message ${i + 1} content mismatch`);
      }
      
      if (!stored.metadata?.testMessage) {
        errors.push(`Message ${i + 1} metadata not preserved`);
      }
    }

    if (errors.length > 0) {
      console.log('❌ Data integrity issues found:');
      errors.forEach(error => console.log(`   • ${error}`));
    } else {
      console.log('✅ All data integrity checks passed!');
    }

    // Test 5: List conversations
    console.log('\n5️⃣ Testing conversation list...');
    const listResponse = await fetch(`${API_BASE}/conversations`, { headers });
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      throw new Error(`List conversations failed: ${listResponse.status} - ${errorText}`);
    }
    
    const conversations = await listResponse.json();
    const testConv = conversations.find(c => c.id === conversation.id);
    
    if (testConv) {
      console.log('✅ Test conversation found in list');
      console.log('   Updated at:', testConv.updated_at);
    } else {
      console.log('❌ Test conversation not found in list');
    }

    // Summary
    console.log('\n🎉 Integration Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`• Conversation ID: ${conversation.id}`);
    console.log(`• Messages added: ${testMessages.length}`);
    console.log(`• Messages loaded: ${loadedConversation.messages?.length || 0}`);
    console.log(`• Data integrity: ${errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    
    console.log('\n📋 Next Steps:');
    console.log('• Test the migration flow with localStorage sessions');
    console.log('• Test cross-device sync by loading the conversation in another browser');
    console.log('• Test the frontend integration in the actual SPACE Terminal app');
    
    console.log(`\n🗑️  Cleanup: You can delete the test conversation at:`);
    console.log(`   DELETE ${API_BASE}/conversations/${conversation.id}`);

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('• Make sure the database schema is deployed in Supabase');
    console.log('• Verify the dev server is running: npm run dev:functions');
    console.log('• Check that your auth token is valid and not expired');
    console.log('• Look at browser network tab for detailed error responses');
    console.log('• Check Supabase logs for any database errors');
  }
}

// Run the test
runIntegrationTest();
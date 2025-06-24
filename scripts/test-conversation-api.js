/**
 * Test script for conversation API endpoints
 * Run with: node scripts/test-conversation-api.js
 * 
 * Note: You'll need to:
 * 1. Run the database schema in Supabase first
 * 2. Start the local dev server: npm run dev:functions
 * 3. Get a real auth token from the app (check browser dev tools)
 * 4. Update the AUTH_TOKEN variable below
 */

const API_BASE = 'http://localhost:8788/api';
const AUTH_TOKEN = 'YOUR_ACTUAL_AUTH_TOKEN_HERE'; // Get from browser dev tools

async function testAPI() {
  console.log('🧪 Testing Conversation API Endpoints\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  };

  try {
    // Test 1: Create a conversation
    console.log('1. Creating conversation...');
    const createResponse = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Test Conversation',
        metadata: { test: true }
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status} ${await createResponse.text()}`);
    }
    
    const conversation = await createResponse.json();
    console.log('✅ Created:', conversation.id);

    // Test 2: Add messages to conversation
    console.log('\n2. Adding messages...');
    
    const messages = [
      { type: 'user', content: 'Hello, this is a test message!' },
      { type: 'assistant', content: 'Hi there! This is a test response.' },
      { type: 'user', content: 'How are you doing today?' }
    ];

    for (const message of messages) {
      const msgResponse = await fetch(`${API_BASE}/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(message)
      });
      
      if (!msgResponse.ok) {
        throw new Error(`Message add failed: ${msgResponse.status} ${await msgResponse.text()}`);
      }
      
      const savedMessage = await msgResponse.json();
      console.log(`✅ Added ${message.type} message:`, savedMessage.id);
    }

    // Test 3: Get conversation with messages
    console.log('\n3. Fetching conversation with messages...');
    const getResponse = await fetch(`${API_BASE}/conversations/${conversation.id}`, {
      headers
    });
    
    if (!getResponse.ok) {
      throw new Error(`Get failed: ${getResponse.status} ${await getResponse.text()}`);
    }
    
    const fullConversation = await getResponse.json();
    console.log('✅ Fetched conversation with', fullConversation.messages?.length || 0, 'messages');

    // Test 4: List all conversations
    console.log('\n4. Listing all conversations...');
    const listResponse = await fetch(`${API_BASE}/conversations`, {
      headers
    });
    
    if (!listResponse.ok) {
      throw new Error(`List failed: ${listResponse.status} ${await listResponse.text()}`);
    }
    
    const conversations = await listResponse.json();
    console.log('✅ Found', conversations.length, 'conversations');

    // Test 5: Update conversation
    console.log('\n5. Updating conversation...');
    const updateResponse = await fetch(`${API_BASE}/conversations/${conversation.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: 'Updated Test Conversation',
        metadata: { test: true, updated: true }
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status} ${await updateResponse.text()}`);
    }
    
    const updated = await updateResponse.json();
    console.log('✅ Updated conversation:', updated.title);

    // Test 6: Delete conversation (optional - uncomment to test)
    // console.log('\n6. Deleting conversation...');
    // const deleteResponse = await fetch(`${API_BASE}/conversations/${conversation.id}`, {
    //   method: 'DELETE',
    //   headers
    // });
    // 
    // if (!deleteResponse.ok) {
    //   throw new Error(`Delete failed: ${deleteResponse.status} ${await deleteResponse.text()}`);
    // }
    // 
    // console.log('✅ Deleted conversation');

    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('- Implement frontend hook (useConversationStorage)');
    console.log('- Update Terminal.jsx to use database storage');
    console.log('- Add localStorage migration helper');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure you ran the database schema in Supabase');
    console.log('- Check that the dev server is running: npm run dev:functions');
    console.log('- Verify your auth token is valid (get from browser dev tools)');
    console.log('- Check browser network tab for detailed error responses');
  }
}

// Run tests
testAPI();
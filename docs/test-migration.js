// Test Migration Script
// Copy and paste this into browser console to test migration functionality

// Create test conversation 1
localStorage.setItem('space_session_1', JSON.stringify({
  id: '1',
  title: 'Test Conversation 1',
  messages: [
    {
      type: 'user',
      content: 'Hello, I need help with a project',
      timestamp: new Date().toISOString()
    },
    {
      type: 'assistant',
      content: 'I would be happy to help! What kind of project are you working on?',
      timestamp: new Date().toISOString()
    }
  ],
  metaphors: ['project as journey'],
  advisorSuggestions: [],
  created: new Date().toISOString(),
  lastModified: new Date().toISOString()
}));

// Create test conversation 2
localStorage.setItem('space_session_2', JSON.stringify({
  id: '2',
  title: 'Test Conversation 2',
  messages: [
    {
      type: 'user',
      content: 'Can you explain React hooks?',
      timestamp: new Date().toISOString()
    },
    {
      type: 'assistant',
      content: 'React hooks are functions that let you use state and lifecycle features',
      timestamp: new Date().toISOString()
    }
  ],
  metaphors: [],
  advisorSuggestions: ['JavaScript Expert'],
  created: new Date().toISOString(),
  lastModified: new Date().toISOString()
}));

// Reset migration status
localStorage.removeItem('space_migration_status');
localStorage.removeItem('space_migration_date');
localStorage.removeItem('space_migration_summary');

// Reload page to trigger migration
location.reload();
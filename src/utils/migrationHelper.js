/**
 * Migration utilities for moving localStorage sessions to database
 */

// Check if migration is needed
export function needsMigration() {
  const migrationStatus = localStorage.getItem('space_migration_status');
  if (migrationStatus === 'completed') {
    return false;
  }
  
  // Check if there are any localStorage sessions to migrate
  const sessionKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('space_session_')) {
      sessionKeys.push(key);
    }
  }
  
  return sessionKeys.length > 0;
}

// Get all localStorage sessions
export function getLocalStorageSessions() {
  const sessions = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('space_session_')) {
      try {
        const sessionData = JSON.parse(localStorage.getItem(key));
        if (sessionData && sessionData.id) {
          sessions.push({
            ...sessionData,
            storageKey: key
          });
        }
      } catch (error) {
        console.warn(`Failed to parse session ${key}:`, error);
      }
    }
  }
  
  return sessions.sort((a, b) => {
    // Sort by timestamp if available, otherwise by ID
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return timeB - timeA; // Most recent first
  });
}

// Migrate a single session to database
export async function migrateSession(session, storage) {
  try {
    console.log('🔄 Migrating session:', session.id);
    
    // Create conversation in database
    const conversation = await storage.createConversation(
      session.title || `Imported Session ${session.id}`,
      {
        // Preserve session-level data
        metaphors: session.metaphors || [],
        advisorSuggestions: session.advisorSuggestions || [],
        voteHistory: session.voteHistory || [],
        
        // Migration metadata
        importedFrom: 'localStorage',
        originalId: session.id,
        originalTimestamp: session.timestamp,
        migrationDate: new Date().toISOString()
      }
    );

    // Add all messages to the conversation
    if (session.messages && session.messages.length > 0) {
      // Filter out system-only sessions (these are usually empty)
      const meaningfulMessages = session.messages.filter(msg => 
        msg.type !== 'system' || (msg.content && msg.content.trim())
      );
      
      if (meaningfulMessages.length > 0) {
        await storage.addMessages(conversation.id, meaningfulMessages.map(msg => ({
          type: msg.type,
          content: msg.content,
          metadata: {
            tags: msg.tags || [],
            timestamp: msg.timestamp,
            imported: true,
            originalIndex: session.messages.indexOf(msg)
          }
        })));
      }
    }

    console.log('✅ Migrated session:', session.id, '→', conversation.id);
    return {
      success: true,
      originalId: session.id,
      newId: conversation.id,
      messageCount: session.messages?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Failed to migrate session:', session.id, error);
    return {
      success: false,
      originalId: session.id,
      error: error.message
    };
  }
}

// Migrate all localStorage sessions
export async function migrateAllSessions(storage, onProgress = null) {
  const sessions = getLocalStorageSessions();
  
  if (sessions.length === 0) {
    console.log('📦 No sessions to migrate');
    return { total: 0, successful: 0, failed: 0, results: [] };
  }
  
  console.log('📦 Starting migration of', sessions.length, 'sessions...');
  
  const results = [];
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: sessions.length,
        session: session
      });
    }
    
    const result = await migrateSession(session, storage);
    results.push(result);
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
    
    // Small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Mark migration as completed
  localStorage.setItem('space_migration_status', 'completed');
  localStorage.setItem('space_migration_date', new Date().toISOString());
  localStorage.setItem('space_migration_summary', JSON.stringify({
    total: sessions.length,
    successful,
    failed,
    date: new Date().toISOString()
  }));
  
  console.log('📦 Migration completed:', successful, 'successful,', failed, 'failed');
  
  return {
    total: sessions.length,
    successful,
    failed,
    results
  };
}

// Clean up localStorage sessions after successful migration
export function cleanupLocalStorageSessions() {
  const sessionKeys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('space_session_')) {
      sessionKeys.push(key);
    }
  }
  
  sessionKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 Cleaned up', sessionKeys.length, 'localStorage sessions');
  return sessionKeys.length;
}

// Get migration status/summary
export function getMigrationStatus() {
  const status = localStorage.getItem('space_migration_status');
  const date = localStorage.getItem('space_migration_date');
  const summary = localStorage.getItem('space_migration_summary');
  
  return {
    completed: status === 'completed',
    date: date,
    summary: summary ? JSON.parse(summary) : null,
    needsMigration: needsMigration()
  };
}
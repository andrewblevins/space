// Simple file-based logger for debugging
// Writes to debug.log in project root

export const fileLog = async (message, data = null) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    
    // Send to a local endpoint that writes to file
    await fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(() => {
      // Silently fail if endpoint doesn't exist
    });
    
    // Also log to console so existing behavior isn't changed
    console.log(`[${timestamp}] ${message}`, data || '');
  } catch (error) {
    // Don't let logging errors break the app
    console.error('FileLog error:', error);
  }
};
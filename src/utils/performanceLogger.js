/**
 * Performance monitoring utility for diagnosing streaming slowdown issues
 */

class PerformanceLogger {
  constructor() {
    this.startTimes = new Map();
    this.renderCounts = new Map();
    this.streamingStats = {
      charactersSent: 0,
      messagesLength: 0,
      startTime: null,
      lastUpdateTime: null,
      updateInterval: []
    };
  }

  // Track streaming performance
  startStreaming() {
    this.streamingStats.startTime = performance.now();
    this.streamingStats.lastUpdateTime = this.streamingStats.startTime;
    this.streamingStats.charactersSent = 0;
    this.streamingStats.updateInterval = [];
    console.log('🏃 Streaming performance tracking started');
  }

  trackStreamingUpdate(messagesLength, newCharacter = '') {
    const now = performance.now();
    if (this.streamingStats.lastUpdateTime) {
      const interval = now - this.streamingStats.lastUpdateTime;
      this.streamingStats.updateInterval.push(interval);
    }
    
    this.streamingStats.charactersSent++;
    this.streamingStats.messagesLength = messagesLength;
    this.streamingStats.lastUpdateTime = now;

    // Log every 50 characters to track degradation
    if (this.streamingStats.charactersSent % 50 === 0) {
      const avgInterval = this.streamingStats.updateInterval.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, this.streamingStats.updateInterval.length);
      const totalTime = now - this.streamingStats.startTime;
      console.log(`⏱️ Streaming Stats [${this.streamingStats.charactersSent} chars]:`, {
        avgRecentInterval: `${avgInterval.toFixed(1)}ms`,
        totalTime: `${totalTime.toFixed(0)}ms`,
        messagesLength,
        charsPerSecond: (this.streamingStats.charactersSent / (totalTime / 1000)).toFixed(1)
      });
    }
  }

  endStreaming() {
    if (this.streamingStats.startTime) {
      const totalTime = performance.now() - this.streamingStats.startTime;
      const avgInterval = this.streamingStats.updateInterval.reduce((a, b) => a + b, 0) / this.streamingStats.updateInterval.length;
      
      console.log('🏁 Streaming Complete - Final Stats:', {
        totalCharacters: this.streamingStats.charactersSent,
        totalTime: `${totalTime.toFixed(0)}ms`,
        averageInterval: `${avgInterval.toFixed(1)}ms`,
        slowestInterval: `${Math.max(...this.streamingStats.updateInterval).toFixed(1)}ms`,
        fastestInterval: `${Math.min(...this.streamingStats.updateInterval).toFixed(1)}ms`,
        finalMessagesLength: this.streamingStats.messagesLength
      });
    }
  }

  // Track component render performance
  startRender(componentName, messageCount = 0) {
    const key = `${componentName}-${Date.now()}`;
    this.startTimes.set(key, {
      time: performance.now(),
      messageCount
    });
    
    const renderCount = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, renderCount);
    
    return key;
  }

  endRender(key, componentName) {
    const startData = this.startTimes.get(key);
    if (startData) {
      const duration = performance.now() - startData.time;
      const renderCount = this.renderCounts.get(componentName) || 0;
      
      // Log slow renders or high render counts
      if (duration > 10 || renderCount % 20 === 0) {
        console.log(`🎭 ${componentName} render:`, {
          duration: `${duration.toFixed(1)}ms`,
          renderCount,
          messageCount: startData.messageCount
        });
      }
      
      this.startTimes.delete(key);
    }
  }

  // Track memory usage
  logMemoryUsage(context = '') {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize / 1024 / 1024;
      const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
      console.log(`🧠 Memory Usage ${context}:`, {
        used: `${used.toFixed(1)}MB`,
        limit: `${limit.toFixed(1)}MB`,
        percentage: `${(used/limit*100).toFixed(1)}%`
      });
    }
  }

  // Track DOM performance
  logDOMStats() {
    const elements = document.querySelectorAll('*').length;
    const messages = document.querySelectorAll('[id^="msg-"]').length;
    console.log('🏗️ DOM Stats:', {
      totalElements: elements,
      messageElements: messages,
      elementsPerMessage: messages > 0 ? (elements / messages).toFixed(1) : 0
    });
  }

  // Generate performance report
  generateReport() {
    console.log('📊 Performance Report:', {
      renderCounts: Object.fromEntries(this.renderCounts),
      activeTimers: this.startTimes.size,
      streamingActive: !!this.streamingStats.startTime
    });
    
    this.logMemoryUsage('Report');
    this.logDOMStats();
  }
}

export const performanceLogger = new PerformanceLogger();

// Auto-generate report every 30 seconds in debug mode
if (typeof window !== 'undefined' && localStorage.getItem('space_debug_mode') === 'true') {
  setInterval(() => {
    performanceLogger.generateReport();
  }, 30000);
}
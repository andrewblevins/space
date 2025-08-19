/**
 * Throttling utility for reducing streaming update frequency
 */

export class StreamingThrottle {
  constructor(interval = 50) { // Default 50ms throttle
    this.interval = interval;
    this.lastUpdate = 0;
    this.pendingUpdate = null;
    this.timeoutId = null;
  }

  throttledUpdate(updateFn) {
    const now = performance.now();
    const timeSinceLastUpdate = now - this.lastUpdate;

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= this.interval) {
      this.executeUpdate(updateFn);
      return;
    }

    // Store the pending update and schedule it
    this.pendingUpdate = updateFn;
    
    if (!this.timeoutId) {
      const remainingTime = this.interval - timeSinceLastUpdate;
      this.timeoutId = setTimeout(() => {
        if (this.pendingUpdate) {
          this.executeUpdate(this.pendingUpdate);
          this.pendingUpdate = null;
        }
        this.timeoutId = null;
      }, remainingTime);
    }
  }

  executeUpdate(updateFn) {
    this.lastUpdate = performance.now();
    updateFn();
  }

  // Force execute any pending update immediately
  flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.pendingUpdate) {
      this.executeUpdate(this.pendingUpdate);
      this.pendingUpdate = null;
    }
  }

  // Adaptive throttling based on conversation length
  adaptThrottleRate(messageCount) {
    // Increase throttling as conversation grows
    const baseInterval = 50;
    const scaleFactor = Math.min(messageCount / 10, 3); // Cap at 3x slower
    this.interval = baseInterval + (scaleFactor * 30); // Up to 140ms for long conversations
  }
}

export const createStreamingThrottle = (interval) => new StreamingThrottle(interval);
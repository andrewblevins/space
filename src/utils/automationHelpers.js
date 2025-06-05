/**
 * Global automation helpers for Puppeteer testing
 * This module provides a consistent API for programmatic interaction with SPACE components
 */

class SpaceAutomation {
  constructor() {
    this.components = {};
    this.debug = import.meta.env.DEV;
  }

  log(message, ...args) {
    if (this.debug) {
      console.log(`[SpaceAutomation] ${message}`, ...args);
    }
  }

  // Register a component's automation API
  registerComponent(name, api) {
    this.components[name] = api;
    this.log(`Registered component: ${name}`, api);
  }

  // Get a component's automation API
  getComponent(name) {
    return this.components[name];
  }

  // Global helpers for common operations
  helpers = {
    // Wait for an element to appear
    waitForElement: (selector, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
          } else if (Date.now() - start > timeout) {
            reject(new Error(`Element not found: ${selector}`));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    },

    // Wait for an element to disappear
    waitForElementToDisappear: (selector, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          const element = document.querySelector(selector);
          if (!element) {
            resolve();
          } else if (Date.now() - start > timeout) {
            reject(new Error(`Element still present: ${selector}`));
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    },

    // Set value in React controlled component
    setReactValue: (element, value) => {
      const lastValue = element.value;
      element.value = value;
      
      // Trigger React's input tracking
      const event = new Event('input', { bubbles: true });
      const tracker = element._valueTracker;
      if (tracker) {
        tracker.setValue(lastValue);
      }
      
      element.dispatchEvent(event);
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },

    // Click element and wait for any navigation/changes
    clickAndWait: async (selector, waitFor = null) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      element.click();
      
      if (waitFor) {
        if (typeof waitFor === 'string') {
          // Wait for element to appear
          await this.helpers.waitForElement(waitFor);
        } else if (typeof waitFor === 'function') {
          // Wait for custom condition
          await waitFor();
        }
      }
    },

    // Get current app state
    getAppState: () => ({
      url: window.location.href,
      components: Object.keys(this.components),
      timestamp: new Date().toISOString()
    })
  };

  // Development environment helpers
  dev = {
    // Auto-fill forms with development data
    autoFill: () => {
      const autoFillData = {
        password: import.meta.env.VITE_DEV_PASSWORD || 'development123',
        advisorName: 'Test Advisor',
        advisorDescription: 'A helpful AI advisor for testing purposes.',
        promptName: 'Test Prompt',
        promptText: 'This is a test prompt for development.'
      };
      
      return autoFillData;
    },

    // Enable debug mode
    enableDebug: () => {
      this.debug = true;
      this.log('Debug mode enabled');
    },

    // Reset all automation state
    reset: () => {
      this.components = {};
      this.log('Automation state reset');
    }
  };
}

// Create global instance
const automation = new SpaceAutomation();

// Expose globally for Puppeteer
if (typeof window !== 'undefined') {
  window.spaceAutomation = automation;
}

export default automation;
/**
 * Simple analytics wrapper for Google Analytics
 * Replace G-XXXXXXXXXX in index.html with your actual GA4 measurement ID
 */

// Check if gtag is available
const isAnalyticsEnabled = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

/**
 * Track a custom event
 * @param {string} eventName - The name of the event
 * @param {object} parameters - Additional parameters for the event
 */
export const trackEvent = (eventName, parameters = {}) => {
  if (!isAnalyticsEnabled()) return;
  
  try {
    window.gtag('event', eventName, parameters);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Track user login
 * @param {string} method - Login method (e.g., 'google', 'email')
 */
export const trackLogin = (method) => {
  trackEvent('login', { method });
};

/**
 * Track message sent
 * @param {boolean} hasAdvisors - Whether advisors are active
 * @param {number} messageCount - Current message count
 */
export const trackMessage = (hasAdvisors, messageCount) => {
  trackEvent('send_message', {
    has_advisors: hasAdvisors,
    message_count: messageCount
  });
};

/**
 * Track advisor created
 * @param {string} advisorName - Name of the advisor
 */
export const trackAdvisorCreated = (advisorName) => {
  trackEvent('create_advisor', {
    advisor_name: advisorName
  });
};

/**
 * Track feature usage
 * @param {string} featureName - Name of the feature used
 */
export const trackFeature = (featureName) => {
  trackEvent('use_feature', {
    feature_name: featureName
  });
};

/**
 * Track session started
 */
export const trackSessionStart = () => {
  trackEvent('session_start');
};

/**
 * Track rate limit reached
 */
export const trackRateLimitReached = () => {
  trackEvent('rate_limit_reached');
};
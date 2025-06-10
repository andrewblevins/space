/**
 * Usage tracking utilities for SPACE Terminal
 * Tracks API costs locally with current 2025 pricing
 */

// Current API pricing (January 2025)
const PRICING = {
  claude: {
    input: 3.00 / 1_000_000,   // $3 per million tokens
    output: 15.00 / 1_000_000  // $15 per million tokens
  },
  gpt: {
    input: 0.15 / 1_000_000,   // $0.15 per million tokens
    output: 0.60 / 1_000_000   // $0.60 per million tokens
  }
};

const STORAGE_KEY = 'space_api_usage';

/**
 * Get current usage statistics
 */
export const getUsageStats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        claude: { inputTokens: 0, outputTokens: 0, cost: 0 },
        gpt: { inputTokens: 0, outputTokens: 0, cost: 0 },
        total: { inputTokens: 0, outputTokens: 0, cost: 0 },
        sessions: 0,
        firstUse: new Date().toISOString(),
        lastUse: new Date().toISOString()
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading usage stats:', error);
    return getUsageStats(); // Return fresh stats if corrupted
  }
};

/**
 * Track usage for a specific API call
 */
export const trackUsage = (provider, inputTokens, outputTokens) => {
  try {
    const stats = getUsageStats();
    const pricing = PRICING[provider];
    
    if (!pricing) {
      console.warn(`Unknown provider for usage tracking: ${provider}`);
      return;
    }

    const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);
    
    // Update provider-specific stats
    stats[provider].inputTokens += inputTokens;
    stats[provider].outputTokens += outputTokens;
    stats[provider].cost += cost;
    
    // Update totals
    stats.total.inputTokens += inputTokens;
    stats.total.outputTokens += outputTokens;
    stats.total.cost += cost;
    
    // Update metadata
    stats.lastUse = new Date().toISOString();
    if (!stats.firstUse) {
      stats.firstUse = new Date().toISOString();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    
    return cost;
  } catch (error) {
    console.error('Error tracking usage:', error);
    return 0;
  }
};

/**
 * Track a session (increment session counter)
 */
export const trackSession = () => {
  try {
    const stats = getUsageStats();
    stats.sessions += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error tracking session:', error);
  }
};

/**
 * Reset usage statistics
 */
export const resetUsageStats = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting usage stats:', error);
    return false;
  }
};

/**
 * Calculate cost for given tokens
 */
export const calculateCost = (provider, inputTokens, outputTokens) => {
  const pricing = PRICING[provider];
  if (!pricing) return 0;
  
  return (inputTokens * pricing.input) + (outputTokens * pricing.output);
};

/**
 * Format cost for display
 */
export const formatCost = (cost) => {
  if (cost < 0.01) {
    return `${(cost * 100).toFixed(3)}¢`;
  }
  return `$${cost.toFixed(2)}`;
};

/**
 * Get usage summary for display
 */
export const getUsageSummary = () => {
  const stats = getUsageStats();
  const daysSinceFirst = stats.firstUse ? 
    Math.max(1, Math.ceil((new Date() - new Date(stats.firstUse)) / (1000 * 60 * 60 * 24))) : 1;
  
  return {
    totalCost: stats.total.cost,
    totalTokens: stats.total.inputTokens + stats.total.outputTokens,
    sessions: stats.sessions,
    avgCostPerSession: stats.sessions > 0 ? stats.total.cost / stats.sessions : 0,
    avgCostPerDay: stats.total.cost / daysSinceFirst,
    claudeCost: stats.claude.cost,
    gptCost: stats.gpt.cost,
    daysSinceFirst,
    firstUse: stats.firstUse,
    lastUse: stats.lastUse
  };
}; 
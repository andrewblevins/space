import React, { useState, useEffect } from 'react';
import { getUsageSummary, formatCost, resetUsageStats } from '../utils/usageTracking';
import { useOpenRouterCredits } from '../hooks/useOpenRouterCredits';

const UsageDisplay = () => {
  const [usageSummary, setUsageSummary] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { credits, loading: creditsLoading, error: creditsError, refetch: refetchCredits, isEnabled } = useOpenRouterCredits();

  const refreshUsage = () => {
    const summary = getUsageSummary();
    setUsageSummary(summary);
  };

  useEffect(() => {
    refreshUsage();
    
    // Refresh usage stats every 10 seconds when component is visible
    const interval = setInterval(refreshUsage, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetUsage = () => {
    if (resetUsageStats()) {
      refreshUsage();
      setShowResetConfirm(false);
    }
  };

  if (!usageSummary) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-orange-400">API Usage</h3>
        <p className="text-gray-400">Loading usage statistics...</p>
      </div>
    );
  }

  const { 
    totalCost, 
    totalTokens, 
    sessions, 
    avgCostPerSession, 
    avgCostPerDay,
    claudeCost,
    gptCost,
    daysSinceFirst,
    firstUse,
    lastUse
  } = usageSummary;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-orange-400">API Usage</h3>
        <button
          onClick={() => {
            refreshUsage();
            if (isEnabled) refetchCredits();
          }}
          className="text-xs text-gray-400 hover:text-orange-400 transition-colors"
          title="Refresh usage statistics"
        >
          🔄 Refresh
        </button>
      </div>

      {/* OpenRouter Credits (Real Balance) */}
      {isEnabled && credits && !creditsError && (
        <div className="bg-orange-950/20 border border-orange-500/30 rounded-lg p-4">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">OpenRouter Balance</div>
            <div className="text-2xl font-bold text-orange-400">
              {formatCost(credits.remaining)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {formatCost(credits.used)} spent of {formatCost(credits.totalCredits)}
            </div>
          </div>
        </div>
      )}

      {/* Error loading credits */}
      {isEnabled && creditsError && (
        <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-3">
          <div className="text-xs text-red-400">
            Could not load OpenRouter balance
          </div>
        </div>
      )}

      {/* Total Cost Display (Estimated from usage) */}
      <div className="bg-gray-900/30 border border-orange-500/20 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400">
            {formatCost(totalCost)}
          </div>
          <div className="text-sm text-gray-400">This Session</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900/20 border border-orange-500/10 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{sessions}</div>
          <div className="text-xs text-gray-400">Sessions</div>
        </div>
        <div className="bg-gray-900/20 border border-orange-500/10 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{totalTokens.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total Tokens</div>
        </div>
      </div>

      {/* Averages */}
      <div className="space-y-2">
        <div className="text-sm">
          <span className="text-gray-400">Average per session:</span>
          <span className="text-white ml-2 font-medium">{formatCost(avgCostPerSession)}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Average per day:</span>
          <span className="text-white ml-2 font-medium">{formatCost(avgCostPerDay)}</span>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-orange-400">By Provider</h4>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Claude (Anthropic):</span>
            <span className="text-white font-medium">{formatCost(claudeCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">GPT (OpenAI):</span>
            <span className="text-white font-medium">{formatCost(gptCost)}</span>
          </div>
        </div>
      </div>

      {/* Time Period */}
      {firstUse && (
        <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
          <div>Since: {new Date(firstUse).toLocaleDateString()}</div>
          <div>Last use: {new Date(lastUse).toLocaleDateString()}</div>
          <div>Period: {daysSinceFirst} day{daysSinceFirst !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Reset Button */}
      <div className="border-t border-gray-700 pt-3">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Reset Usage Statistics
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Are you sure?</span>
            <button
              onClick={handleResetUsage}
              className="text-xs text-red-400 hover:text-red-300 font-medium"
            >
              Yes, Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageDisplay; 
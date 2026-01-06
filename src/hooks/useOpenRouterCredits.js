import { useState, useEffect, useCallback } from 'react';
import { getDecrypted } from '../utils/secureStorage';

/**
 * Hook to fetch OpenRouter account credits and balance
 * Only works in local mode (VITE_USE_AUTH=false)
 */
export function useOpenRouterCredits() {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';

  const fetchCredits = useCallback(async () => {
    // Only fetch in local mode
    if (useAuthSystem) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get OpenRouter API key
      const apiKey = await getDecrypted('space_openrouter_key');
      if (!apiKey) {
        setError('No OpenRouter API key found');
        setLoading(false);
        return;
      }

      // Fetch credits from OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SPACE Terminal'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch credits: ${response.status}`);
      }

      const data = await response.json();

      // OpenRouter returns {total_credits: number, usage: number}
      // Balance = total_credits - usage
      const creditsData = {
        totalCredits: data.total_credits || 0,
        used: data.usage || 0,
        remaining: (data.total_credits || 0) - (data.usage || 0),
        lastUpdated: new Date().toISOString()
      };

      setCredits(creditsData);
      setLastFetch(Date.now());
      console.log('💳 OpenRouter Credits:', creditsData);

    } catch (err) {
      console.error('Error fetching OpenRouter credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [useAuthSystem]);

  // Initial fetch on mount
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Auto-refresh every 60 seconds (OpenRouter caches for up to 60s anyway)
  useEffect(() => {
    if (useAuthSystem) return;

    const interval = setInterval(() => {
      fetchCredits();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [fetchCredits, useAuthSystem]);

  return {
    credits,
    loading,
    error,
    lastFetch,
    refetch: fetchCredits,
    isEnabled: !useAuthSystem
  };
}

export default useOpenRouterCredits;

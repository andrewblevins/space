import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

export function useUsageTracking() {
  const useAuthSystem = import.meta.env.VITE_USE_AUTH === 'true';
  const authData = useAuthSystem ? useAuth() : { session: null };
  const { session } = authData;
  
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!useAuthSystem || !session) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getApiEndpoint()}/api/usage`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }, [useAuthSystem, session]);

  useEffect(() => {
    fetchUsage();
  }, [session, useAuthSystem, fetchUsage]);

  // Update usage from API response headers
  const updateFromHeaders = (response) => {
    if (!useAuthSystem) return;
    
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const used = response.headers.get('X-RateLimit-Used');
    const tier = response.headers.get('X-RateLimit-Tier');

    if (limit && remaining && used) {
      setUsage({
        usage: parseInt(used),
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        tier: tier || 'free'
      });
    }
  };

  return {
    usage,
    loading,
    refreshUsage: fetchUsage,
    updateFromHeaders,
    isEnabled: useAuthSystem
  };
}
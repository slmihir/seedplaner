import { useState, useEffect, useRef } from 'react';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Custom hook for caching API responses
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data
 * @param {Array} dependencies - Dependencies for the fetch function
 * @returns {Object} { data, loading, error, refetch }
 */
export function useApiCache(key, fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchData = async () => {
    // Check cache first
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      
      if (mountedRef.current) {
        setData(result);
        // Cache the result
        cache.set(key, {
          data: result,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = () => {
    cache.delete(key);
    fetchData();
  };

  const invalidateCache = () => {
    cache.delete(key);
  };

  return { data, loading, error, refetch, invalidateCache };
}

/**
 * Utility function to clear all cache
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Utility function to clear cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 */
export function clearCacheByPattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useDesignTokens.js  —  Design Tokens React Hook
 *  MyJourney CMS  |  Phase 7: Design Token Management System
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

export function useDesignTokens(groupFilter = null) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/design-tokens';
      if (groupFilter) url += `?group=${encodeURIComponent(groupFilter)}`;
      const res = await apiService.get(url);
      if (res?.data) setTokens(res.data);
    } catch (err) {
      console.warn('[useDesignTokens] Error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [groupFilter]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const getTokenVar = (tokenKey) => {
    if (!tokenKey) return '';
    return `var(--${tokenKey.replace(/\./g, '-')})`;
  };

  const getTokenValue = (tokenKey) => {
    const found = tokens.find((t) => t.key === tokenKey);
    return found ? found.value : '';
  };

  return {
    tokens,
    loading,
    getTokenVar,
    getTokenValue,
    refetch: fetchTokens,
  };
}

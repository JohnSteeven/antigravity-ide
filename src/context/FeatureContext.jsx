/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FeatureContext.jsx  —  Frontend Feature Flag Provider
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import apiService from '../services/apiService';

export const FeatureContext = createContext({
  flags: [],
  loading: true,
  error: null,
  isEnabled: (key) => true,
  getFeature: (key) => null,
  refreshFeatures: async () => {},
  toggleFeature: async (id, reason) => {},
  updateFeature: async (id, data) => {},
  updateRollout: async (id, percentage) => {},
});

export const FeatureProvider = ({ children }) => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/features');
      if (res?.data) {
        setFlags(res.data);
      }
    } catch (err) {
      console.warn('[FeatureContext] Failed to load feature flags from API:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const getFeature = useCallback(
    (key) => {
      if (!key) return null;
      return flags.find((f) => f.key.toLowerCase() === key.toLowerCase()) || null;
    },
    [flags]
  );

  const isEnabled = useCallback(
    (key) => {
      const flag = getFeature(key);
      if (!flag) return true; // Default to true for unlisted features
      return flag.isAvailable !== false && flag.status !== 'disabled';
    },
    [getFeature]
  );

  const toggleFeature = async (id, reason = '') => {
    try {
      const res = await apiService.post(`/api/features/${id}/toggle`, { reason });
      if (res?.data) {
        setFlags((prev) => prev.map((f) => (f._id === id ? { ...f, ...res.data } : f)));
      }
      return res;
    } catch (err) {
      console.error('[FeatureContext] Toggle error:', err);
      throw err;
    }
  };

  const updateFeature = async (id, data) => {
    try {
      const res = await apiService.patch(`/api/features/${id}`, data);
      if (res?.data) {
        setFlags((prev) => prev.map((f) => (f._id === id ? { ...f, ...res.data } : f)));
      }
      return res;
    } catch (err) {
      console.error('[FeatureContext] Update error:', err);
      throw err;
    }
  };

  const updateRollout = async (id, percentage) => {
    try {
      const res = await apiService.post(`/api/features/${id}/rollout`, { percentageRollout: percentage });
      if (res?.data) {
        setFlags((prev) => prev.map((f) => (f._id === id ? { ...f, ...res.data } : f)));
      }
      return res;
    } catch (err) {
      console.error('[FeatureContext] Rollout error:', err);
      throw err;
    }
  };

  return (
    <FeatureContext.Provider
      value={{
        flags,
        loading,
        error,
        isEnabled,
        getFeature,
        refreshFeatures: fetchFeatures,
        toggleFeature,
        updateFeature,
        updateRollout,
      }}
    >
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatureContext = () => useContext(FeatureContext);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useFeature.js  —  React Hook for Feature Flag Evaluation
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Usage:
 *    const { isEnabled, isBeta, isMaintenance, flag } = useFeature('websitebuilder');
 *    if (!isEnabled) return null;
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useFeatureContext } from '../context/FeatureContext';

export function useFeature(flagKey) {
  const { flags, loading, isEnabled, getFeature } = useFeatureContext();

  const flag = getFeature(flagKey);

  const enabled = isEnabled(flagKey);
  const isBeta = flag?.status === 'beta';
  const isMaintenance = flag?.status === 'maintenance';
  const isPrivate = flag?.status === 'private';
  const isDisabled = flag?.status === 'disabled';

  return {
    key: flagKey,
    flag,
    isEnabled: enabled,
    isDisabled,
    isBeta,
    isMaintenance,
    isPrivate,
    status: flag?.status || (enabled ? 'enabled' : 'disabled'),
    loading,
  };
}

export default useFeature;

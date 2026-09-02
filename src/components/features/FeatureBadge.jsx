/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FeatureBadge.jsx  —  Visual Status Badge for Feature Flags
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';

const STATUS_CONFIG = {
  enabled: { label: 'Enabled', bg: 'var(--color-success-bg, #e8f5ee)', color: 'var(--color-success, #2e7d5a)', dot: '#2e7d5a' },
  disabled: { label: 'Disabled', bg: 'var(--color-soft, #f1eee8)', color: 'var(--color-muted, #666d6d)', dot: '#999999' },
  beta: { label: 'Beta', bg: 'var(--color-info-bg, #eaf0f5)', color: 'var(--color-info, #4d6478)', dot: '#4d6478' },
  maintenance: { label: 'Maintenance', bg: 'var(--color-warning-bg, #fdf6ee)', color: 'var(--color-warning, #b58b5f)', dot: '#b58b5f' },
  private: { label: 'Private', bg: 'rgba(100, 100, 100, 0.1)', color: '#555555', dot: '#555555' },
  public: { label: 'Public', bg: 'var(--color-success-bg, #e8f5ee)', color: 'var(--color-success, #2e7d5a)', dot: '#2e7d5a' },
};

export default function FeatureBadge({ status = 'enabled' }) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.enabled;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '100px',
        fontSize: '0.75rem',
        fontWeight: '700',
        backgroundColor: conf.bg,
        color: conf.color,
        border: `1px solid ${conf.color}33`,
        textTransform: 'capitalize',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: conf.dot,
        }}
      />
      {conf.label}
    </span>
  );
}

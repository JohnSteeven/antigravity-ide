/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FeatureFlagCard.jsx  —  Enterprise Feature Flag Card
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import FeatureBadge from './FeatureBadge';
import EnvironmentSelector from './EnvironmentSelector';
import RoleSelector from './RoleSelector';
import RolloutSlider from './RolloutSlider';
import { FiToggleLeft, FiToggleRight, FiClock, FiLayers, FiSliders, FiAlertCircle } from 'react-icons/fi';

export default function FeatureFlagCard({ flag, onToggle, onUpdate, onRolloutChange }) {
  const [showAudit, setShowAudit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(flag.status || 'enabled');
  const [reason, setReason] = useState('');
  const [environments, setEnvironments] = useState(flag.allowedEnvironments || []);
  const [roles, setRoles] = useState(flag.allowedRoles || []);

  const handleToggle = () => {
    if (onToggle) onToggle(flag._id, reason);
  };

  const handleSaveStatus = (newStatus) => {
    setStatus(newStatus);
    if (onUpdate) {
      onUpdate(flag._id, {
        status: newStatus,
        allowedEnvironments: environments,
        allowedRoles: roles,
        reason: reason || `Changed status to ${newStatus}`,
      });
    }
    setIsEditing(false);
  };

  return (
    <div
      style={{
        background: 'var(--color-panel, #ffffff)',
        border: '1px solid var(--color-line, #e4ded4)',
        borderRadius: 'var(--radius-lg, 14px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.05))',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-ink, #2f3133)' }}>
              {flag.name}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted, #666)', background: 'var(--color-soft, #f1eee8)', padding: '2px 6px', borderRadius: '4px' }}>
              {flag.key}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-muted, #666d6d)' }}>
            {flag.description || 'No description provided'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FeatureBadge status={flag.status} />
          <button
            type="button"
            onClick={handleToggle}
            title={flag.status === 'enabled' ? 'Disable Feature' : 'Enable Feature'}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', color: flag.status === 'enabled' ? 'var(--cms-accent, #426c67)' : '#aaa', padding: 0 }}
          >
            {flag.status === 'enabled' ? <FiToggleRight /> : <FiToggleLeft />}
          </button>
        </div>
      </div>

      {/* Meta Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--color-panel-muted, #f8faf8)', padding: '12px', borderRadius: '8px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-muted, #666)', display: 'block', marginBottom: '4px' }}>
            Environments
          </span>
          <EnvironmentSelector selected={environments} onChange={setEnvironments} editable={isEditing} />
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-muted, #666)', display: 'block', marginBottom: '4px' }}>
            Roles Allowed
          </span>
          <RoleSelector selected={roles} onChange={setRoles} editable={isEditing} />
        </div>
      </div>

      {/* Dependencies */}
      {flag.dependencies?.length > 0 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--color-muted, #666)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiLayers style={{ color: 'var(--color-gold, #b58b5f)' }} />
          <span>Dependencies: <strong>{flag.dependencies.join(', ')}</strong></span>
        </div>
      )}

      {/* Rollout Slider */}
      <RolloutSlider
        initialValue={flag.percentageRollout ?? 100}
        onChange={(val) => onRolloutChange && onRolloutChange(flag._id, val)}
      />

      {/* Quick Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '8px', borderTop: '1px solid var(--color-line, #eee)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['enabled', 'beta', 'maintenance', 'disabled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleSaveStatus(st)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: flag.status === st ? '700' : '500',
                border: flag.status === st ? '1px solid var(--cms-accent, #426c67)' : '1px solid #ddd',
                backgroundColor: flag.status === st ? 'var(--cms-accent-light, #e8f0ef)' : '#fff',
                color: flag.status === st ? 'var(--cms-accent, #426c67)' : '#555',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAudit(!showAudit)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-muted, #666)', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <FiClock /> Audit History
        </button>
      </div>

      {/* Audit Drawer */}
      {showAudit && (
        <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.78rem' }}>
          <strong style={{ display: 'block', marginBottom: '8px', color: '#333' }}>Audit History ({flag.audit?.length || 0})</strong>
          {(!flag.audit || flag.audit.length === 0) ? (
            <span style={{ color: '#888' }}>No audit history recorded.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {flag.audit.slice().reverse().map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#555', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
                  <span>
                    <strong>{entry.userName || 'Admin'}</strong>: {entry.oldStatus} ➔ <strong>{entry.newStatus}</strong> ({entry.reason || 'No reason'})
                  </span>
                  <span style={{ color: '#888', fontSize: '0.7rem' }}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

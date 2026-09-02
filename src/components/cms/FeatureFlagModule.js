/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FeatureFlagModule.js  —  CMS Feature Flags Management Dashboard
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { useFeatureContext } from '../../context/FeatureContext';
import FeatureFlagCard from '../features/FeatureFlagCard';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import { FiSliders, FiPlus, FiCheckCircle, FiAlertTriangle, FiSearch } from 'react-icons/fi';

export default function FeatureFlagModule() {
  const { flags, loading, error, refreshFeatures, toggleFeature, updateFeature, updateRollout } = useFeatureContext();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [notification, setNotification] = useState(null);

  const groups = ['All', 'Core', 'Content', 'Experience', 'Marketing', 'Operations', 'Plugins', 'Future'];

  const filteredFlags = flags.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.key.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || f.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleToggle = async (id, reason) => {
    try {
      const res = await toggleFeature(id, reason);
      if (res?.warnings?.length > 0) {
        setNotification({ type: 'warning', text: res.warnings.join(' | ') });
      } else {
        setNotification({ type: 'success', text: 'Feature status toggled successfully.' });
      }
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await updateFeature(id, data);
      if (res?.warnings?.length > 0) {
        setNotification({ type: 'warning', text: res.warnings.join(' | ') });
      } else {
        setNotification({ type: 'success', text: 'Feature flag updated.' });
      }
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleRollout = async (id, percentage) => {
    try {
      await updateRollout(id, percentage);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Operations</span>
          <h2>Feature Flag Manager</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={refreshFeatures}>
            Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            backgroundColor: notification.type === 'warning' ? 'var(--color-warning-bg, #fdf6ee)' : notification.type === 'success' ? 'var(--color-success-bg, #e8f5ee)' : 'var(--color-danger-bg, #fdf1f0)',
            color: notification.type === 'warning' ? 'var(--color-warning, #b58b5f)' : notification.type === 'success' ? 'var(--color-success, #2e7d5a)' : 'var(--color-danger, #9d3e32)',
            border: '1px solid currentColor',
          }}
        >
          {notification.type === 'warning' ? <FiAlertTriangle /> : <FiCheckCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {groups.map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: selectedGroup === grp ? '1px solid var(--cms-accent, #426c67)' : '1px solid var(--color-line, #ddd)',
                backgroundColor: selectedGroup === grp ? 'var(--cms-accent, #426c67)' : 'var(--color-surface, #fff)',
                color: selectedGroup === grp ? '#fff' : 'var(--color-ink, #333)',
                cursor: 'pointer',
              }}
            >
              {grp}
            </button>
          ))}
        </div>

        <div className="cms-search-control" style={{ width: '240px' }}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search flags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Flags Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted, #888)' }}>Loading feature flags...</div>
      ) : filteredFlags.length === 0 ? (
        <div className="empty-state">No feature flags match your criteria.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredFlags.map((flag) => (
            <FeatureFlagCard
              key={flag._id || flag.key}
              flag={flag}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onRolloutChange={handleRollout}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/features',
  component: FeatureFlagModule,
  auth: true,
  permissions: ['features.manage'],
});

registerSidebar({
  key: 'features',
  label: 'Feature Flags',
  icon: FiSliders,
  path: '/cms/features',
  group: 'Operations',
  order: 1,
});

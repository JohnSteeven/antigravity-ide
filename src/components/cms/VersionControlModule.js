/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  VersionControlModule.js  —  Unified Version Control & Diff Dashboard
 *  MyJourney CMS  |  Stage 2 — Phase 12: Version Control & Rollback Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGitCommit,
  FiGitBranch,
  FiRotateCcw,
  FiCheckCircle,
  FiAlertCircle,
  FiTag,
  FiSearch,
  FiSliders,
  FiLayers,
  FiFileText,
} from 'react-icons/fi';

const ENTITY_TYPES = [
  { key: 'article', label: 'Articles' },
  { key: 'page', label: 'Pages' },
  { key: 'headless_entry', label: 'Headless Entries' },
  { key: 'layout', label: 'Layouts' },
  { key: 'theme', label: 'Themes' },
  { key: 'navigation', label: 'Navigation Items' },
  { key: 'setting', label: 'Settings' },
  { key: 'design_token', label: 'Design Tokens' },
  { key: 'component_manifest', label: 'Component Manifests' },
];

export default function VersionControlModule() {
  const [selectedType, setSelectedType] = useState('article');
  const [entityIdInput, setEntityIdInput] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [notification, setNotification] = useState(null);

  // Diff Selection
  const [fromVersionId, setFromVersionId] = useState('');
  const [toVersionId, setToVersionId] = useState('');

  const fetchTimeline = useCallback(async () => {
    if (!entityIdInput.trim()) return;
    try {
      setLoading(true);
      setDiffResult(null);
      const res = await apiService.get(`/api/version-control/timeline/${selectedType}/${entityIdInput.trim()}`);
      if (res?.data) {
        setTimeline(res.data);
        if (res.data.length >= 2) {
          setFromVersionId(res.data[res.data.length - 1]._id);
          setToVersionId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedType, entityIdInput]);

  const handleCompare = async () => {
    if (!fromVersionId || !toVersionId) return;
    try {
      const res = await apiService.get(`/api/version-control/compare?fromId=${fromVersionId}&toId=${toVersionId}`);
      if (res?.data) setDiffResult(res.data);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleRestore = async (versionNumber) => {
    if (!window.confirm(`Restore entity to version v${versionNumber}? A new version snapshot will be created.`)) return;

    try {
      await apiService.post('/api/version-control/restore', {
        entityType: selectedType,
        entityId: entityIdInput.trim(),
        versionNumber,
      });

      setNotification({ type: 'success', text: `Restored version v${versionNumber} successfully!` });
      fetchTimeline();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Unified Version Control & Diff Engine</h2>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Entity Selector & ID Input */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px', background: '#fafafa', padding: '16px', borderRadius: '10px', border: '1px solid #e4ded4' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '600' }}>Entity Type:</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px' }}>
            {ENTITY_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '600' }}>Entity ID (MongoDB ID):</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Paste Mongo ObjectId (e.g. 64a8b...)"
              value={entityIdInput}
              onChange={(e) => setEntityIdInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="primary-btn" onClick={fetchTimeline}>
              <FiSearch /> Load Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Timeline & Diff Split View */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading version timeline...</div>
      ) : timeline.length === 0 ? (
        <div className="empty-state">Enter a valid Entity ID to view version history and run side-by-side diff comparisons.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>
          {/* Version Commit Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiGitCommit style={{ color: 'var(--cms-accent, #426c67)' }} /> Version History ({timeline.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '560px' }}>
              {timeline.map((snap) => (
                <div key={snap._id} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--cms-accent, #426c67)' }}>
                      v{snap.versionNumber}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>{new Date(snap.createdAt).toLocaleString()}</span>
                  </div>

                  <strong style={{ fontSize: '0.85rem' }}>{snap.title}</strong>
                  {snap.notes && <p style={{ margin: 0, fontSize: '0.78rem', color: '#666', fontStyle: 'italic' }}>"{snap.notes}"</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <button type="button" className="small-outline-btn" onClick={() => handleRestore(snap.versionNumber)}>
                      <FiRotateCcw /> Restore v{snap.versionNumber}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side-by-Side Diff Inspector */}
          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiGitBranch /> Side-by-Side Diff Inspector
              </h3>
              <button type="button" className="primary-btn" onClick={handleCompare}>
                Compare Selected Snapshots
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '0.8rem' }}>
                From Snapshot (Older):
                <select value={fromVersionId} onChange={(e) => setFromVersionId(e.target.value)}>
                  {timeline.map((s) => (
                    <option key={s._id} value={s._id}>
                      v{s.versionNumber} — {s.title}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: '0.8rem' }}>
                To Snapshot (Newer):
                <select value={toVersionId} onChange={(e) => setToVersionId(e.target.value)}>
                  {timeline.map((s) => (
                    <option key={s._id} value={s._id}>
                      v{s.versionNumber} — {s.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {diffResult && (
              <div style={{ background: '#fafafa', border: '1px solid #eee', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <strong style={{ fontSize: '0.85rem', color: '#333' }}>{diffResult.summary}</strong>

                {/* Modified fields */}
                {Object.keys(diffResult.changedFields || {}).length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#b58b5f' }}>Modified Fields:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {Object.entries(diffResult.changedFields).map(([fKey, diffObj]) => (
                        <div key={fKey} style={{ background: '#fff', border: '1px solid #e4ded4', padding: '8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                          <strong style={{ color: 'var(--cms-accent, #426c67)' }}>{fKey}</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                            <span style={{ background: '#fdf1f0', color: '#9d3e32', padding: '4px', borderRadius: '4px' }}>
                              Before: {JSON.stringify(diffObj.before)}
                            </span>
                            <span style={{ background: '#e8f5ee', color: '#2e7d5a', padding: '4px', borderRadius: '4px' }}>
                              After: {JSON.stringify(diffObj.after)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/version-control',
  component: VersionControlModule,
  auth: true,
  permissions: ['version.manage'],
});

registerSidebar({
  key: 'version-control',
  label: 'Version Control & Diff',
  icon: FiGitCommit,
  path: '/cms/version-control',
  group: 'Stage 2 Post-Launch',
  order: 2,
});

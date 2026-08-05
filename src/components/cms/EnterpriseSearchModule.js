/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EnterpriseSearchModule.js  —  CMS Universal Search & Knowledge Graph Console
 *  MyJourney CMS  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiSearch, FiShare2, FiRefreshCw, FiCheckCircle,
  FiAlertCircle, FiDatabase, FiLayers, FiZap, FiGitBranch
} from 'react-icons/fi';

export default function EnterpriseSearchModule() {
  const [graphStats, setGraphStats] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/search/graph/stats');
      if (res?.data) setGraphStats(res.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await apiService.post('/api/search/reindex');
      notify('success', `Re-indexing complete! Indexed ${res?.data?.indexedCount || 0} articles into SearchIndex & KnowledgeGraph.`);
      fetchStats();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 5 · Search & Semantic Discovery</span>
          <h2>Universal Search & Knowledge Graph Console</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Manage universal search indices, monitor Knowledge Graph relationships, and trigger semantic re-indexing.
          </p>
        </div>

        <button className="primary-btn" onClick={handleReindex} disabled={reindexing}>
          <FiRefreshCw style={{ animation: reindexing ? 'spin 1s linear infinite' : 'none' }} />
          {reindexing ? 'Re-indexing Catalog...' : 'Re-index Search & Knowledge Graph'}
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Graph Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Knowledge Graph Nodes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: 'var(--cms-accent)' }}>{graphStats?.totalNodes || 0}</div>
        </div>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 20, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Relationship Edges</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#10b981' }}>{graphStats?.totalEdges || 0}</div>
        </div>
      </div>

      {/* Node Types Breakdown */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiGitBranch style={{ color: 'var(--cms-accent)' }} /> Entity Nodes Breakdown
      </h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading graph statistics...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {(graphStats?.nodeTypes || []).map((t, idx) => (
            <div key={idx} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{t._id}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: 4 }}>{t.count} nodes</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/search', component: EnterpriseSearchModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'search-console', label: 'Universal Search & Graph', icon: FiSearch, path: '/cms/search', group: 'Stage 5: Search & Knowledge', order: 11 });

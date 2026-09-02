/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CommunityModule.js  —  CMS Community & Discussion Moderation Platform
 *  MyJourney CMS  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiUsers, FiMessageSquare, FiShield, FiCheckCircle, FiAlertCircle,
  FiXCircle, FiRefreshCw, FiAward, FiHelpCircle, FiBarChart2
} from 'react-icons/fi';

export default function CommunityModule() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchModerationQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/community/moderation?status=pending');
      if (res?.data) setReports(res.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModerationQueue();
  }, [fetchModerationQueue]);

  const handleResolveReport = async (reportId, status) => {
    try {
      await apiService.patch(`/api/community/moderation/${reportId}`, { status });
      notify('success', `Report marked as ${status}`);
      fetchModerationQueue();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 4 · Community Platform</span>
          <h2>Discussion Moderation & Community Center</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Review reported content, manage moderation queue, and inspect community reputation stats.
          </p>
        </div>

        <button className="small-outline-btn" onClick={fetchModerationQueue} disabled={loading}>
          <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh Queue
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Moderation Queue List */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiShield style={{ color: 'var(--cms-accent)' }} /> Pending Moderation Reports ({reports.length})
      </h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading moderation queue...</div>
      ) : reports.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', background: 'var(--soft)', borderRadius: 12 }}>
          <FiCheckCircle size={32} style={{ color: '#10b981', marginBottom: 8 }} />
          <div>All quiet! No pending moderation reports.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r) => (
            <div key={r._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>Reason: {r.reason}</div>
                <div style={{ fontSize: '0.88rem', margin: '4px 0', fontWeight: 600 }}>Comment: "{r.commentId?.body || 'Comment content'}"</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Reported by: {r.reporterId ? `${r.reporterId.firstName} ${r.reporterId.lastName}` : 'Anonymous'}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="primary-btn" style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#10b981' }} onClick={() => handleResolveReport(r._id, 'approved')}>
                  Approve Comment
                </button>
                <button type="button" className="small-outline-btn" style={{ fontSize: '0.78rem', color: '#ef4444', borderColor: '#ef444450' }} onClick={() => handleResolveReport(r._id, 'rejected')}>
                  Remove Comment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/community', component: CommunityModule, auth: true, permissions: ['comments.moderate'] });
registerSidebar({ key: 'community', label: 'Community & Moderation', icon: FiUsers, path: '/cms/community', group: 'Stage 4: Reader Platform', order: 9 });

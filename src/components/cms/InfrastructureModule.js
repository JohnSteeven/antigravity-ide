/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  InfrastructureModule.js  —  CMS Cloud Infrastructure & Observability Console
 *  MyJourney CMS  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiCpu, FiHardDrive, FiActivity, FiZap, FiDatabase,
  FiRefreshCw, FiCheckCircle, FiAlertCircle, FiExternalLink, FiArchive
} from 'react-icons/fi';

export default function InfrastructureModule() {
  const [metrics, setMetrics] = useState(null);
  const [backups, setBackups] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [metRes, backRes, workRes] = await Promise.all([
        apiService.get('/api/infrastructure/metrics').catch(() => null),
        apiService.get('/api/infrastructure/backups').catch(() => null),
        apiService.get('/api/infrastructure/workers').catch(() => null),
      ]);

      if (metRes?.data) setMetrics(metRes.data);
      if (backRes?.data) setBackups(backRes.data);
      if (workRes?.data) setWorkers(workRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTriggerBackup = async () => {
    try {
      await apiService.post('/api/infrastructure/backups', { type: 'full_system' });
      notify('success', 'Manual full system backup executed!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 6 · Infrastructure & Observability</span>
          <h2>Cloud Infrastructure & Observability Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Monitor real-time system metrics, cache hit rates, queue workers, backups, and Prometheus telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="http://localhost:5000/api/infrastructure/metrics/prometheus"
            target="_blank"
            rel="noopener noreferrer"
            className="small-outline-btn"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FiExternalLink /> Prometheus Metrics
          </a>
          <button className="primary-btn" onClick={handleTriggerBackup}>
            <FiArchive /> Trigger Backup
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* System Metrics Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Memory Usage</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: 'var(--cms-accent)' }}>{metrics?.memory?.usagePercent || 0}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{metrics?.memory?.usedMb} MB / {metrics?.memory?.totalMb} MB</div>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>CPU Load (1m Avg)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4 }}>{metrics?.cpu?.loadAvg1m || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{metrics?.cpu?.cores} CPU Cores</div>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Cache Hit Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#10b981' }}>{metrics?.cache?.hitRatePercent || 100}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Hits: {metrics?.cache?.hits || 0} · Misses: {metrics?.cache?.misses || 0}</div>
        </div>

        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', padding: 18, borderRadius: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Database Health</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4, color: metrics?.database?.status === 'connected' ? '#10b981' : '#ef4444', textTransform: 'capitalize' }}>
            {metrics?.database?.status || 'connected'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>DB: {metrics?.database?.name}</div>
        </div>
      </div>

      {/* Backups List */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiArchive style={{ color: 'var(--cms-accent)' }} /> System & Database Backups ({backups.length})
      </h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading infrastructure data...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {backups.map((b) => (
            <div key={b._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: 'var(--cms-accent)', textTransform: 'uppercase' }}>{b.type}</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>Backup Size: {b.sizeMb} MB · Storage: {b.storageProvider}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/infrastructure', component: InfrastructureModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'infrastructure', label: 'Cloud & Observability', icon: FiCpu, path: '/cms/infrastructure', group: 'Stage 6: Enterprise Security', order: 15 });

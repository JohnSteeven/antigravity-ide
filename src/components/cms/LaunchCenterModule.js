/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LaunchCenterModule.js  —  CMS Production Launch Readiness Dashboard
 *  MyJourney CMS  |  Stage 6 — Phase 30: Launch Readiness Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiCheckCircle, FiAlertCircle, FiAward, FiZap, FiRefreshCw,
  FiShield, FiActivity, FiServer, FiFileText, FiGitCommit, FiCheck
} from 'react-icons/fi';

export default function LaunchCenterModule() {
  const [report, setReport] = useState(null);
  const [releases, setReleases] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchLaunchData = useCallback(async () => {
    try {
      setLoading(true);
      const [audRes, relRes, depRes, testRes] = await Promise.all([
        apiService.get('/api/launch/audit').catch(() => null),
        apiService.get('/api/launch/releases').catch(() => null),
        apiService.get('/api/launch/deployments').catch(() => null),
        apiService.get('/api/launch/tests').catch(() => null),
      ]);

      if (audRes?.data) setReport(audRes.data);
      if (relRes?.data) setReleases(relRes.data);
      if (depRes?.data) setDeployments(depRes.data);
      if (testRes?.data) setTests(testRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaunchData();
  }, [fetchLaunchData]);

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const res = await apiService.get('/api/launch/audit');
      if (res?.data) {
        setReport(res.data);
        notify(
          res.data.status === 'ready' ? 'success' : 'error',
          `Live readiness audit: ${res.data.status} (${res.data.readinessScore}%).`
        );
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 6 · Commercial Launch Platform</span>
          <h2>Production Launch Readiness Console</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Inspect live configuration evidence and separately recorded test, deployment, and release history.
          </p>
        </div>

        <button className="primary-btn" onClick={handleRunAudit} disabled={auditing}>
          <FiRefreshCw style={{ animation: auditing ? 'spin 1s linear infinite' : 'none' }} />
          {auditing ? 'Reading Evidence...' : 'Run Live Readiness Audit'}
        </button>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Readiness Gauge & Release Banner */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <span style={{ fontSize: '0.75rem', background: '#3b82f620', color: '#3b82f6', padding: '3px 10px', borderRadius: 100, fontWeight: 700 }}>
            EVIDENCE-BASED READINESS
          </span>
          <h3 style={{ margin: '8px 0 4px', fontSize: '1.4rem' }}>MyJourney Platform Readiness</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
            Missing providers, migrations, or production controls are reported as blockers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--soft)', padding: '14px 24px', borderRadius: 12, border: '1px solid var(--line)' }}>
          {report?.status === 'ready'
            ? <FiAward size={36} style={{ color: '#10b981' }} />
            : <FiAlertCircle size={36} style={{ color: '#b45309' }} />}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Launch Readiness</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: report?.status === 'ready' ? '#10b981' : '#b45309' }}>
              {report ? `${report.readinessScore}%` : 'Not run'}
            </div>
            {report?.status && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{report.status}</div>}
          </div>
        </div>
      </div>

      {/* Production Checklist Items */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiCheckCircle style={{ color: '#10b981' }} /> Production Checklist Audit Results
      </h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Executing launch audit...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
          {(report?.checks || []).map((c, i) => (
            <div key={i} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--cms-accent)', fontWeight: 700, textTransform: 'uppercase' }}>{c.category}</span>
                {c.passed
                  ? <FiCheck style={{ color: '#10b981' }} aria-label="Passed" />
                  : <FiAlertCircle style={{ color: '#b45309' }} aria-label={c.critical ? 'Blocking failure' : 'Warning'} />}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.details}</div>
            </div>
          ))}
        </div>
      )}

      {/* Automated Test Suite Metrics */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiActivity style={{ color: 'var(--cms-accent)' }} /> Automated Quality Assurance Test Suites
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {tests.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No recorded test executions. This console does not manufacture sample results.</div>
        )}
        {tests.map((t) => (
          <div key={t._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{t.suiteName}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{t.passedCount} / {t.totalTests} Passed</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
              Code Coverage: {t.coveragePercent == null ? 'Not recorded' : `${t.coveragePercent}%`} · Execution: {t.durationMs}ms
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

registerRoute({ path: '/cms/launch', component: LaunchCenterModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'launch-center', label: 'Production Launch Console', icon: FiAward, path: '/cms/launch', group: 'Stage 6: Enterprise Security', order: 16 });

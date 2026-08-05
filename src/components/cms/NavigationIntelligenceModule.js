/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NavigationIntelligenceModule.js  —  Navigation Intelligence Dashboard
 *  MyJourney CMS  |  Phase 10: Navigation Intelligence Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiCompass,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity,
  FiBarChart2,
  FiSearch,
  FiRefreshCw,
  FiLayers,
  FiLink2,
} from 'react-icons/fi';

export default function NavigationIntelligenceModule() {
  const [analytics, setAnalytics] = useState([]);
  const [healthReport, setHealthReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/navigation/analytics');
      if (res?.data) setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const runHealthScan = async () => {
    try {
      setLoading(true);
      const res = await apiService.post('/api/navigation/validate');
      if (res?.data) {
        setHealthReport(res.data);
        setNotification({ type: 'success', text: `Health scan complete. ${res.data.healthy}/${res.data.total} links healthy.` });
      }
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    runHealthScan();
  }, [fetchAnalytics]);

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Experience</span>
          <h2>Navigation Intelligence Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={runHealthScan}>
            <FiRefreshCw /> Run Health Scan
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Total Links Monitored</span>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: 'var(--cms-accent, #426c67)' }}>{healthReport?.total || 0}</h3>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Healthy Links</span>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: '#2e7d5a' }}>{healthReport?.healthy || 0}</h3>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: '700', textTransform: 'uppercase' }}>Dead / Broken Links</span>
          <h3 style={{ margin: '6px 0 0', fontSize: '1.8rem', color: (healthReport?.issues?.length || 0) > 0 ? '#9d3e32' : '#2e7d5a' }}>
            {healthReport?.issues?.length || 0}
          </h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Popular Navigation Links Click Analytics */}
        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBarChart2 style={{ color: 'var(--cms-accent, #426c67)' }} /> Popular Menu Items
          </h3>

          {analytics.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.82rem' }}>No click analytics recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analytics.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fafafa', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div>
                    <strong>{item.title}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#888', display: 'block' }}>zone: {item.zoneKey}</span>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--cms-accent, #426c67)' }}>{item.clicks} clicks</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link Health Scanner Report */}
        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiLink2 style={{ color: '#2e7d5a' }} /> Link Health Report
          </h3>

          {(!healthReport?.issues || healthReport.issues.length === 0) ? (
            <div style={{ padding: '20px', background: '#e8f5ee', color: '#2e7d5a', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
              ✓ All navigation menu items have healthy, valid route paths!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {healthReport.issues.map((iss) => (
                <div key={iss.id} style={{ background: '#fdf1f0', border: '1px solid #f8cecc', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: '#9d3e32' }}>
                  <strong>{iss.title}</strong> (zone: {iss.zoneKey}): {iss.issue}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/navigation-intelligence',
  component: NavigationIntelligenceModule,
  auth: true,
  permissions: ['navigation.manage'],
});

registerSidebar({
  key: 'navigation-intelligence',
  label: 'Navigation Intelligence',
  icon: FiCompass,
  path: '/cms/navigation-intelligence',
  group: 'Experience',
  order: 8,
});

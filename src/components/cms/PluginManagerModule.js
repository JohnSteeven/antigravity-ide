/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PluginManagerModule.js  —  Plugin Manager & Extension Marketplace
 *  MyJourney CMS  |  Stage 2 — Phase 15: Plugin Manager & Extension Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGrid,
  FiBox,
  FiCheckCircle,
  FiAlertCircle,
  FiPower,
  FiSettings,
  FiShoppingBag,
  FiActivity,
  FiCpu,
  FiShield,
  FiZap,
} from 'react-icons/fi';

export default function PluginManagerModule() {
  const [activeTab, setActiveTab] = useState('installed'); // 'installed', 'marketplace', 'health'
  const [plugins, setPlugins] = useState([]);
  const [healthReport, setHealthReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/plugins');
      if (res?.data) setPlugins(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await apiService.get('/api/plugins/health');
      if (res?.data) setHealthReport(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
    fetchHealth();
  }, [fetchPlugins, fetchHealth]);

  const handleToggleStatus = async (plugin) => {
    const isActivating = plugin.status !== 'active';
    const endpoint = isActivating ? `/api/plugins/${plugin.pluginId}/activate` : `/api/plugins/${plugin.pluginId}/deactivate`;

    try {
      await apiService.post(endpoint);
      setNotification({ type: 'success', text: `Plugin '${plugin.name}' ${isActivating ? 'activated' : 'deactivated'}.` });
      fetchPlugins();
      fetchHealth();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Plugin Manager, Extension SDK & Marketplace</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={activeTab === 'installed' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('installed')}
          >
            <FiBox /> Installed Plugins ({plugins.length})
          </button>
          <button
            type="button"
            className={activeTab === 'marketplace' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('marketplace')}
          >
            <FiShoppingBag /> Plugin Store
          </button>
          <button
            type="button"
            className={activeTab === 'health' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('health')}
          >
            <FiActivity /> Health & Hooks
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* TAB 1: Installed Plugins */}
      {activeTab === 'installed' && (
        <div>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading installed plugins...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {plugins.map((plugin) => {
                const isActive = plugin.status === 'active';
                return (
                  <div
                    key={plugin.pluginId}
                    style={{
                      background: '#fff',
                      border: isActive ? '1px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isActive ? '0 4px 12px rgba(66, 108, 103, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '700' }}>
                          {plugin.category}
                        </span>
                        <h3 style={{ margin: '6px 0 0', fontSize: '1.05rem' }}>{plugin.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>v{plugin.version} • By {plugin.author}</span>
                      </div>

                      <button
                        type="button"
                        className={isActive ? 'primary-btn' : 'secondary-btn'}
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleToggleStatus(plugin)}
                      >
                        <FiPower /> {isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>{plugin.description}</p>

                    {plugin.registeredHooks?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontWeight: '600' }}>Hooks:</span>
                        {plugin.registeredHooks.map((h, i) => (
                          <span key={i} style={{ background: '#fafafa', border: '1px solid #eee', padding: '1px 6px', borderRadius: '4px' }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Marketplace Store */}
      {activeTab === 'marketplace' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fafafa', border: '1px solid #e4ded4', padding: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Official MyJourney Extension Marketplace</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#666' }}>
                Extend your CMS with certified 1-click extension plugins for SEO, AI, Analytics, and Payments.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>AI</span>
              <h4 style={{ margin: '6px 0 4px' }}>Gemini AI Content Generator</h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#666' }}>Auto-completes blog drafts, rewrites text, and generates image captions using Gemini 1.5 Pro.</p>
              <button type="button" className="primary-btn" style={{ width: '100%', fontSize: '0.8rem' }}>
                <FiZap /> Installed
              </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Payment</span>
              <h4 style={{ margin: '6px 0 4px' }}>Stripe Membership Gateway</h4>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#666' }}>Accept credit cards and manage paid subscription paywalls for exclusive articles.</p>
              <button type="button" className="secondary-btn" style={{ width: '100%', fontSize: '0.8rem' }}>
                1-Click Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Health & Hook Inspector */}
      {activeTab === 'health' && (
        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>Extension Health Diagnostic Scanner</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {healthReport.map((h) => (
              <div key={h.pluginId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                <div>
                  <strong>{h.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>ID: {h.pluginId} • Status: {h.status}</span>
                </div>
                <span style={{ fontWeight: '700', color: h.isHealthy ? '#2e7d5a' : '#9d3e32', fontSize: '0.85rem' }}>
                  {h.isHealthy ? '✓ Healthy & Initialized' : '⚠ Action Required'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/plugins',
  component: PluginManagerModule,
  auth: true,
  permissions: ['plugin.manage'],
});

registerSidebar({
  key: 'plugins',
  label: 'Plugin Platform & Store',
  icon: FiBox,
  path: '/cms/plugins',
  group: 'Stage 2 Post-Launch',
  order: 5,
});

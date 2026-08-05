/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DeveloperPortalModule.js  —  CMS Developer Portal & API Gateway Console
 *  MyJourney CMS  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiCode, FiKey, FiRadio, FiCpu, FiPlusCircle, FiTrash2,
  FiCopy, FiCheckCircle, FiAlertCircle, FiTerminal, FiLayers
} from 'react-icons/fi';

export default function DeveloperPortalModule() {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [apps, setApps] = useState([]);
  const [activeTab, setActiveTab] = useState('keys');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form states
  const [keyName, setKeyName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [appName, setAppName] = useState('');

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [keysRes, webRes, appRes] = await Promise.all([
        apiService.get('/api/developer/keys').catch(() => null),
        apiService.get('/api/developer/webhooks').catch(() => null),
        apiService.get('/api/developer/apps').catch(() => null),
      ]);

      if (keysRes?.data) setKeys(keysRes.data);
      if (webRes?.data) setWebhooks(webRes.data);
      if (appRes?.data) setApps(appRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    try {
      await apiService.post('/api/developer/keys', { name: keyName, permissions: ['read', 'write'] });
      setKeyName('');
      notify('success', 'API Key generated successfully!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await apiService.delete(`/api/developer/keys/${id}`);
      notify('success', 'API Key revoked.');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim()) return;
    try {
      await apiService.post('/api/developer/webhooks', { targetUrl: webhookUrl, events: ['article.published', 'comment.created'] });
      setWebhookUrl('');
      notify('success', 'Webhook subscription created!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleCreateApp = async () => {
    if (!appName.trim()) return;
    try {
      await apiService.post('/api/developer/apps', { name: appName });
      setAppName('');
      notify('success', 'OAuth Application created!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 5 · Open Developer Platform</span>
          <h2>Developer Console & API Gateway</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Manage API keys, OAuth applications, webhook event subscriptions, and inspect request logs.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', paddingBottom: 12, marginBottom: 20 }}>
        {['keys', 'webhooks', 'apps', 'playground'].map((t) => (
          <button
            key={t}
            type="button"
            className={activeTab === t ? 'primary-btn' : 'small-outline-btn'}
            onClick={() => setActiveTab(t)}
            style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}
          >
            {t === 'keys' && <FiKey style={{ marginRight: 6 }} />}
            {t === 'webhooks' && <FiRadio style={{ marginRight: 6 }} />}
            {t === 'apps' && <FiCpu style={{ marginRight: 6 }} />}
            {t === 'playground' && <FiTerminal style={{ marginRight: 6 }} />}
            {t}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="API Key Name (e.g. Production Mobile App)"
              style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <button className="primary-btn" onClick={handleCreateKey}>
              <FiPlusCircle /> Generate API Key
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {keys.map((k) => (
              <div key={k._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{k.name}</div>
                  <code style={{ fontSize: '0.8rem', color: 'var(--cms-accent)', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4 }}>{k.key}</code>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>Permissions: {k.permissions?.join(', ')} · Status: {k.status}</div>
                </div>

                {k.status === 'active' && (
                  <button type="button" className="small-outline-btn" style={{ color: '#ef4444', borderColor: '#ef444450' }} onClick={() => handleRevokeKey(k._id)}>
                    <FiTrash2 /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Target Webhook URL (https://your-server.com/webhook)"
              style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <button className="primary-btn" onClick={handleCreateWebhook}>
              <FiPlusCircle /> Add Webhook
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {webhooks.map((w) => (
              <div key={w._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{w.targetUrl}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '4px 0' }}>Subscribed Events: {w.events?.join(', ')}</div>
                <code style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Secret: {w.secret}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apps Tab */}
      {activeTab === 'apps' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="OAuth Application Name"
              style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <button className="primary-btn" onClick={handleCreateApp}>
              <FiPlusCircle /> Create App
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apps.map((a) => (
              <div key={a._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>Client ID: <code>{a.clientId}</code></div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Client Secret: <code>{a.clientSecret}</code></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive API Playground Tab */}
      {activeTab === 'playground' && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Interactive API Playground & Code Snippet Exporter</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--muted)' }}>Generate cURL, JavaScript, and Python SDK code for calling MyJourney API.</p>

          <div style={{ background: '#18191b', padding: 16, borderRadius: 8, color: '#10b981', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6 }}>
            <div># cURL Example:</div>
            <div>curl -X GET "http://localhost:5000/api/search?q=technology" \</div>
            <div>  -H "Authorization: Bearer mj_live_your_token_here"</div>
          </div>
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/developers', component: DeveloperPortalModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'developer-portal', label: 'Developer Portal', icon: FiCode, path: '/cms/developers', group: 'Stage 5: Search & Knowledge', order: 12 });

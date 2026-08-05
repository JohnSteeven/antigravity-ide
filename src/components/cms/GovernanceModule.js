/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  GovernanceModule.js  —  CMS Enterprise Security, Compliance & Governance
 *  MyJourney CMS  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiShield, FiLock, FiKey, FiFileText, FiUsers, FiPlusCircle,
  FiCheckCircle, FiAlertCircle, FiDatabase, FiRefreshCw, FiUnlock
} from 'react-icons/fi';

export default function GovernanceModule() {
  const [orgs, setOrgs] = useState([]);
  const [idps, setIdps] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [activeTab, setActiveTab] = useState('orgs');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [idpName, setIdpName] = useState('');
  const [idpType, setIdpType] = useState('saml2');
  const [policyName, setPolicyName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [secretValue, setSecretValue] = useState('');

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [orgRes, idpRes, polRes, secRes] = await Promise.all([
        apiService.get('/api/governance/orgs').catch(() => null),
        apiService.get('/api/governance/idps').catch(() => null),
        apiService.get('/api/governance/policies').catch(() => null),
        apiService.get('/api/governance/secrets').catch(() => null),
      ]);

      if (orgRes?.data) setOrgs(orgRes.data);
      if (idpRes?.data) setIdps(idpRes.data);
      if (polRes?.data) setPolicies(polRes.data);
      if (secRes?.data) setSecrets(secRes.data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    try {
      await apiService.post('/api/governance/orgs', { name: orgName });
      setOrgName('');
      notify('success', 'Enterprise Organization created!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleCreateIdp = async () => {
    if (!idpName.trim()) return;
    try {
      await apiService.post('/api/governance/idps', { name: idpName, type: idpType });
      setIdpName('');
      notify('success', 'SSO Identity Provider registered!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleCreatePolicy = async () => {
    if (!policyName.trim()) return;
    try {
      await apiService.post('/api/governance/policies', { name: policyName, passwordMinLength: 14, sessionTimeoutMinutes: 60 });
      setPolicyName('');
      notify('success', 'Security Policy saved!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleSaveSecret = async () => {
    if (!secretKey.trim() || !secretValue.trim()) return;
    try {
      await apiService.post('/api/governance/secrets', { secretKey, value: secretValue });
      setSecretKey('');
      setSecretValue('');
      notify('success', 'Secret encrypted and stored in Secret Vault!');
      fetchData();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleGdprExport = async () => {
    try {
      await apiService.post('/api/governance/compliance/export');
      notify('success', 'GDPR Data Export record generated!');
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 6 · Enterprise Governance</span>
          <h2>Security, Compliance & Governance Center</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Manage organizations, SSO identity providers, security policies, GDPR compliance, and Secret Vault keys.
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
        {['orgs', 'idps', 'policies', 'compliance', 'secrets'].map((t) => (
          <button
            key={t}
            type="button"
            className={activeTab === t ? 'primary-btn' : 'small-outline-btn'}
            onClick={() => setActiveTab(t)}
            style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}
          >
            {t === 'orgs' && <FiUsers style={{ marginRight: 6 }} />}
            {t === 'idps' && <FiShield style={{ marginRight: 6 }} />}
            {t === 'policies' && <FiLock style={{ marginRight: 6 }} />}
            {t === 'compliance' && <FiFileText style={{ marginRight: 6 }} />}
            {t === 'secrets' && <FiKey style={{ marginRight: 6 }} />}
            {t}
          </button>
        ))}
      </div>

      {/* Organizations Tab */}
      {activeTab === 'orgs' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enterprise Organization Name"
              style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <button className="primary-btn" onClick={handleCreateOrg}>
              <FiPlusCircle /> Create Organization
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orgs.map((o) => (
              <div key={o._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{o.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>Owner: {o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : 'Admin'} · Status: {o.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SSO Identity Providers Tab */}
      {activeTab === 'idps' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, marginBottom: 20 }}>
            <input
              value={idpName}
              onChange={(e) => setIdpName(e.target.value)}
              placeholder="SSO Provider Name (e.g. Corporate Azure AD)"
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <select value={idpType} onChange={(e) => setIdpType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8 }}>
              <option value="saml2">SAML 2.0</option>
              <option value="azure_ad">Azure AD</option>
              <option value="okta">Okta</option>
              <option value="google_workspace">Google Workspace</option>
            </select>
            <button className="primary-btn" onClick={handleCreateIdp}>
              <FiPlusCircle /> Add SSO Provider
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {idps.map((i) => (
              <div key={i._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{i.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>Protocol/Type: <span style={{ textTransform: 'uppercase', color: 'var(--cms-accent)' }}>{i.type}</span> · Status: {i.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Policies Tab */}
      {activeTab === 'policies' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Security Policy Name (e.g. Strict Enterprise Compliance)"
              style={{ flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <button className="primary-btn" onClick={handleCreatePolicy}>
              <FiPlusCircle /> Save Policy
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {policies.map((p) => (
              <div key={p._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                  Min Password Length: {p.passwordMinLength} chars · Session Timeout: {p.sessionTimeoutMinutes} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Center Tab */}
      {activeTab === 'compliance' && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '1rem' }}>GDPR & CCPA Data Privacy Center</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--muted)' }}>Generate data exports or process privacy deletion requests for compliance auditing.</p>

          <button className="primary-btn" onClick={handleGdprExport}>
            <FiFileText /> Generate GDPR Data Export Log
          </button>
        </div>
      )}

      {/* Secret Vault Tab */}
      {activeTab === 'secrets' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 20 }}>
            <input
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Secret Key Name (e.g. OAUTH_CLIENT_SECRET)"
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <input
              type="password"
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
              placeholder="Secret Value (AES-256 Encrypted)"
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink)' }}
            />
            <button className="primary-btn" onClick={handleSaveSecret}>
              <FiKey /> Store Secret
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {secrets.map((s) => (
              <div key={s._id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <code style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cms-accent)' }}>{s.secretKey}</code>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>Version: v{s.version} · AES-256 Encrypted</div>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'var(--soft)', padding: '2px 8px', borderRadius: 4 }}>Encrypted</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/governance', component: GovernanceModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'governance', label: 'Governance & Security', icon: FiShield, path: '/cms/governance', group: 'Stage 6: Enterprise Security', order: 14 });

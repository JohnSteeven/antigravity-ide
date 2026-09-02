/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TenantManagerModule.js  —  CMS Multi-Tenant & White-Label Site Manager
 *  MyJourney CMS  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGlobe, FiLayers, FiPlusCircle, FiEdit2, FiCheckCircle,
  FiAlertCircle, FiSettings, FiDroplet, FiShield, FiExternalLink
} from 'react-icons/fi';

export default function TenantManagerModule() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form states
  const [newSiteName, setNewSiteName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#426c67');

  const notify = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/tenants');
      if (res?.data) {
        setTenants(res.data);
        if (!selectedTenant && res.data.length > 0) setSelectedTenant(res.data[0]);
      }
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async () => {
    if (!newSiteName.trim() || !newDomain.trim()) return;
    try {
      await apiService.post('/api/tenants', { name: newSiteName, domain: newDomain });
      setNewSiteName('');
      setNewDomain('');
      notify('success', 'New tenant site created!');
      fetchTenants();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleSaveBranding = async () => {
    if (!selectedTenant) return;
    try {
      await apiService.patch(`/api/tenants/${selectedTenant._id}/branding`, { primaryColor });
      notify('success', 'White-label branding saved!');
      fetchTenants();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 5 · Multi-Tenant Platform</span>
          <h2>Multi-Site & White-Label Console</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            Manage independent tenant websites, configure custom domains, and edit white-label brand colors.
          </p>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, background: '#fdf1f0', color: '#9d3e32' }}>
          <FiAlertCircle /> <span>{notification.text}</span>
        </div>
      )}

      {/* Create New Tenant Bar */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 18, marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Create New Tenant Website</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
          <input
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
            placeholder="Site Name (e.g. Tech Horizon Blog)"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--soft)', color: 'var(--ink)' }}
          />
          <input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Domain / Subdomain (e.g. tech.myjourney.com)"
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--soft)', color: 'var(--ink)' }}
          />
          <button className="primary-btn" onClick={handleCreateTenant}>
            <FiPlusCircle /> Create Tenant
          </button>
        </div>
      </div>

      {/* Tenant List Grid */}
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiGlobe style={{ color: 'var(--cms-accent)' }} /> Active Tenant Sites ({tenants.length})
      </h3>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Loading tenant sites...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {tenants.map((t) => {
            const isSelected = selectedTenant?._id === t._id;
            return (
              <div
                key={t._id}
                onClick={() => { setSelectedTenant(t); setPrimaryColor(t.primaryColor || '#426c67'); }}
                style={{
                  background: 'var(--panel)',
                  border: isSelected ? '2px solid var(--cms-accent)' : '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{t.name}</h4>
                  <span style={{ fontSize: '0.68rem', background: '#10b98120', color: '#10b981', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>{t.status}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 12 }}>Domain: <code>{t.domain}</code></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.primaryColor || '#426c67' }} />
                  <span>Primary Color: {t.primaryColor || '#426c67'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Tenant White-Label Editor */}
      {selectedTenant && (
        <div style={{ marginTop: 28, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiDroplet style={{ color: 'var(--cms-accent)' }} /> White-Label Branding Editor for "{selectedTenant.name}"
          </h4>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem' }}>Primary Theme Color:</label>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ border: 'none', width: 40, height: 32, cursor: 'pointer' }} />
            <button className="primary-btn" onClick={handleSaveBranding}>
              Save White-Label Branding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

registerRoute({ path: '/cms/tenants', component: TenantManagerModule, auth: true, permissions: ['settings.manage'] });
registerSidebar({ key: 'tenant-manager', label: 'Multi-Site & White-Label', icon: FiGlobe, path: '/cms/tenants', group: 'Stage 5: Search & Knowledge', order: 13 });

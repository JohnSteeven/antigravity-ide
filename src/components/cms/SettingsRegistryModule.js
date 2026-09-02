/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SettingsRegistryModule.js  —  Dynamic CMS Settings Browser & Editor
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiSettings,
  FiSearch,
  FiLock,
  FiSave,
  FiClock,
  FiDownload,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiRotateCcw,
} from 'react-icons/fi';

const CATEGORIES = ['General', 'SEO', 'Theme', 'Email', 'Analytics', 'Security', 'Social', 'Performance', 'Search', 'Media'];

export default function SettingsRegistryModule() {
  const [settings, setSettings] = useState([]);
  const [activeCategory, setActiveCategory] = useState('General');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [notification, setNotification] = useState(null);
  const [revisions, setRevisions] = useState({});
  const [activeRevisionKey, setActiveRevisionKey] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(`/api/settings-registry?category=${activeCategory}`);
      if (res?.data) {
        setSettings(res.data);
        const initialForm = {};
        res.data.forEach((s) => {
          initialForm[s.key] = s.value || {};
        });
        setFormValues(initialForm);
      }
    } catch (err) {
      console.error('[SettingsRegistry] Error loading settings:', err);
      setNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFieldChange = (settingKey, fieldName, val) => {
    setFormValues((prev) => ({
      ...prev,
      [settingKey]: {
        ...prev[settingKey],
        [fieldName]: val,
      },
    }));
  };

  const handleSaveSetting = async (settingKey) => {
    try {
      setSavingKey(settingKey);
      const val = formValues[settingKey] || {};
      const res = await apiService.put(`/api/settings-registry/${settingKey}`, val);
      if (res?.data) {
        setNotification({ type: 'success', text: `Setting '${settingKey}' saved successfully.` });
        setFormValues((prev) => ({ ...prev, [settingKey]: res.data.value || {} }));
      }
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiService.get('/api/settings-registry/export');
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cms-settings-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setNotification({ type: 'error', text: 'Export failed: ' + err.message });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          const res = await apiService.post('/api/settings-registry/import', importData);
          setNotification({ type: 'success', text: res.message || 'Settings imported successfully.' });
          fetchSettings();
        } catch (jsonErr) {
          setNotification({ type: 'error', text: 'Invalid JSON file: ' + jsonErr.message });
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setNotification({ type: 'error', text: 'Import failed: ' + err.message });
    }
  };

  const fetchRevisions = async (settingKey) => {
    if (activeRevisionKey === settingKey) {
      setActiveRevisionKey(null);
      return;
    }
    try {
      const res = await apiService.get(`/api/settings-registry/${settingKey}/revisions`);
      if (res?.data) {
        setRevisions((prev) => ({ ...prev, [settingKey]: res.data }));
        setActiveRevisionKey(settingKey);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRollback = async (settingKey, revisionId) => {
    try {
      const res = await apiService.post(`/api/settings-registry/${settingKey}/rollback/${revisionId}`);
      if (res?.data) {
        setNotification({ type: 'success', text: `Rolled back '${settingKey}' to version ${res.data.version}.` });
        fetchSettings();
        setActiveRevisionKey(null);
      }
    } catch (err) {
      setNotification({ type: 'error', text: 'Rollback failed: ' + err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Operations</span>
          <h2>Dynamic Settings Registry</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="secondary-btn" onClick={handleExport} title="Export All Settings to JSON">
            <FiDownload /> Export JSON
          </button>
          <label className="secondary-btn" style={{ cursor: 'pointer' }} title="Import Settings from JSON">
            <FiUpload /> Import JSON
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            backgroundColor: notification.type === 'success' ? 'var(--color-success-bg, #e8f5ee)' : 'var(--color-danger-bg, #fdf1f0)',
            color: notification.type === 'success' ? 'var(--color-success, #2e7d5a)' : 'var(--color-danger, #9d3e32)',
            border: '1px solid currentColor',
          }}
        >
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Category Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', borderBottom: '1px solid var(--color-line, #eee)', paddingBottom: '8px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: 'none',
              backgroundColor: activeCategory === cat ? 'var(--cms-accent, #426c67)' : 'transparent',
              color: activeCategory === cat ? '#fff' : 'var(--color-ink, #444)',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Settings List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted, #888)' }}>Loading {activeCategory} settings...</div>
      ) : settings.length === 0 ? (
        <div className="empty-state">No settings registered under '{activeCategory}'.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {settings.map((setting) => {
            const currentVals = formValues[setting.key] || {};
            const schema = setting.schema || {};

            return (
              <div
                key={setting.key}
                style={{
                  background: 'var(--color-panel, #fff)',
                  border: '1px solid var(--color-line, #e4ded4)',
                  borderRadius: 'var(--radius-lg, 14px)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{setting.title}</h3>
                      {setting.isSecret && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gold, #b58b5f)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FiLock /> Encrypted
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--color-muted, #666)' }}>{setting.description}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => fetchRevisions(setting.key)}
                      title="Revision History"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiClock /> Revisions ({setting.version || 1})
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => handleSaveSetting(setting.key)}
                      disabled={savingKey === setting.key}
                    >
                      <FiSave /> {savingKey === setting.key ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Dynamic Schema-driven Fields Form */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {Object.entries(schema).map(([fieldKey, fieldDef]) => {
                    const fieldVal = currentVals[fieldKey] !== undefined ? currentVals[fieldKey] : fieldDef.default ?? '';
                    const fieldType = fieldDef.type || 'text';

                    return (
                      <div key={fieldKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-ink, #333)' }}>
                          {fieldDef.label || fieldKey}
                          {fieldDef.required && <span style={{ color: 'var(--color-danger, #d9534f)' }}> *</span>}
                        </label>

                        {fieldType === 'textarea' ? (
                          <textarea
                            value={fieldVal}
                            onChange={(e) => handleFieldChange(setting.key, fieldKey, e.target.value)}
                            placeholder={fieldDef.placeholder || ''}
                            rows={3}
                          />
                        ) : fieldType === 'color' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="color"
                              value={fieldVal || '#000000'}
                              onChange={(e) => handleFieldChange(setting.key, fieldKey, e.target.value)}
                              style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: 0 }}
                            />
                            <input
                              type="text"
                              value={fieldVal}
                              onChange={(e) => handleFieldChange(setting.key, fieldKey, e.target.value)}
                              style={{ flex: 1 }}
                            />
                          </div>
                        ) : fieldType === 'select' ? (
                          <select value={fieldVal} onChange={(e) => handleFieldChange(setting.key, fieldKey, e.target.value)}>
                            {(fieldDef.options || []).map((opt) => {
                              const val = typeof opt === 'object' ? opt.value : opt;
                              const lbl = typeof opt === 'object' ? opt.label : opt;
                              return <option key={val} value={val}>{lbl}</option>;
                            })}
                          </select>
                        ) : fieldType === 'password' ? (
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPasswords[`${setting.key}_${fieldKey}`] ? 'text' : 'password'}
                              value={fieldVal}
                              onChange={(e) => handleFieldChange(setting.key, fieldKey, e.target.value)}
                              placeholder="********"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords((p) => ({ ...p, [`${setting.key}_${fieldKey}`]: !p[`${setting.key}_${fieldKey}`] }))}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}
                            >
                              {showPasswords[`${setting.key}_${fieldKey}`] ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        ) : fieldType === 'number' ? (
                          <input
                            type="number"
                            value={fieldVal}
                            onChange={(e) => handleFieldChange(setting.key, fieldKey, Number(e.target.value))}
                            min={fieldDef.min}
                            max={fieldDef.max}
                          />
                        ) : (
                          <input
                            type="text"
                            value={fieldVal}
                            onChange={(e) => handleFieldChange(setting.key, fieldKey, e.target.value)}
                            placeholder={fieldDef.placeholder || ''}
                          />
                        )}

                        {fieldDef.helpText && <span style={{ fontSize: '0.72rem', color: 'var(--color-muted, #888)' }}>{fieldDef.helpText}</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Revision History Sub-panel */}
                {activeRevisionKey === setting.key && (
                  <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.8rem' }}>
                    <strong style={{ display: 'block', marginBottom: '8px' }}>Version History ({revisions[setting.key]?.length || 0})</strong>
                    {(!revisions[setting.key] || revisions[setting.key].length === 0) ? (
                      <span style={{ color: '#888' }}>No prior revisions recorded.</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {revisions[setting.key].map((rev) => (
                          <div key={rev._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                            <span>
                              Version <strong>v{rev.version}</strong> ({new Date(rev.createdAt).toLocaleString()}) — <em>{rev.reason}</em>
                            </span>
                            <button
                              type="button"
                              className="small-outline-btn"
                              onClick={() => handleRollback(setting.key, rev._id)}
                              style={{ fontSize: '0.72rem' }}
                            >
                              <FiRotateCcw /> Restore v{rev.version}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/settings-registry',
  component: SettingsRegistryModule,
  auth: true,
  permissions: ['settings.manage'],
});

registerSidebar({
  key: 'settings-registry',
  label: 'Settings Registry',
  icon: FiSettings,
  path: '/cms/settings-registry',
  group: 'Operations',
  order: 2,
});

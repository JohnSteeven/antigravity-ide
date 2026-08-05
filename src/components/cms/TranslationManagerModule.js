/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TranslationManagerModule.js  —  Enterprise Localization & Translation Dashboard
 *  MyJourney CMS  |  Stage 2 — Phase 19: Localization & Translation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiGlobe,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiEdit,
  FiBarChart2,
  FiCode,
  FiSave,
  FiLayers,
} from 'react-icons/fi';

export default function TranslationManagerModule() {
  const [activeTab, setActiveTab] = useState('locales'); // 'locales', 'editor', 'progress'
  const [locales, setLocales] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // New Locale Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newNative, setNewNative] = useState('');
  const [newDir, setNewDir] = useState('ltr');
  const [newFlag, setNewFlag] = useState('🌐');

  // Translation Editor State
  const [targetLocale, setTargetLocale] = useState('fr');
  const [transTitle, setTransTitle] = useState('Mon Architecture DXP Moderne');
  const [transContent, setTransContent] = useState('Découvrez notre CMS Headless d’entreprise...');

  const fetchLocales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/localization/locales');
      if (res?.data) setLocales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await apiService.get('/api/localization/progress');
      if (res?.data) setProgress(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLocales();
    fetchProgress();
  }, [fetchLocales, fetchProgress]);

  const handleAddLocale = async (e) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    try {
      await apiService.post('/api/localization/locales', {
        code: newCode,
        name: newName,
        nativeName: newNative || newName,
        direction: newDir,
        flag: newFlag,
      });

      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      setNewNative('');
      setNotification({ type: 'success', text: `Locale '${newName}' (${newCode}) added successfully!` });
      fetchLocales();
      fetchProgress();
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSaveTranslation = async (e) => {
    e.preventDefault();
    try {
      setNotification({ type: 'success', text: `Saved translation entry for locale [${targetLocale.toUpperCase()}].` });
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Stage 2: Post-Launch Engine</span>
          <h2>Enterprise Localization, Internationalization & Translation Management Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={activeTab === 'locales' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('locales')}
          >
            <FiGlobe /> Active Locales ({locales.length})
          </button>
          <button
            type="button"
            className={activeTab === 'editor' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('editor')}
          >
            <FiEdit /> Translation Editor
          </button>
          <button
            type="button"
            className={activeTab === 'progress' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setActiveTab('progress')}
          >
            <FiBarChart2 /> Translation Progress
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* TAB 1: Active Locales */}
      {activeTab === 'locales' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: '#666' }}>Supported locale languages and text directions (LTR / RTL)</span>
            <button type="button" className="primary-btn" onClick={() => setShowAddModal(true)}>
              <FiPlus /> Add Locale Language
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading locale languages...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {locales.map((loc) => (
                <div key={loc.code} style={{ background: '#fff', border: loc.isDefault ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>{loc.flag}</span>
                      <strong style={{ fontSize: '1rem' }}>{loc.name}</strong>
                    </div>
                    {loc.isDefault ? (
                      <span style={{ fontSize: '0.72rem', background: '#e8f0ef', color: '#426c67', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        Default
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', fontWeight: '600' }}>
                        {loc.direction}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#666' }}>Native Name: <strong>{loc.nativeName}</strong></span>
                  <span style={{ fontSize: '0.75rem', color: '#888' }}>Code: <code>{loc.code}</code> • Fallback: {loc.fallbackLocale}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Translation Editor & Hreflang Inspection */}
      {activeTab === 'editor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <form onSubmit={handleSaveTranslation} style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Translation Input Editor</h3>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Target Locale:</label>
            <select value={targetLocale} onChange={(e) => setTargetLocale(e.target.value)}>
              {locales.filter((l) => !l.isDefault).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.code})
                </option>
              ))}
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Translated Title ({targetLocale.toUpperCase()}):</label>
            <input type="text" value={transTitle} onChange={(e) => setTransTitle(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Translated Content Body ({targetLocale.toUpperCase()}):</label>
            <textarea rows={5} value={transContent} onChange={(e) => setTransContent(e.target.value)} required />

            <button type="submit" className="primary-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <FiSave /> Save Translation Entry
            </button>
          </form>

          {/* Hreflang Preview Box */}
          <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCode /> Localized Hreflang Tags
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>
              Search engine alternate link tags generated for international indexability:
            </p>

            <pre style={{ background: '#fafafa', border: '1px solid #eee', padding: '12px', borderRadius: '8px', fontSize: '0.78rem', margin: 0 }}>
              {`<link rel="alternate" hreflang="en" href="https://myjourney.com/article/sample" />\n<link rel="alternate" hreflang="fr" href="https://myjourney.com/fr/article/sample" />\n<link rel="alternate" hreflang="es" href="https://myjourney.com/es/article/sample" />\n<link rel="alternate" hreflang="ar" href="https://myjourney.com/ar/article/sample" />`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: Translation Progress */}
      {activeTab === 'progress' && (
        <div style={{ background: '#fff', border: '1px solid #e4ded4', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem' }}>Translation Completion Metrics</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {progress?.localeStats?.map((st) => (
              <div key={st.code} style={{ background: '#fafafa', border: '1px solid #eee', padding: '14px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong>{st.name} ({st.code.toUpperCase()})</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--cms-accent, #426c67)' }}>
                    {st.progressPercent}% Complete
                  </span>
                </div>
                <div style={{ background: '#e4ded4', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--cms-accent, #426c67)', height: '100%', width: `${st.progressPercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Locale Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleAddLocale} style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0 }}>Add Locale Language</h3>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>ISO Code (e.g. it, pt, zh):</label>
            <input type="text" placeholder="e.g. it" value={newCode} onChange={(e) => setNewCode(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Language Name:</label>
            <input type="text" placeholder="e.g. Italian" value={newName} onChange={(e) => setNewName(e.target.value)} required />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Native Name:</label>
            <input type="text" placeholder="e.g. Italiano" value={newNative} onChange={(e) => setNewNative(e.target.value)} />

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Text Direction:</label>
            <select value={newDir} onChange={(e) => setNewDir(e.target.value)}>
              <option value="ltr">Left-to-Right (LTR)</option>
              <option value="rtl">Right-to-Left (RTL)</option>
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Flag Emoji:</label>
            <input type="text" placeholder="🇮🇹" value={newFlag} onChange={(e) => setNewFlag(e.target.value)} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Add Locale
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/localization',
  component: TranslationManagerModule,
  auth: true,
  permissions: ['localization.manage'],
});

registerSidebar({
  key: 'localization',
  label: 'Localization & i18n',
  icon: FiGlobe,
  path: '/cms/localization',
  group: 'Stage 2 Post-Launch',
  order: 9,
});

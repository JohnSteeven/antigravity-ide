/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ThemeBuilderModule.js  —  Design System Engine Dashboard
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../services/apiService';
import { useThemeContext } from '../../context/ThemeContext';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import {
  FiDroplet,
  FiCheckCircle,
  FiAlertCircle,
  FiSliders,
  FiSave,
  FiCopy,
  FiEye,
  FiDownload,
  FiPlus,
  FiStar,
} from 'react-icons/fi';

export default function ThemeBuilderModule() {
  const { activeTheme, activateTheme, previewThemeTokens, refreshTheme } = useThemeContext();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/themes');
      if (res?.data) setThemes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleActivate = async (themeId) => {
    try {
      const res = await activateTheme(themeId);

      // Direct DOM injection as a guaranteed fallback — bypasses any React re-render delays
      const css = res?.cssVariables;
      if (css) {
        let styleEl = document.getElementById('cms-active-theme');
        if (styleEl) styleEl.remove();
        styleEl = document.createElement('style');
        styleEl.id = 'cms-active-theme';
        styleEl.innerHTML = css;
        document.head.appendChild(styleEl);
        console.log('[ThemeBuilder] Applied theme CSS directly to DOM');
      } else {
        console.warn('[ThemeBuilder] activateTheme returned no cssVariables:', res);
        // Fallback: fetch active theme and apply
        const activeRes = await apiService.get('/api/themes/active');
        const fallbackCss = activeRes?.cssVariables;
        if (fallbackCss) {
          let styleEl = document.getElementById('cms-active-theme');
          if (styleEl) styleEl.remove();
          styleEl = document.createElement('style');
          styleEl.id = 'cms-active-theme';
          styleEl.innerHTML = fallbackCss;
          document.head.appendChild(styleEl);
          console.log('[ThemeBuilder] Applied theme via fallback fetch');
        }
      }

      setNotification({ type: 'success', text: 'Theme set as default active theme.' });
      fetchThemes();
    } catch (err) {
      console.error('[ThemeBuilder] Activate failed:', err);
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleSaveTheme = async () => {
    if (!editingTheme) return;
    try {
      await apiService.patch(`/api/themes/${editingTheme._id}`, editingTheme);
      setNotification({ type: 'success', text: `Saved theme '${editingTheme.name}'` });
      refreshTheme();
      fetchThemes();
      setEditingTheme(null);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleColorChange = (key, hex) => {
    if (!editingTheme) return;
    const updated = {
      ...editingTheme,
      tokens: {
        ...editingTheme.tokens,
        colors: {
          ...editingTheme.tokens?.colors,
          [key]: hex,
        },
      },
    };
    setEditingTheme(updated);
    previewThemeTokens(updated); // Live preview instantly!
  };

  return (
    <div className="cms-panel wide">
      <div className="cms-panel-heading">
        <div>
          <span className="section-kicker">Experience</span>
          <h2>Design System Engine</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="primary-btn" onClick={fetchThemes}>
            Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: notification.type === 'success' ? '#e8f5ee' : '#fdf1f0', color: notification.type === 'success' ? '#2e7d5a' : '#9d3e32' }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Theme Presets Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#888' }}>Loading design system themes...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {themes.map((theme) => {
            const isCurrent = activeTheme?._id === theme._id || theme.isDefault;
            const colors = theme.tokens?.colors || {};

            return (
              <div key={theme._id} style={{ background: '#fff', border: isCurrent ? '2px solid var(--cms-accent, #426c67)' : '1px solid #e4ded4', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{theme.name}</h3>
                      {isCurrent && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--cms-accent-light, #e8f0ef)', color: 'var(--cms-accent, #426c67)', padding: '2px 8px', borderRadius: '100px', fontWeight: '700' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>Mode: {theme.mode}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>{theme.description || 'No description provided'}</p>

                {/* Color Palette Preview Swatches */}
                <div style={{ display: 'flex', gap: '6px', padding: '8px', background: '#fafafa', borderRadius: '8px' }}>
                  {['primary', 'secondary', 'accent', 'gold', 'background', 'text'].map((cKey) => (
                    <div key={cKey} title={`${cKey}: ${colors[cKey] || '#000'}`} style={{ flex: 1, height: '24px', borderRadius: '4px', background: colors[cKey] || '#ccc', border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>

                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <button type="button" className="small-outline-btn" onClick={() => setEditingTheme(theme)}>
                    <FiSliders /> Edit Tokens
                  </button>

                  {!isCurrent && (
                    <button type="button" className="primary-btn" onClick={() => handleActivate(theme._id)} style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                      Activate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Theme Token Inspector Drawer */}
      {editingTheme && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '440px', background: '#fff', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', pb: '12px' }}>
              <h3 style={{ margin: 0 }}>Design Tokens: {editingTheme.name}</h3>
              <button type="button" onClick={() => setEditingTheme(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            {/* Colors Swatches Editor */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>Color Palette Tokens</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['primary', 'secondary', 'accent', 'gold', 'background', 'surface', 'panel', 'text'].map((cKey) => {
                  const val = editingTheme.tokens?.colors?.[cKey] || '#000000';
                  return (
                    <div key={cKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>{cKey}:</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={val}
                          onChange={(e) => handleColorChange(cKey, e.target.value)}
                          style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '4px', padding: 0 }}
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleColorChange(cKey, e.target.value)}
                          style={{ flex: 1, fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom CSS */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>Custom CSS Overrides</h4>
              <textarea
                value={editingTheme.customCSS || ''}
                onChange={(e) => {
                  const updated = { ...editingTheme, customCSS: e.target.value };
                  setEditingTheme(updated);
                  previewThemeTokens(updated);
                }}
                rows={5}
                placeholder="/* Extra CSS overrides */"
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={() => setEditingTheme(null)}>
                Cancel
              </button>
              <button type="button" className="primary-btn" onClick={handleSaveTheme}>
                <FiSave /> Save Theme Tokens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Self Registration with CMS Core ─────────────────────────────────────────

registerRoute({
  path: '/cms/theme-builder',
  component: ThemeBuilderModule,
  auth: true,
  permissions: ['theme.manage'],
});

registerSidebar({
  key: 'theme-builder',
  label: 'Design System Engine',
  icon: FiDroplet,
  path: '/cms/theme-builder',
  group: 'Experience',
  order: 4,
});

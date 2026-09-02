/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ThemeBuilderModule.js  —  Design System Engine Dashboard
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../../services/apiService';
import { useThemeContext } from '../../context/ThemeContext';
import {
  THEME_COLOR_DEFAULTS,
  analyzeThemeAccessibility,
} from '../../utils/themeSafety';
import { registerRoute } from '../../core/registerRoute';
import { registerSidebar } from '../../core/registerSidebar';
import useDialogFocus from '../../hooks/useDialogFocus';
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
  FiMoon,
  FiSun,
  FiRefreshCw,
} from 'react-icons/fi';

export default function ThemeBuilderModule() {
  const {
    activeTheme,
    activateTheme,
    previewThemeTokens,
    resetThemePreview,
    refreshTheme,
  } = useThemeContext();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState(null);
  const [notification, setNotification] = useState(null);
  const editorRef = useRef(null);

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
      await activateTheme(themeId);
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
      await apiService.patch(`/api/themes/${editingTheme._id}`, {
        name: editingTheme.name,
        description: editingTheme.description,
        mode: editingTheme.mode,
        status: editingTheme.status,
        tokens: editingTheme.tokens,
      });
      setNotification({ type: 'success', text: `Saved theme '${editingTheme.name}'` });
      await refreshTheme();
      await fetchThemes();
      setEditingTheme(null);
    } catch (err) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const closeEditor = () => {
    resetThemePreview();
    setEditingTheme(null);
  };

  useDialogFocus({
    open: Boolean(editingTheme),
    containerRef: editorRef,
    onClose: closeEditor,
  });

  const resetColors = () => {
    const mode = editingTheme?.mode === 'dark' ? 'dark' : 'light';
    const updated = {
      ...editingTheme,
      tokens: {
        ...editingTheme.tokens,
        colors: { ...THEME_COLOR_DEFAULTS[mode] },
      },
    };
    setEditingTheme(updated);
    previewThemeTokens(updated, mode);
  };

  const applySuggestedForeground = (warning) => {
    const key = warning.pair.split('/')[0];
    if (!['text', 'muted', 'primary'].includes(key)) return;
    handleColorChange(key, warning.suggestedForeground);
  };

  const accessibility = editingTheme
    ? analyzeThemeAccessibility(editingTheme, editingTheme.mode === 'dark' ? 'dark' : 'light')
    : null;

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
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted, #666d6d)' }}>Loading design system themes...</div>
      ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {themes.map((theme) => {
            const isCurrent = activeTheme?._id === theme._id || theme.isDefault;
            const colors = theme.tokens?.colors || {};

            return (
              <div key={theme._id} style={{ background: 'var(--surface-card, #fff)', color: 'var(--text-primary, #2f3133)', border: isCurrent ? '2px solid var(--cms-accent, #426c67)' : '1px solid var(--border-subtle, #e4ded4)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{theme.name}</h3>
                      {isCurrent && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--surface-subtle, #e8f0ef)', color: 'var(--text-primary, #2f3133)', padding: '2px 8px', borderRadius: '100px', fontWeight: '700' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #666d6d)' }}>Mode: {theme.mode}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary, #666d6d)' }}>{theme.description || 'No description provided'}</p>

                {/* Color Palette Preview Swatches */}
                <div style={{ display: 'flex', gap: '6px', padding: '8px', background: 'var(--surface-subtle, #fafafa)', borderRadius: '8px' }}>
                  {['primary', 'secondary', 'accent', 'gold', 'background', 'text'].map((cKey) => (
                    <div key={cKey} title={`${cKey}: ${colors[cKey] || '#000'}`} style={{ flex: 1, height: '24px', borderRadius: '4px', background: colors[cKey] || '#ccc', border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>

                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle, #eee)', paddingTop: '10px' }}>
                  <button type="button" className="small-outline-btn" onClick={() => {
                    setEditingTheme(theme);
                    previewThemeTokens(theme);
                  }}>
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
          <div ref={editorRef} role="dialog" aria-modal="true" aria-labelledby="theme-editor-title" tabIndex="-1" style={{ width: 'min(520px, 100%)', background: 'var(--surface-elevated, #fff)', color: 'var(--text-primary, #2f3133)', height: '100%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle, #eee)', paddingBottom: '12px' }}>
              <h3 id="theme-editor-title" style={{ margin: 0 }}>Design Tokens: {editingTheme.name}</h3>
              <button type="button" aria-label="Close theme editor" onClick={closeEditor} style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div>
              <label htmlFor="theme-mode" style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700 }}>Theme mode</label>
              <select
                id="theme-mode"
                value={editingTheme.mode || 'light'}
                onChange={(event) => {
                  const updated = { ...editingTheme, mode: event.target.value };
                  setEditingTheme(updated);
                  previewThemeTokens(updated, event.target.value === 'dark' ? 'dark' : 'light');
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
                <option value="high-contrast">High contrast</option>
                <option value="sepia">Sepia</option>
              </select>
            </div>

            {/* Colors Swatches Editor */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>Color Palette Tokens</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {['primary', 'secondary', 'accent', 'gold', 'background', 'surface', 'panel', 'text', 'muted', 'border'].map((cKey) => {
                  const editorMode = editingTheme.mode === 'dark' ? 'dark' : 'light';
                  const val = editingTheme.tokens?.colors?.[cKey] || THEME_COLOR_DEFAULTS[editorMode][cKey] || '#000000';
                  const colorInputValue = /^#[0-9a-f]{6}$/i.test(val) ? val : '#000000';
                  return (
                    <div key={cKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'capitalize' }}>{cKey}:</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={colorInputValue}
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

            <div aria-live="polite" style={{ padding: '14px', border: `1px solid ${accessibility.pass ? 'var(--success, #2e7d5a)' : 'var(--warning, #8f6b48)'}`, borderRadius: '8px', background: 'var(--surface-subtle, #f8faf8)' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem' }}>Accessibility contrast</h4>
              {accessibility.warnings.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--success, #2e7d5a)' }}>All representative foreground/background pairs pass.</p>
              ) : accessibility.warnings.map((warning) => (
                <div key={warning.pair} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <span>{warning.pair}: {warning.ratio ?? 'unknown'}:1 (needs {warning.required}:1)</span>
                  <button type="button" className="small-outline-btn" onClick={() => applySuggestedForeground(warning)}>
                    Use {warning.suggestedForeground}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid var(--border-subtle, #e4ded4)', borderRadius: '10px', padding: '16px', background: 'var(--surface-card, #fff)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Representative component preview</span>
              <h4 style={{ margin: '8px 0', color: 'var(--text-primary)' }}>Readable heading and card</h4>
              <p style={{ color: 'var(--text-secondary)' }}>Body, metadata, links, controls, and focus states use semantic foreground/background relationships.</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="primary-btn">Primary action</button>
                <button type="button" className="small-outline-btn">Secondary action</button>
                <a href="#theme-preview" onClick={(event) => event.preventDefault()} style={{ color: 'var(--link)', textDecoration: 'underline' }}>Preview link</a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="small-outline-btn" onClick={() => previewThemeTokens(editingTheme, 'light')}><FiSun /> Preview Light</button>
              <button type="button" className="small-outline-btn" onClick={() => previewThemeTokens(editingTheme, 'dark')}><FiMoon /> Preview Dark</button>
              <button type="button" className="small-outline-btn" onClick={resetColors}><FiRefreshCw /> Reset colors</button>
            </div>

            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>Raw CSS and JavaScript are intentionally unavailable. Themes use versioned, validated design tokens.</p>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="secondary-btn" onClick={closeEditor}>
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

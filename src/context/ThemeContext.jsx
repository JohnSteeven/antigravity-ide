/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ThemeContext.jsx  —  Live Design System Theme Provider
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Fetches the active theme from /api/themes/active, dynamically injects
 *  CSS variable tokens into a <style id="cms-active-theme"> element in <head>,
 *  and supports instant live theme preview without page reloads.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import apiService from '../services/apiService';

export const ThemeContext = createContext({
  activeTheme: null,
  cssVariables: '',
  loading: true,
  activateTheme: async (themeId) => { },
  previewThemeTokens: (tokens, customCSS) => { },
});

export const ThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState(null);
  const [cssVariables, setCssVariables] = useState('');
  const [loading, setLoading] = useState(true);

  const applyCSSToHead = useCallback((cssString) => {
    if (!cssString) return;
    // Remove old style element first so we can re-append to the very bottom of <head>
    const existing = document.getElementById('cms-active-theme');
    if (existing) existing.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'cms-active-theme';
    styleEl.innerHTML = cssString;
    // Append at the END of <head> so it has highest specificity over index.css
    document.head.appendChild(styleEl);
  }, []);

  const fetchActiveTheme = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/api/themes/active');
      if (res?.data) {
        setActiveTheme(res.data);
        setCssVariables(res.cssVariables || '');
        applyCSSToHead(res.cssVariables);
      }
    } catch (err) {
      console.warn('[ThemeContext] Failed to load active theme:', err.message);
    } finally {
      setLoading(false);
    }
  }, [applyCSSToHead]);

  useEffect(() => {
    fetchActiveTheme();
  }, [fetchActiveTheme]);

  const activateTheme = async (themeId) => {
    try {
      const res = await apiService.post(`/api/themes/${themeId}/publish`);
      if (res?.data) {
        setActiveTheme(res.data);
        setCssVariables(res.cssVariables || '');
        applyCSSToHead(res.cssVariables);
      }
      return res;
    } catch (err) {
      console.error('[ThemeContext] Activate theme error:', err);
      throw err;
    }
  };

  const previewThemeTokens = (themeObj) => {
    if (!themeObj || !themeObj.tokens) return;
    const c = themeObj.tokens.colors || {};
    const t = themeObj.tokens.typography || {};
    const r = themeObj.tokens.radii || {};
    const s = themeObj.tokens.shadows || {};
    const isDark = themeObj.mode === 'dark';

    // Map theme tokens → actual CSS variables used by index.css
    const css = `
      :root {
        /* ── Core palette ── */
        --paper:   ${c.background || (isDark ? '#0d1117' : '#fbfaf7')} !important;
        --surface: ${c.surface   || (isDark ? '#161b22' : '#ffffff')} !important;
        --panel:   ${c.panel     || (isDark ? '#161b22' : '#ffffff')} !important;
        --ink:     ${c.text      || (isDark ? '#f0f6fc' : '#2f3133')} !important;
        --muted:   ${c.muted     || (isDark ? '#8b949e' : '#666d6d')} !important;
        --line:    ${c.border    || (isDark ? '#30363d' : '#e4ded4')} !important;
        --teal:    ${c.primary   || '#426c67'} !important;
        --gold:    ${c.gold      || '#b58b5f'} !important;
        --blue:    ${c.secondary || '#4d6478'} !important;
        --soft:    ${c.background || (isDark ? '#161b22' : '#f1eee8')} !important;

        /* ── CMS accent tokens ── */
        --cms-accent:       ${c.primary || '#426c67'} !important;
        --cms-accent-hover: ${c.accent  || '#426c67'} !important;
        --cms-bg:           ${c.background || (isDark ? '#0d1117' : '#f3f6f4')} !important;
        --cms-sidebar:      ${isDark ? '#0d1117' : '#1e2523'} !important;
        --control-bg:       ${c.surface || (isDark ? '#161b22' : '#ffffff')} !important;
        --control-border:   ${c.border  || (isDark ? '#30363d' : '#d7cec3')} !important;

        /* ── Typography ── */
        --font-heading: ${t.headingFont || 'Outfit, sans-serif'};
        --font-body:    ${t.bodyFont    || 'Plus Jakarta Sans, sans-serif'};

        /* ── Spacing scale ── */
        --radius-sm:   ${r.small  || '4px'};
        --radius-md:   ${r.medium || '8px'};
        --radius-lg:   ${r.large  || '14px'};
        --radius-pill: ${r.pill   || '100px'};

        /* ── Shadows ── */
        --shadow-sm: ${s.sm || '0 1px 4px rgba(0,0,0,0.06)'};
        --shadow-md: ${s.md || '0 4px 16px rgba(0,0,0,0.09)'};
        --shadow-lg: ${s.lg || '0 18px 45px rgba(0,0,0,0.12)'};
      }

      body {
        background: var(--paper) !important;
        color: var(--ink) !important;
        font-family: var(--font-body) !important;
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading) !important;
      }

      ${themeObj.customCSS || ''}
    `;

    applyCSSToHead(css);
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        cssVariables,
        loading,
        activateTheme,
        previewThemeTokens,
        refreshTheme: fetchActiveTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

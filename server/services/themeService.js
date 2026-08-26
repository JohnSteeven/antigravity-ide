/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  themeService.js  —  Design System Theme Service
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Theme = require('../models/Theme');
const {
  COLOR_DEFAULTS,
  analyzeThemeAccessibility,
  safeStoredTokens,
  suggestedForeground,
} = require('./themeSafety');

const DEFAULT_9_THEMES = [
  {
    key: 'myjourney',
    name: 'MyJourney Original',
    description: 'Warm editorial aesthetic with deep teal accents and gold highlights',
    mode: 'light',
    isDefault: true,
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#426c67', secondary: '#4d6478', accent: '#426c67', gold: '#b58b5f', background: '#f5f0eb', panel: '#fdfbf7', text: '#2f3133', border: '#e4ded4' },
      typography: { headingFont: 'Outfit, sans-serif', bodyFont: 'Plus Jakarta Sans, sans-serif' },
    },
  },
  {
    key: 'minimal',
    name: 'Minimal Mono',
    description: 'High-contrast monochrome theme with clean typography',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#111111', secondary: '#333333', accent: '#111111', gold: '#555555', background: '#ffffff', panel: '#fafafa', text: '#111111', border: '#eeeeee' },
      typography: { headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif' },
    },
  },
  {
    key: 'dark-pro',
    name: 'Dark Pro',
    description: 'Sleek dark mode palette with vibrant cyan and violet accents',
    mode: 'dark',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#00d2ff', secondary: '#92fe9d', accent: '#00d2ff', gold: '#ffd166', background: '#0d1117', surface: '#161b22', panel: '#161b22', text: '#f0f6fc', muted: '#8b949e', border: '#30363d' },
      typography: { headingFont: 'Outfit, sans-serif', bodyFont: 'Plus Jakarta Sans, sans-serif' },
    },
  },
  {
    key: 'editorial',
    name: 'Classic Editorial',
    description: 'Serif typography for literary journals and deep reading',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#8b0000', secondary: '#4a3b32', accent: '#8b0000', gold: '#c5a059', background: '#faf8f5', panel: '#ffffff', text: '#2b2b2b', border: '#e8e2d9' },
      typography: { headingFont: 'Playfair Display, serif', bodyFont: 'Lora, serif' },
    },
  },
  {
    key: 'glass',
    name: 'Glassmorphism',
    description: 'Modern translucent panels with subtle backdrop blurs',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#6366f1', secondary: '#a855f7', accent: '#6366f1', gold: '#f59e0b', background: '#f1f5f9', panel: 'rgba(255,255,255,0.7)', text: '#0f172a', border: 'rgba(255,255,255,0.5)' },
    },
  },
  {
    key: 'corporate',
    name: 'Corporate Enterprise',
    description: 'Trustworthy corporate blue with structured grid spacing',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#0f172a', secondary: '#2563eb', accent: '#2563eb', gold: '#d97706', background: '#f8fafc', panel: '#ffffff', text: '#1e293b', border: '#e2e8f0' },
    },
  },
  {
    key: 'magazine',
    name: 'Vibrant Magazine',
    description: 'Bold color contrasts designed for high-impact media outlets',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#e11d48', secondary: '#0284c7', accent: '#e11d48', gold: '#f59e0b', background: '#ffffff', panel: '#fff1f2', text: '#0f172a', border: '#fecdd3' },
    },
  },
  {
    key: 'portfolio',
    name: 'Creative Portfolio',
    description: 'Subtle slate tones emphasizing high-resolution visual work',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#18181b', secondary: '#52525b', accent: '#18181b', gold: '#a1a1aa', background: '#fafafa', panel: '#ffffff', text: '#18181b', border: '#e4e4e7' },
    },
  },
  {
    key: 'documentation',
    name: 'Docs Clean',
    description: 'High readability documentation style with crisp borders',
    mode: 'light',
    isBuiltIn: true,
    tokens: {
      colors: { primary: '#0284c7', secondary: '#475569', accent: '#0284c7', gold: '#eab308', background: '#ffffff', panel: '#f8fafc', text: '#334155', border: '#e2e8f0' },
    },
  },
];

class ThemeService {
  /**
   * Seed 9 default themes if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await Theme.countDocuments();
      if (count === 0) {
        console.info('[ThemeService] Seeding default 9 design system themes...');
        const docs = DEFAULT_9_THEMES.map((t) => ({ ...t, createdBy: userId }));
        await Theme.insertMany(docs);
        console.info(`[ThemeService] Seeded ${docs.length} themes.`);
      }
    } catch (err) {
      console.error('[ThemeService] Seed error:', err.message);
    }
  }

  /**
   * Get active default theme
   */
  static async getActiveTheme() {
    await ThemeService.seedDefaults();
    let theme = await Theme.findOne({ isDefault: true, status: 'published' }).lean();
    if (!theme) {
      theme = await Theme.findOne({ key: 'myjourney' }).lean();
    }
    return theme;
  }

  /**
   * Set a theme as the active default theme
   */
  static async setActiveTheme(themeId, userId = null) {
    const theme = await Theme.findById(themeId);
    if (!theme) return null;
    const accessibility = analyzeThemeAccessibility(theme);
    if (!accessibility.pass) {
      const error = new Error('Theme cannot be activated until critical text contrast issues are resolved.');
      error.status = 422;
      error.code = 'THEME_CONTRAST_UNSAFE';
      error.details = accessibility;
      throw error;
    }

    // Verify and validate the target before changing the current default. Set
    // the target first so a later cleanup failure cannot leave the site with no
    // active theme at all.
    theme.isDefault = true;
    theme.status = 'published';
    theme.updatedBy = userId;
    await theme.save();
    await Theme.updateMany({ _id: { $ne: theme._id } }, { $set: { isDefault: false } });
    return theme;
  }

  /**
   * Generate CSS variables string from theme tokens
   */
  static generateCSSVariables(themeObj) {
    if (!themeObj || !themeObj.tokens) return '';
    const isDark = themeObj.mode === 'dark';
    const safe = safeStoredTokens(themeObj.tokens, isDark ? 'dark' : 'light');
    const c = safe.colors;
    const t = safe.typography;
    const r = safe.radii;
    const s = safe.shadows;
    const fallback = isDark ? COLOR_DEFAULTS.dark : COLOR_DEFAULTS.light;
    const accentContrast = suggestedForeground(c.primary || fallback.primary);

    // Map theme tokens → actual CSS variables used by index.css
    return `
      ${isDark ? 'body.theme-dark' : ':root'} {
        /* ── Core palette (maps to index.css variables) ── */
        --paper: ${c.background};
        --surface: ${c.surface};
        --panel: ${c.panel};
        --ink: ${c.text};
        --muted: ${c.muted};
        --line: ${c.border};
        --teal: ${c.primary};
        --gold: ${c.gold};
        --blue: ${c.secondary};
        --soft: ${c.panel};

        /* ── Semantic relationships ── */
        --surface-page: ${c.background};
        --surface-subtle: ${c.panel};
        --surface-card: ${c.surface};
        --surface-elevated: ${c.surface};
        --surface-inverse: ${c.text};
        --surface-light-fixed: #faf8f5;
        --surface-dark-fixed: #131716;
        --text-primary: ${c.text};
        --text-secondary: ${c.muted};
        --text-muted: ${c.muted};
        --text-inverse: ${accentContrast};
        --text-on-light: #2f3133;
        --text-on-light-muted: #555956;
        --text-on-dark: #f8f4ed;
        --text-on-dark-muted: #c3ccc8;
        --border-subtle: ${c.border};
        --border-strong: ${c.muted};
        --accent-primary: ${c.primary};
        --accent-secondary: ${c.secondary};
        --accent-contrast: ${accentContrast};
        --link: ${c.primary};
        --success: ${c.success};
        --warning: ${c.warning};
        --danger: ${c.danger};
        --info: ${c.info};

        /* ── CMS accent tokens ── */
        --cms-accent: ${c.primary};
        --cms-accent-hover: ${c.accent};
        --cms-bg: ${c.background};
        --cms-sidebar: ${isDark ? '#0d1117' : '#1e2523'};
        --control-bg: ${c.surface};
        --control-border: ${c.border};
        --article-card-surface: ${c.surface};
        --article-card-text: ${c.text};
        --article-card-secondary: ${c.muted};
        --article-card-muted: ${c.muted};
        --article-card-border: ${c.border};
        --article-card-accent: ${c.gold};

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
        background: var(--surface-page);
        color: var(--text-primary);
        font-family: var(--font-body);
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }
    `;
  }
}

module.exports = ThemeService;

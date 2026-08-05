/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  designTokenService.js  —  Design Token Management Service
 *  MyJourney CMS  |  Phase 7: Design Token Management System
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DesignToken = require('../models/DesignToken');

const DEFAULT_CORE_TOKENS = [
  // Colors
  { key: 'color.primary', name: 'Primary Color', value: '#426c67', type: 'color', category: 'Colors', group: 'Core', isCore: true, usedIn: [{ component: 'Button' }, { component: 'Header' }, { component: 'Hero' }] },
  { key: 'color.secondary', name: 'Secondary Color', value: '#4d6478', type: 'color', category: 'Colors', group: 'Core', isCore: true, usedIn: [{ component: 'Badge' }] },
  { key: 'color.accent', name: 'Accent Color', value: '#426c67', type: 'color', category: 'Colors', group: 'Core', isCore: true },
  { key: 'color.gold', name: 'Gold Accent', value: '#b58b5f', type: 'color', category: 'Colors', group: 'Brand', isCore: true },
  { key: 'color.success', name: 'Success Color', value: '#2e7d5a', type: 'color', category: 'Colors', group: 'Semantic', isCore: true },
  { key: 'color.warning', name: 'Warning Color', value: '#b58b5f', type: 'color', category: 'Colors', group: 'Semantic', isCore: true },
  { key: 'color.danger', name: 'Danger Color', value: '#9d3e32', type: 'color', category: 'Colors', group: 'Semantic', isCore: true },
  { key: 'color.surface', name: 'Surface Color', value: '#ffffff', type: 'color', category: 'Colors', group: 'Core', isCore: true },
  { key: 'color.panel', name: 'Panel Background', value: '#fdfbf7', type: 'color', category: 'Colors', group: 'Core', isCore: true },
  { key: 'color.background', name: 'Global Background', value: '#f5f0eb', type: 'color', category: 'Colors', group: 'Core', isCore: true },
  { key: 'color.text', name: 'Body Text Color', value: '#2f3133', type: 'color', category: 'Colors', group: 'Core', isCore: true },
  { key: 'color.muted', name: 'Muted Text Color', value: '#666d6d', type: 'color', category: 'Colors', group: 'Core', isCore: true },
  { key: 'color.border', name: 'Border Line Color', value: '#e4ded4', type: 'color', category: 'Colors', group: 'Core', isCore: true },

  // Typography
  { key: 'font.heading', name: 'Heading Font Family', value: 'Outfit, sans-serif', type: 'typography', category: 'Typography', group: 'Core', isCore: true },
  { key: 'font.body', name: 'Body Font Family', value: 'Plus Jakarta Sans, sans-serif', type: 'typography', category: 'Typography', group: 'Core', isCore: true },
  { key: 'font.code', name: 'Code Font Family', value: 'Fira Code, monospace', type: 'typography', category: 'Typography', group: 'Core', isCore: true },

  // Spacing
  { key: 'space.xs', name: 'Spacing XS', value: '4px', type: 'spacing', category: 'Spacing', group: 'Layout', isCore: true },
  { key: 'space.sm', name: 'Spacing Small', value: '8px', type: 'spacing', category: 'Spacing', group: 'Layout', isCore: true },
  { key: 'space.md', name: 'Spacing Medium', value: '16px', type: 'spacing', category: 'Spacing', group: 'Layout', isCore: true },
  { key: 'space.lg', name: 'Spacing Large', value: '24px', type: 'spacing', category: 'Spacing', group: 'Layout', isCore: true },
  { key: 'space.xl', name: 'Spacing XL', value: '40px', type: 'spacing', category: 'Spacing', group: 'Layout', isCore: true },

  // Radius
  { key: 'radius.sm', name: 'Border Radius Small', value: '6px', type: 'radius', category: 'Radius', group: 'Component', isCore: true },
  { key: 'radius.md', name: 'Border Radius Medium', value: '10px', type: 'radius', category: 'Radius', group: 'Component', isCore: true },
  { key: 'radius.lg', name: 'Border Radius Large', value: '16px', type: 'radius', category: 'Radius', group: 'Component', isCore: true },
  { key: 'radius.pill', name: 'Border Radius Pill', value: '100px', type: 'radius', category: 'Radius', group: 'Component', isCore: true },

  // Shadows
  { key: 'shadow.sm', name: 'Shadow Small', value: '0 1px 4px rgba(0,0,0,0.05)', type: 'shadow', category: 'Shadows', group: 'Component', isCore: true },
  { key: 'shadow.md', name: 'Shadow Medium', value: '0 4px 16px rgba(0,0,0,0.08)', type: 'shadow', category: 'Shadows', group: 'Component', isCore: true },
  { key: 'shadow.lg', name: 'Shadow Large', value: '0 8px 30px rgba(0,0,0,0.12)', type: 'shadow', category: 'Shadows', group: 'Component', isCore: true },

  // Z-Index
  { key: 'zindex.dropdown', name: 'Z-Index Dropdown', value: '1000', type: 'zindex', category: 'Z-Index', group: 'Layout', isCore: true },
  { key: 'zindex.header', name: 'Z-Index Sticky Header', value: '1100', type: 'zindex', category: 'Z-Index', group: 'Layout', isCore: true },
  { key: 'zindex.modal', name: 'Z-Index Modal Drawer', value: '1200', type: 'zindex', category: 'Z-Index', group: 'Layout', isCore: true },
];

class DesignTokenService {
  /**
   * Seed default design tokens if database is empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await DesignToken.countDocuments();
      if (count === 0) {
        console.info('[DesignTokenService] Seeding core design tokens...');
        const docs = DEFAULT_CORE_TOKENS.map((t) => ({ ...t, createdBy: userId }));
        await DesignToken.insertMany(docs);
        console.info(`[DesignTokenService] Seeded ${docs.length} core tokens.`);
      }
    } catch (err) {
      console.error('[DesignTokenService] Seed error:', err.message);
    }
  }

  /**
   * Generate CSS variable declarations string
   */
  static async generateCSS() {
    await DesignTokenService.seedDefaults();
    const tokens = await DesignToken.find().lean();
    let css = ':root {\n';

    tokens.forEach((t) => {
      // Convert key 'color.primary' -> '--color-primary'
      const varName = `--${t.key.replace(/\./g, '-')}`;
      css += `  ${varName}: ${t.value};\n`;
    });

    css += '}\n';
    return css;
  }

  /**
   * Validate tokens before publishing
   */
  static validateTokens(tokens = []) {
    const errors = [];
    const keys = new Set();

    tokens.forEach((t) => {
      if (!t.key) errors.push('Missing token key.');
      if (keys.has(t.key)) errors.push(`Duplicate token key: '${t.key}'`);
      keys.add(t.key);

      if (!t.value) errors.push(`Token '${t.key}' has empty value.`);
    });

    return { valid: errors.length === 0, errors };
  }
}

module.exports = DesignTokenService;

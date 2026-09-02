/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  settingsValidationService.js  —  Field Schema Validation Engine
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

class SettingsValidationService {
  /**
   * Validate setting value payload against registered schema definitions
   *
   * @param {object} value  - Setting value object
   * @param {object} schema - Schema definition map { fieldName: { type, required, min, max, regex, options... } }
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validate(value = {}, schema = {}) {
    const errors = [];
    if (!schema || Object.keys(schema).length === 0) {
      return { valid: true, errors: [] };
    }

    for (const [field, fieldDef] of Object.entries(schema)) {
      const val = value[field];
      const type = fieldDef.type || 'text';

      // 1. Required Check
      if (fieldDef.required && (val === undefined || val === null || val === '')) {
        errors.push(`Field '${fieldDef.label || field}' is required`);
        continue;
      }

      if (val === undefined || val === null || val === '') {
        continue; // Skip further type checks for empty optional fields
      }

      // 2. Type & Rule Validation
      switch (type) {
        case 'number': {
          const num = Number(val);
          if (isNaN(num)) {
            errors.push(`Field '${fieldDef.label || field}' must be a valid number`);
          } else {
            if (fieldDef.min !== undefined && num < fieldDef.min) {
              errors.push(`Field '${fieldDef.label || field}' must be at least ${fieldDef.min}`);
            }
            if (fieldDef.max !== undefined && num > fieldDef.max) {
              errors.push(`Field '${fieldDef.label || field}' must be at most ${fieldDef.max}`);
            }
          }
          break;
        }

        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(val))) {
            errors.push(`Field '${fieldDef.label || field}' must be a valid email address`);
          }
          break;
        }

        case 'url': {
          try {
            new URL(String(val));
          } catch (_) {
            errors.push(`Field '${fieldDef.label || field}' must be a valid URL`);
          }
          break;
        }

        case 'text':
        case 'textarea':
        case 'password':
        case 'code': {
          const str = String(val);
          if (fieldDef.min !== undefined && str.length < fieldDef.min) {
            errors.push(`Field '${fieldDef.label || field}' length must be at least ${fieldDef.min} characters`);
          }
          if (fieldDef.max !== undefined && str.length > fieldDef.max) {
            errors.push(`Field '${fieldDef.label || field}' length cannot exceed ${fieldDef.max} characters`);
          }
          if (fieldDef.regex) {
            const re = new RegExp(fieldDef.regex);
            if (!re.test(str)) {
              errors.push(`Field '${fieldDef.label || field}' format is invalid`);
            }
          }
          break;
        }

        case 'select':
        case 'radio': {
          if (fieldDef.options && Array.isArray(fieldDef.options)) {
            const validValues = fieldDef.options.map(opt => (typeof opt === 'object' ? opt.value : opt));
            if (!validValues.includes(val)) {
              errors.push(`Field '${fieldDef.label || field}' value '${val}' is not a valid option`);
            }
          }
          break;
        }

        case 'json': {
          if (typeof val === 'string') {
            try {
              JSON.parse(val);
            } catch (_) {
              errors.push(`Field '${fieldDef.label || field}' must be valid JSON`);
            }
          }
          break;
        }

        default:
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = SettingsValidationService;

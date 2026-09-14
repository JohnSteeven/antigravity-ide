const { SUPPORTED_CURRENCIES } = require("./money");

const minorUnitField = ({ required = false, defaultValue, immutable = false, min = 0 } = {}) => ({
  type: Number,
  required,
  ...(defaultValue !== undefined ? { default: defaultValue } : {}),
  immutable,
  min,
  validate: {
    validator: (value) => value === null || value === undefined || Number.isSafeInteger(value),
    message: "{PATH} must be a safe integer in minor units.",
  },
});

const currencyField = ({ required = true, immutable = false, defaultValue } = {}) => ({
  type: String,
  enum: SUPPORTED_CURRENCIES,
  required,
  immutable,
  uppercase: true,
  trim: true,
  ...(defaultValue !== undefined ? { default: defaultValue } : {}),
});

module.exports = { currencyField, minorUnitField };

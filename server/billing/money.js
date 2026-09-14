const SUPPORTED_CURRENCIES = Object.freeze(["INR", "USD"]);
const CURRENCY_LOCALES = Object.freeze({ INR: "en-IN", USD: "en-US" });

class MoneyValidationError extends TypeError {
  constructor(message, code = "INVALID_MONEY") {
    super(message);
    this.name = "MoneyValidationError";
    this.code = code;
  }
}

const normalizeCurrency = (currency) => {
  const normalized = String(currency || "").trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(normalized)) {
    throw new MoneyValidationError(`Unsupported currency: ${normalized || "missing"}.`, "UNSUPPORTED_CURRENCY");
  }
  return normalized;
};

const validateAmountMinor = (amountMinor) => {
  if (typeof amountMinor !== "number" || !Number.isFinite(amountMinor) || !Number.isSafeInteger(amountMinor)) {
    throw new MoneyValidationError("Money must use a finite safe integer amountMinor.");
  }
  if (amountMinor < 0) throw new MoneyValidationError("Money amountMinor cannot be negative.", "NEGATIVE_MONEY");
  return amountMinor;
};

class Money {
  constructor(amountMinor, currency) {
    this.amountMinor = validateAmountMinor(amountMinor);
    this.currency = normalizeCurrency(currency);
    Object.freeze(this);
  }

  static zero(currency) {
    return new Money(0, currency);
  }

  static from(value) {
    if (value instanceof Money) return value;
    if (!value || typeof value !== "object") throw new MoneyValidationError("Money value must be an object.");
    return new Money(value.amountMinor, value.currency);
  }

  assertSameCurrency(other) {
    const right = Money.from(other);
    if (this.currency !== right.currency) {
      throw new MoneyValidationError(
        `Currency mismatch: ${this.currency} and ${right.currency}.`,
        "CURRENCY_MISMATCH"
      );
    }
    return right;
  }

  add(other) {
    const right = this.assertSameCurrency(other);
    const result = this.amountMinor + right.amountMinor;
    if (!Number.isSafeInteger(result)) throw new MoneyValidationError("Money addition exceeds the safe integer range.", "MONEY_OVERFLOW");
    return new Money(result, this.currency);
  }

  subtract(other) {
    const right = this.assertSameCurrency(other);
    const result = this.amountMinor - right.amountMinor;
    if (result < 0) throw new MoneyValidationError("Money subtraction cannot produce a negative amount.", "NEGATIVE_MONEY");
    return new Money(result, this.currency);
  }

  compare(other) {
    const right = this.assertSameCurrency(other);
    return Math.sign(this.amountMinor - right.amountMinor);
  }

  equals(other) {
    try {
      return this.compare(other) === 0;
    } catch (_error) {
      return false;
    }
  }

  isZero() {
    return this.amountMinor === 0;
  }

  format(locale = CURRENCY_LOCALES[this.currency]) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.amountMinor / 100);
  }

  toJSON() {
    return { amountMinor: this.amountMinor, currency: this.currency };
  }
}

module.exports = {
  Money,
  MoneyValidationError,
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
  validateAmountMinor,
};

const { Money, normalizeCurrency } = require("./money");

const MARKETS = Object.freeze({ INDIA: "INDIA", INTERNATIONAL: "INTERNATIONAL" });
const PRODUCT_CODES = Object.freeze({
  PREMIUM_MONTHLY: "PREMIUM_MONTHLY",
  PREMIUM_3_MONTH: "PREMIUM_3_MONTH",
  PREMIUM_6_MONTH: "PREMIUM_6_MONTH",
  PREMIUM_12_MONTH: "PREMIUM_12_MONTH",
});

const BILLING_MODE = "prepaid_term";
const PROVIDER = "razorpay";

const PRICE_ROWS = Object.freeze([
  [PRODUCT_CODES.PREMIUM_MONTHLY, 1, 39900, 999],
  [PRODUCT_CODES.PREMIUM_3_MONTH, 3, 109900, 2799],
  [PRODUCT_CODES.PREMIUM_6_MONTH, 6, 199900, 4999],
  [PRODUCT_CODES.PREMIUM_12_MONTH, 12, 349900, 8999],
]);

const providerPlanKey = (productCode, currency) => `RAZORPAY_PLAN_${productCode}_${currency}`;

const DEFAULT_ENTRIES = Object.freeze(PRICE_ROWS.flatMap(([productCode, durationMonths, inrMinor, usdMinor]) => [
  Object.freeze({
    productCode,
    product: "premium",
    market: MARKETS.INDIA,
    currency: "INR",
    amountMinor: inrMinor,
    durationMonths,
    billingMode: BILLING_MODE,
    taxTreatment: "gst_inclusive",
    provider: PROVIDER,
    providerPlanKey: providerPlanKey(productCode, "INR"),
    active: true,
  }),
  Object.freeze({
    productCode,
    product: "premium",
    market: MARKETS.INTERNATIONAL,
    currency: "USD",
    amountMinor: usdMinor,
    durationMonths,
    billingMode: BILLING_MODE,
    taxTreatment: "taxes_as_applicable",
    provider: PROVIDER,
    providerPlanKey: providerPlanKey(productCode, "USD"),
    active: true,
  }),
]));

const catalogError = (message, code) => Object.assign(new Error(message), { status: 422, code });

const normalizeMarket = (market) => {
  const normalized = String(market || "").trim().toUpperCase();
  if (!Object.values(MARKETS).includes(normalized)) {
    throw catalogError("Unsupported billing market.", "UNSUPPORTED_BILLING_MARKET");
  }
  return normalized;
};

const resolveMarket = ({ countryCode } = {}) => {
  const normalized = String(countryCode || "").trim().toUpperCase().replace(/\s+/g, "");
  return ["IN", "+91", "91"].includes(normalized) ? MARKETS.INDIA : MARKETS.INTERNATIONAL;
};

class PriceCatalog {
  constructor(entries = DEFAULT_ENTRIES, environment = process.env) {
    this.entries = entries.map((entry) => Object.freeze({ ...entry }));
    this.environment = environment;
    this.validate();
  }

  validate() {
    const identities = new Set();
    for (const entry of this.entries) {
      if (!Object.values(PRODUCT_CODES).includes(entry.productCode)) throw catalogError("Catalog contains an invalid product code.", "INVALID_PRODUCT_CODE");
      normalizeMarket(entry.market);
      normalizeCurrency(entry.currency);
      new Money(entry.amountMinor, entry.currency);
      if (!Number.isSafeInteger(entry.durationMonths) || entry.durationMonths <= 0) throw catalogError("Catalog duration must be a positive integer.", "INVALID_BILLING_DURATION");
      const identity = `${entry.productCode}:${entry.market}`;
      if (identities.has(identity)) throw catalogError("Catalog contains a duplicate product and market.", "DUPLICATE_CATALOG_PRICE");
      identities.add(identity);
    }
  }

  resolve({ productCode, market }) {
    const normalizedProduct = String(productCode || "").trim().toUpperCase();
    if (!Object.values(PRODUCT_CODES).includes(normalizedProduct)) {
      throw catalogError("Unknown Premium product code.", "INVALID_PRODUCT_CODE");
    }
    const normalizedMarket = normalizeMarket(market);
    const entry = this.entries.find((candidate) => candidate.productCode === normalizedProduct && candidate.market === normalizedMarket);
    if (!entry) throw catalogError("No price is configured for this product and market.", "PRICE_NOT_CONFIGURED");
    if (!entry.active) throw catalogError("This Premium product is not currently available.", "PRODUCT_DISABLED");
    const providerPlanId = entry.providerPlanKey ? String(this.environment[entry.providerPlanKey] || "").trim() || null : null;
    return Object.freeze({ ...entry, money: new Money(entry.amountMinor, entry.currency), providerPlanId });
  }

  resolveForUser({ user, productCode }) {
    return this.resolve({ productCode, market: resolveMarket({ countryCode: user?.countryCode }) });
  }

  publicCatalog(market) {
    const normalizedMarket = normalizeMarket(market);
    return this.entries
      .filter((entry) => entry.market === normalizedMarket && entry.active)
      .map((entry) => {
        const resolved = this.resolve({ productCode: entry.productCode, market: normalizedMarket });
        return Object.freeze({
          productCode: entry.productCode,
          product: entry.product,
          market: entry.market,
          currency: entry.currency,
          amountMinor: entry.amountMinor,
          formattedPrice: resolved.money.format(),
          durationMonths: entry.durationMonths,
          billingMode: entry.billingMode,
          taxTreatment: entry.taxTreatment,
          provider: entry.provider,
          providerPlanConfigured: Boolean(resolved.providerPlanId),
          active: true,
        });
      });
  }
}

const priceCatalog = new PriceCatalog();

// Only productCode is read from clientSelection. Price, currency, duration, and
// market are always recomputed from server-owned catalog and user data.
const resolveCheckoutSelection = ({ user, clientSelection }) => priceCatalog.resolveForUser({
  user,
  productCode: clientSelection?.productCode,
});

module.exports = {
  BILLING_MODE,
  DEFAULT_ENTRIES,
  MARKETS,
  PRICE_ROWS,
  PRODUCT_CODES,
  PROVIDER,
  PriceCatalog,
  normalizeMarket,
  priceCatalog,
  resolveCheckoutSelection,
  resolveMarket,
};

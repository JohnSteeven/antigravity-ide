const { Money, MoneyValidationError, SUPPORTED_CURRENCIES } = require("../billing/money");
const {
  DEFAULT_ENTRIES,
  MARKETS,
  PRODUCT_CODES,
  PriceCatalog,
  priceCatalog,
  resolveCheckoutSelection,
  resolveMarket,
} = require("../billing/priceCatalog");

describe("billing money", () => {
  test("supports exact integer arithmetic, comparison, and zero values", () => {
    const first = new Money(39900, "inr");
    const second = new Money(100, "INR");
    expect(first.add(second).toJSON()).toEqual({ amountMinor: 40000, currency: "INR" });
    expect(first.subtract(second).toJSON()).toEqual({ amountMinor: 39800, currency: "INR" });
    expect(first.compare(second)).toBe(1);
    expect(Money.zero("USD").isZero()).toBe(true);
  });

  test.each([NaN, Infinity, -Infinity, 1.2, -1, Number.MAX_SAFE_INTEGER + 1])("rejects invalid amountMinor %p", (amountMinor) => {
    expect(() => new Money(amountMinor, "INR")).toThrow(MoneyValidationError);
  });

  test("rejects unsupported currencies and mismatched currency arithmetic", () => {
    expect(SUPPORTED_CURRENCIES).toEqual(["INR", "USD"]);
    expect(() => new Money(1, "EUR")).toThrow(expect.objectContaining({ code: "UNSUPPORTED_CURRENCY" }));
    expect(() => new Money(100, "INR").add(new Money(100, "USD"))).toThrow(expect.objectContaining({ code: "CURRENCY_MISMATCH" }));
    expect(() => new Money(100, "INR").subtract(new Money(101, "INR"))).toThrow(expect.objectContaining({ code: "NEGATIVE_MONEY" }));
  });

  test("formats presentation values and round-trips its JSON representation", () => {
    const inr = new Money(39900, "INR");
    const usd = new Money(999, "USD");
    expect(inr.format()).toMatch(/₹\s?399\.00/);
    expect(usd.format()).toBe("$9.99");
    expect(Money.from(JSON.parse(JSON.stringify(inr))).equals(inr)).toBe(true);
  });
});

describe("server-authoritative Premium price catalog", () => {
  const expected = {
    INDIA: {
      PREMIUM_MONTHLY: [39900, "INR", 1],
      PREMIUM_3_MONTH: [109900, "INR", 3],
      PREMIUM_6_MONTH: [199900, "INR", 6],
      PREMIUM_12_MONTH: [349900, "INR", 12],
    },
    INTERNATIONAL: {
      PREMIUM_MONTHLY: [999, "USD", 1],
      PREMIUM_3_MONTH: [2799, "USD", 3],
      PREMIUM_6_MONTH: [4999, "USD", 6],
      PREMIUM_12_MONTH: [8999, "USD", 12],
    },
  };

  test.each(Object.values(MARKETS))("contains all exact prices for %s", (market) => {
    Object.entries(expected[market]).forEach(([productCode, [amountMinor, currency, durationMonths]]) => {
      expect(priceCatalog.resolve({ productCode, market })).toMatchObject({ amountMinor, currency, durationMonths, active: true });
    });
  });

  test("resolves India from stored account country code and defaults other accounts internationally", () => {
    expect(resolveMarket({ countryCode: "+91" })).toBe(MARKETS.INDIA);
    expect(resolveMarket({ countryCode: "IN" })).toBe(MARKETS.INDIA);
    expect(resolveMarket({ countryCode: "+44" })).toBe(MARKETS.INTERNATIONAL);
    expect(resolveMarket()).toBe(MARKETS.INTERNATIONAL);
  });

  test("ignores client amount, currency, market, duration, and premiumUntil", () => {
    const price = resolveCheckoutSelection({
      user: { countryCode: "+91" },
      clientSelection: {
        productCode: PRODUCT_CODES.PREMIUM_12_MONTH,
        amountMinor: 1,
        currency: "USD",
        market: MARKETS.INTERNATIONAL,
        durationMonths: 1,
        premiumUntil: "2099-01-01",
      },
    });
    expect(price).toMatchObject({ amountMinor: 349900, currency: "INR", market: MARKETS.INDIA, durationMonths: 12 });
  });

  test("rejects invalid products and markets", () => {
    expect(() => priceCatalog.resolve({ productCode: "PREMIUM_FOREVER", market: MARKETS.INDIA })).toThrow(expect.objectContaining({ code: "INVALID_PRODUCT_CODE" }));
    expect(() => priceCatalog.resolve({ productCode: PRODUCT_CODES.PREMIUM_MONTHLY, market: "MARS" })).toThrow(expect.objectContaining({ code: "UNSUPPORTED_BILLING_MARKET" }));
  });

  test("rejects disabled products", () => {
    const entries = DEFAULT_ENTRIES.map((entry) => entry.productCode === PRODUCT_CODES.PREMIUM_MONTHLY && entry.market === MARKETS.INDIA
      ? { ...entry, active: false }
      : entry);
    const catalog = new PriceCatalog(entries, {});
    expect(() => catalog.resolve({ productCode: PRODUCT_CODES.PREMIUM_MONTHLY, market: MARKETS.INDIA })).toThrow(expect.objectContaining({ code: "PRODUCT_DISABLED" }));
  });

  test("reads optional provider plan IDs only from server configuration", () => {
    const key = "RAZORPAY_PLAN_PREMIUM_MONTHLY_INR";
    const catalog = new PriceCatalog(DEFAULT_ENTRIES, { [key]: "plan_test_123" });
    expect(catalog.resolve({ productCode: PRODUCT_CODES.PREMIUM_MONTHLY, market: MARKETS.INDIA }).providerPlanId).toBe("plan_test_123");
    expect(catalog.publicCatalog(MARKETS.INDIA)[0].providerPlanConfigured).toBe(true);
  });
});

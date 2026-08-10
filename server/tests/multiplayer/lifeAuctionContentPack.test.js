const { validatePack } = require("../../multiplayer/games/lifeAuction/contentPackService");

describe("Life Auction admin content-pack foundation", () => {
  test("accepts an approved immutable declarative pack and creates a checksum", () => {
    const pack = validatePack({
      key: "new-year-2027",
      kind: "SEASONAL",
      locale: "en",
      version: 1,
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
      payload: [{ id: "fresh-start", title: "A Fresh Start", active: true }],
    });
    expect(pack.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(pack.publishedAt).toBeInstanceOf(Date);
  });

  test("rejects unmoderated publication and executable rule keys", () => {
    expect(() => validatePack({
      key: "unsafe-pack",
      kind: "LOTS",
      locale: "en",
      version: 1,
      status: "PUBLISHED",
      moderationStatus: "PENDING",
      payload: [{ id: "unsafe", title: "Unsafe" }],
    })).toThrow(/approved/i);
    expect(() => validatePack({
      key: "script-pack",
      kind: "EVENTS",
      locale: "en",
      version: 1,
      payload: [{ id: "unsafe", script: "return wallet + 100" }],
    })).toThrow(/unsafe content key/i);
  });
});

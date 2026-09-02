const crypto = require("crypto");
const { z } = require("zod");
const LifeAuctionContentPack = require("../../../models/LifeAuctionContentPack");

const FORBIDDEN_KEYS = new Set(["$where", "$function", "script", "scriptUrl", "code", "eval", "javascript"]);
const packSchema = z.object({
  key: z.string().regex(/^[a-z0-9][a-z0-9-]{2,79}$/),
  kind: z.enum(["LOTS", "MODES", "EVENTS", "SEASONAL"]),
  locale: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default("en"),
  version: z.number().int().min(1).max(1000000),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"]).default("DRAFT"),
  moderationStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  payload: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
  createdBy: z.unknown().optional(),
  reviewedBy: z.unknown().optional(),
}).strict();

const assertDeclarative = (value, path = "payload") => {
  if (Array.isArray(value)) return value.forEach((entry, index) => assertDeclarative(entry, `${path}.${index}`));
  if (!value || typeof value !== "object") return;
  Object.entries(value).forEach(([key, entry]) => {
    if (key.startsWith("$") || FORBIDDEN_KEYS.has(key)) throw new Error(`Executable or unsafe content key is not allowed at ${path}.${key}.`);
    assertDeclarative(entry, `${path}.${key}`);
  });
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
};
const canonicalPayload = (payload) => JSON.stringify(stableValue(payload));

const validatePack = (input) => {
  const parsed = packSchema.parse(input);
  assertDeclarative(parsed.payload);
  if (parsed.status === "PUBLISHED" && parsed.moderationStatus !== "APPROVED") {
    throw new Error("Only an approved content pack can be published.");
  }
  const checksum = crypto.createHash("sha256").update(canonicalPayload(parsed.payload)).digest("hex");
  return { ...parsed, checksum, publishedAt: parsed.status === "PUBLISHED" ? new Date() : null };
};

class LifeAuctionContentPackService {
  constructor({ model = LifeAuctionContentPack } = {}) {
    this.model = model;
  }

  async createVersion(input) {
    return this.model.create(validatePack(input));
  }

  async listPublished({ kind, locale = "en" }) {
    return this.model.find({ kind, locale, status: "PUBLISHED", moderationStatus: "APPROVED" }).sort({ version: -1 }).lean();
  }
}

module.exports = { LifeAuctionContentPackService, assertDeclarative, validatePack };

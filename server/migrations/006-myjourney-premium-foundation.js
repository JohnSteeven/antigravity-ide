const INDEXES = Object.freeze({
  readermemberships: [
    [{ userId: 1 }, { unique: true, name: "membership_user_unique" }],
    [{ provider: 1, providerSubscriptionId: 1 }, { unique: true, partialFilterExpression: { providerSubscriptionId: { $type: "string" } }, name: "membership_provider_subscription_unique" }],
    [{ plan: 1, billingStatus: 1, currentPeriodEnd: 1 }, { name: "membership_access_window" }],
  ],
  billingevents: [
    [{ provider: 1, providerEventId: 1 }, { unique: true, name: "billing_event_dedupe" }],
    [{ userId: 1, occurredAt: -1 }, { name: "billing_event_user_order" }],
  ],
  articles: [[{ status: 1, contentType: 1, accessLevel: 1, publishedAt: -1 }, { name: "content_public_access" }]],
  searchindexes: [[{ accessLevel: 1, entityType: 1 }, { name: "search_access_scope" }]],
});

const sameKeys = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatibleIndex = (existing, keys, options) => sameKeys(existing.key, keys)
  && Boolean(existing.unique) === Boolean(options.unique)
  && (options.partialFilterExpression === undefined
    || JSON.stringify(existing.partialFilterExpression) === JSON.stringify(options.partialFilterExpression));

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,
  async up(db) {
    // Legacy content remains Free. Legacy private-beta membership rows lack a
    // trustworthy duration and therefore fail closed until deliberately mapped.
    await db.collection("articles").updateMany(
      { accessLevel: { $exists: false } },
      { $set: { accessLevel: "free" } }
    );
    await db.collection("searchindexes").updateMany(
      { accessLevel: { $exists: false } },
      { $set: { accessLevel: "free" } }
    ).catch((error) => { if (error.codeName !== "NamespaceNotFound") throw error; });
    await db.collection("readermemberships").updateMany(
      { plan: { $exists: false } },
      {
        $set: { plan: "free", billingStatus: "incomplete", provider: "unconfigured" },
        $unset: { planSlug: "", billingProvider: "", meteredReadsThisMonth: "", paymentHistory: "" },
      }
    ).catch((error) => { if (error.codeName !== "NamespaceNotFound") throw error; });
    await db.collection("membershipplans").updateMany(
      { slug: { $nin: ["free", "premium"] } },
      { $set: { status: "archived" } }
    ).catch((error) => { if (error.codeName !== "NamespaceNotFound") throw error; });

    const premiumIds = await db.collection("articles").find({ accessLevel: "premium" }, { projection: { _id: 1 } }).toArray();
    if (premiumIds.length) {
      const premiumIdStrings = premiumIds.map((item) => String(item._id));
      await db.collection("searchindexes").updateMany(
        { entityId: { $in: premiumIdStrings } },
        { $set: { accessLevel: "premium", content: "" } }
      ).catch((error) => { if (error.codeName !== "NamespaceNotFound") throw error; });
      await db.collection("knowledgechunks").deleteMany({ articleId: { $in: premiumIds.map((item) => item._id) } })
        .catch((error) => { if (error.codeName !== "NamespaceNotFound") throw error; });
    }

    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes().catch((error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
      for (const [keys, options] of specs) {
        if (!existing.some((index) => compatibleIndex(index, keys, options))) await collection.createIndex(keys, options);
      }
    }
  },
  async down(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      for (const [, options] of specs) await db.collection(collectionName).dropIndex(options.name).catch(() => {});
    }
  },
};

const INDEXES = Object.freeze({
  payments: [
    [{ paymentReference: 1 }, { unique: true, name: "payment_reference_unique" }],
    [{ userId: 1, idempotencyKey: 1 }, { unique: true, name: "payment_user_idempotency_unique" }],
    [{ provider: 1, providerOrderId: 1 }, { unique: true, partialFilterExpression: { providerOrderId: { $type: "string" } }, name: "payment_provider_order_unique" }],
    [{ provider: 1, providerPaymentId: 1 }, { unique: true, partialFilterExpression: { providerPaymentId: { $type: "string" } }, name: "payment_provider_payment_unique" }],
    [{ userId: 1, createdAt: -1 }, { name: "payment_user_created" }],
  ],
  invoices: [
    [{ invoiceNumber: 1 }, { unique: true, name: "invoice_number_unique" }],
    [{ paymentId: 1 }, { unique: true, name: "invoice_payment_unique" }],
    [{ provider: 1, providerInvoiceId: 1 }, { unique: true, partialFilterExpression: { providerInvoiceId: { $type: "string" } }, name: "invoice_provider_unique" }],
    [{ userId: 1, issuedAt: -1 }, { name: "invoice_user_issued" }],
  ],
  refunds: [
    [{ refundReference: 1 }, { unique: true, name: "refund_reference_unique" }],
    [{ userId: 1, idempotencyKey: 1 }, { unique: true, name: "refund_user_idempotency_unique" }],
    [{ provider: 1, providerRefundId: 1 }, { unique: true, partialFilterExpression: { providerRefundId: { $type: "string" } }, name: "refund_provider_unique" }],
    [{ paymentId: 1, status: 1 }, { name: "refund_payment_status" }],
  ],
  billingevents: [
    [{ aggregateType: 1, aggregateId: 1, receivedAt: -1 }, { name: "billing_event_aggregate_order" }],
    [{ processingStatus: 1, processingLeaseUntil: 1 }, { name: "billing_event_retry" }],
  ],
});

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatible = (index, keys, options) => same(index.key, keys)
  && Boolean(index.unique) === Boolean(options.unique)
  && (options.partialFilterExpression === undefined || same(index.partialFilterExpression, options.partialFilterExpression));

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,
  async up(db) {
    await db.collection("billingevents").updateMany(
      { eventType: { $exists: false }, normalizedType: { $type: "string" } },
      [{ $set: {
        eventType: "$normalizedType",
        processingStatus: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "processed"] }, then: "processed" },
              { case: { $eq: ["$status", "ignored"] }, then: "ignored" },
            ],
            default: "failed",
          },
        },
        receivedAt: { $ifNull: ["$createdAt", "$$NOW"] },
        processingAttempts: { $ifNull: ["$processingAttempts", 1] },
        aggregateType: { $cond: [{ $ne: ["$subscriptionId", null] }, "subscription", "unknown"] },
      } }]
    ).catch((error) => { if (error.codeName !== "NamespaceNotFound") throw error; });

    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes().catch((error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
      for (const [keys, options] of specs) {
        if (!existing.some((index) => compatible(index, keys, options))) await collection.createIndex(keys, options);
      }
    }
  },
  async down(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      for (const [, options] of specs) await db.collection(collectionName).dropIndex(options.name).catch(() => {});
    }
  },
};

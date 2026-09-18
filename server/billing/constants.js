const PAYMENT_STATUSES = Object.freeze([
  "created",
  "pending",
  "authorized",
  "captured",
  "failed",
  "partially_refunded",
  "refunded",
  "reversed",
]);

const REFUND_STATUSES = Object.freeze(["requested", "pending", "processed", "failed", "reversed"]);
const INVOICE_STATUSES = Object.freeze(["draft", "issued", "paid", "partially_refunded", "refunded", "void"]);
const BILLING_EVENT_PROCESSING_STATUSES = Object.freeze(["processing", "processed", "ignored", "failed"]);

const PAYMENT_TRANSITIONS = Object.freeze({
  created: Object.freeze(["pending", "authorized", "captured", "failed"]),
  pending: Object.freeze(["authorized", "captured", "failed"]),
  authorized: Object.freeze(["captured", "failed"]),
  captured: Object.freeze(["partially_refunded", "refunded", "reversed"]),
  partially_refunded: Object.freeze(["partially_refunded", "refunded", "reversed"]),
  // A later verified capture/authorisation may recover the same provider order.
  failed: Object.freeze(["authorized", "captured"]),
  refunded: Object.freeze([]),
  reversed: Object.freeze([]),
});

const SUBSCRIPTION_TRANSITIONS = Object.freeze({
  incomplete: Object.freeze(["trialing", "active", "past_due", "canceled", "expired"]),
  trialing: Object.freeze(["active", "past_due", "grace_period", "cancel_pending", "canceled", "expired"]),
  active: Object.freeze(["past_due", "grace_period", "cancel_pending", "canceled", "expired"]),
  past_due: Object.freeze(["active", "grace_period", "cancel_pending", "canceled", "expired"]),
  grace_period: Object.freeze(["active", "cancel_pending", "canceled", "expired"]),
  cancel_pending: Object.freeze(["active", "canceled", "expired"]),
  canceled: Object.freeze(["active", "expired"]),
  expired: Object.freeze([]),
});

const canTransition = (transitions, previousStatus, nextStatus) => previousStatus === nextStatus
  || Boolean(transitions[previousStatus]?.includes(nextStatus));

module.exports = {
  BILLING_EVENT_PROCESSING_STATUSES,
  INVOICE_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TRANSITIONS,
  REFUND_STATUSES,
  SUBSCRIPTION_TRANSITIONS,
  canTransition,
};

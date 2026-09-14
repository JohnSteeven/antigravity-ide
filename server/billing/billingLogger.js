const safeText = (value, limit = 160) => value === undefined || value === null
  ? undefined
  : String(value).replace(/[\r\n\u0000-\u001f]/g, "").slice(0, limit);

const logBillingOperation = ({ requestId, operation, result, paymentId, providerOrderId, providerPaymentId, providerEventId, refundId, errorCode }) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level: result === "failed" ? "error" : "info",
    service: "myjourney-api",
    event: "billing_operation",
    requestId: safeText(requestId),
    operation: safeText(operation, 80),
    result: safeText(result, 40),
    paymentId: safeText(paymentId),
    providerOrderId: safeText(providerOrderId),
    providerPaymentId: safeText(providerPaymentId),
    providerEventId: safeText(providerEventId),
    refundId: safeText(refundId),
    errorCode: safeText(errorCode, 80),
  };
  const safeEntry = Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined));
  (entry.level === "error" ? console.error : console.info)(JSON.stringify(safeEntry));
};

module.exports = { logBillingOperation, safeText };

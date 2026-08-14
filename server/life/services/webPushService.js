const webpush = require("web-push");
const LifePushSubscription = require("../models/LifePushSubscription");
const { LifeError } = require("../domain/errors");
const { webPushConfigured } = require("./capabilityService");
const metrics = require("./observability");

let configured = false;
const configure = () => {
  if (configured || !webPushConfigured()) return webPushConfigured();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  configured = true;
  return true;
};

const publicConfig = () => ({ available: configure(), publicKey: configure() ? process.env.VAPID_PUBLIC_KEY : "", state: configure() ? "available" : "unavailable" });

const subscribe = async (userId, subscription = {}) => {
  if (!configure()) throw new LifeError("Web push is unavailable until server credentials are configured.", 503, "LIFE_PUSH_UNAVAILABLE");
  const endpoint = String(subscription.endpoint || "");
  const p256dh = String(subscription.keys?.p256dh || "");
  const auth = String(subscription.keys?.auth || "");
  if (!endpoint.startsWith("https://") || !p256dh || !auth) throw new LifeError("The browser push subscription is invalid.", 422, "LIFE_PUSH_INVALID");
  const existing = await LifePushSubscription.findOne({ endpoint });
  if (existing && String(existing.user) !== String(userId)) throw new LifeError("This browser subscription belongs to another account.", 409, "LIFE_PUSH_OWNERSHIP");
  return LifePushSubscription.findOneAndUpdate(
    { endpoint, user: userId },
    { $set: { keys: { p256dh, auth }, expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null, status: "active", failureCount: 0 }, $setOnInsert: { endpoint, user: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const unsubscribe = async (userId, endpoint) => {
  const result = await LifePushSubscription.findOneAndUpdate({ user: userId, endpoint }, { $set: { status: "revoked" } }, { new: true });
  if (!result) throw new LifeError("Push subscription was not found.", 404, "LIFE_PUSH_NOT_FOUND");
  return { unsubscribed: true };
};

const listSubscriptions = async (userId) => LifePushSubscription.find({ user: userId, status: "active" }).select("endpoint expirationTime status createdAt updatedAt").lean();

const adapter = {
  async deliver(job) {
    if (!configure()) throw Object.assign(new Error("Web push adapter is not configured."), { code: "PUSH_UNAVAILABLE" });
    const subscriptions = await LifePushSubscription.find({ user: job.user, status: "active" });
    if (!subscriptions.length) throw Object.assign(new Error("No active browser subscription."), { code: "PUSH_NOT_SUBSCRIBED" });
    const payload = JSON.stringify({ title: job.title, body: job.message, tag: job.dedupeKey, data: { url: "/life/today", jobId: String(job._id) }, actions: [{ action: "open", title: "Open Life" }] });
    let delivered = 0;
    let lastId = "";
    for (const subscription of subscriptions) {
      try {
        const result = await webpush.sendNotification({ endpoint: subscription.endpoint, expirationTime: subscription.expirationTime?.getTime?.() || null, keys: subscription.keys }, payload, { TTL: 60 * 60, urgency: "normal" });
        subscription.lastSuccessAt = new Date(); subscription.failureCount = 0; await subscription.save();
        delivered += 1; lastId = result.headers?.location || String(result.statusCode || "sent");
      } catch (error) {
        subscription.lastFailureAt = new Date(); subscription.failureCount += 1;
        if ([404, 410].includes(error.statusCode)) subscription.status = "expired";
        await subscription.save();
        metrics.increment([404, 410].includes(error.statusCode) ? "life_push_subscription_expired" : "life_push_delivery_failures");
      }
    }
    if (!delivered) throw Object.assign(new Error("No browser accepted this notification."), { code: "PUSH_DELIVERY_FAILED" });
    return { providerMessageId: lastId, delivered };
  },
};

module.exports = { adapter, listSubscriptions, publicConfig, subscribe, unsubscribe };

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NotificationService.js  —  Omnichannel Notification Center
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Persists in-app notifications. Other delivery channels are unavailable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const notificationError = (message, code) => Object.assign(new Error(message), { code });

const PRODUCT_NOTIFICATION_TYPES = new Set([
  "achievement_unlocked",
  "course_completed",
  "streak_milestone",
  "creator_engagement_milestone",
  "premium_lifecycle",
  "account_lifecycle",
]);
const RELATED_ENTITY_TYPES = new Set(["achievement", "course", "creator", "membership", "account", "article"]);

const requireRecipient = (userId) => {
  if (!mongoose.isObjectIdOrHexString(userId)) {
    throw notificationError("An account recipient is required.", "NOTIFICATION_RECIPIENT_INVALID");
  }
};

const cleanContent = (title, message) => {
  if (typeof title !== "string" || !title.trim() || title.length > 200
    || typeof message !== "string" || !message.trim() || message.length > 4000) {
    throw notificationError("Notification title or message is invalid.", "NOTIFICATION_CONTENT_INVALID");
  }
  return { title: title.trim(), message: message.trim() };
};

const cleanActionUrl = (actionUrl) => {
  if (actionUrl === undefined || actionUrl === null || actionUrl === "") return null;
  if (typeof actionUrl !== "string" || actionUrl.length > 500
    || !actionUrl.startsWith("/") || actionUrl.startsWith("//") || actionUrl.includes("\\")) {
    throw notificationError("Notification action URL must be an internal path.", "NOTIFICATION_ACTION_INVALID");
  }
  return actionUrl;
};

const serialize = (item) => {
  if (!item) return null;
  const value = typeof item.toObject === "function" ? item.toObject() : item;
  return {
    id: String(value._id || value.id),
    type: value.type || null,
    title: value.title,
    message: value.message,
    actionUrl: value.actionUrl || null,
    status: value.status,
    read: value.status === "read",
    readAt: value.readAt || null,
    createdAt: value.createdAt,
    relatedEntity: value.relatedEntityType
      ? {
        type: value.relatedEntityType,
        id: value.relatedEntityId ? String(value.relatedEntityId) : null,
        key: value.relatedEntityKey || null,
      }
      : null,
  };
};

class NotificationService {
  // Callers supply a server-resolved owner. Their domain service authorizes the
  // underlying operation and resolves recipients before requesting delivery.
  static async sendInApp({ userId, title, message, type } = {}) {
    requireRecipient(userId);
    const content = cleanContent(title, message);
    return Notification.create({
      user: userId,
      ...content,
      status: "unread",
      source: "site",
      ...(type ? { type } : {}),
    });
  }

  static async createProductNotification({
    userId,
    type,
    title,
    message,
    actionUrl,
    relatedEntityType,
    relatedEntityId,
    relatedEntityKey,
    dedupeKey,
    session,
  } = {}) {
    requireRecipient(userId);
    if (!PRODUCT_NOTIFICATION_TYPES.has(type)) {
      throw notificationError("Unsupported product notification type.", "NOTIFICATION_TYPE_INVALID");
    }
    const content = cleanContent(title, message);
    const internalActionUrl = cleanActionUrl(actionUrl);
    if (relatedEntityType && !RELATED_ENTITY_TYPES.has(relatedEntityType)) {
      throw notificationError("Unsupported notification entity type.", "NOTIFICATION_ENTITY_INVALID");
    }
    if (relatedEntityId && !mongoose.isObjectIdOrHexString(relatedEntityId)) {
      throw notificationError("Notification entity ID is invalid.", "NOTIFICATION_ENTITY_INVALID");
    }
    const idempotencyKey = String(dedupeKey || "").trim();
    if (!idempotencyKey || idempotencyKey.length > 180) {
      throw notificationError("A bounded notification deduplication key is required.", "NOTIFICATION_DEDUPE_INVALID");
    }

    const update = {
      $setOnInsert: {
        user: userId,
        type,
        ...content,
        status: "unread",
        source: "site",
        actionUrl: internalActionUrl,
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        relatedEntityKey: relatedEntityKey ? String(relatedEntityKey).trim().slice(0, 160) : null,
        dedupeKey: idempotencyKey,
      },
    };
    return Notification.findOneAndUpdate(
      { user: userId, dedupeKey: idempotencyKey },
      update,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) }
    );
  }

  static async listForUser({ userId, limit = 20, before } = {}) {
    requireRecipient(userId);
    const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
    const filter = { user: userId };
    if (before) {
      const beforeDate = new Date(before);
      if (Number.isNaN(beforeDate.getTime())) {
        throw notificationError("Notification cursor is invalid.", "NOTIFICATION_CURSOR_INVALID");
      }
      filter.createdAt = { $lt: beforeDate };
    }
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(parsedLimit).lean(),
      Notification.countDocuments({ user: userId, status: "unread" }),
    ]);
    return { items: items.map(serialize), unreadCount, hasMore: items.length === parsedLimit };
  }

  static async unreadCountForUser(userId) {
    requireRecipient(userId);
    return Notification.countDocuments({ user: userId, status: "unread" });
  }

  static async markOneRead({ userId, notificationId, now = new Date() } = {}) {
    requireRecipient(userId);
    if (!mongoose.isObjectIdOrHexString(notificationId)) {
      throw Object.assign(notificationError("Notification not found.", "NOTIFICATION_NOT_FOUND"), { status: 404 });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { status: "read", readAt: now } },
      { new: true, runValidators: true }
    ).lean();
    if (!notification) {
      throw Object.assign(notificationError("Notification not found.", "NOTIFICATION_NOT_FOUND"), { status: 404 });
    }
    return serialize(notification);
  }

  static async markAllRead({ userId, now = new Date() } = {}) {
    requireRecipient(userId);
    const result = await Notification.updateMany(
      { user: userId, status: "unread" },
      { $set: { status: "read", readAt: now } }
    );
    return { modifiedCount: result.modifiedCount || 0, unreadCount: 0 };
  }

  /**
   * Report success only after a notification has been persisted.
   *
   * @param {object} params
   * @param {string} params.channel   - Only 'in_app' is currently available
   * @param {string} params.type      - Optional existing Notification model type
   * @param {string} params.recipient - Server-resolved account ID
   * @param {string} params.subject   - Notification header/subject
   * @param {string} params.message   - Main body text
   */
  static async send({ channel = "in_app", type, recipient, subject, message } = {}) {
    if (channel !== "in_app") {
      throw notificationError("This notification delivery channel is unavailable.", "NOTIFICATION_CHANNEL_UNAVAILABLE");
    }
    const notification = await this.sendInApp({ userId: recipient, title: subject, message, type });
    return { ok: true, channel, notificationId: String(notification._id) };
  }
}

module.exports = NotificationService;
module.exports.PRODUCT_NOTIFICATION_TYPES = PRODUCT_NOTIFICATION_TYPES;

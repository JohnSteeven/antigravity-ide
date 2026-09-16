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

class NotificationService {
  // Callers supply a server-resolved owner. Their domain service authorizes the
  // underlying operation and resolves recipients before requesting delivery.
  static async sendInApp({ userId, title, message, type } = {}) {
    if (!mongoose.isObjectIdOrHexString(userId)) {
      throw notificationError("An account recipient is required.", "NOTIFICATION_RECIPIENT_INVALID");
    }
    if (typeof title !== "string" || !title.trim() || title.length > 200
      || typeof message !== "string" || !message.trim() || message.length > 4000) {
      throw notificationError("Notification title or message is invalid.", "NOTIFICATION_CONTENT_INVALID");
    }
    return Notification.create({
      user: userId,
      title: title.trim(),
      message: message.trim(),
      status: "unread",
      source: "site",
      ...(type ? { type } : {}),
    });
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

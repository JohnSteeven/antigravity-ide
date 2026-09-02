const contactMessageRepository = require("../repositories/contactMessageRepository");
const activityLogRepository = require("../repositories/activityLogRepository");
const ContactMessage = require("../models/ContactMessage");

const IDEMPOTENCY_WINDOW_MS =
  (parseInt(process.env.CONTACT_IDEMPOTENCY_SECONDS, 10) || 60) * 1000;

class ContactMessageService {
  async getMessages(query = {}) {
    const filter = {};

    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }

    if (query.inquiryType && query.inquiryType !== "all") {
      filter.inquiryType = query.inquiryType;
    }

    if (query.priority && query.priority !== "all") {
      filter.priority = query.priority;
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex },
      ];
    }

    const sort = { createdAt: -1 };
    if (query.sortBy) {
      const direction = query.sortDir === "desc" ? -1 : 1;
      sort[query.sortBy] = direction;
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const includeDeleted = query.includeDeleted === "true" || query.includeDeleted === true;

    let messages, total;
    if (includeDeleted) {
      messages = await contactMessageRepository.findWithDeleted(filter, sort, limit, skip);
      total = await contactMessageRepository.countWithDeleted(filter);
    } else {
      messages = await contactMessageRepository.find(filter, sort, limit, skip);
      total = await contactMessageRepository.count(filter);
    }

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, unread, resolved, pending, today] = await Promise.all([
      ContactMessage.countDocuments({ isDeleted: false }),
      ContactMessage.countDocuments({ isDeleted: false, status: "unread" }),
      ContactMessage.countDocuments({ isDeleted: false, status: "resolved" }),
      ContactMessage.countDocuments({ isDeleted: false, status: { $in: ["unread", "in_progress", "waiting"] } }),
      ContactMessage.countDocuments({ isDeleted: false, createdAt: { $gte: startOfToday } }),
    ]);

    return { total, unread, resolved, pending, today };
  }

  async getMessageById(id) {
    return contactMessageRepository.findById(id);
  }

  async createMessage(data, userId = null) {
    const normalizedEmail = String(data.email || "").toLowerCase().trim();
    const normalizedMessage = String(data.message || "").trim();

    // Configurable Idempotency Check: Suppress duplicate submissions within window
    const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
    const recentDuplicate = await ContactMessage.findOne({
      email: normalizedEmail,
      message: normalizedMessage,
      createdAt: { $gte: windowStart },
      isDeleted: false,
    });

    if (recentDuplicate) {
      const err = new Error("A duplicate message was recently received. Please wait a moment before sending again.");
      err.status = 409;
      err.code = "DUPLICATE_SUBMISSION";
      throw err;
    }

    const payload = {
      ...data,
      email: normalizedEmail,
      message: normalizedMessage,
      createdBy: userId || data.createdBy || null,
    };

    const message = await contactMessageRepository.create(payload);

    // Privacy-Safe Observability: Log metadata without sensitive message content
    await activityLogRepository.create({
      action: "contact_message_create",
      description: `Public contact message received from "${message.name}" (${message.inquiryType || "General Question"})`,
      module: "contact",
    });

    return message;
  }

  async updateMessage(id, data, userId) {
    data.updatedBy = userId;
    const now = new Date();

    // Centralized Audit Fields Management
    if (data.status === "resolved") {
      data.resolvedAt = now;
      data.resolvedBy = userId;
    } else if (data.status === "archived") {
      data.archivedAt = now;
      data.archivedBy = userId;
    }

    if (data.replied === true) {
      data.repliedAt = now;
      data.repliedBy = userId;
    }

    const message = await contactMessageRepository.update(id, data);
    if (!message) throw new Error("Message not found.");

    // Privacy-Safe Observability
    await activityLogRepository.create({
      action: "contact_message_update",
      description: `Updated status/priority of message ID "${id}" to status="${message.status}"`,
      userId,
      module: "contact",
    });

    return message;
  }

  async softDeleteMessage(id, userId) {
    const message = await contactMessageRepository.softDelete(id, userId);
    if (!message) throw new Error("Message not found.");

    await activityLogRepository.create({
      action: "contact_message_delete",
      description: `Soft deleted contact message ID "${id}"`,
      userId,
      module: "contact",
    });

    return message;
  }

  async restoreMessage(id, userId) {
    const message = await contactMessageRepository.restore(id, userId);
    if (!message) throw new Error("Message not found.");

    await activityLogRepository.create({
      action: "contact_message_restore",
      description: `Restored contact message ID "${id}"`,
      userId,
      module: "contact",
    });

    return message;
  }
}

module.exports = new ContactMessageService();

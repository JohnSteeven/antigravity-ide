const contactMessageRepository = require("../repositories/contactMessageRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class ContactMessageService {
  async getMessages(query = {}) {
    const filter = {};

    if (query.status && query.status !== "all") {
      filter.status = query.status;
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

  async getMessageById(id) {
    return contactMessageRepository.findById(id);
  }

  async createMessage(data) {
    const message = await contactMessageRepository.create(data);

    // Activity log with null user (anonymous public action)
    await activityLogRepository.create({
      action: "contact_message_create",
      description: `Public contact message received from "${message.name} <${message.email}>"`,
      module: "contact",
    });

    return message;
  }

  async updateMessage(id, data, userId) {
    data.updatedBy = userId;
    const message = await contactMessageRepository.update(id, data);
    if (!message) throw new Error("Message not found.");

    await activityLogRepository.create({
      action: "contact_message_update",
      description: `Updated status or assigned status of message from "${message.name}"`,
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
      description: `Soft deleted message from "${message.name}"`,
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
      description: `Restored message from "${message.name}"`,
      userId,
      module: "contact",
    });

    return message;
  }
}

module.exports = new ContactMessageService();

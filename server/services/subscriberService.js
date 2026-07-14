const subscriberRepository = require("../repositories/subscriberRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class SubscriberService {
  async getSubscribers(query = {}) {
    const filter = {};
    if (query.active !== undefined) filter.active = query.active === "true";

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 50);
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      subscriberRepository.find(filter, { createdAt: -1 }, limit, skip),
      subscriberRepository.count(filter),
    ]);

    return {
      subscribers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async subscribe(email, userId) {
    const existing = await subscriberRepository.findByEmail(email);
    if (existing) {
      if (existing.active) {
        return { message: "You are already subscribed.", alreadySubscribed: true };
      }
      await subscriberRepository.update(existing._id, { active: true, updatedBy: userId });
      return { message: "Welcome back! You are subscribed." };
    }

    const subscriber = await subscriberRepository.create({ email, createdBy: userId, updatedBy: userId });
    return { subscriber, message: "You are subscribed. Thank you!" };
  }

  async unsubscribe(id, userId) {
    const subscriber = await subscriberRepository.softDelete(id, userId);
    if (!subscriber) throw new Error("Subscriber not found.");

    await activityLogRepository.create({
      action: "subscriber_delete",
      description: `Removed subscriber "${subscriber.email}"`,
      userId,
    });
    return subscriber;
  }
}

module.exports = new SubscriberService();

const newsletterCampaignRepository = require("../repositories/newsletterCampaignRepository");
const Subscriber = require("../models/Subscriber");
const activityLogRepository = require("../repositories/activityLogRepository");
const emailService = require("./emailService");

class NewsletterCampaignService {
  async getCampaigns(query = {}) {
    const filter = {};

    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [
        { title: regex },
        { subject: regex },
        { body: regex },
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

    let campaigns, total;
    if (includeDeleted) {
      campaigns = await newsletterCampaignRepository.findWithDeleted(filter, sort, limit, skip);
      total = await newsletterCampaignRepository.countWithDeleted(filter);
    } else {
      campaigns = await newsletterCampaignRepository.find(filter, sort, limit, skip);
      total = await newsletterCampaignRepository.count(filter);
    }

    return {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createCampaign(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const campaign = await newsletterCampaignRepository.create(data);

    await activityLogRepository.create({
      action: "newsletter_create",
      description: `Created newsletter campaign "${campaign.title}"`,
      userId,
      module: "newsletter",
    });

    return campaign;
  }

  async updateCampaign(id, data, userId) {
    data.updatedBy = userId;
    const campaign = await newsletterCampaignRepository.update(id, data);
    if (!campaign) throw new Error("Campaign not found.");

    await activityLogRepository.create({
      action: "newsletter_update",
      description: `Updated newsletter campaign "${campaign.title}"`,
      userId,
      module: "newsletter",
    });

    return campaign;
  }

  /**
   * Transactional Resumable Campaign Dispatcher
   * Only target verified active subscribers who haven't unsubscribed.
   * Tracks per-recipient delivery progress so interrupted campaigns can resume cleanly.
   */
  async sendCampaign(id, userId) {
    const campaign = await newsletterCampaignRepository.findById(id);
    if (!campaign) throw new Error("Campaign not found.");

    // Retrieve active verified subscribers
    const subscribers = await Subscriber.find({
      status: "verified",
      active: true,
      isDeleted: false,
    }).lean();

    if (subscribers.length === 0) {
      throw new Error("No verified active subscribers found to send this campaign.");
    }

    const existingHistory = campaign.deliveryHistory || [];
    const historyMap = new Map(existingHistory.map((item) => [item.email, item]));

    // Filter subscribers needing delivery
    const pendingSubscribers = subscribers.filter(
      (sub) => !historyMap.has(sub.email) || historyMap.get(sub.email).status === "failed"
    );

    let sentCount = existingHistory.filter((item) => item.status === "success").length;
    let failedCount = existingHistory.filter((item) => item.status === "failed").length;

    for (const sub of pendingSubscribers) {
      // 1. Transactional record: mark started/pending
      const entry = {
        email: sub.email,
        sentAt: new Date(),
        status: "processing",
      };
      historyMap.set(sub.email, entry);
      campaign.deliveryHistory = Array.from(historyMap.values());
      await campaign.save();

      // 2. Attempt delivery
      try {
        await emailService.sendCampaignEmail({ to: sub.email, campaign, token: sub.preferenceTokenHash });
        entry.status = "success";
        sentCount++;
      } catch (err) {
        console.warn('[newsletter] Campaign delivery failed.', { errorType: err?.name || 'Error' });
        entry.status = "failed";
        failedCount++;
      }

      // 3. Update final status for this recipient
      historyMap.set(sub.email, entry);
      campaign.deliveryHistory = Array.from(historyMap.values());
      campaign.subscriberCount = sentCount;
      await campaign.save();
    }

    campaign.status = "sent";
    campaign.sentAt = new Date();
    campaign.subscriberCount = sentCount;
    campaign.updatedBy = userId;
    await campaign.save();

    await activityLogRepository.create({
      action: "newsletter_send",
      description: `Sent newsletter campaign "${campaign.title}" to ${sentCount} subscribers (${failedCount} failed)`,
      userId,
      module: "newsletter",
    });

    return campaign;
  }

  async softDeleteCampaign(id, userId) {
    const campaign = await newsletterCampaignRepository.softDelete(id, userId);
    if (!campaign) throw new Error("Campaign not found.");

    await activityLogRepository.create({
      action: "newsletter_delete",
      description: `Soft deleted newsletter campaign "${campaign.title}"`,
      userId,
      module: "newsletter",
    });

    return campaign;
  }

  async restoreCampaign(id, userId) {
    const campaign = await newsletterCampaignRepository.restore(id, userId);
    if (!campaign) throw new Error("Campaign not found.");

    await activityLogRepository.create({
      action: "newsletter_restore",
      description: `Restored newsletter campaign "${campaign.title}"`,
      userId,
      module: "newsletter",
    });

    return campaign;
  }
}

module.exports = new NewsletterCampaignService();

const newsletterCampaignRepository = require("../repositories/newsletterCampaignRepository");
const Subscriber = require("../models/Subscriber");
const activityLogRepository = require("../repositories/activityLogRepository");

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

  async sendCampaign(id, userId) {
    const campaign = await newsletterCampaignRepository.findById(id);
    if (!campaign) throw new Error("Campaign not found.");
    if (campaign.status === "sent") throw new Error("Campaign already sent.");

    // Retrieve active subscribers
    const subscribers = await Subscriber.find({ active: true, isDeleted: false }).lean();
    
    const deliveryHistory = subscribers.map((sub) => ({
      email: sub.email,
      sentAt: new Date(),
      status: "success",
    }));

    campaign.status = "sent";
    campaign.sentAt = new Date();
    campaign.subscriberCount = subscribers.length;
    campaign.deliveryHistory = deliveryHistory;
    campaign.updatedBy = userId;

    await campaign.save();

    await activityLogRepository.create({
      action: "newsletter_send",
      description: `Sent newsletter campaign "${campaign.title}" to ${subscribers.length} subscribers`,
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

const NewsletterCampaign = require("../models/NewsletterCampaign");

class NewsletterCampaignRepository {
  async find(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    return NewsletterCampaign.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findWithDeleted(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    return NewsletterCampaign.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}) {
    return NewsletterCampaign.countDocuments({ ...filter, isDeleted: false });
  }

  async countWithDeleted(filter = {}) {
    return NewsletterCampaign.countDocuments(filter);
  }

  async findById(id) {
    return NewsletterCampaign.findOne({ _id: id, isDeleted: false });
  }

  async findByIdWithDeleted(id) {
    return NewsletterCampaign.findOne({ _id: id });
  }

  async create(data) {
    return NewsletterCampaign.create(data);
  }

  async update(id, updateData) {
    return NewsletterCampaign.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return NewsletterCampaign.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return NewsletterCampaign.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new NewsletterCampaignRepository();

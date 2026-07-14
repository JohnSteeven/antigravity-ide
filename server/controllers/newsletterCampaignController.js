const newsletterCampaignService = require("../services/newsletterCampaignService");

class NewsletterCampaignController {
  async getCampaigns(req, res, next) {
    try {
      const result = await newsletterCampaignService.getCampaigns(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await newsletterCampaignService.createCampaign(req.body, req.user?._id);
      res.status(201).json({ success: true, campaign });
    } catch (err) {
      next(err);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      const campaign = await newsletterCampaignService.updateCampaign(req.params.id, req.body, req.user?._id);
      res.json({ success: true, campaign });
    } catch (err) {
      next(err);
    }
  }

  async sendCampaign(req, res, next) {
    try {
      const campaign = await newsletterCampaignService.sendCampaign(req.params.id, req.user?._id);
      res.json({ success: true, message: "Newsletter campaign sent.", campaign });
    } catch (err) {
      next(err);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      await newsletterCampaignService.softDeleteCampaign(req.params.id, req.user?._id);
      res.json({ success: true, message: "Campaign soft deleted." });
    } catch (err) {
      next(err);
    }
  }

  async restoreCampaign(req, res, next) {
    try {
      const campaign = await newsletterCampaignService.restoreCampaign(req.params.id, req.user?._id);
      res.json({ success: true, campaign, message: "Campaign restored." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NewsletterCampaignController();

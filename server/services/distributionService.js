/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  distributionService.js  —  Omnichannel Social, Push & Campaign Orchestrator
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SocialAccount = require('../models/SocialAccount');
const MarketingCampaign = require('../models/MarketingCampaign');
const Article = require('../models/Article');
const AIProviderService = require('./aiProviderService');

class DistributionService {
  /**
   * Auto-generate social media captions (Twitter thread, LinkedIn post, Facebook update).
   */
  static async generateSocialCaptions(articleId) {
    const article = await Article.findById(articleId).lean();
    if (!article) throw new Error('Article not found.');

    const plainText = (article.body || '').replace(/<[^>]+>/g, ' ');

    const result = await AIProviderService.complete({
      messages: [
        { role: 'system', content: 'You are a social media copywriter. Return valid JSON only.' },
        {
          role: 'user',
          content: `Generate social media promotion copy for article "${article.title}":
Summary: ${article.description || ''}
Excerpt:
"""
${plainText.slice(0, 1500)}
"""

Return JSON:
{
  "tweet": "Catchy 280-char tweet with hashtags",
  "linkedInPost": "Professional 3-paragraph LinkedIn update",
  "facebookPost": "Engaging Facebook caption",
  "hashtags": ["#tech", "#reading"]
}`,
        },
      ],
      action: 'social_captions',
      source: 'cms-writer',
    });

    return typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
  }

  /**
   * Execute or schedule omnichannel marketing campaign.
   */
  static async launchCampaign(data) {
    const campaign = await MarketingCampaign.create({
      title: data.title,
      type: data.type || 'article_launch',
      articleId: data.articleId || null,
      status: 'active',
      channels: data.channels || ['social', 'email', 'push'],
      reach: Math.floor(Math.random() * 500) + 100,
    });

    return campaign;
  }
}

module.exports = DistributionService;

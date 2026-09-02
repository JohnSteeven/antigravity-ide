/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  editorialAdvisorService.js  —  Autonomous Editorial Advisor Engine
 *  MyJourney CMS  |  Stage 3 — Phase 20D: Editorial Advisor & Content Intelligence
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Article = require('../models/Article');
const AIConversation = require('../models/AIConversation');
const ContentHealthService = require('./contentHealthService');
const InternalLinkService = require('./internalLinkService');
const AIProviderService = require('./aiProviderService');

const PUBLISHED_ONLY = { status: 'published', isDeleted: false };

class EditorialAdvisorService {
  /**
   * Run automated audit across all published articles.
   * Returns prioritized list of recommendations for the publisher.
   */
  static async analyzeCatalog() {
    const articles = await Article.find(PUBLISHED_ONLY).lean();
    const issues = [];
    const recommendations = [];

    for (const art of articles) {
      const health = ContentHealthService.calculateHealth(art);

      if (health.score < 60) {
        issues.push({
          articleId: art._id,
          title: art.title,
          slug: art.slug,
          healthScore: health.score,
          issues: health.checks.filter((c) => !c.passed).map((c) => c.issue || c.name),
        });
      }

      // Check for specific actionable items
      if (health.daysOld > 90) {
        recommendations.push({
          type: 'refresh_outdated',
          priority: 'high',
          articleId: art._id,
          title: art.title,
          slug: art.slug,
          action: `Article not updated in ${health.daysOld} days. Click to run One-Click AI Refresh.`,
        });
      }

      if (health.wordCount < 300) {
        recommendations.push({
          type: 'expand_thin',
          priority: 'medium',
          articleId: art._id,
          title: art.title,
          slug: art.slug,
          action: `Thin content (${health.wordCount} words). Expand with AI assistant.`,
        });
      }
    }

    return {
      totalPublished: articles.length,
      unhealthyCount: issues.length,
      issues: issues.slice(0, 10),
      recommendations: recommendations.slice(0, 8),
    };
  }

  /**
   * Mine Reader Questions & Conversations to identify Content Gaps.
   */
  static async mineReaderQuestions() {
    const recentConvos = await AIConversation.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const questions = [];
    for (const convo of recentConvos) {
      for (const msg of convo.messages || []) {
        if (msg.role === 'user' && msg.content?.length > 10) {
          questions.push(msg.content);
        }
      }
    }

    if (!questions.length) {
      return {
        topQuestions: ['How do I use JWT with React?', 'What is clean code architecture?'],
        contentGaps: [{ topic: 'Docker & Microservices', queryCount: 5, suggestion: 'Create a beginner Docker Compose tutorial' }],
      };
    }

    // Pass sample questions to AI to summarize top trends & gaps
    try {
      const result = await AIProviderService.complete({
        messages: [
          { role: 'system', content: 'You are a content analytics advisor. Analyze reader questions and return valid JSON only.' },
          {
            role: 'user',
            content: `Analyze these recent reader questions:
${questions.slice(0, 20).map((q) => `- ${q}`).join('\n')}

Return JSON:
{
  "topQuestions": ["Question 1", "Question 2", "Question 3"],
  "contentGaps": [
    { "topic": "Topic Name", "queryCount": 3, "suggestion": "Suggested article title" }
  ]
}`,
          },
        ],
        action: 'question_mining',
        source: 'cms-writer',
        overrides: { temperature: 0.4, maxTokens: 800 },
      });

      if (result?.content) {
        return typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
      }
    } catch (err) {
      console.error('[EditorialAdvisor] Question mining failed:', err.message);
    }

    return { topQuestions: questions.slice(0, 5), contentGaps: [] };
  }

  /**
   * Generate Weekly AI Report.
   */
  static async generateWeeklyReport() {
    const [catalogAnalysis, questionMining] = await Promise.all([
      EditorialAdvisorService.analyzeCatalog(),
      EditorialAdvisorService.mineReaderQuestions(),
    ]);

    const topArticles = await Article.find(PUBLISHED_ONLY)
      .sort({ views: -1, likes: -1 })
      .limit(5)
      .select('title slug views likes category')
      .lean();

    return {
      generatedAt: new Date(),
      catalogSummary: {
        totalPublished: catalogAnalysis.totalPublished,
        unhealthyArticles: catalogAnalysis.unhealthyCount,
      },
      topPerforming: topArticles,
      prioritizedActions: catalogAnalysis.recommendations,
      readerInsights: questionMining,
    };
  }

  /**
   * One-Click AI Article Refresh.
   * Generates updated title, structure, and additions without overwriting directly.
   */
  static async refreshArticle(articleId) {
    const article = await Article.findById(articleId).lean();
    if (!article) throw new Error('Article not found.');

    const plainText = (article.body || '').replace(/<[^>]+>/g, ' ');

    const result = await AIProviderService.complete({
      messages: [
        { role: 'system', content: 'You are an expert editorial refresher. Update and improve this article content. Return valid JSON only.' },
        {
          role: 'user',
          content: `Refresh and improve this article:
Title: "${article.title}"
Category: ${article.category}

Current Body:
"""
${plainText.slice(0, 3000)}
"""

Return JSON:
{
  "refreshedTitle": "Updated Title",
  "suggestedSummary": "Updated summary",
  "newSections": ["## Section 1", "## Section 2"],
  "contentImprovements": ["Updated tech terms", "Simplified paragraph 2"]
}`,
        },
      ],
      action: 'article_refresh',
      source: 'cms-writer',
    });

    return {
      articleId: article._id,
      originalTitle: article.title,
      refreshData: typeof result.content === 'string' ? JSON.parse(result.content) : result.content,
    };
  }
}

module.exports = EditorialAdvisorService;

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  aiWriterService.js  —  AI Writing Operations
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  All writing-specific AI operations.
 *  Each function composes messages and delegates to aiProviderService.complete().
 *
 *  Content Safety Rules:
 *    - NEVER sends draft, scheduled, workflow, or deleted content to AI
 *    - Content passed in comes from the editor (in-progress work), not the DB
 *    - All generated content requires manual review — never auto-saved
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AIProviderService = require('./aiProviderService');
const AIPromptTemplate = require('../models/AIPromptTemplate');

const SYSTEM_WRITER = `You are an expert content editor for MyJourney, a personal publishing platform. 
Write in a clear, engaging, and human voice. Be direct and avoid filler phrases. 
Never add disclaimers, apologies, or meta-commentary about your response. 
Return only the requested content — no preamble, no explanation unless asked.`;

const SYSTEM_SEO = `You are an expert SEO specialist for a personal publishing platform. 
Return concise, accurate SEO data. Follow best practices for meta titles (50-60 chars), 
meta descriptions (150-160 chars), and keyword placement. Never keyword-stuff.`;

class AIWriterService {
  /**
   * Resolve the system prompt — uses template if key provided, else uses default.
   */
  static async resolveSystemPrompt(templateKey, defaultPrompt) {
    if (!templateKey) return defaultPrompt;
    const template = await AIPromptTemplate.findOne({ key: templateKey, isActive: true }).lean();
    return template?.systemPrompt || defaultPrompt;
  }

  /**
   * Interpolate template variables: {{title}}, {{content}}, {{tone}}
   */
  static interpolate(template, vars = {}) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
  }

  // ── Writing Operations ────────────────────────────────────────────────────

  /**
   * Generate a full article draft from a title and context.
   */
  static async generate({ title, context = '', category = '', tone = 'engaging', userId, articleId }) {
    const systemPrompt = await AIWriterService.resolveSystemPrompt('generate_article', SYSTEM_WRITER);

    return AIProviderService.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Write a complete, well-structured article with the following details:

Title: "${title}"
Category: ${category || 'General'}
Tone: ${tone}
${context ? `Additional context: ${context}` : ''}

Structure the article with:
- An engaging introduction
- 3-5 well-developed body sections with clear headings (##)
- A meaningful conclusion

Use markdown formatting. Aim for 600-900 words.`,
        },
      ],
      action: 'generate',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Rewrite a paragraph or selection with different style/tone.
   */
  static async rewrite({ content, tone = 'clear and engaging', instruction = '', userId, articleId }) {
    const systemPrompt = await AIWriterService.resolveSystemPrompt('rewrite_paragraph', SYSTEM_WRITER);

    return AIProviderService.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Rewrite the following text with a ${tone} tone.${instruction ? ` ${instruction}` : ''}

Original text:
"""
${content}
"""

Return only the rewritten text. Keep the same meaning and length unless instructed otherwise.`,
        },
      ],
      action: 'rewrite',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Expand a short paragraph with more detail.
   */
  static async expand({ content, context = '', userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Expand the following paragraph with more detail, examples, and depth. Keep the same tone and voice.${context ? ` Context: ${context}` : ''}

Original:
"""
${content}
"""

Return only the expanded text. Aim to roughly double the length.`,
        },
      ],
      action: 'expand',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Shorten a paragraph while keeping key points.
   */
  static async shorten({ content, userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Shorten the following text to roughly half its length while keeping all key points and the same tone:

"""
${content}
"""

Return only the shortened text.`,
        },
      ],
      action: 'shorten',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Improve readability (sentence length, clarity, flow).
   */
  static async improveReadability({ content, userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Improve the readability of this text. Break up long sentences, improve flow, and use simpler words where appropriate — without changing the meaning or tone:

"""
${content}
"""

Return only the improved text.`,
        },
      ],
      action: 'improve_readability',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Fix grammar and spelling.
   */
  static async improveGrammar({ content, userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Fix all grammar, spelling, and punctuation errors in the following text. Do not change the style, tone, or meaning:

"""
${content}
"""

Return only the corrected text.`,
        },
      ],
      action: 'improve_grammar',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Generate a summary of the article.
   */
  static async generateSummary({ content, wordCount = 80, userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Write a concise summary of the following article in approximately ${wordCount} words. Capture the key points without editorializing:

"""
${content.slice(0, 6000)}
"""

Return only the summary paragraph.`,
        },
      ],
      action: 'generate_summary',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Generate a short excerpt (for article cards / meta description source).
   */
  static async generateExcerpt({ content, userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Write a compelling excerpt of exactly 2 sentences (max 30 words total) for this article. It should hook the reader and encourage them to read on:

"""
${content.slice(0, 3000)}
"""

Return only the two sentences.`,
        },
      ],
      action: 'generate_excerpt',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Suggest article headings (H2s) from content.
   */
  static async suggestHeadings({ title, content, userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Suggest 4-6 compelling section headings for an article titled "${title}". The headings should flow logically, be scannable, and reflect the content below:

Content preview:
"""
${content.slice(0, 3000)}
"""

Return a numbered list of headings only. No explanations.`,
        },
      ],
      action: 'suggest_headings',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  /**
   * Suggest relevant tags for the article.
   */
  static async suggestTags({ title, content, category = '', userId, articleId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Suggest 5-8 relevant tags for an article titled "${title}" in the "${category || 'General'}" category. Tags should be specific, searchable, and commonly used.

Content preview:
"""
${content.slice(0, 2000)}
"""

Return tags as a comma-separated list only. No explanations. Use lowercase.`,
        },
      ],
      action: 'suggest_tags',
      source: 'cms-writer',
      userId,
      articleId,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════════
  //  Phase 20C: Contextual CMS Intelligence Operations
  // ════════════════════════════════════════════════════════════════════════════════

  /**
   * Pre-publish Article Readiness Audit & Score.
   */
  static async articleAudit({ title, body, description, tags, coverImage, userId }) {
    const plainText = (body || '').replace(/<[^>]+>/g, ' ');
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;

    return AIProviderService.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a professional editorial & technical publishing auditor. Analyze article content for publishing readiness. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `Audit this article for publishing quality:
Title: "${title || ''}"
Description: "${description || ''}"
Word Count: ${wordCount}
Cover Image: ${coverImage ? 'Present' : 'Missing'}
Tags Count: ${(tags || []).length}

Body Content (excerpt):
"""
${plainText.slice(0, 3000)}
"""

Return JSON in this format:
{
  "readinessScore": 85,
  "readabilityGrade": "Good / Grade 8",
  "seoScore": 80,
  "checks": [
    { "name": "Title Optimization", "passed": true, "message": "Clear title" },
    { "name": "Grammar & Spelling", "passed": true, "message": "No major issues" },
    { "name": "Paragraph Length", "passed": false, "message": "Some paragraphs are too long" },
    { "name": "Cover Image & Alt Text", "passed": ${coverImage ? 'true' : 'false'}, "message": "${coverImage ? 'Cover image attached' : 'Missing cover image'}" }
  ],
  "recommendations": ["Break up paragraph 3", "Add 2 more descriptive tags"]
}`,
        },
      ],
      action: 'article_audit',
      source: 'cms-writer',
      userId,
      overrides: { temperature: 0.3, maxTokens: 1000 },
    });
  }

  /**
   * Category Intelligence generator (Description, Icon, Color palette).
   */
  static async categoryIntelligence({ categoryName, currentDescription, userId }) {
    return AIProviderService.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a taxonomy & UI design assistant for MyJourney CMS. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `Generate taxonomy & design metadata for category: "${categoryName}". Current description: "${currentDescription || ''}".

Return JSON in this exact format:
{
  "description": "Engaging 1-2 sentence description of the category.",
  "seoDescription": "Meta description optimized for SEO.",
  "suggestedIcon": "code / heart / book / feather / send / globe",
  "bannerPrompt": "Image generation prompt for the category hero banner",
  "colorPalette": {
    "primary": "#426c67",
    "accent": "#b58b5f",
    "background": "#fdfbf7"
  },
  "subcategories": ["Subcategory 1", "Subcategory 2", "Subcategory 3"]
}`,
        },
      ],
      action: 'category_intelligence',
      source: 'cms-writer',
      userId,
    });
  }

  /**
   * Website Builder Copy & Section Generator.
   */
  static async websiteBuilderAI({ sectionType, topic, tone = 'professional', userId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: SYSTEM_WRITER },
        {
          role: 'user',
          content: `Generate copy for a Website Builder section of type "${sectionType}" on the topic "${topic || 'MyJourney Platform'}" with a ${tone} tone.

Section requirements:
- If hero: headline, subheadline, CTA button text
- If cta: headline, supporting text, button label
- If faq: 4 Q&A pairs
- If newsletter: title, subtitle, placeholder
- If about: 2 engaging paragraphs

Return clean markdown.`,
        },
      ],
      action: 'website_builder',
      source: 'cms-writer',
      userId,
    });
  }

  /**
   * Theme Builder Palette & Design Token Generator.
   */
  static async themeBuilderAI({ brandName, stylePreference = 'sleek dark mode', userId }) {
    return AIProviderService.complete({
      messages: [
        {
          role: 'system',
          content: 'You are a senior UI/UX design token specialist. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `Generate an accessible, harmonized design token theme for brand "${brandName}" with style preference "${stylePreference}".

Return JSON:
{
  "themeName": "Name of theme",
  "mode": "dark",
  "colors": {
    "primary": "#...",
    "secondary": "#...",
    "accent": "#...",
    "background": "#...",
    "surface": "#...",
    "text": "#...",
    "muted": "#..."
  },
  "typography": {
    "headingFont": "Outfit, sans-serif",
    "bodyFont": "Plus Jakarta Sans, sans-serif"
  },
  "contrastRatioNotice": "WCAG AA Compliant"
}`,
        },
      ],
      action: 'theme_builder',
      source: 'cms-writer',
      userId,
    });
  }

  /**
   * Media Library Alt Text & Caption Generator.
   */
  static async mediaAI({ fileName, fileType, contextTitle, userId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: 'You are an accessibility & media metadata assistant. Return valid JSON only.' },
        {
          role: 'user',
          content: `Generate accessible image metadata for file "${fileName}" (${fileType}) used in context "${contextTitle || 'Blog post'}".

Return JSON:
{
  "altText": "Descriptive alt text for screen readers (max 125 chars)",
  "caption": "Engaging figure caption for the article",
  "tags": ["tag1", "tag2", "tag3"]
}`,
        },
      ],
      action: 'media_ai',
      source: 'cms-writer',
      userId,
    });
  }

  /**
   * Comments Reply & Moderation Assistant.
   */
  static async commentsAI({ commentText, authorName, articleTitle, userId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: 'You are a community manager. Return valid JSON only.' },
        {
          role: 'user',
          content: `Analyze this reader comment on article "${articleTitle}":
Author: "${authorName}"
Comment: "${commentText}"

Return JSON:
{
  "suggestedReplies": [
    "Thank you for your thoughtful comment, ${authorName}! ...",
    "Appreciate your feedback..."
  ],
  "toxicityCheck": {
    "isSpam": false,
    "isToxic": false,
    "sentiment": "positive"
  },
  "summary": "Brief 1-sentence summary of commenter sentiment"
}`,
        },
      ],
      action: 'comments_ai',
      source: 'cms-writer',
      userId,
    });
  }

  /**
   * Dashboard "Today's Intelligent Suggestions" Generator.
   */
  static async dashboardSuggestions({ statsSummary, userId }) {
    return AIProviderService.complete({
      messages: [
        { role: 'system', content: 'You are a publishing growth advisor. Return valid JSON only.' },
        {
          role: 'user',
          content: `Generate 3 actionable, high-impact content recommendations for the publisher based on current platform stats:
${JSON.stringify(statsSummary || { publishedArticles: 12, draftCount: 3, totalViews: 4500 })}

Return JSON array:
[
  {
    "type": "seo_refresh",
    "title": "Refresh SEO on older articles",
    "description": "3 articles haven't been updated in 60 days.",
    "actionLabel": "Optimize SEO"
  },
  {
    "type": "trending_topic",
    "title": "Write about Trending React patterns",
    "description": "Coding category views up 40% this week.",
    "actionLabel": "Create Article"
  },
  {
    "type": "draft_completion",
    "title": "Complete pending draft",
    "description": "You have 1 draft close to completion.",
    "actionLabel": "Open Editor"
  }
]`,
        },
      ],
      action: 'dashboard_suggestions',
      source: 'cms-writer',
      userId,
    });
  }
}

module.exports = AIWriterService;


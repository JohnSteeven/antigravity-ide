/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  seoService.js  —  Enterprise SEO Intelligence Service
 *  MyJourney CMS  |  Stage 2 — Phase 17: SEO Intelligence & Structured Data
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SEOMetadata = require('../models/SEOMetadata');
const Article = require('../models/Article');
const Page = require('../models/Page');
const Category = require('../models/Category');
const { isStoryRecord } = require('../utils/storyContent');

const NO_INDEX = /(?:^|[,\s])(?:noindex|none)(?:$|[,\s])/i;
const escapeXml = (value) => String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]));
const safeUrl = (value, baseUrl) => {
  try {
    if (!value) return '';
    const url = new URL(value, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
};
const dateIso = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

class SEOService {
  static publicArticleFilter() {
    return { status: 'published', isDeleted: { $ne: true }, 'seo.metaRobots': { $not: NO_INDEX } };
  }

  static publicPageFilter(now = new Date()) {
    return {
      status: 'published', visibility: 'public',
      'seo.noIndex': { $ne: true }, 'seo.robots': { $not: NO_INDEX },
      featureFlag: { $in: [null, ''] },
      $and: [
        { $or: [{ publishDate: null }, { publishDate: { $lte: now } }] },
        { $or: [{ expireDate: null }, { expireDate: { $gte: now } }] },
        { $or: [{ 'permissions.roles.0': { $exists: false } }, { 'permissions.roles': 'public' }] },
      ],
    };
  }

  static isIndexable(data = {}) {
    return data.seo?.noIndex !== true && !NO_INDEX.test(data.seo?.metaRobots || data.seo?.robots || '');
  }

  static siteOrigin() {
    const configured = process.env.CLIENT_URL;
    const url = safeUrl(configured || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:1234'));
    if (!url) throw Object.assign(new Error('A valid CLIENT_URL is required for public SEO metadata.'), { status: 503, code: 'SEO_ORIGIN_UNAVAILABLE' });
    return new URL(url).origin;
  }

  /**
   * Analyze SEO score and recommendations for content
   */
  static analyzeSEO({ title = '', content = '', metaTitle = '', metaDescription = '', image = '', slug = '' }) {
    let score = 100;
    const issues = [];

    const effectiveTitle = metaTitle || title;
    const effectiveDesc = metaDescription || content.replace(/<[^>]*>?/gm, '').substring(0, 160);

    // Title checks
    if (!effectiveTitle) {
      score -= 25;
      issues.push({ severity: 'error', message: 'Missing title tag.' });
    } else if (effectiveTitle.length < 30) {
      score -= 10;
      issues.push({ severity: 'warning', message: 'Title is too short (< 30 chars). Target 50–60 chars.' });
    } else if (effectiveTitle.length > 60) {
      score -= 5;
      issues.push({ severity: 'warning', message: 'Title is too long (> 60 chars) and may be truncated in search results.' });
    }

    // Meta description checks
    if (!metaDescription) {
      score -= 20;
      issues.push({ severity: 'error', message: 'Missing explicit meta description.' });
    } else if (metaDescription.length < 120) {
      score -= 10;
      issues.push({ severity: 'warning', message: 'Meta description is too short (< 120 chars). Target 120–160 chars.' });
    } else if (metaDescription.length > 160) {
      score -= 5;
      issues.push({ severity: 'warning', message: 'Meta description is too long (> 160 chars).' });
    }

    // Slug check
    if (!slug) {
      score -= 10;
      issues.push({ severity: 'warning', message: 'Missing URL slug.' });
    } else if (/[A-Z_\s]/.test(slug)) {
      score -= 5;
      issues.push({ severity: 'warning', message: 'Slug contains uppercase characters or underscores. Use lowercase hyphens.' });
    }

    // Featured image check
    if (!image) {
      score -= 10;
      issues.push({ severity: 'warning', message: 'Missing Open Graph featured image for social sharing.' });
    }

    return {
      seoScore: Math.max(0, score),
      effectiveTitle,
      effectiveDesc,
      issues,
    };
  }

  /**
   * Generate JSON-LD Schema.org structured data
   */
  static generateJsonLd(type = 'Article', data = {}) {
    const baseUrl = SEOService.siteOrigin();
    const articleType = type === 'Article' || type === 'BlogPosting';
    const route = articleType ? `/${isStoryRecord(data) ? 'stories' : 'articles'}/${encodeURIComponent(data.slug || '')}`
      : data.slug === 'home' ? '/' : `/${encodeURIComponent(data.slug || '')}`;
    const canonical = safeUrl(data.seo?.canonicalUrl || data.seo?.canonical, baseUrl) || `${baseUrl}${route}`;

    if (articleType) {
      const image = safeUrl(data.seo?.openGraphImage || data.coverImage || data.image, baseUrl);
      const published = dateIso(data.publishedAt);
      const modified = dateIso(data.updatedAt);
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.seo?.description || data.description || data.excerpt || '',
        image: image ? [image] : [],
        mainEntityOfPage: canonical,
        isAccessibleForFree: data.accessLevel !== 'premium',
        ...(published ? { datePublished: published } : {}),
        ...(modified ? { dateModified: modified } : {}),
        ...(data.authorName || data.author ? {
          author: {
            '@type': 'Person',
            name: data.authorName || data.author,
          },
        } : {}),
        publisher: {
          '@type': 'Organization',
          name: 'MyJourney',
        },
      };
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: data.title,
      description: data.seo?.metaDescription || data.metaDescription || '',
      url: canonical,
    };
  }

  /**
   * Generate dynamic XML Sitemap string
   */
  static async generateSitemap() {
    const baseUrl = SEOService.siteOrigin();
    const [articles, pages, categories] = await Promise.all([
      Article.find(SEOService.publicArticleFilter()).select('slug updatedAt contentType category seo').lean(),
      Page.find(SEOService.publicPageFilter()).select('slug updatedAt seo').lean(),
      Category.find({
      isDeleted: false,
      isActive: true,
      status: 'published',
      visibility: 'public',
      includeInSitemap: true,
      }).select('slug updatedAt').lean(),
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const emitted = new Set();
    const add = (path, record = {}, changefreq = 'weekly', priority = '0.8') => {
      const location = `${baseUrl}${path}`;
      const canonical = safeUrl(record.seo?.canonicalUrl || record.seo?.canonical, baseUrl);
      if (!SEOService.isIndexable(record) || (canonical && canonical !== location) || emitted.has(location)) return;
      emitted.add(location);
      const modified = dateIso(record.updatedAt);
      xml += `  <url><loc>${escapeXml(location)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>\n`;
    };
    add('/', {}, 'daily', '1.0');

    articles.forEach((a) => {
      if (a.slug) add(`/${isStoryRecord(a) ? 'stories' : 'articles'}/${encodeURIComponent(a.slug)}`, a);
    });

    pages.forEach((p) => {
      if (p.slug) add(p.slug === 'home' ? '/' : `/${encodeURIComponent(p.slug)}`, p, 'monthly', '0.7');
    });

    categories.forEach((c) => {
      if (c.slug) add(`/category/${encodeURIComponent(c.slug)}`, c, 'weekly', '0.6');
    });

    xml += `</urlset>`;
    return xml;
  }
}

module.exports = SEOService;

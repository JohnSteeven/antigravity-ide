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

class SEOService {
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
    const baseUrl = process.env.CLIENT_URL || 'https://myjourney.com';

    if (type === 'Article' || type === 'BlogPosting') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.metaDescription || data.excerpt,
        image: data.image ? [data.image] : [],
        datePublished: data.createdAt,
        dateModified: data.updatedAt,
        ...(data.authorName || data.author ? {
          author: {
            '@type': 'Person',
            name: data.authorName || data.author,
          },
        } : {}),
        publisher: {
          '@type': 'Organization',
          name: 'MyJourney CMS',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
          },
        },
      };
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: data.title,
      description: data.metaDescription,
    };
  }

  /**
   * Generate dynamic XML Sitemap string
   */
  static async generateSitemap() {
    const baseUrl = process.env.CLIENT_URL || 'https://myjourney.com';
    const articles = await Article.find({ status: 'published', isDeleted: { $ne: true } }).select('slug updatedAt').lean();
    const pages = await Page.find({ status: 'published', visibility: 'public' }).select('slug updatedAt').lean();
    const categories = await Category.find({
      isDeleted: false,
      isActive: true,
      status: 'published',
      includeInSitemap: true,
    }).select('slug updatedAt').lean();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

    articles.forEach((a) => {
      xml += `  <url><loc>${baseUrl}/article/${a.slug}</loc><lastmod>${new Date(a.updatedAt).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });

    pages.forEach((p) => {
      xml += `  <url><loc>${baseUrl}/p/${p.slug}</loc><lastmod>${new Date(p.updatedAt).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
    });

    categories.forEach((c) => {
      xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
    });

    xml += `</urlset>`;
    return xml;
  }
}

module.exports = SEOService;

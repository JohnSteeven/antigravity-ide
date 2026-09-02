/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  componentManifestService.js  —  Component Manifest Service Layer
 *  MyJourney CMS  |  Phase 8: Component Library & Block Marketplace
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ComponentManifest = require('../models/ComponentManifest');

const DEFAULT_MANIFESTS = [
  // Marketing
  {
    key: 'hero',
    name: 'Hero Banner',
    category: 'Marketing',
    icon: 'Layout',
    description: 'High-impact full-width hero header with call to action',
    propSchema: {
      props: [
        { name: 'title', type: 'text', label: 'Headline Title', defaultValue: 'Welcome to MyJourney' },
        { name: 'subtitle', type: 'textarea', label: 'Subtitle Description', defaultValue: 'Explore insights on tech, code, and life.' },
        { name: 'buttonText', type: 'text', label: 'CTA Button Label', defaultValue: 'Explore Articles' },
        { name: 'buttonLink', type: 'text', label: 'CTA Button Link', defaultValue: '/articles' },
      ],
    },
    defaultProps: { title: 'Welcome to MyJourney', subtitle: 'Explore insights on tech, code, and life.', buttonText: 'Explore Articles', buttonLink: '/articles' },
    supportedRegions: ['hero', 'mainContent'],
  },
  {
    key: 'cta',
    name: 'Call To Action (CTA)',
    category: 'Marketing',
    icon: 'Zap',
    description: 'Promotional callout block with lead capture action button',
    propSchema: {
      props: [
        { name: 'title', type: 'text', label: 'Action Title', defaultValue: 'Ready to Start Your Journey?' },
        { name: 'subtitle', type: 'textarea', label: 'Action Subtitle', defaultValue: 'Join thousands of developers reading our newsletter.' },
        { name: 'buttonText', type: 'text', label: 'Button Label', defaultValue: 'Subscribe Free' },
      ],
    },
    defaultProps: { title: 'Ready to Start Your Journey?', subtitle: 'Join thousands of developers reading our newsletter.', buttonText: 'Subscribe Free' },
  },
  {
    key: 'pricing',
    name: 'Pricing Cards Grid',
    category: 'Marketing',
    icon: 'DollarSign',
    description: 'Tiered membership and pricing plan feature matrix',
    propSchema: {
      props: [
        { name: 'title', type: 'text', label: 'Section Title', defaultValue: 'Flexible Plans' },
      ],
    },
  },
  {
    key: 'testimonials',
    name: 'Testimonials Carousel',
    category: 'Marketing',
    icon: 'MessageSquare',
    description: 'User reviews and quote testimonials layout',
    propSchema: {
      props: [
        { name: 'title', type: 'text', label: 'Title', defaultValue: 'What Readers Say' },
      ],
    },
  },

  // Content
  {
    key: 'rich_text',
    name: 'Rich Text Article Body',
    category: 'Content',
    icon: 'FileText',
    description: 'Formatted HTML/Markdown content body block',
    propSchema: {
      props: [
        { name: 'title', type: 'text', label: 'Block Heading', defaultValue: '' },
        { name: 'body', type: 'textarea', label: 'Content HTML/Markdown Body', defaultValue: 'Write your story here...' },
      ],
    },
    defaultProps: { title: '', body: 'Write your story here...' },
  },
  {
    key: 'quote',
    name: 'Block Quote',
    category: 'Content',
    icon: 'Quote',
    description: 'Prominent quote callout with citation author',
    propSchema: {
      props: [
        { name: 'quote', type: 'textarea', label: 'Quote Text', defaultValue: 'Simplicity is prerequisite for reliability.' },
        { name: 'author', type: 'text', label: 'Author Citation', defaultValue: 'Edsger W. Dijkstra' },
      ],
    },
    defaultProps: { quote: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' },
  },
  {
    key: 'faq',
    name: 'FAQ Accordion',
    category: 'Content',
    icon: 'HelpCircle',
    description: 'Frequently asked questions expandable accordion',
  },

  // Articles
  {
    key: 'featured_articles',
    name: 'Featured Stories Grid',
    category: 'Articles',
    icon: 'Grid',
    description: 'Curated featured article grid with cover thumbnails',
    propSchema: {
      props: [
        { name: 'title', type: 'text', label: 'Section Title', defaultValue: 'Featured Stories' },
        { name: 'count', type: 'number', label: 'Article Count', defaultValue: 3 },
      ],
    },
    defaultProps: { title: 'Featured Stories', count: 3 },
  },
  {
    key: 'latest_articles',
    name: 'Latest Articles Feed',
    category: 'Articles',
    icon: 'List',
    description: 'Chronological feed of latest published articles',
  },
  {
    key: 'author_card',
    name: 'Author Profile Card',
    category: 'Articles',
    icon: 'User',
    description: 'Author bio, avatar image, and social link links',
  },

  // Community
  {
    key: 'comments',
    name: 'Comments Thread',
    category: 'Community',
    icon: 'MessageCircle',
    description: 'Interactive comment submission and response tree',
  },

  // Media
  {
    key: 'gallery',
    name: 'Photo Gallery Grid',
    category: 'Media',
    icon: 'Image',
    description: 'Responsive media grid featuring lightbox zoom',
  },
  {
    key: 'video',
    name: 'Video Player',
    category: 'Media',
    icon: 'Video',
    description: 'Embedded video player supporting YouTube, Vimeo, or MP4',
  },

  // Layout & Utility
  {
    key: 'divider',
    name: 'Visual Section Divider',
    category: 'Layout',
    icon: 'Minus',
    description: 'Clean horizontal rule line divider with spacing',
  },
  {
    key: 'button',
    name: 'Action Button',
    category: 'Utility',
    icon: 'Square',
    description: 'Token-styled button CTA',
  },
  {
    key: 'alert',
    name: 'Alert Notification Box',
    category: 'Utility',
    icon: 'AlertTriangle',
    description: 'Contextual notification alert box (info, warning, success, error)',
  },
];

class ComponentManifestService {
  /**
   * Seed default component manifests if database is empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await ComponentManifest.countDocuments();
      if (count === 0) {
        console.info('[ComponentManifestService] Seeding default component manifests...');
        const docs = DEFAULT_MANIFESTS.map((m) => ({ ...m, createdBy: userId }));
        await ComponentManifest.insertMany(docs);
        console.info(`[ComponentManifestService] Seeded ${docs.length} component manifests.`);
      }
    } catch (err) {
      console.error('[ComponentManifestService] Seed error:', err.message);
    }
  }

  /**
   * Get all registered component manifests
   */
  static async getManifests(query = {}) {
    await ComponentManifestService.seedDefaults();
    return ComponentManifest.find(query).sort({ category: 1, name: 1 }).lean();
  }
}

module.exports = ComponentManifestService;

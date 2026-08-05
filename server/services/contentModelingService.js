/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  contentModelingService.js  —  Headless Content Modeling Service
 *  MyJourney CMS  |  Phase 9: Enterprise Content Modeling Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ContentType = require('../models/ContentType');
const ContentEntry = require('../models/ContentEntry');

const DEFAULT_CONTENT_TYPES = [
  {
    key: 'authors',
    name: 'Authors',
    singularName: 'Author',
    icon: 'User',
    description: 'Content creator biographies, avatars, and social links',
    isBuiltIn: true,
    fields: [
      { key: 'name', name: 'Name', type: 'text', label: 'Full Name', required: true, isTitle: true },
      { key: 'bio', name: 'Bio', type: 'textarea', label: 'Biography' },
      { key: 'avatar', name: 'Avatar', type: 'image', label: 'Profile Picture' },
      { key: 'email', name: 'Email', type: 'text', label: 'Contact Email' },
    ],
  },
  {
    key: 'collections',
    name: 'Collections',
    singularName: 'Collection',
    icon: 'Folder',
    description: 'Curated groups of articles, projects, and resources',
    isBuiltIn: true,
    fields: [
      { key: 'title', name: 'Title', type: 'text', label: 'Collection Title', required: true, isTitle: true },
      { key: 'summary', name: 'Summary', type: 'textarea', label: 'Summary' },
      { key: 'coverImage', name: 'Cover Image', type: 'image', label: 'Cover Image' },
    ],
  },
  {
    key: 'series',
    name: 'Article Series',
    singularName: 'Series',
    icon: 'Layers',
    description: 'Sequential multi-part tutorial and article series',
    isBuiltIn: true,
    fields: [
      { key: 'title', name: 'Title', type: 'text', label: 'Series Title', required: true, isTitle: true },
      { key: 'description', name: 'Description', type: 'textarea', label: 'Description' },
    ],
  },
  {
    key: 'topics',
    name: 'Topics',
    singularName: 'Topic',
    icon: 'Tag',
    description: 'Specialized subject matter taxonomies and interest areas',
    isBuiltIn: true,
    fields: [
      { key: 'name', name: 'Name', type: 'text', label: 'Topic Name', required: true, isTitle: true },
    ],
  },
  {
    key: 'books',
    name: 'Book Reviews',
    singularName: 'Book',
    icon: 'Book',
    description: 'Literature, technical books, and reading recommendations',
    isBuiltIn: false,
    fields: [
      { key: 'title', name: 'Title', type: 'text', label: 'Book Title', required: true, isTitle: true },
      { key: 'authorName', name: 'Author', type: 'text', label: 'Book Author' },
      { key: 'rating', name: 'Rating', type: 'number', label: 'Rating (1-5)', defaultValue: 5 },
      { key: 'review', name: 'Review', type: 'rich_text', label: 'Review Notes' },
    ],
  },
];

class ContentModelingService {
  /**
   * Seed default built-in Content Types if database is empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await ContentType.countDocuments();
      if (count === 0) {
        console.info('[ContentModelingService] Seeding default content types...');
        const docs = DEFAULT_CONTENT_TYPES.map((c) => ({ ...c, createdBy: userId }));
        await ContentType.insertMany(docs);
        console.info(`[ContentModelingService] Seeded ${docs.length} content types.`);
      }
    } catch (err) {
      console.error('[ContentModelingService] Seed error:', err.message);
    }
  }

  /**
   * Get dynamic entries for any content type
   */
  static async getEntries(typeKey, query = {}) {
    await ContentModelingService.seedDefaults();
    return ContentEntry.find({ contentTypeKey: typeKey.toLowerCase(), ...query })
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = ContentModelingService;

'use strict';

const mockArticleFind = jest.fn();
const mockArticleFindOne = jest.fn();
const mockPageFind = jest.fn();
const mockPageFindOne = jest.fn();

jest.mock('../models/Article', () => ({
  find: mockArticleFind,
  findOne: mockArticleFindOne,
}));
jest.mock('../models/Page', () => ({
  find: mockPageFind,
  findOne: mockPageFindOne,
}));
jest.mock('../models/Category', () => ({ find: jest.fn() }));

const seoController = require('../controllers/seoController');

const queryWithRows = (rows) => ({
  select: jest.fn(() => ({ lean: jest.fn().mockResolvedValue(rows) })),
});

const oneWithRow = (row) => ({ lean: jest.fn().mockResolvedValue(row) });

const response = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('SEO evidence and public-content filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockArticleFind.mockReturnValue(queryWithRows([]));
    mockPageFind.mockReturnValue(queryWithRows([]));
  });

  it('derives dashboard metrics from published records', async () => {
    mockArticleFind.mockReturnValue(queryWithRows([{
      title: 'A sufficiently descriptive article title for search',
      slug: 'descriptive-article',
      description: 'A'.repeat(130),
      body: '<p>Body</p>',
      coverImage: '/cover.jpg',
      coverImageAlt: '',
      seo: { title: 'A sufficiently descriptive article title for search', description: 'A'.repeat(130), openGraphImage: '/cover.jpg' },
    }]));
    mockPageFind.mockReturnValue(queryWithRows([{
      title: 'Public page',
      slug: 'public-page',
      featuredImage: '',
      seo: { metaTitle: '', metaDescription: '', schemaType: 'WebPage' },
    }]));
    const res = response();

    await seoController.getDashboard({}, res, jest.fn());

    expect(mockArticleFind).toHaveBeenCalledWith({ status: 'published', isDeleted: { $ne: true } });
    expect(mockPageFind).toHaveBeenCalledWith({ status: 'published', visibility: 'public' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        indexedPages: 2,
        missingMetaTitles: 1,
        missingMetaDescriptions: 1,
        missingAltText: 1,
        schemaCoverage: 100,
        evidenceSource: 'published_content_records',
      }),
    }));
    expect(res.json.mock.calls[0][0].data.seoScore).not.toBe(88);
  });

  it('reports absent evidence as not calculated instead of a default score', async () => {
    const res = response();

    await seoController.getDashboard({}, res, jest.fn());

    expect(res.json.mock.calls[0][0].data).toMatchObject({
      seoScore: null,
      indexedPages: 0,
      schemaCoverage: null,
    });
  });

  it('does not expose JSON-LD for draft, private, deleted, or missing content', async () => {
    mockArticleFindOne.mockReturnValue(oneWithRow(null));
    const res = response();

    await seoController.getJsonLd({ params: { entityType: 'article', entityId: 'record-id' } }, res, jest.fn());

    expect(mockArticleFindOne).toHaveBeenCalledWith({
      _id: 'record-id',
      status: 'published',
      isDeleted: { $ne: true },
    });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejects unsupported public JSON-LD entity types', async () => {
    const res = response();

    await seoController.getJsonLd({ params: { entityType: 'user', entityId: 'record-id' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockArticleFindOne).not.toHaveBeenCalled();
    expect(mockPageFindOne).not.toHaveBeenCalled();
  });
});

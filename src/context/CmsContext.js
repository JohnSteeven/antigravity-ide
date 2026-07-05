import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cmsSeed } from "../data/cmsSeed";
import { categoryBlueprints } from "../domain/knowledgeArchitecture";

const CmsContext = createContext(null);
const STORAGE_KEY = "myjourney-cms-data";

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeCategoryArchitecture = (data) => {
  const existingCategories = Array.isArray(data.categories) ? data.categories : [];
  const mergedBlueprints = categoryBlueprints.map((blueprint) => {
    const existing = existingCategories.find(
      (category) => category.slug === blueprint.slug || category.id === blueprint.id
    );

    return {
      ...blueprint,
      ...existing,
      subcategories: existing?.subcategories?.length
        ? existing.subcategories
        : blueprint.subcategories,
      heroImage: existing?.heroImage || blueprint.heroImage,
      longDescription: existing?.longDescription || blueprint.longDescription,
    };
  });
  const customCategories = existingCategories.filter(
    (category) =>
      !categoryBlueprints.some(
        (blueprint) =>
          blueprint.slug === category.slug || blueprint.id === category.id
      )
  );

  return {
    ...data,
    categories: [...mergedBlueprints, ...customCategories],
  };
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const today = () => new Date().toISOString().slice(0, 10);

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const createTag = (name) => ({
  id: `tag-${slugify(name)}`,
  name,
  slug: slugify(name),
  description: "",
  color: "#426c67",
  createdAt: today(),
});

const collectTags = (articles = [], tags = []) => {
  const existingTags = tags.map((tag) => ({
    ...tag,
    slug: tag.slug || slugify(tag.name),
  }));
  const existingSlugs = new Set(existingTags.map((tag) => tag.slug));
  const articleTags = articles
    .flatMap((article) => article.tags || [])
    .filter(Boolean)
    .map((tag) => String(tag).trim())
    .filter(Boolean);

  articleTags.forEach((tag) => {
    const slug = slugify(tag);
    if (!existingSlugs.has(slug)) {
      existingTags.push(createTag(tag));
      existingSlugs.add(slug);
    }
  });

  return existingTags;
};

const normalizeCmsData = (data) => ({
  ...mergeCategoryArchitecture(data),
  tags: collectTags(data.articles, data.tags),
  media: Array.isArray(data.media) ? data.media : [],
});

const loadData = () => {
  if (typeof window === "undefined") {
    return normalizeCmsData(clone(cmsSeed));
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeCmsData(JSON.parse(saved)) : normalizeCmsData(clone(cmsSeed));
  } catch {
    return normalizeCmsData(clone(cmsSeed));
  }
};

export const CmsProvider = ({ children }) => {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const actions = useMemo(
    () => ({
      resetDemoData() {
        setData(normalizeCmsData(clone(cmsSeed)));
      },

      updateSiteSection(section, value) {
        setData((current) => ({
          ...current,
          site: {
            ...current.site,
            [section]:
              value &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              current.site[section] &&
              typeof current.site[section] === "object"
                ? {
                    ...current.site[section],
                    ...value,
                  }
                : value,
          },
        }));
      },

      updateStorySection(section, value) {
        setData((current) => ({
          ...current,
          story: {
            ...current.story,
            [section]: {
              ...current.story[section],
              ...value,
            },
          },
        }));
      },

      saveArticle(article) {
        setData((current) => {
          const id = article.id || createId("article");
          const title = article.title || "Untitled Article";
          const categoryName =
            article.category || current.categories[0]?.name || "Life";
          const categoryModel = current.categories.find(
            (item) => item.name === categoryName
          );
          const articleTags = Array.isArray(article.tags)
            ? article.tags
            : String(article.tags || "")
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
          const savedArticle = {
            id,
            title,
            slug: article.slug || slugify(title),
            description: article.description || "",
            coverImage: article.coverImage || "",
            body: article.body || "<p>Start writing your article here.</p>",
            category: categoryName,
            subcategory: article.subcategory || categoryModel?.subcategories?.[0] || "",
            tags: articleTags,
            author: article.author || "Noble John Steeven",
            publishedAt: article.publishedAt || today(),
            updatedAt: today(),
            readingTime: article.readingTime || "3 min read",
            views: Number(article.views || 0),
            likes: Number(article.likes || 0),
            bookmarks: Number(article.bookmarks || 0),
            rating: Number(article.rating || 4),
            featured: Boolean(article.featured),
            mustRead: Boolean(article.mustRead),
            trending: Boolean(article.trending),
            pinned: Boolean(article.pinned),
            gallery: Array.isArray(article.gallery) ? article.gallery : [],
            videoUrl: article.videoUrl || "",
            audioUrl: article.audioUrl || "",
            pdfAttachment: article.pdfAttachment || "",
            seo: article.seo || {
              title,
              description: article.description || "",
              keywords: [],
              canonicalUrl: "",
              openGraphImage: article.coverImage || "",
              metaRobots: "index,follow",
            },
            scheduledAt: article.scheduledAt || "",
            versionHistory: Array.isArray(article.versionHistory)
              ? article.versionHistory
              : [],
            status: article.status || "draft",
            comments: article.comments || [],
          };

          const exists = current.articles.some((item) => item.id === id);
          const nextArticles = exists
            ? current.articles.map((item) =>
                item.id === id ? savedArticle : item
              )
            : [savedArticle, ...current.articles];

          return {
            ...current,
            articles: nextArticles,
            tags: collectTags(nextArticles, current.tags),
          };
        });
      },

      deleteArticle(articleId) {
        setData((current) => ({
          ...current,
          articles: current.articles.filter((article) => article.id !== articleId),
        }));
      },

      toggleArticleStatus(articleId) {
        setData((current) => ({
          ...current,
          articles: current.articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  status:
                    article.status === "published" ? "draft" : "published",
                  updatedAt: today(),
                }
              : article
          ),
        }));
      },

      incrementArticle(articleId, metric) {
        setData((current) => ({
          ...current,
          articles: current.articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  [metric]: Number(article[metric] || 0) + 1,
                }
              : article
          ),
        }));
      },

      addComment(articleId, comment) {
        setData((current) => ({
          ...current,
          articles: current.articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  comments: [
                    ...(article.comments || []),
                    {
                      id: createId("comment"),
                      name: comment.name || "Reader",
                      text: comment.text,
                      status: "pending",
                      createdAt: today(),
                    },
                  ],
                }
              : article
          ),
        }));
      },

      updateCommentStatus(articleId, commentId, status) {
        setData((current) => ({
          ...current,
          articles: current.articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  comments: article.comments.map((comment) =>
                    comment.id === commentId ? { ...comment, status } : comment
                  ),
                }
              : article
          ),
        }));
      },

      saveCategory(category) {
        setData((current) => {
          const id = category.id || createId("cat");
          const name = category.name || "New Category";
          const savedCategory = {
            id,
            name,
            slug: category.slug || slugify(name),
            description: category.description || "",
            longDescription: category.longDescription || "",
            subcategories: Array.isArray(category.subcategories)
              ? category.subcategories
              : String(category.subcategories || "")
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
            heroImage: category.heroImage || "",
            icon: category.icon || "book",
          };
          const exists = current.categories.some((item) => item.id === id);
          return {
            ...current,
            categories: exists
              ? current.categories.map((item) =>
                  item.id === id ? savedCategory : item
                )
              : [...current.categories, savedCategory],
          };
        });
      },

      deleteCategory(categoryId) {
        setData((current) => ({
          ...current,
          categories: current.categories.filter(
            (category) => category.id !== categoryId
          ),
        }));
      },

      saveTag(tag) {
        setData((current) => {
          const name = String(tag.name || "").trim() || "New Tag";
          const id = tag.id || createId("tag");
          const savedTag = {
            id,
            name,
            slug: tag.slug || slugify(name),
            description: tag.description || "",
            color: tag.color || "#426c67",
            createdAt: tag.createdAt || today(),
          };
          const exists = current.tags.some((item) => item.id === id);

          return {
            ...current,
            tags: exists
              ? current.tags.map((item) => (item.id === id ? savedTag : item))
              : [...current.tags, savedTag],
          };
        });
      },

      deleteTag(tagId) {
        setData((current) => {
          const tag = current.tags.find((item) => item.id === tagId);

          return {
            ...current,
            tags: current.tags.filter((item) => item.id !== tagId),
            articles: tag
              ? current.articles.map((article) => ({
                  ...article,
                  tags: (article.tags || []).filter(
                    (item) => slugify(item) !== tag.slug
                  ),
                }))
              : current.articles,
          };
        });
      },

      saveMedia(media) {
        setData((current) => {
          const id = media.id || createId("media");
          const savedMedia = {
            id,
            name: media.name || media.fileName || "Untitled media",
            fileName: media.fileName || media.name || "media-file",
            type: media.type || "image",
            url: media.url || "",
            folder: media.folder || "Uploads",
            alt: media.alt || "",
            size: media.size || "",
            uploadedAt: media.uploadedAt || today(),
            provider: media.provider || "local",
            usedIn: Array.isArray(media.usedIn) ? media.usedIn : [],
          };
          const exists = current.media.some((item) => item.id === id);

          return {
            ...current,
            media: exists
              ? current.media.map((item) => (item.id === id ? savedMedia : item))
              : [savedMedia, ...current.media],
          };
        });
      },

      bulkAddMedia(mediaItems) {
        setData((current) => ({
          ...current,
          media: [
            ...mediaItems.map((media) => ({
              id: media.id || createId("media"),
              name: media.name || media.fileName || "Untitled media",
              fileName: media.fileName || media.name || "media-file",
              type: media.type || "image",
              url: media.url || "",
              folder: media.folder || "Uploads",
              alt: media.alt || "",
              size: media.size || "",
              uploadedAt: media.uploadedAt || today(),
              provider: media.provider || "local",
              usedIn: Array.isArray(media.usedIn) ? media.usedIn : [],
            })),
            ...current.media,
          ],
        }));
      },

      replaceMedia(mediaId, mediaPatch) {
        setData((current) => ({
          ...current,
          media: current.media.map((media) =>
            media.id === mediaId
              ? {
                  ...media,
                  ...mediaPatch,
                  uploadedAt: today(),
                }
              : media
          ),
        }));
      },

      deleteMedia(mediaId) {
        setData((current) => ({
          ...current,
          media: current.media.filter((media) => media.id !== mediaId),
        }));
      },

      saveProject(project) {
        setData((current) => {
          const id = project.id || createId("project");
          const savedProject = {
            id,
            title: project.title || "New Project",
            category: project.category || "General",
            description: project.description || "",
            image: project.image || "",
            status: project.status || "Draft",
          };
          const exists = current.projects.some((item) => item.id === id);
          return {
            ...current,
            projects: exists
              ? current.projects.map((item) =>
                  item.id === id ? savedProject : item
                )
              : [...current.projects, savedProject],
          };
        });
      },

      deleteProject(projectId) {
        setData((current) => ({
          ...current,
          projects: current.projects.filter((project) => project.id !== projectId),
        }));
      },

      saveSkill(skill) {
        setData((current) => {
          const id = skill.id || createId("skill");
          const savedSkill = {
            id,
            name: skill.name || "New Skill",
            level: Number(skill.level || 50),
          };
          const exists = current.skills.some((item) => item.id === id);
          return {
            ...current,
            skills: exists
              ? current.skills.map((item) => (item.id === id ? savedSkill : item))
              : [...current.skills, savedSkill],
          };
        });
      },

      deleteSkill(skillId) {
        setData((current) => ({
          ...current,
          skills: current.skills.filter((skill) => skill.id !== skillId),
        }));
      },

      saveTimelineItem(item) {
        setData((current) => {
          const id = item.id || createId("timeline");
          const savedItem = {
            id,
            year: item.year || today().slice(0, 4),
            title: item.title || "New Timeline Moment",
            description: item.description || "",
          };
          const exists = current.timeline.some((entry) => entry.id === id);
          return {
            ...current,
            timeline: exists
              ? current.timeline.map((entry) =>
                  entry.id === id ? savedItem : entry
                )
              : [...current.timeline, savedItem],
          };
        });
      },

      deleteTimelineItem(itemId) {
        setData((current) => ({
          ...current,
          timeline: current.timeline.filter((item) => item.id !== itemId),
        }));
      },

      addSubscriber(email) {
        setData((current) => {
          const normalized = email.trim().toLowerCase();
          const exists = current.subscribers.some(
            (subscriber) => subscriber.email.toLowerCase() === normalized
          );

          if (!normalized || exists) {
            return current;
          }

          return {
            ...current,
            subscribers: [
              ...current.subscribers,
              {
                id: createId("sub"),
                email: normalized,
                joinedAt: today(),
              },
            ],
          };
        });
      },
    }),
    []
  );

  const analytics = useMemo(() => {
    const publishedArticles = data.articles.filter(
      (article) => article.status === "published"
    );
    const comments = data.articles.flatMap((article) =>
      (article.comments || []).map((comment) => ({
        ...comment,
        articleId: article.id,
        articleTitle: article.title,
      }))
    );

    return {
      articleCount: data.articles.length,
      publishedCount: publishedArticles.length,
      draftCount: data.articles.length - publishedArticles.length,
      views: data.articles.reduce((sum, article) => sum + Number(article.views), 0),
      likes: data.articles.reduce((sum, article) => sum + Number(article.likes), 0),
      subscribers: data.subscribers.length,
      comments,
      pendingComments: comments.filter((comment) => comment.status === "pending")
        .length,
      tagCount: data.tags?.length || 0,
      mediaCount: data.media?.length || 0,
    };
  }, [data]);

  const value = useMemo(
    () => ({
      data,
      analytics,
      ...actions,
    }),
    [actions, analytics, data]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
};

export const useCms = () => {
  const context = useContext(CmsContext);

  if (!context) {
    throw new Error("useCms must be used inside CmsProvider");
  }

  return context;
};

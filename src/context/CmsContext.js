import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cmsSeed } from "../data/cmsSeed";
import { categoryBlueprints } from "../domain/knowledgeArchitecture";
import { articleApi, statsApi, categoryApi, subCategoryApi, tagApi, mediaApi, commentApi, userApi, roleApi, permissionApi } from "../services/apiService";

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
  comments: Array.isArray(data.comments) ? data.comments : [],
  roles: Array.isArray(data.roles) ? data.roles : [],
  users: Array.isArray(data.users) ? data.users : [],
  logs: Array.isArray(data.logs) ? data.logs : [],
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
  const [liveStats, setLiveStats] = useState(null);

  // Auto-sync state with localStorage in development fallback mode
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Fetch live articles and aggregated statistics on mount
  const fetchLiveCmsData = async () => {
    try {
      const [articlesData, statsData, categoriesData, subcategoriesData, tagsData, mediaData, commentsData, rolesData] = await Promise.all([
        articleApi.adminList().catch(() => articleApi.list()),
        statsApi.get(),
        categoryApi.list({ includeDeleted: true }).catch(() => ({ categories: [] })),
        subCategoryApi.list({ includeDeleted: true }).catch(() => ({ subCategories: [] })),
        tagApi.list({ includeDeleted: true }).catch(() => ({ tags: [] })),
        mediaApi.list({ includeDeleted: true }).catch(() => ({ files: [] })),
        commentApi.list({ includeDeleted: true }).catch(() => ({ comments: [] })),
        roleApi.list({ includeDeleted: true }).catch(() => ({ roles: [] })),
      ]);

      setData((current) => {
        const normalizedArticles = (articlesData && Array.isArray(articlesData.articles))
          ? articlesData.articles.map((a) => ({ ...a, id: a._id }))
          : current.articles;

        const normalizedCategories = (categoriesData && Array.isArray(categoriesData.categories))
          ? categoriesData.categories.map((c) => ({ ...c, id: c._id }))
          : current.categories;

        const normalizedSubcategories = (subcategoriesData && Array.isArray(subcategoriesData.subCategories))
          ? subcategoriesData.subCategories.map((s) => ({ ...s, id: s._id }))
          : current.subcategories || [];

        const normalizedTags = (tagsData && Array.isArray(tagsData.tags))
          ? tagsData.tags.map((t) => ({ ...t, id: t._id }))
          : current.tags;

        const normalizedMedia = (mediaData && Array.isArray(mediaData.files))
          ? mediaData.files.map((m) => ({ ...m, id: m._id }))
          : current.media || [];

        const normalizedComments = (commentsData && Array.isArray(commentsData.comments))
          ? commentsData.comments.map((c) => ({ ...c, id: c._id }))
          : current.comments || [];

        const normalizedRoles = (rolesData && Array.isArray(rolesData.roles))
          ? rolesData.roles.map((r) => ({ ...r, id: r._id }))
          : current.roles || [];

        return {
          ...current,
          articles: normalizedArticles,
          categories: normalizedCategories,
          subcategories: normalizedSubcategories,
          tags: normalizedTags,
          media: normalizedMedia,
          comments: normalizedComments,
          roles: normalizedRoles,
        };
      });

      if (statsData) {
        setLiveStats(statsData.stats || statsData);
      }
    } catch (err) {
      console.warn("REST API fetching failed, falling back to local storage.", err);
    }
  };

  useEffect(() => {
    fetchLiveCmsData();
  }, []);

  const actions = useMemo(
    () => ({
      async refreshData() {
        await fetchLiveCmsData();
      },

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

      async saveArticle(article) {
        try {
          const payload = {
            title: article.title,
            slug: article.slug || slugify(article.title),
            description: article.description,
            coverImage: article.coverImage,
            body: article.body,
            category: article.category,
            subcategory: article.subcategory,
            tags: article.tags,
            status: article.status,
            featured: article.featured,
            mustRead: article.mustRead,
            trending: article.trending,
            pinned: article.pinned,
            scheduledAt: article.scheduledAt,
          };

          let saved;
          const targetId = article.id || article._id;
          
          if (targetId && !String(targetId).startsWith("article-")) {
            const res = await articleApi.update(targetId, payload);
            saved = res.article;
          } else {
            const res = await articleApi.create(payload);
            saved = res.article;
          }

          setData((current) => {
            const list = current.articles.filter((a) => a.id !== targetId && a._id !== targetId);
            const normalized = { ...saved, id: saved._id };
            return {
              ...current,
              articles: [normalized, ...list],
            };
          });

          // Refresh stats
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);

          return saved;
        } catch (err) {
          console.error("Failed to save article:", err);
          throw err;
        }
      },

      async deleteArticle(articleId) {
        try {
          await articleApi.delete(articleId);
          setData((current) => ({
            ...current,
            articles: current.articles.filter((a) => a.id !== articleId && a._id !== articleId),
          }));
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
        } catch (err) {
          console.error("Failed to delete article:", err);
          throw err;
        }
      },

      async restoreArticle(articleId) {
        try {
          const res = await articleApi.restore(articleId);
          const updated = res.article;
          setData((current) => {
            const list = current.articles.filter((a) => a.id !== articleId && a._id !== articleId);
            const normalized = { ...updated, id: updated._id };
            return {
              ...current,
              articles: [normalized, ...list],
            };
          });
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return updated;
        } catch (err) {
          console.error("Failed to restore article:", err);
          throw err;
        }
      },

      async toggleArticleStatus(articleId) {
        try {
          const article = data.articles.find((a) => a.id === articleId || a._id === articleId);
          if (!article) return;
          const nextStatus = article.status === "published" ? "draft" : "published";
          const res = await articleApi.setStatus(articleId, nextStatus);
          const updated = res.article;
          setData((current) => ({
            ...current,
            articles: current.articles.map((a) =>
              (a.id === articleId || a._id === articleId) ? { ...updated, id: updated._id } : a
            ),
          }));
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
        } catch (err) {
          console.error("Failed to toggle status:", err);
          throw err;
        }
      },

      async duplicateArticle(articleId) {
        try {
          const source = data.articles.find((a) => a.id === articleId || a._id === articleId);
          if (!source) throw new Error("Article not found for duplication");
          const payload = {
            title: `${source.title} (Copy)`,
            slug: `${source.slug || slugify(source.title)}-copy`,
            description: source.description,
            coverImage: source.coverImage,
            body: source.body,
            category: source.category,
            subcategory: source.subcategory,
            tags: source.tags,
            status: "draft",
            featured: false,
            mustRead: false,
            trending: false,
            pinned: false,
          };
          const res = await articleApi.create(payload);
          const saved = res.article;
          const normalized = { ...saved, id: saved._id };
          setData((current) => ({
            ...current,
            articles: [normalized, ...current.articles],
          }));
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return saved;
        } catch (err) {
          console.error("Failed to duplicate article:", err);
          throw err;
        }
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

      async addComment(articleId, comment) {
        try {
          const token = document.cookie.split("; ").find(row => row.startsWith("csrfToken="))?.split("=")[1];
          const res = await fetch(`/api/articles/${articleId}/comments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-csrf-token": token ? decodeURIComponent(token) : ""
            },
            body: JSON.stringify({ body: comment.text }),
          });
          const data = await res.json();
          await actions.refreshData();
          return data.comment;
        } catch (err) {
          console.error("Failed to add comment:", err);
        }
      },

      async updateCommentStatus(articleId, commentId, status) {
        try {
          await commentApi.moderate(commentId, status);
          setData((current) => {
            const nextComments = (current.comments || []).map((c) =>
              c.id === commentId || c._id === commentId ? { ...c, status } : c
            );
            return { ...current, comments: nextComments };
          });
          await actions.refreshData();
        } catch (err) {
          console.error("Failed to moderate comment:", err);
        }
      },

      async moderateComment(commentId, status, updates = {}) {
        try {
          const res = await commentApi.moderate(commentId, status, updates);
          setData((current) => {
            const nextComments = (current.comments || []).map((c) =>
              c.id === commentId || c._id === commentId ? { ...c, status, ...updates, ...res.comment } : c
            );
            return { ...current, comments: nextComments };
          });
          return res.comment;
        } catch (err) {
          console.error("Failed to moderate comment:", err);
          throw err;
        }
      },

      async deleteComment(commentId) {
        try {
          await commentApi.delete(commentId);
          setData((current) => ({
            ...current,
            comments: (current.comments || []).filter((c) => c.id !== commentId && c._id !== commentId),
          }));
        } catch (err) {
          console.error("Failed to delete comment:", err);
          throw err;
        }
      },

      async restoreComment(commentId) {
        try {
          const res = await commentApi.restore(commentId);
          setData((current) => ({
            ...current,
            comments: (current.comments || []).map((c) =>
              c.id === commentId || c._id === commentId ? { ...c, isDeleted: false, deletedAt: null } : c
            ),
          }));
          return res.comment;
        } catch (err) {
          console.error("Failed to restore comment:", err);
          throw err;
        }
      },

      async uploadMedia(file, folder) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);
          const res = await mediaApi.upload(formData);
          await actions.refreshData();
          return res.media;
        } catch (err) {
          console.error("Failed to upload media:", err);
          throw err;
        }
      },

      async saveMedia(media) {
        try {
          const res = await mediaApi.create(media);
          await actions.refreshData();
          return res.media;
        } catch (err) {
          console.error("Failed to save media:", err);
        }
      },

      async renameMedia(id, newName) {
        try {
          const res = await mediaApi.rename(id, newName);
          setData((current) => ({
            ...current,
            media: current.media.map((m) =>
              m.id === id || m._id === id ? { ...m, name: newName } : m
            ),
          }));
          return res.media;
        } catch (err) {
          console.error("Failed to rename media:", err);
          throw err;
        }
      },

      async moveMedia(id, folder) {
        try {
          const res = await mediaApi.move(id, folder);
          setData((current) => ({
            ...current,
            media: current.media.map((m) =>
              m.id === id || m._id === id ? { ...m, folder, url: res.media.url } : m
            ),
          }));
          return res.media;
        } catch (err) {
          console.error("Failed to move media:", err);
          throw err;
        }
      },

      async deleteMedia(id) {
        try {
          await mediaApi.delete(id);
          setData((current) => ({
            ...current,
            media: current.media.filter((m) => m.id !== id && m._id !== id),
          }));
        } catch (err) {
          console.error("Failed to delete media:", err);
          throw err;
        }
      },

      async restoreMedia(id) {
        try {
          const res = await mediaApi.restore(id);
          setData((current) => ({
            ...current,
            media: current.media.map((m) =>
              m.id === id || m._id === id ? { ...m, isDeleted: false, deletedAt: null } : m
            ),
          }));
          return res.media;
        } catch (err) {
          console.error("Failed to restore media:", err);
          throw err;
        }
      },

      async saveCategory(category) {
        try {
          const isEdit = !!(category.id || category._id);
          const payload = {
            name: category.name,
            slug: category.slug || slugify(category.name),
            description: category.description || "",
            longDescription: category.longDescription || "",
            icon: category.icon || "book",
            heroImage: category.heroImage || "",
            isActive: category.isActive !== undefined ? category.isActive : true,
          };
          
          let saved;
          if (isEdit) {
            const res = await categoryApi.update(category.id || category._id, payload);
            saved = res.category;
          } else {
            const res = await categoryApi.create(payload);
            saved = res.category;
          }
          
          const normalized = { ...saved, id: saved._id };
          setData((current) => {
            const list = current.categories.filter((c) => c.id !== normalized.id);
            return {
              ...current,
              categories: [...list, normalized],
            };
          });

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);

          return normalized;
        } catch (err) {
          console.error("Failed to save category:", err);
          throw err;
        }
      },

      async updateCategory(category) {
        try {
          const payload = {
            name: category.name,
            slug: category.slug || slugify(category.name),
            description: category.description || "",
            longDescription: category.longDescription || "",
            icon: category.icon || "book",
            heroImage: category.heroImage || "",
            isActive: category.isActive !== undefined ? category.isActive : true,
          };
          const id = category.id || category._id;
          const res = await categoryApi.update(id, payload);
          const saved = res.category;
          const normalized = { ...saved, id: saved._id };
          setData((current) => {
            const list = current.categories.filter((c) => c.id !== normalized.id);
            return {
              ...current,
              categories: [...list, normalized],
            };
          });
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return normalized;
        } catch (err) {
          console.error("Failed to update category:", err);
          throw err;
        }
      },

      async deleteCategory(categoryId) {
        try {
          await categoryApi.delete(categoryId);
          setData((current) => ({
            ...current,
            categories: current.categories.filter((c) => c.id !== categoryId && c._id !== categoryId),
          }));
          
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
        } catch (err) {
          console.error("Failed to delete category:", err);
          throw err;
        }
      },

      async restoreCategory(categoryId) {
        try {
          const res = await categoryApi.restore(categoryId);
          const restored = res.category;
          const normalized = { ...restored, id: restored._id };
          setData((current) => {
            const list = current.categories.filter((c) => c.id !== normalized.id);
            return {
              ...current,
              categories: [...list, normalized],
            };
          });

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return normalized;
        } catch (err) {
          console.error("Failed to restore category:", err);
          throw err;
        }
      },

      async saveSubCategory(subCategory) {
        try {
          const isEdit = !!(subCategory.id || subCategory._id);
          const payload = {
            name: subCategory.name,
            slug: subCategory.slug || slugify(subCategory.name),
            description: subCategory.description || "",
            category: subCategory.category,
          };

          let saved;
          if (isEdit) {
            const res = await subCategoryApi.update(subCategory.id || subCategory._id, payload);
            saved = res.subCategory;
          } else {
            const res = await subCategoryApi.create(payload);
            saved = res.subCategory;
          }

          const normalized = { ...saved, id: saved._id };
          setData((current) => {
            const list = (current.subcategories || []).filter((s) => s.id !== normalized.id);
            return {
              ...current,
              subcategories: [...list, normalized],
            };
          });

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);

          return normalized;
        } catch (err) {
          console.error("Failed to save subcategory:", err);
          throw err;
        }
      },

      async updateSubCategory(subCategory) {
        try {
          const payload = {
            name: subCategory.name,
            slug: subCategory.slug || slugify(subCategory.name),
            description: subCategory.description || "",
            category: subCategory.category,
          };
          const id = subCategory.id || subCategory._id;
          const res = await subCategoryApi.update(id, payload);
          const saved = res.subCategory;
          const normalized = { ...saved, id: saved._id };
          setData((current) => {
            const list = (current.subcategories || []).filter((s) => s.id !== normalized.id);
            return {
              ...current,
              subcategories: [...list, normalized],
            };
          });
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return normalized;
        } catch (err) {
          console.error("Failed to update subcategory:", err);
          throw err;
        }
      },

      async deleteSubCategory(subCategoryId) {
        try {
          await subCategoryApi.delete(subCategoryId);
          setData((current) => ({
            ...current,
            subcategories: (current.subcategories || []).filter((s) => s.id !== subCategoryId && s._id !== subCategoryId),
          }));

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
        } catch (err) {
          console.error("Failed to delete subcategory:", err);
          throw err;
        }
      },

      async restoreSubCategory(subCategoryId) {
        try {
          const res = await subCategoryApi.restore(subCategoryId);
          const restored = res.subCategory;
          const normalized = { ...restored, id: restored._id };
          setData((current) => {
            const list = (current.subcategories || []).filter((s) => s.id !== normalized.id);
            return {
              ...current,
              subcategories: [...list, normalized],
            };
          });

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return normalized;
        } catch (err) {
          console.error("Failed to restore subcategory:", err);
          throw err;
        }
      },

      async saveTag(tag) {
        try {
          const isEdit = !!(tag.id || tag._id);
          const payload = {
            name: tag.name,
            slug: tag.slug || slugify(tag.name),
            description: tag.description || "",
            color: tag.color || "#426c67",
          };

          let saved;
          if (isEdit) {
            const res = await tagApi.update(tag.id || tag._id, payload);
            saved = res.tag;
          } else {
            const res = await tagApi.create(payload);
            saved = res.tag;
          }

          const normalized = { ...saved, id: saved._id };
          setData((current) => {
            const list = current.tags.filter((t) => t.id !== normalized.id);
            return {
              ...current,
              tags: [...list, normalized],
            };
          });

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);

          return normalized;
        } catch (err) {
          console.error("Failed to save tag:", err);
          throw err;
        }
      },

      async updateTag(tag) {
        try {
          const payload = {
            name: tag.name,
            slug: tag.slug || slugify(tag.name),
            description: tag.description || "",
            color: tag.color || "#426c67",
          };
          const id = tag.id || tag._id;
          const res = await tagApi.update(id, payload);
          const saved = res.tag;
          const normalized = { ...saved, id: saved._id };
          setData((current) => {
            const list = current.tags.filter((t) => t.id !== normalized.id);
            return {
              ...current,
              tags: [...list, normalized],
            };
          });
          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return normalized;
        } catch (err) {
          console.error("Failed to update tag:", err);
          throw err;
        }
      },

      async deleteTag(tagId) {
        try {
          await tagApi.delete(tagId);
          setData((current) => ({
            ...current,
            tags: current.tags.filter((t) => t.id !== tagId && t._id !== tagId),
          }));

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
        } catch (err) {
          console.error("Failed to delete tag:", err);
          throw err;
        }
      },

      async restoreTag(tagId) {
        try {
          const res = await tagApi.restore(tagId);
          const restored = res.tag;
          const normalized = { ...restored, id: restored._id };
          setData((current) => {
            const list = current.tags.filter((t) => t.id !== normalized.id);
            return {
              ...current,
              tags: [...list, normalized],
            };
          });

          const nextStats = await statsApi.get().catch(() => null);
          if (nextStats) setLiveStats(nextStats);
          return normalized;
        } catch (err) {
          console.error("Failed to restore tag:", err);
          throw err;
        }
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

      async fetchUsers(params = {}) {
        try {
          const res = await userApi.list(params);
          setData((current) => ({
            ...current,
            users: (res.users || []).map((u) => ({ ...u, id: u._id })),
          }));
          return res;
        } catch (err) {
          console.error("Failed to fetch users:", err);
          throw err;
        }
      },

      async fetchUserById(id) {
        try {
          return await userApi.get(id);
        } catch (err) {
          console.error("Failed to fetch user by id:", err);
          throw err;
        }
      },

      async updateUser(id, payload) {
        try {
          const res = await userApi.update(id, payload);
          setData((current) => ({
            ...current,
            users: (current.users || []).map((u) =>
              u.id === id || u._id === id ? { ...u, ...res.user, id: res.user._id } : u
            ),
          }));
          return res.user;
        } catch (err) {
          console.error("Failed to update user:", err);
          throw err;
        }
      },

      async suspendUser(id) {
        try {
          const res = await userApi.suspend(id);
          setData((current) => ({
            ...current,
            users: (current.users || []).map((u) =>
              u.id === id || u._id === id ? { ...u, status: res.user.status } : u
            ),
          }));
          return res.user;
        } catch (err) {
          console.error("Failed to suspend user:", err);
          throw err;
        }
      },

      async deleteUser(id) {
        try {
          await userApi.delete(id);
          setData((current) => ({
            ...current,
            users: (current.users || []).filter((u) => u.id !== id && u._id !== id),
          }));
        } catch (err) {
          console.error("Failed to delete user:", err);
          throw err;
        }
      },

      async restoreUser(id) {
        try {
          const res = await userApi.restore(id);
          const usersRes = await userApi.list({});
          setData((current) => ({
            ...current,
            users: (usersRes.users || []).map((u) => ({ ...u, id: u._id })),
          }));
          return res.user;
        } catch (err) {
          console.error("Failed to restore user:", err);
          throw err;
        }
      },

      async forceLogoutUser(id) {
        try {
          const res = await userApi.forceLogout(id);
          return res.user;
        } catch (err) {
          console.error("Failed to force logout user:", err);
          throw err;
        }
      },

      async resetUserPassword(id, password) {
        try {
          return await userApi.resetPassword(id, password);
        } catch (err) {
          console.error("Failed to reset password:", err);
          throw err;
        }
      },

      async updateProfile(payload) {
        try {
          const res = await userApi.updateProfile(payload);
          return res.user;
        } catch (err) {
          console.error("Failed to update personal profile:", err);
          throw err;
        }
      },

      async getMe() {
        try {
          const res = await userApi.getMe();
          return res.user;
        } catch (err) {
          console.error("Failed to fetch current user profile:", err);
          throw err;
        }
      },

      async fetchRoles(params = {}) {
        try {
          const res = await roleApi.list(params);
          setData((current) => ({
            ...current,
            roles: (res.roles || []).map((r) => ({ ...r, id: r._id })),
          }));
          return res.roles;
        } catch (err) {
          console.error("Failed to fetch roles:", err);
          throw err;
        }
      },

      async createRole(payload) {
        try {
          const res = await roleApi.create(payload);
          setData((current) => ({
            ...current,
            roles: [...(current.roles || []), { ...res.role, id: res.role._id }],
          }));
          return res.role;
        } catch (err) {
          console.error("Failed to create role:", err);
          throw err;
        }
      },

      async updateRole(id, payload) {
        try {
          const res = await roleApi.update(id, payload);
          setData((current) => ({
            ...current,
            roles: (current.roles || []).map((r) =>
              r.id === id || r._id === id ? { ...r, ...res.role, id: res.role._id } : r
            ),
          }));
          return res.role;
        } catch (err) {
          console.error("Failed to update role:", err);
          throw err;
        }
      },

      async deleteRole(id) {
        try {
          await roleApi.delete(id);
          setData((current) => ({
            ...current,
            roles: (current.roles || []).filter((r) => r.id !== id && r._id !== id),
          }));
        } catch (err) {
          console.error("Failed to delete role:", err);
          throw err;
        }
      },

      async cloneRole(id, name) {
        try {
          const res = await roleApi.clone(id, name);
          setData((current) => ({
            ...current,
            roles: [...(current.roles || []), { ...res.role, id: res.role._id }],
          }));
          return res.role;
        } catch (err) {
          console.error("Failed to clone role:", err);
          throw err;
        }
      },

      async fetchPermissions() {
        try {
          const res = await permissionApi.list();
          return res.permissions;
        } catch (err) {
          console.error("Failed to fetch permissions:", err);
          throw err;
        }
      },

      async updateRolePermissions(roleId, permissions) {
        try {
          const res = await permissionApi.update(roleId, permissions);
          setData((current) => ({
            ...current,
            roles: (current.roles || []).map((r) =>
              r.id === roleId || r._id === roleId ? { ...r, permissions: res.role.permissions } : r
            ),
          }));
          return res.role;
        } catch (err) {
          console.error("Failed to update role permissions:", err);
          throw err;
        }
      },

      async fetchLogs(params = {}) {
        try {
          const res = await activityLogApi.list(params);
          setData((current) => ({
            ...current,
            logs: (res.logs || []).map((l) => ({ ...l, id: l._id })),
          }));
          return res;
        } catch (err) {
          console.error("Failed to fetch logs:", err);
          throw err;
        }
      },
    }),
    [data]
  );

  const analytics = useMemo(() => {
    const publishedArticles = data.articles.filter(
      (article) => article.status === "published"
    );
    const draftArticles = data.articles.filter(
      (article) => article.status === "draft"
    );
    const scheduledArticles = data.articles.filter(
      (article) => article.status === "scheduled"
    );
    const archivedArticles = data.articles.filter(
      (article) => article.status === "archived"
    );
    const comments = (data.comments || []).map((c) => ({
      ...c,
      id: c._id || c.id,
      articleTitle: c.articleId?.title || "Unknown Article",
      articleId: c.articleId?._id || c.articleId?.id || c.articleId,
      text: c.body,
      name: c.authorName || "Reader",
    }));

    const calculated = {
      articleCount: data.articles.length,
      publishedCount: publishedArticles.length,
      draftCount: draftArticles.length,
      scheduledCount: scheduledArticles.length,
      archivedCount: archivedArticles.length,
      views: data.articles.reduce((sum, article) => sum + Number(article.views || 0), 0),
      likes: data.articles.reduce((sum, article) => sum + Number(article.likes || 0), 0),
      bookmarks: data.articles.reduce((sum, article) => sum + Number(article.bookmarks || 0), 0),
      subscribers: (data.subscribers || []).length,
      comments,
      pendingComments: comments.filter((comment) => comment.status === "pending").length,
      tagCount: data.tags?.length || 0,
      categoryCount: data.categories?.length || 0,
      mediaCount: data.media?.length || 0,
    };

    if (liveStats) {
      return {
        ...calculated,
        ...liveStats,
        comments: liveStats.comments || calculated.comments,
      };
    }

    return calculated;
  }, [data, liveStats]);

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

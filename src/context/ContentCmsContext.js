import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { cmsSeed } from "../data/cmsSeed";
import { articleApi, categoryApi, subCategoryApi, tagApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const ContentCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-content-data";
const CACHE_VERSION = "v6"; // Bump to bust stale browser cache

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const withClientId = (item) => {
  if (!item || typeof item !== "object") return item;
  const isFeat = Boolean(item.isFeatured !== undefined ? item.isFeatured : item.featured);
  const isMust = Boolean(item.isMustRead !== undefined ? item.isMustRead : item.mustRead);
  const isTrend = Boolean(item.isTrending !== undefined ? item.isTrending : item.trending);
  const isPin = Boolean(item.isPinned !== undefined ? item.isPinned : item.pinned);

  return {
    ...item,
    id: item._id || item.id,
    isFeatured: isFeat,
    featured: isFeat,
    isMustRead: isMust,
    mustRead: isMust,
    isTrending: isTrend,
    trending: isTrend,
    isPinned: isPin,
    pinned: isPin,
  };
};

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const today = () => new Date().toISOString().slice(0, 10);

export const ContentCmsProvider = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState("loading");
  // Pre-populate with cmsSeed so the homepage is never blank on first render
  const [articles, setArticles] = useState(cmsSeed.articles || []);
  const [categories, setCategories] = useState(cmsSeed.categories || []);
  const [subcategories, setSubcategories] = useState(cmsSeed.subcategories || []);
  const [tags, setTags] = useState(cmsSeed.tags || []);

  // Portfolio & site settings slices
  const [site, setSite] = useState(cmsSeed.site);
  const [story, setStory] = useState(cmsSeed.story);
  const [timeline, setTimeline] = useState(cmsSeed.timeline);
  const [projects, setProjects] = useState(cmsSeed.projects);
  const [skills, setSkills] = useState(cmsSeed.skills);
  const [stats, setStats] = useState(cmsSeed.stats || []);

  // Restore from localStorage only if cache version matches
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Discard stale cache — fetchContentData will populate fresh
        if (parsed.__version !== CACHE_VERSION) {
          window.localStorage.removeItem(STORAGE_KEY);
        } else {
          if (parsed.articles?.length) setArticles(parsed.articles);
          if (parsed.categories?.length) setCategories(parsed.categories);
          if (parsed.subcategories?.length) setSubcategories(parsed.subcategories);
          if (parsed.tags?.length) setTags(parsed.tags);
          if (parsed.site) setSite(parsed.site);
          if (parsed.story) setStory(parsed.story);
          if (parsed.timeline) setTimeline(parsed.timeline);
          if (parsed.projects) setProjects(parsed.projects);
          if (parsed.skills) setSkills(parsed.skills);
          if (parsed.stats) setStats(parsed.stats);
        }
      }
    } catch (err) {
      console.warn("Failed to load local content cache", err);
    }
  }, []);

  // Debounced write to localStorage (with version stamp)
  useEffect(() => {
    const timer = setTimeout(() => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ __version: CACHE_VERSION, articles, categories, subcategories, tags, site, story, timeline, projects, skills, stats })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [articles, categories, subcategories, tags, site, story, timeline, projects, skills, stats]);

  const fetchContentData = async (isAdminOrEditor = false) => {
    setSyncStatus("loading");
    try {
      let articlesRes, categoriesRes, subcategoriesRes, tagsRes;
      if (isAdminOrEditor) {
        [articlesRes, categoriesRes, subcategoriesRes, tagsRes] = await Promise.all([
          articleApi.adminList({ limit: 1000 }).catch(() => articleApi.list({ limit: 1000 })),
          categoryApi.list({ includeDeleted: true }).catch(() => ({ categories: [] })),
          subCategoryApi.list({ includeDeleted: true }).catch(() => ({ subCategories: [] })),
          tagApi.list({ includeDeleted: true }).catch(() => ({ tags: [] })),
        ]);
      } else {
        [articlesRes, categoriesRes, subcategoriesRes, tagsRes] = await Promise.all([
          articleApi.list({ limit: 1000 }).catch(() => ({ articles: [] })),
          categoryApi.list({ includeDeleted: false }).catch(() => ({ categories: [] })),
          subCategoryApi.list({ includeDeleted: false }).catch(() => ({ subCategories: [] })),
          tagApi.list({ includeDeleted: false }).catch(() => ({ tags: [] })),
        ]);
      }

      if (articlesRes && Array.isArray(articlesRes.articles) && articlesRes.articles.length > 0) {
        setArticles(articlesRes.articles.map(withClientId));
      }
      if (categoriesRes && Array.isArray(categoriesRes.categories) && categoriesRes.categories.length > 0) {
        setCategories(categoriesRes.categories.map(withClientId));
      }
      if (subcategoriesRes && Array.isArray(subcategoriesRes.subCategories) && subcategoriesRes.subCategories.length > 0) {
        setSubcategories(subcategoriesRes.subCategories.map(withClientId));
      }
      if (tagsRes && Array.isArray(tagsRes.tags) && tagsRes.tags.length > 0) {
        setTags(tagsRes.tags.map(withClientId));
      }
      setSyncStatus("live");
    } catch (err) {
      console.warn("Failed to fetch live content, using stale fallback", err);
      setSyncStatus("stale-fallback");
    }
  };

  const { isAuthenticated, user } = useAuth();
  const isAdminOrEditor = isAuthenticated && (user?.role === "Admin" || user?.role === "Editor");

  useEffect(() => {
    fetchContentData(isAdminOrEditor);
  }, [isAdminOrEditor]);

  const actions = useMemo(() => ({
    async refreshContent() {
      await fetchContentData(isAdminOrEditor);
    },
    updateSiteSection(section, value) {
      setSite((current) => ({
        ...current,
        [section]:
          value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            current[section] &&
            typeof current[section] === "object"
            ? { ...current[section], ...value }
            : value,
      }));
    },
    updateStorySection(section, value) {
      setStory((current) => ({
        ...current,
        [section]: {
          ...current[section],
          ...value,
        },
      }));
    },
    saveProject(project) {
      const id = project.id || createId("project");
      const savedProject = {
        id,
        title: project.title || "New Project",
        category: project.category || "General",
        description: project.description || "",
        image: project.image || "",
        status: project.status || "Draft",
      };
      setProjects((prev) => {
        const exists = prev.some((item) => item.id === id);
        return exists ? prev.map((item) => (item.id === id ? savedProject : item)) : [...prev, savedProject];
      });
    },
    deleteProject(projectId) {
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
    },
    saveSkill(skill) {
      const id = skill.id || createId("skill");
      const savedSkill = {
        id,
        name: skill.name || "New Skill",
        level: Number(skill.level || 50),
      };
      setSkills((prev) => {
        const exists = prev.some((item) => item.id === id);
        return exists ? prev.map((item) => (item.id === id ? savedSkill : item)) : [...prev, savedSkill];
      });
    },
    deleteSkill(skillId) {
      setSkills((prev) => prev.filter((skill) => skill.id !== skillId));
    },
    saveTimelineItem(item) {
      const id = item.id || createId("timeline");
      const savedItem = {
        id,
        year: item.year || today().slice(0, 4),
        title: item.title || "New Timeline Moment",
        description: item.description || "",
      };
      setTimeline((prev) => {
        const exists = prev.some((entry) => entry.id === id);
        return exists ? prev.map((entry) => (entry.id === id ? savedItem : entry)) : [...prev, savedItem];
      });
    },
    deleteTimelineItem(itemId) {
      setTimeline((prev) => prev.filter((item) => item.id !== itemId));
    },
    async saveArticle(article) {
      const payload = {
        title: article.title,
        slug: article.slug || slugify(article.title),
        description: article.description,
        coverImage: article.coverImage,
        body: article.body,
        category: article.category,
        categoryId: article.categoryId,
        subcategory: article.subcategory,
        tags: article.tags,
        status: article.status,
        isFeatured: article.featured,
        isMustRead: article.mustRead,
        isTrending: article.trending,
        isPinned: article.pinned,
        scheduledAt: article.scheduledAt,
      };

      const targetId = article.id || article._id;
      let saved;
      if (targetId && !String(targetId).startsWith("article-")) {
        const res = await articleApi.update(targetId, payload);
        saved = res.article;
      } else {
        const res = await articleApi.create(payload);
        saved = res.article;
      }
      const normalized = withClientId(saved);
      setArticles((prev) => {
        const filtered = prev.filter((a) => a.id !== targetId && a._id !== targetId);
        return [normalized, ...filtered];
      });
      return normalized;
    },
    async deleteArticle(id) {
      await articleApi.delete(id);
      setArticles((prev) => prev.filter((a) => a.id !== id && a._id !== id));
    },
    async restoreArticle(id) {
      const res = await articleApi.restore(id);
      const normalized = withClientId(res.article);
      setArticles((prev) => {
        const filtered = prev.filter((a) => a.id !== id && a._id !== id);
        return [normalized, ...filtered];
      });
      return normalized;
    },
    async incrementArticle(id, metric) {
      if (!["views", "likes", "bookmarks", "saved"].includes(metric)) return;

      const applyUpdate = (newValue) => {
        setArticles((prev) =>
          prev.map((article) =>
            article.id === id || article._id === id
              ? { ...article, [metric]: Math.max(0, Number(newValue)) }
              : article
          )
        );
      };

      const applyDelta = (delta) => {
        setArticles((prev) =>
          prev.map((article) =>
            article.id === id || article._id === id
              ? { ...article, [metric]: Math.max(0, Number(article[metric] || 0) + delta) }
              : article
          )
        );
      };

      const isServerArticle = id && !String(id).startsWith("article-") && syncStatus === "live";

      if (metric === "views") {
        applyDelta(1);
        if (!isServerArticle) return;
        try {
          await articleApi.incrementViews(id);
        } catch (err) {
          applyDelta(-1);
          console.warn("Failed to increment article views", err);
        }
        return;
      }

      if (metric === "likes") {
        applyDelta(1);
        if (!isServerArticle) return;
        try {
          const res = await articleApi.like(id);
          if (res && res.likes !== undefined) applyUpdate(res.likes);
        } catch (err) {
          applyDelta(-1);
          console.warn("Failed to persist article like", err);
        }
        return;
      }

      if (metric === "bookmarks") {
        applyDelta(1);
        if (!isServerArticle) return;
        try {
          const res = await articleApi.bookmark(id);
          if (res && res.bookmarks !== undefined) applyUpdate(res.bookmarks);
        } catch (err) {
          applyDelta(-1);
          console.warn("Failed to persist article bookmark", err);
        }
        return;
      }

      if (metric === "saved") {
        applyDelta(1);
        if (!isServerArticle) return;
        try {
          const res = await articleApi.save(id);
          if (res && res.saved !== undefined) applyUpdate(res.saved);
        } catch (err) {
          applyDelta(-1);
          console.warn("Failed to persist article save", err);
        }
      }
    },
    async toggleArticleStatus(id) {
      const prevArticles = [...articles];
      const article = prevArticles.find((a) => a.id === id || a._id === id);
      if (!article) return;
      const nextStatus = article.status === "published" ? "draft" : "published";
      try {
        const res = await articleApi.setStatus(id, nextStatus);
        setArticles((curr) => curr.map((a) => (a.id === id || a._id === id) ? withClientId(res.article) : a));
      } catch (err) {
        console.error("Failed to toggle article status", err);
      }
    },
    async duplicateArticle(id) {
      const source = articles.find((a) => a.id === id || a._id === id);
      if (!source) throw new Error("Article not found");
      const payload = {
        title: `${source.title} (Copy)`,
        slug: `${source.slug || slugify(source.title)}-copy`,
        description: source.description,
        coverImage: source.coverImage,
        body: source.body,
        category: source.category,
        categoryId: source.categoryId,
        subcategory: source.subcategory,
        tags: source.tags,
        status: "draft",
        featured: false,
        mustRead: false,
        trending: false,
        pinned: false,
      };
      try {
        const res = await articleApi.create(payload);
        setArticles((curr) => [withClientId(res.article), ...curr]);
      } catch (err) {
        console.error("Failed to duplicate article", err);
      }
    },
    async saveCategory(category) {
      const payload = {
        name: category.name,
        slug: category.slug || slugify(category.name),
        description: category.description || "",
        longDescription: category.longDescription || "",
        icon: category.icon || "book",
        heroImage: category.heroImage || "",
        isActive: category.isActive !== undefined ? category.isActive : true,
      };
      const targetId = category.id || category._id;
      let saved;
      if (targetId) {
        const res = await categoryApi.update(targetId, payload);
        saved = res.category;
      } else {
        const res = await categoryApi.create(payload);
        saved = res.category;
      }
      const normalized = withClientId(saved);
      setCategories((prev) => {
        const filtered = prev.filter((c) => c.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
    async deleteCategory(id) {
      await categoryApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id && c._id !== id));
    },
    async restoreCategory(id) {
      const res = await categoryApi.restore(id);
      const normalized = withClientId(res.category);
      setCategories((prev) => {
        const filtered = prev.filter((c) => c.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
    async saveSubcategory(sub) {
      const payload = {
        name: sub.name,
        slug: sub.slug || slugify(sub.name),
        description: sub.description || "",
        category: sub.category,
      };
      const targetId = sub.id || sub._id;
      let saved;
      if (targetId) {
        const res = await subCategoryApi.update(targetId, payload);
        saved = res.subCategory;
      } else {
        const res = await subCategoryApi.create(payload);
        saved = res.subCategory;
      }
      const normalized = withClientId(saved);
      setSubcategories((prev) => {
        const filtered = prev.filter((s) => s.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
    async deleteSubcategory(id) {
      await subCategoryApi.delete(id);
      setSubcategories((prev) => prev.filter((s) => s.id !== id && s._id !== id));
    },
    async restoreSubcategory(id) {
      const res = await subCategoryApi.restore(id);
      const normalized = withClientId(res.subCategory);
      setSubcategories((prev) => {
        const filtered = prev.filter((s) => s.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
    async saveTag(tag) {
      const payload = {
        name: tag.name,
        slug: tag.slug || slugify(tag.name),
        description: tag.description || "",
        color: tag.color || "#426c67",
      };
      const targetId = tag.id || tag._id;
      let saved;
      if (targetId && !String(targetId).startsWith("tag-")) {
        const res = await tagApi.update(targetId, payload);
        saved = res.tag;
      } else {
        const res = await tagApi.create(payload);
        saved = res.tag;
      }
      const normalized = withClientId(saved);
      setTags((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
    async deleteTag(id) {
      await tagApi.delete(id);
      setTags((prev) => prev.filter((t) => t.id !== id && t._id !== id));
    },
    async restoreTag(id) {
      const res = await tagApi.restore(id);
      const normalized = withClientId(res.tag);
      setTags((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
  }), [articles, categories, subcategories, tags, syncStatus, isAdminOrEditor]);

  const value = useMemo(() => ({
    articles,
    categories,
    subcategories,
    tags,
    site,
    story,
    timeline,
    projects,
    skills,
    stats,
    syncStatus,
    ...actions
  }), [articles, categories, subcategories, tags, site, story, timeline, projects, skills, stats, syncStatus, actions]);

  return <ContentCmsContext.Provider value={value}>{children}</ContentCmsContext.Provider>;
};

export const useContentCms = () => {
  const context = useContext(ContentCmsContext);
  if (!context) throw new Error("useContentCms must be used inside ContentCmsProvider");
  return context;
};

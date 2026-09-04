import { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { cmsSeed } from "../data/cmsSeed";
import { articleApi, categoryApi, subCategoryApi, tagApi } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const ContentCmsContext = createContext(null);
const STORAGE_KEY = "myjourney-content-data";
const ARTICLE_INTERACTION_API = {
  likes: articleApi.like,
  bookmarks: articleApi.bookmark,
  saved: articleApi.save,
};

const runForActiveScope = async (activeScopeRef, operation, { adminOnly = false } = {}) => {
  const scope = activeScopeRef.current;
  if (!scope || (adminOnly && !scope.startsWith("admin:"))) {
    throw Object.assign(new Error("The required content access is no longer active."), { code: "CMS_CONTENT_CONTEXT_REQUIRED" });
  }
  const result = await operation();
  if (activeScopeRef.current !== scope) {
    throw Object.assign(new Error("This content response is no longer current."), { code: "CMS_STALE_CONTENT_RESPONSE" });
  }
  return result;
};

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
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "Admin";
  const activeAdminId = isAdmin ? String(user?.id || user?._id || "") : "";
  const activeScope = authLoading ? "" : activeAdminId ? `admin:${activeAdminId}` : "public";
  const activeScopeRef = useRef(activeScope);
  activeScopeRef.current = activeScope;
  const requestVersionRef = useRef(0);
  const [syncStatus, setSyncStatus] = useState("loading");
  // Persistent content is server-authoritative. Bundled fixtures are never a
  // substitute for MongoDB-backed Articles, Stories, or taxonomy.
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [dataScope, setDataScope] = useState("");

  // Portfolio & site settings slices
  const [site, setSite] = useState(cmsSeed.site);
  const [story, setStory] = useState(cmsSeed.story);
  const [timeline, setTimeline] = useState(cmsSeed.timeline);
  const [projects, setProjects] = useState(cmsSeed.projects);
  const [skills, setSkills] = useState(cmsSeed.skills);
  const [stats, setStats] = useState(cmsSeed.stats || []);

  const fetchContentData = async (scope = activeScopeRef.current) => {
    if (!scope) return;
    const requestVersion = ++requestVersionRef.current;
    const fetchAsAdmin = scope.startsWith("admin:");
    setSyncStatus("loading");
    try {
      let articlesRes, categoriesRes, subcategoriesRes, tagsRes;
      if (fetchAsAdmin) {
        [articlesRes, categoriesRes, subcategoriesRes, tagsRes] = await Promise.all([
          articleApi.adminList({ limit: 1000 }),
          categoryApi.list({ includeDeleted: true }),
          subCategoryApi.list({ includeDeleted: true }),
          tagApi.list({ includeDeleted: true }),
        ]);
      } else {
        [articlesRes, categoriesRes, subcategoriesRes, tagsRes] = await Promise.all([
          articleApi.list({ limit: 1000 }),
          categoryApi.list({ includeDeleted: false }),
          subCategoryApi.list({ includeDeleted: false }),
          tagApi.list({ includeDeleted: false }),
        ]);
      }

      if (requestVersion !== requestVersionRef.current || activeScopeRef.current !== scope) return;

      setArticles(Array.isArray(articlesRes?.articles) ? articlesRes.articles.map(withClientId) : []);
      setCategories(Array.isArray(categoriesRes?.categories) ? categoriesRes.categories.map(withClientId) : []);
      setSubcategories(Array.isArray(subcategoriesRes?.subCategories) ? subcategoriesRes.subCategories.map(withClientId) : []);
      setTags(Array.isArray(tagsRes?.tags) ? tagsRes.tags.map(withClientId) : []);
      setDataScope(scope);
      setSyncStatus("live");
    } catch (err) {
      if (requestVersion !== requestVersionRef.current || activeScopeRef.current !== scope) return;
      console.warn("Failed to fetch persistent content", err);
      setArticles([]);
      setCategories([]);
      setSubcategories([]);
      setTags([]);
      setDataScope("");
      setSyncStatus("unavailable");
    }
  };

  useEffect(() => {
    requestVersionRef.current += 1;
    setArticles([]);
    setCategories([]);
    setSubcategories([]);
    setTags([]);
    setDataScope("");
    setSite(cmsSeed.site);
    setStory(cmsSeed.story);
    setTimeline(cmsSeed.timeline);
    setProjects(cmsSeed.projects);
    setSkills(cmsSeed.skills);
    setStats(cmsSeed.stats || []);
    window.localStorage.removeItem(STORAGE_KEY);
    if (!activeScope) {
      setSyncStatus("idle");
      return;
    }
    fetchContentData(activeScope);
  }, [activeScope]);

  const actions = useMemo(() => ({
    async refreshContent() {
      await fetchContentData(activeScopeRef.current);
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
        seo: article.seo || {},
        accessLevel: article.accessLevel || "free",
        isFeatured: article.featured,
        isMustRead: article.mustRead,
        isTrending: article.trending,
        isPinned: article.pinned,
        scheduledAt: article.scheduledAt,
      };

      const targetId = article.id || article._id;
      let saved;
      if (targetId && !String(targetId).startsWith("article-")) {
        const res = await runForActiveScope(activeScopeRef, () => articleApi.update(targetId, payload), { adminOnly: true });
        saved = res.article;
      } else {
        const res = await runForActiveScope(activeScopeRef, () => articleApi.create(payload), { adminOnly: true });
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
      await runForActiveScope(activeScopeRef, () => articleApi.delete(id), { adminOnly: true });
      setArticles((prev) => prev.filter((a) => a.id !== id && a._id !== id));
    },
    async restoreArticle(id) {
      const res = await runForActiveScope(activeScopeRef, () => articleApi.restore(id), { adminOnly: true });
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

      const isServerArticle = id && !String(id).startsWith("article-");

      if (!isServerArticle) {
        const error = new Error("This Article is not backed by the persistent content API.");
        error.code = "ARTICLE_NOT_PERSISTED";
        throw error;
      }

      if (metric === "views") {
        const response = await runForActiveScope(activeScopeRef, () => articleApi.incrementViews(id));
        if (response?.views !== undefined) applyUpdate(response.views);
        return response;
      }

      const requestInteraction = ARTICLE_INTERACTION_API[metric];
      if (!requestInteraction) throw new Error("Unsupported Article interaction.");
      const response = await runForActiveScope(activeScopeRef, () => requestInteraction(id));
      if (response?.count !== undefined) applyUpdate(response.count);
      return response;
    },
    async toggleArticleStatus(id) {
      const prevArticles = [...articles];
      const article = prevArticles.find((a) => a.id === id || a._id === id);
      if (!article) return;
      const nextStatus = article.status === "published" ? "draft" : "published";
      try {
        const res = await runForActiveScope(activeScopeRef, () => articleApi.setStatus(id, nextStatus), { adminOnly: true });
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
        const res = await runForActiveScope(activeScopeRef, () => articleApi.create(payload), { adminOnly: true });
        setArticles((curr) => [withClientId(res.article), ...curr]);
      } catch (err) {
        console.error("Failed to duplicate article", err);
      }
    },
    async saveCategory(category) {
      const payload = {
        name: category.name,
        slug: category.slug || slugify(category.name),
        description: category.description || '',
        longDescription: category.longDescription || '',
        icon: category.icon || 'book',
        heroImage: category.heroImage || '',
        accentColor: category.accentColor || '',
        layoutTemplate: category.layoutTemplate || 'default',
        sortOrder: category.sortOrder !== undefined ? category.sortOrder : 0,
        isFeatured: Boolean(category.isFeatured),
        // Lifecycle
        status: category.status || 'published',
        isActive: category.isActive !== undefined ? category.isActive : true,
        visibility: category.visibility || 'public',
        // Surface controls
        showOnHomepage: category.showOnHomepage !== undefined ? category.showOnHomepage : true,
        showInNavigation: category.showInNavigation !== undefined ? category.showInNavigation : true,
        showInFooter: category.showInFooter !== undefined ? category.showInFooter : false,
        showInSearch: category.showInSearch !== undefined ? category.showInSearch : true,
        includeInSitemap: category.includeInSitemap !== undefined ? category.includeInSitemap : true,
        // Content rules
        allowArticles: category.allowArticles !== undefined ? category.allowArticles : true,
        allowComments: category.allowComments !== undefined ? category.allowComments : true,
        // SEO
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
        seoKeywords: category.seoKeywords || [],
      };
      const targetId = category.id || category._id;
      let saved;
      if (targetId) {
        const res = await runForActiveScope(activeScopeRef, () => categoryApi.update(targetId, payload), { adminOnly: true });
        saved = res.category;
      } else {
        const res = await runForActiveScope(activeScopeRef, () => categoryApi.create(payload), { adminOnly: true });
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
      await runForActiveScope(activeScopeRef, () => categoryApi.delete(id), { adminOnly: true });
      setCategories((prev) => prev.filter((c) => c.id !== id && c._id !== id));
    },
    async restoreCategory(id) {
      const res = await runForActiveScope(activeScopeRef, () => categoryApi.restore(id), { adminOnly: true });
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
        const res = await runForActiveScope(activeScopeRef, () => subCategoryApi.update(targetId, payload), { adminOnly: true });
        saved = res.subCategory;
      } else {
        const res = await runForActiveScope(activeScopeRef, () => subCategoryApi.create(payload), { adminOnly: true });
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
      await runForActiveScope(activeScopeRef, () => subCategoryApi.delete(id), { adminOnly: true });
      setSubcategories((prev) => prev.filter((s) => s.id !== id && s._id !== id));
    },
    async restoreSubcategory(id) {
      const res = await runForActiveScope(activeScopeRef, () => subCategoryApi.restore(id), { adminOnly: true });
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
        const res = await runForActiveScope(activeScopeRef, () => tagApi.update(targetId, payload), { adminOnly: true });
        saved = res.tag;
      } else {
        const res = await runForActiveScope(activeScopeRef, () => tagApi.create(payload), { adminOnly: true });
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
      await runForActiveScope(activeScopeRef, () => tagApi.delete(id), { adminOnly: true });
      setTags((prev) => prev.filter((t) => t.id !== id && t._id !== id));
    },
    async restoreTag(id) {
      const res = await runForActiveScope(activeScopeRef, () => tagApi.restore(id), { adminOnly: true });
      const normalized = withClientId(res.tag);
      setTags((prev) => {
        const filtered = prev.filter((t) => t.id !== normalized.id);
        return [...filtered, normalized];
      });
      return normalized;
    },
  }), [articles, categories, subcategories, tags, syncStatus, activeScope]);

  const ownsContentState = Boolean(activeScope && dataScope === activeScope);

  const value = useMemo(() => ({
    articles: ownsContentState ? articles : [],
    categories: ownsContentState ? categories : [],
    subcategories: ownsContentState ? subcategories : [],
    tags: ownsContentState ? tags : [],
    site,
    story,
    timeline,
    projects,
    skills,
    stats,
    syncStatus,
    ...actions
  }), [articles, categories, subcategories, tags, ownsContentState, site, story, timeline, projects, skills, stats, syncStatus, actions]);

  return <ContentCmsContext.Provider value={value}>{children}</ContentCmsContext.Provider>;
};

export const useContentCms = () => {
  const context = useContext(ContentCmsContext);
  if (!context) throw new Error("useContentCms must be used inside ContentCmsProvider");
  return context;
};

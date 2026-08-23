import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  FiBookmark,
  FiCalendar,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiMoon,
  FiSearch,
  FiShare2,
  FiSun,
  FiTag,
  FiUser,
  FiCode,
  FiTerminal,
  FiCpu,
  FiCheck,
  FiCopy,
  FiGitBranch,
  FiLayers,
} from "react-icons/fi";
import { getCategoryBlueprint } from "../../domain/knowledgeArchitecture";
import { useAuth } from "../../hooks/useAuth";
import { useCms } from "../../context/CmsContext";
import { decodeHtmlEntities, copyToClipboard } from "../../utils/helpers";
import { getImageUrl, handleImageError } from "../../utils/imageUrlHelper";
import ArticlesCard from "../../components/ArticlesCard";
import LoginRequiredModal from "../../components/LoginRequiredModal";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EmptyState from "../../components/shared/EmptyState";
import SectionShell from "../../components/shared/SectionShell";

const formatNumber = (value) => Number(value || 0).toLocaleString();

const sortArticles = (articles, sort) => {
  const sorted = [...articles];

  if (sort === "popular") {
    return sorted.sort((a, b) => b.views + b.likes - (a.views + a.likes));
  }

  if (sort === "oldest") {
    return sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  }

  return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
};

const normalize = (value) => String(value || "").toLowerCase();

const articleMatchesSubcategory = (article, subcategory) => {
  if (subcategory === "all") return true;

  const normalizedSubcategory = normalize(subcategory);
  return [
    article.subcategory,
    article.title,
    article.description,
    ...(article.tags || []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSubcategory);
};

const getArticleUrl = (slug) => `${window.location.origin}/articles/${slug}`;

const CodingLanding = ({
  category = {},
  allCategories = [],
  allArticles = [],
  incrementArticle,
}) => {
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, user, refreshSession } = useAuth();
  const { data } = useCms();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [message, setMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const sentinelRef = useRef(null);

  const blueprint = getCategoryBlueprint(category?.slug || "coding") || {};
  const categoryModel = {
    name: category?.name || blueprint.name || "Coding",
    description: category?.description || blueprint.description || "",
    longDescription: category?.longDescription || blueprint.longDescription || category?.description || blueprint.description || "",
    heroImage: category?.heroImage || blueprint.heroImage || "",
    subcategories: (Array.isArray(category?.subcategories) && category.subcategories.length > 0)
      ? category.subcategories
      : (blueprint.subcategories || ["JavaScript", "React", "Node.js", "Python", "CSS", "Database", "System Architecture"]),
    ...category,
  };

  const categoryArticles = useMemo(
    () =>
      (allArticles || []).filter(
        (article) =>
          article &&
          article.status === "published" &&
          normalize(article.category) === normalize(categoryModel.name)
      ),
    [allArticles, categoryModel.name]
  );

  const tags = useMemo(
    () => [...new Set(categoryArticles.flatMap((article) => article.tags || []))],
    [categoryArticles]
  );

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = categoryArticles.filter((article) => {
      const searchBlob = [
        article.title,
        article.description,
        article.category,
        article.subcategory,
        ...(article.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchBlob.includes(normalizedQuery);
      const matchesTag = activeTag === "all" || article.tags?.includes(activeTag);
      const matchesSubcategory = articleMatchesSubcategory(
        article,
        activeSubcategory
      );

      return matchesQuery && matchesTag && matchesSubcategory;
    });

    return sortArticles(filtered, sort);
  }, [activeSubcategory, activeTag, categoryArticles, query, sort]);

  const featuredArticle =
    categoryArticles.find((article) => article.featured) || categoryArticles[0];

  const popularArticles = useMemo(
    () => sortArticles(categoryArticles, "popular").slice(0, 5),
    [categoryArticles]
  );

  const relatedArticles = useMemo(() => {
    const tagSet = new Set(tags);
    return (allArticles || [])
      .filter(
        (article) =>
          article &&
          article.status === "published" &&
          normalize(article.category) !== normalize(categoryModel.name) &&
          article.tags?.some((tag) => tagSet.has(tag))
      )
      .slice(0, 3);
  }, [allArticles, categoryModel.name, tags]);

  const recentComments = useMemo(() => {
    const categoryArticleIds = new Set(
      categoryArticles.map((a) => a.id || (a._id && a._id.toString()))
    );
    return (data?.comments || [])
      .filter(
        (c) =>
          c &&
          !c.isDeleted &&
          c.status === "approved" &&
          categoryArticleIds.has(
            c.articleId?._id?.toString() ||
            c.articleId?.id ||
            (typeof c.articleId === "string" ? c.articleId : null)
          )
      )
      .map((c) => {
        const matchArticle = categoryArticles.find(
          (a) =>
            (a.id || (a._id && a._id.toString())) ===
            (c.articleId?._id?.toString() || c.articleId?.id || c.articleId)
        );
        return {
          ...c,
          articleSlug: matchArticle?.slug || "",
          articleTitle: matchArticle?.title || c.articleId?.title || "Unknown",
        };
      })
      .slice(0, 4);
  }, [categoryArticles, data?.comments]);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeSubcategory, activeTag, query, sort]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || visibleCount >= filteredArticles.length) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + 3, filteredArticles.length));
        }
      },
      { rootMargin: "220px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredArticles.length, visibleCount]);

  const requireLogin = () => {
    if (authLoading) return false;
    if (isAuthenticated) return true;
    setShowLoginModal(true);
    return false;
  };

  const isLiked = user?.profile?.likedArticles?.some(id => String(id) === String(featuredArticle?.id || featuredArticle?._id));
  const isBookmarked = user?.profile?.bookmarks?.some(id => String(id) === String(featuredArticle?.id || featuredArticle?._id));

  const handleLikeToggle = async () => {
    if (!featuredArticle) return;
    if (!requireLogin()) return;
    try {
      const articleId = featuredArticle.id || featuredArticle._id;
      await incrementArticle(articleId, "likes");
      await refreshSession();
      setMessage(isLiked ? "Article unliked." : "Article liked.");
    } catch (error) {
      setMessage(error.message || "Please try again.");
    }
  };

  const handleBookmarkToggle = async () => {
    if (!featuredArticle) return;
    if (!requireLogin()) return;
    try {
      const articleId = featuredArticle.id || featuredArticle._id;
      await incrementArticle(articleId, "bookmarks");
      await refreshSession();
      setMessage(isBookmarked ? "Article removed from bookmarks." : "Article bookmarked.");
    } catch (error) {
      setMessage(error.message || "Please try again.");
    }
  };

  const handleShare = async (article = featuredArticle) => {
    if (!article) return;

    const shareData = {
      title: article.title,
      text: article.description,
      url: getArticleUrl(article.slug),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const success = await copyToClipboard(shareData.url);
        if (success) {
          setMessage("Article link copied.");
        } else {
          setMessage("Failed to copy link.");
        }
      }
    } catch {
      setMessage("Sharing was cancelled.");
    }
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("npx create-react-app dev-journal --template typescript");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <main className={`category-detail-page coding-landing-page ${isDarkMode ? "dark-mode" : ""}`} data-experience="coding" data-category="coding">
      {/* IDE Terminal Hero Section */}
      <section className="coding-landing-hero">
        <div className="coding-terminal-window">
          <div className="terminal-header">
            <div className="terminal-controls">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="terminal-title-text">
              <FiTerminal /> <span>developer-journal@workspace:~/coding-hub</span>
            </div>
            <div className="terminal-tag">v2.4.0</div>
          </div>
          <div className="terminal-body-content">
            <Breadcrumbs items={[{ label: "Categories", to: "/#categories" }, { label: decodeHtmlEntities(categoryModel.name) }]} />
            <span className="section-kicker">💻 Software Architecture & Code Workspace</span>
            <h1>{decodeHtmlEntities(categoryModel.name)}</h1>
            <p>{decodeHtmlEntities(categoryModel.longDescription || categoryModel.description)}</p>
            
            {/* Quick CLI Prompt */}
            <div className="coding-cli-strip">
              <span className="prompt-symbol">$</span>
              <span className="prompt-text">npx create-react-app dev-journal --template typescript</span>
              <button type="button" className="copy-cmd-btn" onClick={handleCopyCmd}>
                {copiedCmd ? <FiCheck /> : <FiCopy />}
                <span>{copiedCmd ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="category-hero-meta">
              <span>
                <FiCode /> {categoryArticles.length} code modules
              </span>
              <span>
                <FiGitBranch /> {categoryModel.subcategories.length} stack topics
              </span>
              <span>
                <FiLayers /> Production Engineering
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Quote Strip */}
      <div className="life-editorial-quote-strip">
        <span className="quote-icon">“</span>
        <p>First, solve the problem. Then, write the code. Simplicity is prerequisite for reliability.</p>
      </div>

      <section className="category-toolbar" aria-label={`${categoryModel.name} filters`}>
        <label className="search-control">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${categoryModel.name.toLowerCase()} modules & snippets`}
          />
        </label>

        <label>
          Stack Topic
          <select
            value={activeSubcategory}
            onChange={(event) => setActiveSubcategory(event.target.value)}
          >
            <option value="all">All stack topics</option>
            {categoryModel.subcategories.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="latest">Latest releases</option>
            <option value="popular">Most starred</option>
            <option value="oldest">Oldest commits</option>
          </select>
        </label>

        <button
          className="icon-text-btn"
          type="button"
          onClick={() => setIsDarkMode((current) => !current)}
        >
          {isDarkMode ? <FiSun /> : <FiMoon />}
          {isDarkMode ? "Light" : "IDE Dark"}
        </button>
      </section>

      {tags.length > 0 && (
        <section className="category-tags" aria-label={`${categoryModel.name} tags`}>
          <button
            className={activeTag === "all" ? "active" : ""}
            type="button"
            onClick={() => setActiveTag("all")}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
              className={activeTag === tag ? "active" : ""}
              type="button"
              key={tag}
              onClick={() => setActiveTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </section>
      )}

      {featuredArticle && (
        <section className="featured-category-article coding-featured-card">
          <img
            src={getImageUrl(featuredArticle.coverImage, categoryModel.name)}
            alt={featuredArticle.title}
            loading="lazy"
            onError={(e) => handleImageError(e, categoryModel.name)}
          />
          <div>
            <span className="section-kicker">⚡ Featured Architecture Story</span>
            <h2>{featuredArticle.title}</h2>
            <p>{featuredArticle.description}</p>
            <div className="category-article-meta">
              <span>
                <FiUser /> {featuredArticle.author || "Noble John Steeven"}
              </span>
              <span>
                <FiCalendar /> {featuredArticle.publishedAt ? new Date(featuredArticle.publishedAt).toLocaleDateString() : "Recently"}
              </span>
              <span>{featuredArticle.readingTime || "6 min read"}</span>
            </div>
            <div className="inline-actions">
              <Link className="primary-btn" to={`/articles/${featuredArticle.slug}`}>
                Explore Repository
              </Link>
              <button
                className={`small-outline-btn ${isLiked ? "active like-btn" : ""}`}
                type="button"
                onClick={handleLikeToggle}
              >
                <FiHeart style={isLiked ? { fill: "#61dafb", stroke: "#61dafb" } : undefined} /> {formatNumber(featuredArticle.likes)}
              </button>
              <button
                className={`small-outline-btn ${isBookmarked ? "active bookmark-btn" : ""}`}
                type="button"
                onClick={handleBookmarkToggle}
              >
                <FiBookmark style={isBookmarked ? { fill: "currentColor" } : undefined} /> {formatNumber(featuredArticle.bookmarks)}
              </button>
              <button
                className="small-outline-btn"
                type="button"
                onClick={() => handleShare(featuredArticle)}
              >
                <FiShare2 /> Share
              </button>
            </div>
            {message && <span className="form-note">{message}</span>}
          </div>
        </section>
      )}

      <section className="category-content-grid">
        <SectionShell
          kicker="Engineering Articles"
          title={`${filteredArticles.length} ${categoryModel.name} publications`}
          className="category-main-feed"
        >
          {filteredArticles.length > 0 ? (
            <>
              <div className="article-grid">
                {filteredArticles.slice(0, visibleCount).map((article) => (
                  <ArticlesCard articleData={article} key={article.id || article._id} />
                ))}
              </div>
              <div className="infinite-sentinel" ref={sentinelRef}>
                {visibleCount < filteredArticles.length
                  ? "Fetching additional modules..."
                  : "All repositories loaded."}
              </div>
            </>
          ) : (
            <EmptyState
              title="No code modules found"
              message="Adjust search query or filter criteria."
            />
          )}
        </SectionShell>

        <aside className="category-sidebar">
          <div className="category-side-panel">
            <span className="section-kicker">Most Starred</span>
            <div className="popular-list">
              {popularArticles.map((article, index) => (
                <Link to={`/articles/${article.slug}`} key={article.id || article._id || `popular-${index}`}>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <span>{article.title}</span>
                  <small>
                    <FiEye /> {formatNumber(article.views)}
                  </small>
                </Link>
              ))}
            </div>
          </div>

          <div className="category-side-panel">
            <span className="section-kicker">Stack Topics</span>
            <div className="topic-chip-grid">
              {categoryModel.subcategories.map((item) => (
                <button
                  className={activeSubcategory === item ? "active" : ""}
                  type="button"
                  key={item}
                  onClick={() => setActiveSubcategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="category-side-panel">
            <span className="section-kicker">Code Reviews</span>
            <div className="category-comment-list">
              {recentComments.map((comment, index) => (
                <Link to={`/articles/${comment.articleSlug}`} key={comment.id || comment._id || `comment-${index}`}>
                  <strong>{comment.name}</strong>
                  <p>{comment.text}</p>
                  <span>{comment.articleTitle}</span>
                </Link>
              ))}
              {recentComments.length === 0 && (
                <p className="empty-state compact">No code reviews posted yet.</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="related-articles">
        <span className="section-kicker">Related tech stacks</span>
        <h2>Keep Building</h2>
        <div className="related-link-list">
          {(relatedArticles.length ? relatedArticles : (allCategories || []).slice(0, 3)).map(
            (item, index) =>
              item && item.slug && item.title ? (
                <Link to={`/articles/${item.slug}`} key={item.id || item._id || item.slug || index}>
                  {item.title}
                </Link>
              ) : item && item.slug ? (
                <Link to={`/category/${item.slug}`} key={item.id || item._id || item.slug || index}>
                  {item.name || "Category"}
                </Link>
              ) : null
          )}
        </div>
      </section>

      <LoginRequiredModal
        open={showLoginModal}
        returnTo={location}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
};

export default CodingLanding;

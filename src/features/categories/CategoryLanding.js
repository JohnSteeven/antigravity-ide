import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "react-icons/fi";
import { getCategoryBlueprint } from "../../domain/knowledgeArchitecture";
import { useAuth } from "../../hooks/useAuth";
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

const CategoryLanding = ({
  category,
  allCategories,
  allArticles,
  incrementArticle,
}) => {
  const location = useLocation();
  const { isAuthenticated, updateProfile, user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [message, setMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const sentinelRef = useRef(null);

  const blueprint = getCategoryBlueprint(category.slug) || {};
  const categoryModel = {
    ...blueprint,
    ...category,
    subcategories: category.subcategories?.length
      ? category.subcategories
      : blueprint.subcategories || [],
    heroImage: category.heroImage || blueprint.heroImage,
    longDescription: category.longDescription || blueprint.longDescription,
  };

  const categoryArticles = useMemo(
    () =>
      allArticles.filter(
        (article) =>
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
    return allArticles
      .filter(
        (article) =>
          article.status === "published" &&
          normalize(article.category) !== normalize(categoryModel.name) &&
          article.tags?.some((tag) => tagSet.has(tag))
      )
      .slice(0, 3);
  }, [allArticles, categoryModel.name, tags]);

  const recentComments = useMemo(
    () =>
      categoryArticles
        .flatMap((article) =>
          (article.comments || [])
            .filter((comment) => comment.status === "approved")
            .map((comment) => ({
              ...comment,
              articleSlug: article.slug,
              articleTitle: article.title,
            }))
        )
        .slice(0, 4),
    [categoryArticles]
  );

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
    if (isAuthenticated) return true;
    setShowLoginModal(true);
    return false;
  };

  const handleProfileAction = async ({ article, metric, profileField, success }) => {
    if (!requireLogin()) return;

    const profile = user?.profile || {};
    const currentItems = Array.isArray(profile[profileField])
      ? profile[profileField]
      : [];

    if (currentItems.includes(article.id)) {
      setMessage("This article is already saved in your profile.");
      return;
    }

    try {
      await updateProfile({
        profile: {
          ...profile,
          [profileField]: [article.id, ...currentItems],
        },
      });
      if (metric) incrementArticle(article.id, metric);
      setMessage(success);
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
        await navigator.clipboard.writeText(shareData.url);
        setMessage("Article link copied.");
      }
    } catch {
      setMessage("Sharing was cancelled.");
    }
  };

  return (
    <main className={`category-detail-page ${isDarkMode ? "dark-mode" : ""}`}>
      <section
        className="category-detail-hero"
        style={{ backgroundImage: `url("${categoryModel.heroImage}")` }}
      >
        <div className="category-detail-overlay"></div>
        <div className="category-detail-hero-content">
          <Breadcrumbs items={[{ label: "Categories", to: "/#categories" }, { label: categoryModel.name }]} />
          <span className="section-kicker">Category</span>
          <h1>{categoryModel.name}</h1>
          <p>{categoryModel.longDescription || categoryModel.description}</p>
          <div className="category-hero-meta">
            <span>
              <FiTag /> {categoryModel.subcategories.length} topics
            </span>
            <span>
              <FiCalendar /> {categoryArticles.length} published posts
            </span>
            <span>
              <FiMessageCircle /> {recentComments.length} reader notes
            </span>
          </div>
        </div>
      </section>

      <section className="category-toolbar" aria-label={`${categoryModel.name} filters`}>
        <label className="search-control">
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${categoryModel.name.toLowerCase()}`}
          />
        </label>

        <label>
          Topic
          <select
            value={activeSubcategory}
            onChange={(event) => setActiveSubcategory(event.target.value)}
          >
            <option value="all">All topics</option>
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
            <option value="latest">Latest</option>
            <option value="popular">Most popular</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>

        <button
          className="icon-text-btn"
          type="button"
          onClick={() => setIsDarkMode((current) => !current)}
        >
          {isDarkMode ? <FiSun /> : <FiMoon />}
          {isDarkMode ? "Light" : "Dark"}
        </button>
      </section>

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

      {featuredArticle && (
        <section className="featured-category-article">
          <img src={featuredArticle.coverImage} alt={featuredArticle.title} />
          <div>
            <span className="section-kicker">Featured article</span>
            <h2>{featuredArticle.title}</h2>
            <p>{featuredArticle.description}</p>
            <div className="category-article-meta">
              <span>
                <FiUser /> {featuredArticle.author}
              </span>
              <span>
                <FiCalendar /> {featuredArticle.publishedAt}
              </span>
              <span>{featuredArticle.readingTime}</span>
            </div>
            <div className="inline-actions">
              <Link className="primary-btn" to={`/articles/${featuredArticle.slug}`}>
                Read Article
              </Link>
              <button
                className="small-outline-btn"
                type="button"
                onClick={() =>
                  handleProfileAction({
                    article: featuredArticle,
                    metric: "likes",
                    profileField: "likedArticles",
                    success: "Article liked.",
                  })
                }
              >
                <FiHeart /> {formatNumber(featuredArticle.likes)}
              </button>
              <button
                className="small-outline-btn"
                type="button"
                onClick={() =>
                  handleProfileAction({
                    article: featuredArticle,
                    metric: "bookmarks",
                    profileField: "bookmarks",
                    success: "Article bookmarked.",
                  })
                }
              >
                <FiBookmark /> {formatNumber(featuredArticle.bookmarks)}
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
          kicker="Latest posts"
          title={`${filteredArticles.length} ${categoryModel.name} articles`}
          className="category-main-feed"
        >
          {filteredArticles.length > 0 ? (
            <>
              <div className="article-grid">
                {filteredArticles.slice(0, visibleCount).map((article) => (
                  <ArticlesCard articleData={article} key={article.id} />
                ))}
              </div>
              <div className="infinite-sentinel" ref={sentinelRef}>
                {visibleCount < filteredArticles.length
                  ? "Loading more articles..."
                  : "You are caught up."}
              </div>
            </>
          ) : (
            <EmptyState
              title="No articles found"
              message="Try another topic, tag, or search phrase."
            />
          )}
        </SectionShell>

        <aside className="category-sidebar">
          <div className="category-side-panel">
            <span className="section-kicker">Most popular</span>
            <div className="popular-list">
              {popularArticles.map((article, index) => (
                <Link to={`/articles/${article.slug}`} key={article.id}>
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
            <span className="section-kicker">Topics</span>
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
            <span className="section-kicker">Comments</span>
            <div className="category-comment-list">
              {recentComments.map((comment) => (
                <Link to={`/articles/${comment.articleSlug}`} key={comment.id}>
                  <strong>{comment.name}</strong>
                  <p>{comment.text}</p>
                  <span>{comment.articleTitle}</span>
                </Link>
              ))}
              {recentComments.length === 0 && (
                <p className="empty-state compact">No approved comments yet.</p>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="related-articles">
        <span className="section-kicker">Related articles</span>
        <h2>Keep Exploring</h2>
        <div className="related-link-list">
          {(relatedArticles.length ? relatedArticles : allCategories.slice(0, 3)).map(
            (item) =>
              item.slug && item.title ? (
                <Link to={`/articles/${item.slug}`} key={item.id}>
                  {item.title}
                </Link>
              ) : (
                <Link to={`/category/${item.slug}`} key={item.id}>
                  {item.name}
                </Link>
              )
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

export default CategoryLanding;

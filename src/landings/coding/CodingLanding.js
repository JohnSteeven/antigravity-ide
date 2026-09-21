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
  FiArrowRight,
} from "react-icons/fi";
import { getCategoryBlueprint } from "../../domain/knowledgeArchitecture";
import { useAuth } from "../../hooks/useAuth";
import { useReader } from "../../hooks/useReader";
import { useCms } from "../../context/CmsContext";
import { decodeHtmlEntities, shareArticle } from "../../utils/helpers";
import { getImageUrl, handleImageError } from "../../utils/imageUrlHelper";
import { learnApi } from "../../services/apiService";
import ArticlesCard from "../../components/ArticlesCard";
import LoginRequiredModal from "../../components/LoginRequiredModal";
import Breadcrumbs from "../../components/shared/Breadcrumbs";
import EmptyState from "../../components/shared/EmptyState";
import SectionShell from "../../components/shared/SectionShell";
import "./CodingLanding.css";

const formatNumber = (value) => Number(value || 0).toLocaleString();

const CANONICAL_TRACKS = [
  {
    slug: "html-foundations",
    title: "HTML Foundations",
    description: "Master the structure of the modern web with semantic HTML5 elements, forms, media, and document architecture.",
    level: "Beginner",
    lessonCount: 12,
    accessLevel: "free",
    badge: "FREE",
    icon: "🌐",
    tag: "HTML",
  },
  {
    slug: "css-foundations",
    title: "CSS Foundations",
    description: "Design beautiful, responsive web interfaces with modern CSS, flexbox, grid, typography, and styling architectures.",
    level: "Beginner",
    lessonCount: 13,
    accessLevel: "free",
    badge: "FREE",
    icon: "🎨",
    tag: "CSS",
  },
  {
    slug: "javascript-foundations",
    title: "JavaScript Foundations",
    description: "Develop deep algorithmic and interactive web programming skills with modern ES6+ JavaScript, DOM, and logic.",
    level: "Beginner",
    lessonCount: 15,
    accessLevel: "premium",
    badge: "PREMIUM INCLUDED",
    icon: "⚡",
    tag: "JavaScript",
  },
  {
    slug: "python-foundations",
    title: "Python Foundations",
    description: "Learn core computer science, syntax, data structures, and algorithmic problem solving with Python 3.",
    level: "Beginner",
    lessonCount: 15,
    accessLevel: "premium",
    badge: "PREMIUM INCLUDED",
    icon: "🐍",
    tag: "Python",
  },
];

const courseSlugToTrack = (slug) => {
  const map = {
    "html-foundations": "html",
    "css-foundations": "css",
    "javascript-foundations": "javascript",
    "python-foundations": "python",
  };
  return map[slug] || slug;
};

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
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { library, applyAuthoritativeLibraryState } = useReader();
  const { data } = useCms();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [engagementCounts, setEngagementCounts] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const sentinelRef = useRef(null);
  const inFlightLanding = useRef(new Set());

  const [courses, setCourses] = useState(CANONICAL_TRACKS);
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      learnApi.courses({ limit: 20 }).catch(() => null),
      isAuthenticated ? learnApi.continueLearning().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([coursesRes, continueRes]) => {
      if (!active) return;
      const apiCourses = coursesRes?.courses || coursesRes?.data?.courses || [];
      if (Array.isArray(apiCourses) && apiCourses.length > 0) {
        const merged = CANONICAL_TRACKS.map((fallback) => {
          const found = apiCourses.find((c) => c.slug === fallback.slug);
          if (!found) return fallback;
          return {
            ...fallback,
            ...found,
            title: found.title || fallback.title,
            description: found.subtitle || found.description || fallback.description,
            lessonCount: found.lessonCount || fallback.lessonCount,
            level: found.level ? found.level.charAt(0).toUpperCase() + found.level.slice(1) : fallback.level,
            badge: found.accessLevel === "premium" ? "PREMIUM INCLUDED" : "FREE",
          };
        });
        setCourses(merged);
      }
      const userEnrollments = continueRes?.data || [];
      setEnrollments(Array.isArray(userEnrollments) ? userEnrollments : []);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const getCourseEnrollment = (course) => {
    if (!enrollments || !enrollments.length) return null;
    return enrollments.find((e) => {
      const cid = e.courseId?._id || e.courseId?.id || e.courseId;
      return cid === course.id || cid === course._id || e.courseId?.slug === course.slug;
    });
  };

  const filteredCourses = useMemo(() => {
    const normQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery =
        !normQuery ||
        course.title.toLowerCase().includes(normQuery) ||
        course.description.toLowerCase().includes(normQuery) ||
        (course.tag && course.tag.toLowerCase().includes(normQuery));
      const matchesSubcategory =
        activeSubcategory === "all" ||
        (course.tag && course.tag.toLowerCase() === activeSubcategory.toLowerCase()) ||
        course.title.toLowerCase().includes(activeSubcategory.toLowerCase());
      return matchesQuery && matchesSubcategory;
    });
  }, [courses, query, activeSubcategory]);

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + (c.lessonCount || 0), 0),
    [courses]
  );

  const blueprint = getCategoryBlueprint(category?.slug || "coding") || {};
  const categoryModel = {
    name: category?.name || blueprint.name || "Coding",
    description: category?.description || blueprint.description || "",
    longDescription:
      category?.longDescription ||
      blueprint.longDescription ||
      category?.description ||
      blueprint.description ||
      "",
    heroImage: category?.heroImage || blueprint.heroImage || "",
    subcategories: ["HTML", "CSS", "JavaScript", "Python"],
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

  useEffect(() => {
    setEngagementCounts({});
  }, [featuredArticle?.id, featuredArticle?._id]);

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

  const featuredArticleId = String(featuredArticle?.id || featuredArticle?._id || "");
  const isLiked = library.liked.some((item) => String(item.id || item._id) === featuredArticleId);
  const isBookmarked = library.bookmarked.some((item) => String(item.id || item._id) === featuredArticleId);

  const applyInteractionResponse = (response, metric, collection) => {
    if (
      response?.metric !== metric ||
      String(response?.articleId) !== featuredArticleId ||
      typeof response?.isActive !== "boolean" ||
      !Number.isFinite(Number(response?.count)) ||
      String(response?.libraryItem?.id) !== featuredArticleId
    ) throw new Error("Invalid Article interaction response.");
    setEngagementCounts((current) => ({ ...current, [metric]: Number(response.count) }));
    applyAuthoritativeLibraryState({ collection, isActive: response.isActive, article: response.libraryItem, userId: user?.id });
    return response.isActive;
  };

  const handleLandingToggle = async (metric, collection, failureMessage) => {
    if (!featuredArticle) return;
    if (!requireLogin()) return;
    const articleId = featuredArticleId;
    if (!articleId) return;

    const lockKey = `${articleId}:${metric}`;
    if (inFlightLanding.current.has(lockKey)) return;
    inFlightLanding.current.add(lockKey);

    const wasActive = collection === "liked" ? isLiked : isBookmarked;
    const nextActive = !wasActive;
    const prevCount = Number(engagementCounts[metric] ?? featuredArticle[metric] ?? 0);
    const nextCount = Math.max(0, prevCount + (nextActive ? 1 : -1));

    setEngagementCounts((current) => ({ ...current, [metric]: nextCount }));
    applyAuthoritativeLibraryState({ collection, isActive: nextActive, article: featuredArticle, userId: user?.id });
    setMessage("");

    try {
      const response = await incrementArticle(articleId, metric);
      applyInteractionResponse(response, metric, collection);
    } catch {
      setEngagementCounts((current) => ({ ...current, [metric]: prevCount }));
      applyAuthoritativeLibraryState({ collection, isActive: wasActive, article: featuredArticle, userId: user?.id });
      setMessage(failureMessage);
    } finally {
      inFlightLanding.current.delete(lockKey);
    }
  };

  const handleLikeToggle = () => handleLandingToggle("likes", "liked", "Could not update your like. Try again.");
  const handleBookmarkToggle = () => handleLandingToggle("bookmarks", "bookmarked", "Could not update your bookmark. Try again.");

  const handleShare = async (article = featuredArticle) => {
    if (!article) return;
    if (pendingAction) return;
    setPendingAction("share");
    const result = await shareArticle({ title: article.title, text: article.description, url: getArticleUrl(article.slug) });
    if (result.method === "native") setMessage("Article shared.");
    else if (result.method === "clipboard") setMessage("Link copied.");
    else if (result.method === "cancelled") setMessage("Sharing cancelled.");
    else setMessage("Could not copy the link.");
    setPendingAction("");
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText("npx create-react-app dev-journal --template typescript");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <>
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
                  <FiCode /> {courses.length} Interactive Tracks
                </span>
                <span>
                  <FiLayers /> {totalLessons} Lessons
                </span>
                <span>
                  <FiCpu /> In-Browser Execution & Pyodide
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

        {/* Toolbar & Filters */}
        <section className="category-toolbar" aria-label={`${categoryModel.name} filters`}>
          <label className="search-control">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search coding tracks & topics"
            />
          </label>

          <label>
            Track
            <select
              value={activeSubcategory}
              onChange={(event) => setActiveSubcategory(event.target.value)}
            >
              <option value="all">All Tracks</option>
              {categoryModel.subcategories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
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

        {/* Primary Content Grid */}
        <section className="category-content-grid">
          <div className="category-main-feed">
            {/* PRIMARY CODING EXPERIENCE: CANONICAL LEARN CURRICULUM */}
            <section className="coding-curriculum-section" aria-labelledby="coding-curriculum-heading">
              <div className="coding-curriculum-header">
                <span className="coding-kicker">CODING</span>
                <h2 id="coding-curriculum-heading" className="coding-main-title">Learn by doing.</h2>
                <p className="coding-main-lead">
                  Interactive coding courses with explanations, editable code,
                  live execution, exercises, quizzes, and projects.
                </p>
              </div>

              <div className="coding-tracks-grid">
                {filteredCourses.map((course) => {
                  const enrollment = getCourseEnrollment(course);
                  const completedCount = enrollment?.completedLessonCount || 0;
                  const totalCount = course.lessonCount || 1;
                  const percent = enrollment ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
                  const isEnrolled = Boolean(enrollment);
                  const isPremium = course.accessLevel === "premium" || course.badge?.includes("PREMIUM");

                  return (
                    <article key={course.slug} className={`coding-track-card ${isPremium ? "is-premium" : "is-free"}`} data-track={course.slug}>
                      <div className="track-card-header">
                        <div className="track-card-badges">
                          <span className={`track-badge ${isPremium ? "track-badge--premium" : "track-badge--free"}`}>
                            {isPremium ? "PREMIUM INCLUDED" : "FREE"}
                          </span>
                          <span className="track-level-badge">{course.level || "Beginner"}</span>
                        </div>
                        <span className="track-icon" aria-hidden="true">{course.icon || "💻"}</span>
                      </div>

                      <div className="track-card-body">
                        <h3 className="track-title">
                          <Link to={`/coding/${courseSlugToTrack(course.slug)}`}>{course.title}</Link>
                        </h3>
                        <p className="track-description">{course.description}</p>
                        <div className="track-meta">
                          <span><FiLayers /> {course.lessonCount} lessons</span>
                          <span><FiTerminal /> In-browser sandbox</span>
                        </div>

                        {isEnrolled && (
                          <div className="track-progress-container">
                            <div className="track-progress-bar">
                              <div className="track-progress-fill" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="track-progress-labels">
                              <span>{completedCount} of {totalCount} lessons ({percent}%)</span>
                              <span>{percent >= 100 ? "Completed" : "In Progress"}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="track-card-footer">
                        <Link to={`/coding/${courseSlugToTrack(course.slug)}`} className="track-action-btn">
                          {isEnrolled ? (percent >= 100 ? "Review Course →" : "Continue Course →") : "Start Course →"}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* SECONDARY EDITORIAL ARTICLES (Only if articles exist) */}
            {filteredArticles.length > 0 && (
              <section className="secondary-articles-section">
                <div className="secondary-articles-header">
                  <span className="section-kicker">Publications</span>
                  <h3>Engineering Articles</h3>
                </div>
                <div className="article-grid">
                  {filteredArticles.slice(0, visibleCount).map((article) => (
                    <ArticlesCard articleData={article} key={article.id || article._id} />
                  ))}
                </div>
                {visibleCount < filteredArticles.length && (
                  <div className="infinite-sentinel" ref={sentinelRef}>
                    Fetching additional modules...
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="category-sidebar">
            <div className="category-side-panel">
              <span className="section-kicker">Stack Topics</span>
              <div className="topic-chip-grid">
                <button
                  className={activeSubcategory === "all" ? "active" : ""}
                  type="button"
                  onClick={() => setActiveSubcategory("all")}
                >
                  All
                </button>
                {categoryModel.subcategories.map((item) => (
                  <button
                    className={activeSubcategory.toLowerCase() === item.toLowerCase() ? "active" : ""}
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
              <span className="section-kicker">Interactive Tracks</span>
              <div className="sidebar-track-list">
                {courses.map((course) => (
                  <Link to={`/coding/${courseSlugToTrack(course.slug)}`} key={course.slug} className="sidebar-track-item">
                    <span>{course.icon} {course.title}</span>
                    <span className={`sidebar-track-pill ${course.accessLevel === "premium" ? "sidebar-track-pill--premium" : "sidebar-track-pill--free"}`}>
                      {course.accessLevel === "premium" ? "Premium" : "Free"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {popularArticles.length > 0 && (
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
            )}

            {recentComments.length > 0 && (
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
                </div>
              </div>
            )}
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
      </main>

      <LoginRequiredModal
        open={showLoginModal}
        returnTo={location}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default CodingLanding;

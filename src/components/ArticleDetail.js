import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  FiBookOpen,
  FiBookmark,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiStar,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiSend,
  FiLink,
  FiCompass,
  FiChevronRight,
  FiActivity,
  FiCheckCircle,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";
import { getFullName, resolveImageUrl } from "../utils/helpers";
import LoginRequiredModal from "./LoginRequiredModal";
import LoadingScreen from "./LoadingScreen";
import Breadcrumbs from "./shared/Breadcrumbs";

const ArticleDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { data, syncStatus, addComment, incrementArticle } = useCms();
  const { isAuthenticated, loading: authLoading, updateProfile, user, refreshSession } = useAuth();
  const [comment, setComment] = useState({ text: "" });
  const [commentMessage, setCommentMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  // Track direct-API fetch state for the slug lookup fallback
  const [apiArticle, setApiArticle] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

  // Path 1: fast lookup from CMS context in-memory list
  const contextArticle = data.articles.find(
    (item) => item.slug === slug && item.status === "published"
  );

  // Path 2: authoritative DB lookup by slug — handles articles not yet in context
  useEffect(() => {
    let cancelled = false;
    setApiArticle(null);
    setApiLoading(true);

    const run = async () => {
      try {
        const { articleApi } = await import("../services/apiService");
        const res = await articleApi.getBySlug(slug);
        if (!cancelled && res?.article) setApiArticle(res.article);
      } catch {
        // 404 or network error — apiArticle stays null
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [slug]);

  // Keep local apiArticle state synchronized with context data.articles updates
  useEffect(() => {
    if (apiArticle) {
      const match = data.articles.find(
        (item) => item.id === apiArticle.id || item._id === apiArticle._id
      );
      if (match) {
        if (
          match.likes !== apiArticle.likes ||
          match.bookmarks !== apiArticle.bookmarks ||
          match.views !== apiArticle.views ||
          match.saved !== apiArticle.saved
        ) {
          setApiArticle((prev) => prev ? {
            ...prev,
            likes: match.likes,
            bookmarks: match.bookmarks,
            views: match.views,
            saved: match.saved,
          } : null);
        }
      }
    }
  }, [data.articles, apiArticle]);

  // Use whichever source resolves first
  const article = contextArticle || apiArticle;

  const relatedArticles = useMemo(() => {
    if (!article) return [];

    return data.articles
      .filter(
        (item) =>
          item.id !== article.id &&
          item.status === "published" &&
          item.category === article.category
      )
      .slice(0, 4);
  }, [article, data.articles]);

  // Extract headings for Table of Contents
  const headings = useMemo(() => {
    if (!article || !article.body) return [];
    const matches = [...article.body.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)];
    return matches.map((m, index) => {
      const text = m[1].replace(/<[^>]+>/g, "");
      const id = `heading-${index}`;
      return { id, text };
    });
  }, [article]);

  // Inject IDs to headers in article body & rewrite uploads paths to absolute URL
  const processedBody = useMemo(() => {
    if (!article || !article.body) return "";
    let index = 0;
    const bodyWithAbsoluteImages = article.body.replace(/(src|href)="\/uploads/g, '$1="http://localhost:5000/uploads');
    return bodyWithAbsoluteImages.replace(/<h2([^>]*)>/g, (match, attrs) => {
      const replacement = `<h2 id="heading-${index}"${attrs}>`;
      index++;
      return replacement;
    });
  }, [article]);

  // Track viewed articles in sessionStorage to avoid duplicate view increments
  useEffect(() => {
    const articleId = article?.id || article?._id;
    if (articleId) {
      const viewedKey = `viewed-article-${articleId}`;
      const hasViewed = sessionStorage.getItem(viewedKey);
      if (!hasViewed) {
        sessionStorage.setItem(viewedKey, "true");
        if (apiArticle) {
          setApiArticle((prev) => prev ? {
            ...prev,
            views: (prev.views || 0) + 1
          } : null);
        }
        incrementArticle(articleId, "views");
      }
    }
  }, [article?.id, article?._id]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll spy active heading
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScrollSpy = () => {
      let currentActive = "";
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140) {
            currentActive = h.id;
          }
        }
      }
      setActiveHeading(currentActive || headings[0].id);
    };
    window.addEventListener("scroll", handleScrollSpy);
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, [headings]);

  if (!article) {
    // Show loading screen while EITHER the CMS context OR the API slug fetch is still in-flight
    if (syncStatus === "loading" || apiLoading) {
      return <LoadingScreen message="Loading article..." />;
    }
    // Both sources settled with no result — truly not found
    return <Navigate to="/articles" replace />;
  }

  const approvedComments = (data.comments || [])
    .map((c) => ({
      ...c,
      id: c._id || c.id,
      name: c.authorName || c.name || "Reader",
      text: c.body || c.text || "",
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now",
    }))
    .filter(
      (item) =>
        !item.isDeleted &&
        item.status === "approved" &&
        String(item.articleId?._id || item.articleId?.id || item.articleId) === String(article.id || article._id)
    );

  const requireLogin = () => {
    if (authLoading) return false;   // session check still in-flight, don't show modal
    if (isAuthenticated) return true;
    setShowLoginModal(true);
    return false;
  };

  const isLiked = user?.profile?.likedArticles?.some(id => String(id) === String(article?.id || article?._id));
  const isBookmarked = user?.profile?.bookmarks?.some(id => String(id) === String(article?.id || article?._id));
  const isSaved = user?.profile?.savedArticles?.some(id => String(id) === String(article?.id || article?._id));

  const handleLikeToggle = async () => {
    if (!requireLogin()) return;
    try {
      const articleId = article.id || article._id;
      if (apiArticle) {
        setApiArticle((prev) => prev ? {
          ...prev,
          likes: Math.max(0, (prev.likes || 0) + (isLiked ? -1 : 1))
        } : null);
      }
      await incrementArticle(articleId, "likes");
      await refreshSession();
      setCommentMessage(isLiked ? "Article unliked." : "Article liked.");
    } catch (error) {
      setCommentMessage(error.message || "Please try again.");
    }
  };

  const handleBookmarkToggle = async () => {
    if (!requireLogin()) return;
    try {
      const articleId = article.id || article._id;
      if (apiArticle) {
        setApiArticle((prev) => prev ? {
          ...prev,
          bookmarks: Math.max(0, (prev.bookmarks || 0) + (isBookmarked ? -1 : 1))
        } : null);
      }
      await incrementArticle(articleId, "bookmarks");
      await refreshSession();
      setCommentMessage(isBookmarked ? "Article removed from bookmarks." : "Article bookmarked.");
    } catch (error) {
      setCommentMessage(error.message || "Please try again.");
    }
  };

  const handleSaveToggle = async () => {
    if (!requireLogin()) return;
    try {
      const articleId = article.id || article._id;
      if (apiArticle) {
        setApiArticle((prev) => prev ? {
          ...prev,
          saved: !isSaved
        } : null);
      }
      await incrementArticle(articleId, "saved");
      await refreshSession();
      setCommentMessage(isSaved ? "Article removed from saved articles." : "Article saved to your profile.");
    } catch (error) {
      setCommentMessage(error.message || "Please try again.");
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!requireLogin()) return;

    const articleId = article.id || article._id;

    try {
      const nextComment = {
        name: getFullName(user),
        text: comment.text,
      };
      // AWAIT the addComment API call to catch and handle TimeoutErrors properly!
      await addComment(articleId, nextComment);
      await updateProfile({
        profile: {
          ...(user?.profile || {}),
          comments: [
            {
              id: `profile-comment-${articleId}-${Date.now()}`,
              articleId: articleId,
              articleTitle: article.title,
              text: comment.text,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...((user?.profile?.comments || [])),
          ],
        },
      });
      setComment({ text: "" });
      setCommentMessage("Comment submitted for moderation.");
    } catch (error) {
      setCommentMessage(error.message || "Please try again.");
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterMsg("Thank you for subscribing! Keep an eye on your inbox.");
    setNewsletterEmail("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCommentMessage("Article link copied to clipboard!");
  };

  return (
    <main className="premium-article-page">
      <header
        className="premium-article-hero"
        style={article.coverImage?.trim() ? { backgroundImage: `url("${resolveImageUrl(article.coverImage)}")` } : undefined}
      >
        <div className="premium-article-hero-overlay"></div>
        <div className="premium-article-hero-content">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: article.category, to: `/category/${article.category.toLowerCase()}` },
              { label: article.title },
            ]}
          />
          <div className="premium-article-tags-row">
            <span className="premium-badge category-badge">{article.category}</span>
            {article.difficulty && (
              <span className="premium-badge difficulty-badge">{article.difficulty}</span>
            )}
          </div>
          <h1 className="premium-article-title">{article.title}</h1>
          <p className="premium-article-subtitle">{article.description}</p>

          <div className="premium-author-block">
            <div className="author-avatar-placeholder">
              {article.author ? article.author.charAt(0) : "A"}
            </div>
            <div className="author-info">
              <span className="author-name">
                {article.author} <FiCheckCircle className="verified-badge-icon" title="Verified Author" />
              </span>
              <span className="publish-dates">
                Published {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "Recently"}
                {article.updatedAt && ` • Updated ${new Date(article.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}`}
                {` • ${article.readingTime || "5 min read"}`}
              </span>
            </div>
          </div>

          <div className="premium-stats-bar">
            <button
              className={`stat-btn ${isLiked ? "active like-btn" : ""}`}
              type="button"
              onClick={handleLikeToggle}
            >
              <FiHeart style={isLiked ? { fill: "#ff4d4f", stroke: "#ff4d4f" } : undefined} /> {article.likes}
            </button>
            <button
              className={`stat-btn ${isBookmarked ? "active bookmark-btn" : ""}`}
              type="button"
              onClick={handleBookmarkToggle}
            >
              <FiBookmark style={isBookmarked ? { fill: "currentColor" } : undefined} /> {article.bookmarks}
            </button>
            <button
              className={`stat-btn ${isSaved ? "active save-btn" : ""}`}
              type="button"
              onClick={handleSaveToggle}
            >
              <FiBookOpen /> {isSaved ? "Saved ✓" : "Save"}
            </button>
            <span className="stat-span">
              <FiEye /> {article.views} Views
            </span>
            <button className="stat-btn" type="button" onClick={handleCopyLink}>
              <FiLink /> Share
            </button>
          </div>
        </div>
      </header>

      <div className="premium-article-layout">
        {/* Left Sidebar - Table of Contents */}
        <aside className="premium-left-sidebar">
          {headings.length > 0 && (
            <div className="sticky-sidebar-box">
              <h3>Table of Contents</h3>
              <nav className="toc-nav">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`toc-link ${activeHeading === h.id ? "active" : ""}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>

              <div className="reading-progress-box">
                <div className="progress-labels">
                  <span>Reading Progress</span>
                  <span>{Math.round(scrollProgress)}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${scrollProgress}%` }}></div>
                </div>
                <span className="time-remaining-label">
                  {Math.max(1, Math.round(((100 - scrollProgress) / 100) * parseInt(article.readingTime || "5")))} min remaining
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Center Column - Article Body */}
        <article className="premium-center-content">
          <div
            className="premium-article-prose"
            dangerouslySetInnerHTML={{ __html: processedBody }}
          ></div>

          {/* Travel specific metadata cards (rendered if location/weather fields exist) */}
          {(article.location || article.budget || article.weather) && (
            <section className="travel-details-section">
              <h3>Travel Quick Facts</h3>
              <div className="travel-meta-grid">
                {article.location && (
                  <div className="meta-card">
                    <FiCompass />
                    <strong>Location</strong>
                    <span>{article.location}</span>
                  </div>
                )}
                {article.weather && (
                  <div className="meta-card">
                    <FiActivity />
                    <strong>Weather</strong>
                    <span>{article.weather}</span>
                  </div>
                )}
                {article.budget && (
                  <div className="meta-card">
                    <FiStar />
                    <strong>Est. Budget</strong>
                    <span>{article.budget}</span>
                  </div>
                )}
                {article.bestTime && (
                  <div className="meta-card">
                    <FiCalendar />
                    <strong>Best Time to Visit</strong>
                    <span>{article.bestTime}</span>
                  </div>
                )}
              </div>
              {article.tips && (
                <div className="travel-tips-box">
                  <strong>Local Tips:</strong>
                  <p>{article.tips}</p>
                </div>
              )}
            </section>
          )}

          {/* Comments section integrated within flow */}
          <section className="premium-comments-section">
            <div className="section-heading-row">
              <h2>Comments ({approvedComments.length})</h2>
              <span>
                <FiMessageCircle />
              </span>
            </div>

            <div className="comment-list">
              {approvedComments.map((item) => (
                <article className="premium-comment-card" key={item.id}>
                  <div className="comment-header">
                    <strong>{item.name}</strong>
                    <span>{item.createdAt}</span>
                  </div>
                  <p>{item.text}</p>
                </article>
              ))}
              {approvedComments.length === 0 && (
                <p className="empty-state-comments">No approved comments yet. Be the first to share your thoughts!</p>
              )}
            </div>

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                value={comment.text}
                onChange={(event) =>
                  setComment((current) => ({ ...current, text: event.target.value }))
                }
                placeholder="Write a thoughtful comment"
                required
              ></textarea>
              <button className="primary-btn" type="submit">
                Submit Comment
              </button>
              {commentMessage && <span className="form-note">{commentMessage}</span>}
            </form>
          </section>
        </article>

        {/* Right Sidebar - Author Bio & Related Stories */}
        <aside className="premium-right-sidebar">
          <div className="sticky-sidebar-box">
            <div className="author-card">
              <div className="author-card-header">
                <div className="avatar-letter">{article.author ? article.author.charAt(0) : "A"}</div>
                <div>
                  <h4>{article.author}</h4>
                  <span>Writer & Storyteller</span>
                </div>
              </div>
              <p className="author-bio">
                Passionate developer, traveller, and compiler of meaningful stories on life, reflections, coding, and everything in between.
              </p>
              <div className="author-socials">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FiTwitter /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FiLinkedin /></a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FiFacebook /></a>
              </div>
            </div>

            <div className="right-sidebar-panel">
              <h3>Share this Story</h3>
              <div className="share-buttons-grid">
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="share-grid-btn twitter">
                  <FiTwitter /> Twitter
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="share-grid-btn linkedin">
                  <FiLinkedin /> LinkedIn
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="share-grid-btn facebook">
                  <FiFacebook /> Facebook
                </a>
                <button type="button" onClick={handleCopyLink} className="share-grid-btn copylink">
                  <FiLink /> Copy Link
                </button>
              </div>
            </div>

            {relatedArticles.length > 0 && (
              <div className="right-sidebar-panel">
                <h3>Related Stories</h3>
                <div className="related-stories-list">
                  {relatedArticles.map((item) => (
                    <Link to={`/articles/${item.slug}`} className="related-story-row" key={item.id}>
                      <div className="related-story-meta">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.readingTime || "5 min read"}</span>
                      </div>
                      <strong>{item.title}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="right-sidebar-panel newsletter-panel">
              <h3>Newsletter</h3>
              <p>Get the latest stories, incident reports, and lessons in your inbox weekly.</p>
              <form onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
                <button type="submit" className="primary-btn newsletter-btn">Subscribe</button>
              </form>
              {newsletterMsg && <span className="newsletter-msg">{newsletterMsg}</span>}
            </div>
          </div>
        </aside>
      </div>

      <LoginRequiredModal
        open={showLoginModal}
        returnTo={location}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
};

export default ArticleDetail;

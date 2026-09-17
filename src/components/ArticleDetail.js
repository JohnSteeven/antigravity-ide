import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
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
import { useReader } from "../hooks/useReader";
import { useArticleReadingProgress } from "../hooks/useArticleReadingProgress";
import { resolveImageUrl, shareArticle } from "../utils/helpers";
import { getImageUrl } from "../utils/imageUrlHelper";
import LoginRequiredModal from "./LoginRequiredModal";
import LoadingScreen from "./LoadingScreen";
import ExperienceResolver from "../experiences/ExperienceResolver";
import PremiumContentBoundary from "../features/premium/PremiumContentBoundary";
import DocumentMetadata from "./shared/DocumentMetadata";

const ArticleDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { data, incrementArticle } = useCms();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { library, applyAuthoritativeLibraryState } = useReader();
  const [comment, setComment] = useState({ text: "" });
  const [commentMessage, setCommentMessage] = useState("");
  const [commentSubmissionStatus, setCommentSubmissionStatus] = useState("idle");
  const [commentsStatus, setCommentsStatus] = useState("loading");
  const [commentsError, setCommentsError] = useState("");
  const [publicComments, setPublicComments] = useState([]);
  const [interactionFeedback, setInteractionFeedback] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  // Track direct-API fetch state for the slug lookup fallback
  const [apiArticle, setApiArticle] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const inFlightInteractions = useRef(new Set());

  useEffect(() => {
    if (!interactionFeedback) return undefined;
    const timer = window.setTimeout(() => setInteractionFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [interactionFeedback]);

  // Detail content always comes from the authoritative slug API. Shared CMS
  // context may contain Admin bodies and is never a public detail fallback.
  useEffect(() => {
    let cancelled = false;
    setApiArticle(null);
    setApiLoading(true);
    setScrollProgress(0);

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

  const article = apiArticle;

  useEffect(() => {
    const articleId = article?.id || article?._id;
    if (!articleId) return undefined;
    let cancelled = false;
    setComment({ text: "" });
    setCommentMessage("");
    setCommentSubmissionStatus("idle");
    setPublicComments([]);
    setCommentsError("");
    setCommentsStatus("loading");

    import("../services/apiService")
      .then(({ articleApi }) => articleApi.getComments(articleId))
      .then((response) => {
        if (cancelled) return;
        setPublicComments(Array.isArray(response?.comments) ? response.comments : []);
        setCommentsStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPublicComments([]);
        setCommentsError("Comments could not be loaded. Please try again later.");
        setCommentsStatus("error");
      });

    return () => { cancelled = true; };
  }, [article?.id, article?._id]);

  useArticleReadingProgress({
    articleId: article?.id || article?._id,
    enabled: Boolean(isAuthenticated && article && !article.premiumRequired),
    progressPercent: scrollProgress,
  });

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

  // Extract headings for Table of Contents (supports both H2 and H3)
  const headings = useMemo(() => {
    if (!article || !article.body) return [];
    const matches = [...article.body.matchAll(/<(h2|h3)[^>]*>(.*?)<\/ \1>/gi)];
    // Fallback if formatting has spaces in closing tag or attributes
    const cleanMatches = matches.length ? matches : [...article.body.matchAll(/<(h2|h3)[^>]*>(.*?)<\/\1>/gi)];
    return cleanMatches.map((m, index) => {
      const tag = m[1].toLowerCase();
      const text = m[2].replace(/<[^>]+>/g, "");
      const id = `heading-${index}`;
      return { id, text, level: tag === "h2" ? 2 : 3 };
    });
  }, [article]);

  // Inject IDs to headers in article body & rewrite uploads paths to absolute URL
  const processedBody = useMemo(() => {
    if (!article || !article.body) return "";
    let cleanBody = article.body.replace(/<button[^>]*class=["']?remove-image-btn["']?[^>]*>[\s\S]*?<\/button>/gi, "");
    cleanBody = cleanBody.replace(/(<(figure|div|p)[^>]*>[\s\S]*?)(?:x|×|\s)*(<\/\2>)/gi, "$1$3");
    const bodyWithAbsoluteImages = cleanBody.replace(
      /(src|href)=["'](\/?uploads[^"']*)["']/gi,
      (_match, attribute, path) => `${attribute}="${getImageUrl(path)}"`
    );
    let index = 0;
    return bodyWithAbsoluteImages.replace(/<(h2|h3)([^>]*)>/gi, (match, tag, attrs) => {
      const replacement = `<${tag} id="heading-${index}"${attrs}>`;
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
        incrementArticle(articleId, "views")
          .then((response) => {
            if (response?.views !== undefined) {
              setApiArticle((current) => current ? { ...current, views: response.views } : null);
            }
          })
          .catch(() => sessionStorage.removeItem(viewedKey));
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
    if (apiLoading) {
      return <LoadingScreen message="Loading article..." />;
    }
    // Both sources settled with no result — truly not found
    return <Navigate to="/articles" replace />;
  }

  if (article.status === "archived" || article.isArchived || article.archived) {
    const categorySlug = article.categorySlug || "experiences";
    return (
      <main className="article-detail-page article-archived-tombstone">
        <DocumentMetadata
          content={{
            ...article,
            seo: {
              title: `${article.title} (Archived)`,
              description: "This article has been archived and is no longer available.",
              metaRobots: "noindex,follow",
            },
          }}
          kind="Article"
        />
        <div className="container" style={{ maxWidth: "720px", margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
          <div className="empty-state" style={{ padding: "48px 24px", background: "var(--surface-card, #ffffff)", borderRadius: "16px", border: "1px solid var(--border-subtle, #e2e8f0)", boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))" }}>
            <span className="section-kicker" style={{ display: "inline-block", fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted, #64748b)", marginBottom: "16px" }}>
              Archived Content
            </span>
            <h1 style={{ fontSize: "2rem", marginBottom: "16px", color: "var(--text-primary, #0f172a)" }}>
              {article.title}
            </h1>
            <p style={{ fontSize: "1.1rem", color: "var(--text-secondary, #475569)", marginBottom: "32px", lineHeight: 1.6 }}>
              This article has been safely archived as part of the Phase 5 catalog refresh and its prose is no longer active.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/articles" className="primary-btn" style={{ textDecoration: "none" }}>
                Browse Current Articles
              </Link>
              <Link to={`/category/${categorySlug}`} className="secondary-btn" style={{ textDecoration: "none" }}>
                Explore {article.category || "Categories"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (article.premiumRequired) {
    return (
      <>
        <DocumentMetadata content={article} kind="Article" />
        <PremiumContentBoundary content={article} kind="Article" />
      </>
    );
  }

  const approvedComments = publicComments
    .map((c, index) => ({
      id: `${c.createdAt || "comment"}-${index}`,
      name: c.author?.displayName || c.author?.username || "Reader",
      text: c.body || "",
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now",
    }));

  const requireLogin = (action = "use this feature") => {
    if (authLoading) {
      setInteractionFeedback({ type: "status", message: "Checking your session…" });
      return false;
    }
    if (isAuthenticated) return true;
    setInteractionFeedback({ type: "error", message: `Please sign in to ${action}.` });
    setShowLoginModal(true);
    return false;
  };

  const currentArticleId = String(article?.id || article?._id || "");
  const isLiked = library.liked.some((item) => String(item.id || item._id) === currentArticleId);
  const isBookmarked = library.bookmarked.some((item) => String(item.id || item._id) === currentArticleId);
  const isSaved = library.saved.some((item) => String(item.id || item._id) === currentArticleId);

  const handleArticleInteraction = async ({
    metric,
    collection,
    action,
    activeMessage,
    inactiveMessage,
    failureMessage,
  }) => {
    if (!requireLogin(`${action} this article`)) return;

    const articleId = String(article?.id || article?._id || "");
    if (!articleId) return;

    const lockKey = `${articleId}:${metric}`;
    if (inFlightInteractions.current.has(lockKey)) return;
    inFlightInteractions.current.add(lockKey);

    // 1. Snapshot previous state
    const wasActive = collection === "liked"
      ? isLiked
      : collection === "bookmarked"
        ? isBookmarked
        : isSaved;
    const nextActive = !wasActive;
    const previousCount = Number(apiArticle?.[metric] ?? article?.[metric] ?? 0);
    const delta = nextActive ? 1 : -1;
    const optimisticCount = Math.max(0, previousCount + delta);

    // 2. Immediate optimistic updates
    setApiArticle((current) => current ? { ...current, [metric]: optimisticCount } : null);
    applyAuthoritativeLibraryState({
      collection,
      isActive: nextActive,
      article,
      userId: user?.id,
    });
    setInteractionFeedback(null);

    // 3. Asynchronous persistence
    try {
      const articleId = article.id || article._id;
      const response = await incrementArticle(articleId, metric);
      const count = Number(response?.count);
      if (
        response?.metric !== metric ||
        String(response?.articleId) !== String(articleId) ||
        typeof response?.isActive !== "boolean" ||
        !Number.isFinite(count) ||
        count < 0 ||
        String(response?.libraryItem?.id) !== String(articleId)
      ) {
        throw new Error("The server returned an invalid Article interaction response.");
      }

      setApiArticle((current) => current ? { ...current, [metric]: count } : null);
      const applied = applyAuthoritativeLibraryState({
        collection,
        isActive: response.isActive,
        article: response.libraryItem,
        userId: user?.id,
      });
      if (!applied) {
        throw Object.assign(new Error("The authenticated Reader changed before the response completed."), {
          code: "READER_SESSION_CHANGED",
        });
      }
      // Authoritative state reconciled silently. No disruptive success toast on normal toggles.
    } catch (error) {
      // 4. Rollback on failure
      setApiArticle((current) => current ? { ...current, [metric]: previousCount } : null);
      applyAuthoritativeLibraryState({
        collection,
        isActive: wasActive,
        article,
        userId: user?.id,
      });
      const message = error?.status === 401
        ? `Please sign in to ${action} this article.`
        : error?.status === 404
          ? "This Article is no longer available."
          : failureMessage;
      setInteractionFeedback({ type: "error", message });
    } finally {
      inFlightInteractions.current.delete(lockKey);
    }
  };

  const handleLikeToggle = () => handleArticleInteraction({
    metric: "likes",
    collection: "liked",
    action: "like",
    activeMessage: "Article liked.",
    inactiveMessage: "Article unliked.",
    failureMessage: "Could not update your like. Try again.",
  });

  const handleBookmarkToggle = () => handleArticleInteraction({
    metric: "bookmarks",
    collection: "bookmarked",
    action: "bookmark",
    activeMessage: "Article bookmarked.",
    inactiveMessage: "Article removed from bookmarks.",
    failureMessage: "Could not update your bookmark. Try again.",
  });

  const handleSaveToggle = () => handleArticleInteraction({
    metric: "saved",
    collection: "saved",
    action: "save",
    activeMessage: "Article saved to your profile.",
    inactiveMessage: "Article removed from saved articles.",
    failureMessage: "Could not save this article. Try again.",
  });

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!requireLogin()) return;
    if (commentSubmissionStatus === "submitting") return;

    const body = comment.text.trim();
    if (body.length < 3 || body.length > 1000) {
      setCommentSubmissionStatus("error");
      setCommentMessage("Comments must be between 3 and 1000 characters.");
      return;
    }

    const articleId = article.id || article._id;

    try {
      setCommentSubmissionStatus("submitting");
      setCommentMessage("Submitting your comment…");
      const { articleApi } = await import("../services/apiService");
      const response = await articleApi.addComment(articleId, body);
      if (response?.status !== "pending") {
        throw new Error("The server returned an invalid comment response.");
      }
      setComment({ text: "" });
      setCommentSubmissionStatus("pending-approval");
      setCommentMessage("Comment submitted successfully and is pending approval.");

      const refreshed = await articleApi.getComments(articleId).catch(() => null);
      if (Array.isArray(refreshed?.comments)) {
        setPublicComments(refreshed.comments);
        setCommentsError("");
        setCommentsStatus("ready");
      }
    } catch (error) {
      setCommentSubmissionStatus("error");
      setCommentMessage(error.message || "Please try again.");
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterMsg("Thank you for subscribing! Keep an eye on your inbox.");
    setNewsletterEmail("");
  };

  const handleCopyLink = async ({ forceCopy = false } = {}) => {
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.search = "";
    canonicalUrl.hash = "";
    const result = await shareArticle({
      title: article.title,
      url: canonicalUrl.href,
      preferNative: !forceCopy,
    });
    if (result.method === "native") {
      setInteractionFeedback({ type: "status", message: "Article shared." });
    } else if (result.method === "clipboard") {
      setInteractionFeedback({ type: "status", message: "Link copied." });
    } else if (result.method === "cancelled") {
      setInteractionFeedback({ type: "status", message: "Sharing cancelled." });
    } else {
      setInteractionFeedback({ type: "error", message: "Could not copy the link." });
    }
    return result;
  };

  return (
    <>
      <DocumentMetadata content={article} kind="Article" />
      {interactionFeedback?.message && (
        <div
          role={interactionFeedback.type === "error" ? "alert" : "status"}
          aria-live={interactionFeedback.type === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            zIndex: 1200,
            maxWidth: "min(24rem, calc(100vw - 2rem))",
            padding: "0.75rem 1rem",
            borderRadius: "0.65rem",
            background: interactionFeedback.type === "error" ? "#7f1d1d" : "#174f49",
            color: "#ffffff",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.24)",
          }}
        >
          {interactionFeedback.message}
        </div>
      )}
      <ExperienceResolver
        article={article}
        processedBody={processedBody}
        headings={headings}
        activeHeading={activeHeading}
        scrollProgress={scrollProgress}
        approvedComments={approvedComments}
        comment={{
          ...comment,
          listStatus: commentsStatus,
          listMessage: commentsError,
          submissionStatus: commentSubmissionStatus,
          isSubmitting: commentSubmissionStatus === "submitting",
        }}
        setComment={setComment}
        handleCommentSubmit={handleCommentSubmit}
        commentMessage={commentMessage}
        isLiked={isLiked}
        handleLikeToggle={handleLikeToggle}
        isBookmarked={isBookmarked}
        handleBookmarkToggle={handleBookmarkToggle}
        isSaved={isSaved}
        handleSaveToggle={handleSaveToggle}
        handleCopyLink={handleCopyLink}
        relatedArticles={relatedArticles}
        newsletterEmail={newsletterEmail}
        setNewsletterEmail={setNewsletterEmail}
        handleNewsletterSubmit={handleNewsletterSubmit}
        newsletterMsg={newsletterMsg}
      />
      <LoginRequiredModal
        open={showLoginModal}
        returnTo={location}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default ArticleDetail;

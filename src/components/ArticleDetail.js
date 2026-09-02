import { useEffect, useMemo, useState } from "react";
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
import { getFullName, resolveImageUrl, shareArticle } from "../utils/helpers";
import { getImageUrl } from "../utils/imageUrlHelper";
import LoginRequiredModal from "./LoginRequiredModal";
import LoadingScreen from "./LoadingScreen";
import ExperienceResolver from "../experiences/ExperienceResolver";
import PremiumContentBoundary from "../features/premium/PremiumContentBoundary";
import DocumentMetadata from "./shared/DocumentMetadata";

const ArticleDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { data, addComment, incrementArticle } = useCms();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { library, applyAuthoritativeLibraryState } = useReader();
  const [comment, setComment] = useState({ text: "" });
  const [commentMessage, setCommentMessage] = useState("");
  const [interactionFeedback, setInteractionFeedback] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMsg, setNewsletterMsg] = useState("");

  // Track direct-API fetch state for the slug lookup fallback
  const [apiArticle, setApiArticle] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

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

  if (article.premiumRequired) {
    return (
      <>
        <DocumentMetadata content={article} kind="Article" />
        <PremiumContentBoundary content={article} kind="Article" />
      </>
    );
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

  const currentArticleId = String(article?.id || article?._id);
  const isLiked = library.liked.some((item) => String(item.id) === currentArticleId);
  const isBookmarked = library.bookmarked.some((item) => String(item.id) === currentArticleId);
  const isSaved = library.saved.some((item) => String(item.id) === currentArticleId);

  const handleArticleInteraction = async ({
    metric,
    collection,
    action,
    activeMessage,
    inactiveMessage,
    failureMessage,
  }) => {
    if (!requireLogin(`${action} this article`)) return;
    setInteractionFeedback(null);
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
      setInteractionFeedback({
        type: "status",
        message: response.isActive ? activeMessage : inactiveMessage,
      });
    } catch (error) {
      const message = error?.status === 401
        ? `Please sign in to ${action} this article.`
        : error?.status === 404
          ? "This Article is no longer available."
          : failureMessage;
      setInteractionFeedback({ type: "error", message });
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

    const articleId = article.id || article._id;

    try {
      const nextComment = {
        name: getFullName(user),
        text: comment.text,
      };
      // AWAIT the addComment API call to catch and handle TimeoutErrors properly!
      await addComment(articleId, nextComment);
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
        comment={comment}
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

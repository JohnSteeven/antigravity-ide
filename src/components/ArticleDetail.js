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
import { getFullName, resolveImageUrl, copyToClipboard } from "../utils/helpers";
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

  // Detail content always comes from the authoritative slug API. Shared CMS
  // context may contain Admin bodies and is never a public detail fallback.
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

  const article = apiArticle;

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
      const response = await incrementArticle(articleId, "likes");
      if (response?.likes !== undefined) {
        setApiArticle((current) => current ? { ...current, likes: response.likes } : null);
      }
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
      const response = await incrementArticle(articleId, "bookmarks");
      if (response?.bookmarks !== undefined) {
        setApiArticle((current) => current ? { ...current, bookmarks: response.bookmarks } : null);
      }
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
      const response = await incrementArticle(articleId, "saved");
      if (response?.saved !== undefined) {
        setApiArticle((current) => current ? { ...current, saved: response.saved } : null);
      }
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

  const handleCopyLink = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setCommentMessage("Article link copied to clipboard!");
    } else {
      setCommentMessage("Failed to copy link.");
    }
  };

  return (
    <>
      <DocumentMetadata content={article} kind="Article" />
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

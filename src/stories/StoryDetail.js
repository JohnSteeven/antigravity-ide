import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation, Navigate, Link } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import { storyApi } from "../services/apiService";
import RelatedStories from "./components/RelatedStories";
import StoryEngine from "./components/StoryEngine";
import LegacyStoryReader from "./components/LegacyStoryReader";
import LoadingScreen from "../components/LoadingScreen";
import PremiumContentBoundary from "../features/premium/PremiumContentBoundary";
import DocumentMetadata from "../components/shared/DocumentMetadata";
import { useAuth } from "../hooks/useAuth";
import { useReader } from "../hooks/useReader";
import { useStoryReadingProgress } from "../hooks/useStoryReadingProgress";
import { shareArticle } from "../utils/helpers";
import "./stories.css";
import "./story-reader.css";

export default function StoryDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { account, library, loading: readerLoading, error: readerError, refreshReader, applyAuthoritativeLibraryState } = useReader();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirectToArticle, setRedirectToArticle] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const [navStories, setNavStories] = useState({ prev: null, next: null });
  const ownerId = user?.id || user?._id || null;
  const activeScope = `${ownerId || "public"}:${slug}`;
  const activeScopeRef = useRef(activeScope);
  activeScopeRef.current = activeScope;
  const saveInFlight = useRef(null);
  const storyId = story?._id || story?.id;
  const saved = Boolean(ownerId && (library.savedStories || []).some((item) => String(item.id) === String(storyId)));
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleScroll = () => {
      const el = document.documentElement;
      const total = (el.scrollHeight || 0) - (el.clientHeight || 0);
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useStoryReadingProgress({
    storyId,
    enabled: Boolean(ownerId && story && !story.premiumRequired),
    progressPercent: scrollProgress,
  });

  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;
    setLoading(true);
    setStory(null);
    setNavStories({ prev: null, next: null });
    setRedirectToArticle(false);
    setNotFound(false);
    setLoadError("");
    setFeedback(null);
    setCopied(false);
    setSaving(false);
    saveInFlight.current = null;

    storyApi.getBySlug(slug)
      .then((response) => {
        if (cancelled) return;
        if (!response?.article) return setNotFound(true);
        if (response.article.contentType === "article") setRedirectToArticle(true);
        else setStory(response.article);
        if (response.article.contentType === "article") return setRedirectToArticle(true);
        if (response.article.contentType === "article") {
          return setRedirectToArticle(true);
        }
        setStory(response.article);
          storyApi.list({ limit: 48 })
            .then((listRes) => {
              if (cancelled) return;
              const articles = (listRes?.articles || []).filter(
                (s) => s && (s.status === "published" || !s.status) && !s.isDeleted && (s.contentType === "story" || !s.contentType)
              );
              const currId = String(response.article._id || response.article.id || "");
              const index = articles.findIndex((s) => String(s._id || s.id) === currId || s.slug === slug);
              if (index !== -1) {
                setNavStories({
                  prev: index > 0 ? articles[index - 1] : null,
                  next: index < articles.length - 1 ? articles[index + 1] : null,
                });
              }
            })
            .catch(() => {});
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.redirect) setRedirectToArticle(true);
        else if (error?.status === 404) setNotFound(true);
        else setLoadError(error.message || "Story is unavailable. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, ownerId, authLoading, retry]);

  if (loading || authLoading) return <LoadingScreen message="Opening story..." />;
  if (loadError) {
    return (
      <main className="story-reader">
        <div className="story-reader__shell">
          <div className="empty-state">
            <p role="alert" className="empty-state__desc" style={{ color: "var(--color-danger, #9d3e32)" }}>
              {loadError}
            </p>
            <div className="empty-state__action">
              <button
                type="button"
                className="error-btn"
                onClick={() => setRetry((value) => value + 1)}
              >
                Retry Story
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
  if (redirectToArticle) return <Navigate to={`/articles/${slug}`} replace />;
  if (notFound || !story) return <Navigate to="/stories" replace />;
  if (story.premiumRequired) {
    return (
      <>
        <DocumentMetadata content={story} kind="Story" />
        <PremiumContentBoundary content={story} kind="Story" />
      </>
    );
  }

  const handleShare = async () => {
    const scope = activeScopeRef.current;
    const result = await shareArticle({ title: story.title, url: new URL(`/stories/${story.slug}`, window.location.origin).href });
    if (scope !== activeScopeRef.current) return;
    setCopied(result.method === "clipboard");
    if (result.method === "clipboard") setFeedback({ message: "Link copied." });
    else if (result.method === "native") setFeedback({ message: "Story shared." });
    else if (result.method === "failed") setFeedback({ error: true, message: "Could not share the link. Please try again." });
    else setFeedback(null);
  };

  const handleSave = async () => {
    if (!ownerId) {
      navigate("/login", { state: { from: location, message: "Sign in to save this Story." } });
      return;
    }
    const scope = activeScopeRef.current;
    if (saveInFlight.current === scope || readerLoading || !account) return;
    saveInFlight.current = scope;
    setSaving(true);
    setFeedback(null);
    try {
      const response = await storyApi.setSaved(storyId, !saved);
      const applied = applyAuthoritativeLibraryState({
        collection: "savedStories", isActive: response.isActive, article: response.libraryItem, userId: ownerId,
      });
      if (applied && scope === activeScopeRef.current) {
        setFeedback({ message: response.isActive ? "Story saved to your reading list." : "Story removed from your reading list." });
      }
    } catch (error) {
      if (scope === activeScopeRef.current) setFeedback({ error: true, message: error.message || "Could not save this Story. Please try again." });
    } finally {
      if (scope === activeScopeRef.current) {
        saveInFlight.current = null;
        setSaving(false);
      }
    }
  };

  const readerProps = {
    story,
    saved,
    copied,
    saving,
    saveDisabled: saving || Boolean(ownerId && (readerLoading || !account)),
    feedback,
    onSave: handleSave,
    onShare: handleShare,
  };
  const hasStructuredSections = Array.isArray(story.storySections) && story.storySections.length > 0;

  return (
    <main className="story-detail-route">
      <DocumentMetadata content={story} kind="Story" />
      {readerError && ownerId && <p role="alert">Your reading list is unavailable. <button type="button" onClick={refreshReader}>Retry reading list</button></p>}
      {hasStructuredSections ? <StoryEngine {...readerProps} /> : <LegacyStoryReader {...readerProps} />}

      <div className="story-reader__shell" style={{ margin: "0 auto", width: "min(100%, 860px)", padding: "0 1.5rem" }}>
        {/* Reflection questions intentionally removed — Stories are literary, not instructional. */}

        {(navStories.prev || navStories.next) && (
          <nav className="story-reader__nav" aria-label="Story navigation">
            {navStories.prev ? (
              <Link to={`/stories/${navStories.prev.slug}`} className="story-reader__nav-link story-reader__nav-link--prev">
                <span className="story-reader__nav-kicker">Previous story</span>
                <span className="story-reader__nav-title">{navStories.prev.title}</span>
              </Link>
            ) : <div />}
            {navStories.next && (
              <Link to={`/stories/${navStories.next.slug}`} className="story-reader__nav-link story-reader__nav-link--next">
                <span className="story-reader__nav-kicker">Next story</span>
                <span className="story-reader__nav-title">{navStories.next.title}</span>
              </Link>
            )}
          </nav>
        )}
      </div>

      <div className="story-reader-related">
        <RelatedStories currentStory={story} />
      </div>

      <section className="story-daily-footer" aria-label="Explore more stories">
        <div className="story-daily-footer-content">
          <span className="story-daily-footer-kicker">Story Library</span>
          <h3 className="story-daily-footer-title">Every life is a story.</h3>
          <p className="story-daily-footer-sub">Explore more stories in the library — each one a life that could have been yours.</p>
          <div className="story-daily-footer-link">
            <Link to="/stories" className="story-cta-link"><FiArrowLeft aria-hidden="true" /> Return to Stories</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

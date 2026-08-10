import React, { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { FiBookmark, FiShare2, FiArrowLeft } from "react-icons/fi";
import { storyApi } from "../services/apiService";
import RelatedStories from "./components/RelatedStories";
import { getImageUrl } from "../utils/imageUrlHelper";
import LoadingScreen from "../components/LoadingScreen";
import { cmsSeed } from "../data/cmsSeed";
import "./stories.css";

const getFallbackBySlug = (slug) => {
  const list = cmsSeed?.articles || [];
  return list.find((a) => a && a.slug === slug) || null;
};

export default function StoryDetail() {
  const { slug } = useParams();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirectToArticle, setRedirectToArticle] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStory(null);
    setRedirectToArticle(false);
    setNotFound(false);

    const handleSuccess = (res) => {
      if (cancelled) return;
      if (res && res.article) {
        if (res.article.contentType === "article") {
          setRedirectToArticle(true);
        } else {
          setStory(res.article);
        }
      } else {
        const fallback = getFallbackBySlug(slug);
        if (fallback) {
          setStory(fallback);
        } else {
          setNotFound(true);
        }
      }
    };

    const handleFallback = () => {
      if (cancelled) return;
      const fallback = getFallbackBySlug(slug);
      if (fallback) {
        setStory(fallback);
      } else {
        setNotFound(true);
      }
    };

    if (storyApi && typeof storyApi.getBySlug === "function") {
      storyApi
        .getBySlug(slug)
        .then(handleSuccess)
        .catch((err) => {
          if (cancelled) return;
          if (err && err.redirect) {
            // Server says this slug is an article, not a story
            const redirectSlug = (err.article && err.article.slug) || slug;
            setRedirectToArticle(true);
            // store the correct slug in case it differs
            if (redirectSlug !== slug) {
              window.location.replace(`/articles/${redirectSlug}`);
            }
          } else {
            fetch(`/api/stories/${slug}`)
              .then((r) => r.json())
              .then(handleSuccess)
              .catch(handleFallback);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      fetch(`/api/stories/${slug}`)
        .then((r) => r.json())
        .then(handleSuccess)
        .catch(handleFallback)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <LoadingScreen message="Opening story..." />;
  }

  if (redirectToArticle) {
    return <Navigate to={`/articles/${slug}`} replace />;
  }

  if (notFound || !story) {
    return <Navigate to="/stories" replace />;
  }

  const imageUrl = getImageUrl(story.coverImage || story.image);
  const readingTime = story.readingTime || `${story.readingTimeMin || 8} min read`;
  const formattedDate = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "August 10, 2026";

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <main className="story-detail-page">
      <div className="story-detail-container">
        <nav className="story-detail-nav" aria-label="Breadcrumb">
          <Link to="/stories" className="story-back-link">
            <FiArrowLeft aria-hidden="true" /> Back to Stories
          </Link>
        </nav>

        <header className="story-detail-header">
          <div className="story-detail-meta-bar">
            <span className="story-detail-kicker">STORY</span>
            <span className="story-detail-meta-sep">·</span>
            <span className="story-detail-readtime">{readingTime.toUpperCase()}</span>
            <span className="story-detail-meta-sep">·</span>
            <span className="story-detail-date">{formattedDate.toUpperCase()}</span>
          </div>
          <h1 className="story-detail-title">{story.title || "Untitled Story"}</h1>
          {story.description && <p className="story-detail-subtitle">{story.description}</p>}
        </header>



        {/* Reader-First Reading Column — image floats right beside opening prose */}
        <div className="story-reading-column">
          {imageUrl && (
            <div className="story-intro-image-wrap">
              <img
                src={imageUrl}
                alt={story.title || "Story"}
                className="story-intro-image"
              />
            </div>
          )}
          <article
            className="story-prose"
            dangerouslySetInnerHTML={{ __html: story.body || "<p></p>" }}
          />
          {/* Clear the float before ending box and actions */}
          <div className="story-float-clear" />

          {/* Story Ending */}
          <div className="story-ending-box">
            <div className="story-scene-break">• • •</div>
            <div className="story-ending-label">The End</div>

            {(story.reflection || story.takeaway) && (
              <div className="story-reflection-aside">
                <div className="story-reflection-title">A THOUGHT TO CARRY WITH YOU</div>
                <p className="story-reflection-text">
                  {story.reflection || story.takeaway}
                </p>
              </div>
            )}
          </div>

          {/* Save / Share Action Bar */}
          <div className="story-actions-bar">
            <button
              type="button"
              className={`story-action-btn ${saved ? "saved" : ""}`}
              onClick={() => setSaved(!saved)}
              aria-label="Save story"
            >
              <FiBookmark style={{ fill: saved ? "currentColor" : "none" }} />
              {saved ? "Saved to Reading List" : "Save Story"}
            </button>

            <button type="button" className="story-action-btn" onClick={handleShare} aria-label="Share story">
              <FiShare2 />
              {copied ? "Link Copied!" : "Share Story"}
            </button>
          </div>

          {/* Related Stories */}
          <RelatedStories currentStory={story} />
        </div>
      </div>

      {/* DAILY RETURN FOOTER */}
      <section className="story-daily-footer" aria-label="Daily Return Invitation">
        <div className="story-daily-footer-content">
          <span className="story-daily-footer-kicker">DAILY DISCOVERY</span>
          <h3 className="story-daily-footer-title">Come back tomorrow.</h3>
          <p className="story-daily-footer-sub">A new story is waiting every day.</p>
          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/stories" className="story-cta-link">
              Return to Stories <FiArrowLeft style={{ transform: "rotate(180deg)" }} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

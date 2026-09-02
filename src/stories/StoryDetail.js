import React, { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import { storyApi } from "../services/apiService";
import RelatedStories from "./components/RelatedStories";
import StoryEngine from "./components/StoryEngine";
import LegacyStoryReader from "./components/LegacyStoryReader";
import LoadingScreen from "../components/LoadingScreen";
import PremiumContentBoundary from "../features/premium/PremiumContentBoundary";
import DocumentMetadata from "../components/shared/DocumentMetadata";
import "./stories.css";

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

    storyApi.getBySlug(slug)
      .then((response) => {
        if (cancelled) return;
        if (!response?.article) return setNotFound(true);
        if (response.article.contentType === "article") setRedirectToArticle(true);
        else setStory(response.article);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.redirect) setRedirectToArticle(true);
        else setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingScreen message="Opening story..." />;
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
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      setCopied(false);
    }
  };

  const readerProps = {
    story,
    saved,
    copied,
    onSave: () => setSaved((current) => !current),
    onShare: handleShare,
  };
  const hasStructuredSections = Array.isArray(story.storySections) && story.storySections.length > 0;

  return (
    <main className="story-detail-route">
      <DocumentMetadata content={story} kind="Story" />
      {hasStructuredSections ? <StoryEngine {...readerProps} /> : <LegacyStoryReader {...readerProps} />}

      <div className="story-reader-related">
        <RelatedStories currentStory={story} />
      </div>

      <section className="story-daily-footer" aria-label="Daily return invitation">
        <div className="story-daily-footer-content">
          <span className="story-daily-footer-kicker">Daily discovery</span>
          <h3 className="story-daily-footer-title">Come back tomorrow.</h3>
          <p className="story-daily-footer-sub">A new story is waiting every day.</p>
          <div className="story-daily-footer-link">
            <Link to="/stories" className="story-cta-link"><FiArrowLeft aria-hidden="true" /> Return to Stories</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

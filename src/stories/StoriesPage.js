import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router";
import StoryHero from "./components/StoryHero";
import FeaturedStory from "./components/FeaturedStory";
import StoryCard from "./components/StoryCard";
import { storyApi } from "../services/apiService";
import { getImageUrl } from "../utils/imageUrlHelper";
import storyMedia from "./storyMedia.cjs";
import { cmsSeed } from "../data/cmsSeed";
import "./stories.css";

const INITIAL_VISIBLE = 6;
const LOAD_MORE_COUNT = 6;
const { resolveStoryPrimaryImage } = storyMedia;

const getFallbackStories = () => {
  const list = cmsSeed?.articles || [];
  return list.filter((a) => a && (a.contentType === "story" || a.category === "Stories"));
};

export default function StoriesPage() {
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const fetchStories = useCallback(() => {
    setLoading(true);

    const handleData = (data) => {
      if (data && Array.isArray(data.articles) && data.articles.length > 0) {
        const filtered = data.articles.filter((a) => a && (a.contentType === "story" || !a.contentType));
        setAllStories(filtered.length > 0 ? filtered : getFallbackStories());
      } else {
        setAllStories(getFallbackStories());
      }
    };

    if (storyApi && typeof storyApi.list === "function") {
      storyApi
        .list({ limit: 1000 })
        .then(handleData)
        .catch(() => {
          fetch("/api/stories")
            .then((r) => r.json())
            .then(handleData)
            .catch(() => setAllStories(getFallbackStories()));
        })
        .finally(() => setLoading(false));
    } else {
      fetch("/api/stories")
        .then((r) => r.json())
        .then(handleData)
        .catch(() => setAllStories(getFallbackStories()))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    try {
      fetchStories();
    } catch (e) {
      console.error("Error fetching stories:", e);
      setLoading(false);
    }
  }, [fetchStories]);

  // Featured Story: first featured story or first story in list
  const featuredStory = useMemo(() => {
    if (!allStories || !allStories.length) return null;
    return allStories.find((s) => s && s.isFeatured) || allStories[0];
  }, [allStories]);

  // Remaining stories excluding featured
  const remainingStories = useMemo(() => {
    if (!featuredStory || !allStories) return allStories || [];
    return allStories.filter(
      (s) => s && (s.id || s._id) !== (featuredStory.id || featuredStory._id)
    );
  }, [allStories, featuredStory]);

  // "Stories You May Have Missed": 3 previous stories
  const missedStories = useMemo(() => {
    return remainingStories.slice(0, 3);
  }, [remainingStories]);

  // "Tonight's Read": 4th story
  const tonightStory = useMemo(() => {
    return remainingStories[3] || null;
  }, [remainingStories]);
  const tonightMedia = tonightStory ? resolveStoryPrimaryImage(tonightStory, { preferCover: true }) : null;
  const tonightImage = getImageUrl(tonightMedia?.src);

  // "Latest Stories": 5th story onwards
  const latestStories = useMemo(() => {
    return remainingStories.slice(4);
  }, [remainingStories]);

  return (
    <main className="stories-page" aria-label="Stories destination">
      <StoryHero />

      {/* TODAY'S STORY (Centerpiece) */}
      {featuredStory && <FeaturedStory story={featuredStory} />}

      {/* STORIES YOU MAY HAVE MISSED */}
      {missedStories.length > 0 && (
        <section className="story-grid-section story-section-missed">
          <header className="story-section-header">
            <h2 className="story-section-title">Stories You May Have Missed</h2>
          </header>
          <div className="story-grid">
            {missedStories.map((story) => (
              <StoryCard key={story.id || story._id || story.slug} story={story} />
            ))}
          </div>
        </section>
      )}

      {/* TONIGHT'S READ (Atmospheric Editorial Section) */}
      {tonightStory && (
        <section className="tonight-story-section" aria-label="Tonight's Read">
          <div className={`tonight-story-layout${tonightImage ? "" : " tonight-story-layout--text-only"}`}>
            <div className="tonight-story-content">
              <span className="tonight-story-kicker">TONIGHT'S READ</span>
              <h2 className="tonight-story-heading">A story to slow down with before the day ends.</h2>

              <Link to={`/stories/${tonightStory.slug}`} className="tonight-story-title">
                {tonightStory.title || "Untitled Story"}
              </Link>
              {tonightStory.description && (
                <p className="tonight-story-teaser">{tonightStory.description}</p>
              )}
              <div className="tonight-story-footer">
                <span className="story-meta-time">
                  {tonightStory.readingTime || `${tonightStory.readingTimeMin || 10} min read`}
                </span>
                <Link to={`/stories/${tonightStory.slug}`} className="story-cta-link story-cta-light">
                  Read tonight's story <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>

            {tonightImage && (
              <Link
                to={`/stories/${tonightStory.slug}`}
                className="tonight-story-image-wrap"
                aria-label={tonightStory.title || "Story"}
              >
                <img
                  src={tonightImage}
                  alt={tonightMedia?.alt || ""}
                  className="tonight-story-image"
                  loading="lazy"
                  width="640"
                  height="480"
                />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* LATEST STORIES */}
      {latestStories.length > 0 && (
        <section className="story-grid-section story-section-latest">
          <header className="story-section-header">
            <h2 className="story-section-title">Latest Stories</h2>
            <p className="story-section-sub">Recently added to MyJourney Stories.</p>
          </header>
          <div className="story-grid">
            {latestStories.slice(0, visibleCount).map((story) => (
              <StoryCard key={story.id || story._id || story.slug} story={story} />
            ))}
          </div>

          {visibleCount < latestStories.length && (
            <div className="story-load-more-wrap">
              <button
                className="story-load-more-btn"
                type="button"
                onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
              >
                Load More Stories
              </button>
            </div>
          )}
        </section>
      )}

      {!loading && allStories.length === 0 && (
        <p className="stories-empty-message">No stories published yet.</p>
      )}

      {/* DAILY RETURN FOOTER */}
      <section className="story-daily-footer" aria-label="Daily Return Invitation">
        <div className="story-daily-footer-content">
          <span className="story-daily-footer-kicker">DAILY DISCOVERY</span>
          <h3 className="story-daily-footer-title">Come back tomorrow.</h3>
          <p className="story-daily-footer-sub">A new story is waiting every day.</p>
        </div>
      </section>
    </main>
  );
}

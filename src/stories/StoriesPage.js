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

  const [selectedCategory, setSelectedCategory] = useState("All");

  // Derive top-level categories from published story.category only — not tags.
  // Tags are available for search/discovery but must not appear as filter chips.
  const categories = useMemo(() => {
    const set = new Set();
    allStories.forEach((s) => {
      if (s.category && s.category !== "Stories") set.add(s.category);
    });
    const list = Array.from(set).filter(Boolean).slice(0, 10);
    return ["All", ...(list.length > 0 ? list : ["Life", "Family", "Friendship"])];
  }, [allStories]);

  const filteredStories = useMemo(() => {
    if (selectedCategory === "All") return allStories;
    return allStories.filter(
      (s) => s.category === selectedCategory || (Array.isArray(s.tags) && s.tags.includes(selectedCategory))
    );
  }, [allStories, selectedCategory]);

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

      {/* Dynamic Category / Theme filter pills */}
      <nav className="story-category-filters" aria-label="Filter stories by category or theme">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`story-category-pill${selectedCategory === cat ? " active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
            aria-pressed={selectedCategory === cat}
          >
            {cat}
          </button>
        ))}
      </nav>

      {selectedCategory !== "All" ? (
        <section className="story-grid-section" aria-label={`Stories in ${selectedCategory}`}>
          <header className="story-section-header">
            <h2 className="story-section-title">Stories in &ldquo;{selectedCategory}&rdquo;</h2>
            <p className="story-section-sub">{filteredStories.length} {filteredStories.length === 1 ? "story" : "stories"} found.</p>
          </header>
          {filteredStories.length > 0 ? (
            <div className="story-grid">
              {filteredStories.map((story) => (
                <StoryCard key={story.id || story._id || story.slug} story={story} />
              ))}
            </div>
          ) : (
            <p className="stories-empty-message">No stories found in this category.</p>
          )}
        </section>
      ) : (
        <>
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

      {/* A STORY TO SLOW DOWN WITH (Atmospheric Editorial Section) */}
      {tonightStory && (
        <section className="tonight-story-section" aria-label="A Story to Slow Down With">
          <div className={`tonight-story-layout${tonightImage ? "" : " tonight-story-layout--text-only"}`}>
            <div className="tonight-story-content">
              <span className="tonight-story-kicker">A STORY TO SLOW DOWN WITH</span>
              <h2 className="tonight-story-heading">A story to read when the world can wait.</h2>

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
                  Read this story <FiArrowRight aria-hidden="true" />
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
        </>
      )}

      {/* STORY LIBRARY FOOTER */}
      <section className="story-daily-footer" aria-label="Story library">
        <div className="story-daily-footer-content">
          <span className="story-daily-footer-kicker">STORY LIBRARY</span>
          <h3 className="story-daily-footer-title">Every story is a life that could have been yours.</h3>
          <p className="story-daily-footer-sub">Take your time. The library is always here.</p>
        </div>
      </section>
    </main>
  );
}

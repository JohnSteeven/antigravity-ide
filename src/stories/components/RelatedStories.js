import React, { useEffect, useState } from "react";
import StoryCard from "./StoryCard";
import { storyApi } from "../../services/apiService";
import { cmsSeed } from "../../data/cmsSeed";

const getFallbackRelated = (currentStory) => {
  const articles = cmsSeed?.articles || [];
  return articles
    .filter(
      (s) =>
        s &&
        (s.id || s._id) !== (currentStory?.id || currentStory?._id) &&
        s.slug !== currentStory?.slug &&
        (s.contentType === "story" || s.category === "Stories")
    )
    .slice(0, 3);
};

export default function RelatedStories({ currentStory }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStory) return;
    let cancelled = false;
    setLoading(true);

    const handleData = (res) => {
      if (cancelled) return;
      if (res && Array.isArray(res.articles) && res.articles.length > 0) {
        const candidates = res.articles.filter(
          (s) =>
            s &&
            (s.id || s._id) !== (currentStory.id || currentStory._id) &&
            s.slug !== currentStory.slug &&
            (s.contentType === "story" || !s.contentType)
        );
        setRelated(candidates.length > 0 ? candidates.slice(0, 3) : getFallbackRelated(currentStory));
      } else {
        setRelated(getFallbackRelated(currentStory));
      }
    };

    const handleFallback = () => {
      if (!cancelled) setRelated(getFallbackRelated(currentStory));
    };

    if (storyApi && typeof storyApi.list === "function") {
      storyApi
        .list({ limit: 12 })
        .then(handleData)
        .catch(() => {
          fetch("/api/stories")
            .then((r) => r.json())
            .then(handleData)
            .catch(handleFallback);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      fetch("/api/stories")
        .then((r) => r.json())
        .then(handleData)
        .catch(handleFallback)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [currentStory]);

  if (loading || !related || related.length === 0) return null;

  return (
    <section className="related-stories-wrap" aria-label="Keep Reading">
      <div className="related-stories-header">
        <h2 className="related-stories-title">Keep reading</h2>
        <span className="related-stories-sub">Handpicked stories for your quiet moments.</span>
      </div>

      <div className="story-grid">
        {related.map((story) => (
          <StoryCard key={story.id || story._id || story.slug} story={story} />
        ))}
      </div>
    </section>
  );
}

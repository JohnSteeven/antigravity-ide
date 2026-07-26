import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const getVisibleCount = () => {
  if (typeof window === "undefined") {
    return 5;
  }

  if (window.innerWidth <= 550) return 1;
  if (window.innerWidth <= 1023) return 2;
  if (window.innerWidth <= 1279) return 3;
  if (window.innerWidth <= 1599) return 4;
  return 5;
};

const FeaturedArticles = () => {
  const { data } = useCms();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const [apiArticles, setApiArticles] = useState(null);

  // Fetch featured articles from the API
  useEffect(() => {
    let cancelled = false;

    articleApi
      .list({ status: "published", isFeatured: "true", limit: 20 })
      .then((res) => {
        if (!cancelled && Array.isArray(res.articles)) {
          setApiArticles(res.articles);
        }
      })
      .catch(() => {
        if (!cancelled) setApiArticles(null);
      });

    return () => { cancelled = true; };
  }, []);

  // Prefer API articles; fall back to CmsContext
  const featuredArticles = useMemo(() => {
    let list = (apiArticles && Array.isArray(apiArticles) && apiArticles.length > 0)
      ? apiArticles
      : (data.articles || []);

    const filtered = list.filter((article) => {
      const isPub = String(article.status || "published").toLowerCase() === "published";
      const isFeat = article.isFeatured || article.featured;
      return isPub && isFeat;
    });

    // If no specific articles are flagged as featured yet, fall back to top published articles
    if (!filtered.length) {
      return list.filter((article) => String(article.status || "published").toLowerCase() === "published");
    }

    return filtered;
  }, [apiArticles, data.articles]);

  useEffect(() => {
    const updateCount = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  const move = (direction) => {
    if (!featuredArticles.length) return;
    setCurrentIndex((index) =>
      (index + direction + featuredArticles.length) % featuredArticles.length
    );
  };

  const visibleArticles = featuredArticles.length > 0
    ? Array.from(
        { length: visibleCount },
        (_, offset) => featuredArticles[(currentIndex + offset) % featuredArticles.length]
      )
    : [];

  return (
    <section className="featured" id="featured">
      <div className="featured-top">
        <div>
          <span className="section-kicker">Must read</span>
          <h2 className="featured-heading">Featured Articles</h2>
        </div>

        <div className="carousel-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous featured articles"
          >
            <FiChevronLeft />
          </button>

          <button
            className="icon-btn"
            type="button"
            onClick={() => move(1)}
            aria-label="Next featured articles"
          >
            <FiChevronRight />
          </button>

          <Link className="featured-btn" to="/articles?featured=true">
            View All Articles
          </Link>
        </div>
      </div>

      <div className="article-grid featured-carousel">
        {visibleArticles.map((article) => (
          <ArticlesCard articleData={article} key={article.id || article._id} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedArticles;

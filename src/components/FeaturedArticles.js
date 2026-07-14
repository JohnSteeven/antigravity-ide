import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const getVisibleCount = () => {
  if (typeof window === "undefined") {
    return 4;
  }

  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 900) return 2;
  if (window.innerWidth < 1200) return 3;
  return 4;
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
      .list({ status: "published", featured: "true", limit: 20 })
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
    if (apiArticles) {
      return apiArticles.filter((a) => (a.rating || 0) >= 3.5);
    }
    return data.articles.filter(
      (article) =>
        article.status === "published" &&
        (article.isFeatured || article.featured) &&
        article.rating >= 3.5
    );
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

  const visibleArticles = Array.from(
    { length: Math.min(visibleCount, featuredArticles.length) },
    (_, offset) => featuredArticles[(currentIndex + offset) % featuredArticles.length]
  );

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

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const getVisibleCount = () => {
  if (typeof window === "undefined") return 5;
  const w = window.innerWidth;
  if (w <= 480) return 1;
  if (w <= 768) return 2;
  if (w <= 1100) return 3;
  if (w <= 1440) return 4;
  if (w <= 1920) return 5;
  return 6;
};

const ArticlesBody = () => {
  const { data } = useCms();
  const [apiArticles, setApiArticles] = useState(null);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);

  // Fetch the latest published articles from the API
  useEffect(() => {
    let cancelled = false;

    articleApi
      .list({ status: "published", sort: "latest", limit: 25 })
      .then((res) => {
        if (!cancelled && Array.isArray(res.articles)) {
          setApiArticles(res.articles);
        }
      })
      .catch(() => {
        // API unavailable — fall back to CmsContext data
        if (!cancelled) setApiArticles(null);
      });

    return () => { cancelled = true; };
  }, []);

  // Responsive breakpoint listener
  useEffect(() => {
    const updateCount = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  // Prefer API articles; fall back to CmsContext if the API isn't available
  const articles = (apiArticles && Array.isArray(apiArticles) && apiArticles.length > 0)
    ? apiArticles.slice(0, visibleCount)
    : (data.articles || [])
        .filter((a) => String(a.status || "published").toLowerCase() === "published")
        .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0))
        .slice(0, visibleCount);

  return (
    <section className="articles-body homepage-latest-articles" id="latest-articles">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Latest stories</span>
          <h2>Fresh From The Journal</h2>
        </div>

        <Link to="/articles" className="text-link">
          Browse all articles
        </Link>
      </div>

      <div className="article-grid homepage-articles-grid">
        {articles.map((article) => (
          <ArticlesCard articleData={article} key={article.id || article._id} />
        ))}
      </div>
    </section>
  );
};

export default ArticlesBody;

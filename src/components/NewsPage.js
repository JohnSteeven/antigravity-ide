import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FiSearch, FiRefreshCw, FiAlertCircle, FiExternalLink, FiGlobe, FiBookmark } from "react-icons/fi";
import { newsApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const NEWS_CATEGORIES = [
  { id: "world", label: "World" },
  { id: "technology", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "business", label: "Business" },
  { id: "politics", label: "Politics" },
  { id: "health", label: "Health" },
  { id: "sports", label: "Sports" }
];

export default function NewsPage({ category }) {
  const [activeCategory, setActiveCategory] = useState("world");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [selectedSource, setSelectedSource] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Responsive initial count: mobile=2, tablet=4, desktop=4
  const getInitialCount = () => {
    const w = window.innerWidth;
    if (w <= 600) return 2;
    if (w <= 900) return 4;
    return 4;
  };
  const [visibleCount, setVisibleCount] = useState(getInitialCount);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch news data
  const loadNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await newsApi.list({
        category: activeCategory,
        q: debouncedQuery
      });

      if (res && Array.isArray(res.articles)) {
        setArticles(res.articles);
        
        // Report impressions to server analytics
        if (res.articles.length > 0) {
          const counts = {};
          res.articles.forEach(a => {
            const pub = a.source || "Global Press";
            counts[pub] = (counts[pub] || 0) + 1;
          });
          const payload = Object.entries(counts).map(([publisher, count]) => ({
            publisher,
            category: activeCategory,
            count
          }));
          newsApi.trackImpression({ impressions: payload }).catch(() => {});
        }
      } else {
        throw new Error("Invalid news response format");
      }
    } catch (err) {
      console.error("Error loading news feed:", err);
      setError("Unable to update live news. Showing offline fallback articles.");
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, debouncedQuery]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Collect unique sources from the loaded articles
  const uniqueSources = useMemo(() => {
    const sources = articles.map(a => a.source).filter(Boolean);
    return [...new Set(sources)].sort();
  }, [articles]);

  // Filter and sort articles in-memory
  const filteredAndSortedArticles = useMemo(() => {
    let list = [...articles];

    // Filter by source
    if (selectedSource && selectedSource !== "all") {
      list = list.filter(a => a.source === selectedSource);
    }

    // Sort by order
    if (sortOrder === "latest") {
      list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sortOrder === "oldest") {
      list.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    } else if (sortOrder === "alphabetical") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [articles, selectedSource, sortOrder]);

  // Extract featured hero article (first article) and subsequent articles
  const heroArticle = filteredAndSortedArticles.length > 0 ? filteredAndSortedArticles[0] : null;
  const gridArticles = filteredAndSortedArticles.length > 1 ? filteredAndSortedArticles.slice(1) : [];

  // Click tracker for featured story
  const handleHeroClick = () => {
    if (heroArticle) {
      newsApi.trackClick({
        articleId: heroArticle.id || heroArticle._id || heroArticle.url,
        title: heroArticle.title,
        publisher: heroArticle.source || "Global Press",
        category: activeCategory,
        url: heroArticle.url
      }).catch(() => {});
    }
  };

  // Render Skeleton Cards
  const renderSkeletons = () => (
    <div className="article-grid">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div className="news-skeleton-card" key={i}>
          <div className="news-skeleton-img" />
          <div className="news-skeleton-text-block">
            <div className="news-skeleton-line" style={{ width: "35%" }} />
            <div className="news-skeleton-line" style={{ width: "95%", height: "20px" }} />
            <div className="news-skeleton-line" style={{ width: "85%", height: "20px" }} />
            <div className="news-skeleton-line" style={{ width: "45%", marginTop: "auto" }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="news-page listing-page">
      {/* Editorial Header */}
      <section className="listing-hero news-header-section">
        <span className="section-kicker">Global Journal</span>
        <h1 style={{ display: "inline-flex", alignItems: "center", gap: "14px" }}>
          <FiGlobe style={{ color: "#426C67" }} /> World News Reader
        </h1>
        <p>
          Curated international briefing, delivering global events directly to your personal portal.
        </p>
      </section>

      {/* Breaking News Ticker */}
      <section className="news-ticker-band" aria-label="Breaking news ticker">
        <div className="news-ticker-label">Breaking</div>
        <div className="news-ticker-wrapper">
          <div className="news-ticker-content">
            {articles.slice(0, 5).map((art, idx) => (
              <a
                key={art.id || idx}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-ticker-item"
              >
                <span className="news-ticker-dot">✦</span>
                <strong>{art.source}:</strong> {art.title}
              </a>
            ))}
            {articles.slice(0, 5).map((art, idx) => (
              <a
                key={`dup-${art.id || idx}`}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-ticker-item"
              >
                <span className="news-ticker-dot">✦</span>
                <strong>{art.source}:</strong> {art.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="news-container">
        {/* Sticky Premium Editorial Toolbar */}
        <div className="news-sticky-toolbar">
          {/* Row 1: Category Chips */}
          <nav className="news-category-filters" aria-label="News categories" style={{ margin: 0, border: "none", padding: 0 }}>
            {NEWS_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setArticles([]);
                  setSelectedSource("all"); // Reset source filter on category change
                  setVisibleCount(getInitialCount()); // Reset pagination
                }}
                className={`news-filter-btn ${activeCategory === cat.id ? "active" : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Row 2: Search, Source Filter, Sort Filter, Refresh */}
          <div className="news-toolbar-controls">
            <label className="search-control" style={{ flex: 1, margin: 0 }}>
              <FiSearch />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search global headlines..."
              />
            </label>

            <div className="news-select-wrapper">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="news-toolbar-select"
              >
                <option value="all">All Publishers</option>
                {uniqueSources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            <div className="news-select-wrapper">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="news-toolbar-select"
              >
                <option value="latest">Latest Headlines</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            <button
              onClick={() => loadNews(true)}
              className="news-filter-btn refresh-btn"
              disabled={refreshing}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiRefreshCw className={refreshing ? "spin-animation" : ""} />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Alerts & Notifications */}
        {error && (
          <div className="cms-alert cms-alert-danger" style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          renderSkeletons()
        ) : (
          <>
            {/* Featured story card layout */}
            {heroArticle && !searchQuery && selectedSource === "all" && (
              <section className="news-featured-hero" aria-label="Featured Story">
                <div className="news-hero-image-col">
                  <a
                    href={heroArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleHeroClick}
                  >
                    <img
                      src={heroArticle.image}
                      alt={heroArticle.title}
                      className="news-hero-img"
                    />
                    <span className="news-source-tag">{heroArticle.source}</span>
                  </a>
                </div>

                <div className="news-hero-content-col">
                  <span className="news-hero-badge">Featured Story</span>
                  <h2 className="news-hero-title">
                    <a
                      href={heroArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleHeroClick}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
                    >
                      {heroArticle.title} <FiExternalLink className="external-icon" style={{ fontSize: "1.4rem" }} />
                    </a>
                  </h2>
                  <div className="news-hero-meta">
                    <span className="news-hero-source">{heroArticle.source}</span>
                    <span>•</span>
                    <span>{heroArticle.readingTime || "3 min read"}</span>
                    <span>•</span>
                    <span>{new Date(heroArticle.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                  <p className="news-hero-excerpt">{heroArticle.description}</p>
                  
                  <a
                    href={heroArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleHeroClick}
                    className="news-hero-link"
                  >
                    Read original coverage <FiBookmark />
                  </a>
                </div>
              </section>
            )}

            {/* Latest headlines grid */}
            {filteredAndSortedArticles.length === 0 ? (
              <div className="cms-panel" style={{ padding: "4rem", textAlign: "center" }}>
                <FiGlobe style={{ fontSize: "3rem", color: "#b8aa9a", marginBottom: "1rem" }} />
                <h3>No News Found</h3>
                <p>Try resetting filters or checking your search query.</p>
              </div>
            ) : (() => {
              const displayList = searchQuery || selectedSource !== "all"
                ? filteredAndSortedArticles
                : gridArticles;
              const visibleArticles = displayList.slice(0, visibleCount);
              const hasMore = visibleCount < displayList.length;
              const remaining = displayList.length - visibleCount;

              return (
                <>
                  <section className="article-grid" style={{ marginTop: "20px" }}>
                    {visibleArticles.map((art) => (
                      <ArticlesCard key={art.id || art._id} articleData={art} />
                    ))}
                  </section>

                  {hasMore && (
                    <div className="news-view-more-row">
                      <button
                        type="button"
                        className="news-view-more-btn"
                        onClick={() => setVisibleCount((c) => c + 4)}
                      >
                        View More News
                        <span className="news-view-more-count">+{remaining} article{remaining !== 1 ? "s" : ""}</span>
                      </button>
                    </div>
                  )}

                  {!hasMore && displayList.length > getInitialCount() && (
                    <div className="news-view-more-row">
                      <button
                        type="button"
                        className="news-view-more-btn news-view-more-btn--collapse"
                        onClick={() => setVisibleCount(getInitialCount())}
                      >
                        Show Less
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </main>
  );
}

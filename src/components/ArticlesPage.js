import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FiChevronDown, FiFilter, FiSearch, FiTag } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const PAGE_SIZE = 12;

const ArticlesPage = () => {
  const { data } = useCms();
  const [searchParams] = useSearchParams();
  const showFeatured = searchParams.get("featured") === "true";

  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [showFeatured]);

  useEffect(() => {
    let cancelled = false;
    const fetchArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: PAGE_SIZE, sort };
        if (showFeatured) params.featured = "true";
        if (search) params.search = search;
        if (category !== "all") params.category = category;
        if (tag !== "all") params.tags = tag;

        const response = await articleApi.list(params);
        if (cancelled) return;

        const nextArticles = Array.isArray(response?.articles) ? response.articles : [];
        setArticles((current) => {
          if (page === 1) return nextArticles;
          const known = new Set(current.map((item) => String(item.id || item._id)));
          return [...current, ...nextArticles.filter((item) => !known.has(String(item.id || item._id)))];
        });
        setPagination(response?.pagination || { page, pages: page, total: nextArticles.length });
      } catch (requestError) {
        if (cancelled) return;
        if (page === 1) setArticles([]);
        setError(requestError?.message || "Articles are temporarily unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchArticles();
    return () => {
      cancelled = true;
    };
  }, [category, page, retryToken, search, showFeatured, sort, tag]);

  const categories = useMemo(() => {
    const order = ["life", "reflections", "incidents", "lessons", "travel", "news", "coding"];
    return [...(data?.categories || [])].sort((a, b) => {
      const keyA = String(a.slug || a.name || "").toLowerCase();
      const keyB = String(b.slug || b.name || "").toLowerCase();
      const indexA = order.indexOf(keyA);
      const indexB = order.indexOf(keyB);
      if (indexA === -1 && indexB === -1) return String(a.name || "").localeCompare(String(b.name || ""));
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [data?.categories]);

  const tags = useMemo(() => {
    const values = (data?.tags || [])
      .map((item) => typeof item === "string" ? item : item.name || item.slug)
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [data?.tags]);

  const resetPage = useCallback((setter, value) => {
    setter(value);
    setPage(1);
  }, []);

  const canLoadMore = !loading && !error && page < Number(pagination.pages || 1);

  return (
    <main className="listing-page articles-page">
      <header className="listing-hero articles-hero">
        <span className="section-kicker">ARTICLE LIBRARY</span>
        <h1>{showFeatured ? "Featured Articles" : "All Articles"}</h1>
        <p className="listing-subtitle">
          Explore ideas, experiences, reflections and lessons from MyJourney.
        </p>
      </header>

      <section className="article-controls articles-toolbar" aria-label="Article filters">
        <div className="toolbar-item search-control">
          <FiSearch className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles by title, topic, or keyword…"
            aria-label="Search articles by title, topic, or keyword"
          />
        </div>

        <div className="toolbar-item select-control category-control">
          <FiFilter className="control-icon" aria-hidden="true" />
          <select
            className="toolbar-select"
            value={category}
            aria-label="Filter by category"
            onChange={(event) => resetPage(setCategory, event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option value={item.name} key={item.id || item._id || item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <FiChevronDown className="select-chevron" aria-hidden="true" />
        </div>

        <div className="toolbar-item select-control tag-control">
          <FiTag className="control-icon" aria-hidden="true" />
          <select
            className="toolbar-select"
            value={tag}
            aria-label="Filter by tag"
            onChange={(event) => resetPage(setTag, event.target.value)}
          >
            <option value="all">All tags</option>
            {tags.map((item) => (
              <option value={item} key={item}>
                #{item}
              </option>
            ))}
          </select>
          <FiChevronDown className="select-chevron" aria-hidden="true" />
        </div>

        <div className="toolbar-item select-control sort-control">
          <select
            className="toolbar-select"
            value={sort}
            aria-label="Sort articles"
            onChange={(event) => resetPage(setSort, event.target.value)}
          >
            <option value="latest">Sort: Latest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="popular">Sort: Popular</option>
            <option value="rated">Sort: Highest rated</option>
          </select>
          <FiChevronDown className="select-chevron" aria-hidden="true" />
        </div>
      </section>

      <section className="all-articles-section listing-results" aria-busy={loading}>
        <p className="listing-result-count" aria-live="polite">
          {loading && page === 1
            ? "Loading articles…"
            : `${pagination.total || 0} ${Number(pagination.total) === 1 ? "article" : "articles"}`}
        </p>

        {error && (
          <div className="error-state" role="alert">
            <p>{error}</p>
            <button className="secondary-btn" type="button" onClick={() => setRetryToken((value) => value + 1)}>
              Retry
            </button>
          </div>
        )}

        <div className="article-grid all-articles-grid">
          {articles.map((article) => (
            <ArticlesCard articleData={article} key={article.id || article._id} />
          ))}
        </div>

        {!loading && !error && articles.length === 0 && (
          <p className="empty-state">No published articles match these filters.</p>
        )}

        {canLoadMore && (
          <button
            className="secondary-btn load-more-btn"
            type="button"
            onClick={() => setPage((current) => current + 1)}
          >
            Load More Articles
          </button>
        )}

        {loading && page > 1 && <p className="loading-more" aria-live="polite">Loading more articles…</p>}
      </section>
    </main>
  );
};

export default ArticlesPage;

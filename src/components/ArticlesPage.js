import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiChevronDown, FiFilter, FiSearch, FiTag } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const INITIAL_VISIBLE = 12;
const LOAD_MORE_COUNT = 12;

const sortArticlesLocal = (articles, sort) => {
  const sorted = [...articles];

  if (sort === "popular") {
    return sorted.sort((a, b) => (b.likes || 0) + (b.views || 0) - ((a.likes || 0) + (a.views || 0)));
  }

  if (sort === "rated") {
    return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (sort === "oldest") {
    return sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  }

  return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
};

const ArticlesPage = () => {
  const { data } = useCms();
  const [searchParams] = useSearchParams();
  const showFeatured = searchParams.get("featured") === "true";

  const [allArticles, setAllArticles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Fetch ALL published articles from the API
  const fetchArticles = useCallback(() => {
    setLoading(true);

    const params = { status: "published", limit: 1000 };
    if (showFeatured) params.featured = "true";

    articleApi
      .list(params)
      .then((res) => {
        if (Array.isArray(res.articles)) {
          setAllArticles(res.articles);
        }
      })
      .catch(() => {
        // API unavailable — fall back to CmsContext
        setAllArticles(null);
      })
      .finally(() => setLoading(false));
  }, [showFeatured]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Source data: prefer API, fall back to CmsContext, synced with live CmsContext metrics
  const sourceArticles = useMemo(() => {
    if (allArticles && Array.isArray(allArticles)) {
      return allArticles;
    }
    return (data?.articles || []).filter(
      (a) => String(a.status || "published").toLowerCase() === "published"
    );
  }, [allArticles, data?.articles]);

  // Collect unique tags from available articles
  const tags = useMemo(() => {
    const set = new Set();
    sourceArticles.forEach((a) => {
      if (Array.isArray(a.tags)) {
        a.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [sourceArticles]);

  // Client-side filtering (search, category, tag) + sorting
  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = sourceArticles.filter((article) => {
      const matchesFeatured = !showFeatured || article.featured;

      const articleCategory = (article.category || "").toLowerCase();
      const matchesCategory = category === "all" || articleCategory === category;

      const articleTags = article.tags || [];
      const matchesTag = tag === "all" || articleTags.includes(tag);

      const matchesSearch =
        !normalizedQuery ||
        [article.title, article.description, article.category, ...(article.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFeatured && matchesCategory && matchesTag && matchesSearch;
    });

    return sortArticlesLocal(filtered, sort);
  }, [category, sourceArticles, query, showFeatured, sort, tag]);

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
            type="text"
            className="search-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
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
            onChange={(event) => {
              setCategory(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
          >
            <option value="all">All categories</option>
            {(() => {
              const order = ["life", "reflections", "incidents", "lessons", "travel", "news", "coding"];
              const sortedCategories = [...(data?.categories || [])].sort((a, b) => {
                const indexA = order.indexOf(a.slug?.toLowerCase() || a.name?.toLowerCase());
                const indexB = order.indexOf(b.slug?.toLowerCase() || b.name?.toLowerCase());
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
              return sortedCategories.map((item) => (
                <option value={item.name.toLowerCase()} key={item.id}>
                  {item.name}
                </option>
              ));
            })()}
          </select>
          <FiChevronDown className="select-chevron" aria-hidden="true" />
        </div>

        <div className="toolbar-item select-control tag-control">
          <FiTag className="control-icon" aria-hidden="true" />
          <select
            className="toolbar-select"
            value={tag}
            aria-label="Filter by tag"
            onChange={(event) => {
              setTag(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
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
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="latest">Sort: Latest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="popular">Sort: Popular</option>
            <option value="rated">Sort: Highest rated</option>
          </select>
          <FiChevronDown className="select-chevron" aria-hidden="true" />
        </div>
      </section>

      <section className="all-articles-section listing-results">
        <div className="article-grid all-articles-grid">
          {filteredArticles.slice(0, visibleCount).map((article) => (
            <ArticlesCard articleData={article} key={article.id || article._id} />
          ))}
        </div>

        {!loading && filteredArticles.length === 0 && (
          <p className="empty-state">No published articles match these filters.</p>
        )}

        {visibleCount < filteredArticles.length && (
          <button
            className="secondary-btn load-more-btn"
            type="button"
            onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
          >
            Load More Articles
          </button>
        )}
      </section>
    </main>
  );
};

export default ArticlesPage;

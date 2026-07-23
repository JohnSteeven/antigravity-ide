import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter, FiSearch } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";

const INITIAL_VISIBLE = 6;
const LOAD_MORE_COUNT = 6;

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
    const list = allArticles || data.articles;
    return list
      .filter((a) => a.status === "published")
      .map((a) => {
        const synced = data.articles.find((x) => x.id === a.id || x._id === a.id || x.id === a._id || x._id === a._id);
        if (synced) {
          return {
            ...a,
            likes: synced.likes,
            bookmarks: synced.bookmarks,
            views: synced.views,
          };
        }
        return a;
      });
  }, [allArticles, data.articles]);

  // Collect unique tags from available articles
  const tags = useMemo(
    () => [...new Set(sourceArticles.flatMap((a) => a.tags || []))].sort(),
    [sourceArticles]
  );

  // Client-side filtering (search, category, tag) + sorting
  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = sourceArticles.filter((article) => {
      const matchesFeatured =
        !showFeatured || article.isFeatured || article.featured;

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
    <main className="listing-page">
      <section className="listing-hero">
        <span className="section-kicker">Article library</span>
        <h1>{showFeatured ? "Featured Articles" : "All Articles"}</h1>
        <p>
          Search, filter, and sort every published story managed from the CMS.
        </p>
      </section>

      <section className="article-controls" aria-label="Article filters">
        <label className="search-control">
          <FiSearch />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
            placeholder="Search articles"
          />
        </label>

        <label>
          <FiFilter />
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
          >
            <option value="all">All categories</option>
            {data.categories.map((item) => (
              <option value={item.name.toLowerCase()} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tag
          <select
            value={tag}
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
        </label>

        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Popular</option>
            <option value="rated">Highest rated</option>
          </select>
        </label>
      </section>

      <section className="articles-body listing-results">
        <div className="article-grid">
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

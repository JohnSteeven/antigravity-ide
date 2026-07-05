import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter, FiSearch } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import ArticlesCard from "./ArticlesCard";

const sortArticles = (articles, sort) => {
  const sorted = [...articles];

  if (sort === "popular") {
    return sorted.sort((a, b) => b.likes + b.views - (a.likes + a.views));
  }

  if (sort === "rated") {
    return sorted.sort((a, b) => b.rating - a.rating);
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(6);

  const tags = useMemo(
    () => [...new Set(data.articles.flatMap((article) => article.tags))],
    [data.articles]
  );

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const publicArticles = data.articles.filter(
      (article) => article.status === "published"
    );

    const filtered = publicArticles.filter((article) => {
      const matchesFeatured =
        !showFeatured || (article.featured && article.rating >= 3.5);
      const matchesCategory =
        category === "all" || article.category.toLowerCase() === category;
      const matchesTag = tag === "all" || article.tags.includes(tag);
      const matchesSearch =
        !normalizedQuery ||
        [article.title, article.description, article.category, ...article.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFeatured && matchesCategory && matchesTag && matchesSearch;
    });

    return sortArticles(filtered, sort);
  }, [category, data.articles, query, showFeatured, sort, tag]);

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
              setVisibleCount(6);
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
              setVisibleCount(6);
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
              setVisibleCount(6);
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
            <ArticlesCard articleData={article} key={article.id} />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <p className="empty-state">No published articles match these filters.</p>
        )}

        {visibleCount < filteredArticles.length && (
          <button
            className="secondary-btn load-more-btn"
            type="button"
            onClick={() => setVisibleCount((count) => count + 6)}
          >
            Load More Articles
          </button>
        )}
      </section>
    </main>
  );
};

export default ArticlesPage;

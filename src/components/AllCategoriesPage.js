import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  FiSearch,
  FiArrowRight,
  FiBookOpen,
  FiCode,
  FiHeart,
  FiFeather,
  FiBookmark,
  FiSend,
  FiGlobe,
  FiCompass,
  FiGrid,
  FiTag
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { categoryApi, articleApi } from "../services/apiService";
import { cmsSeed } from "../data/cmsSeed";

const iconMap = {
  life: <FiHeart />,
  reflections: <FiFeather />,
  incidents: <FiBookmark />,
  experiences: <FiBookmark />,
  lessons: <FiBookOpen />,
  travel: <FiSend />,
  news: <FiGlobe />,
  coding: <FiCode />,
  technology: <FiCode />,
  default: <FiCompass />
};

const defaultImages = {
  life: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80",
  reflections: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80",
  incidents: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
  experiences: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80",
  lessons: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
  travel: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80",
  news: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80",
  coding: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80"
};

const getCategoryIcon = (category) => {
  const slug = (category.slug || "").toLowerCase();
  return iconMap[slug] || iconMap.default;
};

const getCategoryHeroImage = (category) => {
  const slug = (category.slug || "").toLowerCase();
  return category.heroImage?.trim() || defaultImages[slug] || defaultImages.life;
};

export default function AllCategoriesPage() {
  const { data } = useCms();
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch categories & articles from API / Context
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, artRes] = await Promise.all([
          categoryApi.list({ isActive: true }).catch(() => null),
          articleApi.list({ status: "published", limit: 1000 }).catch(() => null)
        ]);

        if (!cancelled) {
          const apiCats = catRes?.categories || [];
          const ctxCats = data?.categories || cmsSeed.categories || [];
          const rawCats = apiCats.length > 0 ? apiCats : ctxCats;

          const activeCats = rawCats.filter(
            (c) => c.isActive !== false && !c.isDeleted && (c.status === undefined || c.status === "published")
          );

          setCategories(activeCats);

          const apiArts = artRes?.articles || data?.articles || [];
          setArticles(apiArts.filter((a) => a.status === "published"));
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [data?.categories, data?.articles]);

  // Calculate article counts per category slug / name
  const articleCounts = useMemo(() => {
    const counts = {};
    articles.forEach((art) => {
      const catKey = (art.category || art.categorySlug || "").toLowerCase();
      if (catKey) {
        counts[catKey] = (counts[catKey] || 0) + 1;
      }
    });
    return counts;
  }, [articles]);

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return name.includes(query) || desc.includes(query) || slug.includes(query);
    });
  }, [categories, searchQuery]);

  return (
    <main className="all-categories-page">
      <section className="categories-hero-banner">
        <div className="container">
          <div className="categories-hero-content">
            <span className="section-kicker">Explore MyJourney</span>
            <h1 className="categories-page-title">All Categories</h1>
            <p className="categories-page-subtitle">
              Browse our full collection of topics, journals, life lessons, and technical guides.
            </p>

            {/* Filter Search Input */}
            <div className="categories-search-box">
              <FiSearch className="search-box-icon" />
              <input
                type="text"
                className="categories-search-input"
                placeholder="Filter categories by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter categories"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="categories-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="categories-list-section container">
        {loading ? (
          <div className="categories-loading-state">
            <div className="loading-spinner" />
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="all-categories-grid">
            {filteredCategories.map((cat) => {
              const slugKey = (cat.slug || "").toLowerCase();
              const nameKey = (cat.name || "").toLowerCase();
              const count = articleCounts[slugKey] || articleCounts[nameKey] || cat.articleCount || 0;
              const displayName = cat.name === "Incidents" ? "Experiences" : cat.name;

              return (
                <Link
                  key={cat.id || cat._id || cat.slug}
                  to={`/category/${cat.slug}`}
                  className="all-category-card"
                  style={{
                    backgroundImage: `url(${getCategoryHeroImage(cat)})`
                  }}
                >
                  <div className="all-category-overlay" />

                  <div className="all-category-top">
                    <div className="all-category-icon-badge">
                      {getCategoryIcon(cat)}
                    </div>
                    {count > 0 && (
                      <span className="all-category-count-pill">
                        <FiTag size={12} /> {count} {count === 1 ? "Article" : "Articles"}
                      </span>
                    )}
                  </div>

                  <div className="all-category-bottom">
                    <h3 className="all-category-card-title">{displayName}</h3>
                    <p className="all-category-card-desc">
                      {cat.description || "Explore curated stories and deep insights."}
                    </p>
                    <div className="all-category-card-action">
                      <span>Explore Category</span>
                      <FiArrowRight />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="categories-empty-state">
            <FiGrid size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
            <h3>No categories found</h3>
            <p>No matching categories for "{searchQuery}". Try clearing your search query.</p>
            <button
              type="button"
              className="btn-reset-search"
              onClick={() => setSearchQuery("")}
            >
              Show All Categories
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

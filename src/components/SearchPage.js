import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSearch, FiAlertTriangle, FiBookOpen } from "react-icons/fi";
import { articleApi } from "../services/apiService";
import ArticlesCard from "./ArticlesCard";
import { motion } from "framer-motion";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setArticles([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Perform server-side search using the text-index weights
      const res = await articleApi.list({ status: "published", search: searchTerm, limit: 20 });
      if (res && Array.isArray(res.articles)) {
        setArticles(res.articles);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search query failed. Please try a different query or keyword.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchInput });
  };

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="listing-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="listing-hero" style={{ paddingBottom: "2rem" }}>
        <span className="section-kicker">Discover Stories</span>
        <h1>Search Articles</h1>
        <p>Explore articles, notes, and experiences using keywords, tags, or topics.</p>
      </section>

      <section style={{ maxWidth: "800px", margin: "0 auto 3rem auto", padding: "0 20px" }}>
        <form onSubmit={handleSubmit} className="article-controls" style={{ display: "flex", gap: "10px", width: "100%", padding: "0", background: "transparent" }}>
          <label className="search-control" style={{ flex: 1, margin: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 15px", height: "50px" }}>
            <FiSearch style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginRight: "10px" }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, body, tags, categories..."
              style={{ border: 0, outline: 0, width: "100%", background: "transparent", fontSize: "1rem", color: "var(--text-primary)" }}
            />
          </label>
          <button type="submit" className="primary-btn" style={{ height: "50px", padding: "0 25px", borderRadius: "8px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }}>
            Search
          </button>
        </form>
      </section>

      <section className="articles-grid-section" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 4rem 20px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
            <div className="spin" style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%" }}></div>
          </div>
        ) : error ? (
          <div className="cms-alert cms-alert-danger" style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "600px", margin: "0 auto" }}>
            <FiAlertTriangle /> <span>{error}</span>
          </div>
        ) : articles.length > 0 ? (
          <div>
            <span className="section-kicker" style={{ display: "block", marginBottom: "1.5rem" }}>Found {articles.length} result(s)</span>
            <div className="articles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "30px" }}>
              {articles.map((article) => (
                <ArticlesCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ) : query ? (
          <div style={{ textAlign: "center", padding: "4rem 20px", color: "var(--text-secondary)" }}>
            <FiBookOpen style={{ fontSize: "3rem", marginBottom: "1rem", color: "var(--border)" }} />
            <h3>No articles found</h3>
            <p style={{ marginTop: "0.5rem" }}>Try searching for a different keyword or check spelling.</p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "4rem 20px", color: "var(--text-secondary)" }}>
            <FiSearch style={{ fontSize: "3.5rem", marginBottom: "1rem", color: "var(--border)" }} />
            <h3>Enter a search query</h3>
            <p style={{ marginTop: "0.5rem" }}>Type some keywords in the box above to get started.</p>
          </div>
        )}
      </section>
    </motion.main>
  );
}

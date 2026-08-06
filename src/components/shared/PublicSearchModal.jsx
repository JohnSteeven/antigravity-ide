import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiArrowRight, FiBookOpen, FiClock } from "react-icons/fi";
import apiService, { articleApi } from "../../services/apiService";

export default function PublicSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        // First try universal search endpoint
        let searchResults = [];
        const res = await apiService.get(`/api/search?q=${encodeURIComponent(trimmed)}`).catch(() => null);

        if (res?.data?.results && Array.isArray(res.data.results)) {
          searchResults = res.data.results;
        } else if (res?.data && Array.isArray(res.data)) {
          searchResults = res.data;
        } else {
          // Fallback to public article search endpoint
          const articlesRes = await articleApi.list({ search: trimmed }).catch(() => null);
          if (articlesRes?.articles && Array.isArray(articlesRes.articles)) {
            searchResults = articlesRes.articles.map((a) => ({
              title: a.title,
              slug: a.slug,
              description: a.description || a.excerpt || "",
              category: a.category || "General",
              url: `/articles/${a.slug}`,
            }));
          }
        }

        setResults(searchResults);
        setSearched(true);
      } catch (err) {
        console.error("Search failed", err);
        setError("Unable to complete search at this time.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (url) => {
    onClose();
    if (url) navigate(url);
  };

  return (
    <div
      className="public-search-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search articles"
    >
      <div
        className="public-search-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="public-search-header">
          <div className="public-search-input-wrapper">
            <FiSearch className="public-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="public-search-input"
              placeholder="Search articles, topics, or lessons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search articles input"
            />
            {query && (
              <button
                type="button"
                className="public-search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search query"
              >
                <FiX />
              </button>
            )}
          </div>
          <button
            type="button"
            className="public-search-close-btn"
            onClick={onClose}
            aria-label="Close search modal"
          >
            Esc
          </button>
        </div>

        <div className="public-search-body">
          {loading && (
            <div className="public-search-state">
              <div className="search-spinner" />
              <span>Searching...</span>
            </div>
          )}

          {error && (
            <div className="public-search-state public-search-error">
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && searched && results.length === 0 && (
            <div className="public-search-state">
              <FiBookOpen size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p>No matching articles found for "{query}"</p>
              <span className="public-search-hint">Try searching for keywords like "habits", "react", or "growth".</span>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="public-search-results">
              <div className="public-search-results-label">
                Found {results.length} result{results.length === 1 ? "" : "s"}
              </div>
              <div className="public-search-list">
                {results.map((item, idx) => {
                  const targetUrl = item.url || `/articles/${item.slug}`;
                  return (
                    <div
                      key={idx}
                      className="public-search-item"
                      onClick={() => handleSelectResult(targetUrl)}
                    >
                      <div className="public-search-item-main">
                        <div className="public-search-item-meta">
                          {item.category && (
                            <span className="public-search-category-badge">{item.category}</span>
                          )}
                          {item.readingTime && (
                            <span className="public-search-reading-time">
                              <FiClock size={12} /> {item.readingTime} min read
                            </span>
                          )}
                        </div>
                        <h4 className="public-search-item-title">{item.title}</h4>
                        {item.description && (
                          <p className="public-search-item-desc">{item.description}</p>
                        )}
                      </div>
                      <FiArrowRight className="public-search-arrow" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!query && (
            <div className="public-search-state public-search-initial">
              <p>Type at least 2 characters to start searching.</p>
              <div className="public-search-quick-tags">
                <span onClick={() => setQuery("Life")}>#Life</span>
                <span onClick={() => setQuery("Coding")}>#Coding</span>
                <span onClick={() => setQuery("Reflections")}>#Reflections</span>
                <span onClick={() => setQuery("Lessons")}>#Lessons</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

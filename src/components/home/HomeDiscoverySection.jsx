import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  FiSearch,
  FiX,
  FiArrowRight,
  FiBookOpen,
  FiTerminal,
  FiPlay,
  FiCompass,
  FiUserCheck,
} from "react-icons/fi";
import apiService from "../../services/apiService";
import { useAuth } from "../../hooks/useAuth";
import "./home-discovery.css";

const FILTER_OPTIONS = [
  { id: "all", label: "All Content" },
  { id: "article", label: "Articles" },
  { id: "story", label: "Stories" },
  { id: "course", label: "Courses" },
  { id: "coding", label: "Coding Tracks" },
  { id: "game", label: "Games & Play" },
  { id: "creator", label: "Creators" },
];

export default function HomeDiscoverySection() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [discoveryData, setDiscoveryData] = useState(null);

  const containerRef = useRef(null);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // Fetch Home Discovery & Personalization data
  useEffect(() => {
    let mounted = true;
    apiService
      .get("/api/search/discovery/home")
      .then((res) => {
        if (mounted && res?.data) {
          setDiscoveryData(res.data);
        }
      })
      .catch(() => {
        // Fallback gracefully on network / auth error
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      apiService
        .get(
          `/api/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(
            selectedType
          )}&limit=6`
        )
        .then((res) => {
          if (res?.data?.results) {
            setSearchResults(res.data.results);
            setIsOpen(true);
          }
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, selectedType]);

  const continueItems = discoveryData?.continueLearning || [];
  const engines = discoveryData?.featuredEngines || [];

  return (
    <section className="home-discovery-section" aria-label="Global Discovery and Search">
      <div className="home-discovery-container" ref={containerRef}>
        {/* Search & Discovery Header */}
        <div className="discovery-search-wrapper">
          <div className="discovery-kicker">
            <FiCompass aria-hidden="true" />
            <span>Universal Discovery</span>
          </div>

          <h2 className="discovery-title">Discover Knowledge, Skills & Play</h2>
          <p className="discovery-subtitle">
            Search across thousands of articles, interactive coding curricula, creator courses, and live multiplayer games.
          </p>

          <div className="discovery-input-box">
            <div className="discovery-input-inner">
              <FiSearch className="discovery-search-icon" aria-hidden="true" />
              <input
                type="text"
                className="discovery-input"
                placeholder="Search articles, coding tracks, games, concepts, creators..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setIsOpen(true);
                }}
                aria-label="Global search query"
              />
              {query && (
                <button
                  type="button"
                  className="discovery-clear-btn"
                  onClick={() => {
                    setQuery("");
                    setSearchResults([]);
                    setIsOpen(false);
                  }}
                  aria-label="Clear search query"
                >
                  <FiX />
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {isOpen && searchResults.length > 0 && (
              <div className="discovery-results-panel" role="region" aria-label="Search results">
                {searchResults.map((item) => (
                  <Link
                    key={`${item.entityType}-${item.entityId}`}
                    to={item.url}
                    className="discovery-result-item"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="discovery-result-info">
                      <span className="discovery-result-title">{item.title}</span>
                      <span className="discovery-result-meta">
                        <span className="discovery-type-badge">{item.entityType}</span>
                        <span>{item.category}</span>
                      </span>
                    </div>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="discovery-filter-pills" role="tablist" aria-label="Search filters">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`discovery-pill ${selectedType === opt.id ? "active" : ""}`}
                onClick={() => setSelectedType(opt.id)}
                role="tab"
                aria-selected={selectedType === opt.id}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Continue Learning Strip (When Authenticated and Enrolled) */}
        {isAuthenticated && continueItems.length > 0 && (
          <div className="continue-learning-section" aria-label="Continue Learning">
            <div className="section-subheading-row">
              <h3 className="section-subheading">
                <FiTerminal aria-hidden="true" />
                <span>Continue Your Journey</span>
              </h3>
              <Link to="/learn" className="continue-resume-link">
                <span>View All Courses</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="continue-cards-grid">
              {continueItems.map((course) => (
                <Link key={course.courseId} to={course.route} className="continue-card">
                  <div>
                    <span className="engine-badge">{course.category}</span>
                    <h4 className="continue-card-title">{course.title}</h4>
                  </div>

                  <div className="continue-progress-wrapper">
                    <div className="continue-progress-labels">
                      <span>Progress</span>
                      <span>{course.progressPercent}%</span>
                    </div>
                    <div
                      className="continue-progress-bar"
                      role="progressbar"
                      aria-valuenow={course.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="continue-progress-fill"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="continue-resume-link">
                    <span>{course.nextLesson?.title ? `Next: ${course.nextLesson.title}` : "Resume Lesson"}</span>
                    <FiArrowRight />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Flagship Engines */}
        {engines.length > 0 && (
          <div className="featured-engines-section" aria-label="Featured Platform Engines">
            <div className="section-subheading-row">
              <h3 className="section-subheading">
                <FiBookOpen aria-hidden="true" />
                <span>Explore the Platform</span>
              </h3>
              <Link to="/projects" className="continue-resume-link">
                <span>All Projects</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="featured-engines-grid">
              {engines.map((eng) => (
                <Link key={eng.id} to={eng.route} className="engine-card">
                  <div className="engine-card-header">
                    <h4 className="engine-card-title">{eng.title}</h4>
                    <span className="engine-badge">{eng.badge}</span>
                  </div>
                  <p className="engine-card-desc">{eng.description}</p>
                  <div className="continue-resume-link">
                    <span>Open {eng.category}</span>
                    <FiArrowRight />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

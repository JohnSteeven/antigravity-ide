import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { learnApi } from "../../services/apiService";
import "./coding.css";

export default function CodingSubNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [streak, setStreak] = useState(null);
  const isTracksActive = /^\/coding\/(html|css|javascript|python)(\/|$)/.test(location.pathname);

  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      learnApi.codingStats().then((res) => {
        if (active && res.data?.streaks) {
          setStreak(res.data.streaks);
        }
      }).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return (
    <nav className="coding-subnav" aria-label="Coding navigation">
      <div className="coding-subnav__inner">
        <Link to="/coding" className="coding-subnav__brand">
          <span>&lt;/&gt;</span>
          <span>MyJourney Coding</span>
          <span className="coding-subnav__brand-badge">Curriculum</span>
        </Link>
        <ul className="coding-subnav__links">
          <li>
            <NavLink
              to="/coding"
              end
              className={({ isActive }) =>
                `coding-subnav__link ${isActive ? "active" : ""}`
              }
            >
              Overview
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/coding/html"
              className={() =>
                `coding-subnav__link ${isTracksActive ? "active" : ""}`
              }
            >
              Tracks
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/coding/practice"
              className={({ isActive }) =>
                `coding-subnav__link ${isActive ? "active" : ""}`
              }
            >
              Practice
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/coding/projects"
              className={({ isActive }) =>
                `coding-subnav__link ${isActive ? "active" : ""}`
              }
            >
              Projects
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/coding/playground"
              className={({ isActive }) =>
                `coding-subnav__link ${isActive ? "active" : ""}`
              }
            >
              Playground
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/coding/resources"
              className={({ isActive }) =>
                `coding-subnav__link ${isActive ? "active" : ""}`
              }
            >
              Resources
            </NavLink>
          </li>
        </ul>

        {streak !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              className="cd-badge-pill"
              style={{
                background: "rgba(245, 158, 11, 0.15)",
                color: "#fbbf24",
                borderColor: "rgba(245, 158, 11, 0.3)",
                fontSize: "0.75rem",
                padding: "0.25rem 0.6rem",
              }}
              title={`Current streak: ${streak.currentStreak || 0} days | Best: ${streak.bestStreak || 0} days`}
            >
              🔥 {streak.currentStreak || 0} day streak
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}


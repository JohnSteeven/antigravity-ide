import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { FiCompass } from "react-icons/fi";
import { learnApi } from "../../services/apiService";
import LearnSidebar from "./LearnSidebar";
import LearnMobileDrawer from "./LearnMobileDrawer";
import "./learn.css";

/**
 * LearnDiscoveryLayout
 *
 * Shared two-column application shell for Learn discovery/browsing pages.
 *
 * Renders on:
 *   /learn               (LearnHome)
 *   /learn/courses       (LearnCatalog, all filter states)
 *   /learn/courses?topic=<id>
 *
 * Does NOT render on:
 *   /learn/courses/:slug  (CoursePage — focused learning)
 *   /learn/courses/:slug/lessons/:id  (LessonWorkspace)
 *   other format detail pages
 *
 * Props
 * ─────
 * children – right-column page content
 */
export default function LearnDiscoveryLayout({ children }) {
  const [topics, setTopics] = useState([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const activeTopicId = searchParams.get("topic") || "";

  const mobileExploreRef = useRef(null);

  // Fetch topics once — lightweight endpoint, no auth required
  useEffect(() => {
    let active = true;
    learnApi
      .topics()
      .then((response) => {
        if (!active) return;
        // API may return { topics: [...] } or an array directly
        const list = Array.isArray(response)
          ? response
          : response.topics || response.data || [];
        setTopics(list);
      })
      .catch(() => {
        // Topic load failure is non-fatal; sidebar renders empty / hidden
      });
    return () => {
      active = false;
    };
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const hasSidebar = topics.length > 0;

  const sidebar = hasSidebar ? (
    <LearnSidebar
      topics={topics}
      search={topicSearch}
      onSearch={setTopicSearch}
      activeTopicId={activeTopicId}
    />
  ) : null;

  return (
    <div className={`learn-shell${hasSidebar ? " has-sidebar" : ""}`}>
      {/* ── Desktop sidebar ─── */}
      {sidebar}

      {/* ── Main content column ─── */}
      <div className="learn-main">
        {/* Mobile Explore Topics trigger — hidden on desktop via CSS */}
        {hasSidebar && (
          <button
            ref={mobileExploreRef}
            type="button"
            className="learn-mobile-explore-trigger"
            onClick={openDrawer}
            aria-expanded={drawerOpen}
            aria-controls="learn-mobile-drawer"
            aria-label="Explore Topics — open topic navigator"
          >
            <FiCompass aria-hidden="true" />
            Explore Topics
          </button>
        )}

        {children}
      </div>

      {/* ── Mobile drawer ─── */}
      {hasSidebar && (
        <LearnMobileDrawer open={drawerOpen} onClose={closeDrawer}>
          <LearnSidebar
            topics={topics}
            search={topicSearch}
            onSearch={setTopicSearch}
            activeTopicId={activeTopicId}
          />
        </LearnMobileDrawer>
      )}
    </div>
  );
}

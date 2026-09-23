import React, { useState, useMemo } from "react";
import {
  FiCode,
  FiSearch,
  FiEdit,
  FiLayers,
  FiInfo,
  FiCheckCircle,
} from "react-icons/fi";

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  filterRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  searchInput: {
    flex: "1 1 240px",
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "0.5rem 0.85rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
  },
  select: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "0.5rem 0.85rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  title: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#f8fafc",
    margin: "0 0 0.25rem",
  },
  meta: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: "rgba(56,189,248,0.15)",
    color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.3)",
    textTransform: "uppercase",
  },
  btnEdit: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  notice: {
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.25)",
    borderRadius: "6px",
    padding: "0.75rem 1rem",
    color: "#38bdf8",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
};

export default function CodingPracticeTab({ courses, onEditLesson }) {
  const [search, setSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");

  // Flatten all practice challenges from all courses
  const allPractice = useMemo(() => {
    const list = [];
    courses.forEach((course) => {
      const curriculum = course.curriculum || [];
      curriculum.forEach((module) => {
        const lessons = module.lessons || [];
        lessons.forEach((lesson) => {
          if (lesson.lessonType === "practice" || lesson.lessonType === "coding") {
            list.push({
              ...lesson,
              courseId: course.id || course._id,
              courseTitle: course.title,
              courseSlug: course.slug,
              moduleTitle: module.title,
            });
          }
        });
      });
    });
    return list;
  }, [courses]);

  // Filter based on search and track
  const filtered = useMemo(() => {
    return allPractice.filter((item) => {
      const matchTrack = selectedTrack === "all" || item.courseId === selectedTrack;
      const matchSearch =
        !search ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.courseTitle?.toLowerCase().includes(search.toLowerCase()) ||
        item.moduleTitle?.toLowerCase().includes(search.toLowerCase());
      return matchTrack && matchSearch;
    });
  }, [allPractice, search, selectedTrack]);

  return (
    <div style={S.container}>
      {/* Notice about Amendment #15: unified CourseLesson model */}
      <div style={S.notice}>
        <FiInfo style={{ flexShrink: 0 }} />
        <span>
          <strong>Architecture Note:</strong> Practice exercises derive from canonical <code>CourseLesson</code> models with <code>lessonType=&apos;practice&apos;</code> or <code>&apos;coding&apos;</code>. No parallel models needed.
        </span>
      </div>

      {/* Filter Row */}
      <div style={S.filterRow}>
        <input
          type="text"
          placeholder="Search practice challenges by title or track..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={S.searchInput}
        />
        <select
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          style={S.select}
        >
          <option value="all">All Tracks ({allPractice.length})</option>
          {courses.map((c) => (
            <option key={c.id || c._id} value={c.id || c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Challenge List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8" }}>
          No practice challenges matching your filters.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((item, idx) => (
            <div key={item.id || item._id || idx} style={S.card}>
              <div>
                <h4 style={S.title}>{item.title}</h4>
                <div style={S.meta}>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{item.courseTitle}</span>
                  <span>•</span>
                  <span>{item.moduleTitle}</span>
                  <span>•</span>
                  <span style={S.badge}>{item.lessonType}</span>
                  {item.isPreview && (
                    <span style={{ ...S.badge, background: "rgba(16,185,129,0.15)", color: "#34d399", borderColor: "rgba(16,185,129,0.3)" }}>
                      PREVIEW
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditLesson && onEditLesson(item)}
                style={S.btnEdit}
              >
                <FiEdit /> Author Challenge
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

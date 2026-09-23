import React, { useState } from "react";
import {
  FiUpload,
  FiArchive,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiFilter,
  FiShield,
} from "react-icons/fi";
import { learnApi } from "../../../services/apiService";

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  notice: {
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.25)",
    borderRadius: "8px",
    padding: "0.85rem 1.15rem",
    color: "#38bdf8",
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },
  filterRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  filterBtn: (active) => ({
    background: active ? "#0284c7" : "#1e293b",
    color: active ? "#ffffff" : "#94a3b8",
    border: `1px solid ${active ? "#0284c7" : "#334155"}`,
    padding: "0.4rem 0.85rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
  }),
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 0.25rem",
  },
  meta: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    display: "flex",
    gap: "0.6rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusBadge: (status) => {
    const map = {
      published: { bg: "rgba(16,185,129,0.15)", color: "#34d399", border: "rgba(16,185,129,0.3)" },
      draft: { bg: "rgba(100,116,139,0.2)", color: "#94a3b8", border: "rgba(100,116,139,0.3)" },
      archived: { bg: "rgba(168,85,247,0.15)", color: "#c084fc", border: "rgba(168,85,247,0.3)" },
    };
    const t = map[status] || map.draft;
    return {
      fontSize: "0.72rem",
      fontWeight: 700,
      padding: "0.15rem 0.45rem",
      borderRadius: "4px",
      background: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`,
      textTransform: "uppercase",
    };
  },
  btnPrimary: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "0.45rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  btnSecondary: {
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #334155",
    padding: "0.45rem 0.85rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
};

export default function CodingPublishingTab({ courses, onRefresh }) {
  const [filter, setFilter] = useState("all"); // "all" | "draft" | "published" | "archived"
  const [selectedLessons, setSelectedLessons] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCourses = courses.filter((c) => {
    if (filter === "all") return true;
    return c.publicationStatus === filter;
  });

  const handlePublishTrack = async (courseId) => {
    if (!window.confirm("Publish track? Server will validate that all required runtimes are supported.")) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await learnApi.adminCodingPublishCourse(courseId);
      setMessage("Track published successfully.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to publish track.");
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveTrack = async (courseId) => {
    if (!window.confirm("Archive track? Record will be preserved for admin review but hidden from learner catalog.")) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await learnApi.adminCodingArchiveCourse(courseId);
      setMessage("Track archived successfully.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to archive track.");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkPublishLessons = async () => {
    if (selectedLessons.size === 0) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await learnApi.adminCodingBulkPublishLessons({
        lessonIds: Array.from(selectedLessons),
      });
      setMessage(`Successfully published ${selectedLessons.size} lesson(s).`);
      setSelectedLessons(new Set());
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to bulk publish lessons.");
    } finally {
      setBusy(false);
    }
  };

  // Collect all draft lessons across all tracks for bulk publishing
  const draftLessons = [];
  courses.forEach((course) => {
    (course.curriculum || []).forEach((module) => {
      (module.lessons || []).forEach((lesson) => {
        if (lesson.publicationStatus === "draft") {
          draftLessons.push({
            ...lesson,
            courseTitle: course.title,
            moduleTitle: module.title,
          });
        }
      });
    });
  });

  const toggleLessonSelect = (id) => {
    setSelectedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div style={S.container}>
      {/* Policy Notice (Amendment #3 & Amendment #5) */}
      <div style={S.notice}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          <FiShield /> Server-Authoritative Publishing Policies Enforced
        </div>
        <div>
          • <strong>Runtime Validation:</strong> Publishing rejects runnable Coding lessons that require an unsupported runtime (e.g. C++, Java). You may still <em>Save Draft</em> for future curriculum.<br />
          • <strong>Safe Draft Preview:</strong> Draft lessons remain completely shielded from learner endpoints. Learner preview is only active for published lessons marked with <em>Free Public Preview</em>.
        </div>
      </div>

      {message && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "6px" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      {/* Track Publishing Controls */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Track Publication Status
          </h3>

          <div style={S.filterRow}>
            <button type="button" onClick={() => setFilter("all")} style={S.filterBtn(filter === "all")}>
              All ({courses.length})
            </button>
            <button type="button" onClick={() => setFilter("published")} style={S.filterBtn(filter === "published")}>
              Published
            </button>
            <button type="button" onClick={() => setFilter("draft")} style={S.filterBtn(filter === "draft")}>
              Draft
            </button>
            <button type="button" onClick={() => setFilter("archived")} style={S.filterBtn(filter === "archived")}>
              Archived
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredCourses.map((c) => {
            const cid = c.id || c._id;
            return (
              <div key={cid} style={S.card}>
                <div>
                  <h4 style={S.title}>{c.title}</h4>
                  <div style={S.meta}>
                    <span style={S.statusBadge(c.publicationStatus)}>{c.publicationStatus || "draft"}</span>
                    <span>•</span>
                    <span>Runtime: {c.language}</span>
                    <span>•</span>
                    <span>Lessons: {c.lessonCount || 0}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {c.publicationStatus !== "published" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handlePublishTrack(cid)}
                      style={S.btnPrimary}
                    >
                      <FiUpload /> Publish Track
                    </button>
                  )}
                  {c.publicationStatus !== "archived" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleArchiveTrack(cid)}
                      style={S.btnSecondary}
                    >
                      <FiArchive /> Archive Track
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Lesson Publishing */}
      {draftLessons.length > 0 && (
        <div style={{ marginTop: "1rem", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                Bulk Publish Draft Lessons ({draftLessons.length} in Draft)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>
                Select draft lessons to batch publish across tracks with server-side permission checks.
              </p>
            </div>

            <button
              type="button"
              disabled={selectedLessons.size === 0 || busy}
              onClick={handleBulkPublishLessons}
              style={{
                ...S.btnPrimary,
                opacity: selectedLessons.size === 0 ? 0.4 : 1,
              }}
            >
              <FiCheckCircle /> Publish Selected ({selectedLessons.size})
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {draftLessons.map((lesson) => {
              const lid = lesson.id || lesson._id;
              const isChecked = selectedLessons.has(lid);
              return (
                <label
                  key={lid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0.75rem",
                    background: isChecked ? "rgba(2,132,199,0.1)" : "#0f172a",
                    border: `1px solid ${isChecked ? "rgba(2,132,199,0.3)" : "#334155"}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLessonSelect(lid)}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 600 }}>
                    {lesson.title}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    ({lesson.courseTitle} &gt; {lesson.moduleTitle})
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

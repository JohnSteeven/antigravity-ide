import React, { useState } from "react";
import {
  FiPlus,
  FiEdit,
  FiBookOpen,
  FiLock,
  FiUnlock,
  FiUpload,
  FiArchive,
  FiX,
  FiClock,
  FiLayers,
} from "react-icons/fi";
import { learnApi } from "../../../services/apiService";

const S = {
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  title: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    margin: "0.25rem 0 0",
    lineHeight: 1.4,
  },
  badgeRow: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  levelBadge: {
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: "rgba(56, 189, 248, 0.15)",
    color: "#38bdf8",
    border: "1px solid rgba(56, 189, 248, 0.3)",
  },
  langBadge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: "rgba(245, 158, 11, 0.15)",
    color: "#fbbf24",
    border: "1px solid rgba(245, 158, 11, 0.3)",
  },
  accessBadge: (level) => ({
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: level === "premium" ? "rgba(168,85,247,0.18)" : "rgba(16,185,129,0.18)",
    color: level === "premium" ? "#c084fc" : "#34d399",
    border: `1px solid ${level === "premium" ? "rgba(168,85,247,0.3)" : "rgba(16,185,129,0.3)"}`,
  }),
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
  metaRow: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.8rem",
    color: "#64748b",
  },
  actionRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginTop: "auto",
    paddingTop: "0.5rem",
    borderTop: "1px solid #334155",
  },
  btnPrimary: {
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "0.4rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  btnSecondary: {
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #334155",
    padding: "0.4rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  input: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "0.35rem",
  },
  formModal: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
};

export default function CodingTracksTab({ courses, onSelectCourse, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    language: "javascript",
    level: "beginner",
    accessLevel: "free",
    estimatedDurationMinutes: 60,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingCreateCourse(createForm);
      setMessage("Track created successfully in Draft mode.");
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        subtitle: "",
        description: "",
        language: "javascript",
        level: "beginner",
        accessLevel: "free",
        estimatedDurationMinutes: 60,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to create track.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingUpdateCourse(editingCourse.id || editingCourse._id, {
        title: editingCourse.title,
        subtitle: editingCourse.subtitle,
        description: editingCourse.description,
        level: editingCourse.level,
        accessLevel: editingCourse.accessLevel,
        estimatedDurationMinutes: Number(editingCourse.estimatedDurationMinutes) || 0,
      });
      setMessage("Track updated successfully.");
      setEditingCourse(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to update track.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (courseId) => {
    if (!window.confirm("Publish this track? Learners will be able to access published lessons.")) return;
    setBusy(true);
    setError("");
    setMessage("");
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

  const handleArchive = async (courseId) => {
    if (!window.confirm("Archive this track? It will be removed from public learner listings but retained for admin.")) return;
    setBusy(true);
    setError("");
    setMessage("");
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

  const handleToggleAccess = async (course) => {
    const nextAccess = course.accessLevel === "premium" ? "free" : "premium";
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingUpdateCourse(course.id || course._id, {
        accessLevel: nextAccess,
      });
      setMessage(`Access level updated to ${nextAccess.toUpperCase()}.`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to toggle access level.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Coding Tracks ({courses.length})
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
            System-owned foundational and advanced programming curricula.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(!showCreateModal)}
          style={{
            background: "#0284c7",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "0.55rem 1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FiPlus /> New Track
        </button>
      </div>

      {message && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {showCreateModal && (
        <form onSubmit={handleCreate} style={S.formModal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Create New System Coding Track
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem" }}
            >
              <FiX />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Track Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. TypeScript Foundations"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Execution Runtime / Language *</label>
              <select
                value={createForm.language}
                onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
                style={S.input}
              >
                <option value="javascript">JavaScript (Node/Browser)</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="python">Python (Pyodide)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Skill Level</label>
              <select
                value={createForm.level}
                onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}
                style={S.input}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all_levels">All Levels</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Access Level</label>
              <select
                value={createForm.accessLevel}
                onChange={(e) => setCreateForm({ ...createForm, accessLevel: e.target.value })}
                style={S.input}
              >
                <option value="free">Free for All</option>
                <option value="premium">Premium Required</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Estimated Minutes</label>
              <input
                type="number"
                min="0"
                value={createForm.estimatedDurationMinutes}
                onChange={(e) => setCreateForm({ ...createForm, estimatedDurationMinutes: Number(e.target.value) })}
                style={S.input}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>Subtitle / Short Pitch</label>
            <input
              type="text"
              placeholder="e.g. Master static typing and modern TypeScript workflows"
              value={createForm.subtitle}
              onChange={(e) => setCreateForm({ ...createForm, subtitle: e.target.value })}
              style={S.input}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={S.label}>Track Overview / Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description of the track curriculum, target audience, and goals..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              style={{ ...S.input, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {busy ? "Creating…" : "Save as Draft Track"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              style={S.btnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {editingCourse && (
        <form onSubmit={handleUpdate} style={S.formModal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Edit Track: {editingCourse.title}
            </h3>
            <button
              type="button"
              onClick={() => setEditingCourse(null)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem" }}
            >
              <FiX />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Title</label>
              <input
                type="text"
                value={editingCourse.title || ""}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Subtitle</label>
              <input
                type="text"
                value={editingCourse.subtitle || ""}
                onChange={(e) => setEditingCourse({ ...editingCourse, subtitle: e.target.value })}
                style={S.input}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Level</label>
              <select
                value={editingCourse.level || "beginner"}
                onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                style={S.input}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all_levels">All Levels</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Access Level</label>
              <select
                value={editingCourse.accessLevel || "free"}
                onChange={(e) => setEditingCourse({ ...editingCourse, accessLevel: e.target.value })}
                style={S.input}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Estimated Minutes</label>
              <input
                type="number"
                value={editingCourse.estimatedDurationMinutes || 0}
                onChange={(e) => setEditingCourse({ ...editingCourse, estimatedDurationMinutes: Number(e.target.value) })}
                style={S.input}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>Description</label>
            <textarea
              rows={3}
              value={editingCourse.description || ""}
              onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
              style={{ ...S.input, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditingCourse(null)}
              style={S.btnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
        {courses.map((course) => {
          const id = course.id || course._id;
          return (
            <div key={id} style={S.card}>
              <div style={S.header}>
                <div>
                  <h3 style={S.title}>{course.title}</h3>
                  <p style={S.subtitle}>{course.subtitle || course.description}</p>
                </div>
                <div style={S.badgeRow}>
                  <span style={S.statusBadge(course.publicationStatus)}>
                    {course.publicationStatus || "draft"}
                  </span>
                </div>
              </div>

              <div style={S.badgeRow}>
                <span style={S.langBadge}>{course.language || "code"}</span>
                <span style={S.levelBadge}>{course.level || "all levels"}</span>
                <span style={S.accessBadge(course.accessLevel)}>
                  {course.accessLevel === "premium" ? "PREMIUM" : "FREE"}
                </span>
              </div>

              <div style={S.metaRow}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FiLayers /> {course.lessonCount || 0} lessons
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <FiClock /> {course.estimatedDurationMinutes || 0}m duration
                </span>
              </div>

              <div style={S.actionRow}>
                <button
                  type="button"
                  onClick={() => onSelectCourse && onSelectCourse(id)}
                  style={S.btnPrimary}
                >
                  <FiBookOpen /> Curriculum
                </button>

                <button
                  type="button"
                  onClick={() => setEditingCourse(course)}
                  style={S.btnSecondary}
                >
                  <FiEdit /> Metadata
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAccess(course)}
                  style={S.btnSecondary}
                  title="Toggle between Free and Premium"
                >
                  {course.accessLevel === "premium" ? <FiUnlock /> : <FiLock />}
                  {course.accessLevel === "premium" ? "Make Free" : "Make Premium"}
                </button>

                {course.publicationStatus !== "published" && (
                  <button
                    type="button"
                    onClick={() => handlePublish(id)}
                    style={{ ...S.btnSecondary, color: "#34d399", borderColor: "rgba(16,185,129,0.4)" }}
                  >
                    <FiUpload /> Publish
                  </button>
                )}

                {course.publicationStatus !== "archived" && (
                  <button
                    type="button"
                    onClick={() => handleArchive(id)}
                    style={{ ...S.btnSecondary, color: "#c084fc", borderColor: "rgba(168,85,247,0.4)" }}
                  >
                    <FiArchive /> Archive
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

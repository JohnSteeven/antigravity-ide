import React, { useState } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiCode,
  FiEye,
  FiCheck,
  FiX,
  FiBook,
  FiLayers,
} from "react-icons/fi";
import { learnApi } from "../../../services/apiService";

const LESSON_TYPES = [
  { value: "coding", label: "Interactive Coding Exercise" },
  { value: "practice", label: "Practice Challenge" },
  { value: "project", label: "Project / Capstone" },
  { value: "quiz", label: "Quiz Assessment" },
  { value: "text", label: "Text / Reading" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio / Podcast" },
  { value: "mixed", label: "Mixed Media" },
];

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  trackSelectorRow: {
    display: "flex",
    gap: "0.5rem",
    overflowX: "auto",
    paddingBottom: "0.5rem",
    borderBottom: "1px solid #334155",
  },
  trackPill: (active) => ({
    background: active ? "#0284c7" : "#1e293b",
    color: active ? "#ffffff" : "#94a3b8",
    border: `1px solid ${active ? "#0284c7" : "#334155"}`,
    borderRadius: "20px",
    padding: "0.4rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  }),
  moduleCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
  },
  moduleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  moduleTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#f8fafc",
    margin: 0,
  },
  moduleDesc: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    margin: "0.25rem 0 1rem",
  },
  lessonList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  lessonItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.65rem 0.85rem",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
  },
  lessonTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#f8fafc",
  },
  typeBadge: (type) => {
    const isCode = type === "coding" || type === "practice" || type === "project";
    return {
      fontSize: "0.72rem",
      fontWeight: 600,
      padding: "0.15rem 0.45rem",
      borderRadius: "4px",
      background: isCode ? "rgba(56,189,248,0.15)" : "rgba(148,163,184,0.15)",
      color: isCode ? "#38bdf8" : "#94a3b8",
      border: `1px solid ${isCode ? "rgba(56,189,248,0.3)" : "rgba(148,163,184,0.3)"}`,
      marginLeft: "0.5rem",
    };
  },
  previewBadge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: "rgba(16,185,129,0.15)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.3)",
    marginLeft: "0.4rem",
  },
  iconBtn: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#cbd5e1",
    borderRadius: "4px",
    padding: "0.25rem 0.45rem",
    cursor: "pointer",
    fontSize: "0.8rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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
  inlineForm: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "1rem",
    marginTop: "0.75rem",
  },
};

export default function CodingCurriculumTab({
  courses,
  selectedCourseId,
  onSelectCourse,
  onEditLesson,
  onRefresh,
}) {
  const [activeCourseId, setActiveCourseId] = useState(selectedCourseId || (courses[0]?.id || courses[0]?._id || ""));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Module creation state
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");

  // Module edit state: { moduleId, title, description }
  const [editingModule, setEditingModule] = useState(null);

  // Lesson creation state: { moduleId, title, lessonType, isPreview }
  const [addingLessonModuleId, setAddingLessonModuleId] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState("coding");
  const [newLessonIsPreview, setNewLessonIsPreview] = useState(false);

  // Keep track of active course
  const currentCourse = courses.find((c) => (c.id || c._id) === activeCourseId) || courses[0];
  const curriculum = currentCourse?.curriculum || [];

  const handleSelectTrack = (id) => {
    setActiveCourseId(id);
    if (onSelectCourse) onSelectCourse(id);
  };

  // Add Module
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!currentCourse) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingCreateModule(currentCourse.id || currentCourse._id, {
        title: newModuleTitle,
        description: newModuleDesc,
      });
      setMessage("Module created successfully.");
      setNewModuleTitle("");
      setNewModuleDesc("");
      setShowAddModule(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to create module.");
    } finally {
      setBusy(false);
    }
  };

  // Update Module
  const handleUpdateModule = async (e) => {
    e.preventDefault();
    if (!currentCourse || !editingModule) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingUpdateModule(
        currentCourse.id || currentCourse._id,
        editingModule.id,
        { title: editingModule.title, description: editingModule.description }
      );
      setMessage("Module updated successfully.");
      setEditingModule(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to update module.");
    } finally {
      setBusy(false);
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm("Delete this module and soft-delete all lessons inside it?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingDeleteModule(currentCourse.id || currentCourse._id, moduleId);
      setMessage("Module deleted.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to delete module.");
    } finally {
      setBusy(false);
    }
  };

  // Move Module Up/Down
  const handleMoveModule = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= curriculum.length) return;
    const reordered = [...curriculum];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    const orderedIds = reordered.map((m) => m.id);

    setBusy(true);
    setError("");
    try {
      await learnApi.adminCodingReorderModules(currentCourse.id || currentCourse._id, { orderedIds });
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to reorder modules.");
    } finally {
      setBusy(false);
    }
  };

  // Add Lesson
  const handleCreateLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingCreateLesson(currentCourse.id || currentCourse._id, moduleId, {
        title: newLessonTitle,
        lessonType: newLessonType,
        isPreview: newLessonIsPreview,
      });
      setMessage("Lesson created in Draft status.");
      setNewLessonTitle("");
      setNewLessonType("coding");
      setNewLessonIsPreview(false);
      setAddingLessonModuleId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to create lesson.");
    } finally {
      setBusy(false);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Soft-delete this lesson? It will be removed from curriculum.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingDeleteLesson(lessonId);
      setMessage("Lesson deleted.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to delete lesson.");
    } finally {
      setBusy(false);
    }
  };

  // Move Lesson Up/Down
  const handleMoveLesson = async (moduleId, lessons, index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;
    const reordered = [...lessons];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    const orderedIds = reordered.map((l) => l.id || l._id);

    setBusy(true);
    setError("");
    try {
      await learnApi.adminCodingReorderLessons(currentCourse.id || currentCourse._id, moduleId, { orderedIds });
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to reorder lessons.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.container}>
      {/* Track Selector Bar */}
      <div>
        <label style={S.label}>Select Track to Manage Curriculum:</label>
        <div style={S.trackSelectorRow}>
          {courses.map((course) => {
            const cid = course.id || course._id;
            const active = cid === (currentCourse?.id || currentCourse?._id);
            return (
              <button
                key={cid}
                type="button"
                onClick={() => handleSelectTrack(cid)}
                style={S.trackPill(active)}
              >
                {course.title} ({course.lessonCount || 0})
              </button>
            );
          })}
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

      {/* Curriculum Overview */}
      {currentCourse ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                {currentCourse.title} — Modules ({curriculum.length})
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>
                Add, reorder, and configure modules and lessons for this track.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModule(!showAddModule)}
              style={S.btnPrimary}
            >
              <FiPlus /> Add Module
            </button>
          </div>

          {/* New Module Form */}
          {showAddModule && (
            <form onSubmit={handleCreateModule} style={{ ...S.moduleCard, marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ margin: 0, color: "#f8fafc" }}>New Curriculum Module</h4>
                <button
                  type="button"
                  onClick={() => setShowAddModule(false)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  <FiX />
                </button>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={S.label}>Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Getting Started & Syntax Fundamentals"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  style={S.input}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={S.label}>Module Description (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short description of what learners will study in this module..."
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  style={{ ...S.input, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" disabled={busy} style={S.btnPrimary}>
                  {busy ? "Creating…" : "Save Module"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModule(false)}
                  style={{ ...S.btnPrimary, background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Modules List */}
          {curriculum.length === 0 ? (
            <div style={{ ...S.moduleCard, textAlign: "center", padding: "2.5rem 1rem", color: "#94a3b8" }}>
              <FiLayers style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#64748b" }} />
              <p style={{ margin: "0.5rem 0" }}>No modules created yet for this track.</p>
              <button
                type="button"
                onClick={() => setShowAddModule(true)}
                style={S.btnPrimary}
              >
                <FiPlus /> Add First Module
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {curriculum.map((module, mIdx) => {
                const lessons = module.lessons || [];
                const isEditing = editingModule?.id === module.id;

                return (
                  <div key={module.id || module.stableKey || mIdx} style={S.moduleCard}>
                    {/* Module Header */}
                    <div style={S.moduleHeader}>
                      <div>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#38bdf8", fontWeight: 700 }}>
                          Module {mIdx + 1}
                        </span>
                        <h4 style={S.moduleTitle}>{module.title}</h4>
                      </div>

                      <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                        <button
                          type="button"
                          disabled={mIdx === 0 || busy}
                          onClick={() => handleMoveModule(mIdx, -1)}
                          style={{ ...S.iconBtn, opacity: mIdx === 0 ? 0.35 : 1 }}
                          title="Move module up"
                        >
                          <FiChevronUp />
                        </button>
                        <button
                          type="button"
                          disabled={mIdx === curriculum.length - 1 || busy}
                          onClick={() => handleMoveModule(mIdx, 1)}
                          style={{ ...S.iconBtn, opacity: mIdx === curriculum.length - 1 ? 0.35 : 1 }}
                          title="Move module down"
                        >
                          <FiChevronDown />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingModule({ id: module.id, title: module.title, description: module.description || "" })}
                          style={S.iconBtn}
                          title="Edit module metadata"
                        >
                          <FiEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(module.id)}
                          style={{ ...S.iconBtn, color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                          title="Delete module"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    {module.description && <p style={S.moduleDesc}>{module.description}</p>}

                    {/* Inline Module Edit Form */}
                    {isEditing && (
                      <form onSubmit={handleUpdateModule} style={S.inlineForm}>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <label style={S.label}>Edit Module Title</label>
                          <input
                            type="text"
                            required
                            value={editingModule.title}
                            onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                            style={S.input}
                          />
                        </div>
                        <div style={{ marginBottom: "0.75rem" }}>
                          <label style={S.label}>Edit Module Description</label>
                          <textarea
                            rows={2}
                            value={editingModule.description}
                            onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                            style={{ ...S.input, resize: "vertical" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="submit" disabled={busy} style={S.btnPrimary}>
                            Save Module
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingModule(null)}
                            style={{ ...S.btnPrimary, background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Lessons List in Module */}
                    <div style={{ marginTop: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                          Lessons ({lessons.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setAddingLessonModuleId(addingLessonModuleId === module.id ? null : module.id)}
                          style={{ ...S.btnPrimary, padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
                        >
                          <FiPlus /> Add Lesson
                        </button>
                      </div>

                      {/* Add Lesson Form */}
                      {addingLessonModuleId === module.id && (
                        <div style={{ ...S.inlineForm, marginBottom: "0.75rem" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
                            <div>
                              <label style={S.label}>Lesson Title *</label>
                              <input
                                type="text"
                                placeholder="e.g. Variable Declarations with let and const"
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                style={S.input}
                              />
                            </div>
                            <div>
                              <label style={S.label}>Lesson Type</label>
                              <select
                                value={newLessonType}
                                onChange={(e) => setNewLessonType(e.target.value)}
                                style={S.input}
                              >
                                {LESSON_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <input
                              type="checkbox"
                              id={`preview-${module.id}`}
                              checked={newLessonIsPreview}
                              onChange={(e) => setNewLessonIsPreview(e.target.checked)}
                            />
                            <label htmlFor={`preview-${module.id}`} style={{ fontSize: "0.82rem", color: "#cbd5e1", cursor: "pointer" }}>
                              Allow Free Public Preview (even if course is Premium)
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => handleCreateLesson(module.id)}
                              disabled={busy || !newLessonTitle.trim()}
                              style={S.btnPrimary}
                            >
                              {busy ? "Adding…" : "Add Lesson"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingLessonModuleId(null)}
                              style={{ ...S.btnPrimary, background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lessons list */}
                      {lessons.length === 0 ? (
                        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.5rem 0" }}>
                          No lessons in this module yet.
                        </p>
                      ) : (
                        <div style={S.lessonList}>
                          {lessons.map((lesson, lIdx) => (
                            <div key={lesson.id || lesson._id || lIdx} style={S.lessonItem}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.75rem", color: "#64748b", width: "1.2rem" }}>
                                  {lIdx + 1}.
                                </span>
                                <span style={S.lessonTitle}>{lesson.title}</span>
                                <span style={S.typeBadge(lesson.lessonType)}>
                                  {lesson.lessonType || "coding"}
                                </span>
                                {lesson.isPreview && (
                                  <span style={S.previewBadge}>PREVIEW</span>
                                )}
                              </div>

                              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                                <button
                                  type="button"
                                  disabled={lIdx === 0 || busy}
                                  onClick={() => handleMoveLesson(module.id, lessons, lIdx, -1)}
                                  style={{ ...S.iconBtn, opacity: lIdx === 0 ? 0.35 : 1 }}
                                  title="Move lesson up"
                                >
                                  <FiChevronUp />
                                </button>
                                <button
                                  type="button"
                                  disabled={lIdx === lessons.length - 1 || busy}
                                  onClick={() => handleMoveLesson(module.id, lessons, lIdx, 1)}
                                  style={{ ...S.iconBtn, opacity: lIdx === lessons.length - 1 ? 0.35 : 1 }}
                                  title="Move lesson down"
                                >
                                  <FiChevronDown />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditLesson && onEditLesson(lesson)}
                                  style={{ ...S.btnPrimary, padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
                                  title="Open full lesson editor"
                                >
                                  <FiEdit /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLesson(lesson.id || lesson._id)}
                                  style={{ ...S.iconBtn, color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                                  title="Delete lesson"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: "#94a3b8" }}>Select a track to view curriculum.</div>
      )}
    </div>
  );
}

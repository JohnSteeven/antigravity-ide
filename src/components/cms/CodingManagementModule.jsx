import React, { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiCode,
  FiEdit,
  FiFileText,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { learnApi } from "../../services/apiService";

const RESOURCE_TYPES = [
  { value: "pdf", label: "PDF Document" },
  { value: "image", label: "Image / Diagram" },
  { value: "code_file", label: "Code File (.html, .css, .js, .py)" },
  { value: "zip", label: "ZIP Archive / Starter Pack" },
  { value: "link", label: "External Documentation Link" },
  { value: "text_notes", label: "Text / Markdown Notes" },
];

const RESOURCE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "cheat_sheet", label: "Cheat Sheet" },
  { value: "course_notes", label: "Course Notes" },
  { value: "starter_file", label: "Starter File" },
  { value: "solution_file", label: "Solution File" },
  { value: "reference_guide", label: "Reference Guide" },
  { value: "practice_set", label: "Practice Set" },
];

export default function CodingManagementModule() {
  const [activeTab, setActiveTab] = useState("courses"); // "courses" | "lessons" | "materials"
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    resourceType: "pdf",
    resourceCategory: "general",
    accessLevel: "free",
    externalUrl: "",
    filename: "",
    textContent: "",
    courseId: "",
    lessonId: "",
  });
  const [state, setState] = useState({ loading: true, busy: false, error: "", message: "" });

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const [coursesRes, materialsRes] = await Promise.all([
        learnApi.adminCodingCourses(),
        learnApi.adminCodingMaterials(),
      ]);
      const fetchedCourses = coursesRes.data || [];
      setCourses(fetchedCourses);
      setMaterials(materialsRes.data || []);
      if (!selectedCourseId && fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0].id);
      }
      setState((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Selected Course
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Update Course (e.g. Access Level, Title, etc.)
  const handleSaveCourse = async (courseToSave) => {
    setState((prev) => ({ ...prev, busy: true, error: "", message: "" }));
    try {
      await learnApi.adminCodingUpdateCourse(courseToSave.id, {
        title: courseToSave.title,
        subtitle: courseToSave.subtitle,
        description: courseToSave.description,
        accessLevel: courseToSave.accessLevel,
        publicationStatus: courseToSave.publicationStatus,
      });
      setState((prev) => ({ ...prev, busy: false, message: "Course updated successfully." }));
      setEditingCourse(null);
      await loadData();
    } catch (err) {
      setState((prev) => ({ ...prev, busy: false, error: err.message }));
    }
  };

  // Open Lesson Editor
  const handleEditLesson = async (lessonSummary) => {
    setState((prev) => ({ ...prev, busy: true, error: "" }));
    try {
      const res = await learnApi.adminCodingLesson(lessonSummary.id);
      setSelectedLesson(res.data);
      setActiveTab("lessons");
      setState((prev) => ({ ...prev, busy: false }));
    } catch (err) {
      setState((prev) => ({ ...prev, busy: false, error: err.message }));
    }
  };

  // Save Lesson Edits
  const handleSaveLesson = async () => {
    if (!selectedLesson) return;
    setState((prev) => ({ ...prev, busy: true, error: "", message: "" }));
    try {
      await learnApi.adminCodingUpdateLesson(selectedLesson._id || selectedLesson.id, {
        title: selectedLesson.title,
        description: selectedLesson.description,
        body: selectedLesson.body,
        lessonType: selectedLesson.lessonType,
        isPreview: selectedLesson.isPreview,
        codingBlocks: selectedLesson.codingBlocks,
        quizQuestions: selectedLesson.quizQuestions,
      });
      setState((prev) => ({ ...prev, busy: false, message: "Lesson updated successfully." }));
      await loadData();
    } catch (err) {
      setState((prev) => ({ ...prev, busy: false, error: err.message }));
    }
  };

  // Create Attached Material
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, busy: true, error: "", message: "" }));
    try {
      await learnApi.adminCodingCreateMaterial({
        ...materialForm,
        courseId: materialForm.courseId || selectedCourseId || null,
        lessonId: materialForm.lessonId || null,
      });
      setState((prev) => ({ ...prev, busy: false, message: "Material attached successfully." }));
      setMaterialForm({
        title: "",
        description: "",
        resourceType: "pdf",
        resourceCategory: "general",
        accessLevel: "free",
        externalUrl: "",
        filename: "",
        textContent: "",
        courseId: "",
        lessonId: "",
      });
      await loadData();
    } catch (err) {
      setState((prev) => ({ ...prev, busy: false, error: err.message }));
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Delete this learning material?")) return;
    setState((prev) => ({ ...prev, busy: true, error: "", message: "" }));
    try {
      await learnApi.adminCodingDeleteMaterial(id);
      setState((prev) => ({ ...prev, busy: false, message: "Material deleted." }));
      await loadData();
    } catch (err) {
      setState((prev) => ({ ...prev, busy: false, error: err.message }));
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Module Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#0284c7", fontWeight: 700 }}>
            System Content Management
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0.25rem 0 0" }}>
            Coding Curriculum &amp; Materials
          </h1>
        </div>
        <button
          type="button"
          onClick={loadData}
          style={{
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "0.45rem 0.85rem",
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Status Messages */}
      {state.message && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {state.message}
        </div>
      )}
      {state.error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {state.error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #334155", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setActiveTab("courses")}
          style={{
            background: activeTab === "courses" ? "#1e293b" : "transparent",
            color: activeTab === "courses" ? "#38bdf8" : "#94a3b8",
            border: "none",
            borderBottom: activeTab === "courses" ? "2px solid #38bdf8" : "2px solid transparent",
            padding: "0.6rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Canonical Tracks &amp; Access
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("lessons")}
          style={{
            background: activeTab === "lessons" ? "#1e293b" : "transparent",
            color: activeTab === "lessons" ? "#38bdf8" : "#94a3b8",
            border: "none",
            borderBottom: activeTab === "lessons" ? "2px solid #38bdf8" : "2px solid transparent",
            padding: "0.6rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Curriculum &amp; Code Blocks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("materials")}
          style={{
            background: activeTab === "materials" ? "#1e293b" : "transparent",
            color: activeTab === "materials" ? "#38bdf8" : "#94a3b8",
            border: "none",
            borderBottom: activeTab === "materials" ? "2px solid #38bdf8" : "2px solid transparent",
            padding: "0.6rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Attached Materials ({materials.length})
        </button>
      </div>

      {/* Tab 1: Courses & Access Control */}
      {activeTab === "courses" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {courses.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 700 }}>{c.title}</h3>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: c.accessLevel === "premium" ? "rgba(168,85,247,0.15)" : "rgba(16,185,129,0.15)",
                      color: c.accessLevel === "premium" ? "#c084fc" : "#34d399",
                    }}
                  >
                    {c.accessLevel === "premium" ? "PREMIUM" : "FREE"}
                  </span>
                </div>

                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 1rem" }}>
                  {c.subtitle || c.description}
                </p>

                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem" }}>
                  Lessons: {c.lessonCount || 0} • Status: {c.publicationStatus}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveCourse({
                        ...c,
                        accessLevel: c.accessLevel === "premium" ? "free" : "premium",
                      })
                    }
                    style={{
                      flex: 1,
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#f8fafc",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Toggle to {c.accessLevel === "premium" ? "Free" : "Premium"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setActiveTab("lessons");
                    }}
                    style={{
                      background: "#0284c7",
                      border: "none",
                      color: "#ffffff",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Edit Curriculum
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Curriculum & Code Blocks */}
      {activeTab === "lessons" && (
        <div>
          {!selectedLesson ? (
            <div>
              {/* Course Selector */}
              <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourseId(c.id)}
                    style={{
                      background: selectedCourseId === c.id ? "#0284c7" : "#1e293b",
                      color: "#f8fafc",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      padding: "0.45rem 1rem",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>

              {activeCourse && activeCourse.curriculum ? (
                <div>
                  {activeCourse.curriculum.map((module, mIdx) => (
                    <div
                      key={module.stableKey || mIdx}
                      style={{
                        background: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "8px",
                        padding: "1.25rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.75rem", fontWeight: 700 }}>
                        Module {mIdx + 1}: {module.title}
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {module.lessons?.map((lesson) => (
                          <div
                            key={lesson.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.6rem 0.85rem",
                              background: "#1e293b",
                              borderRadius: "6px",
                            }}
                          >
                            <div>
                              <strong>{lesson.title}</strong>
                              <span style={{ marginLeft: "0.6rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                                ({lesson.lessonType})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditLesson(lesson)}
                              style={{
                                background: "#0284c7",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              <FiEdit /> Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8" }}>No curriculum found for this track.</p>
              )}
            </div>
          ) : (
            /* Selected Lesson Editor */
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedLesson(null)}
                  style={{
                    background: "transparent",
                    color: "#94a3b8",
                    border: "1px solid #334155",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  ← Back to Modules
                </button>
                <button
                  type="button"
                  onClick={handleSaveLesson}
                  disabled={state.busy}
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.45rem 1.25rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontWeight: 600,
                  }}
                >
                  <FiSave /> {state.busy ? "Saving…" : "Save Lesson"}
                </button>
              </div>

              {/* Lesson Title */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={selectedLesson.title || ""}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </div>

              {/* Lesson Body / Explanation */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Lesson Body / Concept Explanation
                </label>
                <textarea
                  rows={6}
                  value={selectedLesson.body || ""}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, body: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px", fontFamily: "inherit" }}
                />
              </div>

              {/* Primary Coding Block */}
              {selectedLesson.codingBlocks?.[0] && (
                <div style={{ background: "#131d33", border: "1px solid #24344d", borderRadius: "6px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Interactive Coding Block</h4>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                      Challenge Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={selectedLesson.codingBlocks[0].instructions || ""}
                      onChange={(e) => {
                        const updated = [...selectedLesson.codingBlocks];
                        updated[0].instructions = e.target.value;
                        setSelectedLesson({ ...selectedLesson, codingBlocks: updated });
                      }}
                      style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                      Starter Code
                    </label>
                    <textarea
                      rows={6}
                      value={selectedLesson.codingBlocks[0].starterCode || ""}
                      onChange={(e) => {
                        const updated = [...selectedLesson.codingBlocks];
                        updated[0].starterCode = e.target.value;
                        setSelectedLesson({ ...selectedLesson, codingBlocks: updated });
                      }}
                      style={{ width: "100%", background: "#090d16", border: "1px solid #334155", color: "#38bdf8", padding: "0.5rem", borderRadius: "4px", fontFamily: "monospace" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                      Official Solution Code
                    </label>
                    <textarea
                      rows={6}
                      value={selectedLesson.codingBlocks[0].solutionCode || ""}
                      onChange={(e) => {
                        const updated = [...selectedLesson.codingBlocks];
                        updated[0].solutionCode = e.target.value;
                        setSelectedLesson({ ...selectedLesson, codingBlocks: updated });
                      }}
                      style={{ width: "100%", background: "#090d16", border: "1px solid #334155", color: "#34d399", padding: "0.5rem", borderRadius: "4px", fontFamily: "monospace" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attached Materials */}
      {activeTab === "materials" && (
        <div>
          {/* Create Material Form */}
          <form
            onSubmit={handleCreateMaterial}
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>
              Attach Learning Material
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HTML Forms Cheat Sheet.pdf"
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Filename
                </label>
                <input
                  type="text"
                  placeholder="e.g. forms-cheatsheet.pdf"
                  value={materialForm.filename}
                  onChange={(e) => setMaterialForm({ ...materialForm, filename: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Resource Type
                </label>
                <select
                  value={materialForm.resourceType}
                  onChange={(e) => setMaterialForm({ ...materialForm, resourceType: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Category
                </label>
                <select
                  value={materialForm.resourceCategory}
                  onChange={(e) => setMaterialForm({ ...materialForm, resourceCategory: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                >
                  {RESOURCE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  Access Level
                </label>
                <select
                  value={materialForm.accessLevel}
                  onChange={(e) => setMaterialForm({ ...materialForm, accessLevel: e.target.value })}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
                >
                  <option value="free">Free for All</option>
                  <option value="premium">Premium Required</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                External / Download URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/materials/..."
                value={materialForm.externalUrl}
                onChange={(e) => setMaterialForm({ ...materialForm, externalUrl: e.target.value })}
                style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                Description
              </label>
              <textarea
                rows={2}
                value={materialForm.description}
                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "0.5rem", borderRadius: "4px" }}
              />
            </div>

            <button
              type="submit"
              disabled={state.busy}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "4px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Attach Material
            </button>
          </form>

          {/* List of Attached Materials */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {materials.map((item) => (
              <div
                key={item._id}
                style={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <strong>{item.title}</strong>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        background: item.accessLevel === "premium" ? "rgba(168,85,247,0.15)" : "rgba(16,185,129,0.15)",
                        color: item.accessLevel === "premium" ? "#c084fc" : "#34d399",
                      }}
                    >
                      {item.accessLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                    Type: {item.resourceType} • Category: {item.resourceCategory}
                    {item.filename && ` • File: ${item.filename}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMaterial(item._id)}
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid #ef4444",
                    color: "#f87171",
                    padding: "0.35rem 0.65rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


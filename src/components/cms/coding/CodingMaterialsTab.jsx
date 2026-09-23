import React, { useState } from "react";
import {
  FiFileText,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiExternalLink,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiLock,
  FiUnlock,
} from "react-icons/fi";
import { learnApi } from "../../../services/apiService";

const RESOURCE_TYPES = [
  { value: "link", label: "External Documentation Link" },
  { value: "text_notes", label: "Text / Markdown Notes" },
  { value: "pdf", label: "PDF Document (External URL)" },
  { value: "image", label: "Diagram / Image (External URL)" },
  { value: "code_file", label: "Code File (External URL)" },
  { value: "zip", label: "ZIP Starter Pack (External URL)" },
];

const RESOURCE_CATEGORIES = [
  { value: "general", label: "General Reference" },
  { value: "cheat_sheet", label: "Syntax Cheat Sheet" },
  { value: "course_notes", label: "Course Study Notes" },
  { value: "starter_file", label: "Starter Template" },
  { value: "solution_file", label: "Canonical Solution Guide" },
  { value: "reference_guide", label: "Official Reference Guide" },
  { value: "practice_set", label: "Additional Practice Set" },
];

const S = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  warningCard: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.35)",
    borderRadius: "8px",
    padding: "0.85rem 1.15rem",
    color: "#fbbf24",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    lineHeight: 1.5,
  },
  formCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
  },
  materialCard: {
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
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  meta: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    display: "flex",
    gap: "0.6rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: (type) => ({
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: "rgba(56,189,248,0.15)",
    color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.3)",
  }),
  accessBadge: (level) => ({
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    background: level === "premium" ? "rgba(168,85,247,0.18)" : "rgba(16,185,129,0.18)",
    color: level === "premium" ? "#c084fc" : "#34d399",
    border: `1px solid ${level === "premium" ? "rgba(168,85,247,0.3)" : "rgba(16,185,129,0.3)"}`,
  }),
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
    padding: "0.35rem 0.65rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  btnDanger: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#f87171",
    padding: "0.35rem 0.65rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
};

export default function CodingMaterialsTab({ materials = [], courses = [], onRefresh }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    resourceType: "link",
    resourceCategory: "cheat_sheet",
    accessLevel: "free",
    externalUrl: "",
    filename: "",
    textContent: "",
    courseId: "",
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingCreateMaterial({
        ...form,
        courseId: form.courseId || null,
      });
      setMessage("Material attached successfully.");
      setForm({
        title: "",
        description: "",
        resourceType: "link",
        resourceCategory: "cheat_sheet",
        accessLevel: "free",
        externalUrl: "",
        filename: "",
        textContent: "",
        courseId: "",
      });
      setShowAddForm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to create material.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingUpdateMaterial(editingMaterial._id || editingMaterial.id, {
        title: editingMaterial.title,
        description: editingMaterial.description,
        resourceType: editingMaterial.resourceType,
        resourceCategory: editingMaterial.resourceCategory,
        accessLevel: editingMaterial.accessLevel,
        externalUrl: editingMaterial.externalUrl,
        textContent: editingMaterial.textContent,
        courseId: editingMaterial.courseId || null,
      });
      setMessage("Material updated successfully.");
      setEditingMaterial(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to update material.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Soft-delete this learning material?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await learnApi.adminCodingDeleteMaterial(id);
      setMessage("Material deleted.");
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Failed to delete material.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.container}>
      {/* Notice about Amendment #4: No fake file upload */}
      <div style={S.warningCard}>
        <FiAlertTriangle style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" }} />
        <div>
          <strong>Storage Architecture Notice (Phase 18 Deferred):</strong>
          <div style={{ marginTop: "0.2rem" }}>
            Binary file uploads (multipart PDF, ZIP, code bundles) to Cloudflare R2 / S3 storage are scheduled for Phase 18. Currently, materials are attached using <strong>External Documentation Links</strong> or <strong>Inlined Text / Markdown Notes</strong>.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            Attached Learning Materials ({materials.length})
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
            Reference guides, cheatsheets, and documentation attached to coding tracks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          style={S.btnPrimary}
        >
          <FiPlus /> Attach Material
        </button>
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

      {/* Add Material Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} style={S.formCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Attach New Learning Material
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <FiX />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Material Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Modern CSS Flexbox & Grid Quick Reference"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Attach to Coding Track (Optional)</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                style={S.input}
              >
                <option value="">Global / All Tracks</option>
                {courses.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Resource Type</label>
              <select
                value={form.resourceType}
                onChange={(e) => setForm({ ...form, resourceType: e.target.value })}
                style={S.input}
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Category</label>
              <select
                value={form.resourceCategory}
                onChange={(e) => setForm({ ...form, resourceCategory: e.target.value })}
                style={S.input}
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Access Level</label>
              <select
                value={form.accessLevel}
                onChange={(e) => setForm({ ...form, accessLevel: e.target.value })}
                style={S.input}
              >
                <option value="free">Free for All</option>
                <option value="premium">Premium Required</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>External URL (HTTPS documentation link)</label>
            <input
              type="url"
              placeholder="https://developer.mozilla.org/..."
              value={form.externalUrl}
              onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
              style={S.input}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>Inlined Text Notes / Markdown</label>
            <textarea
              rows={4}
              placeholder="Cheatsheet notes, syntax reminders, or Markdown text..."
              value={form.textContent}
              onChange={(e) => setForm({ ...form, textContent: e.target.value })}
              style={{ ...S.input, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={S.label}>Description</label>
            <input
              type="text"
              placeholder="Short description of this resource..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={S.input}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={busy} style={S.btnPrimary}>
              {busy ? "Attaching…" : "Save Material"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={S.btnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Edit Material Form */}
      {editingMaterial && (
        <form onSubmit={handleUpdate} style={S.formCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              Edit Material: {editingMaterial.title}
            </h3>
            <button
              type="button"
              onClick={() => setEditingMaterial(null)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <FiX />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Title</label>
              <input
                type="text"
                value={editingMaterial.title || ""}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                style={S.input}
              />
            </div>
            <div>
              <label style={S.label}>Access Level</label>
              <select
                value={editingMaterial.accessLevel || "free"}
                onChange={(e) => setEditingMaterial({ ...editingMaterial, accessLevel: e.target.value })}
                style={S.input}
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>External URL</label>
            <input
              type="url"
              value={editingMaterial.externalUrl || ""}
              onChange={(e) => setEditingMaterial({ ...editingMaterial, externalUrl: e.target.value })}
              style={S.input}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>Inlined Text Notes</label>
            <textarea
              rows={4}
              value={editingMaterial.textContent || ""}
              onChange={(e) => setEditingMaterial({ ...editingMaterial, textContent: e.target.value })}
              style={{ ...S.input, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={busy} style={S.btnPrimary}>
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditingMaterial(null)}
              style={S.btnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Materials List */}
      {materials.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#94a3b8" }}>
          No learning materials attached yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {materials.map((item) => (
            <div key={item._id || item.id} style={S.materialCard}>
              <div>
                <h4 style={S.title}>
                  <FiFileText style={{ color: "#38bdf8" }} />
                  {item.title}
                </h4>
                <div style={S.meta}>
                  <span style={S.badge(item.resourceType)}>{item.resourceType}</span>
                  <span style={{ color: "#cbd5e1" }}>{item.resourceCategory}</span>
                  <span style={S.accessBadge(item.accessLevel)}>
                    {item.accessLevel === "premium" ? "PREMIUM" : "FREE"}
                  </span>
                  {item.courseId?.title && (
                    <span style={{ color: "#64748b" }}>Track: {item.courseId.title}</span>
                  )}
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                    >
                      <FiExternalLink /> Link
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingMaterial(item)}
                  style={S.btnSecondary}
                >
                  <FiEdit /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item._id || item.id)}
                  style={S.btnDanger}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

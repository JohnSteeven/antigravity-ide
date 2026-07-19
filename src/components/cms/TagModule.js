import React, { useState, useMemo } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiTag,
  FiInfo,
  FiAlertCircle,
  FiSave,
  FiRotateCcw,
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function TagModule() {
  const { data, saveTag, deleteTag, restoreTag } = useCms();
  const { tags = [], articles = [] } = data;

  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [tagId, setTagId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#426c67");

  // UI Filters / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, usage
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Handle auto slug generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!tagId) {
      setSlug(slugify(val));
    }
  };

  // Validations
  const validateForm = () => {
    if (!name.trim()) {
      setError("Tag Name is required.");
      return false;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return false;
    }

    // Prevent duplicate tag names
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = tags.some(
      (t) => t.name.toLowerCase() === normalizedName && t.id !== tagId && t._id !== tagId
    );

    if (isDuplicate) {
      setError("A tag with this name already exists.");
      return false;
    }

    if (name.length > 30) {
      setError("Tag name cannot exceed 30 characters.");
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setTagId("");
    setName("");
    setSlug("");
    setDescription("");
    setColor("#426c67");
    setError("");
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      await saveTag({
        id: tagId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        color,
      });
      setSuccess(
        tagId ? "Tag updated successfully!" : "Tag created successfully!"
      );
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save tag.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Click
  const handleEdit = (tag) => {
    setError("");
    setSuccess("");
    setTagId(tag.id || tag._id);
    setName(tag.name);
    setSlug(tag.slug);
    setDescription(tag.description || "");
    setColor(tag.color || "#426c67");
  };

  // Handle Delete
  const handleDelete = async (id, tagName) => {
    if (!window.confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await deleteTag(id);
      setSuccess("Tag deleted successfully.");
      if (tagId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to delete tag.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Restore
  const handleRestore = async (id, tagName) => {
    if (!window.confirm(`Are you sure you want to restore the tag "${tagName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await restoreTag(id);
      setSuccess("Tag restored successfully.");
    } catch (err) {
      setError(err.message || "Failed to restore tag.");
    } finally {
      setLoading(false);
    }
  };

  // Usage Count helper
  const getUsageCount = (tag) => {
    const s = tag.slug.toLowerCase();
    const n = tag.name.toLowerCase();
    return articles.filter((a) =>
      (a.tags || []).some(
        (t) => t.toLowerCase() === s || t.toLowerCase() === n
      )
    ).length;
  };

  // Filtered & Sorted Tags
  const processedTags = useMemo(() => {
    let list = [...tags];

    // Filter deleted
    if (!showDeleted) {
      list = list.filter((tag) => !tag.isDeleted);
    } else {
      list = list.filter((tag) => tag.isDeleted);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (tag) =>
          tag.name.toLowerCase().includes(query) ||
          (tag.description && tag.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "usage") {
        return getUsageCount(b) - getUsageCount(a);
      }
      return 0;
    });

    return list;
  }, [tags, searchQuery, sortBy, articles]);

  // Pagination
  const totalPages = Math.ceil(processedTags.length / itemsPerPage);
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedTags.slice(start, start + itemsPerPage);
  }, [processedTags, currentPage]);

  return (
    <div className="cms-grid-two">
      {/* LEFT: Tag Form */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Taxonomy</span>
            <h2>{tagId ? "Edit Tag" : "Create Tag"}</h2>
          </div>
        </div>

        {error && (
          <div className="status-message error" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <FiAlertCircle /> <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="status-message success" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--cms-accent, #426c67)" }}>
            <FiInfo /> <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="form-grid one">
          <label>
            Tag Name *
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. reflection, coding, health"
              disabled={loading}
              maxLength={30}
              required
            />
          </label>

          <label>
            Slug *
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="tag-slug"
              disabled={loading}
              required
            />
          </label>

          <label>
            Description
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional tag description"
              disabled={loading}
              maxLength={200}
            />
          </label>

          <label>
            Tag Color
            <span className="color-input-row" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                style={{
                  border: "none",
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              />
              <span
                className="tag-color-preview"
                style={{
                  backgroundColor: color,
                  padding: "0.3rem 0.8rem",
                  borderRadius: "999px",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {name || "Preview"}
              </span>
            </span>
          </label>

          <div className="inline-actions" style={{ marginTop: "1.5rem" }}>
            <button className="small-solid-btn" type="submit" disabled={loading}>
              <FiSave /> {tagId ? "Update Tag" : "Save Tag"}
            </button>
            {(tagId || name || slug) && (
              <button
                className="small-outline-btn"
                type="button"
                onClick={resetForm}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT: Tags List */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Manage</span>
            <h2>Tags List</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="media-filter-grid" style={{ marginBottom: "1rem", gap: "0.5rem" }}>
          <label className="cms-search-control" style={{ flex: 1 }}>
            <FiSearch />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tags..."
            />
          </label>

          <label style={{ minWidth: "120px" }}>
            Sort By
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name (A-Z)</option>
              <option value="usage">Usage Count</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", minWidth: "110px", fontSize: "0.85rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setCurrentPage(1);
              }}
            />
            Show Deleted
          </label>
        </div>

        {/* Tags List */}
        <div className="tag-list" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.50rem" }}>
          {paginatedTags.map((tag) => {
            const usageCount = getUsageCount(tag);
            const isEditing = tagId === (tag.id || tag._id);

            return (
              <article
                key={tag.id || tag._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: isEditing ? "1px solid var(--cms-accent, #426c67)" : "1px solid #eee",
                  backgroundColor: isEditing ? "#f0f6f5" : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <span
                    className="tag-color-preview"
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: tag.color || "#426c67",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <strong style={{ fontSize: "0.95rem", textDecoration: tag.isDeleted ? "line-through" : "none", color: tag.isDeleted ? "#888" : "inherit" }}>{tag.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>/{tag.slug}</span>
                      {tag.isDeleted && (
                        <span style={{ fontSize: "0.7rem", color: "#e53e3e", backgroundColor: "#fff5f5", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "600", border: "1px solid #fed7d7" }}>
                          Deleted
                        </span>
                      )}
                    </div>
                    {tag.description && (
                      <span style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.1rem" }}>
                        {tag.description}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: "600" }}>
                    {usageCount} posts
                  </span>

                  <div className="inline-actions" style={{ gap: "0.25rem" }}>
                    {tag.isDeleted ? (
                      <button
                        className="small-outline-btn"
                        type="button"
                        title="Restore Tag"
                        onClick={() => handleRestore(tag.id || tag._id, tag.name)}
                        disabled={loading}
                      >
                        <FiRotateCcw size={12} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="small-outline-btn"
                          type="button"
                          title="Edit Tag"
                          onClick={() => handleEdit(tag)}
                          disabled={loading}
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          className="small-outline-btn danger"
                          type="button"
                          title="Delete Tag"
                          onClick={() => handleDelete(tag.id || tag._id, tag.name)}
                          disabled={loading}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {paginatedTags.length === 0 && (
            <p className="empty-state">No tags found matching your query.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
            <button
              className="small-outline-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.85rem", color: "#666" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="small-outline-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLayers,
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

export default function SubCategoryModule() {
  const { data, saveSubCategory, deleteSubCategory, restoreSubCategory } = useCms();
  const { categories = [], subcategories = [], articles = [] } = data;

  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [subCategoryId, setSubCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // UI Filters / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name"); // name, category
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle auto slug generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!subCategoryId) {
      setSlug(slugify(val));
    }
  };

  // Validations
  const validateForm = () => {
    if (!name.trim()) {
      setError("Subcategory Name is required.");
      return false;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return false;
    }
    if (!selectedCategory) {
      setError("Parent Category is required.");
      return false;
    }

    // Prevent duplicate subcategory names within the same category
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = subcategories.some((sub) => {
      const parentId = sub.category?._id || sub.category?.id || sub.category;
      return (
        sub.name.toLowerCase() === normalizedName &&
        String(parentId) === String(selectedCategory) &&
        sub.id !== subCategoryId &&
        sub._id !== subCategoryId
      );
    });

    if (isDuplicate) {
      setError("A subcategory with this name already exists in the selected category.");
      return false;
    }

    if (name.length > 50) {
      setError("Subcategory name cannot exceed 50 characters.");
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setSubCategoryId("");
    setName("");
    setSlug("");
    setDescription("");
    setSelectedCategory("");
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
      await saveSubCategory({
        id: subCategoryId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        category: selectedCategory,
      });
      setSuccess(
        subCategoryId
          ? "Subcategory updated successfully!"
          : "Subcategory created successfully!"
      );
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save subcategory.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Click
  const handleEdit = (sub) => {
    setError("");
    setSuccess("");
    setSubCategoryId(sub.id || sub._id);
    setName(sub.name);
    setSlug(sub.slug);
    setDescription(sub.description || "");
    const parentId = sub.category?._id || sub.category?.id || sub.category;
    setSelectedCategory(parentId || "");
  };

  // Handle Delete
  const handleDelete = async (id, subName) => {
    if (!window.confirm(`Are you sure you want to delete the subcategory "${subName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await deleteSubCategory(id);
      setSuccess("Subcategory deleted successfully.");
      if (subCategoryId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to delete subcategory.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Restore
  const handleRestore = async (id, subName) => {
    if (!window.confirm(`Are you sure you want to restore the subcategory "${subName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await restoreSubCategory(id);
      setSuccess("Subcategory restored successfully.");
    } catch (err) {
      setError(err.message || "Failed to restore subcategory.");
    } finally {
      setLoading(false);
    }
  };

  // Article Count helper
  const getArticleCount = (sub) => {
    const subName = sub.name.toLowerCase();
    return articles.filter(
      (a) => a.subcategory && a.subcategory.toLowerCase() === subName
    ).length;
  };

  // Filtered & Sorted Subcategories
  const processedSubcategories = useMemo(() => {
    let list = [...subcategories];

    // Filter deleted
    if (!showDeleted) {
      list = list.filter((sub) => !sub.isDeleted);
    } else {
      list = list.filter((sub) => sub.isDeleted);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (sub) =>
          sub.name.toLowerCase().includes(query) ||
          (sub.description && sub.description.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      list = list.filter((sub) => {
        const parentId = sub.category?._id || sub.category?.id || sub.category;
        return String(parentId) === String(filterCategory);
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "category") {
        const catA = a.category?.name || "";
        const catB = b.category?.name || "";
        return catA.localeCompare(catB);
      }
      return 0;
    });

    return list;
  }, [subcategories, searchQuery, filterCategory, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedSubcategories.length / itemsPerPage);
  const paginatedSubcategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedSubcategories.slice(start, start + itemsPerPage);
  }, [processedSubcategories, currentPage]);

  return (
    <div className="cms-grid-two">
      {/* LEFT: Subcategory Form */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Taxonomy</span>
            <h2>{subCategoryId ? "Edit Subcategory" : "Create Subcategory"}</h2>
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
            Parent Category *
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Select Parent Category --</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subcategory Name *
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Life Lessons, Web Dev"
              disabled={loading}
              maxLength={50}
              required
            />
          </label>

          <label>
            Slug *
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="subcategory-slug"
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
              placeholder="Brief summary for listings"
              disabled={loading}
              maxLength={200}
            />
          </label>

          <div className="inline-actions" style={{ marginTop: "1rem" }}>
            <button className="small-solid-btn" type="submit" disabled={loading}>
              <FiSave /> {subCategoryId ? "Update Subcategory" : "Save Subcategory"}
            </button>
            {(subCategoryId || name || slug || selectedCategory) && (
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

      {/* RIGHT: Subcategories List */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Manage</span>
            <h2>Subcategories List</h2>
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
              placeholder="Search subcategories..."
            />
          </label>

          <label style={{ minWidth: "120px" }}>
            Filter Category
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ minWidth: "100px" }}>
            Sort By
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name (A-Z)</option>
              <option value="category">Parent Category</option>
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

        {/* Subcategories List */}
        <div className="compact-list editable" style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
          {paginatedSubcategories.map((sub) => {
            const articleCount = getArticleCount(sub);
            const parentName = sub.category?.name || "Unknown Category";
            const isEditing = subCategoryId === (sub.id || sub._id);

            return (
              <div
                key={sub.id || sub._id}
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FiLayers style={{ color: sub.isDeleted ? "#aaa" : "var(--cms-accent, #426c67)" }} />
                    <strong style={{ fontSize: "0.95rem", textDecoration: sub.isDeleted ? "line-through" : "none", color: sub.isDeleted ? "#888" : "inherit" }}>{sub.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#888", backgroundColor: "#f5f5f5", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                      /{sub.slug}
                    </span>
                    {sub.isDeleted && (
                      <span style={{ fontSize: "0.7rem", color: "#e53e3e", backgroundColor: "#fff5f5", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "600", border: "1px solid #fed7d7" }}>
                        Deleted
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#666" }}>
                    {sub.description || "No description provided."}
                  </p>
                  <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#888", display: "flex", gap: "1rem" }}>
                    <span>Parent: <strong style={{ color: "var(--cms-accent, #426c67)" }}>{parentName}</strong></span>
                    <span>Articles: <strong>{articleCount}</strong></span>
                  </div>
                </div>

                <div className="inline-actions" style={{ gap: "0.25rem" }}>
                  {sub.isDeleted ? (
                    <button
                      className="small-outline-btn"
                      type="button"
                      title="Restore Subcategory"
                      onClick={() => handleRestore(sub.id || sub._id, sub.name)}
                      disabled={loading}
                    >
                      <FiRotateCcw size={12} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="small-outline-btn"
                        type="button"
                        title="Edit Subcategory"
                        onClick={() => handleEdit(sub)}
                        disabled={loading}
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        className="small-outline-btn danger"
                        type="button"
                        title="Delete Subcategory"
                        onClick={() => handleDelete(sub.id || sub._id, sub.name)}
                        disabled={loading}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {paginatedSubcategories.length === 0 && (
            <p className="empty-state">No subcategories found matching your query.</p>
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

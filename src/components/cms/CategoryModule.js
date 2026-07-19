import React, { useState, useMemo } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiFolder,
  FiInfo,
  FiFileText,
  FiGrid,
  FiAlertCircle,
  FiSave,
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategoryModule() {
  const { data, saveCategory, deleteCategory, restoreCategory } = useCms();
  const { categories = [], subcategories = [], articles = [] } = data;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [icon, setIcon] = useState("book");
  const [heroImage, setHeroImage] = useState("");

  // UI Filters / Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, created, articles
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle auto slug generation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!categoryId) {
      setSlug(slugify(val));
    }
  };

  // Validations
  const validateForm = () => {
    if (!name.trim()) {
      setError("Category Name is required.");
      return false;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return false;
    }
    
    // Check for duplicate name/slug (excluding current editing category)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicateName = categories.some(
      (c) => c.name.toLowerCase() === normalizedName && c.id !== categoryId && c._id !== categoryId
    );
    if (isDuplicateName) {
      setError("A category with this name already exists.");
      return false;
    }

    const isDuplicateSlug = categories.some(
      (c) => c.slug === slug && c.id !== categoryId && c._id !== categoryId
    );
    if (isDuplicateSlug) {
      setError("A category with this slug already exists.");
      return false;
    }

    if (name.length > 50) {
      setError("Category name cannot exceed 50 characters.");
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setCategoryId("");
    setName("");
    setSlug("");
    setDescription("");
    setLongDescription("");
    setIcon("book");
    setHeroImage("");
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
      await saveCategory({
        id: categoryId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        longDescription: longDescription.trim(),
        icon,
        heroImage: heroImage.trim(),
      });
      setSuccess(categoryId ? "Category updated successfully!" : "Category created successfully!");
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Click
  const handleEdit = (cat) => {
    setError("");
    setSuccess("");
    setCategoryId(cat.id || cat._id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setLongDescription(cat.longDescription || "");
    setIcon(cat.icon || "book");
    setHeroImage(cat.heroImage || "");
  };

  // Handle Delete
  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await deleteCategory(id);
      setSuccess("Category deleted successfully.");
      if (categoryId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Restore
  const handleRestore = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to restore the category "${catName}"?`)) {
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await restoreCategory(id);
      setSuccess("Category restored successfully.");
    } catch (err) {
      setError(err.message || "Failed to restore category.");
    } finally {
      setLoading(false);
    }
  };

  // Counts helper
  const getStats = (cat) => {
    const catName = cat.name.toLowerCase();
    const articleCount = articles.filter(
      (a) => a.category && a.category.toLowerCase() === catName
    ).length;

    const subCount = subcategories.filter(
      (s) => s.category && (s.category.name?.toLowerCase() === catName || s.category === cat.id || s.category === cat._id)
    ).length;

    return { articleCount, subCount };
  };

  // Filtered & Sorted Categories
  const processedCategories = useMemo(() => {
    let list = [...categories];

    // Filter deleted
    if (!showDeleted) {
      list = list.filter((c) => !c.isDeleted);
    } else {
      list = list.filter((c) => c.isDeleted);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "created") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "articles") {
        return getStats(b).articleCount - getStats(a).articleCount;
      }
      return 0;
    });

    return list;
  }, [categories, searchQuery, sortBy, subcategories, articles]);

  // Pagination
  const totalPages = Math.ceil(processedCategories.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedCategories.slice(start, start + itemsPerPage);
  }, [processedCategories, currentPage]);

  return (
    <div className="cms-grid-two">
      {/* LEFT: Category Form */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Taxonomy</span>
            <h2>{categoryId ? "Edit Category" : "Create Category"}</h2>
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
            Category Name *
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Life, Tech, Travel"
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
              placeholder="category-slug"
              disabled={loading}
              required
            />
          </label>

          <label>
            Icon Key
            <select value={icon} onChange={(e) => setIcon(e.target.value)} disabled={loading}>
              <option value="book">Book</option>
              <option value="heart">Heart</option>
              <option value="feather">Feather</option>
              <option value="award">Award</option>
              <option value="send">Send</option>
              <option value="grid">Grid</option>
              <option value="image">Image</option>
              <option value="star">Star</option>
              <option value="briefcase">Briefcase</option>
            </select>
          </label>

          <label>
            Hero Image URL
            <input
              type="text"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              disabled={loading}
            />
          </label>

          <label>
            Short Description
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary for listings"
              disabled={loading}
              maxLength={200}
            />
          </label>

          <label>
            Long Description (Category Page)
            <textarea
              rows="5"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Detailed content for the category detail view"
              disabled={loading}
            />
          </label>

          <div className="inline-actions" style={{ marginTop: "1rem" }}>
            <button className="small-solid-btn" type="submit" disabled={loading}>
              <FiSave /> {categoryId ? "Update Category" : "Save Category"}
            </button>
            {(categoryId || name || slug) && (
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

      {/* RIGHT: Categories List */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Manage</span>
            <h2>Categories List</h2>
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
              placeholder="Search categories..."
            />
          </label>

          <label style={{ minWidth: "140px" }}>
            Sort By
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name (A-Z)</option>
              <option value="created">Newly Created</option>
              <option value="articles">Article Count</option>
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

        {/* Categories List */}
        <div className="compact-list editable" style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
          {paginatedCategories.map((cat) => {
            const { articleCount, subCount } = getStats(cat);
            const isEditing = categoryId === (cat.id || cat._id);

            return (
              <div
                key={cat.id || cat._id}
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
                    <FiFolder style={{ color: cat.isDeleted ? "#aaa" : "var(--cms-accent, #426c67)" }} />
                    <strong style={{ fontSize: "0.95rem", textDecoration: cat.isDeleted ? "line-through" : "none", color: cat.isDeleted ? "#888" : "inherit" }}>{cat.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#888", backgroundColor: "#f5f5f5", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                      /{cat.slug}
                    </span>
                    {cat.isDeleted && (
                      <span style={{ fontSize: "0.7rem", color: "#e53e3e", backgroundColor: "#fff5f5", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "600", border: "1px solid #fed7d7" }}>
                        Deleted
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#666" }}>
                    {cat.description || "No description provided."}
                  </p>
                  <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#888", display: "flex", gap: "1rem" }}>
                    <span>Articles: <strong>{articleCount}</strong></span>
                    <span>Subcategories: <strong>{subCount}</strong></span>
                    <span>Created: <strong>{new Date(cat.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                <div className="inline-actions" style={{ gap: "0.25rem" }}>
                  {cat.isDeleted ? (
                    <button
                      className="small-outline-btn"
                      type="button"
                      title="Restore Category"
                      onClick={() => handleRestore(cat.id || cat._id, cat.name)}
                      disabled={loading}
                    >
                      <FiRotateCcw size={12} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="small-outline-btn"
                        type="button"
                        title="Edit Category"
                        onClick={() => handleEdit(cat)}
                        disabled={loading}
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        className="small-outline-btn danger"
                        type="button"
                        title="Delete Category"
                        onClick={() => handleDelete(cat.id || cat._id, cat.name)}
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

          {paginatedCategories.length === 0 && (
            <p className="empty-state">No categories found matching your query.</p>
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

import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiRotateCcw, FiSearch, FiSave, FiAlertCircle, FiStar, FiFilter } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function TestimonialModule() {
  const { fetchTestimonials, saveTestimonial, deleteTestimonial, restoreTestimonial } = useCms();

  const [testimonials, setTestimonials] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formId, setFormId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    company: "",
    avatar: "",
    testimonial: "",
    rating: 5,
    displayOrder: 0,
    status: "draft",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTestimonials({
        page,
        limit: 10,
        search,
        status: status === "all" ? undefined : status,
        rating: ratingFilter === "all" ? undefined : ratingFilter,
        includeDeleted: showDeleted,
      });
      if (res && res.testimonials) {
        setTestimonials(res.testimonials);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || "Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, status, ratingFilter, showDeleted]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required.");
      return false;
    }
    if (!formData.testimonial.trim()) {
      setError("Testimonial text is required.");
      return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;

    setSaving(true);
    try {
      await saveTestimonial({
        ...formData,
        id: formId,
      });
      setSuccess(formId ? "Testimonial updated." : "Testimonial added.");
      setIsFormOpen(false);
      resetForm();
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save testimonial.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setError("");
    setSuccess("");
    setFormId(item._id || item.id);
    setFormData({
      name: item.name || "",
      designation: item.designation || "",
      company: item.company || "",
      avatar: item.avatar || "",
      testimonial: item.testimonial || "",
      rating: item.rating || 5,
      displayOrder: item.displayOrder || 0,
      status: item.status || "draft",
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormId("");
    setFormData({
      name: "",
      designation: "",
      company: "",
      avatar: "",
      testimonial: "",
      rating: 5,
      displayOrder: 0,
      status: "draft",
    });
    setError("");
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteTestimonial(id);
      setSuccess("Testimonial soft deleted.");
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete testimonial.");
    }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Are you sure you want to restore the testimonial from "${name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await restoreTestimonial(id);
      setSuccess("Testimonial restored successfully.");
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to restore testimonial.");
    }
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Testimonials & Endorsements</h2>
          <p className="kicker">Manage quotes and feedback from readers, clients, and colleagues</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(!isFormOpen);
          }}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          <FiPlus /> {isFormOpen ? "Close Panel" : "Add Testimonial"}
        </button>
      </div>

      {success && <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem" }}>{success}</div>}
      {error && <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

      {/* Slide-out Form Block */}
      {isFormOpen && (
        <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "8px", margin: "1.5rem 0" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
            {formId ? "Modify Testimonial" : "Create New Testimonial"}
          </h3>
          <form onSubmit={handleSave} className="form-grid layout-2-col">
            <label>
              Author Name *
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </label>
            <label>
              Avatar Image URL
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="form-input"
                placeholder="https://example.com/avatar.jpg"
              />
            </label>
            <label>
              Designation / Role
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="form-input"
                placeholder="e.g. Lead Engineer"
              />
            </label>
            <label>
              Company / Place
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="form-input"
                placeholder="e.g. Google"
              />
            </label>
            <label>
              Rating Stars
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="form-input"
              >
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>
            </label>
            <label>
              Display Order (Priority)
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="form-input"
              />
            </label>
            <label>
              Status
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="draft">Draft (Hidden)</option>
                <option value="published">Published (Public)</option>
              </select>
            </label>
            <div style={{ gridColumn: "span 2" }}>
              <label>
                Testimonial Content *
                <textarea
                  rows="4"
                  required
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  className="form-input"
                />
              </label>
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} disabled={saving}>
                <FiSave />
                {saving ? "Saving..." : "Save Testimonial"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filters-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.5rem 0", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Search Name / Text</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem" }}><FiSearch /></button>
          </div>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="form-input">
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Rating Filter</label>
          <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }} className="form-input">
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars or less</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => { setShowDeleted(e.target.checked); setPage(1); }}
            />
            View Deleted
          </label>
        </div>
      </form>

      {/* Testimonials Table */}
      <div className="table-container">
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Author</th>
              <th>Details</th>
              <th>Testimonial Text</th>
              <th>Rating</th>
              <th>Order</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto" }}></div>
                  <p>Loading testimonials...</p>
                </td>
              </tr>
            ) : testimonials.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
                  No testimonials found.
                </td>
              </tr>
            ) : (
              testimonials.map((item) => (
                <tr key={item._id || item.id} style={{ opacity: item.isDeleted ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {item.avatar && (
                        <img src={item.avatar} alt={item.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                      )}
                      <strong>{item.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>
                      {item.designation} {item.company ? `@ ${item.company}` : ""}
                    </span>
                  </td>
                  <td>
                    <p style={{ margin: 0, fontSize: "0.85rem", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.testimonial}>
                      {item.testimonial}
                    </p>
                  </td>
                  <td>
                    <span style={{ display: "flex", color: "#e28743" }}>
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <FiStar key={i} style={{ fill: "currentColor" }} />
                      ))}
                    </span>
                  </td>
                  <td>{item.displayOrder}</td>
                  <td>
                    <span className={`badge ${item.status === "published" ? "badge-success" : "badge-secondary"}`}>
                      {item.status}
                    </span>
                    {item.isDeleted && <span className="badge badge-danger" style={{ marginLeft: "0.25rem" }}>Deleted</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.25rem" }}>
                      {item.isDeleted ? (
                        <button
                          onClick={() => handleRestore(item._id || item.id, item.name)}
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem" }}
                          title="Restore"
                        >
                          <FiRotateCcw />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", color: "#3182ce" }}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id || item.id, item.name)}
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", color: "#e53e3e" }}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            Showing Page {pagination.page} of {pagination.pages} ({pagination.total} entries)
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={page === pagination.pages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

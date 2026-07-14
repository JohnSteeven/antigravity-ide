import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiRotateCcw, FiSearch, FiSave, FiUpload, FiEye, FiEyeOff } from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function GalleryModule() {
  const { fetchGallery, fetchGalleryAlbums, saveGalleryItem, deleteGalleryItem, restoreGalleryItem, uploadMedia } = useCms();

  const [items, setItems] = useState([]);
  const [albums, setAlbums] = useState(["General"]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [albumFilter, setAlbumFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);

  // Form & Image Edit State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    fileName: "",
    url: "",
    album: "General",
    alt: "",
    size: "",
    category: "",
    sortOrder: 0,
    visibility: true,
  });

  // Lightbox Preview
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadGallery = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchGallery({
        page,
        limit: 12,
        search,
        album: albumFilter === "all" ? undefined : albumFilter,
        includeDeleted: showDeleted,
      });
      if (res && res.files) {
        setItems(res.files);
        setPagination(res.pagination);
      }

      const albList = await fetchGalleryAlbums();
      if (albList && albList.length > 0) {
        setAlbums(albList);
      }
    } catch (err) {
      setError(err.message || "Failed to load gallery items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [page, albumFilter, showDeleted]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadGallery();
  };

  // Upload handler utilizing existing uploadMedia service
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");
    try {
      // 1. Upload to media storage
      const media = await uploadMedia(file, formData.album);
      
      // 2. Pre-fill form state
      setFormData((prev) => ({
        ...prev,
        title: file.name.split(".")[0],
        fileName: file.name,
        url: media.url || `/uploads/${media.fileName || file.name}`,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.startsWith("video/") ? "video" : "image",
      }));
      setSuccess("Media file uploaded successfully! Please fill in details below.");
      setIsFormOpen(true);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.url) {
      setError("Please upload an image first.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await saveGalleryItem({
        ...formData,
        id: editId,
      });
      setSuccess(editId ? "Gallery item updated." : "Gallery item created.");
      setIsFormOpen(false);
      resetForm();
      loadGallery();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save gallery item.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditId(item._id || item.id);
    setFormData({
      title: item.title || "",
      fileName: item.fileName || "",
      url: item.url || "",
      album: item.album || "General",
      alt: item.alt || "",
      size: item.size || "",
      category: item.category || "",
      sortOrder: item.sortOrder || 0,
      visibility: item.visibility !== false,
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditId("");
    setFormData({
      title: "",
      fileName: "",
      url: "",
      album: "General",
      alt: "",
      size: "",
      category: "",
      sortOrder: 0,
      visibility: true,
    });
    setError("");
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the gallery item "${title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deleteGalleryItem(id);
      setSuccess("Gallery item soft deleted.");
      loadGallery();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to delete item.");
    }
  };

  const handleRestore = async (id, title) => {
    if (!window.confirm(`Are you sure you want to restore "${title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await restoreGalleryItem(id);
      setSuccess("Gallery item restored.");
      loadGallery();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to restore item.");
    }
  };

  return (
    <div className="cms-panel">
      <div className="cms-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Photo & Media Gallery</h2>
          <p className="kicker">Organise visual assets, portfolio images, and albums</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(!isFormOpen);
          }}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
        >
          <FiPlus /> {isFormOpen ? "Close Panel" : "Add Image"}
        </button>
      </div>

      {success && <div className="cms-alert cms-alert-success" style={{ marginTop: "1rem" }}>{success}</div>}
      {error && <div className="cms-alert cms-alert-danger" style={{ marginTop: "1rem" }}>{error}</div>}

      {/* Upload & Form panel */}
      {isFormOpen && (
        <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "8px", margin: "1.5rem 0" }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
            {editId ? "Modify Gallery Item Settings" : "Upload & Create Gallery Item"}
          </h3>
          
          {!editId && !formData.url && (
            <div style={{ border: "2px dashed #cbd5e0", borderRadius: "6px", padding: "2rem", textAlign: "center", background: "#fff", cursor: "pointer", position: "relative", marginBottom: "1rem" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
              />
              <FiUpload style={{ fontSize: "2rem", color: "#a0aec0", marginBottom: "0.5rem" }} />
              <p style={{ margin: 0 }}>{uploading ? "Uploading media file..." : "Drag & Drop or Click to Upload Image"}</p>
            </div>
          )}

          {formData.url && (
            <div className="form-grid layout-2-col">
              {/* Preview image */}
              <div style={{ gridColumn: "span 2", display: "flex", gap: "1rem", alignItems: "center", background: "#edf2f7", padding: "1rem", borderRadius: "6px" }}>
                <img src={formData.url} alt="Preview" style={{ width: "90px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{formData.fileName}</h4>
                  <span style={{ fontSize: "0.8rem", color: "#718096" }}>File size: {formData.size}</span>
                </div>
              </div>

              <label>
                Title / Caption *
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </label>
              <label>
                Album Name
                <input
                  type="text"
                  value={formData.album}
                  onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Portfolio, Projects"
                />
              </label>
              <label>
                Alt Description
                <input
                  type="text"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  className="form-input"
                  placeholder="For screen readers..."
                />
              </label>
              <label>
                Category Tag
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  placeholder="e.g. workspace, landscape"
                />
              </label>
              <label>
                Sort Order (Priority)
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </label>
              <label>
                Visibility
                <select
                  value={formData.visibility ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value === "true" })}
                  className="form-input"
                >
                  <option value="true">Visible</option>
                  <option value="false">Hidden</option>
                </select>
              </label>

              <div style={{ gridColumn: "span 2", display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} disabled={saving}>
                  <FiSave />
                  {saving ? "Saving..." : "Save Gallery Item"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="filters-bar" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.5rem 0", padding: "1rem", background: "#f8f9fa", borderRadius: "8px" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Search Title / Alt</label>
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
          <label>Filter Album</label>
          <select value={albumFilter} onChange={(e) => { setAlbumFilter(e.target.value); setPage(1); }} className="form-input">
            <option value="all">All Albums</option>
            {albums.map((alb) => (
              <option key={alb} value={alb}>{alb}</option>
            ))}
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

      {/* Gallery Items Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p>Loading gallery items...</p>
        </div>
      ) : items.length === 0 ? (
        <p className="empty-state">No gallery items found.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {items.map((item) => (
            <div
              key={item._id || item.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#fff",
                opacity: item.isDeleted ? 0.6 : 1,
                position: "relative",
              }}
            >
              <img
                src={item.url}
                alt={item.alt || item.title}
                onClick={() => setPreviewUrl(item.url)}
                style={{ width: "100%", height: "150px", objectFit: "cover", cursor: "zoom-in" }}
              />
              <div style={{ padding: "0.8rem" }}>
                <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.title}
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge" style={{ fontSize: "0.75rem", background: "#edf2f7", color: "#4a5568" }}>
                    {item.album}
                  </span>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {!item.visibility && <FiEyeOff style={{ color: "#718096" }} />}
                    {item.isDeleted ? (
                      <button onClick={() => handleRestore(item._id || item.id, item.title)} className="btn btn-secondary" style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}>
                        <FiRotateCcw />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="btn btn-secondary" style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", color: "#3182ce" }}>
                          <FiEdit2 />
                        </button>
                        <button onClick={() => handleDelete(item._id || item.id, item.title)} className="btn btn-secondary" style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", color: "#e53e3e" }}>
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "zoom-out" }}
        >
          <img src={previewUrl} alt="Preview large" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "4px" }} />
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>
            Showing Page {pagination.page} of {pagination.pages} ({pagination.total} images)
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

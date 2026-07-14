import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FiUploadCloud,
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiFolder,
  FiInfo,
  FiGrid,
  FiList,
  FiCopy,
  FiDownload,
  FiEdit2,
  FiFolderMinus,
  FiEye,
  FiCheck,
} from "react-icons/fi";
import { useCms } from "../../context/CmsContext";

export default function MediaLibraryModule() {
  const { data, uploadMedia, renameMedia, moveMedia, deleteMedia, restoreMedia, actions } = useCms();
  const { media = [] } = data;

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFolder, setUploadFolder] = useState("misc");
  const fileInputRef = useRef(null);

  // Edit / Action state
  const [renameText, setRenameText] = useState("");
  const [moveFolderTarget, setMoveFolderTarget] = useState("misc");
  const [copiedId, setCopiedId] = useState(null);

  const allowedFolders = ["articles", "covers", "gallery", "profile", "newsletters", "logos", "misc"];

  // Re-fetch media on mount to make sure we are live
  useEffect(() => {
    if (actions && typeof actions.refreshData === "function") {
      actions.refreshData();
    }
  }, []);

  // Filter and Search media items
  const filteredMedia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return media.filter((item) => {
      const matchesSearch =
        !q ||
        (item.name || "").toLowerCase().includes(q) ||
        (item.originalName || "").toLowerCase().includes(q);

      const matchesFolder = selectedFolder === "all" || item.folder === selectedFolder;
      const matchesType =
        selectedType === "all" ||
        (selectedType === "image" && (item.mimeType || "").startsWith("image/")) ||
        (selectedType === "video" && (item.mimeType || "").startsWith("video/")) ||
        (selectedType === "audio" && (item.mimeType || "").startsWith("audio/")) ||
        (selectedType === "document" && (item.mimeType || "").includes("pdf"));

      const matchesDeleted = showDeleted ? item.isDeleted === true : !item.isDeleted;

      return matchesSearch && matchesFolder && matchesType && matchesDeleted;
    });
  }, [media, searchQuery, selectedFolder, selectedType, showDeleted]);

  // Paginated media items
  const paginatedMedia = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedia.slice(start, start + itemsPerPage);
  }, [filteredMedia, currentPage]);

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolder, selectedType, showDeleted]);

  // Upload handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a file to upload.");
      return;
    }

    // Client-side validation for type
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = "." + uploadFile.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError("Invalid file type. Only JPG, JPEG, PNG, WEBP, and GIF are allowed.");
      return;
    }

    // Size limit check (5MB)
    if (uploadFile.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await uploadMedia(uploadFile, uploadFolder);
      setSuccess("Media file uploaded successfully.");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Copy URL
  const handleCopyUrl = (item) => {
    const absoluteUrl = item.url.startsWith("http")
      ? item.url
      : `${window.location.protocol}//${window.location.hostname}:5000${item.url}`;
    navigator.clipboard.writeText(absoluteUrl);
    setCopiedId(item._id || item.id);
    setSuccess("URL copied to clipboard.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action: Rename
  const handleRename = async (e) => {
    e.preventDefault();
    if (!selectedItem || !renameText.trim()) return;
    setLoading(true);
    setError("");
    try {
      await renameMedia(selectedItem._id || selectedItem.id, renameText.trim());
      setSuccess("Media renamed successfully.");
      setSelectedItem({ ...selectedItem, name: renameText.trim() });
    } catch (err) {
      setError(err.message || "Failed to rename media.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Move Folder
  const handleMoveFolder = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setLoading(true);
    setError("");
    try {
      const moved = await moveMedia(selectedItem._id || selectedItem.id, moveFolderTarget);
      setSuccess(`Media moved to ${moveFolderTarget} folder.`);
      setSelectedItem(moved);
    } catch (err) {
      setError(err.message || "Failed to move media.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Soft Delete
  const handleDelete = async (item) => {
    if (!window.confirm("Are you sure you want to soft-delete this media?")) return;
    setLoading(true);
    setError("");
    try {
      await deleteMedia(item._id || item.id);
      setSuccess("Media soft-deleted.");
      setSelectedItem(null);
    } catch (err) {
      setError(err.message || "Failed to delete media.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Restore
  const handleRestore = async (item) => {
    setLoading(true);
    setError("");
    try {
      await restoreMedia(item._id || item.id);
      setSuccess("Media restored successfully.");
      setSelectedItem(null);
    } catch (err) {
      setError(err.message || "Failed to restore media.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cms-grid-two">
      {/* LEFT PANEL: Uploader & Detailed Info */}
      <div className="cms-panel">
        <div className="cms-panel-heading">
          <div>
            <span className="section-kicker">Manage Media</span>
            <h2>Upload Assets</h2>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="form-grid one">
          <div className="media-uploader-dropzone">
            <FiUploadCloud size={40} className="upload-icon" />
            <p>Select target image file (JPG, JPEG, PNG, WEBP, GIF)</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setUploadFile(e.target.files[0])}
              accept="image/*"
              className="file-input-field"
            />
            {uploadFile && (
              <div className="selected-file-badge">
                Selected: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <label>
            Target Folder
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="form-select"
            >
              {allowedFolders.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={loading || !uploadFile}
          >
            {loading ? "Uploading..." : "Upload Asset"}
          </button>
        </form>

        {/* Selected Item Detail Actions */}
        {selectedItem && (
          <div className="media-details-block" style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #ccc" }}>
            <h3>Selected Asset Details</h3>
            <div className="media-preview-container" style={{ textAlign: "center", marginBottom: "1rem" }}>
              <img
                src={selectedItem.url.startsWith("http") ? selectedItem.url : `${window.location.protocol}//${window.location.hostname}:5000${selectedItem.url}`}
                alt={selectedItem.name}
                style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
            
            <div className="form-grid one" style={{ gap: "1rem" }}>
              <div>
                <strong>Original Name: </strong><span>{selectedItem.originalName || selectedItem.fileName}</span>
              </div>
              <div>
                <strong>Folder: </strong><span>{selectedItem.folder}</span>
              </div>
              <div>
                <strong>Size: </strong><span>{selectedItem.size}</span>
              </div>

              {/* Rename Form */}
              <form onSubmit={handleRename} className="form-row-inline" style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="New display name"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  className="form-input"
                  style={{ flexGrow: 1 }}
                />
                <button type="submit" className="small-outline-btn" disabled={loading}>
                  Rename
                </button>
              </form>

              {/* Move Folder Form */}
              <form onSubmit={handleMoveFolder} className="form-row-inline" style={{ display: "flex", gap: "0.5rem" }}>
                <select
                  value={moveFolderTarget}
                  onChange={(e) => setMoveFolderTarget(e.target.value)}
                  className="form-select"
                  style={{ flexGrow: 1 }}
                >
                  {allowedFolders.map((f) => (
                    <option key={f} value={f}>
                      Move to: {f.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button type="submit" className="small-outline-btn" disabled={loading}>
                  Move
                </button>
              </form>

              <div className="action-row-buttons" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedItem)}
                  className="small-outline-btn"
                >
                  {copiedId === (selectedItem._id || selectedItem.id) ? <FiCheck /> : <FiCopy />} Copy URL
                </button>

                <a
                  href={selectedItem.url.startsWith("http") ? selectedItem.url : `${window.location.protocol}//${window.location.hostname}:5000${selectedItem.url}`}
                  download={selectedItem.originalName || "download"}
                  target="_blank"
                  rel="noreferrer"
                  className="small-outline-btn"
                  style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center" }}
                >
                  <FiDownload /> Download
                </a>

                {selectedItem.isDeleted ? (
                  <button
                    type="button"
                    onClick={() => handleRestore(selectedItem)}
                    className="small-outline-btn"
                    style={{ color: "green" }}
                  >
                    <FiRotateCcw /> Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedItem)}
                    className="small-outline-btn"
                    style={{ color: "red" }}
                  >
                    <FiTrash2 /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Media Browser Grid/List */}
      <div className="cms-panel">
        <div className="cms-panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="section-kicker">Library</span>
            <h2>Media Browser</h2>
          </div>
          <div className="view-mode-buttons" style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setViewMode("grid")}
              className={`small-icon-btn ${viewMode === "grid" ? "active" : ""}`}
            >
              <FiGrid />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`small-icon-btn ${viewMode === "list" ? "active" : ""}`}
            >
              <FiList />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && <div className="alert-message error">{error}</div>}
        {success && <div className="alert-message success">{success}</div>}

        {/* Toolbar Filter Filters */}
        <div className="toolbar-search-filter" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div className="search-input-wrapper" style={{ flexGrow: 1, position: "relative" }}>
            <FiSearch className="search-icon" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ paddingLeft: "35px", width: "100%" }}
            />
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="form-select"
            style={{ width: "130px" }}
          >
            <option value="all">All Folders</option>
            {allowedFolders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="form-select"
            style={{ width: "110px" }}
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audios</option>
            <option value="document">Documents</option>
          </select>

          <label className="checkbox-label" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              style={{ marginRight: "0.5rem" }}
            />
            Show Deleted
          </label>
        </div>

        {/* Media Browser Body */}
        {paginatedMedia.length === 0 ? (
          <p className="empty-state">No assets match your search/filter parameters.</p>
        ) : viewMode === "grid" ? (
          <div className="media-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
            {paginatedMedia.map((item) => {
              const fileUrl = item.url.startsWith("http")
                ? item.url
                : `${window.location.protocol}//${window.location.hostname}:5000${item.url}`;
              const isSelected = selectedItem && (selectedItem._id === item._id || selectedItem.id === item.id);
              
              return (
                <div
                  key={item._id || item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setRenameText(item.name || "");
                    setMoveFolderTarget(item.folder || "misc");
                  }}
                  className={`media-card-grid ${isSelected ? "selected" : ""}`}
                  style={{
                    border: isSelected ? "2px solid var(--accent-color, #426c67)" : "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#eef5f4" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div className="thumbnail-wrapper" style={{ height: "100px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9f9f9" }}>
                    {item.mimeType?.startsWith("image/") ? (
                      <img src={fileUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <FiFolder size={32} />
                    )}
                  </div>
                  <div className="name-wrapper" style={{ padding: "0.5rem", fontSize: "0.8rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="media-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {paginatedMedia.map((item) => {
              const isSelected = selectedItem && (selectedItem._id === item._id || selectedItem.id === item.id);
              return (
                <div
                  key={item._id || item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setRenameText(item.name || "");
                    setMoveFolderTarget(item.folder || "misc");
                  }}
                  className="media-card-list"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.5rem 1rem",
                    border: isSelected ? "2px solid var(--accent-color, #426c67)" : "1px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#eef5f4" : "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <FiFolder size={20} />
                    <div>
                      <span style={{ fontWeight: "600" }}>{item.name}</span>
                      <div style={{ fontSize: "0.75rem", color: "#666" }}>
                        {item.folder} • {item.size} • {item.mimeType}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(item);
                    }}
                    className="small-icon-btn"
                  >
                    {copiedId === (item._id || item.id) ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination-wrapper" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              disabled={currentPage === 1}
              className="small-outline-btn"
            >
              Prev
            </button>
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
              disabled={currentPage === totalPages}
              className="small-outline-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

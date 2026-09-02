import React, { useRef, useState } from "react";
import { FiUpload, FiRefreshCw } from "react-icons/fi";
import { mediaApi } from "../../services/apiService";

const ImageDropZone = ({ label, value, onChange }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "misc"); // default folder

      const res = await mediaApi.upload(formData);
      if (res && res.media && res.media.url) {
        onChange(res.media.url);
      } else {
        throw new Error("Invalid response format.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="drop-zone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!uploading) handleFiles(e.dataTransfer.files);
      }}
    >
      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1rem" }}>
          <FiRefreshCw className="spin" style={{ fontSize: "2rem", color: "#1a73e8" }} />
          <span>Uploading...</span>
        </div>
      ) : value?.trim() ? (
        <img src={value} alt={label} style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "cover" }} />
      ) : (
        <FiUpload />
      )}
      <div>
        <strong>{label}</strong>
        <span>Drag and drop an image or choose a file.</span>
        {error && <span style={{ color: "#c5221f", fontSize: "0.8rem", display: "block", marginTop: "0.25rem" }}>{error}</span>}
      </div>
      <button
        className="small-outline-btn"
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        Choose Image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        hidden
      />
    </div>
  );
};

export default ImageDropZone;

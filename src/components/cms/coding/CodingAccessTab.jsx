import React, { useState } from "react";
import { FiLock, FiUnlock } from "react-icons/fi";
import { learnApi } from "../../../services/apiService";

function accessBadgeStyle(level) {
  return {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.18rem 0.5rem",
    borderRadius: "4px",
    background: level === "premium" ? "rgba(168,85,247,0.18)" : "rgba(16,185,129,0.18)",
    color: level === "premium" ? "#c084fc" : "#34d399",
  };
}

function statusBadgeStyle(status) {
  const map = {
    published: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    draft: { bg: "rgba(100,116,139,0.2)", color: "#94a3b8" },
    archived: { bg: "rgba(168,85,247,0.15)", color: "#c084fc" },
  };
  const t = map[status] || map.draft;
  return {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.18rem 0.5rem",
    borderRadius: "4px",
    background: t.bg,
    color: t.color,
  };
}

function bulkBtnStyle(variant) {
  return {
    background: variant === "green" ? "rgba(5,150,105,0.15)" : "rgba(168,85,247,0.15)",
    border: `1px solid ${variant === "green" ? "#059669" : "#7c3aed"}`,
    color: variant === "green" ? "#34d399" : "#c084fc",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  };
}

export default function CodingAccessTab({ courses, onRefresh }) {
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === courses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(courses.map((c) => c._id || c.id)));
    }
  };

  const handleBulk = async (accessLevel) => {
    if (selected.size === 0) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await learnApi.adminCodingBulkAccess({
        courseIds: Array.from(selected),
        accessLevel,
      });
      setMessage(`Set ${selected.size} course(s) to ${accessLevel}.`);
      setSelected(new Set());
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || "Bulk access update failed.");
    } finally {
      setBusy(false);
    }
  };

  const allSelected = courses.length > 0 && selected.size === courses.length;

  return (
    <div>
      {message && (
        <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1", fontSize: "0.85rem", cursor: "pointer" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select All
        </label>
        <span style={{ color: "#475569", fontSize: "0.8rem" }}>{selected.size} selected</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.6rem" }}>
          <button type="button" disabled={busy || selected.size === 0} onClick={() => handleBulk("free")} style={bulkBtnStyle("green")}>
            <FiUnlock /> Set Selected to Free
          </button>
          <button type="button" disabled={busy || selected.size === 0} onClick={() => handleBulk("premium")} style={bulkBtnStyle("purple")}>
            <FiLock /> Set Selected to Premium
          </button>
        </div>
      </div>

      {courses.length === 0 && <p style={{ color: "#94a3b8" }}>No tracks found.</p>}
      {courses.map((c) => {
        const id = c._id || c.id;
        const isSelected = selected.has(id);
        return (
          <div
            key={id}
            style={{
              background: "#1e293b",
              border: isSelected ? "1px solid #38bdf8" : "1px solid #334155",
              borderRadius: "8px",
              padding: "1.25rem",
              marginBottom: "0.75rem",
              cursor: "pointer",
            }}
            onClick={() => toggleSelect(id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(id)} onClick={(e) => e.stopPropagation()} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: "#f8fafc", fontSize: "0.95rem" }}>{c.title}</span>
                  <span style={accessBadgeStyle(c.accessLevel)}>{(c.accessLevel || "free").toUpperCase()}</span>
                  <span style={statusBadgeStyle(c.publicationStatus)}>{c.publicationStatus || "draft"}</span>
                </div>
                {c.subtitle && <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.2rem" }}>{c.subtitle}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

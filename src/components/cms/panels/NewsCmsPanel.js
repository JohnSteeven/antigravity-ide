import React from "react";

const NewsCmsPanel = ({ articleDraft, update }) => (
  <div className="span-two experience-meta-section" style={{
    background: "#f8fafc",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "1.25rem",
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  }}>
    <h3 className="span-two" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#2563eb", fontFamily: "-apple-system, sans-serif" }}>
      📰 Newsroom Experience Settings
    </h3>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      News Source / Press Agency
      <input
        type="text"
        value={articleDraft.source || ""}
        onChange={(e) => update({ source: e.target.value })}
        placeholder="e.g. Global Tech Desk"
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      External News URL
      <input
        type="text"
        value={articleDraft.externalUrl || ""}
        onChange={(e) => update({ externalUrl: e.target.value })}
        placeholder="https://news.example.com/article"
      />
    </label>
  </div>
);

export default NewsCmsPanel;

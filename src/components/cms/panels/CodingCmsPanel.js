import React from "react";

const CodingCmsPanel = ({ articleDraft, update }) => (
  <div className="span-two experience-meta-section" style={{
    background: "#0d1117",
    color: "#c9d1d9",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "1.25rem",
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  }}>
    <h3 className="span-two" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#58a6ff", fontFamily: "JetBrains Mono, monospace" }}>
      💻 Coding Experience Settings
    </h3>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#8b949e" }}>
      Programming Language
      <input
        type="text"
        value={articleDraft.programmingLanguage || ""}
        onChange={(e) => update({ programmingLanguage: e.target.value })}
        placeholder="e.g. JavaScript, Python, Rust"
        style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#8b949e" }}>
      Framework / Library
      <input
        type="text"
        value={articleDraft.framework || ""}
        onChange={(e) => update({ framework: e.target.value })}
        placeholder="e.g. React 18, Node.js, Express"
        style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#8b949e" }}>
      Difficulty Level
      <select
        value={articleDraft.difficulty || ""}
        onChange={(e) => update({ difficulty: e.target.value })}
        style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
      >
        <option value="">Select Difficulty</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#8b949e" }}>
      GitHub Repository URL
      <input
        type="text"
        value={articleDraft.githubUrl || ""}
        onChange={(e) => update({ githubUrl: e.target.value })}
        placeholder="https://github.com/user/repo"
        style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#8b949e" }}>
      Tech Stack Dependencies (comma separated)
      <input
        type="text"
        value={articleDraft.techStack?.join(", ") || ""}
        onChange={(e) => update({ techStack: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
        placeholder="React, Node.js, Express, MongoDB"
        style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#8b949e" }}>
      Terminal Commands (one per line)
      <textarea
        value={articleDraft.cliCommands?.join("\n") || ""}
        onChange={(e) => update({ cliCommands: e.target.value.split("\n").filter(Boolean) })}
        placeholder="npm install&#10;npm run dev&#10;docker-compose up -d"
        rows={3}
        style={{ background: "#161b22", color: "#e6edf3", border: "1px solid #30363d" }}
      />
    </label>
  </div>
);

export default CodingCmsPanel;

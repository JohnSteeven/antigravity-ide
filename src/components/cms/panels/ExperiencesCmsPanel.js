import React from "react";

const ExperiencesCmsPanel = ({ articleDraft, update }) => (
  <div className="span-two experience-meta-section" style={{
    background: "#0f172a",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  }}>
    <h3 className="span-two" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#ef4444", fontFamily: "JetBrains Mono, monospace" }}>
      ⚠️ Incidents & Post-Mortem Settings
    </h3>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#94a3b8" }}>
      Severity Level
      <select
        value={articleDraft.severity || "SEV-1"}
        onChange={(e) => update({ severity: e.target.value })}
        style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
      >
        <option value="SEV-1 Critical">SEV-1 Critical Outage</option>
        <option value="SEV-2 Major">SEV-2 Major Degraded</option>
        <option value="SEV-3 Minor">SEV-3 Minor Incident</option>
      </select>
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#94a3b8" }}>
      Resolution Status
      <select
        value={articleDraft.incidentStatus || "Resolved"}
        onChange={(e) => update({ incidentStatus: e.target.value })}
        style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
      >
        <option value="Mitigated & Resolved">Mitigated & Resolved</option>
        <option value="Monitoring Fix">Monitoring Fix</option>
        <option value="Investigating">Investigating</option>
      </select>
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#94a3b8" }}>
      Outage Duration & TTR
      <input
        type="text"
        value={articleDraft.outageDuration || ""}
        onChange={(e) => update({ outageDuration: e.target.value })}
        placeholder="e.g. 42 Minutes (TTR 38m)"
        style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#94a3b8" }}>
      Affected Services (comma separated)
      <input
        type="text"
        value={articleDraft.affectedServices?.join(", ") || ""}
        onChange={(e) => update({ affectedServices: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
        placeholder="Auth API, Primary DB, Redis Cache"
        style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#94a3b8" }}>
      Incident Chronology Timeline (one per line format: HH:MM UTC - Event)
      <textarea
        value={articleDraft.chronology?.join("\n") || ""}
        onChange={(e) => update({ chronology: e.target.value.split("\n").filter(Boolean) })}
        placeholder="14:02 UTC - Elevated Error Rate&#10;14:08 UTC - On-Call Paged&#10;14:28 UTC - Hotfix Deployed"
        rows={3}
        style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem", color: "#94a3b8" }}>
      Preventative Action Items (one per line)
      <textarea
        value={articleDraft.actionItems?.join("\n") || ""}
        onChange={(e) => update({ actionItems: e.target.value.split("\n").filter(Boolean) })}
        placeholder="Implement circuit breaker for Auth service&#10;Increase DB pool limits"
        rows={3}
        style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155" }}
      />
    </label>
  </div>
);

export default ExperiencesCmsPanel;

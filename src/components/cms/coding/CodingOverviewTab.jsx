import React from "react";
import {
  FiBarChart2,
  FiBook,
  FiBox,
  FiCheckCircle,
  FiFileText,
  FiLayers,
} from "react-icons/fi";

const S = {
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
  },
  statCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#f8fafc",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    marginTop: "0.2rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#e2e8f0",
    margin: "0 0 1rem",
  },
  quickBtn: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "0.55rem 1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.82rem",
  },
  th: {
    textAlign: "left",
    padding: "0.6rem 0.75rem",
    color: "#94a3b8",
    borderBottom: "1px solid #334155",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "0.6rem 0.75rem",
    color: "#cbd5e1",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "top",
  },
  codeChip: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "4px",
    padding: "0.1rem 0.4rem",
    fontFamily: "monospace",
    fontSize: "0.78rem",
    color: "#38bdf8",
  },
  warningNote: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.35)",
    borderRadius: "6px",
    padding: "0.75rem 1rem",
    color: "#fbbf24",
    fontSize: "0.85rem",
    marginBottom: "1rem",
  },
};

const BLOCKERS = [
  {
    file: "codingConstants.js",
    hardcoded: "CANONICAL_TRACKS array (4 slugs)",
    impact: "New tracks added via CMS will not appear in CodingHub / CodingPractice / CodingProjects / CodingResources",
    fix: "Change to API-driven track list",
  },
  {
    file: "CodingHub.jsx",
    hardcoded: "Hard-iterates CANONICAL_TRACKS",
    impact: "New tracks not visible on /coding hub",
    fix: "Derive track list from backend API",
  },
  {
    file: "CodingPractice.jsx",
    hardcoded: "Iterates CANONICAL_TRACKS",
    impact: "Practice lessons from new tracks not shown",
    fix: "Fetch practice lessons from API",
  },
  {
    file: "CodingProjects.jsx",
    hardcoded: "Iterates CANONICAL_TRACKS",
    impact: "Project lessons from new tracks not shown",
    fix: "Fetch project lessons from API",
  },
  {
    file: "CodingResources.jsx",
    hardcoded: "CANONICAL_TRACKS for filter chips",
    impact: "Filter chips won't include new tracks",
    fix: "Derive filter chips from API track list",
  },
];

export default function CodingOverviewTab({ courses, materials, onNavigate }) {
  const allModules = courses.flatMap((c) => c.curriculum || []);
  const allLessons = allModules.flatMap((m) => m.lessons || []);
  const published = allLessons.filter((l) => l.publicationStatus === "published").length;
  const draft = allLessons.length - published;

  const stats = [
    { label: "Total Tracks", value: courses.length, icon: <FiLayers />, color: "#0284c7" },
    { label: "Total Modules", value: allModules.length, icon: <FiBox />, color: "#7c3aed" },
    { label: "Total Lessons", value: allLessons.length, icon: <FiBook />, color: "#059669" },
    { label: "Published Lessons", value: published, icon: <FiCheckCircle />, color: "#10b981" },
    { label: "Draft Lessons", value: draft, icon: <FiFileText />, color: "#f59e0b" },
    { label: "Materials", value: materials.length, icon: <FiBarChart2 />, color: "#e11d48" },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={S.statCard}>
            <div style={{ ...S.statIcon, background: `${s.color}22`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div style={S.statValue}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, marginBottom: "2rem" }}>
        <h3 style={S.sectionTitle}>Quick Actions</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {[
            { label: "→ Tracks", tab: "tracks" },
            { label: "→ Curriculum", tab: "curriculum" },
            { label: "→ Materials", tab: "materials" },
            { label: "→ Access", tab: "access" },
            { label: "→ Publishing", tab: "publishing" },
          ].map((a) => (
            <button
              key={a.tab}
              type="button"
              onClick={() => onNavigate(a.tab)}
              style={S.quickBtn}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...S.card }}>
        <h3 style={S.sectionTitle}>⚠ Amendment #6 — Hardcoding Blockers</h3>
        <div style={S.warningNote}>
          The learner-facing files below iterate a hard-coded <code>CANONICAL_TRACKS</code> array.
          Tracks created via this CMS will be persisted to MongoDB but will <strong>not</strong> appear
          in the learner UI until these files are migrated to API-driven data. This is a known
          Phase 18 backlog item.
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>File</th>
                <th style={S.th}>Hardcoded Value</th>
                <th style={S.th}>CMS Data Cannot Appear</th>
                <th style={S.th}>Future Data-Source Change Required</th>
              </tr>
            </thead>
            <tbody>
              {BLOCKERS.map((b) => (
                <tr key={b.file}>
                  <td style={S.td}>
                    <span style={S.codeChip}>{b.file}</span>
                  </td>
                  <td style={S.td}>{b.hardcoded}</td>
                  <td style={{ ...S.td, color: "#fca5a5" }}>{b.impact}</td>
                  <td style={{ ...S.td, color: "#86efac" }}>{b.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

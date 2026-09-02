import React from "react";

const LessonsCmsPanel = ({ articleDraft, update }) => (
  <div className="span-two experience-meta-section" style={{
    background: "#fcfbf9",
    color: "#1e1b4b",
    border: "1px solid #ede8e1",
    borderRadius: "8px",
    padding: "1.25rem",
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  }}>
    <h3 className="span-two" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#7c3aed", fontFamily: "Playfair Display, Georgia, serif" }}>
      💡 Lessons & Wisdom Settings
    </h3>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Core Wisdom Quote / Highlighted Principle
      <input
        type="text"
        value={articleDraft.favoriteQuote || ""}
        onChange={(e) => update({ favoriteQuote: e.target.value })}
        placeholder="e.g. Wisdom is not a product of schooling..."
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Core Principles List (one per line)
      <textarea
        value={articleDraft.principles?.join("\n") || ""}
        onChange={(e) => update({ principles: e.target.value.split("\n").filter(Boolean) })}
        placeholder="01. Master Attention Over Intention&#10;02. Embrace Radical Acceptance"
        rows={3}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Recommended Books (one per line)
      <textarea
        value={articleDraft.recommendedBooks?.join("\n") || ""}
        onChange={(e) => update({ recommendedBooks: e.target.value.split("\n").filter(Boolean) })}
        placeholder="Atomic Habits by James Clear&#10;The Daily Stoic by Ryan Holiday"
        rows={2}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Daily Mindset Habits (one per line)
      <textarea
        value={articleDraft.reflectionHabits?.join("\n") || ""}
        onChange={(e) => update({ reflectionHabits: e.target.value.split("\n").filter(Boolean) })}
        placeholder="Morning 10-Min Journaling&#10;Daily Unplugged Walk"
        rows={2}
      />
    </label>
  </div>
);

export default LessonsCmsPanel;

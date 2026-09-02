import React from "react";

const LifeCmsPanel = ({ articleDraft, update }) => (
  <div className="span-two experience-meta-section" style={{
    background: "#fffdfa",
    color: "#2c2a29",
    border: "1px solid #e8ded2",
    borderRadius: "8px",
    padding: "1.25rem",
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  }}>
    <h3 className="span-two" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontFamily: "Playfair Display, Georgia, serif" }}>
      🌱 Life Experience Settings
    </h3>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Mood Badge
      <input
        type="text"
        value={articleDraft.mood || ""}
        onChange={(e) => update({ mood: e.target.value })}
        placeholder="e.g. Peaceful 🌿"
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Hero Quote
      <input
        type="text"
        value={articleDraft.heroQuote || ""}
        onChange={(e) => update({ heroQuote: e.target.value })}
        placeholder="e.g. Seek peace in the ordinary..."
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Favorite Quote
      <input
        type="text"
        value={articleDraft.favoriteQuote || ""}
        onChange={(e) => update({ favoriteQuote: e.target.value })}
        placeholder="e.g. In the middle of difficulty lies opportunity."
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Key Takeaways (one per line)
      <textarea
        value={articleDraft.takeaways?.join("\n") || ""}
        onChange={(e) => update({ takeaways: e.target.value.split("\n").filter(Boolean) })}
        placeholder="Takeaway 1&#10;Takeaway 2&#10;Takeaway 3"
        rows={3}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Reflection Prompts / Questions (one per line)
      <textarea
        value={articleDraft.reflectionQuestions?.join("\n") || ""}
        onChange={(e) => update({ reflectionQuestions: e.target.value.split("\n").filter(Boolean) })}
        placeholder="Question 1&#10;Question 2"
        rows={3}
      />
    </label>
  </div>
);

export default LifeCmsPanel;

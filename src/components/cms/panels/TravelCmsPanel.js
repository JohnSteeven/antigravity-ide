import React from "react";

const TravelCmsPanel = ({ articleDraft, update }) => (
  <div className="span-two experience-meta-section" style={{
    background: "#fffdfa",
    color: "#1c1917",
    border: "1px solid #e8ded2",
    borderRadius: "8px",
    padding: "1.25rem",
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem"
  }}>
    <h3 className="span-two" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#d97706", fontFamily: "Oswald, sans-serif" }}>
      ✈️ Travel Experience Settings
    </h3>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Destination / Location
      <input
        type="text"
        value={articleDraft.location || ""}
        onChange={(e) => update({ location: e.target.value })}
        placeholder="e.g. Kyoto, Japan 🇯🇵"
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Est. Budget / Currency
      <input
        type="text"
        value={articleDraft.budget || ""}
        onChange={(e) => update({ budget: e.target.value })}
        placeholder="e.g. $120 / Day (JPY ¥)"
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Trip Duration
      <input
        type="text"
        value={articleDraft.duration || ""}
        onChange={(e) => update({ duration: e.target.value })}
        placeholder="e.g. 7 Days Trip"
      />
    </label>
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Ideal Season / Climate
      <input
        type="text"
        value={articleDraft.season || ""}
        onChange={(e) => update({ season: e.target.value })}
        placeholder="e.g. Autumn / Spring 🍂"
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Day-by-Day Itinerary (one per line)
      <textarea
        value={articleDraft.itinerary?.join("\n") || ""}
        onChange={(e) => update({ itinerary: e.target.value.split("\n").filter(Boolean) })}
        placeholder="Day 1: Arrival & Historic Streets&#10;Day 2: Temples & Bamboo Forest Walk"
        rows={3}
      />
    </label>
    <label className="span-two" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      Essential Travel Tips
      <textarea
        value={articleDraft.tips || ""}
        onChange={(e) => update({ tips: e.target.value })}
        placeholder="Pack comfortable walking shoes, purchase JR rail pass in advance..."
        rows={2}
      />
    </label>
  </div>
);

export default TravelCmsPanel;

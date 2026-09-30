import React from "react";

const SOURCE_LABELS = {
  manual: { label: "Manual", symbol: "✎", desc: "Manually entered" },
  wearable: { label: "Wearable", symbol: "⌚", desc: "Synced from wearable device" },
  phone: { label: "Phone", symbol: "📱", desc: "Recorded by phone sensor" },
  import: { label: "Import", symbol: "📥", desc: "Imported from file" },
  derived: { label: "Derived", symbol: "✦", desc: "Calculated deterministically" },
  api: { label: "API", symbol: "⇄", desc: "Injected via API" },
  integration: { label: "Integration", symbol: "🔗", desc: "Partner integration" },
  system: { label: "System", symbol: "⚙", desc: "System generated" },
};

export const LifeDataSourceBadge = ({ source, className = "" }) => {
  const typeKey = typeof source === "string" ? source : source?.type || "manual";
  const provider = typeof source === "object" ? source?.provider : "";
  const info = SOURCE_LABELS[typeKey] || SOURCE_LABELS.manual;
  const tooltipText = provider ? `${info.desc} (${provider})` : info.desc;

  return (
    <span
      className={`life-source-badge life-source-${typeKey} ${className}`}
      title={tooltipText}
      aria-label={`Source: ${tooltipText}`}
    >
      <span className="life-source-symbol" aria-hidden="true">{info.symbol}</span>
      <span className="life-source-label">{info.label}</span>
      {provider && <span className="life-source-provider">· {provider}</span>}
    </span>
  );
};

export default LifeDataSourceBadge;

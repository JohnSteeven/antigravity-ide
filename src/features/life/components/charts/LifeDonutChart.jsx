import React, { useState } from "react";
import LifeEmptyChartState from "./LifeEmptyChartState";

const DEFAULT_COLORS = [
  "var(--life-accent, #98cbb0)",
  "var(--life-warm, #dab494)",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#34d399",
];

export const LifeDonutChart = ({
  data = [],
  size = 200,
  strokeWidth = 24,
  centerLabel = "Total",
  unit = "",
  formatValue = (v) => v,
  emptyMessage = "No category data available.",
  ariaLabel = "Category breakdown donut chart",
  className = "",
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const validData = (data || []).filter(
    (d) => d && d.value !== null && d.value !== undefined && Number(d.value) > 0
  );

  const total = validData.reduce((acc, curr) => acc + Number(curr.value), 0);

  if (validData.length === 0 || total === 0) {
    return <LifeEmptyChartState message={emptyMessage} height={size} />;
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const segments = validData.map((item, idx) => {
    const val = Number(item.value);
    const pct = val / total;
    const strokeDasharray = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    const strokeDashoffset = (-accumulatedPercent * circumference).toFixed(2);
    accumulatedPercent += pct;
    const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

    return {
      ...item,
      color,
      pct: Math.round(pct * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className={`life-donut-chart-wrapper ${className}`}>
      <div className="life-donut-chart-svg-box" style={{ width: `${size}px`, height: `${size}px` }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="life-donut-chart-svg"
          role="img"
          aria-label={`${ariaLabel}. Total: ${total}${unit}. ${segments.map((s) => `${s.label}: ${s.pct}%`).join(", ")}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--life-line, #3a4c3f)"
            strokeWidth={strokeWidth}
            opacity="0.3"
          />

          {segments.map((seg, idx) => (
            <circle
              key={seg.label || idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="life-donut-segment"
              opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45}
              style={{ transition: "stroke-width 0.2s, opacity 0.2s" }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              tabIndex={0}
              role="graphics-symbol"
              aria-label={`${seg.label}: ${seg.value}${unit} (${seg.pct}%)`}
            />
          ))}
        </svg>

        <div className="life-donut-center">
          <span className="life-donut-center-label">
            {activeSegment ? activeSegment.label : centerLabel}
          </span>
          <span className="life-donut-center-val">
            {activeSegment ? formatValue(activeSegment.value) : formatValue(total)}
            {unit ? ` ${unit}` : ""}
          </span>
          {activeSegment && (
            <span className="life-donut-center-pct">{activeSegment.pct}%</span>
          )}
        </div>
      </div>

      <div className="life-donut-legend" role="list">
        {segments.map((seg, idx) => (
          <div
            key={seg.label || idx}
            className={`life-donut-legend-item ${hoveredIdx === idx ? "is-active" : ""}`}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            role="listitem"
          >
            <span className="life-donut-legend-dot" style={{ backgroundColor: seg.color }} />
            <span className="life-donut-legend-label">{seg.label}</span>
            <span className="life-donut-legend-val">{formatValue(seg.value)}{unit ? ` ${unit}` : ""}</span>
            <span className="life-donut-legend-pct">({seg.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LifeDonutChart;

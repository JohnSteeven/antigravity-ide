import React, { useState } from "react";
import LifeEmptyChartState from "./LifeEmptyChartState";
import LifeChartTooltip from "./LifeChartTooltip";

export const LifeBarChart = ({
  data = [],
  height = 200,
  unit = "",
  color = "var(--life-accent, #98cbb0)",
  target = null,
  targetLabel = "Target",
  formatValue = (v) => v,
  emptyMessage = "No activity recorded for this period.",
  ariaLabel = "Activity bar chart",
  className = "",
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return <LifeEmptyChartState message={emptyMessage} height={height} />;
  }

  const values = data.map((d) => (d.value !== null && d.value !== undefined ? Number(d.value) : 0));
  const maxVal = Math.max(...values, target || 0, 1);
  const chartHeight = height - 40;
  const barWidthPct = Math.max(Math.min(80 / data.length, 12), 3);

  const handleMouseEnter = (idx, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredIdx(idx);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className={`life-bar-chart-container ${className}`} style={{ height: `${height}px` }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 1000 ${height}`}
        preserveAspectRatio="none"
        className="life-bar-chart-svg"
        role="img"
        aria-label={`${ariaLabel}. High: ${Math.max(...values)}${unit}. Total entries: ${data.length}`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - ratio * (chartHeight - 16);
          const gridVal = Math.round(ratio * maxVal);
          return (
            <g key={ratio} className="life-chart-grid-row">
              <line
                x1="40"
                y1={y}
                x2="980"
                y2={y}
                stroke="var(--life-line, #3a4c3f)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.4"
              />
              <text
                x="32"
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--life-muted, #b0c0b5)"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {target !== null && target !== undefined && (
          <g className="life-chart-target-line">
            {(() => {
              const targetY = chartHeight - (target / maxVal) * (chartHeight - 16);
              return (
                <>
                  <line
                    x1="40"
                    y1={targetY}
                    x2="980"
                    y2={targetY}
                    stroke="var(--life-warm, #dab494)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="970"
                    y={targetY - 6}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--life-warm, #dab494)"
                  >
                    {targetLabel}: {target}{unit}
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {data.map((item, idx) => {
          const val = item.value !== null && item.value !== undefined ? Number(item.value) : 0;
          const barHeight = (val / maxVal) * (chartHeight - 16);
          const x = 50 + (idx / Math.max(data.length - 1, 1)) * 900 - (barWidthPct * 5);
          const y = chartHeight - barHeight;
          const isHovered = hoveredIdx === idx;

          return (
            <g key={item.date || idx} className="life-bar-group">
              <rect
                x={x}
                y={y}
                width={barWidthPct * 10}
                height={Math.max(barHeight, 2)}
                rx="3"
                ry="3"
                fill={isHovered ? "var(--life-accent-dark, #b5dfc4)" : color}
                opacity={isHovered ? 1 : 0.85}
                className="life-bar-rect"
                onMouseEnter={(e) => handleMouseEnter(idx, e)}
                onMouseLeave={handleMouseLeave}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${item.label || item.date}: ${val}${unit}`}
              />
              {(data.length <= 14 || idx % Math.ceil(data.length / 8) === 0) && (
                <text
                  x={x + (barWidthPct * 5)}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--life-muted, #b0c0b5)"
                >
                  {item.label || item.date?.slice(5) || ""}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {activeItem && (
        <LifeChartTooltip
          visible={true}
          x={tooltipPos.x}
          y={tooltipPos.y}
          date={activeItem.date}
          label={activeItem.label || "Value"}
          value={formatValue(activeItem.value)}
          unit={unit}
          source={activeItem.source}
          extra={activeItem.extra}
        />
      )}
    </div>
  );
};

export default LifeBarChart;

import React, { useState, useId } from "react";
import LifeEmptyChartState from "./LifeEmptyChartState";
import LifeChartTooltip from "./LifeChartTooltip";

export const LifeLineChart = ({
  data = [],
  height = 240,
  unit = "",
  color = "var(--life-accent, #98cbb0)",
  movingAverageColor = "var(--life-warm, #dab494)",
  target = null,
  targetLabel = "Target",
  showMovingAverage = true,
  showArea = true,
  formatValue = (v) => v,
  emptyMessage = "No trend data recorded yet.",
  ariaLabel = "Trend line chart",
  className = "",
}) => {
  const gradientId = useId();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const validData = (data || []).filter(
    (d) => d && d.value !== null && d.value !== undefined && !isNaN(d.value)
  );

  if (validData.length === 0) {
    return <LifeEmptyChartState message={emptyMessage} height={height} />;
  }

  const values = validData.map((d) => Number(d.value));
  const rawMin = Math.min(...values, target !== null ? target : Infinity);
  const rawMax = Math.max(...values, target !== null ? target : -Infinity);
  const padding = (rawMax - rawMin) * 0.1 || 1;
  const minVal = Math.floor(rawMin - padding);
  const maxVal = Math.ceil(rawMax + padding);
  const valRange = maxVal - minVal || 1;

  const chartWidth = 1000;
  const chartHeight = height - 44;
  const padLeft = 50;
  const padRight = 30;
  const padTop = 16;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop;

  const coords = validData.map((item, idx) => {
    const x = padLeft + (idx / Math.max(validData.length - 1, 1)) * plotWidth;
    const y = padTop + plotHeight - ((Number(item.value) - minVal) / valRange) * plotHeight;
    return { ...item, x, y };
  });

  const maCoords = showMovingAverage
    ? coords.map((item, idx) => {
        let maVal = item.movingAverage;
        if (maVal === undefined || maVal === null) {
          const slice = validData.slice(Math.max(0, idx - 6), idx + 1);
          const sum = slice.reduce((acc, curr) => acc + Number(curr.value), 0);
          maVal = slice.length > 0 ? Math.round((sum / slice.length) * 10) / 10 : null;
        }
        if (maVal === null || isNaN(maVal)) return null;
        const maY = padTop + plotHeight - ((Number(maVal) - minVal) / valRange) * plotHeight;
        return { x: item.x, y: maY, maVal };
      }).filter(Boolean)
    : [];

  const linePath = coords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = coords[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 3;
    const cp1y = prev.y;
    const cp2x = prev.x + ((pt.x - prev.x) * 2) / 3;
    const cp2y = pt.y;
    return `${acc} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, "");

  const firstPt = coords[0];
  const lastPt = coords[coords.length - 1];
  const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${padTop + plotHeight} L ${firstPt.x.toFixed(1)} ${padTop + plotHeight} Z`;

  const maLinePath = maCoords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, "");

  const handleMouseMove = (e) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const relativeX = (mouseX / svgRect.width) * chartWidth;

    let closestIdx = 0;
    let closestDist = Infinity;
    coords.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    setHoveredIdx(closestIdx);
    setTooltipPos({
      x: svgRect.left + (coords[closestIdx].x / chartWidth) * svgRect.width,
      y: svgRect.top + (coords[closestIdx].y / height) * svgRect.height - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activeItem = hoveredIdx !== null ? coords[hoveredIdx] : null;

  return (
    <div className={`life-line-chart-container ${className}`} style={{ height: `${height}px` }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
        className="life-line-chart-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label={`${ariaLabel}. Current: ${coords[coords.length - 1]?.value}${unit}. Low: ${rawMin}${unit}, High: ${rawMax}${unit}.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + plotHeight - ratio * plotHeight;
          const gridVal = Math.round(minVal + ratio * valRange);
          return (
            <g key={ratio} className="life-chart-grid-row">
              <line
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke="var(--life-line, #3a4c3f)"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.35"
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--life-muted, #b0c0b5)"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {target !== null && (
          <g className="life-chart-target-line">
            {(() => {
              const targetY = padTop + plotHeight - ((target - minVal) / valRange) * plotHeight;
              return (
                <>
                  <line
                    x1={padLeft}
                    y1={targetY}
                    x2={chartWidth - padRight}
                    y2={targetY}
                    stroke="var(--life-warm, #dab494)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartWidth - padRight}
                    y={targetY - 6}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--life-warm, #dab494)"
                  >
                    {targetLabel}: {target}{unit}
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {showArea && <path d={areaPath} fill={`url(#${gradientId})`} />}

        {showMovingAverage && maLinePath && (
          <path
            d={maLinePath}
            fill="none"
            stroke={movingAverageColor}
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        )}

        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((pt, idx) => (
          <circle
            key={pt.date || idx}
            cx={pt.x}
            cy={pt.y}
            r={hoveredIdx === idx ? "5" : coords.length <= 14 ? "3" : "0"}
            fill={hoveredIdx === idx ? "var(--life-accent-dark, #b5dfc4)" : color}
            stroke="var(--life-paper, #202f26)"
            strokeWidth="1.5"
            className="life-line-dot"
          />
        ))}

        {activeItem && (
          <g className="life-chart-crosshair">
            <line
              x1={activeItem.x}
              y1={padTop}
              x2={activeItem.x}
              y2={padTop + plotHeight}
              stroke="var(--life-muted, #b0c0b5)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.7"
            />
            <circle
              cx={activeItem.x}
              cy={activeItem.y}
              r="6"
              fill={color}
              stroke="var(--life-paper, #202f26)"
              strokeWidth="2"
            />
          </g>
        )}

        {coords.map((pt, idx) => {
          const shouldShow = coords.length <= 7 || idx % Math.ceil(coords.length / 6) === 0 || idx === coords.length - 1;
          if (!shouldShow) return null;
          return (
            <text
              key={idx}
              x={pt.x}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="var(--life-muted, #b0c0b5)"
            >
              {pt.date ? pt.date.slice(5) : ""}
            </text>
          );
        })}
      </svg>

      {activeItem && (
        <LifeChartTooltip
          visible={true}
          x={tooltipPos.x}
          y={tooltipPos.y}
          date={activeItem.date}
          label="Value"
          value={formatValue(activeItem.value)}
          unit={unit}
          movingAverage={activeItem.movingAverage}
          source={activeItem.source}
          extra={activeItem.extra}
        />
      )}
    </div>
  );
};

export default LifeLineChart;

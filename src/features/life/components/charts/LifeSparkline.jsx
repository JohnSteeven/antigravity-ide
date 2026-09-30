import React, { useId } from "react";

export const LifeSparkline = ({
  data = [],
  width = 120,
  height = 36,
  color = "var(--life-accent, #98cbb0)",
  showGradient = true,
  showEndDot = true,
  ariaLabel = "Trend sparkline",
  className = "",
}) => {
  const gradientId = useId();

  const points = (data || [])
    .map((item) => (typeof item === "object" && item !== null ? item.value : item))
    .filter((v) => v !== null && v !== undefined && !isNaN(v))
    .map(Number);

  const paddingY = 4;
  const paddingX = 4;
  const drawWidth = width - paddingX * 2;
  const drawHeight = height - paddingY * 2;

  if (points.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`life-sparkline life-sparkline-empty ${className}`}
        aria-label={`${ariaLabel}: No data`}
        role="img"
      >
        <line
          x1={paddingX}
          y1={height / 2}
          x2={width - paddingX}
          y2={height / 2}
          stroke="var(--life-line, #3a4c3f)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  if (points.length === 1) {
    const cy = height / 2;
    const cx = width / 2;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={`life-sparkline ${className}`}
        aria-label={`${ariaLabel}: Single value ${points[0]}`}
        role="img"
      >
        <circle cx={cx} cy={cy} r="3" fill={color} />
      </svg>
    );
  }

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * drawWidth;
    const y = height - paddingY - ((val - minVal) / range) * drawHeight;
    return { x, y, val };
  });

  const pathD = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, "");

  const lastPt = coords[coords.length - 1];
  const firstPt = coords[0];
  const areaD = `${pathD} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`life-sparkline ${className}`}
      aria-label={`${ariaLabel}: From ${points[0]} to ${points[points.length - 1]}`}
      role="img"
    >
      <defs>
        {showGradient && (
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        )}
      </defs>

      {showGradient && (
        <path d={areaD} fill={`url(#${gradientId})`} />
      )}

      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showEndDot && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
};

export default LifeSparkline;

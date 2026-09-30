import React from "react";

export const LifeProgressRing = ({
  value = 0,
  max = 100,
  size = 64,
  strokeWidth = 6,
  color = "var(--life-accent, #98cbb0)",
  trackColor = "var(--life-line, #3a4c3f)",
  label = "",
  sublabel = "",
  showPercentage = true,
  children = null,
  className = "",
}) => {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(Number(value) || 0, 0), safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / safeMax) * circumference;

  return (
    <div
      className={`life-progress-ring-wrapper ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label || `${percentage}% complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="life-progress-ring-svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="life-progress-ring-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="life-progress-ring-indicator"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="life-progress-ring-content">
        {children ? (
          children
        ) : (
          <>
            {showPercentage && <span className="life-progress-ring-pct">{percentage}%</span>}
            {sublabel && <span className="life-progress-ring-sub">{sublabel}</span>}
          </>
        )}
      </div>
    </div>
  );
};

export default LifeProgressRing;

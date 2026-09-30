import React from "react";

export const LifeEmptyChartState = ({
  title = "Not enough data yet",
  message = "Log your first entries to see trends, historical comparisons, and actionable insights.",
  actionLabel = null,
  onAction = null,
  height = 180,
  className = "",
}) => {
  return (
    <div
      className={`life-empty-chart-state ${className}`}
      style={{ minHeight: `${height}px` }}
      role="status"
      aria-live="polite"
    >
      <div className="life-empty-chart-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 16l4-4 4 4 6-6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="7" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <div className="life-empty-chart-title">{title}</div>
      <p className="life-empty-chart-message">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="life-btn life-btn-outline life-btn-sm life-empty-chart-btn"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default LifeEmptyChartState;

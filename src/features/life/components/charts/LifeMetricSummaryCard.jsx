import React from "react";
import LifeSparkline from "./LifeSparkline";
import LifeComparisonBadge from "./LifeComparisonBadge";
import LifeDataSourceBadge from "./LifeDataSourceBadge";

export const LifeMetricSummaryCard = ({
  title,
  category = "",
  value,
  unit = "",
  delta = null,
  periodLabel = "vs last period",
  trend,
  inverted = false,
  sparklineData = [],
  sparklineColor = "var(--life-accent, #98cbb0)",
  source = null,
  insight = "",
  onDrillDown = null,
  actionLabel = "View details",
  className = "",
}) => {
  return (
    <div className={`life-metric-summary-card ${className}`}>
      <div className="life-card-top-row">
        <div className="life-card-title-group">
          {category && <span className="life-card-category">{category}</span>}
          <h3 className="life-card-title">{title}</h3>
        </div>
        {source && <LifeDataSourceBadge source={source} />}
      </div>

      <div className="life-card-metric-row">
        <div className="life-card-main-val">
          <span className="life-card-number">{value !== null && value !== undefined ? value : "—"}</span>
          {unit && <span className="life-card-unit">{unit}</span>}
        </div>
        <div className="life-card-badge-box">
          <LifeComparisonBadge
            delta={delta}
            unit={unit}
            periodLabel={periodLabel}
            trend={trend}
            inverted={inverted}
          />
        </div>
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="life-card-sparkline-box">
          <LifeSparkline
            data={sparklineData}
            width={240}
            height={42}
            color={sparklineColor}
            ariaLabel={`${title} trend`}
          />
        </div>
      )}

      {insight && (
        <p className="life-card-insight-text">
          <span className="life-insight-icon" aria-hidden="true">✦</span>
          {insight}
        </p>
      )}

      {onDrillDown && (
        <div className="life-card-footer">
          <button
            type="button"
            className="life-card-action-btn"
            onClick={onDrillDown}
          >
            <span>{actionLabel}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LifeMetricSummaryCard;

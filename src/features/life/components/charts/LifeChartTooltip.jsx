import React from "react";
import LifeDataSourceBadge from "./LifeDataSourceBadge";

export const LifeChartTooltip = ({
  visible = false,
  x = 0,
  y = 0,
  date = "",
  value = null,
  unit = "",
  label = "",
  movingAverage = null,
  source = null,
  extra = null,
}) => {
  if (!visible) return null;

  return (
    <div
      className="life-chart-tooltip"
      style={{ left: `${x}px`, top: `${y}px` }}
      role="tooltip"
    >
      {date && <div className="life-chart-tooltip-date">{date}</div>}
      <div className="life-chart-tooltip-body">
        {label && <span className="life-chart-tooltip-label">{label}: </span>}
        <span className="life-chart-tooltip-value">
          {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ""}` : "No data"}
        </span>
      </div>
      {movingAverage !== null && movingAverage !== undefined && (
        <div className="life-chart-tooltip-secondary">
          <span>7d avg: </span>
          <strong>{movingAverage}{unit ? ` ${unit}` : ""}</strong>
        </div>
      )}
      {extra && <div className="life-chart-tooltip-extra">{extra}</div>}
      {source && (
        <div className="life-chart-tooltip-source">
          <LifeDataSourceBadge source={source} />
        </div>
      )}
    </div>
  );
};

export default LifeChartTooltip;

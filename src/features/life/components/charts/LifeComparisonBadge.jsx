import React from "react";

export const LifeComparisonBadge = ({
  delta,
  unit = "",
  periodLabel = "",
  trend,
  inverted = false,
  className = "",
}) => {
  if (delta === null || delta === undefined || isNaN(delta)) {
    return (
      <span className={`life-comparison-badge life-comparison-neutral ${className}`}>
        <span className="life-comparison-symbol" aria-hidden="true">—</span>
        <span className="life-comparison-label">No comparison</span>
      </span>
    );
  }

  const numDelta = Number(delta);
  const isZero = Math.abs(numDelta) < 0.001;
  const isPositive = numDelta > 0;

  let direction = "flat";
  let symbol = "→";
  if (!isZero) {
    direction = isPositive ? "up" : "down";
    symbol = isPositive ? "↑" : "↓";
  }

  let sentiment = "neutral";
  if (trend) {
    sentiment = trend;
  } else if (!isZero) {
    const isFavorable = inverted ? !isPositive : isPositive;
    sentiment = isFavorable ? "favorable" : "attention";
  }

  const formattedDelta = isZero
    ? "0"
    : `${isPositive ? "+" : ""}${Math.abs(numDelta) >= 10 ? numDelta.toFixed(1) : numDelta.toFixed(2).replace(/\.?0+$/, "")}`;

  const accessibleText = `${isPositive ? "Increased" : numDelta < 0 ? "Decreased" : "Unchanged"} by ${formattedDelta}${unit ? ` ${unit}` : ""} ${periodLabel ? `(${periodLabel})` : ""}`;

  return (
    <span
      className={`life-comparison-badge life-comparison-${direction} life-sentiment-${sentiment} ${className}`}
      aria-label={accessibleText}
      title={accessibleText}
    >
      <span className="life-comparison-symbol" aria-hidden="true">{symbol}</span>
      <span className="life-comparison-value">{formattedDelta}{unit}</span>
      {periodLabel && <span className="life-comparison-period">{periodLabel}</span>}
    </span>
  );
};

export default LifeComparisonBadge;

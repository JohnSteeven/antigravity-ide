import React from "react";

export const DEFAULT_RANGES = ["7D", "30D", "3M", "6M", "1Y", "ALL"];

export const RANGE_LABELS = {
  "7D": "Last 7 Days",
  "30D": "Last 30 Days",
  "3M": "Last 3 Months",
  "6M": "Last 6 Months",
  "1Y": "Last Year",
  "ALL": "All Time",
};

export const LifeRangeSelector = ({
  selected = "30D",
  onChange,
  options = DEFAULT_RANGES,
  disabled = false,
  className = "",
}) => {
  return (
    <div
      className={`life-range-selector ${className}`}
      role="tablist"
      aria-label="Time range selector"
    >
      {options.map((range) => {
        const isSelected = selected === range;
        return (
          <button
            key={range}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={disabled}
            className={`life-range-btn ${isSelected ? "is-selected" : ""}`}
            title={RANGE_LABELS[range] || range}
            onClick={() => onChange && onChange(range)}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
};

export default LifeRangeSelector;

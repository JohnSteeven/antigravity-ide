import React, { useState } from "react";
import LifeChartTooltip from "./LifeChartTooltip";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const LifeCalendarHeatmap = ({
  data = {},
  weeks = 52,
  endDate = new Date().toISOString().slice(0, 10),
  cellSize = 12,
  cellGap = 3,
  ariaLabel = "Habit consistency annual heatmap",
  className = "",
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const dataMap = Array.isArray(data)
    ? Object.fromEntries(data.map((d) => [d.date, d]))
    : data || {};

  const endObj = new Date(`${endDate}T12:00:00Z`);
  const dayOfWeek = (endObj.getUTCDay() + 6) % 7;
  const totalDays = weeks * 7;
  const startObj = new Date(endObj.getTime() - (totalDays - (7 - dayOfWeek) - 1) * 86400000);

  const gridWeeks = [];
  const monthLabels = [];
  let currentMonth = -1;

  for (let w = 0; w < weeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const cellTime = startObj.getTime() + (w * 7 + d) * 86400000;
      const cellDateObj = new Date(cellTime);
      const dateKey = cellDateObj.toISOString().slice(0, 10);
      const isFuture = cellDateObj > endObj;

      const record = dataMap[dateKey];
      let level = 0;
      let label = "No activity";

      if (record) {
        if (typeof record === "object") {
          if (record.status === "completed") level = 4;
          else if (record.status === "partial") level = 2;
          else if (record.status === "skipped") level = 1;
          else if (record.value !== undefined) {
            level = Math.min(Math.max(Number(record.value) || 0, 0), 4);
          }
          label = record.label || (record.status ? `Status: ${record.status}` : `${record.value || 0}`);
        } else if (typeof record === "number") {
          level = Math.min(Math.max(record, 0), 4);
          label = `Level ${level}`;
        }
      }

      const monthIdx = cellDateObj.getUTCMonth();
      if (d === 0 && monthIdx !== currentMonth && !isFuture) {
        currentMonth = monthIdx;
        monthLabels.push({ weekIndex: w, name: MONTHS[monthIdx] });
      }

      weekDays.push({
        date: dateKey,
        level,
        label,
        isFuture,
        record,
      });
    }
    gridWeeks.push(weekDays);
  }

  const svgWidth = weeks * (cellSize + cellGap) + 32;
  const svgHeight = 7 * (cellSize + cellGap) + 24;

  const handleCellEnter = (cell, e) => {
    if (cell.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCell(cell);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const getLevelColor = (level, isFuture) => {
    if (isFuture) return "transparent";
    switch (level) {
      case 1:
        return "rgba(152, 203, 176, 0.25)";
      case 2:
        return "rgba(152, 203, 176, 0.50)";
      case 3:
        return "rgba(152, 203, 176, 0.75)";
      case 4:
        return "var(--life-accent, #98cbb0)";
      default:
        return "var(--life-line, #3a4c3f)";
    }
  };

  return (
    <div className={`life-calendar-heatmap-container ${className}`}>
      <div className="life-heatmap-scrollbox">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="life-calendar-heatmap-svg"
          role="img"
          aria-label={ariaLabel}
        >
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={32 + m.weekIndex * (cellSize + cellGap)}
              y="12"
              fontSize="10"
              fill="var(--life-muted, #b0c0b5)"
            >
              {m.name}
            </text>
          ))}

          {[0, 2, 4].map((d) => (
            <text
              key={d}
              x="24"
              y={20 + d * (cellSize + cellGap) + cellSize - 2}
              textAnchor="end"
              fontSize="9"
              fill="var(--life-muted, #b0c0b5)"
            >
              {WEEKDAYS[d]}
            </text>
          ))}

          {gridWeeks.map((week, wIdx) => {
            const x = 32 + wIdx * (cellSize + cellGap);
            return (
              <g key={wIdx}>
                {week.map((cell, dIdx) => {
                  const y = 20 + dIdx * (cellSize + cellGap);
                  return (
                    <rect
                      key={cell.date}
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx="2"
                      ry="2"
                      fill={getLevelColor(cell.level, cell.isFuture)}
                      opacity={cell.isFuture ? 0 : cell.level === 0 ? 0.35 : 1}
                      className={`life-heatmap-cell ${cell.isFuture ? "is-future" : ""}`}
                      onMouseEnter={(e) => handleCellEnter(cell, e)}
                      onMouseLeave={handleCellLeave}
                      tabIndex={cell.isFuture ? -1 : 0}
                      role="graphics-symbol"
                      aria-label={`${cell.date}: ${cell.label}`}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="life-heatmap-legend">
        <span className="life-heatmap-legend-label">Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <span
            key={lvl}
            className="life-heatmap-legend-swatch"
            style={{
              backgroundColor: getLevelColor(lvl, false),
              opacity: lvl === 0 ? 0.35 : 1,
            }}
          />
        ))}
        <span className="life-heatmap-legend-label">More</span>
      </div>

      {hoveredCell && (
        <LifeChartTooltip
          visible={true}
          x={tooltipPos.x}
          y={tooltipPos.y}
          date={hoveredCell.date}
          label="Activity"
          value={hoveredCell.label}
          source={hoveredCell.record?.source}
        />
      )}
    </div>
  );
};

export default LifeCalendarHeatmap;

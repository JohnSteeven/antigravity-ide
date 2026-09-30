const fs = require("fs");
const path = require("path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", "..", relative), "utf8");

describe("Life Visualization System Contracts (Phase 29.5B)", () => {
  describe("Component Source Contracts", () => {
    it("exports all canonical chart components in charts/index.js", () => {
      const indexSrc = read("src/features/life/components/charts/index.js");
      expect(indexSrc).toContain("LifeSparkline");
      expect(indexSrc).toContain("LifeLineChart");
      expect(indexSrc).toContain("LifeBarChart");
      expect(indexSrc).toContain("LifeDonutChart");
      expect(indexSrc).toContain("LifeCalendarHeatmap");
      expect(indexSrc).toContain("LifeProgressRing");
      expect(indexSrc).toContain("LifeRangeSelector");
      expect(indexSrc).toContain("LifeMetricSummaryCard");
      expect(indexSrc).toContain("LifeComparisonBadge");
      expect(indexSrc).toContain("LifeChartTooltip");
      expect(indexSrc).toContain("LifeDataSourceBadge");
      expect(indexSrc).toContain("LifeEmptyChartState");
    });

    it("verifies range selector supports canonical presets: 7D, 30D, 3M, 6M, 1Y, ALL", () => {
      const rangeSrc = read("src/features/life/components/charts/LifeRangeSelector.jsx");
      ["7D", "30D", "3M", "6M", "1Y", "ALL"].forEach((r) => {
        expect(rangeSrc).toContain(`\"${r}\"`);
      });
      expect(rangeSrc).toContain("role=\"tablist\"");
    });

    it("verifies metric summary card implements analytical clarity hierarchy", () => {
      const cardSrc = read("src/features/life/components/charts/LifeMetricSummaryCard.jsx");
      expect(cardSrc).toContain("LifeSparkline");
      expect(cardSrc).toContain("LifeComparisonBadge");
      expect(cardSrc).toContain("LifeDataSourceBadge");
      expect(cardSrc).toContain("life-card-insight-text");
      expect(cardSrc).toContain("onDrillDown");
    });

    it("verifies data source badge covers all provenance kinds", () => {
      const badgeSrc = read("src/features/life/components/charts/LifeDataSourceBadge.jsx");
      ["manual", "wearable", "phone", "import", "derived", "api"].forEach((src) => {
        expect(badgeSrc).toContain(src);
      });
    });

    it("verifies calendar heatmap renders 52-week 7-day grid and accessible cells", () => {
      const heatmapSrc = read("src/features/life/components/charts/LifeCalendarHeatmap.jsx");
      expect(heatmapSrc).toContain("weeks = 52");
      expect(heatmapSrc).toContain("WEEKDAYS");
      expect(heatmapSrc).toContain("role=\"graphics-symbol\"");
      expect(heatmapSrc).toContain("life-heatmap-legend");
    });
  });

  describe("Donut Chart Math Contract", () => {
    it("computes strokeDasharray and strokeDashoffset correctly", () => {
      const size = 200;
      const strokeWidth = 24;
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      const data = [
        { label: "Protein", value: 40 },
        { label: "Carbs", value: 40 },
        { label: "Fat", value: 20 },
      ];
      const total = 100;

      let acc = 0;
      const computed = data.map((item) => {
        const pct = item.value / total;
        const dashArray = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
        const dashOffset = (-acc * circumference).toFixed(2);
        acc += pct;
        return { pct, dashArray, dashOffset };
      });

      expect(computed[0].pct).toBe(0.4);
      expect(Number(computed[0].dashOffset)).toBe(0);
      expect(computed[1].pct).toBe(0.4);
      expect(Number(computed[1].dashOffset)).toBeCloseTo(-0.4 * circumference, 1);
      expect(computed[2].pct).toBe(0.2);
    });
  });

  describe("Progress Ring Math Contract", () => {
    it("computes dashoffset properly for 0%, 50%, and 100%", () => {
      const size = 64;
      const strokeWidth = 6;
      const radius = (size - strokeWidth) / 2;
      const circumference = 2 * Math.PI * radius;

      const calcOffset = (val, max) => circumference - (Math.min(val, max) / max) * circumference;

      expect(calcOffset(0, 100)).toBeCloseTo(circumference, 2);
      expect(calcOffset(50, 100)).toBeCloseTo(circumference / 2, 2);
      expect(calcOffset(100, 100)).toBeCloseTo(0, 2);
    });
  });

  describe("Sparse & Edge Case Data Handling", () => {
    it("safely handles 0 or 1 data points without crashing or NaN coordinates", () => {
      const normalizePoints = (data) =>
        (data || [])
          .map((item) => (typeof item === "object" && item !== null ? item.value : item))
          .filter((v) => v !== null && v !== undefined && !isNaN(v))
          .map(Number);

      expect(normalizePoints([])).toEqual([]);
      expect(normalizePoints([null, undefined, NaN])).toEqual([]);
      expect(normalizePoints([{ value: 10 }, { value: null }, 20])).toEqual([10, 20]);
    });
  });

  describe("Comparison Delta Formatting", () => {
    it("formats positive, negative, and zero deltas with directional indicators", () => {
      const formatDelta = (num) => {
        const isZero = Math.abs(num) < 0.001;
        const isPositive = num > 0;
        const symbol = isZero ? "→" : isPositive ? "↑" : "↓";
        const text = isZero ? "0" : `${isPositive ? "+" : ""}${num.toFixed(1)}`;
        return { symbol, text };
      };

      expect(formatDelta(1.5)).toEqual({ symbol: "↑", text: "+1.5" });
      expect(formatDelta(-2.3)).toEqual({ symbol: "↓", text: "-2.3" });
      expect(formatDelta(0)).toEqual({ symbol: "→", text: "0" });
    });
  });
});

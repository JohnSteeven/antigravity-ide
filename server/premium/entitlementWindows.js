// Paid windows belong to ReaderMembership. Payment keeps historical attribution.
const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const validPeriod = (period) => {
  const start = validDate(period.start);
  const end = validDate(period.end);
  return Boolean(start && end && start < end);
};

const retainedPeriods = (periods, now) => (periods || [])
  .filter((period) => validPeriod(period) && new Date(period.end) > now)
  .map((period) => typeof period.toObject === "function" ? period.toObject() : { ...period });

// Merge only touching/overlapping windows. A refunded purchase can leave a gap.
const currentPaidWindow = (periods, now) => {
  const sorted = (periods || []).filter(validPeriod)
    .map((period) => ({ start: new Date(period.start), end: new Date(period.end) }))
    .sort((left, right) => left.start - right.start);
  const merged = [];
  for (const period of sorted) {
    const last = merged[merged.length - 1];
    if (last && period.start <= last.end) {
      if (period.end > last.end) last.end = period.end;
    } else merged.push({ ...period });
  }
  return merged.find((period) => period.start <= now && now < period.end) || null;
};

const periodBounds = (periods) => {
  const valid = (periods || []).filter(validPeriod);
  if (!valid.length) return { currentPeriodStart: null, currentPeriodEnd: null };
  return {
    currentPeriodStart: new Date(Math.min(...valid.map((period) => new Date(period.start).getTime()))),
    currentPeriodEnd: new Date(Math.max(...valid.map((period) => new Date(period.end).getTime()))),
  };
};

module.exports = { currentPaidWindow, periodBounds, retainedPeriods, validDate, validPeriod };

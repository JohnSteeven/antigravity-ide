const { RECURRENCE_TYPES } = require("./constants");
const { daysBetween, enumerateDateKeys, localWeekday, parseDateKey } = require("./time");

const normalizeSchedule = (input = {}) => {
  const type = RECURRENCE_TYPES.includes(String(input.type || "").toLowerCase())
    ? String(input.type).toLowerCase()
    : "daily";
  return {
    type,
    interval: Math.max(1, Math.min(365, Number(input.interval) || 1)),
    weekdays: [...new Set((input.weekdays || []).map(Number).filter((day) => day >= 0 && day <= 6))].sort(),
    daysOfMonth: [...new Set((input.daysOfMonth || []).map(Number).filter((day) => day >= 1 && day <= 31))].sort((a, b) => a - b),
    dates: [...new Set((input.dates || []).map(String))].sort(),
    timesPerWeek: Math.max(1, Math.min(7, Number(input.timesPerWeek) || 1)),
    times: [...new Set((input.times || []).map(String).filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)))],
    window: input.window && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.window.start || "")
      ? { start: input.window.start, end: input.window.end || input.window.start }
      : null,
    startDate: String(input.startDate || ""),
    endDate: input.endDate ? String(input.endDate) : null,
    pausedRanges: (input.pausedRanges || []).map((range) => ({ start: String(range.start), end: range.end ? String(range.end) : null })),
  };
};

const isPausedOnDate = (schedule, dateKey) => schedule.pausedRanges.some((range) => (
  dateKey >= range.start && (!range.end || dateKey <= range.end)
));

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const isScheduledOnDate = (inputSchedule, dateKey) => {
  const schedule = normalizeSchedule(inputSchedule);
  if (!schedule.startDate || dateKey < schedule.startDate) return false;
  if (schedule.endDate && dateKey > schedule.endDate) return false;
  if (isPausedOnDate(schedule, dateKey)) return false;

  const weekday = localWeekday(dateKey);
  const difference = daysBetween(schedule.startDate, dateKey);
  const { year, month, day } = parseDateKey(dateKey);

  switch (schedule.type) {
    case "weekdays": return weekday >= 1 && weekday <= 5;
    case "weekends": return weekday === 0 || weekday === 6;
    case "specific_weekdays": return schedule.weekdays.includes(weekday);
    case "every_n_days":
    case "custom_interval": return difference >= 0 && difference % schedule.interval === 0;
    case "times_per_week": {
      const chosen = schedule.weekdays.length
        ? schedule.weekdays
        : [1, 2, 3, 4, 5, 6, 0].slice(0, schedule.timesPerWeek);
      return chosen.slice(0, schedule.timesPerWeek).includes(weekday);
    }
    case "days_of_month": return schedule.daysOfMonth.includes(day);
    case "monthly": {
      const anchor = parseDateKey(schedule.startDate).day;
      return day === Math.min(anchor, daysInMonth(year, month));
    }
    case "specific_dates": return schedule.dates.includes(dateKey);
    case "daily":
    default: return true;
  }
};

const generateSchedule = (schedule, startDateKey, endDateKey, maximum = 366) => (
  enumerateDateKeys(startDateKey, endDateKey, maximum).filter((dateKey) => isScheduledOnDate(schedule, dateKey))
);

module.exports = {
  generateSchedule,
  isPausedOnDate,
  isScheduledOnDate,
  normalizeSchedule,
};

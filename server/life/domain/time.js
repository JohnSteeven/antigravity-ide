const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assertTimeZone = (timeZone) => {
  const candidate = String(timeZone || "UTC");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    const error = new Error("Choose a valid IANA timezone such as Asia/Kolkata.");
    error.status = 422;
    throw error;
  }
};

const assertDateKey = (dateKey) => {
  if (!DATE_KEY_PATTERN.test(String(dateKey || ""))) {
    const error = new Error("Use a local date in YYYY-MM-DD format.");
    error.status = 422;
    throw error;
  }
  return String(dateKey);
};

const formatterCache = new Map();
const getFormatter = (timeZone) => {
  const zone = assertTimeZone(timeZone);
  if (!formatterCache.has(zone)) {
    formatterCache.set(zone, new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }));
  }
  return formatterCache.get(zone);
};

const getZonedParts = (date, timeZone) => {
  const instant = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(instant.getTime())) throw new Error("Invalid timestamp.");
  const parts = Object.fromEntries(
    getFormatter(timeZone).formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  return parts;
};

const localDateKey = (date = new Date(), timeZone = "UTC") => {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
};

const parseDateKey = (dateKey) => {
  const [year, month, day] = assertDateKey(dateKey).split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
    const error = new Error("Choose a real calendar date.");
    error.status = 422;
    throw error;
  }
  return { year, month, day };
};

const addLocalDays = (dateKey, days) => {
  const { year, month, day } = parseDateKey(dateKey);
  const next = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
};

const compareWallParts = (left, right) => {
  const keys = ["year", "month", "day", "hour", "minute", "second"];
  for (const key of keys) {
    if (left[key] < right[key]) return -1;
    if (left[key] > right[key]) return 1;
  }
  return 0;
};

const sameWallParts = (left, right) => compareWallParts(left, right) === 0;

const offsetAt = (date, timeZone) => {
  const parts = getZonedParts(date, timeZone);
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return representedAsUtc - Math.floor(date.getTime() / 1000) * 1000;
};

const zonedDateTimeToUtc = ({ dateKey, hour = 0, minute = 0, second = 0 }, timeZone = "UTC") => {
  const zone = assertTimeZone(timeZone);
  const date = parseDateKey(dateKey);
  const target = { ...date, hour: Number(hour), minute: Number(minute), second: Number(second) };
  const wallUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second);
  const offsets = new Set([
    offsetAt(new Date(wallUtc - 12 * 60 * 60 * 1000), zone),
    offsetAt(new Date(wallUtc), zone),
    offsetAt(new Date(wallUtc + 12 * 60 * 60 * 1000), zone),
  ]);
  const candidates = [...offsets]
    .map((offset) => new Date(wallUtc - offset))
    .filter((candidate) => sameWallParts(getZonedParts(candidate, zone), target))
    .sort((a, b) => a - b);

  // During a repeated DST hour choose the earlier occurrence. During a skipped
  // hour use Temporal-compatible "later" behavior by advancing to the first
  // valid local minute after the gap.
  if (candidates.length) return candidates[0];

  const compatibleCandidate = new Date(wallUtc - Math.min(...offsets));
  if (compareWallParts(getZonedParts(compatibleCandidate, zone), target) > 0) return compatibleCandidate;

  const scanStart = new Date(wallUtc - Math.max(...offsets) - 2 * 60 * 60 * 1000);
  for (let index = 0; index <= 360; index += 1) {
    const candidate = new Date(scanStart.getTime() + index * 60 * 1000);
    if (compareWallParts(getZonedParts(candidate, zone), target) >= 0) return candidate;
  }
  throw new Error("Could not resolve the requested local time.");
};

const zonedDayRange = (dateKey, timeZone = "UTC") => ({
  start: zonedDateTimeToUtc({ dateKey }, timeZone),
  end: zonedDateTimeToUtc({ dateKey: addLocalDays(dateKey, 1) }, timeZone),
});

const localWeekday = (dateKey) => {
  const { year, month, day } = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const daysBetween = (startDateKey, endDateKey) => {
  const start = parseDateKey(startDateKey);
  const end = parseDateKey(endDateKey);
  return Math.round((Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day)) / 86400000);
};

const enumerateDateKeys = (startDateKey, endDateKey, maximum = 366) => {
  assertDateKey(startDateKey);
  assertDateKey(endDateKey);
  const length = daysBetween(startDateKey, endDateKey);
  if (length < 0 || length >= maximum) {
    const error = new Error(`Date ranges must be between 1 and ${maximum} days.`);
    error.status = 422;
    throw error;
  }
  return Array.from({ length: length + 1 }, (_, index) => addLocalDays(startDateKey, index));
};

module.exports = {
  addLocalDays,
  assertDateKey,
  assertTimeZone,
  daysBetween,
  enumerateDateKeys,
  getZonedParts,
  localDateKey,
  localWeekday,
  parseDateKey,
  zonedDateTimeToUtc,
  zonedDayRange,
};

export const localDateInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const addDateDays = (dateKey, days) => {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const formatLifeDate = (dateKey, locale) => new Intl.DateTimeFormat(locale || undefined, {
  weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
}).format(new Date(`${dateKey}T12:00:00Z`));

export const formatMinutes = (minutes) => minutes === null || minutes === undefined
  ? "Not logged"
  : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export const formatMoney = (amountMinor, currency = "USD", locale) => {
  try {
    return new Intl.NumberFormat(locale || undefined, { style: "currency", currency }).format((Number(amountMinor) || 0) / 100);
  } catch {
    return `${currency} ${((Number(amountMinor) || 0) / 100).toFixed(2)}`;
  }
};

export const mutationId = (prefix, ...parts) => `${prefix}:${parts.join(":")}:${Date.now()}:${Math.random().toString(16).slice(2)}`;

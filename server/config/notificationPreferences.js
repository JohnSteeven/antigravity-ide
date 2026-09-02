const DAILY_QUOTE_TIME_SLOTS = Object.freeze([
  Object.freeze({ hour: 8, minute: 0, label: '8:00 AM' }),
  Object.freeze({ hour: 9, minute: 0, label: '9:00 AM (Default)' }),
  Object.freeze({ hour: 18, minute: 0, label: '6:00 PM' }),
  Object.freeze({ hour: 21, minute: 0, label: '9:00 PM' }),
]);

const isDailyQuoteTimeSlot = (hour, minute) => DAILY_QUOTE_TIME_SLOTS.some(
  (slot) => slot.hour === hour && slot.minute === minute
);

module.exports = {
  DAILY_QUOTE_TIME_SLOTS,
  isDailyQuoteTimeSlot,
};

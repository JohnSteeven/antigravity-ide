const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  type: { type: String, default: "daily" },
  interval: { type: Number, default: 1, min: 1, max: 365 },
  weekdays: [{ type: Number, min: 0, max: 6 }],
  daysOfMonth: [{ type: Number, min: 1, max: 31 }],
  dates: [String],
  timesPerWeek: { type: Number, default: 1, min: 1, max: 7 },
  times: [String],
  window: {
    start: { type: String, default: "" },
    end: { type: String, default: "" },
  },
  startDate: { type: String, required: true },
  endDate: { type: String, default: null },
  pausedRanges: [{
    start: { type: String, required: true },
    end: { type: String, default: null },
  }],
}, { _id: false });

const ReminderSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  times: [String],
  leadMinutes: { type: Number, default: 0, min: 0, max: 1440 },
  followUpMinutes: { type: Number, default: null, min: 1, max: 1440 },
  channels: [{ type: String, enum: ["in_app", "email", "web_push"] }],
}, { _id: false });

const SourceSchema = new mongoose.Schema({
  type: { type: String, enum: ["manual", "import", "integration", "system"], default: "manual" },
  provider: { type: String, default: "" },
  externalId: { type: String, default: "" },
  originalTimestamp: { type: Date, default: null },
  importedAt: { type: Date, default: null },
}, { _id: false });

module.exports = { ReminderSchema, ScheduleSchema, SourceSchema };

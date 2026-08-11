const mongoose = require("mongoose");
const { LIFE_EVENT_SOURCES, LIFE_EVENT_STATUSES, LIFE_ITEM_TYPES } = require("../domain/constants");

const LifeEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  itemType: { type: String, enum: LIFE_ITEM_TYPES, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, default: "" },
  occurrenceKey: { type: String, required: true, default: "all-day", maxlength: 80 },
  scheduledFor: { type: Date, required: true },
  occurredAt: { type: Date, default: Date.now, required: true },
  status: { type: String, enum: LIFE_EVENT_STATUSES, required: true },
  quantity: { type: Number, default: null },
  unit: { type: String, default: "", maxlength: 40 },
  durationMinutes: { type: Number, default: null, min: 0 },
  note: { type: String, default: "", maxlength: 2000 },
  source: { type: String, enum: LIFE_EVENT_SOURCES, default: "manual" },
  sourceProvider: { type: String, default: "", maxlength: 80 },
  externalId: { type: String, default: "", maxlength: 200 },
  idempotencyKey: { type: String, required: true, maxlength: 240 },
  supersedes: { type: mongoose.Schema.Types.ObjectId, ref: "LifeEvent", default: null },
  backfilled: { type: Boolean, default: false },
  snoozedUntil: { type: Date, default: null },
  routineSteps: [{
    stepId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true, maxlength: 120 },
    status: { type: String, enum: ["pending", "completed", "skipped"], default: "pending" },
  }],
}, { timestamps: true });

LifeEventSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
LifeEventSchema.index({ user: 1, itemType: 1, itemId: 1, scheduledDate: 1, occurrenceKey: 1, occurredAt: -1 });
LifeEventSchema.index({ user: 1, occurredAt: -1 });
module.exports = mongoose.model("LifeEvent", LifeEventSchema);

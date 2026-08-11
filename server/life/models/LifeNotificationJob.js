const mongoose = require("mongoose");

const LifeNotificationJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  itemType: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  occurrenceDate: { type: String, required: true },
  dueAt: { type: Date, required: true, index: true },
  channel: { type: String, enum: ["in_app", "email", "web_push"], default: "in_app" },
  title: { type: String, required: true, maxlength: 180 },
  message: { type: String, required: true, maxlength: 500 },
  dedupeKey: { type: String, required: true, unique: true },
  state: { type: String, enum: ["pending", "processing", "delivered", "suppressed", "retry", "failed"], default: "pending", index: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  nextAttemptAt: { type: Date, default: null },
  lockedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  suppressedReason: { type: String, default: "", maxlength: 120 },
  lastErrorCode: { type: String, default: "", maxlength: 80 },
}, { timestamps: true });

LifeNotificationJobSchema.index({ state: 1, dueAt: 1, nextAttemptAt: 1 });
LifeNotificationJobSchema.index({ user: 1, occurrenceDate: 1, state: 1 });
module.exports = mongoose.model("LifeNotificationJob", LifeNotificationJobSchema);

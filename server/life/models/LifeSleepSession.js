const mongoose = require("mongoose");
const { SourceSchema } = require("./shared");

const LifeSleepSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  localDate: { type: String, required: true, index: true },
  sessionType: { type: String, enum: ["main", "nap"], default: "main" },
  sleepStart: { type: Date, required: true },
  sleepEnd: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 0 },
  quality: { type: Number, default: null, min: 1, max: 5 },
  awakenings: { type: Number, default: 0, min: 0 },
  refreshedRating: { type: Number, default: null, min: 1, max: 5 },
  awakeMinutes: { type: Number, default: null, min: 0 },
  lightMinutes: { type: Number, default: null, min: 0 },
  deepMinutes: { type: Number, default: null, min: 0 },
  remMinutes: { type: Number, default: null, min: 0 },
  restingHeartRate: { type: Number, default: null, min: 25, max: 250 },
  hrv: { type: Number, default: null, min: 0, max: 300 },
  spo2Average: { type: Number, default: null, min: 50, max: 100 },
  note: { type: String, default: "", maxlength: 2000 },
  source: { type: SourceSchema, default: () => ({}) },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeSleepSessionSchema.index({ user: 1, localDate: -1 });
LifeSleepSessionSchema.index({ user: 1, sleepStart: -1 });
LifeSleepSessionSchema.index(
  { user: 1, "source.provider": 1, "source.externalId": 1 },
  { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } } }
);
LifeSleepSessionSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });

LifeSleepSessionSchema.pre("validate", function (next) {
  if (this.sleepStart && this.sleepEnd && (!this.durationMinutes || this.durationMinutes <= 0)) {
    const diffMs = new Date(this.sleepEnd).getTime() - new Date(this.sleepStart).getTime();
    if (diffMs > 0) {
      this.durationMinutes = Math.round(diffMs / (1000 * 60));
    }
  }
  next();
});

module.exports = mongoose.model("LifeSleepSession", LifeSleepSessionSchema);

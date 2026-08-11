const mongoose = require("mongoose");
const { HEALTH_ENTRY_TYPES } = require("../domain/constants");
const { SourceSchema } = require("./shared");

const WorkoutSetSchema = new mongoose.Schema({
  reps: { type: Number, default: null, min: 0 },
  weight: { type: Number, default: null, min: 0 },
  weightUnit: { type: String, enum: ["kg", "lb", "bodyweight", ""], default: "" },
  durationMinutes: { type: Number, default: null, min: 0 },
  distance: { type: Number, default: null, min: 0 },
  distanceUnit: { type: String, enum: ["km", "miles", "m", ""], default: "" },
}, { _id: false });

const WorkoutExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 120 },
  sets: { type: [WorkoutSetSchema], default: [] },
  notes: { type: String, default: "", maxlength: 500 },
}, { _id: false });

const LifeHealthEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: HEALTH_ENTRY_TYPES, required: true, index: true },
  localDate: { type: String, required: true, index: true },
  occurredAt: { type: Date, required: true, default: Date.now },
  value: { type: Number, default: null },
  unit: { type: String, default: "", maxlength: 40 },
  canonicalValue: { type: Number, default: null },
  canonicalUnit: { type: String, default: "", maxlength: 40 },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  durationMinutes: { type: Number, default: null, min: 0 },
  quality: { type: Number, default: null, min: 1, max: 5 },
  mood: { type: Number, default: null, min: 1, max: 5 },
  energy: { type: Number, default: null, min: 1, max: 5 },
  stress: { type: Number, default: null, min: 1, max: 5 },
  severity: { type: Number, default: null, min: 1, max: 10 },
  label: { type: String, default: "", maxlength: 160 },
  doseText: { type: String, default: "", maxlength: 160 },
  workoutType: { type: String, enum: ["", "strength", "cardio", "mobility", "sport", "custom"], default: "" },
  exercises: { type: [WorkoutExerciseSchema], default: [] },
  effort: { type: Number, default: null, min: 1, max: 10 },
  note: { type: String, default: "", maxlength: 3000 },
  source: { type: SourceSchema, default: () => ({}) },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeHealthEntrySchema.index({ user: 1, localDate: 1, type: 1 });
LifeHealthEntrySchema.index({ user: 1, occurredAt: -1 });
LifeHealthEntrySchema.index(
  { user: 1, "source.provider": 1, "source.externalId": 1 },
  { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } } }
);
LifeHealthEntrySchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("LifeHealthEntry", LifeHealthEntrySchema);

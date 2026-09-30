const mongoose = require("mongoose");
const { SourceSchema } = require("./shared");

const WorkoutSetSchema = new mongoose.Schema({
  setNumber: { type: Number, default: 1 },
  reps: { type: Number, default: null, min: 0 },
  weight: { type: Number, default: null, min: 0 },
  weightUnit: { type: String, enum: ["kg", "lb", "bodyweight", ""], default: "kg" },
  durationMinutes: { type: Number, default: null, min: 0 },
  distance: { type: Number, default: null, min: 0 },
  rpe: { type: Number, default: null, min: 1, max: 10 },
  completed: { type: Boolean, default: true },
}, { _id: false });

const WorkoutExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  sets: { type: [WorkoutSetSchema], default: [] },
  notes: { type: String, default: "", maxlength: 500 },
}, { _id: false });

const WORKOUT_TYPES = [
  "walking", "running", "cycling", "strength", "hiit",
  "yoga", "swimming", "mobility", "sport", "custom",
];

const LifeWorkoutSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  localDate: { type: String, required: true, index: true },
  workoutType: { type: String, enum: WORKOUT_TYPES, default: "custom", index: true },
  title: { type: String, default: "", maxlength: 160 },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  durationMinutes: { type: Number, required: true, min: 0 },
  distance: { type: Number, default: null, min: 0 },
  distanceUnit: { type: String, enum: ["km", "miles", "m", ""], default: "" },
  activeCalories: { type: Number, default: null, min: 0 },
  effort: { type: Number, default: null, min: 1, max: 10 },
  exercises: { type: [WorkoutExerciseSchema], default: [] },
  note: { type: String, default: "", maxlength: 2000 },
  source: { type: SourceSchema, default: () => ({}) },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeWorkoutSessionSchema.index({ user: 1, localDate: -1 });
LifeWorkoutSessionSchema.index({ user: 1, startedAt: -1 });
LifeWorkoutSessionSchema.index({ user: 1, workoutType: 1 });
LifeWorkoutSessionSchema.index(
  { user: 1, "source.provider": 1, "source.externalId": 1 },
  { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } } }
);
LifeWorkoutSessionSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("LifeWorkoutSession", LifeWorkoutSessionSchema);

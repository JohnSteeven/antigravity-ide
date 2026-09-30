const mongoose = require("mongoose");
const { SourceSchema } = require("./shared");

const CircumferenceSchema = new mongoose.Schema({
  waist: { type: Number, default: null, min: 0 },
  chest: { type: Number, default: null, min: 0 },
  hips: { type: Number, default: null, min: 0 },
  arms: { type: Number, default: null, min: 0 },
  thighs: { type: Number, default: null, min: 0 },
  neck: { type: Number, default: null, min: 0 },
  unit: { type: String, enum: ["cm", "in"], default: "cm" },
}, { _id: false });

const VitalsSchema = new mongoose.Schema({
  systolicBp: { type: Number, default: null, min: 40, max: 300 },
  diastolicBp: { type: Number, default: null, min: 20, max: 200 },
  restingHeartRate: { type: Number, default: null, min: 25, max: 250 },
  heartRate: { type: Number, default: null, min: 25, max: 250 },
  spo2: { type: Number, default: null, min: 50, max: 100 },
  temperature: { type: Number, default: null, min: 30, max: 45 },
  temperatureUnit: { type: String, enum: ["celsius", "fahrenheit"], default: "celsius" },
  bloodGlucose: { type: Number, default: null, min: 10, max: 1000 },
  glucoseUnit: { type: String, enum: ["mg/dL", "mmol/L"], default: "mg/dL" },
}, { _id: false });

const LifeBodyEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  localDate: { type: String, required: true, index: true },
  occurredAt: { type: Date, required: true, default: Date.now },
  timezone: { type: String, default: "UTC" },
  weight: { type: Number, default: null, min: 1, max: 500 },
  weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
  height: { type: Number, default: null, min: 30, max: 300 },
  heightUnit: { type: String, enum: ["cm", "in"], default: "cm" },
  bmi: { type: Number, default: null, min: 5, max: 100 },
  bodyFatPercentage: { type: Number, default: null, min: 1, max: 80 },
  muscleMass: { type: Number, default: null, min: 1, max: 200 },
  circumferences: { type: CircumferenceSchema, default: () => ({}) },
  vitals: { type: VitalsSchema, default: () => ({}) },
  note: { type: String, default: "", maxlength: 2000 },
  source: { type: SourceSchema, default: () => ({}) },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeBodyEntrySchema.index({ user: 1, localDate: -1 });
LifeBodyEntrySchema.index({ user: 1, occurredAt: -1 });
LifeBodyEntrySchema.index(
  { user: 1, "source.provider": 1, "source.externalId": 1 },
  { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } } }
);
LifeBodyEntrySchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });

LifeBodyEntrySchema.pre("save", function (next) {
  if (this.weight && this.height) {
    const weightKg = this.weightUnit === "lb" ? this.weight * 0.453592 : this.weight;
    const heightM = this.heightUnit === "in" ? (this.height * 2.54) / 100 : this.height / 100;
    if (heightM > 0) {
      this.bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    }
  }
  next();
});

module.exports = mongoose.model("LifeBodyEntry", LifeBodyEntrySchema);

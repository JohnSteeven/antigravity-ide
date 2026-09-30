const mongoose = require("mongoose");
const { SourceSchema } = require("./shared");

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const LifeNutritionEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  localDate: { type: String, required: true, index: true },
  occurredAt: { type: Date, required: true, default: Date.now },
  mealType: { type: String, enum: MEAL_TYPES, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  servings: { type: Number, default: 1, min: 0.1 },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, default: null, min: 0 },
  carbs: { type: Number, default: null, min: 0 },
  fat: { type: Number, default: null, min: 0 },
  fiber: { type: Number, default: null, min: 0 },
  sugar: { type: Number, default: null, min: 0 },
  sodium: { type: Number, default: null, min: 0 },
  note: { type: String, default: "", maxlength: 1000 },
  source: { type: SourceSchema, default: () => ({}) },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeNutritionEntrySchema.index({ user: 1, localDate: -1, mealType: 1 });
LifeNutritionEntrySchema.index({ user: 1, occurredAt: -1 });
LifeNutritionEntrySchema.index(
  { user: 1, "source.provider": 1, "source.externalId": 1 },
  { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } } }
);
LifeNutritionEntrySchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("LifeNutritionEntry", LifeNutritionEntrySchema);

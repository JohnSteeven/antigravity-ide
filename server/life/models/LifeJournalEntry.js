const mongoose = require("mongoose");
const { JOURNAL_ENTRY_TYPES } = require("../domain/constants");

const LifeJournalEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: JOURNAL_ENTRY_TYPES, required: true, index: true },
  localDate: { type: String, required: true, index: true },
  title: { type: String, default: "", maxlength: 180 },
  body: { type: String, required: true, maxlength: 20000 },
  promptResponses: [{
    prompt: { type: String, required: true, maxlength: 300 },
    response: { type: String, required: true, maxlength: 5000 },
  }],
  occurredAt: { type: Date, default: Date.now },
  pinnedToTimeline: { type: Boolean, default: false },
  dedupeKey: { type: String, default: undefined, maxlength: 240 },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

LifeJournalEntrySchema.index({ user: 1, localDate: -1, type: 1 });
LifeJournalEntrySchema.index({ user: 1, dedupeKey: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("LifeJournalEntry", LifeJournalEntrySchema);

const mongoose = require("mongoose");

const NewsImpressionSchema = new mongoose.Schema(
  {
    publisher: { type: String, required: true },
    category: { type: String, required: true },
    impressions: { type: Number, default: 1 },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsImpression", NewsImpressionSchema);

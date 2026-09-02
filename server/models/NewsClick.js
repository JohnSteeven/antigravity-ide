const mongoose = require("mongoose");

const NewsClickSchema = new mongoose.Schema(
  {
    articleId: { type: String, required: true },
    title: { type: String, required: true },
    publisher: { type: String, required: true },
    category: { type: String, required: true },
    url: { type: String, required: true },
    clickedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsClick", NewsClickSchema);

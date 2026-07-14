const mongoose = require("mongoose");

const NewsletterCampaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "archived"],
      default: "draft",
      index: true,
    },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    subscriberCount: { type: Number, default: 0 },
    deliveryHistory: [
      {
        email: { type: String, lowercase: true, trim: true },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, default: "success" },
      },
    ],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

NewsletterCampaignSchema.index({ isDeleted: 1, status: 1 });

module.exports = mongoose.model("NewsletterCampaign", NewsletterCampaignSchema);

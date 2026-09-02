const mongoose = require("mongoose");
const { redactAuditValue } = require("../utils/logRedaction");

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    // Alias for userId to support both field names across services
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userEmail: { type: String, trim: true },
    action: { type: String, required: true, index: true },
    description: { type: String, required: true },
    resourceType: { type: String },
    resourceId: { type: String },
    module: { type: String, index: true },
    status: { type: String, index: true }, // SUCCESS | FAILED
    // Request context
    ipAddress: { type: String },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    country: { type: String },
    city: { type: String },
    requestId: { type: String },
    // Change tracking
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ActivityLogSchema.pre("validate", function redactActivityDiffs(next) {
  if (this.oldValue !== undefined) this.oldValue = redactAuditValue(this.oldValue);
  if (this.newValue !== undefined) this.newValue = redactAuditValue(this.newValue);
  next();
});

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);

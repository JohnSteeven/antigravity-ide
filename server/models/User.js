const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    avatar: String,
    coverImage: String,
    bio: String,
    skills: [String],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    likedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    comments: [
      {
        articleId: String,
        articleTitle: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    countryCode: { type: String, default: "+91" },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "Reader" },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "DISABLED"], default: "ACTIVE" },
    tokenVersion: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    lastLogin: { type: Date },
    lastPasswordChange: { type: Date },
    verified: {
      email: { type: Boolean, default: false },
      mobile: { type: Boolean, default: false },
    },
    newsletter: { type: Boolean, default: true },
    provider: { type: String, default: "password" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    profile: {
      type: ProfileSchema,
      default: () => ({
        bio: "",
        skills: [],
        bookmarks: [],
        likedArticles: [],
        savedArticles: [],
        comments: [],
      }),
    },
    lastLoginAt: Date,
    notificationPreferences: {
      dailyQuote: {
        enabled: { type: Boolean, default: true },
        time: {
          hour: { type: Number, default: 9, min: 0, max: 23 },
          minute: { type: Number, default: 0 }
        }
      },
      newArticles: { enabled: { type: Boolean, default: false } },
      readingReminders: { enabled: { type: Boolean, default: false } },
      weeklySummary: { enabled: { type: Boolean, default: false } },
      sentQuotes: { type: [String], default: [] },
      lastQuoteSentAt: { type: Date, default: null },
      lastActiveAt: { type: Date, default: null },
      lastReadingReminderSentAt: { type: Date, default: null },
      lastWeeklySummarySentAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

UserSchema.methods.toSafeJSON = function toSafeJSON() {
  const user = this.toObject();
  user.id = user._id.toString();
  delete user.passwordHash;
  delete user.failedLoginAttempts;
  delete user.lockUntil;
  return user;
};

module.exports = mongoose.model("User", UserSchema);

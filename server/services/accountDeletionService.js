const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const TrustedDevice = require("../models/TrustedDevice");
const User = require("../models/User");
const ReaderMembership = require("../models/ReaderMembership");
const BillingEvent = require("../models/BillingEvent");
const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const CreatorReviewEvent = require("../models/CreatorReviewEvent");
const CourseEnrollment = require("../models/CourseEnrollment");
const LearningEvent = require("../models/LearningEvent");
const CreatorEngagementEvent = require("../models/CreatorEngagementEvent");
const ContentReport = require("../models/ContentReport");
const UserFollow = require("../models/UserFollow");
const Notification = require("../models/Notification");
const privacyService = require("../life/services/privacyService");

const requestDeletion = async (user, password, confirmation) => {
  if (confirmation !== "DELETE MY ACCOUNT") throw Object.assign(new Error("Type DELETE MY ACCOUNT to confirm."), { status: 422 });
  if (!user.passwordHash || !await bcrypt.compare(String(password || ""), user.passwordHash)) throw Object.assign(new Error("Your password is incorrect."), { status: 403 });
  user.scheduledDeletionAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.pendingDeletion = true;
  user.pendingDeletionAt = new Date();
  user.deletedBy = "self";
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await Promise.all([user.save(), RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() }), Session.updateMany({ user: user._id }, { isActive: false })]);
  return { scheduled: true, scheduledDeletionAt: user.scheduledDeletionAt };
};

const cancelDeletion = async (userId) => {
  const user = await User.findOneAndUpdate({ _id: userId, scheduledDeletionAt: { $ne: null } }, { $set: { scheduledDeletionAt: null, pendingDeletion: false, pendingDeletionAt: null, deletedBy: null } }, { new: true });
  if (!user) throw Object.assign(new Error("No account deletion is scheduled."), { status: 404 });
  return { cancelled: true };
};

const permanentlyDeleteAccount = async (userId) => {
  const life = await privacyService.deleteAllLifeData(userId);
  const creatorApplications = mongoose.isValidObjectId(userId)
    ? await CreatorApplication.find({ userId }).select("_id").lean()
    : [];
  const applicationIds = creatorApplications.map((application) => application._id);
  const subscriptionCleanup = mongoose.isValidObjectId(userId)
    ? [ReaderMembership.deleteMany({ userId }), BillingEvent.deleteMany({ userId })]
    : [Promise.resolve({ deletedCount: 0 }), Promise.resolve({ deletedCount: 0 })];
  const creatorLearnCleanup = mongoose.isValidObjectId(userId)
    ? [
      CreatorApplication.deleteMany({ userId }),
      CreatorReviewEvent.deleteMany({ applicationId: { $in: applicationIds } }),
      CreatorProfile.updateMany({ userId }, { $set: { userId: null, status: "deactivated", deactivatedAt: new Date() } }),
      CourseEnrollment.deleteMany({ userId }),
      LearningEvent.deleteMany({ userId }),
      CreatorEngagementEvent.deleteMany({ actorUserId: userId }),
      ContentReport.deleteMany({ reporterId: userId }),
      UserFollow.deleteMany({ followerId: userId }),
      Notification.deleteMany({ user: userId }),
    ]
    : Array.from({ length: 9 }, () => Promise.resolve({ deletedCount: 0, modifiedCount: 0 }));
  const [sessions, refreshTokens, devices, memberships, billingEvents, creatorApplicationsDeleted, creatorReviewEvents, creatorProfiles, enrollments, learningEvents, engagementEvents, contentReports, follows, notifications] = await Promise.all([
    Session.deleteMany({ user: userId }), RefreshToken.deleteMany({ user: userId }), TrustedDevice.deleteMany({ user: userId }),
    ...subscriptionCleanup,
    ...creatorLearnCleanup,
  ]);
  const user = await User.deleteOne({ _id: userId });
  return {
    userDeleted: user.deletedCount === 1,
    life: life.deleted,
    subscription: { memberships: memberships.deletedCount || 0, billingEvents: billingEvents.deletedCount || 0, externalProviderCancellationRequired: false },
    creator: { applications: creatorApplicationsDeleted.deletedCount || 0, reviewEvents: creatorReviewEvents.deletedCount || 0, profilesDeactivated: creatorProfiles.modifiedCount || 0, publishedContentPreserved: true },
    learn: { enrollments: enrollments.deletedCount || 0, learningEvents: learningEvents.deletedCount || 0, engagementEvents: engagementEvents.deletedCount || 0, reports: contentReports.deletedCount || 0, follows: follows.deletedCount || 0, notifications: notifications.deletedCount || 0 },
    authentication: { sessions: sessions.deletedCount || 0, refreshTokens: refreshTokens.deletedCount || 0, trustedDevices: devices.deletedCount || 0 },
  };
};

const purgeDueAccounts = async ({ now = new Date(), limit = 50 } = {}) => {
  const users = await User.find({ scheduledDeletionAt: { $ne: null, $lte: now } }).select("_id").limit(Math.min(200, Math.max(1, limit))).lean();
  const results = [];
  for (const user of users) {
    try { results.push({ userId: String(user._id), success: true, counts: await permanentlyDeleteAccount(user._id) }); }
    catch (error) { results.push({ userId: String(user._id), success: false, errorCode: error.code || "ACCOUNT_DELETE_FAILED" }); }
  }
  return { processed: results.length, succeeded: results.filter((item) => item.success).length, failed: results.filter((item) => !item.success).length, results };
};

module.exports = { cancelDeletion, permanentlyDeleteAccount, purgeDueAccounts, requestDeletion };

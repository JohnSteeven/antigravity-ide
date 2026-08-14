const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const TrustedDevice = require("../models/TrustedDevice");
const User = require("../models/User");
const ReaderMembership = require("../models/ReaderMembership");
const BillingEvent = require("../models/BillingEvent");
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
  const subscriptionCleanup = mongoose.isValidObjectId(userId)
    ? [ReaderMembership.deleteMany({ userId }), BillingEvent.deleteMany({ userId })]
    : [Promise.resolve({ deletedCount: 0 }), Promise.resolve({ deletedCount: 0 })];
  const [sessions, refreshTokens, devices, memberships, billingEvents] = await Promise.all([
    Session.deleteMany({ user: userId }), RefreshToken.deleteMany({ user: userId }), TrustedDevice.deleteMany({ user: userId }),
    ...subscriptionCleanup,
  ]);
  const user = await User.deleteOne({ _id: userId });
  return {
    userDeleted: user.deletedCount === 1,
    life: life.deleted,
    subscription: { memberships: memberships.deletedCount || 0, billingEvents: billingEvents.deletedCount || 0, externalProviderCancellationRequired: false },
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

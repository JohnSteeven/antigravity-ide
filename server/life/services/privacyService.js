const LifeEvent = require("../models/LifeEvent");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeFinancePlan = require("../models/LifeFinancePlan");
const LifeGoal = require("../models/LifeGoal");
const LifeHabit = require("../models/LifeHabit");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeInsight = require("../models/LifeInsight");
const LifeInsightPreference = require("../models/LifeInsightPreference");
const LifeImportBatch = require("../models/LifeImportBatch");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const LifeMedication = require("../models/LifeMedication");
const LifeNotificationDelivery = require("../models/LifeNotificationDelivery");
const LifeNotificationJob = require("../models/LifeNotificationJob");
const LifeProfile = require("../models/LifeProfile");
const LifePushSubscription = require("../models/LifePushSubscription");
const LifeRoutine = require("../models/LifeRoutine");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const LifeTask = require("../models/LifeTask");
const Notification = require("../../models/Notification");

const EXPORT_MODELS = Object.freeze({
  profile: LifeProfile,
  habits: LifeHabit,
  scheduleVersions: LifeScheduleVersion,
  completions: LifeEvent,
  routines: LifeRoutine,
  tasks: LifeTask,
  goals: LifeGoal,
  health: LifeHealthEntry,
  financeEntries: LifeFinanceEntry,
  financePlans: LifeFinancePlan,
  journal: LifeJournalEntry,
  medications: LifeMedication,
  insights: LifeInsight,
  insightPreferences: LifeInsightPreference,
  importBatches: LifeImportBatch,
  notificationJobs: LifeNotificationJob,
  notificationDeliveries: LifeNotificationDelivery,
  pushSubscriptions: LifePushSubscription,
});

const exportLifeData = async (userId) => {
  const entries = await Promise.all(Object.entries(EXPORT_MODELS).map(async ([key, Model]) => [key, await Model.find({ user: userId }).lean()]));
  const data = Object.fromEntries(entries);
  return { format: "myjourney-life-json", schemaVersion: 2, generatedAt: new Date().toISOString(), timezone: data.profile?.[0]?.timezone || "UTC", units: data.profile?.[0] ? { system: data.profile[0].unitSystem, water: data.profile[0].waterUnit, weight: data.profile[0].weightUnit, distance: data.profile[0].distanceUnit, currency: data.profile[0].currency } : {}, data };
};

const deleteAllLifeData = async (userId) => {
  const results = await Promise.all(Object.entries(EXPORT_MODELS).map(async ([key, Model]) => {
    const result = await Model.deleteMany({ user: userId });
    return [key, result.deletedCount || 0];
  }));
  const notifications = await Notification.deleteMany({ user: userId, source: "life" });
  return { deleted: { ...Object.fromEntries(results), siteNotifications: notifications.deletedCount || 0 } };
};

module.exports = { deleteAllLifeData, exportLifeData, LIFE_OWNED_MODELS: EXPORT_MODELS };

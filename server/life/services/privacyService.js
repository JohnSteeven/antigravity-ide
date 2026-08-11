const LifeEvent = require("../models/LifeEvent");
const LifeFinanceEntry = require("../models/LifeFinanceEntry");
const LifeFinancePlan = require("../models/LifeFinancePlan");
const LifeGoal = require("../models/LifeGoal");
const LifeHabit = require("../models/LifeHabit");
const LifeHealthEntry = require("../models/LifeHealthEntry");
const LifeInsight = require("../models/LifeInsight");
const LifeJournalEntry = require("../models/LifeJournalEntry");
const LifeMedication = require("../models/LifeMedication");
const LifeNotificationDelivery = require("../models/LifeNotificationDelivery");
const LifeNotificationJob = require("../models/LifeNotificationJob");
const LifeProfile = require("../models/LifeProfile");
const LifeRoutine = require("../models/LifeRoutine");
const LifeScheduleVersion = require("../models/LifeScheduleVersion");
const LifeTask = require("../models/LifeTask");

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
  notificationJobs: LifeNotificationJob,
  notificationDeliveries: LifeNotificationDelivery,
});

const exportLifeData = async (userId) => {
  const entries = await Promise.all(Object.entries(EXPORT_MODELS).map(async ([key, Model]) => [key, await Model.find({ user: userId }).lean()]));
  return { format: "myjourney-life-json", version: 1, exportedAt: new Date().toISOString(), data: Object.fromEntries(entries) };
};

const deleteAllLifeData = async (userId) => {
  const results = await Promise.all(Object.entries(EXPORT_MODELS).map(async ([key, Model]) => {
    const result = await Model.deleteMany({ user: userId });
    return [key, result.deletedCount || 0];
  }));
  return { deleted: Object.fromEntries(results) };
};

module.exports = { deleteAllLifeData, exportLifeData };

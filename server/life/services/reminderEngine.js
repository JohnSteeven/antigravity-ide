const profileService = require("./profileService");
const LifeEvent = require("../models/LifeEvent");

function isQuietHours(timeStr, quietHoursStart, quietHoursEnd) {
  if (!timeStr || !quietHoursStart || !quietHoursEnd) return false;
  const parseMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const current = parseMin(timeStr);
  const start = parseMin(quietHoursStart);
  const end = parseMin(quietHoursEnd);

  if (start < end) {
    return current >= start && current <= end;
  } else {
    return current >= start || current <= end;
  }
}

function formatCalmReminder(type, itemTitle) {
  switch (type) {
    case "habit":
      return `A gentle pause for your practice: ${itemTitle}.`;
    case "routine":
      return `Ready for your ${itemTitle} flow? Take your time.`;
    case "bill":
      return `Upcoming tracking reminder: ${itemTitle} is due soon.`;
    case "medication":
      return `Scheduled medication reminder: ${itemTitle}.`;
    case "goal":
      return `A quiet check-in with your goal: ${itemTitle}.`;
    default:
      return `Gentle reminder for: ${itemTitle}.`;
  }
}

async function evaluateReminderDelivery(userId, targetDate, targetTime) {
  const profile = await profileService.getOrCreateProfile(userId);
  const notifications = profile.notifications || {};
  const quietHours = notifications.quietHours || { enabled: true, start: "22:00", end: "07:00" };
  const dailyCap = notifications.dailyCap != null ? notifications.dailyCap : 8;

  if (!notifications.enabled) {
    return { shouldDeliver: false, reason: "notifications_disabled", profile };
  }

  if (profile.vacationMode?.enabled) {
    return { shouldDeliver: false, reason: "vacation_mode_active", profile };
  }

  if (quietHours.enabled && isQuietHours(targetTime, quietHours.start, quietHours.end)) {
    return {
      shouldDeliver: false,
      reason: "quiet_hours",
      quietHoursWindow: `${quietHours.start} – ${quietHours.end}`,
      profile
    };
  }

  const todayEvents = await LifeEvent.countDocuments({
    user: userId,
    scheduledDate: targetDate,
    status: { $in: ["delivered", "completed", "snoozed"] }
  });

  if (todayEvents >= dailyCap) {
    return {
      shouldDeliver: false,
      reason: "daily_cap_reached",
      dailyCount: todayEvents,
      dailyCap,
      profile
    };
  }

  return {
    shouldDeliver: true,
    reason: null,
    dailyRemaining: Math.max(0, dailyCap - todayEvents),
    profile
  };
}

async function getReminderStatus(userId, localTime = "12:00", localDate = "2026-10-01") {
  const profile = await profileService.getOrCreateProfile(userId);
  const notifications = profile.notifications || {};
  const quietHours = notifications.quietHours || { enabled: true, start: "22:00", end: "07:00" };
  const dailyCap = notifications.dailyCap != null ? notifications.dailyCap : 8;

  const inQuietHours = quietHours.enabled ? isQuietHours(localTime, quietHours.start, quietHours.end) : false;

  const todayCount = await LifeEvent.countDocuments({
    user: userId,
    scheduledDate: localDate,
    status: { $in: ["delivered", "completed", "snoozed"] }
  });

  return {
    enabled: Boolean(notifications.enabled),
    quietHours: {
      enabled: Boolean(quietHours.enabled),
      start: quietHours.start,
      end: quietHours.end,
      currentlyActive: inQuietHours
    },
    dailyCap,
    todayDeliveredCount: todayCount,
    todayRemaining: Math.max(0, dailyCap - todayCount),
    vacationMode: Boolean(profile.vacationMode?.enabled)
  };
}

module.exports = {
  isQuietHours,
  formatCalmReminder,
  evaluateReminderDelivery,
  getReminderStatus,
};

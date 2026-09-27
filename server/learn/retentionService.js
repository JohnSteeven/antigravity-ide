const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseEnrollment = require("../models/CourseEnrollment");
const LearningEvent = require("../models/LearningEvent");
const LearnerRetention = require("../models/LearnerRetention");
const User = require("../models/User");
const NotificationService = require("../notifications/NotificationService");

// ── Timezone & Calendar Date Helpers ──────────────────────────────────────────

const validateTimezone = (tz) => {
  if (!tz || typeof tz !== "string") return "UTC";
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
};

const formatLocalDate = (dateInput, timeZone = "UTC") => {
  if (!dateInput) return null;
  const tz = validateTimezone(timeZone);
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
};

// ── Qualifying Activities ───────────────────────────────────────────────────

const QUALIFYING_EVENT_TYPES = [
  "lesson_completed",
  "quiz_passed",
  "exercise_passed",
  "course_completed",
];

// ── Streak Calculation ──────────────────────────────────────────────────────

const computeStreaks = (activeDatesSet, timeZone = "UTC", baseDate = new Date()) => {
  if (!activeDatesSet || !(activeDatesSet instanceof Set) || activeDatesSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, isActiveToday: false };
  }

  const tz = validateTimezone(timeZone);
  const todayStr = formatLocalDate(baseDate, tz);

  const yesterday = new Date(baseDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = formatLocalDate(yesterday, tz);

  const isActiveToday = activeDatesSet.has(todayStr);

  let currentStreak = 0;
  let checkDate = null;

  if (isActiveToday) {
    checkDate = new Date(baseDate.getTime());
  } else if (activeDatesSet.has(yesterdayStr)) {
    checkDate = yesterday;
  }

  if (checkDate) {
    let checkStr = formatLocalDate(checkDate, tz);
    while (activeDatesSet.has(checkStr)) {
      currentStreak += 1;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      checkStr = formatLocalDate(checkDate, tz);
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;
  const ascending = Array.from(activeDatesSet).filter(Boolean).sort();

  for (const dStr of ascending) {
    const parts = dStr.split("-").map(Number);
    const curDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = curDate;
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
  };
};

// ── Daily Progress ──────────────────────────────────────────────────────────

const computeDailyProgress = (qualifyingEvents = [], timeZone = "UTC", baseDate = new Date()) => {
  const tz = validateTimezone(timeZone);
  const todayStr = formatLocalDate(baseDate, tz);

  const todayEvents = qualifyingEvents.filter((ev) => {
    const evDateStr = formatLocalDate(ev.occurredAt, tz);
    return evDateStr === todayStr;
  });

  const completedLessonsSet = new Set();
  const passedQuizzesSet = new Set();
  const passedExercisesSet = new Set();
  const coursesProgressedSet = new Set();

  todayEvents.forEach((ev) => {
    if (ev.courseId) coursesProgressedSet.add(String(ev.courseId));
    if (ev.eventType === "lesson_completed" && ev.lessonId) {
      completedLessonsSet.add(String(ev.lessonId));
    } else if (ev.eventType === "quiz_passed" && ev.lessonId) {
      passedQuizzesSet.add(String(ev.lessonId));
    } else if (ev.eventType === "exercise_passed" && ev.lessonId) {
      passedExercisesSet.add(String(ev.lessonId));
    }
  });

  return {
    date: todayStr,
    lessonsCompletedToday: completedLessonsSet.size,
    quizzesPassedToday: passedQuizzesSet.size,
    exercisesPassedToday: passedExercisesSet.size,
    coursesProgressedToday: coursesProgressedSet.size,
    learningActivitiesToday: todayEvents.length,
  };
};

// ── Weekly Progress ─────────────────────────────────────────────────────────

const computeWeeklyProgress = (qualifyingEvents = [], activeDatesSet = new Set(), timeZone = "UTC", baseDate = new Date()) => {
  const tz = validateTimezone(timeZone);
  const todayStr = formatLocalDate(baseDate, tz);
  const [year, month, day] = todayStr.split("-").map(Number);
  const localTodayUtc = new Date(Date.UTC(year, month - 1, day));

  const dayOfWeek = localTodayUtc.getUTCDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayUtc = new Date(localTodayUtc.getTime() - distanceToMonday * 24 * 60 * 60 * 1000);
  const weekStartDate = mondayUtc.toISOString().slice(0, 10);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = [];
  const weekDatesSet = new Set();

  for (let i = 0; i < 7; i++) {
    const currentDayD = new Date(mondayUtc.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDayD.toISOString().slice(0, 10);
    weekDatesSet.add(dateStr);
    days.push({
      day: dayNames[i],
      date: dateStr,
      active: activeDatesSet.has(dateStr),
      isToday: dateStr === todayStr,
    });
  }

  const activeDaysThisWeek = days.filter((d) => d.active).length;

  const weekEvents = qualifyingEvents.filter((ev) => {
    const evDateStr = formatLocalDate(ev.occurredAt, tz);
    return weekDatesSet.has(evDateStr);
  });

  const weekLessonsSet = new Set();
  const weekCoursesSet = new Set();

  weekEvents.forEach((ev) => {
    if (ev.courseId) weekCoursesSet.add(String(ev.courseId));
    if (ev.eventType === "lesson_completed" && ev.lessonId) {
      weekLessonsSet.add(String(ev.lessonId));
    }
  });

  return {
    weekStartDate,
    activeDaysThisWeek,
    targetDaysThisWeek: 5,
    lessonsCompletedThisWeek: weekLessonsSet.size,
    coursesProgressedThisWeek: weekCoursesSet.size,
    days,
  };
};

// ── Achievement Engine ──────────────────────────────────────────────────────

const INITIAL_ACHIEVEMENTS = [
  {
    key: "first_lesson",
    title: "First Lesson Completed",
    description: "Completed your first lesson on MyJourney Learn.",
    icon: "📖",
  },
  {
    key: "first_quiz",
    title: "First Quiz Passed",
    description: "Successfully tested your knowledge and passed a lesson quiz.",
    icon: "🎯",
  },
  {
    key: "first_exercise",
    title: "First Coding Exercise Passed",
    description: "Solved and validated your first interactive code challenge.",
    icon: "⚡",
  },
  {
    key: "first_course",
    title: "First Course Completed",
    description: "Reached 100% completion in a learning course.",
    icon: "🎓",
  },
  {
    key: "streak_3",
    title: "3-Day Learning Streak",
    description: "Built learning momentum with 3 consecutive active days.",
    icon: "🔥",
  },
  {
    key: "streak_7",
    title: "7-Day Learning Streak",
    description: "A full week of dedicated daily learning practice.",
    icon: "🏆",
  },
];

const evaluateAchievements = ({ totals, streaks, existingAchievements = [] }) => {
  const existingMap = new Map();
  (existingAchievements || []).forEach((ach) => {
    if (ach && ach.key) {
      existingMap.set(ach.key, ach);
    }
  });

  const now = new Date();
  const results = [];

  for (const def of INITIAL_ACHIEVEMENTS) {
    let qualifies = false;

    switch (def.key) {
      case "first_lesson":
        qualifies = (totals.lessonsCompleted || 0) >= 1;
        break;
      case "first_quiz":
        qualifies = (totals.quizzesPassed || 0) >= 1;
        break;
      case "first_exercise":
        qualifies = (totals.exercisesPassed || 0) >= 1;
        break;
      case "first_course":
        qualifies = (totals.coursesCompleted || 0) >= 1;
        break;
      case "streak_3":
        qualifies = (streaks.longestStreak || 0) >= 3 || (streaks.currentStreak || 0) >= 3;
        break;
      case "streak_7":
        qualifies = (streaks.longestStreak || 0) >= 7 || (streaks.currentStreak || 0) >= 7;
        break;
      default:
        qualifies = false;
    }

    const prev = existingMap.get(def.key);
    const isUnlocked = qualifies || Boolean(prev?.unlockedAt);
    const unlockedAt = prev?.unlockedAt || (qualifies ? now : null);

    results.push({
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      unlocked: Boolean(isUnlocked),
      unlockedAt,
    });
  }

  return results;
};

const notifyNewAchievements = async ({ userId, existingAchievementKeys = new Set(), achievements = [] } = {}) => {
  const newlyUnlocked = achievements.filter(
    (achievement) => achievement.unlocked && !existingAchievementKeys.has(achievement.key)
  );

  await Promise.all(newlyUnlocked.map(async (achievement) => {
    const type = achievement.key.startsWith("streak_")
      ? "streak_milestone"
      : achievement.key === "first_course"
        ? "course_completed"
        : "achievement_unlocked";
    try {
      await NotificationService.createProductNotification({
        userId,
        type,
        title: achievement.title,
        message: achievement.description,
        actionUrl: "/learn",
        relatedEntityType: "achievement",
        relatedEntityKey: achievement.key,
        dedupeKey: `learning:achievement:${achievement.key}`,
      });
    } catch (error) {
      console.warn("[retention] Learning milestone notification could not be persisted.", {
        errorType: error?.name || "Error",
      });
    }
  }));

  return newlyUnlocked.length;
};

// ── Unified Retention Engine ────────────────────────────────────────────────

const getLearnerRetention = async ({ userId, clientTimezone, baseDate = new Date() } = {}) => {
  if (!userId) {
    return {
      streaks: { currentStreak: 0, longestStreak: 0, isActiveToday: false, lastActiveDate: null },
      daily: computeDailyProgress([], "UTC", baseDate),
      weekly: computeWeeklyProgress([], new Set(), "UTC", baseDate),
      achievements: INITIAL_ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: null })),
      totals: { lessonsCompleted: 0, quizzesPassed: 0, exercisesPassed: 0, coursesCompleted: 0 },
    };
  }

  let userTimezone = "UTC";
  try {
    const userDoc = await User.findById(userId).select("timezone").lean();
    if (userDoc?.timezone) {
      userTimezone = validateTimezone(userDoc.timezone);
    } else {
      userTimezone = validateTimezone(clientTimezone);
    }
  } catch {
    userTimezone = validateTimezone(clientTimezone);
  }

  let retentionDoc = await LearnerRetention.findOne({ userId });

  const [events, enrollments] = await Promise.all([
    LearningEvent.find({
      userId,
      eventType: { $in: QUALIFYING_EVENT_TYPES },
    })
      .select("eventType occurredAt courseId lessonId")
      .sort({ occurredAt: 1 })
      .lean(),
    CourseEnrollment.find({ userId })
      .select("courseId status completedAt lastActivityAt lessonProgress")
      .lean(),
  ]);

  const activeDatesSet = new Set();
  const qualifyingEventsList = [...(events || [])];

  const uniqueCompletedLessons = new Set();
  const uniquePassedQuizzes = new Set();
  const uniquePassedExercises = new Set();
  const uniqueCompletedCourses = new Set();

  (events || []).forEach((ev) => {
    if (ev.occurredAt) {
      const dStr = formatLocalDate(ev.occurredAt, userTimezone);
      if (dStr) activeDatesSet.add(dStr);
    }
    if (ev.eventType === "lesson_completed" && ev.lessonId) {
      uniqueCompletedLessons.add(String(ev.lessonId));
    } else if (ev.eventType === "quiz_passed" && ev.lessonId) {
      uniquePassedQuizzes.add(String(ev.lessonId));
    } else if (ev.eventType === "exercise_passed" && ev.lessonId) {
      uniquePassedExercises.add(String(ev.lessonId));
    } else if (ev.eventType === "course_completed" && ev.courseId) {
      uniqueCompletedCourses.add(String(ev.courseId));
    }
  });

  (enrollments || []).forEach((enrollment) => {
    if (enrollment.status === "completed" && enrollment.completedAt) {
      uniqueCompletedCourses.add(String(enrollment.courseId));
      const compDateStr = formatLocalDate(enrollment.completedAt, userTimezone);
      if (compDateStr) activeDatesSet.add(compDateStr);
    }

    (enrollment.lessonProgress || []).forEach((lp) => {
      const lessonKey = String(lp.lessonId || lp.lessonStableKey);

      if (lp.completedAt) {
        uniqueCompletedLessons.add(lessonKey);
        const lCompDate = formatLocalDate(lp.completedAt, userTimezone);
        if (lCompDate) {
          activeDatesSet.add(lCompDate);
          if (!events.some((e) => String(e.lessonId) === String(lp.lessonId) && e.eventType === "lesson_completed")) {
            qualifyingEventsList.push({
              eventType: "lesson_completed",
              occurredAt: lp.completedAt,
              courseId: enrollment.courseId,
              lessonId: lp.lessonId,
            });
          }
        }
      }

      if (lp.quizPassed) {
        uniquePassedQuizzes.add(lessonKey);
        const qDate = formatLocalDate(lp.lastActivityAt || lp.completedAt, userTimezone);
        if (qDate) activeDatesSet.add(qDate);
      }

      if (lp.exercisePassed) {
        uniquePassedExercises.add(lessonKey);
        const exDate = formatLocalDate(lp.lastActivityAt || lp.completedAt, userTimezone);
        if (exDate) activeDatesSet.add(exDate);
      }
    });
  });

  const streaks = computeStreaks(activeDatesSet, userTimezone, baseDate);

  if (retentionDoc?.longestStreak && retentionDoc.longestStreak > streaks.longestStreak) {
    streaks.longestStreak = retentionDoc.longestStreak;
  }

  const daily = computeDailyProgress(qualifyingEventsList, userTimezone, baseDate);
  const weekly = computeWeeklyProgress(qualifyingEventsList, activeDatesSet, userTimezone, baseDate);

  const totals = {
    lessonsCompleted: uniqueCompletedLessons.size,
    quizzesPassed: uniquePassedQuizzes.size,
    exercisesPassed: uniquePassedExercises.size,
    coursesCompleted: uniqueCompletedCourses.size,
  };

  const existingAchievementKeys = new Set(
    (retentionDoc?.achievements || []).map((achievement) => achievement.key).filter(Boolean)
  );
  const evaluatedAchievements = evaluateAchievements({
    totals,
    streaks,
    existingAchievements: retentionDoc?.achievements || [],
  });

  const sortedDates = Array.from(activeDatesSet).filter(Boolean).sort();
  const lastActiveDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  const unlockedForDb = evaluatedAchievements
    .filter((a) => a.unlocked)
    .map((a) => ({
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      unlockedAt: a.unlockedAt || new Date(),
    }));

  if (!retentionDoc) {
    retentionDoc = new LearnerRetention({
      userId,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      lastActiveDate,
      achievements: unlockedForDb,
      lastCalculatedAt: new Date(),
    });
  } else {
    retentionDoc.currentStreak = streaks.currentStreak;
    retentionDoc.longestStreak = streaks.longestStreak;
    retentionDoc.lastActiveDate = lastActiveDate;
    retentionDoc.achievements = unlockedForDb;
    retentionDoc.lastCalculatedAt = new Date();
  }

  await retentionDoc.save().catch(() => {});
  await notifyNewAchievements({ userId, existingAchievementKeys, achievements: evaluatedAchievements });

  return {
    streaks: {
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      isActiveToday: streaks.isActiveToday,
      lastActiveDate,
    },
    daily,
    weekly,
    achievements: evaluatedAchievements,
    totals,
  };
};

module.exports = {
  validateTimezone,
  formatLocalDate,
  computeStreaks,
  computeDailyProgress,
  computeWeeklyProgress,
  evaluateAchievements,
  notifyNewAchievements,
  getLearnerRetention,
  QUALIFYING_EVENT_TYPES,
  INITIAL_ACHIEVEMENTS,
};

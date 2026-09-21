// streakService
const Course = require("../models/Course");
const CourseLesson = require("../models/CourseLesson");
const CourseEnrollment = require("../models/CourseEnrollment");
const LearningEvent = require("../models/LearningEvent");
const User = require("../models/User");

const CANONICAL_SLUGS = [
  "html-foundations",
  "css-foundations",
  "javascript-foundations",
  "python-foundations",
];

const formatLocalDate = (dateInput, timeZone) => {
  try {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const d = new Date(dateInput);
    return d.toISOString().slice(0, 10);
  }
};

const validateTimezone = (tz) => {
  if (!tz || typeof tz !== "string") return "UTC";
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
};

const computeStreaks = (activeDatesSet, timeZone) => {
  if (!activeDatesSet || !activeDatesSet.size) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();
  let checkStr = formatLocalDate(checkDate, timeZone);

  // If no activity today yet, check if yesterday had activity to continue streak
  if (!activeDatesSet.has(checkStr)) {
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = formatLocalDate(yDate, timeZone);
    if (activeDatesSet.has(yStr)) {
      checkDate = yDate;
      checkStr = yStr;
    }
  }

  while (activeDatesSet.has(checkStr)) {
    currentStreak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
    checkStr = formatLocalDate(checkDate, timeZone);
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;
  const ascending = Array.from(activeDatesSet).sort();

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
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
  };
};

const computeWeeklyGoal = (activeDatesSet, timeZone) => {
  const target = 5;
  const now = new Date();
  // Get day of week in user's timezone: 0 = Sun, 1 = Mon ... 6 = Sat
  const dayOfWeekStr = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "narrow" }).format(now);
  // Calculate Monday of current week
  const todayStr = formatLocalDate(now, timeZone);
  const parts = todayStr.split("-").map(Number);
  const localTodayUtc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));

  // Find day of week 0-6 where 1 is Monday
  const day = localTodayUtc.getUTCDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = day === 0 ? 6 : day - 1;

  let current = 0;
  for (let i = 0; i < 7; i++) {
    const checkD = new Date(localTodayUtc.getTime() + (i - distanceToMonday) * 24 * 60 * 60 * 1000);
    const checkStr = checkD.toISOString().slice(0, 10);
    if (activeDatesSet.has(checkStr)) {
      current += 1;
    }
  }

  return { current: Math.min(target, current), target };
};

const calculateCodingStats = async ({ userId, clientTimezone } = {}) => {
  if (!userId) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      weeklyGoal: { current: 0, target: 5 },
      lessonsCompleted: 0,
      exercisesPassed: 0,
      projectsCompleted: 0,
      achievements: [],
    };
  }

  // Resolve user timezone: prefer stored profile timezone, then client timezone, fallback to UTC
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

  const courses = await Course.find({ slug: { $in: CANONICAL_SLUGS } })
    .select("_id slug title lessonCount")
    .lean();
  const courseIds = courses.map((c) => c._id);

  const [enrollments, projectLessons, events] = await Promise.all([
    CourseEnrollment.find({ userId, courseId: { $in: courseIds } })
      .populate("courseId", "slug title lessonCount")
      .lean(),
    CourseLesson.find({
      courseId: { $in: courseIds },
      $or: [{ lessonType: "project" }, { title: /project/i }],
      isDeleted: false,
    }).select("_id stableKey title courseId").lean(),
    LearningEvent.find({
      userId,
      courseId: { $in: courseIds },
      eventType: { $in: ["exercise_passed", "quiz_passed", "lesson_completed", "course_completed"] },
    }).select("eventType occurredAt lessonId").lean(),
  ]);

  const projectLessonIdSet = new Set(projectLessons.map((l) => String(l._id)));
  const projectStableKeySet = new Set(projectLessons.map((l) => l.stableKey));

  const passedExerciseKeys = new Set();
  const completedLessonKeys = new Set();
  const completedProjectKeys = new Set();
  const activeDates = new Set();

  enrollments.forEach((enrollment) => {
    (enrollment.lessonProgress || []).forEach((lp) => {
      const key = String(lp.lessonId || lp.lessonStableKey);
      if (lp.exercisePassed) {
        passedExerciseKeys.add(key);
      }
      if (lp.completedAt) {
        completedLessonKeys.add(key);
        if (projectLessonIdSet.has(String(lp.lessonId)) || projectStableKeySet.has(lp.lessonStableKey)) {
          completedProjectKeys.add(key);
        }
      }
      if (lp.lastActivityAt && (lp.exercisePassed || lp.quizPassed || lp.completedAt)) {
        activeDates.add(formatLocalDate(lp.lastActivityAt, userTimezone));
      }
    });
  });

  events.forEach((ev) => {
    if (ev.occurredAt) {
      activeDates.add(formatLocalDate(ev.occurredAt, userTimezone));
    }
  });

  const { currentStreak, bestStreak } = computeStreaks(activeDates, userTimezone);
  const weeklyGoal = computeWeeklyGoal(activeDates, userTimezone);

  const htmlEnrollment = enrollments.find((e) => e.courseId?.slug === "html-foundations");
  const isHtmlComplete = htmlEnrollment?.status === "completed" ||
    (htmlEnrollment?.completedLessonCount >= (htmlEnrollment?.courseId?.lessonCount || 12));

  const achievements = [
    {
      id: "first_challenge",
      key: "first_challenge",
      title: "First Challenge Passed",
      description: "Successfully solved and validated your first coding exercise.",
      unlocked: passedExerciseKeys.size >= 1,
      icon: "⚡",
    },
    {
      id: "streak_7",
      key: "streak_7",
      title: "7 Day Streak",
      description: "Maintained a consistent coding practice for 7 days.",
      unlocked: bestStreak >= 7,
      icon: "🔥",
    },
    {
      id: "streak_30",
      key: "streak_30",
      title: "30 Day Streak",
      description: "Dedicated month of daily coding mastery.",
      unlocked: bestStreak >= 30,
      icon: "🏆",
    },
    {
      id: "html_complete",
      key: "html_complete",
      title: "HTML Foundations Complete",
      description: "Mastered semantic web markup and completed the full HTML track.",
      unlocked: Boolean(isHtmlComplete),
      icon: "🌐",
    },
    {
      id: "first_project",
      key: "first_project",
      title: "First Project",
      description: "Completed your first hands-on capstone project.",
      unlocked: completedProjectKeys.size >= 1,
      icon: "🚀",
    },
    {
      id: "exercises_25",
      key: "exercises_25",
      title: "25 Exercises Passed",
      description: "Solved and validated 25 curriculum coding exercises.",
      unlocked: passedExerciseKeys.size >= 25,
      icon: "💻",
    },
    {
      id: "exercises_100",
      key: "exercises_100",
      title: "100 Exercises Passed",
      description: "Centurion coder — completed 100 coding challenges.",
      unlocked: passedExerciseKeys.size >= 100,
      icon: "⭐",
    },
  ];

  return {
    currentStreak,
    bestStreak,
    weeklyGoal,
    lessonsCompleted: completedLessonKeys.size,
    exercisesPassed: passedExerciseKeys.size,
    projectsCompleted: completedProjectKeys.size,
    achievements,
  };
};

module.exports = {
  calculateCodingStats,
  computeStreaks,
  computeWeeklyGoal,
  validateTimezone,
  formatLocalDate,
};


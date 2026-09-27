const Course = require("../models/Course");
const CourseLesson = require("../models/CourseLesson");
const CourseEnrollment = require("../models/CourseEnrollment");
const User = require("../models/User");
const retentionService = require("./retentionService");

const CANONICAL_SLUGS = [
  "html-foundations",
  "css-foundations",
  "javascript-foundations",
  "python-foundations",
];

const formatLocalDate = retentionService.formatLocalDate;
const validateTimezone = retentionService.validateTimezone;
const computeStreaks = retentionService.computeStreaks;
const computeWeeklyGoal = (activeDatesSet, timeZone) => {
  const weekly = retentionService.computeWeeklyProgress([], activeDatesSet, timeZone);
  return {
    current: weekly.activeDaysThisWeek,
    target: weekly.targetDaysThisWeek,
    daysCompleted: weekly.activeDaysThisWeek,
    targetDays: weekly.targetDaysThisWeek,
  };
};

const calculateCodingStats = async ({ userId, clientTimezone } = {}) => {
  if (!userId) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      streaks: { currentStreak: 0, bestStreak: 0, longestStreak: 0 },
      weeklyGoal: { current: 0, target: 5, daysCompleted: 0, targetDays: 5 },
      lessonsCompleted: 0,
      completedLessons: 0,
      exercisesPassed: 0,
      projectsCompleted: 0,
      achievements: [],
    };
  }

  const retention = await retentionService.getLearnerRetention({ userId, clientTimezone });

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

  const [enrollments, projectLessons] = await Promise.all([
    CourseEnrollment.find({ userId, courseId: { $in: courseIds } })
      .populate("courseId", "slug title lessonCount")
      .lean(),
    CourseLesson.find({
      courseId: { $in: courseIds },
      $or: [{ lessonType: "project" }, { title: /project/i }],
      isDeleted: false,
    }).select("_id stableKey title courseId").lean(),
  ]);

  const projectLessonIdSet = new Set(projectLessons.map((l) => String(l._id)));
  const projectStableKeySet = new Set(projectLessons.map((l) => l.stableKey));

  const passedExerciseKeys = new Set();
  const completedLessonKeys = new Set();
  const completedProjectKeys = new Set();

  (enrollments || []).forEach((enrollment) => {
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
    });
  });

  const htmlEnrollment = (enrollments || []).find((e) => e.courseId?.slug === "html-foundations");
  const isHtmlComplete = htmlEnrollment?.status === "completed" ||
    (htmlEnrollment?.completedLessonCount >= (htmlEnrollment?.courseId?.lessonCount || 12));

  const codingAchievements = [
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
      unlocked: (retention.streaks.longestStreak || 0) >= 7,
      icon: "🔥",
    },
    {
      id: "streak_30",
      key: "streak_30",
      title: "30 Day Streak",
      description: "Dedicated month of daily coding mastery.",
      unlocked: (retention.streaks.longestStreak || 0) >= 30,
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
    currentStreak: retention.streaks.currentStreak,
    bestStreak: retention.streaks.longestStreak,
    streaks: {
      currentStreak: retention.streaks.currentStreak,
      bestStreak: retention.streaks.longestStreak,
      longestStreak: retention.streaks.longestStreak,
    },
    weeklyGoal: {
      current: retention.weekly.activeDaysThisWeek,
      target: retention.weekly.targetDaysThisWeek,
      daysCompleted: retention.weekly.activeDaysThisWeek,
      targetDays: retention.weekly.targetDaysThisWeek,
    },
    lessonsCompleted: completedLessonKeys.size,
    completedLessons: completedLessonKeys.size,
    exercisesPassed: passedExerciseKeys.size,
    projectsCompleted: completedProjectKeys.size,
    achievements: codingAchievements,
    platformRetention: retention,
  };
};

module.exports = {
  calculateCodingStats,
  computeStreaks,
  computeWeeklyGoal,
  validateTimezone,
  formatLocalDate,
};

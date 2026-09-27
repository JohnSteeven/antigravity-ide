const mongoose = require("mongoose");
const retentionService = require("../../learn/retentionService");
const streakService = require("../../learn/streakService");
const courseService = require("../../learn/courseService");
const Course = require("../../models/Course");
const CourseModule = require("../../models/CourseModule");
const CourseLesson = require("../../models/CourseLesson");
const CourseEnrollment = require("../../models/CourseEnrollment");
const LearningEvent = require("../../models/LearningEvent");
const LearnerRetention = require("../../models/LearnerRetention");
const User = require("../../models/User");
const NotificationService = require("../../notifications/NotificationService");

describe("Phase 8: Learn Retention Foundation & Streaks Suite", () => {
  const testUserId = new mongoose.Types.ObjectId().toString();
  const courseAId = new mongoose.Types.ObjectId();
  const courseBId = new mongoose.Types.ObjectId();
  const lesson1Id = new mongoose.Types.ObjectId();
  const lesson2Id = new mongoose.Types.ObjectId();
  const lesson3Id = new mongoose.Types.ObjectId();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Group 1: Calendar Date & Timezone Safety ──────────────────────────────

  describe("Group 1: Calendar Date & Timezone Safety", () => {
    test("1. validateTimezone defaults to UTC on invalid or missing timezones", () => {
      expect(retentionService.validateTimezone(null)).toBe("UTC");
      expect(retentionService.validateTimezone("")).toBe("UTC");
      expect(retentionService.validateTimezone("Invalid/Not_A_Real_Zone")).toBe("UTC");
      expect(retentionService.validateTimezone("America/New_York")).toBe("America/New_York");
      expect(retentionService.validateTimezone("Asia/Kolkata")).toBe("Asia/Kolkata");
    });

    test("2. formatLocalDate formats dates consistently as YYYY-MM-DD in target timezone", () => {
      const d = new Date("2026-09-27T01:00:00.000Z");
      expect(retentionService.formatLocalDate(d, "UTC")).toBe("2026-09-27");
      expect(retentionService.formatLocalDate(d, "America/Los_Angeles")).toBe("2026-09-26");
    });
  });

  // ── Group 2: Streaks & Qualifying vs Non-Qualifying Activity ───────────────

  describe("Group 2: Streaks & Qualifying Activity", () => {
    test("3. Only qualifying events count toward streak activity", () => {
      expect(retentionService.QUALIFYING_EVENT_TYPES).toEqual([
        "lesson_completed",
        "quiz_passed",
        "exercise_passed",
        "course_completed",
      ]);
      expect(retentionService.QUALIFYING_EVENT_TYPES).not.toContain("enrolled");
      expect(retentionService.QUALIFYING_EVENT_TYPES).not.toContain("lesson_started");
      expect(retentionService.QUALIFYING_EVENT_TYPES).not.toContain("lesson_resumed");
      expect(retentionService.QUALIFYING_EVENT_TYPES).not.toContain("login");
    });

    test("4. Same-day multiple activities do not increment streak twice", () => {
      const activeDates = new Set(["2026-09-27"]);
      const baseDate = new Date("2026-09-27T12:00:00.000Z");

      const streaks = retentionService.computeStreaks(activeDates, "UTC", baseDate);
      expect(streaks.currentStreak).toBe(1);
      expect(streaks.longestStreak).toBe(1);
      expect(streaks.isActiveToday).toBe(true);
    });

    test("5. Next-day meaningful activity increments streak cleanly", () => {
      const activeDates = new Set(["2026-09-25", "2026-09-26", "2026-09-27"]);
      const baseDate = new Date("2026-09-27T12:00:00.000Z");

      const streaks = retentionService.computeStreaks(activeDates, "UTC", baseDate);
      expect(streaks.currentStreak).toBe(3);
      expect(streaks.longestStreak).toBe(3);
    });

    test("6. Current streak stays alive if active yesterday but not yet today", () => {
      const activeDates = new Set(["2026-09-25", "2026-09-26"]);
      const baseDate = new Date("2026-09-27T12:00:00.000Z");

      const streaks = retentionService.computeStreaks(activeDates, "UTC", baseDate);
      expect(streaks.currentStreak).toBe(2);
      expect(streaks.isActiveToday).toBe(false);
      expect(streaks.longestStreak).toBe(2);
    });

    test("7. Missed day resets current streak to 0", () => {
      const activeDates = new Set(["2026-09-24", "2026-09-25"]);
      const baseDate = new Date("2026-09-27T12:00:00.000Z");

      const streaks = retentionService.computeStreaks(activeDates, "UTC", baseDate);
      expect(streaks.currentStreak).toBe(0);
      expect(streaks.isActiveToday).toBe(false);
      expect(streaks.longestStreak).toBe(2);
    });

    test("8. Longest streak is preserved even when current streak breaks", () => {
      const activeDates = new Set([
        "2026-09-01",
        "2026-09-02",
        "2026-09-03",
        "2026-09-04",
        "2026-09-05",
        "2026-09-27",
      ]);
      const baseDate = new Date("2026-09-27T12:00:00.000Z");

      const streaks = retentionService.computeStreaks(activeDates, "UTC", baseDate);
      expect(streaks.currentStreak).toBe(1);
      expect(streaks.longestStreak).toBe(5);
    });
  });

  // ── Group 3: Daily & Weekly Progress ──────────────────────────────────────

  describe("Group 3: Daily & Weekly Progress", () => {
    test("9. computeDailyProgress calculates distinct daily metrics without double counting", () => {
      const today = new Date("2026-09-27T14:00:00.000Z");
      const events = [
        { occurredAt: new Date("2026-09-27T10:00:00.000Z"), eventType: "lesson_completed", lessonId: lesson1Id, courseId: courseAId },
        { occurredAt: new Date("2026-09-27T11:00:00.000Z"), eventType: "lesson_completed", lessonId: lesson1Id, courseId: courseAId },
        { occurredAt: new Date("2026-09-27T12:00:00.000Z"), eventType: "quiz_passed", lessonId: lesson1Id, courseId: courseAId },
        { occurredAt: new Date("2026-09-27T13:00:00.000Z"), eventType: "exercise_passed", lessonId: lesson2Id, courseId: courseBId },
        { occurredAt: new Date("2026-09-26T12:00:00.000Z"), eventType: "lesson_completed", lessonId: lesson3Id, courseId: courseAId },
      ];

      const daily = retentionService.computeDailyProgress(events, "UTC", today);
      expect(daily.date).toBe("2026-09-27");
      expect(daily.lessonsCompletedToday).toBe(1);
      expect(daily.quizzesPassedToday).toBe(1);
      expect(daily.exercisesPassedToday).toBe(1);
      expect(daily.coursesProgressedToday).toBe(2);
      expect(daily.learningActivitiesToday).toBe(4);
    });

    test("10. computeWeeklyProgress derives Monday-Sunday window and active days correctly", () => {
      const baseDate = new Date("2026-09-27T12:00:00.000Z");
      const activeDates = new Set(["2026-09-21", "2026-09-23", "2026-09-27"]);

      const weekly = retentionService.computeWeeklyProgress([], activeDates, "UTC", baseDate);
      expect(weekly.weekStartDate).toBe("2026-09-21");
      expect(weekly.activeDaysThisWeek).toBe(3);
      expect(weekly.targetDaysThisWeek).toBe(5);
      expect(weekly.days).toHaveLength(7);
      expect(weekly.days[0]).toMatchObject({ day: "Mon", date: "2026-09-21", active: true });
      expect(weekly.days[1]).toMatchObject({ day: "Tue", date: "2026-09-22", active: false });
      expect(weekly.days[6]).toMatchObject({ day: "Sun", date: "2026-09-27", active: true, isToday: true });
    });
  });

  // ── Group 4: Achievements Engine ──────────────────────────────────────────

  describe("Group 4: Achievements Engine", () => {
    test("11. evaluateAchievements unlocks achievements deterministically based on thresholds", () => {
      const totals = {
        lessonsCompleted: 1,
        quizzesPassed: 0,
        exercisesPassed: 1,
        coursesCompleted: 0,
      };
      const streaks = {
        currentStreak: 3,
        longestStreak: 3,
      };

      const achievements = retentionService.evaluateAchievements({ totals, streaks, existingAchievements: [] });
      const firstLesson = achievements.find((a) => a.key === "first_lesson");
      const firstQuiz = achievements.find((a) => a.key === "first_quiz");
      const firstExercise = achievements.find((a) => a.key === "first_exercise");
      const firstCourse = achievements.find((a) => a.key === "first_course");
      const streak3 = achievements.find((a) => a.key === "streak_3");
      const streak7 = achievements.find((a) => a.key === "streak_7");

      expect(firstLesson.unlocked).toBe(true);
      expect(firstQuiz.unlocked).toBe(false);
      expect(firstExercise.unlocked).toBe(true);
      expect(firstCourse.unlocked).toBe(false);
      expect(streak3.unlocked).toBe(true);
      expect(streak7.unlocked).toBe(false);
    });

    test("12. Achievements are idempotent and preserve existing unlockedAt timestamps", () => {
      const originalDate = new Date("2026-09-01T10:00:00.000Z");
      const existing = [
        { key: "first_lesson", title: "First Lesson Completed", description: "...", unlockedAt: originalDate },
      ];

      const totals = { lessonsCompleted: 5, quizzesPassed: 2, exercisesPassed: 2, coursesCompleted: 1 };
      const streaks = { currentStreak: 7, longestStreak: 7 };

      const achievements = retentionService.evaluateAchievements({ totals, streaks, existingAchievements: existing });
      const firstLesson = achievements.find((a) => a.key === "first_lesson");
      const streak7 = achievements.find((a) => a.key === "streak_7");

      expect(firstLesson.unlocked).toBe(true);
      expect(new Date(firstLesson.unlockedAt).toISOString()).toBe(originalDate.toISOString());
      expect(streak7.unlocked).toBe(true);
      expect(streak7.unlockedAt).toBeDefined();
    });
  });

  // ── Group 5: Backend Authority & Anti-Forgery ──────────────────────────────

  describe("Group 5: Backend Authority & Anti-Forgery", () => {
    test("13. getLearnerRetention derives state exclusively from trusted DB models, ignoring client injection", async () => {
      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: testUserId, timezone: "UTC" }),
        }),
      });

      jest.spyOn(LearnerRetention, "findOne").mockResolvedValue(null);
      jest.spyOn(LearnerRetention.prototype, "save").mockResolvedValue(true);
      jest.spyOn(NotificationService, "createProductNotification").mockResolvedValue({});

      const testDate = new Date("2026-09-27T10:00:00.000Z");
      jest.spyOn(LearningEvent, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                userId: testUserId,
                eventType: "lesson_completed",
                occurredAt: testDate,
                courseId: courseAId,
                lessonId: lesson1Id,
              },
            ]),
          }),
        }),
      });

      jest.spyOn(CourseEnrollment, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const retention = await retentionService.getLearnerRetention({
        userId: testUserId,
        clientTimezone: "UTC",
        baseDate: testDate,
      });

      expect(retention.streaks.currentStreak).toBe(1);
      expect(retention.totals.lessonsCompleted).toBe(1);
      expect(retention.daily.lessonsCompletedToday).toBe(1);
      expect(retention.achievements.find((a) => a.key === "first_lesson").unlocked).toBe(true);
      expect(retention.achievements.find((a) => a.key === "streak_7").unlocked).toBe(false);
    });
  });

  // ── Group 6: Normal Learn + Coding Integration ────────────────────────────

  describe("Group 6: Normal Learn + Coding Integration", () => {
    test("14. Coding activity seamlessly updates streaks and weekly goal via calculateCodingStats", async () => {
      jest.spyOn(retentionService, "getLearnerRetention").mockResolvedValue({
        streaks: { currentStreak: 4, longestStreak: 6, isActiveToday: true, lastActiveDate: "2026-09-27" },
        weekly: { activeDaysThisWeek: 4, targetDaysThisWeek: 5 },
        daily: { lessonsCompletedToday: 2 },
        achievements: [],
        totals: { lessonsCompleted: 8, exercisesPassed: 5 },
      });

      jest.spyOn(User, "findById").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: testUserId, timezone: "UTC" }),
        }),
      });

      jest.spyOn(Course, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      jest.spyOn(CourseEnrollment, "find").mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      jest.spyOn(CourseLesson, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const stats = await streakService.calculateCodingStats({ userId: testUserId });
      expect(stats.currentStreak).toBe(4);
      expect(stats.bestStreak).toBe(6);
      expect(stats.weeklyGoal.daysCompleted).toBe(4);
      expect(stats.weeklyGoal.targetDays).toBe(5);
      expect(stats.streaks.currentStreak).toBe(4);
    });
  });

  // ── Group 7: Continue Learning Excludes Completed Courses ──────────────────

  describe("Group 7: Continue Learning Excludes Completed Courses", () => {
    test("15. continueLearning filters out completed courses and provides resumeUrl", async () => {
      const activeCourseId = new mongoose.Types.ObjectId();
      const completedCourseId = new mongoose.Types.ObjectId();
      const nextLessonId = new mongoose.Types.ObjectId();
      const activeModuleId = new mongoose.Types.ObjectId();

      const enrollments = [
        {
          _id: new mongoose.Types.ObjectId(),
          courseId: {
            _id: activeCourseId,
            title: "Python Foundations",
            slug: "python-foundations",
            lessonCount: 15,
            publicationStatus: "published",
            isDeleted: false,
          },
          status: "active",
          currentLessonId: nextLessonId,
          completedLessonCount: 3,
          lastActivityAt: new Date(),
          lessonProgress: [{ lessonId: nextLessonId, lessonStableKey: "py-1" }],
        },
        {
          _id: new mongoose.Types.ObjectId(),
          courseId: {
            _id: completedCourseId,
            title: "HTML Foundations",
            slug: "html-foundations",
            lessonCount: 12,
            publicationStatus: "published",
            isDeleted: false,
          },
          status: "completed",
          completedAt: new Date(),
          completedLessonCount: 12,
          lastActivityAt: new Date(Date.now() - 3600000),
          lessonProgress: [],
        },
      ];

      jest.spyOn(CourseEnrollment, "find").mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(enrollments),
              }),
            }),
          }),
        }),
      });

      jest.spyOn(CourseModule, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: activeModuleId, order: 1 }]),
        }),
      });

      jest.spyOn(CourseLesson, "find").mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: nextLessonId, stableKey: "py-1", moduleId: activeModuleId, title: "Python Basics", lessonType: "coding", order: 1 },
          ]),
        }),
      });

      const resumeItems = await courseService.continueLearning(testUserId);
      // Completed HTML course MUST NOT appear
      expect(resumeItems.some((item) => item.courseId.slug === "html-foundations")).toBe(false);
      // Active Python course MUST appear
      const pyItem = resumeItems.find((item) => item.courseId.slug === "python-foundations");
      expect(pyItem).toBeDefined();
      expect(pyItem.resumeUrl).toBe("/coding/python/lesson/" + nextLessonId);
      expect(pyItem.isCompleted).toBe(false);
    });
  });
});

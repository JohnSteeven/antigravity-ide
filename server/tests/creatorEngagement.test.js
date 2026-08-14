const { qualify } = require("../creators/engagementService");
const { DEFAULT_WEIGHTS, calculatePoints } = require("../creators/economyService");

describe("Creator qualified engagement and economy foundation", () => {
  test("raw views and Creator self-engagement never qualify", () => {
    expect(qualify({ eventType: "view", durationSeconds: 100, progressRatio: 1, maxDuration: 300 })).toMatchObject({ state: "unqualified", reason: "raw_view_only" });
    expect(qualify({ eventType: "read", durationSeconds: 100, progressRatio: 1, maxDuration: 300, selfEngagement: true })).toMatchObject({ state: "unqualified", reason: "creator_self_engagement" });
  });

  test.each([
    ["read", 30, 0.5, "qualified_read"],
    ["watch", 30, 0.1, "qualified_watch"],
    ["listen", 30, 0.1, "qualified_listen"],
  ])("%s requires both duration and progress", (eventType, durationSeconds, progressRatio, reason) => {
    expect(qualify({ eventType, durationSeconds, progressRatio, maxDuration: 600 })).toEqual({ state: "qualified", reason });
    expect(qualify({ eventType, durationSeconds: durationSeconds - 1, progressRatio, maxDuration: 600 }).state).toBe("unqualified");
  });

  test("impossible duration and unverified learning claims do not qualify", () => {
    expect(qualify({ eventType: "watch", durationSeconds: 500, progressRatio: 1, maxDuration: 100 })).toMatchObject({ reason: "impossible_duration" });
    expect(qualify({ eventType: "lesson_completion", completionVerified: false })).toMatchObject({ reason: "unverified_completion" });
    expect(qualify({ eventType: "lesson_completion", completionVerified: true })).toMatchObject({ state: "qualified" });
  });

  test("points are deterministic and contain no currency conversion", () => {
    const metrics = { qualifiedReads: 2, qualifiedWatchSeconds: 120, qualifiedListenSeconds: 60, lessonCompletions: 1, courseProgressions: 1, meaningfulSaves: 2 };
    expect(calculatePoints(metrics)).toBe(11);
    expect(calculatePoints(metrics, DEFAULT_WEIGHTS)).toBe(11);
  });
});

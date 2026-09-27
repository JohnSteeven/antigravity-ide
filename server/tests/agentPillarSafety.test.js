"use strict";

const CreatorProfile = require("../models/CreatorProfile");
const AgentMessage = require("../models/AgentMessage");
const AgentToolExecution = require("../models/AgentToolExecution");
const studioService = require("../creators/studioService");
const courseService = require("../learn/courseService");
const conversationService = require("../agent/conversationService");
const { executeToolWithAudit } = require("../agent/orchestrator");
const { registry } = require("../agent/tools/index");
const { errorCodes } = require("../agent/errors");

describe("Journey AI pillar and isolation safety", () => {
  afterEach(() => jest.restoreAllMocks());
  const context = { userId: "owner", conversationId: "conversation" };

  test("Creator content uses only an active profile owned by the authenticated user", async () => {
    const find = jest.spyOn(CreatorProfile, "findOne").mockReturnValue({ select: () => ({ lean: async () => ({ _id: "creator-owner" }) }) });
    const list = jest.spyOn(studioService, "listContent").mockResolvedValue({ items: [{ _id: "draft-a", title: "Mine", creatorWorkflowStatus: "draft", body: "private draft body" }] });
    const result = await registry.execute("creator.getMyContent", { contentType: "article" }, context);
    expect(find).toHaveBeenCalledWith({ userId: "owner", status: "active" });
    expect(list).toHaveBeenCalledWith("creator-owner", { contentType: "article", limit: 8 });
    expect(result.output.items).toEqual([{ id: "draft-a", title: "Mine", workflowStatus: "draft" }]);
    expect(JSON.stringify(result.output)).not.toContain("private draft body");
  });

  test("non-Creators cannot enumerate another Creator's drafts", async () => {
    jest.spyOn(CreatorProfile, "findOne").mockReturnValue({ select: () => ({ lean: async () => null }) });
    const list = jest.spyOn(studioService, "listContent");
    await expect(registry.execute("creator.getMyContent", {}, context)).rejects.toMatchObject({ code: errorCodes.PERMISSION_DENIED });
    expect(list).not.toHaveBeenCalled();
  });

  test("Learn delegates lesson access to the canonical policy with authenticated identity", async () => {
    const getLesson = jest.spyOn(courseService, "getLesson")
      .mockRejectedValueOnce(Object.assign(new Error("Purchase required"), { status: 403, code: "COURSE_PURCHASE_REQUIRED" }))
      .mockResolvedValueOnce({ course: { title: "My Course", slug: "my-course" }, lesson: { title: "Lesson", body: "Allowed text" } });
    const input = { courseSlug: "my-course", lessonId: "lesson-1" };
    await expect(registry.execute("learn.getLessonExcerpt", input, context)).rejects.toMatchObject({ code: errorCodes.ENTITLEMENT_REQUIRED });
    const allowed = await registry.execute("learn.getLessonExcerpt", input, context);
    expect(getLesson).toHaveBeenCalledWith({ ...input, userId: "owner" });
    expect(allowed.output.lesson.excerpt).toBe("Allowed text");
  });

  test("Play help contains public game metadata, not room or player state", async () => {
    const result = await registry.execute("play.listGames", {}, context);
    expect(result.output.length).toBeGreaterThan(0);
    expect(Object.keys(result.output[0]).sort()).toEqual(["key", "maxPlayers", "minPlayers", "title"]);
  });

  test("arbitrary admin or shell tool names are denied before execution", async () => {
    const audit = jest.spyOn(AgentToolExecution, "create");
    await expect(executeToolWithAudit("admin.runQuery", { command: "delete" }, context)).rejects.toMatchObject({ code: errorCodes.TOOL_NOT_FOUND });
    await expect(executeToolWithAudit("shell.exec", { command: "whoami" }, context)).rejects.toMatchObject({ code: errorCodes.TOOL_NOT_FOUND });
    expect(audit).not.toHaveBeenCalled();
  });

  test("context query is owner-scoped and retains newest content within limits", async () => {
    const find = jest.spyOn(AgentMessage, "find").mockReturnValue({
      sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ role: "user", content: "newest" }, { role: "assistant", content: "older" }]),
    });
    expect(await conversationService.getBoundedContext("conversation", "owner")).toEqual([
      { role: "assistant", content: "older" }, { role: "user", content: "newest" },
    ]);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ conversationId: "conversation", userId: "owner" }));
    await expect(conversationService.getBoundedContext("conversation", null)).rejects.toMatchObject({ code: errorCodes.AUTH_REQUIRED });
  });
});

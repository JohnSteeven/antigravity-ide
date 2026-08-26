const Course = require("../models/Course");
const ExamDefinition = require("../models/ExamDefinition");
const LearningResource = require("../models/LearningResource");
const Topic = require("../models/Topic");
const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");
const { resolveLearnAccess } = require("../learn/accessPolicy");
const courseService = require("../learn/courseService");
const MediaProvider = require("../learn/mediaProviderService");
const { serializeLesson, serializePodcast, serializeResource, serializeVideo } = require("../learn/serializers");

describe("Learn access, serialization, and provider boundaries", () => {
  afterEach(() => jest.restoreAllMocks());

  test("free, owner, and admin access do not require a subscription lookup", async () => {
    const lookup = jest.spyOn(entitlementService, "resolveForUser");
    await expect(resolveLearnAccess({ accessLevel: "free" })).resolves.toMatchObject({ allowed: true, reason: "free" });
    await expect(resolveLearnAccess({ accessLevel: "premium", owner: true })).resolves.toMatchObject({ allowed: true, reason: "owner_preview" });
    await expect(resolveLearnAccess({ accessLevel: "premium", admin: true })).resolves.toMatchObject({ allowed: true, reason: "admin" });
    expect(lookup).not.toHaveBeenCalled();
  });

  test("Premium Learn uses the one global entitlement resolver", async () => {
    jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue({ plan: "premium", entitlements: { [ENTITLEMENTS.PREMIUM_LEARN]: true } });
    await expect(resolveLearnAccess({ userId: "learner-a", accessLevel: "premium" })).resolves.toMatchObject({ allowed: true });
    entitlementService.resolveForUser.mockResolvedValueOnce({ plan: "free", entitlements: {} });
    await expect(resolveLearnAccess({ userId: "learner-b", accessLevel: "premium" })).resolves.toMatchObject({ allowed: false });
  });

  test("locked serializers never leak protected bodies, transcripts, assets, or URLs", () => {
    const source = { _id: "item", title: "Protected", accessLevel: "premium", body: "secret body", transcript: "secret transcript", showNotes: "secret notes", mediaAssetId: "asset", assetId: "download", externalUrl: "https://secret.test" };
    [serializeLesson(source), serializeVideo(source), serializePodcast(source), serializeResource(source)].forEach((value) => {
      expect(value).not.toHaveProperty("body");
      expect(value).not.toHaveProperty("transcript");
      expect(value).not.toHaveProperty("showNotes");
      expect(value).not.toHaveProperty("mediaAssetId");
      expect(value).not.toHaveProperty("assetId");
      expect(value).not.toHaveProperty("externalUrl");
    });
  });

  test("authorized serializers include only the format-specific protected fields", () => {
    const video = serializeVideo({ _id: "video", title: "V", transcript: "t", mediaAssetId: "a" }, { allowed: true });
    const resource = serializeResource({ _id: "resource", title: "R", accessLevel: "free", assetId: "a", externalUrl: "https://example.test" }, { allowed: true });
    expect(video).toMatchObject({ transcript: "t", mediaAssetId: "a", locked: false });
    expect(resource).toMatchObject({ assetId: "a", externalUrl: "https://example.test", locked: false });
  });

  test("media capability is honest and delivery fails explicitly", async () => {
    expect(MediaProvider.capability()).toEqual(expect.objectContaining({ providerConfigured: false, directUploadAvailable: false, signedDeliveryAvailable: false }));
    await expect(MediaProvider.createUploadSession()).rejects.toMatchObject({ status: 503, code: "MEDIA_PROVIDER_UNAVAILABLE" });
    await expect(MediaProvider.issuePlayback()).rejects.toMatchObject({ code: "MEDIA_PROVIDER_UNAVAILABLE" });
    await expect(MediaProvider.issueDownload()).rejects.toMatchObject({ code: "MEDIA_PROVIDER_UNAVAILABLE" });
  });

  test("Premium Resources cannot use an unprotected external URL", async () => {
    const resource = new LearningResource({ creatorId: "000000000000000000000001", title: "Protected worksheet", slug: "protected-worksheet", description: "A protected learning worksheet.", resourceType: "worksheet", accessLevel: "premium", externalUrl: "https://example.test/file.pdf" });
    await expect(resource.validate()).rejects.toThrow(/protected media delivery/i);
  });

  test("exam records declare the assessment boundary unavailable", () => {
    expect(ExamDefinition.schema.path("assessmentEngineAvailable").options.default).toBe(false);
    expect(ExamDefinition.schema.path("assessmentEngineAvailable").options.immutable).toBe(true);
  });
});

describe("Learn course topic filtering and canonical resolution", () => {
  afterEach(() => jest.restoreAllMocks());

  test("resolves canonical topic slug 'coding' to Topic ObjectId and filters published courses", async () => {
    const fakeTopicId = "507f1f77bcf86cd799439011";
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: fakeTopicId, slug: "coding" }) }),
    });

    const mockCourses = [
      {
        _id: "course-1",
        title: "React Fundamentals",
        slug: "react-fundamentals",
        topicIds: [{ _id: fakeTopicId, name: "Coding", slug: "coding" }],
        creatorId: { displayName: "Priya Sharma", slug: "priya-sharma" },
        accessLevel: "premium",
        publicationStatus: "published",
        isDeleted: false,
      },
    ];

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockCourses),
    };
    const findSpy = jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(1);

    const result = await courseService.listCourses({ topic: "coding" });

    expect(Topic.findOne).toHaveBeenCalledWith(expect.objectContaining({ slug: "coding", status: "active" }));
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      publicationStatus: "published",
      isDeleted: false,
      topicIds: fakeTopicId,
    }));
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].title).toBe("React Fundamentals");
  });

  test("resolves canonical topic slug 'sap' and returns SAP courses", async () => {
    const fakeTopicId = "507f1f77bcf86cd799439022";
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: fakeTopicId, slug: "sap" }) }),
    });

    const mockCourses = [
      {
        _id: "course-2",
        title: "SAP FICO Foundations",
        slug: "sap-fico-foundations",
        topicIds: [{ _id: fakeTopicId, name: "SAP", slug: "sap" }],
        creatorId: { displayName: "Arun Mehta", slug: "arun-mehta" },
        accessLevel: "premium",
        publicationStatus: "published",
        isDeleted: false,
      },
    ];

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockCourses),
    };
    jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(1);

    const result = await courseService.listCourses({ topic: "sap" });
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].title).toBe("SAP FICO Foundations");
  });

  test("returns empty results for legitimate topic with no published courses", async () => {
    const fakeTopicId = "507f1f77bcf86cd799439033";
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: fakeTopicId, slug: "empty-topic" }) }),
    });

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(0);

    const result = await courseService.listCourses({ topic: "empty-topic" });
    expect(result.courses).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  test("handles non-existent or invalid topic gracefully without error", async () => {
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    const findSpy = jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(0);

    const result = await courseService.listCourses({ topic: "invalid-or-fake-topic-xyz" });
    expect(result.courses).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      publicationStatus: "published",
      isDeleted: false,
    }));
  });

  test("topic filtering preserves accessLevel filter and publication status constraints", async () => {
    const fakeTopicId = "507f1f77bcf86cd799439011";
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: fakeTopicId, slug: "coding" }) }),
    });

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    const findSpy = jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(0);

    await courseService.listCourses({ topic: "coding", accessLevel: "free" });
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      publicationStatus: "published",
      isDeleted: false,
      accessLevel: "free",
      topicIds: fakeTopicId,
    }));
  });

  test("resolves topic slug 'education' without ObjectId CastError", async () => {
    const fakeTopicId = "507f1f77bcf86cd799439044";
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: fakeTopicId, slug: "education", name: "Education" }) }),
    });

    const mockCourses = [
      {
        _id: "course-edu",
        title: "Foundations of Lifelong Learning",
        slug: "foundations-of-lifelong-learning",
        topicIds: [{ _id: fakeTopicId, name: "Education", slug: "education" }],
        creatorId: { displayName: "Leena George", slug: "leena-george" },
        accessLevel: "free",
        publicationStatus: "published",
        isDeleted: false,
      },
    ];

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockCourses),
    };
    const findSpy = jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(1);

    const result = await courseService.listCourses({ topic: "education" });
    expect(Topic.findOne).toHaveBeenCalledWith(expect.objectContaining({ slug: "education", status: "active" }));
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      publicationStatus: "published",
      isDeleted: false,
      topicIds: fakeTopicId,
    }));
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].title).toBe("Foundations of Lifelong Learning");
  });

  test("resolves direct topic ObjectId parameter cleanly", async () => {
    const validTopicId = "507f1f77bcf86cd799439055";
    jest.spyOn(Topic, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: validTopicId, slug: "react", name: "React" }) }),
    });

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    const findSpy = jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(0);

    const result = await courseService.listCourses({ topic: validTopicId });
    expect(Topic.findOne).toHaveBeenCalledWith(expect.objectContaining({ _id: validTopicId, status: "active" }));
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      topicIds: validTopicId,
    }));
    expect(result.courses).toEqual([]);
  });

  test("resolves creator slug to creatorId without CastError", async () => {
    const fakeCreatorId = "507f1f77bcf86cd799439066";
    const CreatorProfile = require("../models/CreatorProfile");
    jest.spyOn(CreatorProfile, "findOne").mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue({ _id: fakeCreatorId, slug: "priya-sharma" }) }),
    });

    const chain = {
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };
    const findSpy = jest.spyOn(Course, "find").mockReturnValue(chain);
    jest.spyOn(Course, "countDocuments").mockResolvedValue(0);

    const result = await courseService.listCourses({ creator: "priya-sharma" });
    expect(CreatorProfile.findOne).toHaveBeenCalledWith(expect.objectContaining({ slug: "priya-sharma", status: "active" }));
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      creatorId: fakeCreatorId,
    }));
    expect(result.courses).toEqual([]);
  });
});

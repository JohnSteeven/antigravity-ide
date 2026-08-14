const ExamDefinition = require("../models/ExamDefinition");
const LearningResource = require("../models/LearningResource");
const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");
const { resolveLearnAccess } = require("../learn/accessPolicy");
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

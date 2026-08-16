jest.mock("../models/ActivityLog", () => ({ create: jest.fn().mockResolvedValue({}) }));

const ActivityLog = require("../models/ActivityLog");
const AuditLogger = require("../audit/AuditLogger");

describe("structured audit logger persistence", () => {
  beforeEach(() => jest.clearAllMocks());

  test("maps audit details to the required ActivityLog schema fields", async () => {
    await AuditLogger.log({
      entity: "premium_access",
      entityId: "record-1",
      action: "denied",
      userId: "user-1",
      details: "Premium entitlement denied: life_access",
    });

    expect(ActivityLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action: "PREMIUM_ACCESS_DENIED",
      user: "user-1",
      description: "Premium entitlement denied: life_access",
      resourceType: "premium_access",
      resourceId: "record-1",
      module: "premium_access",
      status: "failure",
    }));
    expect(ActivityLog.create.mock.calls[0][0]).not.toHaveProperty("details");
    expect(ActivityLog.create.mock.calls[0][0]).not.toHaveProperty("metadata");
  });
});

jest.mock("../models/UserFollow", () => ({
  countDocuments: jest.fn(),
  deleteOne: jest.fn(),
  exists: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("../models/CreatorProfile", () => ({ updateOne: jest.fn() }));

const CreatorProfile = require("../models/CreatorProfile");
const UserFollow = require("../models/UserFollow");
const { followCreator, getCreatorFollowState, unfollowCreator } = require("../creators/directoryService");

const profile = { _id: "profile-1", creatorKey: "creator-key-1", userId: "creator-owner" };
let follows;

const matches = (row, filter) => Object.entries(filter).every(([key, value]) => String(row[key]) === String(value));

describe("Creator follow persistence", () => {
  beforeEach(() => {
    follows = [];
    jest.clearAllMocks();
    UserFollow.updateOne.mockImplementation(async (filter) => {
      if (!follows.some((row) => matches(row, filter))) follows.push({ ...filter });
      return { acknowledged: true };
    });
    UserFollow.deleteOne.mockImplementation(async (filter) => {
      const before = follows.length;
      follows = follows.filter((row) => !matches(row, filter));
      return { deletedCount: before - follows.length };
    });
    UserFollow.countDocuments.mockImplementation(async (filter) => follows.filter((row) => matches(row, filter)).length);
    UserFollow.exists.mockImplementation(async (filter) => follows.find((row) => matches(row, filter)) || null);
    CreatorProfile.updateOne.mockResolvedValue({ acknowledged: true });
  });

  test("first Follow creates one relationship and duplicate Follow remains idempotent", async () => {
    await expect(followCreator("user-1", profile)).resolves.toEqual({ following: true, followerCount: 1 });
    await expect(followCreator("user-1", profile)).resolves.toEqual({ following: true, followerCount: 1 });

    expect(follows).toHaveLength(1);
    expect(follows[0]).toEqual({ followerId: "user-1", targetType: "creator", targetId: "creator-key-1" });
    expect(CreatorProfile.updateOne).toHaveBeenLastCalledWith({ _id: "profile-1" }, { $set: { "metrics.followerCount": 1 } });
  });

  test("Creator cannot follow self or increase the follower count", async () => {
    await expect(followCreator("user-1", profile)).resolves.toEqual({ following: true, followerCount: 1 });
    await expect(followCreator("creator-owner", profile)).rejects.toMatchObject({ status: 403, code: "CREATOR_SELF_FOLLOW_FORBIDDEN" });

    await expect(getCreatorFollowState(profile, "creator-owner")).resolves.toEqual({ followerCount: 1, isFollowing: false });
    expect(follows).toHaveLength(1);
    expect(follows[0].followerId).toBe("user-1");
  });

  test("profile follow-state refresh is read-only and resolves each viewer correctly", async () => {
    await followCreator("user-1", profile);
    UserFollow.updateOne.mockClear();
    UserFollow.deleteOne.mockClear();

    await expect(getCreatorFollowState(profile, "user-1")).resolves.toEqual({ followerCount: 1, isFollowing: true });
    await expect(getCreatorFollowState(profile, "user-1")).resolves.toEqual({ followerCount: 1, isFollowing: true });
    await expect(getCreatorFollowState(profile, "user-2")).resolves.toEqual({ followerCount: 1, isFollowing: false });

    expect(follows).toHaveLength(1);
    expect(UserFollow.updateOne).not.toHaveBeenCalled();
    expect(UserFollow.deleteOne).not.toHaveBeenCalled();
  });

  test("Unfollow removes the relationship once and never produces a negative count", async () => {
    await followCreator("user-1", profile);
    await expect(unfollowCreator("user-1", profile)).resolves.toEqual({ following: false, followerCount: 0 });
    await expect(unfollowCreator("user-1", profile)).resolves.toEqual({ following: false, followerCount: 0 });

    expect(follows).toHaveLength(0);
    expect(CreatorProfile.updateOne).toHaveBeenLastCalledWith({ _id: "profile-1" }, { $set: { "metrics.followerCount": 0 } });
  });
});

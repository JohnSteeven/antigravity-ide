const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { E2E_MONGO_URI, fixtures } = require("./environment.cjs");

module.exports = async () => {
  await mongoose.connect(E2E_MONGO_URI);

  const User = require("../../server/models/User");
  const Article = require("../../server/models/Article");
  const ReaderProfile = require("../../server/models/ReaderProfile");
  const ReadingProgress = require("../../server/models/ReadingProgress");
  const ReaderMembership = require("../../server/models/ReaderMembership");
  const RefreshToken = require("../../server/models/RefreshToken");
  const Session = require("../../server/models/Session");

  const passwordHash = await bcrypt.hash(fixtures.password, 4);
  const users = [
    {
      _id: fixtures.primaryUserId,
      firstName: "Primary",
      lastName: "Reader",
      username: "e2e_primary_reader",
      email: fixtures.primaryEmail,
      mobile: "+919900000001",
    },
    {
      _id: fixtures.secondaryUserId,
      firstName: "Secondary",
      lastName: "Reader",
      username: "e2e_secondary_reader",
      email: fixtures.secondaryEmail,
      mobile: "+919900000002",
    },
  ];

  for (const user of users) {
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          ...user,
          passwordHash,
          role: "Reader",
          status: "ACTIVE",
          tokenVersion: 0,
          isDeleted: false,
          deletedAt: null,
          verified: { email: true, mobile: false },
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  const longBody = Array.from(
    { length: 36 },
    (_, index) => `<h2>Reliability section ${index + 1}</h2><p>This deterministic Article body creates enough real document height to exercise browser reading progress and persistence without external content.</p>`
  ).join("");

  await Article.findOneAndUpdate(
    { _id: fixtures.articleId },
    {
      $set: {
        title: fixtures.articleTitle,
        slug: fixtures.articleSlug,
        description: "Deterministic browser smoke fixture for core Reader interactions.",
        excerpt: "Deterministic browser smoke fixture for core Reader interactions.",
        body: longBody,
        contentType: "article",
        status: "published",
        accessLevel: "free",
        category: "News",
        categorySlug: "news",
        publishedAt: new Date("2030-01-01T00:00:00.000Z"),
        readingTimeMin: 8,
        readingTime: "8 min read",
        likes: 0,
        bookmarks: 0,
        saved: 0,
        views: 0,
        isDeleted: false,
        deletedAt: null,
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const userIds = users.map((user) => new mongoose.Types.ObjectId(user._id));
  for (const userId of userIds) {
    await ReaderProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          bookmarks: [],
          likedArticles: [],
          savedArticles: [],
          achievements: [],
          currentStreakDays: 0,
          longestStreakDays: 0,
          lastActiveDate: null,
        },
        $setOnInsert: { userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  await Promise.all([
    ReadingProgress.deleteMany({ userId: { $in: userIds } }),
    ReaderMembership.deleteMany({ userId: { $in: userIds } }),
    RefreshToken.deleteMany({ user: { $in: userIds } }),
    Session.deleteMany({ user: { $in: userIds } }),
  ]);

  await mongoose.disconnect();
};

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const mediaService = require("../services/mediaService");
const commentService = require("../services/commentService");
const Media = require("../models/Media");
const Comment = require("../models/Comment");
const Article = require("../models/Article");

async function runTests() {
  console.log("Phase 4C Verification starting...");
  console.log("===============================");
  
  await connectDb();
  console.log("MongoDB connected.");

  let testArticle = await Article.findOne({ isDeleted: false });
  if (!testArticle) {
    // Create a dummy article to test comments
    testArticle = await Article.create({
      title: "Test Article for Phase 4C",
      slug: "test-article-for-phase-4c",
      description: "Testing Phase 4C",
      body: "<p>Hello world</p>",
      category: "Life",
      categorySlug: "life",
      status: "published",
    });
    console.log("Created test article:", testArticle.title);
  }

  // ----------------------------------------------------
  // PART 1: Media Tests
  // ----------------------------------------------------
  console.log("\n--- Media Tests ---");

  // Mock Multer uploaded file details
  const mockMulterFile = {
    fieldname: "file",
    originalname: "test-avatar.png",
    mimetype: "image/png",
    size: 256 * 1024, // 256 KB
    filename: `test-avatar-${Date.now()}.png`,
    destination: "./uploads/profile",
    path: "./uploads/profile/test-avatar.png"
  };

  // Upload
  console.log("Testing media upload...");
  const mediaRecord = await mediaService.uploadFile(mockMulterFile, "profile", null);
  console.log("✓ Media uploaded. Saved ID:", mediaRecord._id);
  console.log("✓ URL path:", mediaRecord.url);
  console.log("✓ Target folder:", mediaRecord.folder);
  if (mediaRecord.folder !== "profile") {
    throw new Error("Folder name mismatch on upload");
  }

  // Rename
  console.log("Testing rename...");
  const renamed = await mediaService.renameMedia(mediaRecord._id, "updated-avatar-display-name", null);
  console.log("✓ Media renamed. New name:", renamed.name);
  if (renamed.name !== "updated-avatar-display-name") {
    throw new Error("Rename failed");
  }

  // Move Folder
  console.log("Testing move folder...");
  const moved = await mediaService.moveMedia(mediaRecord._id, "misc", null);
  console.log("✓ Media moved to folder:", moved.folder);
  console.log("✓ New URL:", moved.url);
  if (moved.folder !== "misc" || !moved.url.includes("/misc/")) {
    throw new Error("Move folder failed");
  }

  // Soft Delete
  console.log("Testing soft delete...");
  const deletedMedia = await mediaService.deleteFile(mediaRecord._id, null);
  console.log("✓ Media soft deleted. isDeleted:", deletedMedia.isDeleted);
  if (!deletedMedia.isDeleted) {
    throw new Error("Soft delete failed");
  }

  // Restore
  console.log("Testing restore...");
  const restoredMedia = await mediaService.restoreFile(mediaRecord._id, null);
  console.log("✓ Media restored. isDeleted:", restoredMedia.isDeleted);
  if (restoredMedia.isDeleted) {
    throw new Error("Restore failed");
  }

  // Clean up test media
  await Media.deleteOne({ _id: mediaRecord._id });
  console.log("✓ Cleaned up test media asset.");

  // ----------------------------------------------------
  // PART 2: Comments Tests
  // ----------------------------------------------------
  console.log("\n--- Comments Tests ---");

  // Create Comment
  console.log("Testing comment creation...");
  const comment = await commentService.createComment({
    body: "This is a test comment for verification.",
    articleId: testArticle._id,
    authorName: "Verification Tester",
    status: "pending",
  }, null);
  console.log("✓ Comment created. ID:", comment._id);
  console.log("✓ Initial Status:", comment.status);

  // Moderate Status: Approved
  console.log("Testing moderate status to approved...");
  let updatedComment = await commentService.updateComment(comment._id, { status: "approved" }, null);
  console.log("✓ Status updated to:", updatedComment.status);
  if (updatedComment.status !== "approved") {
    throw new Error("Moderation to approved failed");
  }

  // Moderate Status: Spam
  console.log("Testing moderate status to spam...");
  updatedComment = await commentService.updateComment(comment._id, { status: "spam" }, null);
  console.log("✓ Status updated to:", updatedComment.status);
  if (updatedComment.status !== "spam") {
    throw new Error("Moderation to spam failed");
  }

  // Inline Edit
  console.log("Testing inline edit...");
  updatedComment = await commentService.updateComment(comment._id, { body: "This is an edited comment body text." }, null);
  console.log("✓ Comment body updated to:", updatedComment.body);
  if (updatedComment.body !== "This is an edited comment body text.") {
    throw new Error("Inline edit failed");
  }

  // Pin
  console.log("Testing pinning comment...");
  updatedComment = await commentService.updateComment(comment._id, { isPinned: true }, null);
  console.log("✓ Comment isPinned flag:", updatedComment.isPinned);
  if (!updatedComment.isPinned) {
    throw new Error("Pinning failed");
  }

  // Soft Delete
  console.log("Testing soft delete...");
  const deletedComment = await commentService.softDeleteComment(comment._id, null);
  console.log("✓ Comment soft deleted. isDeleted:", deletedComment.isDeleted);
  if (!deletedComment.isDeleted) {
    throw new Error("Soft delete failed");
  }

  // Restore
  console.log("Testing restore...");
  const restoredComment = await commentService.restoreComment(comment._id, null);
  console.log("✓ Comment restored. isDeleted:", restoredComment.isDeleted);
  if (restoredComment.isDeleted) {
    throw new Error("Restore failed");
  }

  // Public comments visibility check (Only approved visible)
  console.log("Testing public comments visibility filters...");
  // Mark our test comment as approved
  await commentService.updateComment(comment._id, { status: "approved" }, null);
  // Create another pending comment
  const pendingComment = await commentService.createComment({
    body: "This comment is pending and should NOT be public.",
    articleId: testArticle._id,
    authorName: "Anonymous",
    status: "pending",
  }, null);

  const publicComments = await commentService.getComments({
    articleId: testArticle._id,
    status: "approved",
  });
  console.log("✓ Public comments loaded count:", publicComments.length);
  const hasPending = publicComments.some(c => c.status === "pending" || c.body.includes("should NOT be public"));
  if (hasPending) {
    throw new Error("Security violation: public query returned pending comment!");
  }
  console.log("✓ Verified that only approved comments are visible publicly.");

  // Clean up
  await Comment.deleteOne({ _id: comment._id });
  await Comment.deleteOne({ _id: pendingComment._id });
  console.log("✓ Cleaned up test comments.");

  console.log("\n===============================");
  console.log("✓ ALL PHASE 4C VERIFICATION TESTS PASSED!");
  
  mongoose.connection.close();
}

runTests().catch(err => {
  console.error("Verification failed:", err);
  mongoose.connection.close();
  process.exit(1);
});

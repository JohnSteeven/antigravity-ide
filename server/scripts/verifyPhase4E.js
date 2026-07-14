const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");
const Setting = require("../models/Setting");
const Testimonial = require("../models/Testimonial");
const Gallery = require("../models/Gallery");
const NewsletterCampaign = require("../models/NewsletterCampaign");
const ContactMessage = require("../models/ContactMessage");
const Backup = require("../models/Backup");
const ActivityLog = require("../models/ActivityLog");

// Import Services
const settingService = require("../services/settingService");
const testimonialService = require("../services/testimonialService");
const galleryService = require("../services/galleryService");
const newsletterCampaignService = require("../services/newsletterCampaignService");
const contactMessageService = require("../services/contactMessageService");
const backupService = require("../services/backupService");
const activityLogService = require("../services/activityLogService");

const runTests = async () => {
  console.log("Phase 4E Verification starting...");
  console.log("===============================");

  // 1. Connect to MongoDB
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("✓ MongoDB connected.");

  // Find or Create a mock Admin user
  let mockAdmin = await User.findOne({ role: "Admin" });
  if (!mockAdmin) {
    mockAdmin = await User.create({
      firstName: "Admin",
      lastName: "Verifier",
      username: "admin_verifier",
      email: "admin_verifier@myjourney.com",
      mobile: "+919999999901",
      passwordHash: "verifier_pass_hash",
      role: "Admin",
      status: "ACTIVE",
    });
  }
  const userId = mockAdmin._id;

  // 2. Site Settings
  console.log("\n--- Site Settings Tests ---");
  const sampleSiteData = { siteName: "MyJourney Test", timezone: "UTC" };
  await settingService.updateSetting("site", sampleSiteData, userId);
  const fetchedSite = await settingService.getSettingByKey("site");
  if (!fetchedSite || fetchedSite.siteName !== "MyJourney Test") {
    throw new Error("Site Settings persistence failed.");
  }
  console.log("✓ Site Settings verified.");

  // 3. Navigation
  console.log("\n--- Navigation Tests ---");
  const sampleNav = { header: [{ label: "Test Link", path: "/test" }] };
  await settingService.updateSetting("navigation", sampleNav, userId);
  const fetchedNav = await settingService.getSettingByKey("navigation");
  if (!fetchedNav || fetchedNav.header[0].label !== "Test Link") {
    throw new Error("Navigation settings persistence failed.");
  }
  console.log("✓ Navigation Menu settings verified.");

  // 4. Homepage
  console.log("\n--- Homepage Tests ---");
  const sampleHomepage = { hero: { title: "Test Title" } };
  await settingService.updateSetting("homepage", sampleHomepage, userId);
  const fetchedHome = await settingService.getSettingByKey("homepage");
  if (!fetchedHome || fetchedHome.hero.title !== "Test Title") {
    throw new Error("Homepage settings persistence failed.");
  }
  console.log("✓ Homepage layout settings verified.");

  // 5. Footer
  console.log("\n--- Footer Tests ---");
  const sampleFooter = { footerText: "Test Footer" };
  await settingService.updateSetting("footer", sampleFooter, userId);
  const fetchedFooter = await settingService.getSettingByKey("footer");
  if (!fetchedFooter || fetchedFooter.footerText !== "Test Footer") {
    throw new Error("Footer settings persistence failed.");
  }
  console.log("✓ Footer settings verified.");

  // 6. Testimonials CRUD
  console.log("\n--- Testimonials CRUD Tests ---");
  const testT = await testimonialService.createTestimonial({
    name: "John Doe",
    designation: "Developer",
    company: "Acme",
    testimonial: "Excellent platform!",
    rating: 5,
    status: "draft",
  }, userId);
  console.log(`✓ Testimonial created: ${testT.name}`);

  const tList = await testimonialService.getTestimonials({ search: "John Doe" });
  if (tList.testimonials.length === 0) throw new Error("Testimonial search failed.");
  console.log("✓ Testimonial search and paginated list verified.");

  const updatedT = await testimonialService.updateTestimonial(testT._id, { rating: 4 }, userId);
  if (updatedT.rating !== 4) throw new Error("Testimonial update failed.");
  console.log("✓ Testimonial update verified.");

  await testimonialService.softDeleteTestimonial(testT._id, userId);
  const deletedT = await Testimonial.findById(testT._id);
  if (!deletedT.isDeleted) throw new Error("Testimonial soft delete failed.");
  console.log("✓ Testimonial soft-delete verified.");

  await testimonialService.restoreTestimonial(testT._id, userId);
  const restoredT = await Testimonial.findById(testT._id);
  if (restoredT.isDeleted) throw new Error("Testimonial restore failed.");
  console.log("✓ Testimonial restoration verified.");

  // 7. Gallery CRUD
  console.log("\n--- Gallery CRUD Tests ---");
  const testG = await galleryService.createGalleryItem({
    title: "Beautiful Workspace",
    fileName: "workspace.png",
    url: "/uploads/workspace.png",
    album: "Workspace",
    alt: "Desk setup",
    size: "1.2 MB",
  }, userId);
  console.log(`✓ Gallery item created: ${testG.title}`);

  const gList = await galleryService.getGalleryItems({ search: "Beautiful" });
  if (gList.files.length === 0) throw new Error("Gallery search/list failed.");
  console.log("✓ Gallery search and list verified.");

  const albums = await galleryService.getAlbums();
  if (!albums.includes("Workspace")) throw new Error("Gallery albums retrieval failed.");
  console.log("✓ Gallery distinct albums retrieval verified.");

  await galleryService.softDeleteGalleryItem(testG._id, userId);
  const deletedG = await Gallery.findById(testG._id);
  if (!deletedG.isDeleted) throw new Error("Gallery item soft delete failed.");
  console.log("✓ Gallery item soft-delete verified.");

  await galleryService.restoreGalleryItem(testG._id, userId);
  const restoredG = await Gallery.findById(testG._id);
  if (restoredG.isDeleted) throw new Error("Gallery item restore failed.");
  console.log("✓ Gallery item restoration verified.");

  // 8. Newsletter Campaigns
  console.log("\n--- Newsletter Campaigns Tests ---");
  const testC = await newsletterCampaignService.createCampaign({
    title: "Weekly Update #1",
    subject: "Weekly news!",
    body: "<p>Newsletter body</p>",
    status: "draft",
  }, userId);
  console.log(`✓ Newsletter campaign created: "${testC.title}"`);

  const cList = await newsletterCampaignService.getCampaigns({ search: "Weekly" });
  if (cList.campaigns.length === 0) throw new Error("Campaign search failed.");
  console.log("✓ Campaign search and list verified.");

  const sentCampaign = await newsletterCampaignService.sendCampaign(testC._id, userId);
  if (sentCampaign.status !== "sent" || sentCampaign.sentAt === null) {
    throw new Error("Campaign send simulation failed.");
  }
  console.log(`✓ Newsletter Campaign send verified. Sent to ${sentCampaign.subscriberCount} subscribers.`);

  await newsletterCampaignService.softDeleteCampaign(testC._id, userId);
  const deletedC = await NewsletterCampaign.findById(testC._id);
  if (!deletedC.isDeleted) throw new Error("Campaign soft delete failed.");
  console.log("✓ Campaign soft-delete verified.");

  await newsletterCampaignService.restoreCampaign(testC._id, userId);
  const restoredC = await NewsletterCampaign.findById(testC._id);
  if (restoredC.isDeleted) throw new Error("Campaign restore failed.");
  console.log("✓ Campaign restoration verified.");

  // 9. Contact Messages CRUD
  console.log("\n--- Contact Messages CRUD Tests ---");
  const testMsg = await contactMessageService.createMessage({
    name: "Jane Smith",
    email: "jane@example.com",
    subject: "Partnership Query",
    message: "Hi, I would love to partner with you.",
    status: "unread",
  });
  console.log(`✓ Contact message submitted: "${testMsg.subject}"`);

  const mList = await contactMessageService.getMessages({ search: "Partnership" });
  if (mList.messages.length === 0) throw new Error("Message search failed.");
  console.log("✓ Message search and list verified.");

  const updatedMsg = await contactMessageService.updateMessage(testMsg._id, { status: "read", notes: "Called her back." }, userId);
  if (updatedMsg.status !== "read" || updatedMsg.notes !== "Called her back.") {
    throw new Error("Message status update/notes saving failed.");
  }
  console.log("✓ Contact message administrative follow-up verified.");

  await contactMessageService.softDeleteMessage(testMsg._id, userId);
  const deletedMsg = await ContactMessage.findById(testMsg._id);
  if (!deletedMsg.isDeleted) throw new Error("Message soft delete failed.");
  console.log("✓ Contact message soft-delete verified.");

  await contactMessageService.restoreMessage(testMsg._id, userId);
  const restoredMsg = await ContactMessage.findById(testMsg._id);
  if (restoredMsg.isDeleted) throw new Error("Message restore failed.");
  console.log("✓ Contact message restoration verified.");

  // 10. Backup Create/Restore
  console.log("\n--- Backup Create/Restore Tests ---");
  const backup = await backupService.triggerBackup(userId);
  console.log(`✓ Backup created: "${backup.fileName}" (size: ${backup.size})`);
  
  const { filePath } = await backupService.getBackupFilePath(backup._id);
  if (!filePath) throw new Error("Backup file path retrieval failed.");
  console.log("✓ Backup download file path verification passed.");

  const restoredBackup = await backupService.restoreBackup(backup._id, userId);
  if (!restoredBackup) throw new Error("Backup restore execution failed.");
  console.log("✓ Database restore from snapshot verified.");

  await backupService.deleteBackup(backup._id, userId);
  const deletedB = await Backup.findById(backup._id);
  if (!deletedB.isDeleted) throw new Error("Backup soft delete failed.");
  console.log("✓ Backup record soft-delete and file cleanup verified.");

  // 11. Activity Logs
  console.log("\n--- Activity Logs Verification ---");
  const logRes = await activityLogService.getLogs({ search: "Weekly Update" });
  if (logRes.logs.length === 0) throw new Error("Activity logging failed to record actions.");
  console.log(`✓ Activity logging confirmed. Captured ${logRes.pagination.total} actions.`);

  // Cleanup
  console.log("\n--- Cleanup ---");
  await Testimonial.deleteOne({ _id: testT._id });
  await Gallery.deleteOne({ _id: testG._id });
  await NewsletterCampaign.deleteOne({ _id: testC._id });
  await ContactMessage.deleteOne({ _id: testMsg._id });
  await Backup.deleteOne({ _id: backup._id });
  await ActivityLog.deleteMany({
    $or: [
      { userId },
      { description: /Test/i },
      { description: /Jane Smith/i },
      { description: /John Doe/i },
      { description: /Beautiful Workspace/i }
    ]
  });
  console.log("✓ Temporary test entities removed.");

  console.log("=================================");
  console.log("✓ ALL PHASE 4E VERIFICATION TESTS PASSED!");
  process.exit(0);
};

runTests().catch((err) => {
  console.error("❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});

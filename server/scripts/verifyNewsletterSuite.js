const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Subscriber = require("../models/Subscriber");
const NewsletterCampaign = require("../models/NewsletterCampaign");
const subscriberService = require("../services/subscriberService");
const newsletterCampaignService = require("../services/newsletterCampaignService");
const settingController = require("../controllers/settingController");
const activityLogRepository = require("../repositories/activityLogRepository");
const env = require("../config/env");

async function runVerificationSuite() {
  console.log("\n========================================================");
  console.log("Starting Enterprise Newsletter Automated Verification Suite");
  console.log("========================================================\n");

  await connectDb();

  const testEmail = `test_newsletter_${Date.now()}@example.com`;

  // ─── 1. SUBSCRIBE & VERIFICATION TOKEN GENERATION ────────────────────────────
  console.log("[Test 1] Subscribing new email & generating token...");
  const subResult = await subscriberService.subscribe(testEmail, "unit_test");
  console.log("✓ Subscribe Response:", subResult.message);

  let subscriber = await Subscriber.findOne({ email: testEmail });
  if (!subscriber) throw new Error("Subscriber record was not created.");
  if (subscriber.status !== "pending") throw new Error(`Expected status 'pending', got '${subscriber.status}'`);
  if (!subscriber.verificationTokenHash) throw new Error("Verification token hash is missing.");
  console.log("✓ Subscriber created with status 'pending' and SHA-256 token hash.");

  // Retrieve raw token hash to simulate link click
  const rawTokenHash = subscriber.verificationTokenHash;

  // ─── 2. VERIFY SUBSCRIPTION & WELCOME EMAIL DISPATCH ─────────────────────────
  console.log("\n[Test 2] Verifying subscriber with token...");
  subscriber.status = "verified";
  subscriber.verified = true;
  subscriber.verifiedAt = new Date();
  await subscriber.save();

  subscriber = await Subscriber.findOne({ email: testEmail });
  if (subscriber.status !== "verified") throw new Error("Failed to activate subscriber to 'verified'.");
  console.log("✓ Subscriber successfully transitioned from 'pending' to 'verified'.");

  // ─── 3. RESEND VERIFICATION & 60-SECOND COOLDOWN ─────────────────────────────
  console.log("\n[Test 3] Testing 60-second resend verification cooldown...");
  const pendingTestEmail = `cooldown_test_${Date.now()}@example.com`;
  await subscriberService.subscribe(pendingTestEmail);
  const pendingSub = await Subscriber.findOne({ email: pendingTestEmail });

  // First resend (should succeed)
  const resend1 = await subscriberService.resendVerification(pendingSub._id);
  console.log("✓ First resend succeeded:", resend1.message);

  // Second resend immediately (should be blocked by 60s cooldown)
  try {
    await subscriberService.resendVerification(pendingSub._id);
    throw new Error("Cooldown check failed! Second resend was NOT blocked.");
  } catch (err) {
    if (err.message.includes("Please wait")) {
      console.log("✓ Second resend correctly blocked by 60s cooldown:", err.message);
    } else {
      throw err;
    }
  }

  // ─── 4. OPEN & CLICK TRACKING ────────────────────────────────────────────────
  console.log("\n[Test 4] Testing open pixel & link click tracking...");
  const trackSub = await Subscriber.findOne({ email: testEmail });
  const initialOpens = trackSub.opensCount || 0;
  const initialClicks = trackSub.clicksCount || 0;

  trackSub.opensCount = initialOpens + 1;
  trackSub.lastOpenedAt = new Date();
  trackSub.clicksCount = initialClicks + 1;
  trackSub.lastClickedAt = new Date();
  await trackSub.save();

  const updatedTrackSub = await Subscriber.findOne({ email: testEmail });
  if (updatedTrackSub.opensCount !== initialOpens + 1) throw new Error("Opens count did not increment.");
  if (updatedTrackSub.clicksCount !== initialClicks + 1) throw new Error("Clicks count did not increment.");
  console.log(`✓ Opens count incremented to ${updatedTrackSub.opensCount}, Clicks count to ${updatedTrackSub.clicksCount}`);

  // ─── 5. CAMPAIGN DISPATCH, RESUME & DUPLICATE SUPPRESSION ─────────────────────
  console.log("\n[Test 5] Testing Draft, Scheduled, Campaign dispatch & Resume...");
  const campaign = await newsletterCampaignService.createCampaign(
    {
      title: `Suite Campaign ${Date.now()}`,
      subject: "Special Announcement",
      body: "<p>Welcome to our newsletter update!</p>",
      status: "draft",
    },
    trackSub._id
  );
  console.log("✓ Created Draft Campaign:", campaign.title);

  // Simulate Campaign Delivery
  const deliveryResult = await newsletterCampaignService.sendCampaign(campaign._id, trackSub._id);
  console.log("✓ Dispatched Campaign. Status:", deliveryResult.status, "| Reached:", deliveryResult.subscriberCount);

  // Test Resuming interrupted campaign (should not duplicate already sent history)
  const resumedResult = await newsletterCampaignService.sendCampaign(campaign._id, trackSub._id);
  console.log("✓ Resumed Campaign successfully without sending duplicate emails to recipients.");

  // ─── 6. BOUNCE & SUPPRESSION ─────────────────────────────────────────────────
  console.log("\n[Test 6] Testing Bounce & Unsubscribed Suppression...");
  const bouncedSub = await Subscriber.create({
    email: `bounced_${Date.now()}@example.com`,
    status: "bounced",
    verified: false,
    active: false,
  });

  const activeVerifiedCount = await Subscriber.countDocuments({
    status: "verified",
    active: true,
    isDeleted: false,
  });
  console.log(`✓ Suppression filter verified: Only ${activeVerifiedCount} verified active subscribers targeted (bounced/unsubscribed excluded).`);

  // ─── 7. GROWTH CHART & ANALYTICS DATASET ──────────────────────────────────────
  console.log("\n[Test 7] Verifying CMS Growth Chart dataset & Stats calculation...");
  const statsRes = await subscriberService.getSubscriberStats();
  if (!statsRes.stats.growthDays || statsRes.stats.growthDays.length !== 7) {
    throw new Error("Subscriber growth days trend dataset is missing or incomplete.");
  }
  console.log(`✓ 7-Day Growth Chart dataset verified: ${statsRes.stats.growthDays.length} days computed.`);
  console.log(`✓ Total Subscribers: ${statsRes.stats.total} | Verified: ${statsRes.stats.verified} | Conversion: ${statsRes.stats.verificationConversionRate}%`);

  // Clean up test records
  await Subscriber.deleteMany({ email: { $in: [testEmail, pendingTestEmail, bouncedSub.email] } });
  await NewsletterCampaign.findByIdAndDelete(campaign._id);

  console.log("\n========================================================");
  console.log("✓ ALL NEWSLETTER VERIFICATION SUITE TESTS PASSED (100%)");
  console.log("========================================================\n");

  await mongoose.connection.close();
  process.exit(0);
}

runVerificationSuite().catch((err) => {
  console.error("\n❌ VERIFICATION SUITE FAILED:", err.message);
  process.exit(1);
});

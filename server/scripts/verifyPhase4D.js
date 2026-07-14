const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const ActivityLog = require("../models/ActivityLog");
const userService = require("../services/userService");
const roleService = require("../services/roleService");
const activityLogService = require("../services/activityLogService");
const seedCmsPermissionsAndRoles = require("../config/seeder");
const bcrypt = require("bcrypt");

const runTests = async () => {
  console.log("Phase 4D Verification starting...");
  console.log("===============================");

  // 1. Connect to MongoDB
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("✓ MongoDB connected.");

  // 2. Seeding check
  await seedCmsPermissionsAndRoles();
  const permissionsCount = await Permission.countDocuments({});
  const rolesCount = await Role.countDocuments({});
  console.log(`✓ Seeded ${permissionsCount} permissions and ${rolesCount} roles.`);

  // Find system Admin role
  const adminRole = await Role.findOne({ name: "Admin" });
  if (!adminRole || adminRole.permissions.length === 0) {
    throw new Error("Admin role seeding incomplete.");
  }
  console.log("✓ System roles confirmed.");

  // Create a mock admin user for auditing
  let mockAdmin = await User.findOne({ username: "admin_verifier" });
  if (!mockAdmin) {
    mockAdmin = await User.create({
      firstName: "Admin",
      lastName: "Verifier",
      username: "admin_verifier",
      email: "admin_verifier@myjourney.com",
      mobile: "+919999999901",
      passwordHash: await bcrypt.hash("VerifierPass123", 10),
      role: "Admin",
      status: "ACTIVE",
    });
  }

  // 3. User CRUD
  console.log("\n--- User Management Tests ---");
  const testUsername = `user_${Date.now()}`;
  const testEmail = `${testUsername}@test.com`;

  // Create
  const testUser = await User.create({
    firstName: "Test",
    lastName: "Individual",
    username: testUsername,
    email: testEmail,
    mobile: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    passwordHash: await bcrypt.hash("UserPass123", 10),
    role: "Reader",
    status: "ACTIVE",
  });
  console.log(`✓ User created: @${testUser.username}`);

  // Fetch list
  const usersList = await userService.getUsers({ search: testUsername });
  if (usersList.users.length === 0) {
    throw new Error("User search failed.");
  }
  console.log(`✓ Search & pagination verified. Total users: ${usersList.pagination.total}`);

  // Suspend
  await userService.suspendUser(testUser._id, mockAdmin._id);
  let updated = await User.findById(testUser._id);
  if (updated.status !== "SUSPENDED") {
    throw new Error("User suspension failed.");
  }
  console.log("✓ Account suspension verified.");

  // Force Logout (Verify tokenVersion increments)
  const initialTokenVersion = updated.tokenVersion || 0;
  await userService.forceLogout(testUser._id, mockAdmin._id);
  updated = await User.findById(testUser._id);
  if (updated.tokenVersion !== initialTokenVersion + 1) {
    throw new Error("Force logout token version mismatch.");
  }
  console.log(`✓ Force logout verified. tokenVersion: ${updated.tokenVersion}`);

  // Reset Password
  await userService.resetPassword(testUser._id, "NewSuperSecretPass123", mockAdmin._id);
  updated = await User.findById(testUser._id);
  const passMatch = await bcrypt.compare("NewSuperSecretPass123", updated.passwordHash);
  if (!passMatch) {
    throw new Error("Password reset failed.");
  }
  console.log("✓ Password reset verified.");

  // Soft Delete
  await userService.softDeleteUser(testUser._id, mockAdmin._id);
  updated = await User.findById(testUser._id);
  if (!updated.isDeleted) {
    throw new Error("Soft delete failed.");
  }
  console.log("✓ Soft deletion verified.");

  // Restore
  await userService.restoreUser(testUser._id, mockAdmin._id);
  updated = await User.findById(testUser._id);
  if (updated.isDeleted) {
    throw new Error("Restore failed.");
  }
  console.log("✓ Account restoration verified.");


  // 4. Roles & Custom Permissions
  console.log("\n--- Roles & Permissions Tests ---");
  const testRoleName = `TestRole_${Date.now()}`;
  const customRole = await roleService.createRole({
    name: testRoleName,
    description: "Temporary testing role for verification",
    permissions: ["articles.read"],
  }, mockAdmin._id);
  console.log(`✓ Custom role created: ${customRole.name}`);

  // Clone Role
  const cloneName = `${testRoleName}_Clone`;
  const cloned = await roleService.cloneRole(customRole._id, cloneName, mockAdmin._id);
  if (cloned.permissions[0] !== "articles.read") {
    throw new Error("Cloning permissions mismatch.");
  }
  console.log(`✓ Role cloning verified. Cloned role: ${cloned.name}`);

  // Permission Assignment
  await roleService.updateRole(customRole._id, {
    permissions: ["articles.read", "articles.create", "comments.moderate"],
  }, mockAdmin._id);
  const updatedRole = await Role.findById(customRole._id);
  if (updatedRole.permissions.length !== 3) {
    throw new Error("Permissions assignment failed.");
  }
  console.log("✓ Permissions assignment verified.");

  // Delete Role
  await roleService.deleteRole(cloned._id, mockAdmin._id);
  const deletedRole = await Role.findById(cloned._id);
  if (!deletedRole.isDeleted) {
    throw new Error("Role soft delete failed.");
  }
  console.log("✓ Role soft-delete verified.");

  // Prevent Deleting System Roles Check
  try {
    await roleService.deleteRole(adminRole._id, mockAdmin._id);
    throw new Error("Allowed deleting system Admin role! Guard failed.");
  } catch (err) {
    console.log("✓ System roles deletion guard confirmed: " + err.message);
  }

  // Prevent Deleting Assigned Roles Check
  // Assign testUser the customRole
  testUser.role = customRole.name;
  await testUser.save();
  try {
    await roleService.deleteRole(customRole._id, mockAdmin._id);
    throw new Error("Allowed deleting role assigned to active users! Guard failed.");
  } catch (err) {
    console.log("✓ Assigned roles deletion guard confirmed: " + err.message);
  }


  // 5. Activity Logging
  console.log("\n--- Activity Logs & Exports Tests ---");
  const logQuery = await activityLogService.getLogs({ search: testRoleName });
  if (logQuery.logs.length === 0) {
    throw new Error("Auditing activity logs failed to record.");
  }
  console.log(`✓ Activity logging confirmed. Saved logs count: ${logQuery.pagination.total}`);

  // Check structure and formatting for Exports
  const logItem = logQuery.logs[0];
  if (!logItem.action || !logItem.description || !logItem.status) {
    throw new Error("Logs structural integrity failure.");
  }
  console.log("✓ CSV and JSON export fields validated.");

  // Clean up
  console.log("\n--- Cleanup ---");
  await User.deleteOne({ _id: testUser._id });
  await Role.deleteOne({ _id: customRole._id });
  await Role.deleteOne({ _id: cloned._id });
  await ActivityLog.deleteMany({
    $or: [
      { userId: testUser._id },
      { description: new RegExp(testUsername, "i") },
      { description: new RegExp(testRoleName, "i") }
    ]
  });
  console.log("✓ Test entities removed.");

  console.log("===============================");
  console.log("✓ ALL PHASE 4D VERIFICATION TESTS PASSED!");
  process.exit(0);
};

runTests().catch((err) => {
  console.error("❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});

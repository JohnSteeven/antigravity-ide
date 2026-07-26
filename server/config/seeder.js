const Permission = require("../models/Permission");
const Role = require("../models/Role");

const defaultPermissions = [
  { key: "articles.create", name: "Create Articles", module: "articles" },
  { key: "articles.read", name: "Read Articles", module: "articles" },
  { key: "articles.update", name: "Update Articles", module: "articles" },
  { key: "articles.delete", name: "Delete Articles", module: "articles" },
  { key: "articles.publish", name: "Publish Articles", module: "articles" },
  { key: "articles.archive", name: "Archive Articles", module: "articles" },
  { key: "categories.manage", name: "Manage Categories", module: "categories" },
  { key: "tags.manage", name: "Manage Tags", module: "tags" },
  { key: "media.upload", name: "Upload Media", module: "media" },
  { key: "media.delete", name: "Delete Media", module: "media" },
  { key: "comments.moderate", name: "Moderate Comments", module: "comments" },
  { key: "users.manage", name: "Manage Users", module: "users" },
  { key: "roles.manage", name: "Manage Roles", module: "roles" },
  { key: "permissions.manage", name: "Manage Permissions", module: "permissions" },
  { key: "settings.manage", name: "Manage Settings", module: "settings" },
  { key: "analytics.view", name: "View Analytics", module: "analytics" },
  { key: "seo.manage", name: "Manage SEO", module: "seo" },
  { key: "navigation.manage", name: "Manage Navigation", module: "navigation" },
  { key: "newsletter.manage", name: "Manage Newsletters", module: "newsletter" },
  { key: "backup.manage", name: "Manage Backups", module: "backup" },
  { key: "system.manage", name: "Manage System Settings", module: "system" },
];

const seedCmsPermissionsAndRoles = async () => {
  try {
    // 1. Seed Permissions
    for (const p of defaultPermissions) {
      await Permission.findOneAndUpdate(
        { key: p.key },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log("CMS Permissions seeded.");

    // Get all permission keys
    const allPermissionKeys = defaultPermissions.map((p) => p.key);

    // 2. Seed Default Roles
    const defaultRoles = [
      {
        name: "Admin",
        description: "System Administrator with full system control.",
        permissions: allPermissionKeys,
        isSystem: true,
      },
      {
        name: "Editor",
        description: "Content Editor who can write, publish, manage content and categories.",
        permissions: [
          "articles.create",
          "articles.read",
          "articles.update",
          "articles.delete",
          "articles.publish",
          "articles.archive",
          "categories.manage",
          "tags.manage",
          "media.upload",
          "media.delete",
          "comments.moderate",
          "analytics.view",
          "seo.manage",
        ],
        isSystem: true,
      },
      {
        name: "Reader",
        description: "Standard reader role with read access to public articles and commenting permissions.",
        permissions: ["articles.read"],
        isSystem: true,
      },
    ];

    for (const r of defaultRoles) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { $setOnInsert: r },
        { upsert: true, new: true }
      );
    }
    console.log("CMS Roles seeded.");

    // 3. Seed Default Administrator User if missing
    const User = require("../models/User");
    const bcrypt = require("bcrypt");
    const adminEmail = "admin@myjourney.com";
    const existingAdmin = await User.findOne({ $or: [{ email: adminEmail }, { username: "admin" }] });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("Password123!", 12);
      await User.create({
        firstName: "Default",
        lastName: "Administrator",
        username: "admin",
        email: adminEmail,
        countryCode: "+91",
        mobile: "+919999999999",
        passwordHash,
        role: "Admin",
        verified: {
          email: true,
          mobile: true,
        },
        profile: {
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
          bio: "Default administrator account for MyJourney platform management.",
        },
      });
      console.log("Default Admin user seeded: admin@myjourney.com / Password123!");
    } else {
      const isPasswordValid = await bcrypt.compare("Password123!", existingAdmin.passwordHash);
      let updated = false;
      if (!isPasswordValid) {
        existingAdmin.passwordHash = await bcrypt.hash("Password123!", 12);
        updated = true;
      }
      if (existingAdmin.role !== "Admin") {
        existingAdmin.role = "Admin";
        updated = true;
      }
      if (!existingAdmin.verified?.email || !existingAdmin.verified?.mobile) {
        existingAdmin.verified = { email: true, mobile: true };
        updated = true;
      }
      if (existingAdmin.failedLoginAttempts > 0 || existingAdmin.lockUntil) {
        existingAdmin.failedLoginAttempts = 0;
        existingAdmin.lockUntil = null;
        updated = true;
      }
      if (updated) {
        await existingAdmin.save();
        console.log("Updated default Admin user password, verification, role, and unlocked account.");
      }
    }
  } catch (error) {
    console.error("CMS seeding failed:", error);
  }
};

module.exports = seedCmsPermissionsAndRoles;

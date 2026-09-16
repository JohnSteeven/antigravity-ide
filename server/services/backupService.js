const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const backupRepository = require("../repositories/backupRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

const isProduction = () => process.env.NODE_ENV === "production";
const isLegacyBackupAllowedInProd = () => process.env.ALLOW_LEGACY_BACKUP_IN_PRODUCTION === "true";

const SENSITIVE_USER_FIELDS = [
  "passwordHash",
  "passwordResetToken",
  "passwordResetExpires",
  "twoFactor",
  "backupCodes",
  "passwordHistory",
];

const sanitizeUserDoc = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const sanitized = { ...doc };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
};

class BackupService {
  async getBackups() {
    return backupRepository.find();
  }

  async triggerBackup(userId) {
    if (isProduction() && !isLegacyBackupAllowedInProd()) {
      const err = new Error("Legacy backup is disabled in production. Explicit ALLOW_LEGACY_BACKUP_IN_PRODUCTION=true is required.");
      err.status = 403;
      throw err;
    }

    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Gather all collections including Phase 4E entities
    const collections = [
      "Article",
      "Category",
      "SubCategory",
      "Tag",
      "Setting",
      "Comment",
      "Subscriber",
      "User",
      "Media",
      "ActivityLog",
      "Testimonial",
      "Gallery",
      "ContactMessage",
      "NewsletterCampaign"
    ];
    const backupData = {};
    const recordCounts = {};

    for (const modelName of collections) {
      try {
        const Model = mongoose.model(modelName);
        let docs = await Model.find({}).lean();
        if (modelName === "User") {
          docs = docs.map(sanitizeUserDoc);
        }
        backupData[modelName] = docs;
        recordCounts[modelName.toLowerCase()] = docs.length;
      } catch (err) {
        console.warn(`Skipping backup for collection ${modelName}: model not initialized or empty.`);
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");

    const stats = fs.statSync(filePath);
    const size = `${(stats.size / 1024).toFixed(2)} KB`;

    const backup = await backupRepository.create({
      fileName,
      size,
      recordCounts,
      createdBy: userId,
    });

    await activityLogRepository.create({
      action: "backup_create",
      description: `Created database backup "${fileName}" (${size})`,
      userId,
      module: "backup",
    });

    return backup;
  }

  async getBackupFilePath(id) {
    if (isProduction() && !isLegacyBackupAllowedInProd()) {
      const err = new Error("Legacy backup operations are disabled in production.");
      err.status = 403;
      throw err;
    }

    const backup = await backupRepository.findById(id);
    if (!backup) throw new Error("Backup record not found.");

    const safeFileName = path.basename(backup.fileName);
    const filePath = path.join(__dirname, "../backups", safeFileName);
    if (!fs.existsSync(filePath)) {
      throw new Error("Backup file not found on disk.");
    }
    return { filePath, fileName: safeFileName };
  }

  async restoreBackup(id, userId) {
    // Block destructive restore in production unconditionally
    if (isProduction()) {
      const err = new Error("Destructive restore using legacy backup is permanently disabled in production. Use managed replica-set point-in-time recovery.");
      err.status = 403;
      throw err;
    }

    const backup = await backupRepository.findById(id);
    if (!backup) throw new Error("Backup record not found.");

    const safeFileName = path.basename(backup.fileName);
    const filePath = path.join(__dirname, "../backups", safeFileName);
    if (!fs.existsSync(filePath)) {
      throw new Error("Backup file not found on disk.");
    }

    const rawData = fs.readFileSync(filePath, "utf8");
    const backupData = JSON.parse(rawData);

    // Restore collections by dropping existing and inserting many
    for (const modelName of Object.keys(backupData)) {
      try {
        const Model = mongoose.model(modelName);
        await Model.deleteMany({});
        if (backupData[modelName] && backupData[modelName].length > 0) {
          await Model.insertMany(backupData[modelName]);
        }
      } catch (err) {
        console.error(`Error restoring collection ${modelName}:`, err);
        throw new Error(`Failed to restore collection ${modelName}: ${err.message}`);
      }
    }

    await activityLogRepository.create({
      action: "backup_restore",
      description: `Restored database to snapshot from "${backup.fileName}"`,
      userId,
      module: "backup",
    });

    return backup;
  }

  async deleteBackup(id, userId) {
    const backup = await backupRepository.softDelete(id);
    if (!backup) throw new Error("Backup log not found.");

    const safeFileName = path.basename(backup.fileName);
    const filePath = path.join(__dirname, "../backups", safeFileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Could not delete backup file ${backup.fileName} from disk:`, err);
      }
    }

    await activityLogRepository.create({
      action: "backup_delete",
      description: `Deleted database backup record "${backup.fileName}"`,
      userId,
      module: "backup",
    });
    return backup;
  }
}

module.exports = new BackupService();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const backupRepository = require("../repositories/backupRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class BackupService {
  async getBackups() {
    return backupRepository.find();
  }

  async triggerBackup(userId) {
    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 1. Gather all collections
    const collections = ["Article", "Category", "SubCategory", "Tag", "Setting", "Comment", "Subscriber", "User", "Media", "ActivityLog"];
    const backupData = {};
    const recordCounts = {};

    for (const modelName of collections) {
      const Model = mongoose.model(modelName);
      const docs = await Model.find({}).lean();
      backupData[modelName] = docs;
      recordCounts[modelName.toLowerCase()] = docs.length;
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
    });

    return backup;
  }

  async deleteBackup(id, userId) {
    const backup = await backupRepository.softDelete(id);
    if (!backup) throw new Error("Backup log not found.");

    await activityLogRepository.create({
      action: "backup_delete",
      description: `Deleted database backup record "${backup.fileName}"`,
      userId,
    });
    return backup;
  }
}

module.exports = new BackupService();

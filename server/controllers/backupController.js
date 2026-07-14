const backupService = require("../services/backupService");

class BackupController {
  async getBackups(req, res, next) {
    try {
      const backups = await backupService.getBackups();
      res.json({ success: true, backups });
    } catch (err) {
      next(err);
    }
  }

  async triggerBackup(req, res, next) {
    try {
      const backup = await backupService.triggerBackup(req.user?._id);
      res.json({ success: true, message: "Backup created successfully.", backup });
    } catch (err) {
      next(err);
    }
  }

  async downloadBackup(req, res, next) {
    try {
      const { id } = req.params;
      const { filePath, fileName } = await backupService.getBackupFilePath(id);
      res.download(filePath, fileName);
    } catch (err) {
      next(err);
    }
  }

  async restoreBackup(req, res, next) {
    try {
      const { id } = req.params;
      const backup = await backupService.restoreBackup(id, req.user?._id);
      res.json({ success: true, message: "Database restored successfully.", backup });
    } catch (err) {
      next(err);
    }
  }

  async deleteBackup(req, res, next) {
    try {
      const { id } = req.params;
      await backupService.deleteBackup(id, req.user?._id);
      res.json({ success: true, message: "Backup record deleted." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BackupController();

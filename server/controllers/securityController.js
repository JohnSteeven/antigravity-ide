const securityCenterService = require("../services/securityCenterService");
const accountDeletionService = require("../services/accountDeletionService");

class SecurityController {
  async requestAccountDeletion(req, res, next) {
    try { res.json({ success: true, ...(await accountDeletionService.requestDeletion(req.user, req.body.password, req.body.confirmation)), message: "Account deletion scheduled. You have seven days to cancel." }); }
    catch (err) { next(err); }
  }

  async cancelAccountDeletion(req, res, next) {
    try { res.json({ success: true, ...(await accountDeletionService.cancelDeletion(req.user._id)), message: "Account deletion cancelled." }); }
    catch (err) { next(err); }
  }
  async getOverview(req, res, next) {
    try {
      const data = await securityCenterService.getSecurityOverview(req.user);
      res.json({ ok: true, overview: data });
    } catch (err) {
      next(err);
    }
  }

  async getSessions(req, res, next) {
    try {
      const sessions = await securityCenterService.getActiveSessions(req.user, req);
      res.json({ ok: true, sessions });
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const result = await securityCenterService.revokeSession(req.user._id, req.params.id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async revokeAllOtherSessions(req, res, next) {
    try {
      const result = await securityCenterService.revokeAllOtherSessions(req.user._id, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getLoginHistory(req, res, next) {
    try {
      const { page, limit, range, search } = req.query;
      const data = await securityCenterService.getLoginHistory(req.user._id, {
        page,
        limit,
        range,
        search,
      });
      res.json({ ok: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  async getDevices(req, res, next) {
    try {
      const devices = await securityCenterService.getTrustedDevices(req.user._id, req);
      res.json({ ok: true, devices });
    } catch (err) {
      next(err);
    }
  }

  async renameDevice(req, res, next) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Device name is required." });
      }
      const result = await securityCenterService.renameDevice(req.user._id, req.params.id, name);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeDevice(req, res, next) {
    try {
      const result = await securityCenterService.removeDevice(req.user._id, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SecurityController();

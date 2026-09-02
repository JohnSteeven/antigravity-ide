const Permission = require("../models/Permission");

class PermissionRepository {
  async findAllSorted() {
    return Permission.find({}).sort({ module: 1, key: 1 }).lean();
  }
}

module.exports = new PermissionRepository();

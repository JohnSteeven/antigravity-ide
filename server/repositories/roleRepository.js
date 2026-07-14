const Role = require("../models/Role");

class RoleRepository {
  async find(filter = {}, includeDeleted = false) {
    const query = { ...filter };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return Role.find(query).sort({ name: 1 }).lean();
  }

  async findById(id) {
    return Role.findOne({ _id: id });
  }

  async findByName(name) {
    return Role.findOne({ name, isDeleted: false });
  }

  async create(data) {
    return Role.create(data);
  }

  async update(id, updateData) {
    return Role.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id) {
    return Role.findOneAndUpdate(
      { _id: id, isDeleted: false, isSystem: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
  }

  async restore(id) {
    return Role.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    );
  }
}

module.exports = new RoleRepository();

const ContactMessage = require("../models/ContactMessage");

class ContactMessageRepository {
  async find(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    return ContactMessage.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findWithDeleted(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    return ContactMessage.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}) {
    return ContactMessage.countDocuments({ ...filter, isDeleted: false });
  }

  async countWithDeleted(filter = {}) {
    return ContactMessage.countDocuments(filter);
  }

  async findById(id) {
    return ContactMessage.findOne({ _id: id, isDeleted: false });
  }

  async findByIdWithDeleted(id) {
    return ContactMessage.findOne({ _id: id });
  }

  async create(data) {
    return ContactMessage.create(data);
  }

  async update(id, updateData) {
    return ContactMessage.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return ContactMessage.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return ContactMessage.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new ContactMessageRepository();

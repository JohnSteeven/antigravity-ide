const Subscriber = require("../models/Subscriber");

class SubscriberRepository {
  async find(filter = {}, sort = { createdAt: -1 }, limit = 50, skip = 0) {
    return Subscriber.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}) {
    return Subscriber.countDocuments({ ...filter, isDeleted: false });
  }

  async findByEmail(email) {
    return Subscriber.findOne({ email: email.toLowerCase().trim(), isDeleted: false });
  }

  async findById(id) {
    return Subscriber.findOne({ _id: id, isDeleted: false });
  }

  async create(data) {
    return Subscriber.create(data);
  }

  async update(id, updateData) {
    return Subscriber.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Subscriber.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Subscriber.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new SubscriberRepository();

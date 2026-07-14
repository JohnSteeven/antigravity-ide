const Testimonial = require("../models/Testimonial");

class TestimonialRepository {
  async find(filter = {}, sort = { displayOrder: 1, createdAt: -1 }, limit = 50, skip = 0) {
    return Testimonial.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findWithDeleted(filter = {}, sort = { displayOrder: 1, createdAt: -1 }, limit = 50, skip = 0) {
    return Testimonial.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async count(filter = {}) {
    return Testimonial.countDocuments({ ...filter, isDeleted: false });
  }

  async countWithDeleted(filter = {}) {
    return Testimonial.countDocuments(filter);
  }

  async findById(id) {
    return Testimonial.findOne({ _id: id, isDeleted: false });
  }

  async findByIdWithDeleted(id) {
    return Testimonial.findOne({ _id: id });
  }

  async create(data) {
    return Testimonial.create(data);
  }

  async update(id, updateData) {
    return Testimonial.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Testimonial.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedBy: userId } },
      { new: true }
    );
  }

  async restore(id, userId) {
    return Testimonial.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, updatedBy: userId } },
      { new: true }
    );
  }
}

module.exports = new TestimonialRepository();

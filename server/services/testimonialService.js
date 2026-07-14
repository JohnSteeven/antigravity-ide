const testimonialRepository = require("../repositories/testimonialRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class TestimonialService {
  async getTestimonials(query = {}) {
    const filter = {};

    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }

    if (query.rating) {
      filter.rating = parseInt(query.rating);
    }

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [
        { name: regex },
        { designation: regex },
        { company: regex },
        { testimonial: regex },
      ];
    }

    const sort = {};
    if (query.sortBy) {
      const direction = query.sortDir === "desc" ? -1 : 1;
      sort[query.sortBy] = direction;
    } else {
      sort.displayOrder = 1;
      sort.createdAt = -1;
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const includeDeleted = query.includeDeleted === "true" || query.includeDeleted === true;
    
    let testimonials, total;
    if (includeDeleted) {
      testimonials = await testimonialRepository.findWithDeleted(filter, sort, limit, skip);
      total = await testimonialRepository.countWithDeleted(filter);
    } else {
      testimonials = await testimonialRepository.find(filter, sort, limit, skip);
      total = await testimonialRepository.count(filter);
    }

    return {
      testimonials,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTestimonialById(id) {
    return testimonialRepository.findById(id);
  }

  async createTestimonial(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const item = await testimonialRepository.create(data);

    await activityLogRepository.create({
      action: "testimonial_create",
      description: `Created testimonial for "${item.name}"`,
      userId,
      module: "testimonials",
    });

    return item;
  }

  async updateTestimonial(id, data, userId) {
    data.updatedBy = userId;
    const item = await testimonialRepository.update(id, data);
    if (!item) throw new Error("Testimonial not found.");

    await activityLogRepository.create({
      action: "testimonial_update",
      description: `Updated testimonial for "${item.name}"`,
      userId,
      module: "testimonials",
    });

    return item;
  }

  async softDeleteTestimonial(id, userId) {
    const item = await testimonialRepository.softDelete(id, userId);
    if (!item) throw new Error("Testimonial not found.");

    await activityLogRepository.create({
      action: "testimonial_delete",
      description: `Soft deleted testimonial for "${item.name}"`,
      userId,
      module: "testimonials",
    });

    return item;
  }

  async restoreTestimonial(id, userId) {
    const item = await testimonialRepository.restore(id, userId);
    if (!item) throw new Error("Testimonial not found.");

    await activityLogRepository.create({
      action: "testimonial_restore",
      description: `Restored testimonial for "${item.name}"`,
      userId,
      module: "testimonials",
    });

    return item;
  }
}

module.exports = new TestimonialService();

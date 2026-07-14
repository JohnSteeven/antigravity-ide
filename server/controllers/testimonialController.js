const testimonialService = require("../services/testimonialService");

class TestimonialController {
  async getTestimonials(req, res, next) {
    try {
      const result = await testimonialService.getTestimonials(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getTestimonialById(req, res, next) {
    try {
      const item = await testimonialService.getTestimonialById(req.params.id);
      if (!item) {
        return res.status(404).json({ success: false, message: "Testimonial not found." });
      }
      res.json({ success: true, testimonial: item });
    } catch (err) {
      next(err);
    }
  }

  async createTestimonial(req, res, next) {
    try {
      const item = await testimonialService.createTestimonial(req.body, req.user?._id);
      res.status(201).json({ success: true, testimonial: item });
    } catch (err) {
      next(err);
    }
  }

  async updateTestimonial(req, res, next) {
    try {
      const item = await testimonialService.updateTestimonial(req.params.id, req.body, req.user?._id);
      res.json({ success: true, testimonial: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteTestimonial(req, res, next) {
    try {
      await testimonialService.softDeleteTestimonial(req.params.id, req.user?._id);
      res.json({ success: true, message: "Testimonial soft deleted." });
    } catch (err) {
      next(err);
    }
  }

  async restoreTestimonial(req, res, next) {
    try {
      const item = await testimonialService.restoreTestimonial(req.params.id, req.user?._id);
      res.json({ success: true, testimonial: item, message: "Testimonial restored." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TestimonialController();

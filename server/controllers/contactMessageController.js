const contactMessageService = require("../services/contactMessageService");

class ContactMessageController {
  async getMessages(req, res, next) {
    try {
      const result = await contactMessageService.getMessages(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getMessageById(req, res, next) {
    try {
      const message = await contactMessageService.getMessageById(req.params.id);
      if (!message) {
        return res.status(404).json({ success: false, message: "Contact message not found." });
      }
      res.json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  async createMessage(req, res, next) {
    try {
      const message = await contactMessageService.createMessage(req.body);
      res.status(201).json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  async updateMessage(req, res, next) {
    try {
      const message = await contactMessageService.updateMessage(req.params.id, req.body, req.user?._id);
      res.json({ success: true, message });
    } catch (err) {
      next(err);
    }
  }

  async deleteMessage(req, res, next) {
    try {
      await contactMessageService.softDeleteMessage(req.params.id, req.user?._id);
      res.json({ success: true, message: "Contact message soft deleted." });
    } catch (err) {
      next(err);
    }
  }

  async restoreMessage(req, res, next) {
    try {
      const message = await contactMessageService.restoreMessage(req.params.id, req.user?._id);
      res.json({ success: true, message, messageText: "Contact message restored." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ContactMessageController();

const subscriberService = require("../services/subscriberService");

class SubscriberController {
  async subscribe(req, res, next) {
    try {
      const { email } = req.body;
      const result = await subscriberService.subscribe(email, req.user?._id);
      
      if (result.alreadySubscribed) {
        return res.status(200).json({ message: result.message });
      }
      res.status(201).json({ message: result.message, subscriber: result.subscriber });
    } catch (err) {
      next(err);
    }
  }

  async getSubscribers(req, res, next) {
    try {
      const data = await subscriberService.getSubscribers(req.query);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      await subscriberService.unsubscribe(req.params.id, req.user?._id);
      res.json({ message: "Subscriber removed." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubscriberController();

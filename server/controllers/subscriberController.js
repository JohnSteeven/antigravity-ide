const subscriberService = require("../services/subscriberService");

class SubscriberController {
  async subscribe(req, res, next) {
    try {
      const { email, source } = req.body;
      const result = await subscriberService.subscribe(email, source || "website_footer");
      res.status(200).json({ message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async verify(req, res, next) {
    try {
      const { token } = req.params;
      const result = await subscriberService.verifySubscription(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPreferences(req, res, next) {
    try {
      const { token } = req.params;
      const subscriber = await subscriberService.getPreferences(token);
      res.json({ preferences: subscriber.preferences, email: subscriber.email, status: subscriber.status });
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const { token } = req.params;
      const { preferences } = req.body;
      const subscriber = await subscriberService.updatePreferences(token, preferences);
      res.json({ message: "Preferences updated successfully.", preferences: subscriber.preferences });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribeByToken(req, res, next) {
    try {
      const { token } = req.params;
      const { reason } = req.body || {};
      const result = await subscriberService.unsubscribeByToken(token, reason);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async trackOpen(req, res) {
    try {
      const { token } = req.params;
      await subscriberService.trackOpen(token);
    } catch (_) {}
    // Return 1x1 transparent GIF
    const imgBuffer = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": imgBuffer.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    });
    res.end(imgBuffer);
  }

  async trackClick(req, res) {
    try {
      const { token } = req.params;
      const targetUrl = req.query.url || "/";
      await subscriberService.trackClick(token);
      res.redirect(targetUrl);
    } catch (_) {
      res.redirect("/");
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

  async getStats(req, res, next) {
    try {
      const data = await subscriberService.getSubscriberStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const result = await subscriberService.resendVerification(req.params.id);
      res.json(result);
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

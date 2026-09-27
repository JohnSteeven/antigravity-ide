const express = require("express");
const MediaProvider = require("../learn/mediaProviderService");
const videoService = require("../learn/videoService");

const router = express.Router();
router.post("/", async (req, res, next) => {
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ message: "Raw webhook body required." });
  let event;
  try {
    event = await MediaProvider.verifyWebhook(req.body.toString("utf8"), req.headers);
  } catch (error) {
    if (error.code === "MEDIA_PROVIDER_UNAVAILABLE") return res.status(503).json({ message: "Mux is not configured." });
    return res.status(401).json({ message: "Invalid Mux webhook signature." });
  }
  try {
    await videoService.applyWebhookEvent(event);
    return res.status(200).json({ received: true });
  } catch (error) { return next(error); }
});

module.exports = router;

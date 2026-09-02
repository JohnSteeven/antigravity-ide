const CreatorProfile = require("../models/CreatorProfile");

const creatorAccessRequired = (res, status = null) => res.status(403).json({
  message: "An active Creator profile is required.",
  code: "CREATOR_ACCESS_REQUIRED",
  creatorStatus: status,
});

const requireActiveCreator = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const creator = await CreatorProfile.findOne({ userId }).lean();
    if (!creator || creator.status !== "active") return creatorAccessRequired(res, creator?.status || null);
    req.creator = creator;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { creatorAccessRequired, requireActiveCreator };

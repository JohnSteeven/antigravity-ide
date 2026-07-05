const express = require("express");
const { body, validationResult } = require("express-validator");
const { handleValidation } = require("../middleware/errorHandler");
const Notification = require("../models/Notification");

const router = express.Router();
const validate = handleValidation(validationResult);

const safeUser = (user) => {
  const nextUser = user.toSafeJSON();
  if (nextUser._id && !nextUser.id) {
    nextUser.id = nextUser._id.toString();
  }
  return nextUser;
};

router.get("/me", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const user = safeUser(req.user);
    user.profile = {
      ...(user.profile || {}),
      notifications,
    };

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/me",
  [
    body("firstName").optional().trim().notEmpty(),
    body("lastName").optional().trim().notEmpty(),
    body("username").optional().trim().isLength({ min: 3 }),
    body("email").optional().trim().isEmail().normalizeEmail(),
    body("mobile").optional().trim().isLength({ min: 8, max: 18 }),
    body("profile.bio").optional().trim().isLength({ max: 700 }),
    body("profile.skills").optional().isArray(),
    body("profile.avatar").optional().trim(),
    body("profile.coverImage").optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowedRoot = [
        "firstName",
        "lastName",
        "username",
        "email",
        "countryCode",
        "mobile",
      ];

      allowedRoot.forEach((key) => {
        if (req.body[key] !== undefined) req.user[key] = req.body[key];
      });

      if (req.body.profile) {
        req.user.profile = {
          ...(req.user.profile || {}),
          ...req.body.profile,
        };
      }

      await req.user.save();
      res.json({
        user: safeUser(req.user),
        message: "Profile updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

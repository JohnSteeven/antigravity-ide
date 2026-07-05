const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

const getBearerToken = (req) => {
  const header = req.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please login again." });
  }
};

module.exports = { authenticate };

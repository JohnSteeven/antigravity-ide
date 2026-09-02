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

    const decoded = jwt.verify(token, env.jwtAccessSecret, { algorithms: ["HS256"] });
    const user = await User.findById(decoded.sub);

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: `Account is ${user.status.toLowerCase().replace(/_/g, " ")}.` });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expired or terminated. Please login again." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please login again." });
  }
};

// Public content endpoints use this to personalize access without turning a
// missing or stale session into an authentication error. Invalid sessions are
// treated as anonymous and can never increase access.
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || getBearerToken(req);
    if (!token) return next();
    const decoded = jwt.verify(token, env.jwtAccessSecret, { algorithms: ["HS256"] });
    const user = await User.findById(decoded.sub);
    if (user?.status === "ACTIVE" && !user.isDeleted && decoded.tokenVersion === user.tokenVersion) {
      req.user = user;
    }
  } catch (error) {
    req.user = undefined;
  }
  return next();
};

module.exports = { authenticate, optionalAuthenticate };

const jwt = require("jsonwebtoken");
const env = require("../../config/env");

const optionalUserId = (req) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.accessToken || bearer;
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtAccessSecret).sub || null;
  } catch (error) {
    return null;
  }
};

module.exports = optionalUserId;

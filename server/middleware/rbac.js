const Role = require("../models/Role");

const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required." });
      }

      // Admins bypass all permission checks
      if (req.user.role === "Admin") {
        return next();
      }

      // Query the user's role from the database
      const roleDoc = await Role.findOne({ name: req.user.role, isDeleted: false });
      if (!roleDoc) {
        return res.status(403).json({ message: "Forbidden. Role not found or inactive." });
      }

      if (roleDoc.permissions && roleDoc.permissions.includes(permissionKey)) {
        return next();
      }

      return res.status(403).json({ message: `Forbidden. Insufficient permissions. Requires: ${permissionKey}` });
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkPermission };

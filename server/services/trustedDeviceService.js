/**
 * trustedDeviceService.js
 * Manages connected/trusted devices: list, rename, remove.
 */

const TrustedDevice = require("../models/TrustedDevice");
const ActivityLog = require("../models/ActivityLog");

const formatRelativeTime = (date) => {
  if (!date) return "Never";
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const trustedDeviceService = {
  async getTrustedDevices(userId, req) {
    let devices = await TrustedDevice.find({ user: userId })
      .sort({ lastSeenAt: -1 })
      .lean();

    // Seed a default device if none found (development convenience)
    if (devices.length === 0) {
      const ua = req?.headers?.["user-agent"] || "";
      const seeded = await TrustedDevice.create({
        user: userId,
        deviceName: "Primary Workstation",
        deviceType: "Desktop",
        browser: ua.includes("Firefox") ? "Firefox" : "Chrome",
        os: "Windows",
        ipAddress: req?.ip || "127.0.0.1",
        country: "Localhost",
        city: "Development",
        isCurrentDevice: true,
        trustedSince: new Date(),
        lastSeenAt: new Date(),
      });
      devices = [seeded.toObject()];
    }

    return devices.map((dev) => ({
      id: dev._id.toString(),
      deviceName: dev.deviceName,
      deviceType: dev.deviceType || "Desktop",
      browser: dev.browser || "Unknown Browser",
      os: dev.os || "Unknown OS",
      ipAddress: dev.ipAddress || "127.0.0.1",
      country: dev.country || "Unknown",
      city: dev.city || "Unknown",
      isCurrentDevice: Boolean(dev.isCurrentDevice),
      trustedSince: dev.trustedSince,
      lastSeenAt: dev.lastSeenAt,
      lastSeenRelative: formatRelativeTime(dev.lastSeenAt),
    }));
  },

  async renameDevice(userId, deviceId, deviceName) {
    const dev = await TrustedDevice.findOne({ _id: deviceId, user: userId });
    if (!dev) {
      const err = new Error("Device not found.");
      err.status = 404;
      throw err;
    }
    const oldName = dev.deviceName;
    dev.deviceName = deviceName.trim();
    await dev.save();

    await ActivityLog.create({
      userId,
      user: userId,
      action: "DEVICE_RENAMED",
      description: `Trusted device renamed from "${oldName}" to "${dev.deviceName}"`,
      status: "SUCCESS",
      module: "security",
    }).catch(() => {});

    return { success: true, device: { id: dev._id.toString(), deviceName: dev.deviceName } };
  },

  async removeDevice(userId, deviceId) {
    const dev = await TrustedDevice.findOne({ _id: deviceId, user: userId });
    if (!dev) {
      const err = new Error("Device not found.");
      err.status = 404;
      throw err;
    }
    const deviceName = dev.deviceName;
    await TrustedDevice.deleteOne({ _id: deviceId, user: userId });

    await ActivityLog.create({
      userId,
      user: userId,
      action: "DEVICE_REMOVED",
      description: `Trusted device "${deviceName}" removed`,
      status: "SUCCESS",
      module: "security",
    }).catch(() => {});

    return { success: true, message: "Device removed from trusted list." };
  },
};

module.exports = trustedDeviceService;

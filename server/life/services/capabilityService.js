const webPushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

const getCapabilities = () => ({
  quickCapture: { available: true },
  search: { available: true, privacy: "user_scoped" },
  pwa: { available: null, state: "client_registration_required", privateApiCaching: false },
  offlineQueue: { available: true, schemaVersion: 2, retentionHours: 24, supportedMutations: ["task.create", "event.log:habit", "event.log:task", "event.log:goal_action"] },
  webPush: { available: webPushConfigured(), state: webPushConfigured() ? "available" : "unavailable", reason: webPushConfigured() ? "" : "VAPID credentials are not configured." },
  aiReview: { available: process.env.LIFE_AI_ENABLED === "true", state: process.env.LIFE_AI_ENABLED === "true" ? "available" : "unavailable" },
  calendar: { available: false, state: "disconnected", providers: ["google", "microsoft", "device"], mode: "read_only_foundation" },
  healthIntegrations: { available: false, state: "disconnected", providers: ["apple_health", "health_connect", "fitbit", "garmin", "strava"] },
  financeCsvImport: { available: true, confirmationRequired: true },
});

module.exports = { getCapabilities, webPushConfigured };

const fs = require("fs");
const path = require("path");
const read = (relative) => fs.readFileSync(path.join(__dirname, "..", "..", relative), "utf8");

describe("LifeOS advanced client safety contracts", () => {
  test("quick capture supports progressive actions, typed voice fallback, and confirmation preview", () => {
    const capture = read("src/features/life/components/QuickCapture.jsx");
    const parser = read("src/features/life/utils/captureParser.js");
    expect(capture).toContain("More capture types");
    expect(capture).toContain("Type or speak naturally");
    expect(capture).toContain("Preview ·");
    ["water", "expense", "journal", "mood", "task", "workout", "sleep", "medication"].forEach((type) => expect(capture).toContain(`\"${type}\"`));
    expect(parser).toContain("confidence");
    expect(parser).not.toMatch(/delete|archive|remove/i);
  });

  test("offline queue persists mutation IDs and private API responses are excluded from service-worker caches", () => {
    const queue = read("src/features/life/offline/offlineQueue.js");
    const worker = read("life-sw.js");
    expect(queue).toContain("clientMutationId");
    expect(queue).toContain("indexedDB");
    expect(queue).toContain("retryCount");
    expect(queue).toContain("life:data-changed");
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).not.toMatch(/cache\.put\([^\n]*api/i);
  });

  test("notification permission is requested only from the explicit settings action", () => {
    const push = read("src/features/life/utils/pushClient.js");
    const settings = read("src/features/life/pages/SettingsPage.jsx");
    expect(push).toContain("Notification.requestPermission()");
    expect(settings).toContain("Enable browser notifications");
    expect(read("src/features/life/LifeApp.jsx")).not.toContain("requestPermission");
  });

  test("PWA manifest is installable and advanced UI remains scoped and responsive", () => {
    const manifest = JSON.parse(read("public/manifest.webmanifest"));
    const css = read("src/features/life/life.css");
    expect(manifest).toMatchObject({ start_url: "/life/today", display: "standalone" });
    expect(css).toContain(".life-capture-actions");
    expect(css).toContain(".life-notification-settings");
    ["960px", "760px", "520px", "360px"].forEach((width) => expect(css).toContain(`max-width: ${width}`));
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});

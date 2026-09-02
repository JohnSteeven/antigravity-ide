const { defineConfig, devices } = require("@playwright/test");
const { E2E_MONGO_URI, E2E_SERVER_PORT, E2E_UI_PORT } = require("./e2e/support/environment.cjs");

const baseURL = `http://127.0.0.1:${E2E_UI_PORT}`;
const apiURL = `http://127.0.0.1:${E2E_SERVER_PORT}`;

module.exports = defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.js",
  globalSetup: require.resolve("./e2e/support/global-setup.cjs"),
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "node server/index.js",
      url: `${apiURL}/api/readiness`,
      timeout: 60_000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        SERVER_PORT: String(E2E_SERVER_PORT),
        PORT: String(E2E_SERVER_PORT),
        CLIENT_URL: baseURL,
        MONGO_URI: E2E_MONGO_URI,
        CSRF_ENABLED: "true",
        COOKIE_SECURE: "false",
        MULTIPLAYER_ENABLED: "false",
      },
    },
    {
      command: `npx parcel index.html --port ${E2E_UI_PORT} --no-cache`,
      url: baseURL,
      timeout: 90_000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        PARCEL_PROXY_TARGET: apiURL,
        PARCEL_API_URL: apiURL,
        PARCEL_AUTH_API_URL: apiURL,
      },
    },
  ],
});

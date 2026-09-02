const DEFAULT_E2E_MONGO_URI = "mongodb://127.0.0.1:27017/myjourney_e2e";

const E2E_MONGO_URI = process.env.E2E_MONGO_URI || DEFAULT_E2E_MONGO_URI;
const E2E_SERVER_PORT = Number(process.env.E2E_SERVER_PORT || 5001);
const E2E_UI_PORT = Number(process.env.E2E_UI_PORT || 1235);

const databaseName = (() => {
  try {
    return decodeURIComponent(new URL(E2E_MONGO_URI).pathname.replace(/^\//, ""));
  } catch {
    return "";
  }
})();

if (!/(?:^|_)(?:e2e|test)$/i.test(databaseName)) {
  throw new Error(
    `E2E_MONGO_URI must name an isolated database ending in _e2e or _test; received "${databaseName || "unknown"}".`
  );
}

module.exports = {
  E2E_MONGO_URI,
  E2E_SERVER_PORT,
  E2E_UI_PORT,
  fixtures: {
    primaryUserId: "6a9400000000000000000001",
    secondaryUserId: "6a9400000000000000000002",
    articleId: "6a9400000000000000000003",
    articleSlug: "e2e-core-reliability-article",
    articleTitle: "E2E Core Reliability Article",
    primaryEmail: "reader.primary@myjourney.e2e.test",
    secondaryEmail: "reader.secondary@myjourney.e2e.test",
    password: "Reliability!2026",
  },
};

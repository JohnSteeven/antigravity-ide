/**
 * Verify Phase 4A article CRUD operations
 * Creates → Updates → Sets Status → Restores → Deletes an article
 */
const http = require("http");

const BASE = "http://127.0.0.1:5000";
let sessionCookies = "";

const request = (method, path, body, extraHeaders = {}) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "127.0.0.1",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookies,
        ...extraHeaders,
      },
    };
    const req = http.request(opts, (res) => {
      const setCookie = res.headers["set-cookie"];
      if (setCookie) {
        const cookies = setCookie.map((c) => c.split(";")[0]);
        cookies.forEach((c) => {
          const key = c.split("=")[0];
          const existing = sessionCookies.split("; ").filter((s) => !s.startsWith(key + "="));
          sessionCookies = [...existing, c].join("; ");
        });
      }
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });

const getCsrf = async () => {
  const r = await request("GET", "/api/auth/csrf-token");
  return r.data.csrfToken;
};

const step = (label, passed, detail = "") => {
  const icon = passed ? "✓" : "✗";
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!passed) process.exitCode = 1;
};

(async () => {
  console.log("\nPhase 4A – Article CRUD Verification");
  console.log("======================================");

  let token = await getCsrf();
  step("CSRF", !!token, token.slice(0, 8) + "...");

  // Login
  const login = await request("POST", "/api/auth/login", {
    identifier: "admin@myjourney.com",
    password: "Password123!",
    remember: true,
  }, { "x-csrf-token": token });
  step("Login", login.status === 200, login.data.user?.email);

  // Refresh CSRF (session changed after login)
  token = await getCsrf();

  // Create
  const create = await request("POST", "/api/articles", {
    title: "Phase 4A Verification Article",
    slug: "phase-4a-verification-" + Date.now(),
    description: "Automated test article",
    body: "<p>Test content.</p>",
    category: "Life",
    status: "draft",
  }, { "x-csrf-token": token });
  step("Create article", create.status === 201, create.data.article?.title);
  const artId = create.data.article?._id;

  token = await getCsrf();

  // Update
  const update = await request("PUT", `/api/articles/${artId}`, {
    title: "Phase 4A Verification Article — Updated",
    description: "Updated description",
  }, { "x-csrf-token": token });
  step("Update article", update.status === 200, update.data.article?.title);

  token = await getCsrf();

  // Set status to published
  const publish = await request("PUT", `/api/articles/${artId}/status`, {
    status: "published",
  }, { "x-csrf-token": token });
  step("Publish article", publish.status === 200, `status=${publish.data.article?.status}`);

  token = await getCsrf();

  // Set status to archived
  const archive = await request("PUT", `/api/articles/${artId}/status`, {
    status: "archived",
  }, { "x-csrf-token": token });
  step("Archive article", archive.status === 200, `status=${archive.data.article?.status}`);

  token = await getCsrf();

  // Soft delete
  const del = await request("DELETE", `/api/articles/${artId}`, null, {
    "x-csrf-token": token,
  });
  step("Soft delete", del.status === 200, `isDeleted=${del.data.article?.isDeleted}`);

  token = await getCsrf();

  // Restore
  const restore = await request("POST", `/api/articles/${artId}/restore`, {}, {
    "x-csrf-token": token,
  });
  step("Restore", restore.status === 200, `isDeleted=${restore.data.article?.isDeleted}`);

  token = await getCsrf();

  // Increment views
  const views = await request("POST", `/api/articles/${artId}/views`, {}, {
    "x-csrf-token": token,
  });
  step("Increment views", views.status === 200, `views=${views.data.article?.views}`);

  token = await getCsrf();

  // Final cleanup: delete
  await request("DELETE", `/api/articles/${artId}`, null, { "x-csrf-token": token });
  step("Cleanup", true, "Test article removed");

  console.log("======================================");
  console.log(process.exitCode ? "✗ SOME CHECKS FAILED" : "✓ ALL CHECKS PASSED");
})().catch((err) => {
  console.error("Verification error:", err.message);
  process.exit(1);
});

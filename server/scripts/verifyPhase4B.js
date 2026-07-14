/**
 * Verify Phase 4B: Categories, Subcategories & Tags CRUD operations
 */
const http = require("http");

const PORT = 5000;
let sessionCookies = "";

const request = (method, path, body, extraHeaders = {}) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "127.0.0.1",
      port: PORT,
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
  console.log("\nPhase 4B – Categories, Subcategories & Tags CRUD Verification");
  console.log("===============================================================");

  let token = await getCsrf();
  step("CSRF Token retrieved", !!token, token.slice(0, 8) + "...");

  // Login
  const login = await request("POST", "/api/auth/login", {
    identifier: "admin@myjourney.com",
    password: "Password123!",
    remember: true,
  }, { "x-csrf-token": token });
  step("Admin Login", login.status === 200, login.data.user?.email);

  token = await getCsrf();

  // ==========================================
  // CATEGORIES VERIFICATION
  // ==========================================
  const catSlug = "test-category-" + Date.now();
  const createCat = await request("POST", "/api/categories", {
    name: "Verification Category " + Date.now(),
    slug: catSlug,
    description: "Automated test category",
    longDescription: "Detailed description of test category",
    icon: "code",
    heroImage: "https://example.com/hero.png"
  }, { "x-csrf-token": token });
  step("Create Category", createCat.status === 201, createCat.data.category?.name);
  const catId = createCat.data.category?._id || createCat.data.category?.id;

  token = await getCsrf();

  const updateCat = await request("PUT", `/api/categories/${catId}`, {
    name: "Updated Verification Category",
    description: "Updated automated test description",
  }, { "x-csrf-token": token });
  step("Update Category", updateCat.status === 200, updateCat.data.category?.name);

  token = await getCsrf();

  // Soft delete category
  const deleteCat = await request("DELETE", `/api/categories/${catId}`, null, { "x-csrf-token": token });
  step("Soft Delete Category", deleteCat.status === 200);

  token = await getCsrf();

  // Restore category
  const restoreCat = await request("POST", `/api/categories/${catId}/restore`, {}, { "x-csrf-token": token });
  step("Restore Category", restoreCat.status === 200, `isDeleted=${restoreCat.data.category?.isDeleted}`);

  token = await getCsrf();

  // ==========================================
  // SUBCATEGORIES VERIFICATION
  // ==========================================
  const subSlug = "test-subcategory-" + Date.now();
  const createSub = await request("POST", "/api/subcategories", {
    name: "Verification SubCategory " + Date.now(),
    slug: subSlug,
    description: "Automated test subcategory",
    category: catId
  }, { "x-csrf-token": token });
  step("Create Subcategory", createSub.status === 201, createSub.data.subCategory?.name);
  const subId = createSub.data.subCategory?._id || createSub.data.subCategory?.id;

  token = await getCsrf();

  const updateSub = await request("PUT", `/api/subcategories/${subId}`, {
    name: "Updated Verification SubCategory",
    description: "Updated automated test description for subcategory",
    category: catId
  }, { "x-csrf-token": token });
  step("Update Subcategory", updateSub.status === 200, updateSub.data.subCategory?.name);

  token = await getCsrf();

  // Soft delete subcategory
  const deleteSub = await request("DELETE", `/api/subcategories/${subId}`, null, { "x-csrf-token": token });
  step("Soft Delete Subcategory", deleteSub.status === 200);

  token = await getCsrf();

  // Restore subcategory
  const restoreSub = await request("POST", `/api/subcategories/${subId}/restore`, {}, { "x-csrf-token": token });
  step("Restore Subcategory", restoreSub.status === 200, `isDeleted=${restoreSub.data.subCategory?.isDeleted}`);

  token = await getCsrf();

  // ==========================================
  // TAGS VERIFICATION
  // ==========================================
  const tagSlug = "test-tag-" + Date.now();
  const createTag = await request("POST", "/api/tags", {
    name: "Verification Tag " + Date.now(),
    slug: tagSlug,
    description: "Automated test tag",
    color: "#ff0000"
  }, { "x-csrf-token": token });
  step("Create Tag", createTag.status === 201, createTag.data.tag?.name);
  const tagId = createTag.data.tag?._id || createTag.data.tag?.id;

  token = await getCsrf();

  const updateTag = await request("PUT", `/api/tags/${tagId}`, {
    name: "Updated Verification Tag",
    color: "#00ff00",
  }, { "x-csrf-token": token });
  step("Update Tag", updateTag.status === 200, updateTag.data.tag?.name);

  token = await getCsrf();

  // Soft delete tag
  const deleteTagRes = await request("DELETE", `/api/tags/${tagId}`, null, { "x-csrf-token": token });
  step("Soft Delete Tag", deleteTagRes.status === 200);

  token = await getCsrf();

  // Restore tag
  const restoreTagRes = await request("POST", `/api/tags/${tagId}/restore`, {}, { "x-csrf-token": token });
  step("Restore Tag", restoreTagRes.status === 200, `isDeleted=${restoreTagRes.data.tag?.isDeleted}`);

  token = await getCsrf();

  // ==========================================
  // CLEANUP
  // ==========================================
  await request("DELETE", `/api/subcategories/${subId}`, null, { "x-csrf-token": token });
  token = await getCsrf();
  await request("DELETE", `/api/categories/${catId}`, null, { "x-csrf-token": token });
  token = await getCsrf();
  await request("DELETE", `/api/tags/${tagId}`, null, { "x-csrf-token": token });
  step("Cleanup", true, "Test entities deleted");

  console.log("===============================================================");
  console.log(process.exitCode ? "✗ SOME CHECKS FAILED" : "✓ ALL CHECKS PASSED");
})().catch((err) => {
  console.error("Verification error:", err.message);
  process.exit(1);
});

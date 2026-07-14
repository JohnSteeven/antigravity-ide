const http = require("http");

async function testEndpoint() {
  console.log("Starting API Verification...");
  let passed = true;

  // Helper to parser cookies from headers
  const getCookiesString = (resHeaders, res) => {
    if (res && typeof res.headers.getSetCookie === "function") {
      return res.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
    }
    const setCookies = resHeaders["set-cookie"];
    if (!setCookies) return "";
    if (Array.isArray(setCookies)) {
      return setCookies.map(cookie => cookie.split(";")[0]).join("; ");
    }
    if (typeof setCookies === "string") {
      return setCookies.split(",").map(cookie => cookie.trim().split(";")[0]).join("; ");
    }
    return "";
  };

  try {
    // 1. Verify Backend is Running & Get CSRF token
    console.log("\n[Step 1] Fetching CSRF Token...");
    const csrfRes = await fetch("http://localhost:5000/api/auth/csrf-token");
    if (!csrfRes.ok) throw new Error(`CSRF Token failed: status ${csrfRes.status}`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const initialCookies = getCookiesString(Object.fromEntries(csrfRes.headers.entries()), csrfRes);
    
    console.log("✓ CSRF Token retrieved successfully.");
    console.log(`  Token: ${csrfToken.substring(0, 10)}...`);
    console.log(`  Cookies: ${initialCookies}`);

    // 2. Perform Login
    console.log("\n[Step 2] Testing Admin Login API...");
    const loginPayload = {
      identifier: "admin@myjourney.com",
      password: "Password123!",
      remember: true
    };

    const loginRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        "cookie": initialCookies
      },
      body: JSON.stringify(loginPayload)
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log(`✗ Admin Login failed: ${loginData.message || "Unknown error"}`);
      passed = false;
      return;
    }

    const sessionCookies = getCookiesString(Object.fromEntries(loginRes.headers.entries()), loginRes) + "; " + initialCookies;
    console.log("✓ Admin login successful.");
    console.log(`  User: ${loginData.user?.firstName} ${loginData.user?.lastName} (@${loginData.user?.username})`);
    console.log(`  Role: ${loginData.user?.role}`);

    if (loginData.user?.role !== "admin") {
      console.log("⚠ Warning: User is logged in, but role is not 'admin'!");
      passed = false;
    }

    // 3. Test Dashboard Stats API
    console.log("\n[Step 3] Fetching Stats API...");
    const statsRes = await fetch("http://localhost:5000/api/stats", {
      headers: {
        "cookie": sessionCookies,
        "x-csrf-token": csrfToken
      }
    });

    const statsData = await statsRes.json();
    if (!statsRes.ok) {
      console.log(`✗ Stats API failed: ${statsData.message || "Unknown error"}`);
      passed = false;
    } else {
      console.log("✓ Stats API loaded successfully.");
      console.log("  Metrics:", statsData.metrics);
    }

    // 4. Test Articles API
    console.log("\n[Step 4] Fetching Articles List API...");
    const articlesRes = await fetch("http://localhost:5000/api/articles", {
      headers: {
        "cookie": sessionCookies,
        "x-csrf-token": csrfToken
      }
    });

    const articlesData = await articlesRes.json();
    if (!articlesRes.ok) {
      console.log(`✗ Articles API failed: ${articlesData.message || "Unknown error"}`);
      passed = false;
    } else {
      console.log("✓ Articles API loaded successfully.");
      console.log(`  Found ${articlesData.articles?.length || 0} articles.`);
    }

  } catch (err) {
    console.error("\n✗ Connection or Execution Error:", err.message);
    passed = false;
  } finally {
    console.log("\n==================================");
    if (passed) {
      console.log("✓ OVERALL API VERIFICATION: PASSED");
    } else {
      console.log("✗ OVERALL API VERIFICATION: FAILED");
    }
    console.log("==================================");
  }
}

testEndpoint();

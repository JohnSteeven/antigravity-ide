try {
  const proxy = require("../../.proxyrc.js");
  console.log("SUCCESS: .proxyrc.js required successfully!");
} catch (err) {
  console.error("ERROR: failed to require .proxyrc.js:", err);
}

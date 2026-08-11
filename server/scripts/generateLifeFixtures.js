const { buildLifeFixture, SCENARIOS } = require("../life/fixtures/createLifeFixture");

if (process.env.NODE_ENV === "production") throw new Error("Life fixtures are development-only and cannot run in production.");
const scenario = process.argv[2] || "new-user";
const fixture = buildLifeFixture(scenario);
if (process.argv.includes("--json")) console.log(JSON.stringify(fixture, null, 2));
else console.log(JSON.stringify({ scenario, developmentOnly: true, collections: Object.fromEntries(Object.entries(fixture).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])) }, null, 2));
console.log(`Available scenarios: ${SCENARIOS.join(", ")}`);

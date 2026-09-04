const { execFileSync } = require("child_process");
const fs = require("fs");

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.startsWith(".git/") && !file.startsWith("node_modules/") && !file.startsWith("dist/"));

const signatures = [
  ["private_key_header", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["aws_access_key_id", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["github_token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/],
  ["slack_token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["google_api_key", /\bAIza[A-Za-z0-9_-]{30,}\b/],
  ["jwt_literal", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
];

const results = [];
for (const file of files) {
  let body;
  try {
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) continue;
    body = buffer.toString("utf8");
  } catch {
    continue;
  }

  body.split(/\r?\n/).forEach((line, index) => {
    signatures.forEach(([category, pattern]) => {
      if (pattern.test(line)) results.push({ category, file, line: index + 1 });
    });
  });
}

if (results.length === 0) {
  console.log(`Safe secret scan: no high-confidence credential signatures in ${files.length} tracked/unignored files.`);
} else {
  console.error(`Safe secret scan: ${results.length} high-confidence candidate(s); values suppressed.`);
  results.forEach(({ category, file, line }) => console.error(`${category} ${file}:${line}`));
  process.exitCode = 1;
}

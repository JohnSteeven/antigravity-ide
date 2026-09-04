const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .map((file) => ({ file, bytes: fs.existsSync(file) ? fs.statSync(file).size : 0 }))
  .filter(({ bytes }) => bytes > 0)
  .sort((left, right) => right.bytes - left.bytes);

console.log(`Tracked files: ${files.length}; tracked bytes: ${files.reduce((sum, item) => sum + item.bytes, 0)}`);
console.log("Largest tracked files:");
files.slice(0, 20).forEach(({ file, bytes }) => console.log(`${bytes}\t${file}`));

const byHash = new Map();
for (const { file, bytes } of files.filter((item) => item.bytes >= 100_000)) {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const key = `${bytes}:${hash}`;
  byHash.set(key, [...(byHash.get(key) || []), file]);
}
const duplicates = [...byHash.values()].filter((group) => group.length > 1);
console.log(`Exact duplicate groups (tracked files >=100 kB): ${duplicates.length}`);
duplicates.forEach((group) => console.log(group.join(" | ")));

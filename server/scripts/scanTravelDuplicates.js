"use strict";

const fs = require("fs");
const path = require("path");

const travelDir = path.join(__dirname, "../data/phase5Articles/travel");
const files = fs.readdirSync(travelDir).filter((f) => f.endsWith(".js") && f !== "index.js");

function normalize(str) {
  return str.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

const paragraphMap = new Map(); // norm -> [ { file, text } ]

for (const file of files) {
  const filePath = path.join(travelDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  // Find all paragraph blocks
  const pRegex = /"type":\s*"paragraph",\s*"text":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let match;
  while ((match = pRegex.exec(content)) !== null) {
    const rawText = match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    const norm = normalize(rawText);
    if (norm.length > 40) {
      if (!paragraphMap.has(norm)) {
        paragraphMap.set(norm, []);
      }
      paragraphMap.get(norm).push({ file, text: rawText });
    }
  }
}

let duplicateCount = 0;
for (const [norm, occurrences] of paragraphMap.entries()) {
  if (occurrences.length > 1) {
    duplicateCount++;
    console.log(`\nDuplicate #${duplicateCount} (found in ${occurrences.map((o) => o.file).join(", ")}):`);
    console.log(`Text: "${occurrences[0].text.slice(0, 100)}..."`);
  }
}

console.log(`\nTotal cross-file duplicate paragraphs found in travel: ${duplicateCount}`);

const batchA = require("./batchA.json").map((s) => ({ ...s, contentType: "story" }));
const batchB = require("./batchB.json").map((s) => ({ ...s, contentType: "story" }));
const batchC = require("./batchC.json").map((s) => ({ ...s, contentType: "story" }));
const batch1 = require("./batch1.json").map((s) => ({ ...s, contentType: "story" }));
const batch2 = require("./batch2.json").map((s) => ({ ...s, contentType: "story" }));
const batch3 = require("./batch3.json").map((s) => ({ ...s, contentType: "story" }));
const batch4 = require("./batch4.json").map((s) => ({ ...s, contentType: "story" }));
const archivedData = require("./archived.json");

// Phase 4 Life Stories: Batches 1, 2, 3, & 4 (Stories 1–20)
const launchStories = [...batch1, ...batch2, ...batch3, ...batch4];

module.exports = launchStories;
module.exports.launchStories = launchStories;
module.exports.batchA = batchA;
module.exports.batchB = batchB;
module.exports.batchC = batchC;
module.exports.batch1 = batch1;
module.exports.batch2 = batch2;
module.exports.batch3 = batch3;
module.exports.batch4 = batch4;
module.exports.archivedStories = archivedData.archivedStories || [];

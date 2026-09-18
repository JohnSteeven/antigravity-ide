"use strict";

const fs = require("fs");
const path = require("path");

const travelDir = path.join(__dirname, "../data/phase5Articles/travel");

// 1. Fix wayanad.js workation paragraph
const wayanadPath = path.join(travelDir, "wayanad.js");
let wayanadContent = fs.readFileSync(wayanadPath, "utf8");
wayanadContent = wayanadContent.replace(
  `"When planning an extended workation, verify that your accommodation possesses both high-speed fiber internet and inverter battery or generator backup, as seasonal rains and fallen branches can cause localized power outages in rural plantation belts."`,
  `"For remote professionals planning an extended workation in Wayanad, verify that your homestay or estate cottage features dedicated fiber broadband along with substantial power inverter backup, particularly during heavy monsoon spells across the Malabar hills."`
);
// 2. Fix wayanad.js rain protection paragraph
wayanadContent = wayanadContent.replace(
  `"Rain protection is indispensable between June and September: bring a high-quality waterproof rain jacket, a sturdy windproof umbrella, and protective anti-leech socks if walking through wet plantations. Essential accessories include polarized sunglasses, a wide-brimmed sun hat, an insulated stainless-steel water bottle, insect repellent, and a compact daypack (20 to 25 liters) for day hikes."`,
  `"During the South-West Monsoon in Wayanad, waterproof gear is vital: carry breathable rainwear, leech gaiters for cardamom walks, water-resistant trekking boots, organic herbal insect balm, and dry sacks to safeguard electronics while navigating moist rainforest valleys."`
);
fs.writeFileSync(wayanadPath, wayanadContent, "utf8");
console.log("Updated wayanad.js paragraphs.");

// 3. Fix jaisalmer.js workation paragraph
const jaisalmerPath = path.join(travelDir, "jaisalmer.js");
let jaisalmerContent = fs.readFileSync(jaisalmerPath, "utf8");
jaisalmerContent = jaisalmerContent.replace(
  `"When planning an extended workation, verify that your accommodation possesses both high-speed fiber internet and generator backup, ensuring uninterrupted connectivity during peak daytime working hours."`,
  `"Digital nomads working remotely from the Golden City should verify that their desert haveli provides stable fiber Wi-Fi and power backup, ensuring seamless connectivity amidst Thar summer temperature spikes."`
);
fs.writeFileSync(jaisalmerPath, jaisalmerContent, "utf8");
console.log("Updated jaisalmer.js paragraph.");

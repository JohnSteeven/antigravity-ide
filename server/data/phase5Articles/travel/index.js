"use strict";

/**
 * Phase 5 Canonical Travel Articles Index
 * 20 Travel India (each >= 6,000 words)
 * 15 Travel International (each 7,000 - 12,000 words)
 * Total: 35 canonical travel articles
 */

// Travel India (20)
const goaBeyondTheBeach = require("./goa-beyond-the-beach");
const pondicherryAndTheTamilCoast = require("./pondicherry-and-the-tamil-coast");
const ootyAndTheNilgiriHills = require("./ooty-and-the-nilgiri-hills");
const kodaikanal = require("./kodaikanal");
const munnarAndTheHighRanges = require("./munnar-and-the-high-ranges");
const coorg = require("./coorg");
const wayanad = require("./wayanad");
const hampi = require("./hampi");
const gokarnaAndTheNorthKarnatakaCoast = require("./gokarna-and-the-north-karnataka-coast");
const mysuruAndTheKaveriBasin = require("./mysuru-and-the-kaveri-basin");
const jaipur = require("./jaipur");
const udaipur = require("./udaipur");
const jaisalmer = require("./jaisalmer");
const manaliAndTheUpperBeas = require("./manali-and-the-upper-beas");
const kashmirValley = require("./kashmir-valley");
const ladakh = require("./ladakh");
const rishikeshAndTheUpperGanga = require("./rishikesh-and-the-upper-ganga");
const varanasi = require("./varanasi");
const meghalaya = require("./meghalaya");
const andamanIslands = require("./andaman-islands");

// Travel International (15) - dynamic require if exists
const internationalSlugs = [
  "dubai-and-the-emirates",
  "singapore",
  "thailand-beyond-the-islands",
  "bali-and-eastern-indonesia",
  "malaysia-west-coast-and-peninsula",
  "vietnam-south-to-north",
  "sri-lanka-the-southern-coast-and-hill-country",
  "maldives-inhabited-islands-and-resorts",
  "nepal-the-kathmandu-valley-and-pokhara",
  "japan-the-golden-route-and-beyond",
  "south-korea-seoul-gyeongju-and-the-south",
  "turkey-istanbul-cappadocia-and-the-aegean",
  "italy-rome-to-the-amalfi-coast",
  "switzerland-alpine-transit-and-valley-living",
  "london-and-paris-a-first-time-europe-pairing-from-india",
];

const internationalArticles = [];
for (const slug of internationalSlugs) {
  try {
    const mod = require(`./${slug}`);
    internationalArticles.push(mod);
  } catch (e) {
    // Module not yet authored
  }
}

module.exports = [
  // 20 India
  goaBeyondTheBeach,
  pondicherryAndTheTamilCoast,
  ootyAndTheNilgiriHills,
  kodaikanal,
  munnarAndTheHighRanges,
  coorg,
  wayanad,
  hampi,
  gokarnaAndTheNorthKarnatakaCoast,
  mysuruAndTheKaveriBasin,
  jaipur,
  udaipur,
  jaisalmer,
  manaliAndTheUpperBeas,
  kashmirValley,
  ladakh,
  rishikeshAndTheUpperGanga,
  varanasi,
  meghalaya,
  andamanIslands,
  // 15 International
  ...internationalArticles,
];

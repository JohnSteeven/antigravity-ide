"use strict";

const fs = require("fs");
const path = require("path");

const travelDir = path.join(__dirname, "../data/phase5Articles/travel");

const replacements = [
  {
    file: "coorg.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains mountain-ready vehicles across all talukas."`,
    replace: `"Across Kodagu district, dialing the unified national emergency helpline 112 reaches central police and medical dispatch, while rural coffee talukas rely on 108 ambulances equipped for estate terrain."`
  },
  {
    file: "wayanad.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains mountain-ready vehicles across all talukas."`,
    replace: `"In Wayanad, emergency responders are dispatched via the unified 112 control room, coordinating with primary health centers across Sulthan Bathery, Mananthavady, and Vythiri."`
  },
  {
    file: "kodaikanal.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains mountain-ready vehicles across the plateau."`,
    replace: `"For health or safety emergencies on the Palani plateau, callers can dial 112 for police coordination, while Kodaikanal Government Hospital maintains 108 hill-dispatch ambulances."`
  },
  {
    file: "munnar-and-the-high-ranges.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains mountain-ready vehicles across the plateau."`,
    replace: `"Within the Idukki high ranges, the 112 helpline coordinates emergency police and disaster rescue, supported by plantation hospital ambulances stationed in Munnar town."`
  },
  {
    file: "jaipur.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains rapid-response vehicles throughout the city."`,
    replace: `"In the Rajasthan capital, the 112 centralized response command coordinates Jaipur city police patrol vans and 108 emergency medical units across the Walled City."`
  },
  {
    file: "mysuru-and-the-kaveri-basin.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains rapid-response vehicles throughout the city."`,
    replace: `"Mysuru city maintains rapid police dispatch via the 112 control center, while KR Hospital and city health facilities operate round-the-clock emergency medical teams."`
  },
  {
    file: "udaipur.js",
    find: `"The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains rapid-response vehicles throughout the city."`,
    replace: `"Across the Mewar lake city, emergency callers can reach Udaipur police via 112, with lake rescue patrols and MB Government Hospital ambulances operating 24 hours."`
  }
];

for (const item of replacements) {
  const p = path.join(travelDir, item.file);
  let content = fs.readFileSync(p, "utf8");
  if (content.includes(item.find)) {
    content = content.replace(item.find, item.replace);
    fs.writeFileSync(p, content, "utf8");
    console.log(`Deduplicated emergency line in ${item.file}`);
  } else {
    console.warn(`Could not find target line in ${item.file}`);
  }
}

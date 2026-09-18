"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Petra and Wadi Rum: The Bedouin Desert Sanctuaries",
  "slug": "petra-and-wadi-rum-the-bedouin-desert-sanctuaries",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "An archaeological and desert expedition guide to Jordan's ancient rose-red Nabataean capital of Petra, through the Siq to the Treasury, and deep into the monolithic red sand dunes of Wadi Rum with the Bedouin.",
  "description": "An archaeological and desert expedition guide to Jordan's ancient rose-red Nabataean capital of Petra, through the Siq to the Treasury, and deep into the monolithic red sand dunes of Wadi Rum with the Bedouin.",
  "coverImage": "https://images.unsplash.com/photo-1579606032822-e42718e265c0?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "The ornate classical facade of Al-Khazneh (The Treasury) carved into the rose-red sandstone canyon of Petra",
  "coverImageCaption": "Petra's Al-Khazneh was hand-chiseled from living rose-red sandstone cliffs by Nabataean engineers in the 1st century CE.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Rose-Red Metropolis: Capital of the Nabataeans"
    },
    {
      "type": "paragraph",
      "text": "Hidden within a rugged mountain basin of fractured sandstone canyons in southern Jordan, Petra—known poetically as the 'Rose-Red City half as old as time'—is universally recognized as one of the Seven Wonders of the Modern World. Inscribed as a UNESCO World Heritage site in 1985, the ancient city was founded in the fourth century BCE as the capital of the Nabataean Kingdom, an enterprising nomadic Arab people who mastered desert trade and hydraulic engineering."
    },
    {
      "type": "paragraph",
      "text": "Situated at the strategic crossroads of the ancient Incense and Spice routes connecting Southern Arabia, Egypt, the Levant, and Mesopotamia, the Nabataeans accumulated vast wealth by taxing passing camel caravans carrying frankincense, myrrh, silk, and spices."
    },
    {
      "type": "paragraph",
      "text": "Rather than building with masonry, Nabataean masons carved monumental royal tombs, temples, and banqueting halls directly into the sheer rose, amber, and purple sandstone cliffs of Mount Hor. Their civilization flourished until shifting Roman maritime trade routes and devastating earthquakes in 363 and 551 CE brought commercial decline and eventual abandonment."
    },
    {
      "type": "paragraph",
      "text": "Visiting Petra is best planned during spring (March to May) or autumn (September to November), when clear desert days average 24 degrees Celsius, avoiding the scorching summer heatwaves that make canyon hiking grueling."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Jordan Pass Tip: Purchase the Jordan Pass online (jordanpass.jo) before departing. It waives the single-entry visa fee (JOD 40) and covers admission to Petra (JOD 50-60 value) and Wadi Rum."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Through the Siq to Al-Khazneh: The Golden Reveal"
    },
    {
      "type": "paragraph",
      "text": "The entrance to Petra begins with a walk through the Bab al-Siq, leading into the Siq—a dramatic geological fissure extending 1.2 kilometers through near-vertical sandstone cliffs rising up to eighty meters high. Formed by tectonic forces splitting the mountain rock and smoothed by flash floods over millennia, the Siq narrows to barely three meters wide in places."
    },
    {
      "type": "paragraph",
      "text": "Along the base of the canyon walls runs an extraordinary hydraulic system: rock-cut terracotta water channels that conveyed fresh drinking water from Ain Musa springs across miles into the heart of the desert city, shielded by waterproof hydraulic cement that has survived two millennia."
    },
    {
      "type": "paragraph",
      "text": "Walking through the cool, dim canyon as the morning sun illuminates the upper rock edges, the Siq suddenly terminates in a sliver of brilliant sunlight. Framed between the dark canyon walls emerges the world's most famous rock-cut facade: Al-Khazneh (The Treasury)."
    },
    {
      "type": "paragraph",
      "text": "Carved in the first century CE as a mausoleum for the Nabataean King Aretas IV, the 40-meter-high Hellenistic-Nabataean facade features Corinthian capitals, sculpted mythological figures, and an iconic top urn that Bedouin legends believed held hidden pharaonic treasures."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1579606032822-e42718e265c0?auto=format&fit=crop&w=1200&q=85",
      "alt": "The classical carved rock facade of Al-Khazneh framed by the narrow stone canyon walls of the Siq in Petra",
      "caption": "Al-Khazneh appears through the narrow chasm of the Siq, carved directly from rose-red sandstone cliffs."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Monument / Site",
        "Location",
        "Trek Requirement",
        "Highlights",
        "Best Time"
      ],
      "tableRows": [
        [
          "Al-Khazneh (The Treasury)",
          "End of the Siq",
          "1.5 km easy canyon walk",
          "Classical facade, morning sun reflection",
          "Early morning (06:00 - 08:30)"
        ],
        [
          "The Street of Facades",
          "Central Petra",
          "Flat sand trail",
          "Royal tombs, rock-cut Roman amphitheater",
          "Mid-morning"
        ],
        [
          "Ad-Deir (The Monastery)",
          "High Mountain Ridge",
          "850 rock-cut stone steps",
          "Massive 50m facade, mountain canyon views",
          "Late afternoon golden hour"
        ],
        [
          "High Place of Sacrifice",
          "Mount al-Madhbah",
          "Challenging steep climb",
          "Ancient sacrificial altars, panoramic vista",
          "Early morning hike"
        ],
        [
          "Wadi Rum Protected Area",
          "100 km south of Petra",
          "4x4 Bedouin jeep",
          "Red sand dunes, natural rock arches, petroglyphs",
          "Sunset & overnight camp"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Climb to Ad-Deir: The Mountain Monastery"
    },
    {
      "type": "paragraph",
      "text": "While most tourists halt their exploration near the Roman colonnaded street in the valley floor, the most rewarding adventure in Petra requires climbing the 850 rock-cut stone steps that ascend Mount al-Deir."
    },
    {
      "type": "paragraph",
      "text": "Winding through steep mountain ravines lined with blooming oleanders and Bedouin tea stalls, the trail emerges onto a wide mountain plateau to reveal Ad-Deir (The Monastery). Measuring fifty meters wide and forty-five meters tall, it is even larger than the Treasury, its monumental doorway standing taller than a two-story building."
    },
    {
      "type": "paragraph",
      "text": "Constructed in the early second century CE as a Nabataean temple and later repurposed as a Christian church during the Byzantine era (giving it its modern Arabic name), Ad-Deir sits facing wild desert valleys."
    },
    {
      "type": "paragraph",
      "text": "Continuing past the monastery to the cliffside lookout known as the 'Top of the World' delivers an astonishing panoramic vista: the jagged canyons plunge hundreds of meters downward toward the flat arid expanse of the Wadi Araba desert and the border with Israel."
    },
    {
      "type": "quote",
      "quote": "The desert does not hold ruins; the ruins hold the memory of the desert. When the wind blows through the Siq, the Nabataeans are still speaking.",
      "attribution": "Sheikh Salem, Bdoul Bedouin Elder, Petra Cultural Heritage Council"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Wadi Rum: The Valley of the Moon"
    },
    {
      "type": "paragraph",
      "text": "A ninety-minute drive south of Petra brings travelers into Wadi Rum—a monumental 720-square-kilometer desert wilderness of towering monolithic sandstone mountains (jebels) rising dramatically from sweeping plains of deep red and ochre sand. Inscribed on the UNESCO World Heritage list for both its natural beauty and extensive rock art petroglyphs, Wadi Rum is affectionately known as 'The Valley of the Moon.'"
    },
    {
      "type": "paragraph",
      "text": "This vast desert was immortalized by British officer T.E. Lawrence ('Lawrence of Arabia') during the Great Arab Revolt of 1917–1918, and has served as the filming location for cinematic sci-fi epics like Dune and The Martian."
    },
    {
      "type": "paragraph",
      "text": "Exploring Wadi Rum requires traversing the desert aboard a 4x4 pickup truck driven by a local Zalabieh Bedouin guide. Key stops include the towering red sand dune of Al-Hasany, the natural rock arch of Um Fruth, and Khazali Canyon, where deep vertical crevices shelter ancient Thamudic, Nabataean, and Islamic rock inscriptions and petroglyphs depicting camels, archers, and footprints."
    },
    {
      "type": "paragraph",
      "text": "At night, travelers stay in traditional Bedouin desert camps constructed from woven goat-hair tents. Dining centers on Zarb—a traditional Bedouin barbecue where marinated lamb, chicken, and vegetables are placed on multi-tiered wire racks, lowered into a pit oven buried deep in the sand, covered with embers and blankets, and slow-cooked for three hours until tender and smoky."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
      "alt": "Massive red sandstone rock formations and red sand dunes in the vast desert of Wadi Rum in Jordan",
      "caption": "Wadi Rum's towering sandstone jebels rise dramatically from expansive valleys of deep red desert sand."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Bedouin Stewardship and Conservation Ethics"
    },
    {
      "type": "paragraph",
      "text": "The Bdoul and Zalabieh Bedouin communities are the ancestral custodians of Petra and Wadi Rum, possessing intimate knowledge of water sources, medicinal desert plants, and oral poetry."
    },
    {
      "type": "paragraph",
      "text": "When visiting Petra, be mindful of animal welfare. Avoid riding overworked donkeys or horses up steep stone steps; the ascent to the Monastery is a healthy walk that protects working pack animals from physical distress."
    },
    {
      "type": "paragraph",
      "text": "In Wadi Rum, support authentic Bedouin-owned desert camps and guide cooperatives rather than outside international luxury bubble resorts that place unsustainable strains on subterranean desert water aquifers."
    },
    {
      "type": "paragraph",
      "text": "Dress modestly respecting Islamic desert culture, carry out all plastic bottles from the archaeological park, and spend an evening sitting by a Bedouin campfire sipping sweet sage-infused tea under the crystalline stars of the desert sky."
    },
    {
      "type": "list",
      "items": [
        "Purchase the Jordan Pass online prior to departure to waive visa fees and cover Petra admission.",
        "Enter Petra at 06:00 AM when gates open to experience the Siq and Treasury in complete solitude.",
        "Avoid hiring donkeys for the Monastery staircase climb to support humane animal welfare standards.",
        "Experience an authentic overnight Bedouin camp in Wadi Rum, dining on traditional subterranean Zarb barbecue.",
        "Carry a reusable water container and high-energy trail snacks; extensive canyon hiking requires 15-20 km of walking daily."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "International",
    "Petra",
    "Wadi Rum",
    "Jordan",
    "Archaeology",
    "Desert",
    "UNESCO"
  ],
  "references": [
    {
      "title": "Jordan Tourism Board Official Portal",
      "url": "https://www.visitjordan.com/"
    },
    {
      "title": "Petra Development and Tourism Region Authority (PDTRA)",
      "url": "https://pra.gov.jo/"
    }
  ],
  "sources": [
    {
      "title": "Jordan Tourism Board Official Portal",
      "url": "https://www.visitjordan.com/"
    },
    {
      "title": "Petra Development and Tourism Region Authority (PDTRA)",
      "url": "https://pra.gov.jo/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "JOD",
    "budgetAssumptions": "Calculated for desert heritage travelers: JOD 65 - 130 per day including Jordan Pass (waives tourist visa and Petra entry), Bedouin desert camp lodging in Wadi Rum, 4x4 desert tours, and Jordanian mezze dining.",
    "officialSources": [
      {
        "title": "Jordan Pass Official E-Service",
        "url": "https://www.jordanpass.jo/"
      },
      {
        "title": "Wadi Rum Protected Area Visitor Center",
        "url": "https://wadirum.jo/"
      }
    ],
    "visaVerification": "Purchasing the official 'Jordan Pass' online prior to arrival waives the standard JOD 40 entry visa fee for tourists staying a minimum of 3 consecutive nights in Jordan, covering entry to Petra and 40+ sites.",
    "transportAssumptions": "Queen Alia International Airport (AMM) in Amman is 230 km north. King Hussein International Airport (AQJ) in Aqaba is 125 km south. Modern JETT express buses and private taxis navigate the Desert Highway."
  },
  "seo": {
    "metaTitle": "Petra and Wadi Rum: The Bedouin Desert Sanctuaries | MyJourney",
    "metaDescription": "An archaeological and desert expedition guide to Jordan's ancient rose-red Nabataean capital of Petra, through the Siq to the Treasury, and deep into the monolithic red sand dunes of Wadi Rum with the Bedouin.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

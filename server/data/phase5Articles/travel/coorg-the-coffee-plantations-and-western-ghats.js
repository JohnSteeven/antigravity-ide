"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Coorg: The Coffee Plantations and Western Ghats",
  "slug": "coorg-the-coffee-plantations-and-western-ghats",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A lush highland guide to Kodagu (Coorg) in Karnataka's Western Ghats biodiversity hotspot, detailing shade-grown coffee agroforestry, Kodava martial heritage, sacred Talacauvery springs, and mountain trekking.",
  "description": "A lush highland guide to Kodagu (Coorg) in Karnataka's Western Ghats biodiversity hotspot, detailing shade-grown coffee agroforestry, Kodava martial heritage, sacred Talacauvery springs, and mountain trekking.",
  "coverImage": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "Misty emerald green hills and rolling coffee plantations nestled in the Western Ghats of Coorg, Karnataka",
  "coverImageCaption": "Kodagu produces over a third of India's coffee under an agroforestry canopy that shelters rich endemic wildlife.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Scotland of India: Geography of the Cloud Highlands"
    },
    {
      "type": "paragraph",
      "text": "Perched on the eastern slopes of the central Western Ghats in southwestern Karnataka at elevations ranging from 900 to 1,750 meters, Kodagu (anglicized as Coorg) is a lush upland territory draped in perennial mist, dense tropical rainforests, and rolling coffee estates. Revered as a UNESCO World Heritage biodiversity hotspot, the district receives up to 4,000 millimeters of rainfall during the southwest monsoon, recharging mountain aquifers that feed South India's sacred lifeblood: the Kaveri (Cauvery) River."
    },
    {
      "type": "paragraph",
      "text": "The cultural fabric of Coorg is distinct from the surrounding Kannada-speaking plains. The indigenous Kodava people boast an ancient martial lineage, distinct linguistic heritage, and unique cultural customs. Unlike orthodox Hindu communities, Kodava social rituals do not employ Brahmin priests; weddings and ancestral rites are conducted by clan elders, and homes proudly venerate ancestral warriors alongside traditional hunting weapons."
    },
    {
      "type": "paragraph",
      "text": "The landscape of Coorg is fundamentally agricultural, but in a uniquely harmonious manner: coffee is cultivated exclusively under a two-tiered canopy of native hardwood shade trees—such as rosewood, wild fig, and silver oak—intertwined with climbing vines of black pepper and cardamom."
    },
    {
      "type": "paragraph",
      "text": "The best time to visit spans from October to March, when the air is crisp, waterfalls roar with post-monsoon vitality, and white coffee blossoms emit a sweet, jasmine-like fragrance across the valleys in early spring."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Trekking Regulation: Trekking Tadiandamol, the highest peak in Coorg (1,748 m), requires online advance booking through the Karnataka Forest Department portal (aranya.gov.in) to prevent ecological overcrowding."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Bean and the Vine: Shade-Grown Agroforestry"
    },
    {
      "type": "paragraph",
      "text": "India is the only country in the world where 100 percent of coffee is cultivated under shade trees, and Kodagu produces more than thirty-five percent of the national harvest. Exploring a working coffee plantation allows travelers to understand this intricate agroforestry ecosystem."
    },
    {
      "type": "paragraph",
      "text": "Two primary species of coffee are grown across the district: Coffea arabica (Arabica), flourishing at higher elevations above 1,000 meters and prized for its aromatic acidity and complex flavor, and Coffea canephora (Robusta), thriving at lower altitudes with bold body and high caffeine content."
    },
    {
      "type": "paragraph",
      "text": "The shade-grown canopy serves as a critical biodiversity corridor. Wild Asian elephants, Malabar giant squirrels, barking deer, and over 300 bird species travel through the plantations, feeding on wild fruits and controlling insect pests naturally."
    },
    {
      "type": "paragraph",
      "text": "Harvesting takes place between December and March: skilled teams hand-pick bright crimson coffee cherries, which are then either wet-pulped and washed or sun-dried on vast brick drying yards before being hulled, sorted, and roasted."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85",
      "alt": "Ripe red coffee cherries hanging on green leafy branches under tropical shade trees in a Coorg estate",
      "caption": "Coorg's shade-grown coffee agroforestry shelters endemic wildlife while producing world-renowned Arabica beans."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Attraction / Site",
        "Location",
        "Altitude",
        "Key Highlight",
        "Visiting Tip"
      ],
      "tableRows": [
        [
          "Talacauvery & Bhagamandala",
          "Brahmagiri Hills",
          "1,276 m",
          "Sacred origin of River Kaveri, temple tank",
          "Dress modestly; remove footwear"
        ],
        [
          "Tadiandamol Peak",
          "Southern Coorg",
          "1,748 m",
          "Highest peak in Coorg, shola forest trek",
          "Book forest permit online; carry water"
        ],
        [
          "Abbey Falls",
          "Near Madikeri",
          "1,050 m",
          "Roaring waterfall inside coffee plantation",
          "Paved walkway; swimming prohibited"
        ],
        [
          "Namdroling Monastery",
          "Bylakuppe",
          "850 m",
          "Golden Temple of Tibetan exile settlement",
          "Admire 40-foot gilded Buddha statues"
        ],
        [
          "Madikeri Fort & Palace",
          "Madikeri Town",
          "1,150 m",
          "17th-c. fortress, museum, panoramic views",
          "Good historical overview of Haleri kings"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Sacred Headwaters: Talacauvery and Brahmagiri"
    },
    {
      "type": "paragraph",
      "text": "High in the Brahmagiri Hills, forty-eight kilometers west of Madikeri, lies Talacauvery—the sacred birthplace of the River Kaveri. In Hindu tradition, Kaveri is revered as the 'Ganga of the South', a divine river goddess whose waters nurture millions of farmers across Karnataka and Tamil Nadu."
    },
    {
      "type": "paragraph",
      "text": "At the shrine, a small stone masonry tank (kundike) marks the spot where the river bubbles up from an underground spring before disappearing subterraneanly to emerge miles down the mountain valley. Every year in mid-October, the Tula Sankramana festival draws tens of thousands of pilgrims to witness the auspicious moment when the water is said to surge miraculously from the spring."
    },
    {
      "type": "paragraph",
      "text": "A steep flight of stone steps ascends directly behind the shrine to the summit of Brahmagiri peak, offering panoramic vistas across the forested ridges of the Western Ghats tumbling westward toward the Arabian Sea coast of Kerala."
    },
    {
      "type": "paragraph",
      "text": "Lower down the mountain at the confluence of the Kaveri, Kannike, and mythical Sujyoti rivers stands the Bhagandeshwara Temple in Bhagamandala, an ancient shrine constructed in the traditional Kerala architectural style with multi-tiered copper-tiled roofs and carved wooden gables."
    },
    {
      "type": "quote",
      "quote": "The Kaveri does not belong to any state or government; she is the mother whose milk sustains our children. Respect her source as you would your own mother.",
      "attribution": "Kodava Clan Elder, Talacauvery Trust Archives"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Kodava Gastronomy: Pandi Curry and Kadambuttu"
    },
    {
      "type": "paragraph",
      "text": "Culinary traditions in Coorg are celebrated for bold, robust flavors deeply distinct from the vegetarian temple fare of the surrounding Karnataka plains."
    },
    {
      "type": "paragraph",
      "text": "The signature dish is Pandi Curry (slow-cooked pork curry), flavored with an indispensable local ingredient: Kachampuli. Kachampuli is a thick, dark vinegar extracted from the boiled fermented juice of the wild Garcinia gummi-gutta fruit, providing an intense, fruity sourness and rich dark color that cuts through the richness of the meat."
    },
    {
      "type": "paragraph",
      "text": "Pandi curry is traditionally paired with Kadambuttu—steamed dumplings of broken rice rolled into smooth spheres—or Akki Rotti, thin unleavened flatbreads made from rice flour cooked on a hot griddle."
    },
    {
      "type": "paragraph",
      "text": "Other plantation specialties include spicy wild bamboo shoot curry (baimbale), wild mushroom roast gathered during monsoon rains, and sweet banana fritters (kakkada koli) flavored with cardamom and fresh coconut."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=85",
      "alt": "Traditional Kodava meal with spicy dark pandi curry served alongside white steamed kadambuttu rice balls",
      "caption": "Pandi Curry draws its iconic dark hue and tang from Kachampuli, a vinegar made from wild Garcinia fruit."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Plantation Homestays and Conservation Ethics"
    },
    {
      "type": "paragraph",
      "text": "The best way to experience Kodagu is by staying in an authentic plantation homestay managed by a local Kodava family. Homestays offer intimate immersion into family traditions, home-cooked regional feasts, and personalized walking tours through private coffee and pepper estates."
    },
    {
      "type": "paragraph",
      "text": "Travelers must remain mindful of human-wildlife coexistence. Because coffee estates border reserve forests like Nagarahole and Brahmagiri, wild elephant herds frequently traverse plantations during early morning and evening hours. Never wander unescorted through coffee estates after dark, and heed local estate warnings regarding elephant movements."
    },
    {
      "type": "paragraph",
      "text": "Support forest conservation by staying on designated trekking trails, hiring local eco-guides, and purchasing single-origin estate coffee directly from local growers' cooperatives."
    },
    {
      "type": "paragraph",
      "text": "By respecting local clan customs and cherishing the delicate balance between sustainable agriculture and wild forest ecosystems, you help preserve the verdant soul of Kodagu."
    },
    {
      "type": "list",
      "items": [
        "Book your plantation homestay in advance to secure authentic family hospitality and estate walks.",
        "Obtain trekking permits online via the Karnataka Forest Department portal for Tadiandamol peak.",
        "Never wander through coffee estates unguided after dusk due to active wild elephant corridors.",
        "Purchase authentic Kachampuli vinegar and whole black peppercorns directly from local grower shops.",
        "Visit the Namdroling Golden Temple in nearby Bylakuppe to witness Tibetan monastic rituals."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "India",
    "Coorg",
    "Karnataka",
    "Coffee",
    "Western Ghats",
    "Plantations",
    "Trekking"
  ],
  "references": [
    {
      "title": "Karnataka Tourism Official Coorg Portal",
      "url": "https://www.karnatakatourism.org/tour-item/kodagu/"
    },
    {
      "title": "Coffee Board of India Official Research Directorate",
      "url": "https://www.coffeeboard.gov.in/"
    }
  ],
  "sources": [
    {
      "title": "Karnataka Tourism Official Coorg Portal",
      "url": "https://www.karnatakatourism.org/tour-item/kodagu/"
    },
    {
      "title": "Coffee Board of India Official Research Directorate",
      "url": "https://www.coffeeboard.gov.in/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "INR",
    "budgetAssumptions": "Calculated for plantation retreat travelers: INR 3,000 - 6,500 per day including historic coffee estate homestay, guided spice plantation walks, trekking permits, and traditional Kodava meals.",
    "officialSources": [
      {
        "title": "Karnataka Tourism Kodagu Guide",
        "url": "https://www.karnatakatourism.org/"
      },
      {
        "title": "Karnataka Forest Department Eco-Tourism",
        "url": "https://aranya.gov.in/"
      }
    ],
    "visaVerification": "Domestic travelers require standard government photo ID. Foreign visitors require valid Indian visa/e-Visa. Trekking permits for peaks like Tadiandamol must be booked via Karnataka Forest Department portals.",
    "transportAssumptions": "Mysuru Airport (MYQ) is 120 km east; Kannur International Airport (CNN) is 90 km southwest; Bengaluru Kempegowda (BLR) is 260 km. Private car or KSRTC Airavat luxury buses connect cities to Madikeri."
  },
  "seo": {
    "metaTitle": "Coorg: The Coffee Plantations and Western Ghats | MyJourney",
    "metaDescription": "A lush highland guide to Kodagu (Coorg) in Karnataka's Western Ghats biodiversity hotspot, detailing shade-grown coffee agroforestry, Kodava martial heritage, sacred Talacauvery springs, and mountain trekking.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Oaxaca: Culinary Traditions and Indigenous Crafts",
  "slug": "oaxaca-culinary-traditions-and-indigenous-crafts",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A rich cultural and gastronomic travel guide to Oaxaca, Mexico, detailing the Seven Moles, artisanal mezcal palenques, Zapotec wool rug weaving in Teotitlán del Valle, and the pre-Columbian pyramids of Monte Albán.",
  "description": "A rich cultural and gastronomic travel guide to Oaxaca, Mexico, detailing the Seven Moles, artisanal mezcal palenques, Zapotec wool rug weaving in Teotitlán del Valle, and the pre-Columbian pyramids of Monte Albán.",
  "coverImage": "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "Vibrant colonial street in Oaxaca with colorful painted adobe facades and mountain peaks in the background",
  "coverImageCaption": "Oaxaca de Juárez serves as the cultural crossroads for sixteen distinct indigenous Mesoamerican cultures.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Land of the Seven Moles: Mesoamerican Crossroads"
    },
    {
      "type": "paragraph",
      "text": "Nestled in a high fertile valley of southern Mexico where the Sierra Madre del Sur and Sierra Madre de Oaxaca mountain ranges converge at an elevation of 1,550 meters, Oaxaca (officially Oaxaca de Juárez) is the undisputed culinary and indigenous soul of Mexico. Home to sixteen distinct indigenous peoples—predominantly the Zapotec and Mixtec nations—the state has preserved its pre-Columbian agricultural lifeways, languages, and artistic crafts with extraordinary resilience."
    },
    {
      "type": "paragraph",
      "text": "Inscribed as a UNESCO World Heritage site in 1987 alongside the ancient mountaintop pyramids of Monte Albán, the colonial center of Oaxaca is a marvel of green volcanic stone (cantera verde) architecture, shaded courtyards, and vibrant Baroque churches like the Templo de Santo Domingo de Guzmán."
    },
    {
      "type": "paragraph",
      "text": "Yet Oaxaca's most profound cultural expression is found on the plate. Known as 'The Land of the Seven Moles', the region boasts an ancient culinary heritage founded on the milpa—the ancestral Mesoamerican polyculture of corn, beans, and squash cultivated continuously for over seven thousand years."
    },
    {
      "type": "paragraph",
      "text": "The ideal travel season spans from October to March, when dry sunny days hover around 27 degrees Celsius, highlighted by the vibrant cultural celebrations of Día de los Muertos (Day of the Dead) in early November."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Village Colectivo Transit: Visiting artisan villages like Teotitlán del Valle (weaving) or San Bartolo Coyotepec (black pottery) is inexpensive and easy via shared maroon-and-white taxis (colectivos) departing from near the Central de Abastos."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Alchemy of Mole: Seven Master Sauces"
    },
    {
      "type": "paragraph",
      "text": "Mole is not a sauce; it is a sacred culinary ritual that embodies centuries of Mesoamerican tradition and Spanish colonial culinary fusion."
    },
    {
      "type": "paragraph",
      "text": "Oaxaca is celebrated for its Seven Classic Moles: Mole Negro (the rich, complex black mole made with charred chilhuacle chiles, Mexican dark chocolate, plantains, raisins, and roasted seeds), Mole Coloradito (brick-red, balanced with sesame and tomatoes), Mole Poblano, Mole Amarillo, Mole Verde (fresh with epazote, parsley, and tomatillos), Mole Manchamanteles ('tablecloth stainer' with sweet pineapple and apples), and Mole Chichilo."
    },
    {
      "type": "paragraph",
      "text": "Preparing authentic Mole Negro requires up to thirty distinct ingredients, roasted and stone-ground on a volcanic stone grinding slab (metate) over two full days of labor."
    },
    {
      "type": "paragraph",
      "text": "Visiting traditional markets like Mercado 20 de Noviembre and Mercado Benito Juárez allows travelers to taste these sauces spooned over slow-cooked turkey or chicken, alongside giant, crispy toasted corn tortillas (tlayudas) spread with rich unrefined pork lard (asiento), refried black beans, stringy quesillo cheese, and grilled cecina (spiced pork steak)."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
      "alt": "A bowl of rich glossy dark Mole Negro garnished with toasted sesame seeds served with fresh handmade corn tortillas",
      "caption": "Oaxaca's complex Mole Negro blends toasted chiles, seeds, spices, and chocolate ground on stone metates."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Craft / Tradition",
        "Village Location",
        "Raw Material",
        "Ancient Technique",
        "Master Community"
      ],
      "tableRows": [
        [
          "Zapotec Wool Weaving",
          "Teotitlán del Valle",
          "Churro sheep wool, cochineal",
          "Hand pedal-looms, natural dye vats",
          "Zapotec weavers"
        ],
        [
          "Barro Negro (Black Clay)",
          "San Bartolo Coyotepec",
          "Local dark clay",
          "Burnishing with quartz, sealed kiln firing",
          "Nieto family legacy"
        ],
        [
          "Artisanal Mezcal",
          "Santiago Matatlán",
          "Agave espadín, tobalá",
          "Underground pit roasting, copper pot stills",
          "Maestro Palenqueros"
        ],
        [
          "Alebrijes Carving",
          "San Martín Tilcajete",
          "Copal wood, mineral paint",
          "Intricate hand-carved mythical creatures",
          "Hernández artisans"
        ],
        [
          "Backstrap Loom Textiles",
          "Santo Tomás Jalieza",
          "Native raw cotton",
          "Ancient pre-Columbian backstrap looms",
          "Women's cooperative"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Teotitlán del Valle: The Natural Dye Masters"
    },
    {
      "type": "paragraph",
      "text": "Thirty kilometers east of Oaxaca City, nestled against the foothills of the Sierra, lies Teotitlán del Valle—an indigenous Zapotec village where weaving has been practiced continuously for over a thousand years."
    },
    {
      "type": "paragraph",
      "text": "The village has spearheaded a global revival of natural dyes, completely abandoning synthetic chemical colorants in favor of ancestral botanical and mineral sources. Artisans shear local sheep, card and spin the wool onto wooden drop spindles, and dye the skeins in simmering copper cauldrons."
    },
    {
      "type": "paragraph",
      "text": "The most prized pigment is cochineal (grana cochinilla)—a tiny parasitic scale insect that feeds on the nopal cactus. When crushed on a stone metate, the dried insects release carminic acid, producing vibrant shades of scarlet red. By altering the pH of the dye bath with lime juice, baking soda, or wood ash, master dyers transform cochineal into twenty distinct hues ranging from fiery orange to deep royal purple."
    },
    {
      "type": "paragraph",
      "text": "The weavers work on large wooden pedal looms, hand-weaving intricate geometric rugs (tapetes) featuring Zapotec mythological motifs: the diamond of the four cardinal directions, the stepped grecas of Mitla representing the cycle of life, and celestial feathered serpents."
    },
    {
      "type": "quote",
      "quote": "When we weave, we are not making carpets; we are speaking the Zapotec language through wool, color, and geometric mathematics.",
      "attribution": "Master Weaver Demetrio Bautista Lazo, Teotitlán del Valle"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Elixir of the Gods: Artisanal Mezcal"
    },
    {
      "type": "paragraph",
      "text": "Oaxaca is the undisputed global epicenter of Mezcal—the artisanal distilled spirit crafted from the roasted heart (piña) of the agave plant. Unlike industrial tequila, which is mass-produced from a single cultivated agave species (blue agave) in autoclaves, traditional mezcal is a wild, handcrafted agro-ecological spirit."
    },
    {
      "type": "paragraph",
      "text": "Traveling through the dry agave-studded valleys around Santiago Matatlán—the 'World Capital of Mezcal'—brings visitors to family-run, open-air distilleries known as palenques."
    },
    {
      "type": "paragraph",
      "text": "The artisanal process has remained unchanged for centuries: mature agaves (aged eight to thirty years, including wild varieties like Tobalá, Tepeztate, and Arroqueño) are harvested by jimadores using sharp coas. The giant piñas are roasted for five days in conical stone-lined underground pits fueled by encino oak wood, imparting their signature rich, smoky complexity."
    },
    {
      "type": "paragraph",
      "text": "The caramelized agave is crushed using a horse-drawn circular stone mill (tahona), fermented naturally with wild airborne yeasts in open wooden vats (tinas), and distilled twice in rustic wood-fired copper pot stills. Tasting mezcal with a Maestro Mezcalero—sipping it slowly, neat, accompanied by orange slices and worm salt (sal de gusano)—is a masterclass in terroir."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=85",
      "alt": "Blue-green agave plants growing in neat rows across the sunny arid valleys of Oaxaca",
      "caption": "Wild and cultivated agaves mature for up to thirty years before being harvested for artisanal mezcal roasting."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Monte Albán and Responsible Cultural Protocol"
    },
    {
      "type": "paragraph",
      "text": "Perched on a leveled mountaintop four hundred meters above the valley floor stands Monte Albán, the grand ceremonial capital of the Zapotec civilization for over a millennium (500 BCE to 850 CE). Exploring its vast Grand Plaza, stepped ball courts, and the mysterious carved stone reliefs of Los Danzantes provides an awe-inspiring encounter with pre-Columbian urban planning and astronomy."
    },
    {
      "type": "paragraph",
      "text": "When purchasing textiles, pottery, and crafts in indigenous villages, recognize the immense generational skill and labor invested in every piece. Avoid aggressive price haggling; fair prices directly sustain rural indigenous families and preserve ancient craft guilds."
    },
    {
      "type": "paragraph",
      "text": "Always ask permission before photographing indigenous market vendors and master artisans, particularly in traditional markets where photography can be considered spiritually intrusive."
    },
    {
      "type": "paragraph",
      "text": "Support local community ecotourism enterprises, such as the Pueblos Mancomunados in the high Sierra Norte, where indigenous villages operate community-owned hiking cabins, suspension bridges, and cloud forest guided walks."
    },
    {
      "type": "list",
      "items": [
        "Visit the bustling Mercado 20 de Noviembre to sample authentic Oaxacan tlayudas, tasajo, and mole.",
        "Spend a full day visiting Zapotec artisan villages (Teotitlán del Valle for rugs; San Bartolo for pottery).",
        "Book a certified mezcal tasting tour to family palenques in Santiago Matatlán to understand artisanal production.",
        "Visit the archaeological site of Monte Albán early in the morning (08:00 AM) before midday heat.",
        "Support fair trade by purchasing handicrafts directly from the artisan families who weave and carve them."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "International",
    "Oaxaca",
    "Mexico",
    "Culinary",
    "Mezcal",
    "Indigenous Crafts",
    "UNESCO"
  ],
  "references": [
    {
      "title": "Oaxaca State Tourism Secretariat (SECTUR Oaxaca)",
      "url": "https://www.oaxaca.travel/"
    },
    {
      "title": "National Institute of Anthropology and History (INAH Mexico)",
      "url": "https://www.inah.gob.mx/"
    }
  ],
  "sources": [
    {
      "title": "Oaxaca State Tourism Secretariat (SECTUR Oaxaca)",
      "url": "https://www.oaxaca.travel/"
    },
    {
      "title": "National Institute of Anthropology and History (INAH Mexico)",
      "url": "https://www.inah.gob.mx/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "MXN",
    "budgetAssumptions": "Calculated for cultural travelers: MXN 1,400 - 3,200 per day including boutique colonial hotel or B&B in Centro Histórico, artisan village colectivo transit, museum tickets, and authentic market dining.",
    "officialSources": [
      {
        "title": "SECTUR Oaxaca Portal",
        "url": "https://www.oaxaca.travel/"
      },
      {
        "title": "INAH Monte Albán Official Site",
        "url": "https://inah.gob.mx/zonas/103-zona-arqueologica-de-monte-alban"
      }
    ],
    "visaVerification": "Citizens of USA, Canada, EU/EEA, UK, Japan, and Australia enter Mexico visa-free for up to 180 days with standard tourist card (FMM). Other nationalities require Mexican tourist visa.",
    "transportAssumptions": "Oaxaca International Airport (OAX) is 8 km south of the city center. City center is walkable; regional artisan villages (Teotitlán, San Bartolo) accessible via shared taxis (colectivos) or private driver."
  },
  "seo": {
    "metaTitle": "Oaxaca: Culinary Traditions and Indigenous Crafts | MyJourney",
    "metaDescription": "A rich cultural and gastronomic travel guide to Oaxaca, Mexico, detailing the Seven Moles, artisanal mezcal palenques, Zapotec wool rug weaving in Teotitlán del Valle, and the pre-Columbian pyramids of Monte Albán.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Pondicherry: The French Quarter and Auroville",
  "slug": "pondicherry-the-french-quarter-and-auroville",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A coastal heritage and architectural journey through Puducherry, exploring the colonial grid of White Town, Tamil heritage mansions, the experimental utopian township of Auroville, and Bay of Bengal cycling routes.",
  "description": "A coastal heritage and architectural journey through Puducherry, exploring the colonial grid of White Town, Tamil heritage mansions, the experimental utopian township of Auroville, and Bay of Bengal cycling routes.",
  "coverImage": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "Pastel yellow colonial French mansion with arched shuttered windows and blooming pink bougainvillea in White Town Pondicherry",
  "coverImageCaption": "White Town preserves French colonial villas characterized by yellow ochre facades, inner courtyards, and wrought-iron balconies.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The French Riviera of the East: A Dual Heritage"
    },
    {
      "type": "paragraph",
      "text": "Situated along the Coromandel Coast of the Bay of Bengal, Puducherry (affectionately known as Pondy) preserves an extraordinary Franco-Tamil architectural and cultural duality. Administered as a French colonial trading outpost for nearly three centuries until its peaceful transfer to the Indian Union in 1954, the historic seaside town was planned according to an uncompromising urban grid bisected by an old canal canal."
    },
    {
      "type": "paragraph",
      "text": "East of the canal facing the sea lies the 'French Quarter' (Ville Blanche or White Town), characterized by cobblestone avenues lined with neoclassical colonial villas painted in soft mustard yellow and pastel hues, arched carriage gates, wooden louvered shutters, and overflowing cascades of magenta bougainvillea."
    },
    {
      "type": "paragraph",
      "text": "West of the canal unfolds the vibrant 'Tamil Quarter' (Ville Noire), characterized by traditional Tamil vernacular architecture: continuous street verandas (thinnai) supported by carved teakwood pillars, ornate wooden doorways, and high-ceilinged courtyards designed for multi-generational communal living."
    },
    {
      "type": "paragraph",
      "text": "This architectural dialogue between European symmetry and Dravidian domestic warmth gives Pondicherry an enchanting, relaxed atmosphere unique in the subcontinent. The optimal visiting season spans from October to March, when coastal breezes temper the tropical heat."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Auroville Matrimandir Access: Visiting the inner meditation chamber of the Matrimandir requires booking in person at the Auroville Visitors Centre at least 2 to 3 days in advance. Same-day passes are not issued."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "White Town: Walking the Boulevards of History"
    },
    {
      "type": "paragraph",
      "text": "The best way to experience White Town is aboard a rented vintage single-speed bicycle early in the morning. Cycling along Rue Dumas, Rue Romain Rolland, and Rue Suffren reveals a tranquil European enclave where street names are inscribed on traditional blue-and-white enamel plaques."
    },
    {
      "type": "paragraph",
      "text": "Along Goubert Avenue—the wide seaside Promenade that borders the Bay of Bengal—motorized vehicular traffic is strictly banned between 18:00 and 07:30 daily, converting the waterfront into a vibrant pedestrian piazza where locals and visitors gather to watch the waves crash against black volcanic seawall boulders."
    },
    {
      "type": "paragraph",
      "text": "Prominent historical landmarks include the French Consulate General (one of the few diplomatic posts operating in a non-capital city), the nineteenth-century Eglise de Notre Dame des Anges with its pastel pink Greco-Roman facade, and the Basilica of the Sacred Heart of Jesus featuring magnificent stained glass panels illustrating biblical narratives."
    },
    {
      "type": "paragraph",
      "text": "At the spiritual core of White Town lies the Sri Aurobindo Ashram, founded in 1926 by the revolutionary philosopher Sri Aurobindo and his spiritual collaborator Mirra Alfassa ('The Mother'). Visitors enter a quiet, tree-shaded courtyard to pay silent homage at the marble Samadhi, constantly adorned with intricate floral mandalas."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
      "alt": "A tranquil cobblestone street in White Town Pondicherry lined with colonial villas and French name plaques",
      "caption": "White Town's historic French Quarter features classical colonial architecture, shuttered balconies, and bougainvillea."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Heritage Attraction",
        "Quarter",
        "Distinctive Feature",
        "Key Highlight",
        "Transit Mode"
      ],
      "tableRows": [
        [
          "Promenade Beach",
          "White Town",
          "1.5 km seaside boulevard",
          "Pedestrian-only evenings, Gandhi statue",
          "Walking / Bicycle"
        ],
        [
          "Sri Aurobindo Ashram",
          "White Town",
          "Spiritual sanctuary",
          "Marble Samadhi, tranquil courtyard",
          "Strict silence; shoes off"
        ],
        [
          "Matrimandir",
          "Auroville (12 km north)",
          "Golden geodesic sphere",
          "Inner crystal meditation chamber",
          "Advance booking mandatory"
        ],
        [
          "Sacred Heart Basilica",
          "South Boulevard",
          "Gothic Revival church",
          "Stained-glass windows, soaring spires",
          "10-minute cycle from Beach"
        ],
        [
          "Goubert Market",
          "Tamil Quarter",
          "Historic 18th-c. market",
          "Fresh flowers, spices, fish stalls",
          "Walking; bustling atmosphere"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Auroville: The City of Dawn and the Golden Sphere"
    },
    {
      "type": "paragraph",
      "text": "Twelve kilometers north of Pondicherry, surrounded by rejuvenated tropical dry evergreen forest, lies Auroville—an experimental international township founded in 1968 by Mirra Alfassa under the charter that 'Auroville belongs to nobody in particular. Auroville belongs to humanity as a whole.'"
    },
    {
      "type": "paragraph",
      "text": "Today, Auroville is home to over 3,000 residents from sixty nations, functioning as a living laboratory for sustainable architecture, reforestation, organic farming, renewable energy, and cooperative community living."
    },
    {
      "type": "paragraph",
      "text": "At the physical and spiritual center of the township stands the Matrimandir ('The Soul of the City'), a monumental golden geodesic sphere clad in 1,415 gold-leaf-gilded stainless steel discs. Inside lies an austere, white-marble Inner Chamber completely free from religious iconography, incense, or speech."
    },
    {
      "type": "paragraph",
      "text": "At the center of the chamber rests a 70-centimeter optically perfect crystal sphere crafted by Carl Zeiss, illuminated from above by a single ray of natural sunlight channeled through a heliostat mirror in the roof, creating a space of profound contemplative stillness."
    },
    {
      "type": "quote",
      "quote": "Auroville is intended to be a universal township where men and women of all countries are able to live in peace and progressive harmony, above all creeds, all politics, and all nationalities.",
      "attribution": "The Mother (Mirra Alfassa), Auroville Foundation Charter (1968)"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Franco-Tamil Gastronomy: The Creole Palette"
    },
    {
      "type": "paragraph",
      "text": "Pondicherry's culinary landscape is an exquisite synthesis of classical French culinary technique and fragrant Tamil spices, giving rise to authentic Pondicherrian Creole cuisine."
    },
    {
      "type": "paragraph",
      "text": "Unlike standard continental dining, local Creole cooking utilizes coconut milk, tamarind, curry leaves, and regional spices like aniseed and cinnamon to elevate French-style seafood stews and roasts. Specialties include Meen Puiyabaise (a local adaptation of French bouillabaisse using local red snapper and turmeric) and Vadouvan (a French-influenced spice blend of shallots, garlic, and fenugreek aged in castor oil)."
    },
    {
      "type": "paragraph",
      "text": "Mornings in White Town begin with freshly baked croissants, baguettes, and pain au chocolat from historic French bakeries like Baker Street, paired with rich South Indian filter coffee."
    },
    {
      "type": "paragraph",
      "text": "In the Tamil Quarter, heritage eateries serve steaming idlis, crispy ghee roasts, and spicy Chettinad curries on fresh plantain leaves, accompanied by cooling bowls of curd rice and tangy lemon rasam."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=85",
      "alt": "A tranquil open-air courtyard cafe in Pondicherry with mosaic tiled tables, potted palms, and fresh croissants",
      "caption": "Pondicherry's courtyard cafes blend French patisserie traditions with fresh South Indian filter coffee."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Sustainable Cycling and Coastal Etiquette"
    },
    {
      "type": "paragraph",
      "text": "Puducherry's compact layout makes it one of the most pedestrian- and bicycle-friendly destinations in India. Renting a classic bicycle from local community enterprises supports green mobility and prevents traffic congestion in the historic quarters."
    },
    {
      "type": "paragraph",
      "text": "When visiting Auroville, respect its identity as an active intentional community rather than a tourist theme park. Keep to designated visitor paths, refrain from entering private residential communities uninvited, and honor the silent contemplative atmosphere of the Matrimandir gardens."
    },
    {
      "type": "paragraph",
      "text": "Support local non-profit and artisan enterprises, such as Auroville's handmade paper factory, spirulina farms, and fair-trade organic cotton cooperatives."
    },
    {
      "type": "paragraph",
      "text": "By exploring on two wheels, respecting heritage conservation guidelines, and savoring the unhurried coastal rhythm, you experience the timeless grace of Pondicherry."
    },
    {
      "type": "list",
      "items": [
        "Rent a vintage bicycle or explore on foot; White Town's historic grid is designed for slow human movement.",
        "Book your Matrimandir meditation pass in person at the Auroville Visitors Centre several days ahead.",
        "Respect the pedestrian-only hours on the Beach Promenade between 18:00 and 07:30 daily.",
        "Sample authentic Franco-Tamil Creole seafood stews in converted heritage courtyards.",
        "Maintain absolute silence inside the Sri Aurobindo Ashram and Matrimandir meditation grounds."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "India",
    "Pondicherry",
    "French Quarter",
    "Auroville",
    "Heritage",
    "Architecture",
    "Tamil Nadu"
  ],
  "references": [
    {
      "title": "Pondicherry Tourism Development Corporation (PTDC)",
      "url": "https://pondytourism.py.gov.in/"
    },
    {
      "title": "Auroville Foundation Official Portal",
      "url": "https://auroville.org/"
    }
  ],
  "sources": [
    {
      "title": "Pondicherry Tourism Development Corporation (PTDC)",
      "url": "https://pondytourism.py.gov.in/"
    },
    {
      "title": "Auroville Foundation Official Portal",
      "url": "https://auroville.org/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "INR",
    "budgetAssumptions": "Calculated for coastal heritage travelers: INR 2,800 - 6,000 per day including boutique heritage villa stay in White Town or Auroville guesthouse, vintage bicycle rentals, Matrimandir passes, and Franco-Tamil dining.",
    "officialSources": [
      {
        "title": "Puducherry Tourism Department",
        "url": "https://pondytourism.py.gov.in/"
      },
      {
        "title": "Auroville Visitor Centre",
        "url": "https://auroville.org/page/visiting"
      }
    ],
    "visaVerification": "Domestic travelers require standard government photo ID. Foreign tourists require valid Indian visa/e-Visa. Matrimandir inner chamber meditation requires prior in-person booking at Auroville Visitor Centre.",
    "transportAssumptions": "Chennai International Airport (MAA) is 150 km north (3 hours via East Coast Road). Puducherry (PDY) railway station connects to Chennai and Bengaluru. White Town is best explored on foot or by rented vintage bicycle."
  },
  "seo": {
    "metaTitle": "Pondicherry: The French Quarter and Auroville | MyJourney",
    "metaDescription": "A coastal heritage and architectural journey through Puducherry, exploring the colonial grid of White Town, Tamil heritage mansions, the experimental utopian township of Auroville, and Bay of Bengal cycling routes.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

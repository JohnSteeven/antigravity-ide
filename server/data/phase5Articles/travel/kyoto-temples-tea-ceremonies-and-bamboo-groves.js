"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Kyoto: Temples, Tea Ceremonies, and Bamboo Groves",
  "slug": "kyoto-temples-tea-ceremonies-and-bamboo-groves",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "An architectural, spiritual, and cultural guide to Kyoto, Japan's imperial capital for over a millennium, featuring Zen rock gardens, Fushimi Inari torii corridors, Arashiyama bamboo paths, and tea ceremony aesthetics.",
  "description": "An architectural, spiritual, and cultural guide to Kyoto, Japan's imperial capital for over a millennium, featuring Zen rock gardens, Fushimi Inari torii corridors, Arashiyama bamboo paths, and tea ceremony aesthetics.",
  "coverImage": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "Vibrant vermilion torii gates winding up the forested slopes of Mount Inari in Kyoto Japan",
  "coverImageCaption": "Kyoto's ten thousand vermilion torii gates at Fushimi Inari-Taisha span over 1,300 years of Shinto devotion.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Ancient Imperial Heart: Heian-Kyo's Millennial Soul"
    },
    {
      "type": "paragraph",
      "text": "Serving as the imperial capital of Japan from 794 to 1868 CE under the classical name Heian-Kyo ('Capital of Peace and Tranquility'), Kyoto is universally regarded as the cultural and spiritual fountainhead of Japanese civilization. Laid out on a geomantic Chinese Tang-dynasty grid bounded by sacred mountains on three sides and the Kamogawa River to the east, the city preserves over two thousand Buddhist temples, Shinto shrines, and imperial villas."
    },
    {
      "type": "paragraph",
      "text": "Miraculously spared from devastating aerial bombardment during the Second World War due to international appeals recognizing its irreplaceable cultural heritage, Kyoto remains an unbroken living museum. Inscribed as a collective UNESCO World Heritage site ('Historic Monuments of Ancient Kyoto'), the city balances ancient ritual with contemporary urban life."
    },
    {
      "type": "paragraph",
      "text": "In historic preservation districts like Gion, Pontocho, and Miyagawacho, geiko and maiko (apprentice geishas) glide along cobblestone lanes between traditional wooden machiya townhouses, their white-powdered faces and silk kimonos illuminated by the soft glow of red paper lanterns."
    },
    {
      "type": "paragraph",
      "text": "Visiting Kyoto demands attuning one's perception to seasonal Japanese aesthetics: cherry blossoms (sakura) in April, verdant moss gardens in summer rains, brilliant scarlet maple foliage (koyo) in November, and silent, snow-dusted temple eaves in winter."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Transit Convenience: Purchase a digital or physical ICOCA or Suica IC card. It operates seamlessly across Kyoto municipal subways, city buses, private Keihan and Hankyu rail lines, and local convenience stores."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Path of Ten Thousand Gates: Fushimi Inari-Taisha"
    },
    {
      "type": "paragraph",
      "text": "In southern Kyoto rises Mount Inari, home to Fushimi Inari-Taisha—the supreme head shrine of over thirty thousand Shinto sanctuaries dedicated to Inari Okami, the deity of rice, fertility, sake, and business prosperity."
    },
    {
      "type": "paragraph",
      "text": "Established in 711 CE before Kyoto became the imperial capital, the shrine is celebrated for its Senbon Torii—a breathtaking corridor of over ten thousand tightly packed, vermilion-lacquered wooden torii gates that wind four kilometers up the wooded slopes of the sacred mountain."
    },
    {
      "type": "paragraph",
      "text": "Each gate is a devotional offering donated by Japanese corporations and merchant families, bearing black-painted calligraphy recording the donor's name and dedication date. Flanking the paths are hundreds of stone statues of sacred fox messengers (kitsune), holding keys to the grain barns, jewels of wisdom, or scrolls in their jaws."
    },
    {
      "type": "paragraph",
      "text": "To experience the mystical silence of the mountain paths without dense tourist crowds, embark on the mountain ascent either before 07:00 AM at dawn or after 20:00 PM at night, when hanging iron lanterns cast dramatic geometric shadows across the vermilion tunnels."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85",
      "alt": "Tunnel of vermilion wooden torii gates winding up the forested hill of Fushimi Inari-Taisha in Kyoto",
      "caption": "Fushimi Inari's vermilion torii paths wind four kilometers up Mount Inari under a canopy of sacred cedar trees."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Monument / Site",
        "Location",
        "Open Hours",
        "Admission (JPY)",
        "Key Cultural Highlight"
      ],
      "tableRows": [
        [
          "Fushimi Inari-Taisha",
          "Fushimi Ward",
          "Open 24 hours",
          "Free",
          "10,000 torii gates, mountain hiking"
        ],
        [
          "Kinkaku-ji (Golden Pavilion)",
          "Northern Kyoto",
          "09:00 - 17:00",
          "JPY 500",
          "Top two floors covered in pure gold leaf"
        ],
        [
          "Ryoan-ji",
          "Northern Kyoto",
          "08:00 - 17:00",
          "JPY 600",
          "15-rock Zen dry landscape kare-sansui garden"
        ],
        [
          "Arashiyama Bamboo Grove",
          "Western Kyoto",
          "Open 24 hours",
          "Free",
          "Soaring emerald bamboo walkway"
        ],
        [
          "Kiyomizu-dera",
          "Higashiyama",
          "06:00 - 18:00",
          "JPY 400",
          "Cantilevered wooden stage, sacred Otowa spring"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Zen Landscapes: The Dry Stone Garden of Ryoan-ji"
    },
    {
      "type": "paragraph",
      "text": "Nowhere is the philosophical aesthetic of Zen Buddhism expressed more profoundly than in the dry landscape gardens (kare-sansui) of Kyoto. Foremost among them is Ryoan-ji ('The Temple of the Dragon at Peace'), established in 1450 by the Hosokawa clan."
    },
    {
      "type": "paragraph",
      "text": "The rectangular garden measures barely twenty-five meters by ten meters, surrounded by an ancient clay wall stained by boiled oil over five centuries. Contained within this austere frame is a bed of finely raked white granite gravel, punctuated by fifteen natural moss-ringed boulders arranged in five distinct clusters."
    },
    {
      "type": "paragraph",
      "text": "The composition embodies the aesthetic of wabi-sabi—finding beauty in imperfection, simplicity, and empty space. Remarkably, from whichever angle one sits along the temple's wooden veranda, only fourteen boulders are visible at any single moment; one stone remains hidden behind another."
    },
    {
      "type": "paragraph",
      "text": "According to Zen teaching, only those who attain complete spiritual enlightenment can perceive the invisible fifteenth rock through the eye of the mind. Sitting silently on the polished cedar terrace as morning light rakes across the gravel waves invites deep introspective stillness."
    },
    {
      "type": "quote",
      "quote": "The garden does not copy nature; it distills nature into its metaphysical essence of rock, moss, and emptiness.",
      "attribution": "Zen Master Muso Soseki, Ryoan-ji Monastic Records"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Way of Tea: Chado and Kaiseki Gastronomy"
    },
    {
      "type": "paragraph",
      "text": "Kyoto is the historic cradle of Chado (The Way of Tea), refined in the sixteenth century by the legendary tea master Sen no Rikyu. Far more than beverage preparation, the Japanese tea ceremony is a complete philosophical synthesis of architecture, ceramics, flower arrangement, calligraphy, and hospitality governed by four cardinal principles: Harmony (wa), Respect (kei), Purity (sei), and Tranquility (jaku)."
    },
    {
      "type": "paragraph",
      "text": "Participating in an authentic ceremony inside a traditional chashitsu (tea pavilion) requires entering through a low sliding door (nijiriguchi) that forces every guest to crawl inside on their knees—a deliberate design forcing samurai warriors to leave their swords outside and enter as equals."
    },
    {
      "type": "paragraph",
      "text": "The host meticulously prepares vibrant green powdered matcha using a bamboo whisk (chasen) and hot water drawn from an iron kettle (kama), serving it alongside delicate seasonal sugar confections (wagashi) that balance the tea's pleasant vegetal bitterness."
    },
    {
      "type": "paragraph",
      "text": "This devotion to culinary refinement reaches its zenith in Kaiseki Ryori—traditional multi-course haute cuisine developed from the ceremonial meals served before tea gatherings. Using seasonal ingredients harvested that very morning from surrounding hills—such as bamboo shoots, sweetfish (ayu), and Kyoto heirloom vegetables (kyo-yasai)—each dish is a miniature artistic composition celebrating the fleeting seasons."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=85",
      "alt": "Japanese tea master whisking vibrant green matcha tea inside a minimalist tatami mat room in Kyoto",
      "caption": "The Japanese tea ceremony (Chado) elevates hospitality, ceramics, and mindfulness into a meditative art."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Cultural Etiquette and Overtourism Awareness"
    },
    {
      "type": "paragraph",
      "text": "In recent years, Kyoto has experienced intense overtourism, particularly in historic neighborhoods like Gion and Arashiyama. Preserving the city's dignity requires heightened mindfulness from foreign travelers."
    },
    {
      "type": "paragraph",
      "text": "In Gion, photography is strictly prohibited on private residential side streets; never chase, surround, or touch geiko or maiko walking to appointments. Violating local municipal privacy ordinances carries on-the-spot fines of JPY 10,000."
    },
    {
      "type": "paragraph",
      "text": "When entering temples and traditional ryokans, always remove shoes at the genkan (threshold) and step onto tatami mats only in clean socks or bare feet—never wear outdoor shoes or rubber slippers on straw mats. Speak in hushed, quiet tones inside temple courtyards."
    },
    {
      "type": "paragraph",
      "text": "Support sustainable tourism by visiting popular shrines like Fushimi Inari and Kiyomizu-dera during early morning hours, exploring lesser-known northern temples like Daitoku-ji and Enko-ji, and properly sorting waste into municipal recycling receptacles."
    },
    {
      "type": "list",
      "items": [
        "Purchase an ICOCA or Suica card for seamless transit across Kyoto subways, buses, and regional trains.",
        "Respect privacy laws in Gion: photography on private residential alleys is strictly prohibited.",
        "Remove shoes at temple thresholds; walk on traditional straw tatami mats only in socks or bare feet.",
        "Visit Arashiyama Bamboo Grove and Fushimi Inari at dawn to experience tranquil morning silence.",
        "Carry personal trash back to your hotel; public trash cans are rare across Japanese cities."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "International",
    "Kyoto",
    "Japan",
    "Temples",
    "Zen",
    "Culture",
    "UNESCO"
  ],
  "references": [
    {
      "title": "Kyoto City Official Travel Guide",
      "url": "https://kyoto.travel/en/"
    },
    {
      "title": "Japan National Tourism Organization (JNTO)",
      "url": "https://www.japan.travel/en/"
    }
  ],
  "sources": [
    {
      "title": "Kyoto City Official Travel Guide",
      "url": "https://kyoto.travel/en/"
    },
    {
      "title": "Japan National Tourism Organization (JNTO)",
      "url": "https://www.japan.travel/en/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "JPY",
    "budgetAssumptions": "Calculated for cultural independent travelers: JPY 14,000 - 28,000 per day including traditional machiya or ryokan stay, Kansai transit passes, temple entry fees, and seasonal kaiseki or ramen dining.",
    "officialSources": [
      {
        "title": "Kyoto City Tourism Association",
        "url": "https://kyoto.travel/en/"
      },
      {
        "title": "West Japan Railway Company (JR-West)",
        "url": "https://www.westjr.co.jp/global/en/"
      }
    ],
    "visaVerification": "Visa exemption for citizens of 70+ countries for up to 90 days. Other travelers require standard Japanese tourist visa with pre-approved itinerary and tax declaration.",
    "transportAssumptions": "Kansai International Airport (KIX) is 75 minutes away via JR Haruka Limited Express. Kyoto City Bus & Subway 1-Day Pass (JPY 1,100) or rechargeable IC cards (ICOCA/Suica) navigate municipal transit."
  },
  "seo": {
    "metaTitle": "Kyoto: Temples, Tea Ceremonies, and Bamboo Groves | MyJourney",
    "metaDescription": "An architectural, spiritual, and cultural guide to Kyoto, Japan's imperial capital for over a millennium, featuring Zen rock gardens, Fushimi Inari torii corridors, Arashiyama bamboo paths, and tea ceremony aesthetics.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

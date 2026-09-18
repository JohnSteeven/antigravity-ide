"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Amritsar: The Golden Temple and Punjabi Hospitality",
  "slug": "amritsar-the-golden-temple-and-punjabi-hospitality",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A profound spiritual and cultural exploration of Amritsar, the holy city of Sikhism, featuring the illuminated Harmandir Sahib, the selfless service of the world's largest community kitchen (Langar), and historic border logistics.",
  "description": "A profound spiritual and cultural exploration of Amritsar, the holy city of Sikhism, featuring the illuminated Harmandir Sahib, the selfless service of the world's largest community kitchen (Langar), and historic border logistics.",
  "coverImage": "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "The illuminated Golden Temple (Harmandir Sahib) reflecting upon the sacred pool of nectar in Amritsar at night",
  "coverImageCaption": "Harmandir Sahib's gold-plated sanctum was designed with entrances on all four sides to welcome humanity equally.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Pool of Nectar: Spiritual Capital of the Sikh Faith"
    },
    {
      "type": "paragraph",
      "text": "Founded in 1577 by Guru Ram Das, the fourth Sikh Guru, Amritsar—translating as 'The Pool of the Nectar of Immortality'—is the spiritual and cultural heart of Sikhism. Located in the fertile plains of Punjab just twenty-eight kilometers from the international border with Pakistan, the city embodies a profound spiritual ethos centered on selfless service (seva), human equality, and martial courage."
    },
    {
      "type": "paragraph",
      "text": "The focal point of the city is Sri Harmandir Sahib (The Golden Temple), a breathtaking sanctuary constructed in the center of a vast square water tank (sarovar). In 1588, Guru Arjan Dev initiated a radical theological statement by inviting the renowned Sufi saint Hazrat Mian Mir of Lahore to lay the cornerstone of the temple, establishing an enduring commitment to interfaith harmony."
    },
    {
      "type": "paragraph",
      "text": "Unlike traditional Hindu temples that were historically elevated on high plinths, the Harmandir Sahib was deliberately built at a lower level than the surrounding city, requiring pilgrims to step downward in symbolic humility. Furthermore, the sanctum features open doorways on all four cardinal directions, signifying that men and women of all castes, creeds, and nationalities are equally welcome."
    },
    {
      "type": "paragraph",
      "text": "Amritsar experiences dramatic seasonal contrasts: blistering summers give way to cool, invigorating winters from October to March, when daytime temperatures hover around 20 degrees Celsius, ideal for spiritual contemplation and culinary walks."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Sanctuary Protocol: Before entering the Golden Temple complex, all visitors must remove footwear, wash hands and feet in running water footbaths, and cover their heads completely with a scarf or bandana."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Harmandir Sahib: Architecture of Pure Devotion"
    },
    {
      "type": "paragraph",
      "text": "Approaching the Harmandir Sahib through the marble archways of the surrounding Parikrama (circumambulatory walkway) produces an unforgettable sense of peace. In the early nineteenth century, Maharaja Ranjit Singh, founder of the Sikh Empire, embellished the upper storeys of the sanctum with 400 kilograms of pure gold leaf and delicate marble inlay (pietra dura), giving the shrine its popular English name."
    },
    {
      "type": "paragraph",
      "text": "Connecting the marble perimeter to the central gilded sanctum is the Guru's Bridge (causeway), leading devotees into a three-story sanctuary filled with the melodious sound of continuous Gurbani Kirtan (devotional hymn singing). Accompanied by harmoniums, tablas, and traditional stringed instruments, Sikh ragis recite verses from the Guru Granth Sahib—the eternal living scripture of the Sikhs—from pre-dawn until late into the night."
    },
    {
      "type": "paragraph",
      "text": "Every evening, the sacred scripture is carried in an elaborate golden palanquin from the sanctum to the Akal Takht (the supreme temporal seat of Sikh authority) during the Sukhasan ceremony, surrounded by chanting devotees scattering rose petals."
    },
    {
      "type": "paragraph",
      "text": "At night, the illuminated golden structure reflects upon the black mirror of the sarovar under starry skies, creating a radiant vision of spiritual serenity unmatched anywhere in the world."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=85",
      "alt": "Devotees walking on the marble parikrama around the glowing Golden Temple in Amritsar",
      "caption": "Continuous Gurbani Kirtan echoes across the sacred sarovar, creating an atmosphere of deep spiritual serenity."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Monument / Site",
        "Significance",
        "Open Hours",
        "Highlights",
        "Visitor Guidance"
      ],
      "tableRows": [
        [
          "Harmandir Sahib",
          "Supreme Sikh spiritual shrine",
          "Open 24 hours daily",
          "Golden sanctum, sarovar, Akal Takht",
          "Head covered; shoes removed"
        ],
        [
          "Guru Ka Langar",
          "World's largest free kitchen",
          "Open 24 hours daily",
          "Free hot meals for 100,000 daily",
          "Sit cross-legged on floor mats"
        ],
        [
          "Jallianwala Bagh",
          "National freedom memorial",
          "06:30 - 19:30",
          "1919 massacre martyr well, bullet marks",
          "5-minute walk from Golden Temple"
        ],
        [
          "Wagah Border",
          "India-Pakistan border ceremony",
          "16:30 - 18:00",
          "Beating Retreat military drill",
          "Arrive by 15:00 for security seating"
        ],
        [
          "Partition Museum",
          "First museum on 1947 Partition",
          "10:00 - 18:00 (Closed Mon)",
          "Oral histories, survivor artifacts",
          "Located in historic Town Hall"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Guru Ka Langar: The Miracle of 100,000 Meals a Day"
    },
    {
      "type": "paragraph",
      "text": "Adjacent to the central shrine operates Guru Ka Langar—widely recognized as the largest free community kitchen in the world. Established by Guru Nanak, the founder of Sikhism, the institution of Langar was designed to dismantle rigid caste segregation by mandating that kings and outcasts sit shoulder-to-shoulder on the floor (pangat) to share the exact same meal."
    },
    {
      "type": "paragraph",
      "text": "Operating twenty-four hours a day, 365 days a year, the kitchen serves hot, nutritious vegetarian meals to an astonishing 80,000 to 100,000 people every single day, expanding to over 150,000 during major religious holidays like Baisakhi and Gurpurab."
    },
    {
      "type": "paragraph",
      "text": "The scale of operations is breathtaking: tons of whole wheat flour, lentils (dal), rice, and vegetables are processed daily using gigantic automated roti-making machines capable of baking 25,000 rotis per hour, alongside massive wood-fired cauldrons stirred with ladle oars."
    },
    {
      "type": "paragraph",
      "text": "Even more extraordinary is that this monumental logistical feat is powered entirely by voluntary labor (kar seva). Visitors of any background are welcomed warmly to join the volunteers: peeling mounds of garlic, rolling dough, stirring lentils, or washing thousands of stainless steel platters in soapy troughs."
    },
    {
      "type": "quote",
      "quote": "In the Langar hall, no one is superior and no one is inferior. When you eat together on the floor, the ego dissolves and common humanity remains.",
      "attribution": "Giani Harpreet Singh, Golden Temple Head Granthi"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Epicurean Feast: Kulchas, Lassi, and Dal Makhani"
    },
    {
      "type": "paragraph",
      "text": "Beyond its spiritual resonance, Amritsar is undisputed as the culinary capital of Punjab. Gastronomy here is hearty, uninhibited, and steeped in agricultural abundance."
    },
    {
      "type": "paragraph",
      "text": "The ultimate breakfast is the Amritsari Kulcha—a layered, crisp tandoor-baked flatbread stuffed with spiced mashed potatoes, onions, or cauliflower, crushed by hand to shatter its flaky crust, and drenched in homemade white butter (makhan). Paired with tangy chickpea curry (chole) and sliced pickled onions, it is an essential morning pilgrimage."
    },
    {
      "type": "paragraph",
      "text": "Down the narrow lanes of the old city, century-old sweet shops serve tall brass tumblers of thick, hand-churned sweet lassi topped with a dense dollop of clotted cream (malai), so rich it must be eaten with a spoon."
    },
    {
      "type": "paragraph",
      "text": "In the evening, food lovers flock to historic dhabas like Kesar Da Dhaba, established in 1916 in Lahore before moving to Amritsar after Partition. Here, the legendary Dal Makhani is slow-simmered in copper degchis for twelve continuous hours over smoldering coals, resulting in an incomparably velvety, smoky richness."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=85",
      "alt": "Golden crispy tandoori Amritsari kulchas served with spiced chickpeas, green chutney, and melting white butter",
      "caption": "Amritsari kulchas are hand-kneaded, baked in clay tandoors, and crushed with fresh churned butter."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Historic Memory and Cultural Protocol"
    },
    {
      "type": "paragraph",
      "text": "A short walk from the Golden Temple stands Jallianwala Bagh, the sacred national memorial marking the tragic massacre of April 13, 1919, when British colonial troops fired upon thousands of peaceful unarmed demonstrators. Preserved bullet marks on the red brick walls and the historic Martyr's Well offer a sobering encounter with the cost of Indian independence."
    },
    {
      "type": "paragraph",
      "text": "Equally vital is the Partition Museum inside the restored historic Town Hall, documenting the traumatic displacement of fourteen million people during the 1947 division of Punjab and Bengal through oral histories, letters, and survivor memorabilia."
    },
    {
      "type": "paragraph",
      "text": "In the late afternoon, travelers can drive thirty kilometers west to the Attari-Wagah border to witness the theatrical Beating Retreat ceremony, where Indian Border Security Force (BSF) and Pakistani Rangers conduct high-kicking, synchronized military drills before lowering national flags at sunset."
    },
    {
      "type": "paragraph",
      "text": "Amritsar embraces every visitor with open arms. By walking the pedestrian Heritage Street with reverence, participating humbly in temple seva, and savoring the generous spirit of the Punjabi people, travelers touch the living heart of Indian hospitality."
    },
    {
      "type": "list",
      "items": [
        "Keep your head covered at all times inside the Golden Temple complex; scarves are provided free at entrances.",
        "Dedicate at least one hour to volunteering (kar seva) in the community kitchen washing plates or chopping vegetables.",
        "Arrive at the Wagah Border by 15:00 to clear security and secure prime seating for the 16:30 Beating Retreat drill.",
        "Visit Jallianwala Bagh and the Partition Museum to understand Punjab's profound historical sacrifices.",
        "Walk the newly paved pedestrian Heritage Street connecting Town Hall to the Golden Temple for evening strolls."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "India",
    "Amritsar",
    "Punjab",
    "Golden Temple",
    "Sikhism",
    "Heritage",
    "Food"
  ],
  "references": [
    {
      "title": "Shiromani Gurdwara Parbandhak Committee (SGPC) Official Portal",
      "url": "https://www.sgpc.net/"
    },
    {
      "title": "Punjab Tourism Development Corporation",
      "url": "https://punjabtourism.punjab.gov.in/"
    }
  ],
  "sources": [
    {
      "title": "Shiromani Gurdwara Parbandhak Committee (SGPC) Official Portal",
      "url": "https://www.sgpc.net/"
    },
    {
      "title": "Punjab Tourism Development Corporation",
      "url": "https://punjabtourism.punjab.gov.in/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "INR",
    "budgetAssumptions": "Calculated for cultural/spiritual travelers: INR 2,000 - 4,500 per day including heritage hotel or Gurdwara Sarai stay near the Heritage Street, auto-rickshaw transit, Wagah Border excursion, and authentic Punjabi food.",
    "officialSources": [
      {
        "title": "SGPC Amritsar Official Site",
        "url": "https://www.sgpc.net/"
      },
      {
        "title": "Punjab Tourism Portal",
        "url": "https://punjabtourism.punjab.gov.in/"
      }
    ],
    "visaVerification": "Standard Indian visa or e-Visa for international visitors. Government photo ID required for Gurdwara accommodation and Wagah Border security gates.",
    "transportAssumptions": "Sri Guru Ram Dass Jee International Airport (ATQ) is 11 km from the city. Amritsar Junction (ASR) connects via Vande Bharat and Shatabdi express trains to Delhi. The Golden Temple Heritage Street is strictly pedestrian-only."
  },
  "seo": {
    "metaTitle": "Amritsar: The Golden Temple and Punjabi Hospitality | MyJourney",
    "metaDescription": "A profound spiritual and cultural exploration of Amritsar, the holy city of Sikhism, featuring the illuminated Harmandir Sahib, the selfless service of the world's largest community kitchen (Langar), and historic border logistics.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

"use strict";

const { buildCanonicalArticle } = require("../articleBuilder");

const articleConfig = {
  "title": "Seoul: Royal Palaces, Night Markets, and Modern Lanes",
  "slug": "seoul-royal-palaces-night-markets-and-modern-lanes",
  "category": "Travel",
  "categorySlug": "travel",
  "contentType": "article",
  "author": "MyJourney Editorial",
  "byline": "MyJourney Editorial",
  "excerpt": "A dynamic travel guide to Seoul, South Korea, navigating the Five Grand Joseon Palaces, Bukchon Hanok heritage alleys, late-night street food markets, and cutting-edge design hubs.",
  "description": "A dynamic travel guide to Seoul, South Korea, navigating the Five Grand Joseon Palaces, Bukchon Hanok heritage alleys, late-night street food markets, and cutting-edge design hubs.",
  "coverImage": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=85",
  "coverImageAlt": "Illuminated traditional curved wooden gate of Gyeongbokgung Palace with modern glass skyscrapers of Seoul in the background",
  "coverImageCaption": "Seoul seamlessly contrasts the 600-year-old Joseon royal palaces with hyper-modern smart infrastructure.",
  "structuredBlocks": [
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "The Dynamic Metropolis: 600 Years of Joseon Capital"
    },
    {
      "type": "paragraph",
      "text": "Situated in a dramatic mountain basin bisected by the mighty Han River, Seoul (officially Seoul Special City) has served as the political, cultural, and commercial capital of Korea since 1394, when King Taejo founded the Joseon Dynasty. Guided by ancient Confucian geomancy (pungsu-jiri), the historic city was positioned between four protective granite mountains: Bugaksan to the north, Namsan to the south, Naksan to the east, and Inwangsan to the west."
    },
    {
      "type": "paragraph",
      "text": "Today, Seoul represents one of the world's most exhilarating urban juxtapositions: 600-year-old wooden royal palaces, tranquil Confucian shrines, and preserved hanok alleyways coexist seamlessly alongside cutting-edge high-speed maglev transit, hyper-connected 5G infrastructure, and futuristic architectural icons like Zaha Hadid's Dongdaemun Design Plaza."
    },
    {
      "type": "paragraph",
      "text": "The city's vibrant rhythm is propelled by 'Ppalli-ppalli' (haste and efficiency), yet balanced by an enduring appreciation for slow reflection, communal gastronomy, and mountain hiking."
    },
    {
      "type": "paragraph",
      "text": "The optimal travel seasons are spring (April to May), when royal gardens are framed by blooming cherry blossoms and royal azaleas, and autumn (September to November), when crisp sunny skies illuminate the brilliant gold and crimson foliage of centuries-old ginkgo trees."
    },
    {
      "type": "callout",
      "calloutType": "note",
      "text": "Palace Free Entry Tip: Rent a traditional Korean Hanbok from licensed rental shops near Gyeongbokgung. Wearing a full hanbok grants free admission to all Five Grand Palaces and the Jongmyo Shrine."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Gyeongbokgung and Changdeokgung: Architecture of Harmony"
    },
    {
      "type": "paragraph",
      "text": "At the northern terminus of Gwanghwamun Plaza rises Gyeongbokgung ('Palace Greatly Blessed by Heaven'), the primary and largest of the Five Grand Palaces constructed by the Joseon Dynasty in 1395."
    },
    {
      "type": "paragraph",
      "text": "Entering through the massive Gwanghwamun gate, visitors can witness the ceremonial Changing of the Royal Guard (Sumunjang), conducted twice daily in vibrant red, blue, and yellow Joseon military uniforms to the beat of traditional drums. Within the central courtyard stands Geunjeongjeon (The Throne Hall), an imposing two-story wooden hall decorated with intricate dancheong (five-color decorative mineral painting) and surrounded by carved stone tier balustrades depicting the twelve signs of the Chinese zodiac."
    },
    {
      "type": "paragraph",
      "text": "A short walk east lies Changdeokgung ('Palace of Prospering Virtue'), inscribed as a UNESCO World Heritage site for its extraordinary ecological harmony with the surrounding landscape. Unlike Gyeongbokgung's strict symmetrical axis, Changdeokgung was designed to follow the natural contours of the forested slopes."
    },
    {
      "type": "paragraph",
      "text": "The jewel of Changdeokgung is the Huwon (The Secret Garden)—a serene seventy-eight-acre landscaped pleasure pavilion containing lotus ponds, century-old walnut trees, and open-air reading pavilions where Joseon kings studied philosophy and wrote poetry. Access to the Secret Garden is restricted to timed guided tours to preserve its delicate ecosystem."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=85",
      "alt": "Intricately carved painted wooden eaves of Geunjeongjeon throne hall at Gyeongbokgung Palace in Seoul",
      "caption": "Joseon palace architecture utilizes Dancheong mineral painting to protect wooden timber eaves from weather and insects."
    },
    {
      "type": "table",
      "tableHeaders": [
        "Royal Monument / Site",
        "Location",
        "Joseon Significance",
        "Key Highlight",
        "Visiting Protocol"
      ],
      "tableRows": [
        [
          "Gyeongbokgung Palace",
          "Jongno-gu",
          "Primary royal palace (1395)",
          "Changing of Guard, Gyeonghoeru Pavilion",
          "Closed TUESDAYS; free in Hanbok"
        ],
        [
          "Changdeokgung & Secret Garden",
          "Jongno-gu",
          "UNESCO royal palace",
          "Huwon Secret Garden, Buyongjeong pond",
          "Closed MONDAYS; advance tour booking"
        ],
        [
          "Bukchon Hanok Village",
          "Between Palaces",
          "Historic noble residential quarter",
          "Preserved tiled hanok alleys",
          "Quiet hours strictly enforced (residential)"
        ],
        [
          "Gwangjang Market",
          "Jongno-5ga",
          "Historic 1905 covered market",
          "Bindaetteok, mayak gimbap, live octopus",
          "Open daily 09:00 - 23:00"
        ],
        [
          "N Seoul Tower (Namsan)",
          "Namsan Mountain",
          "Panoramic communication tower",
          "City panorama, love lock terraces",
          "Cable car or eco-electric bus transit"
        ]
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Bukchon Hanok Village: The Architecture of Ondol"
    },
    {
      "type": "paragraph",
      "text": "Nestled on the undulating hill slopes between Gyeongbokgung and Changdeokgung lies Bukchon Hanok Village, an authentic residential quarter dating back six centuries where Joseon high-ranking aristocrats and royal relatives traditionally lived."
    },
    {
      "type": "paragraph",
      "text": "The neighborhood preserves hundreds of traditional wooden hanok residences, characterized by dark grey curved clay-tiled roofs (giwa), wooden lattice sliding screens (changhoji), and tranquil interior stone courtyards (madang)."
    },
    {
      "type": "paragraph",
      "text": "The genius of hanok architecture resides in its dual climate adaptation: for bitter Siberian winters, homes utilize Ondol—an ingenious subterranean radiant floor-heating system where smoke and heat from kitchen fires were channeled through masonry flues beneath room floors before exiting through outer stone chimneys."
    },
    {
      "type": "paragraph",
      "text": "For hot humid summers, homes utilize Maru—elevated, unheated wooden floor verandas that catch cross-breezes and allow cool air to circulate naturally. Today, many hanoks operate as living artisan workshops, tea houses, and boutique guesthouses."
    },
    {
      "type": "quote",
      "quote": "A hanok does not divide the human being from the wind; it opens its wooden screens so the mountain can pass through the house.",
      "attribution": "Master Hanok Architect Kim Dong-jin, Bukchon Heritage Center"
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Night Markets and Street Food: Gwangjang and Beyond"
    },
    {
      "type": "paragraph",
      "text": "Seoul is undisputed as one of the world's greatest late-night street food capitals. When darkness falls, the city's covered markets and pojangmacha (orange street food tents) come alive with sizzling griddles, billowing steam, and the convivial clinking of green soju glasses."
    },
    {
      "type": "paragraph",
      "text": "The epicurean epicenter is Gwangjang Market, Korea's oldest continuously operating covered market, established in 1905. At the central food intersection, market stalls are staffed by charismatic ajummas (matron cooks) serving legendary specialties."
    },
    {
      "type": "paragraph",
      "text": "Hikers and night owls gather around smoking cast-iron griddles to feast on Bindaetteok—crisp, golden mung-bean pancakes freshly ground on stone mills and pan-fried in bubbling oil, packed with scallions, kimchi, and pork."
    },
    {
      "type": "paragraph",
      "text": "Other market classics include Mayak Gimbap ('addictive seaweed rice rolls' dipped in tangy hot mustard), steaming bowls of handmade knife-cut noodles (kal-guksu), spicy tteokbokki rice cakes simmered in gochujang chili paste, and Korean Fried Chicken (Chimaek) double-fried to shattering crispness and glazed in sweet soy garlic sauce."
    },
    {
      "type": "image",
      "image": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
      "alt": "Bustling food stalls with steaming cauldrons and sizzling mung bean pancakes at Gwangjang Night Market in Seoul",
      "caption": "Gwangjang Market's food stalls serve sizzling bindaetteok pancakes and hand-pulled kal-guksu noodles."
    },
    {
      "type": "divider"
    },
    {
      "type": "heading",
      "headingLevel": 2,
      "text": "Urban Etiquette, Transit Cards, and Sustainable Travel"
    },
    {
      "type": "paragraph",
      "text": "Seoul's public transit network is an international benchmark for cleanliness, safety, and efficiency. Purchase a rechargeable T-money card at any convenience store or subway station; tapping it allows seamless, discounted transfers between subway lines and municipal buses."
    },
    {
      "type": "paragraph",
      "text": "Subway etiquette is strictly observed: keep conversation quiet, avoid talking loudly on mobile phones, and never sit in designated seats reserved for the elderly, disabled, or pregnant women, even if the train is crowded."
    },
    {
      "type": "paragraph",
      "text": "In Bukchon Hanok Village, remember that it is an active residential neighborhood where real families live. Observe designated visiting hours (09:00 to 17:00), keep your voice down, and avoid peering through windows or trespassing onto private courtyards."
    },
    {
      "type": "paragraph",
      "text": "Support waste reduction by carrying a reusable cup for iced Americanos—Korea's ubiquitous national beverage—and disposing of waste in designated municipal sorting bins for paper, plastic, and food waste."
    },
    {
      "type": "list",
      "items": [
        "Purchase a T-money card for seamless, tap-and-go transit across all subways, buses, and taxis.",
        "Wear a traditional Hanbok to gain free admission to Gyeongbokgung, Changdeokgung, and Deoksugung palaces.",
        "Maintain absolute quiet when exploring the residential alleys of Bukchon Hanok Village.",
        "Never sit in designated priority seating on the subway, even if the car appears completely empty.",
        "Visit Gwangjang Market in the evening for fresh bindaetteok mung bean pancakes and street food delicacies."
      ]
    }
  ],
  "status": "published",
  "isArchived": false,
  "accessLevel": "free",
  "tags": [
    "Travel",
    "International",
    "Seoul",
    "South Korea",
    "Palaces",
    "Night Markets",
    "Hanok",
    "Food",
    "Culture"
  ],
  "references": [
    {
      "title": "Visit Seoul Official City Tourism Portal",
      "url": "https://english.visitseoul.net/"
    },
    {
      "title": "Korea Tourism Organization (VisitKorea)",
      "url": "https://english.visitkorea.or.kr/"
    }
  ],
  "sources": [
    {
      "title": "Visit Seoul Official City Tourism Portal",
      "url": "https://english.visitseoul.net/"
    },
    {
      "title": "Korea Tourism Organization (VisitKorea)",
      "url": "https://english.visitkorea.or.kr/"
    }
  ],
  "relatedArticleSlugs": [],
  "publishedAt": "2026-03-01T00:00:00.000Z",
  "travelVerification": {
    "lastVerifiedAt": "2026-03-01T00:00:00.000Z",
    "budgetVerifiedAt": "2026-03-01T00:00:00.000Z",
    "currency": "KRW",
    "budgetAssumptions": "Calculated for urban culture travelers: KRW 90,000 - 180,000 per day including traditional Hanok guesthouse or modern hotel in Jongno/Myeongdong, T-money subway transit, Royal Palace Integrated Pass, and Korean BBQ/market dining.",
    "officialSources": [
      {
        "title": "Seoul Tourism Organization",
        "url": "https://english.visitseoul.net/"
      },
      {
        "title": "Cultural Heritage Administration of Korea",
        "url": "https://www.cha.go.kr/english/"
      }
    ],
    "visaVerification": "Visa exemption for citizens of 110+ countries via the Korea Electronic Travel Authorization (K-ETA). Travelers must apply online at least 72 hours before departure.",
    "transportAssumptions": "Incheon International Airport (ICN) is 50 km west, connected via AREX Express Train to Seoul Station in 43 minutes. Seoul Metropolitan Subway operated via rechargeable T-money card."
  },
  "seo": {
    "metaTitle": "Seoul: Royal Palaces, Night Markets, and Modern Lanes | MyJourney",
    "metaDescription": "A dynamic travel guide to Seoul, South Korea, navigating the Five Grand Joseon Palaces, Bukchon Hanok heritage alleys, late-night street food markets, and cutting-edge design hubs.",
    "focusKeyword": "Travel"
  }
};

module.exports = buildCanonicalArticle(articleConfig);

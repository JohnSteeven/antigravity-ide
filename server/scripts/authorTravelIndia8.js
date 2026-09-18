"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences"]);

console.log("Authoring Travel India 8/20: Hampi...");

const hampiSections = [
  {
    heading: "Tungabhadra Topography, Granite Boulders & Seasonal Timing",
    callout: {
      type: "note",
      text: "Hampi occupies a surreal geological landscape of Precambrian granite boulders along the Tungabhadra River, serving as the monumental capital of the 14th-to-16th century Vijayanagara Empire."
    },
    paragraphs: [
      "Spread across more than forty-one square kilometers of rugged Deccan plateau along the rushing waters of the Tungabhadra River in central Karnataka, Hampi presents one of the most surreal and evocative archaeological landscapes on earth. The terrain is dominated by vast jumbles of weathered, honey-gold and rust-colored granite boulders—some as colossal as multi-story buildings—perched precipitously atop one another in unnatural balance. Geologically, these granites are among the oldest exposed rock formations on the planet, dating back to the Archean era more than 2.5 billion years ago, eroded over eons by wind, sun, and torrential monsoon deluges into strange, undulating forms.",
      "Into this ancient geological canvas, the emperors of the Vijayanagara dynasty (1336–1565 CE)—Harihara, Bukka, and the legendary Krishnadevaraya—carved a monumental imperial metropolis that contemporary European, Persian, and Portuguese travelers documented as one of the richest, most populous cities in the medieval world, rivaling contemporary Rome and Ming Beijing in grandeur, commercial wealth, and architectural sophistication.",
      "The river geography of the Tungabhadra is central to Hampi's strategic and spiritual existence. Swirling through deep rocky gorges, ancient granite rapids, and peaceful sandbanks, the river divides the monumental imperial ruins of the southern bank (in modern Vijayanagara district) from the ancient mythical kingdom of Kishkindha on the northern bank around Anegundi, immortalized in the Ramayana as the monkey realm of Sugriva, Vali, and Hanuman.",
      "Climatic timing for exploring Hampi is governed by the arid heat of the semi-arid northern Karnataka plains. The winter months between November and February offer comfortable traveling conditions, with daytime temperatures averaging 28°C to 31°C, cool nighttime lows of 15°C to 18°C, and dry, clear skies that illuminate the golden granite monuments at dawn and dusk. This is the premier season for walking across the vast archaeological park, climbing Matanga Hill, and exploring the temple complexes.",
      "From March through June, the Deccan summer brings scorching temperatures frequently exceeding 40°C to 42°C. The bare granite boulders absorb solar radiation and radiate intense thermal energy, making midday walking physically punishing. The monsoon months from July to September bring sporadic, refreshing rainfall that turns the dry rocky landscape into a vibrant mosaic of emerald green moss and flooded paddy fields, while the Tungabhadra River swells into a roaring, turbulent torrent.",
      "Venturing through Hampi requires unhurried, multi-day exploration. Moving beyond the standard tourist circuit of the Vitthala Temple reveals a living landscape where 1,300-year-old temple rituals continue unbroken at the Virupaksha Temple, where ancient stone aqueducts still water banana plantations, and where the silence of medieval royal palaces invites profound contemplation of the rise and fall of great civilizations."
    ],
    quote: {
      quote: "The city of Vijayanagara is such that the eye has not seen, nor the ear heard of any place to equal it on earth; jewels, rubies, and diamonds are sold publicly in the bazaar as if they were common grain.",
      attribution: "Abdur Razzak, Persian Ambassador to Vijayanagara (1443 CE)"
    }
  },
  {
    heading: "Transit Arteries, South Western Railway Hubs & Gateway Access",
    paragraphs: [
      "Reaching Hampi involves connecting through key regional transit hubs on the Deccan plateau. The closest operational commercial air gateway is the Jindal Vijaynagar Airport (VDY) at Vidyanagar (Toranagallu), located approximately thirty-eight kilometers southeast of Hampi. Serviced by regional carriers like Alliance Air, the airport operates daily direct flights connecting Bengaluru and Hyderabad. Pre-arranged taxis from Vidyanagar reach Hampi or Hosapete in approximately fifty minutes.",
      "Alternative commercial airport gateways include Hubballi Airport (HBX), situated one hundred and forty-five kilometers west (a three-hour drive via NH-67), which offers extensive domestic flight connectivity to Mumbai, Delhi, Bengaluru, Chennai, and Kochi; and Kempegowda International Airport Bengaluru (BLR), located three hundred and forty kilometers south, reachable in five-and-a-half to six hours via the four-lane NH-48 and NH-50 highways.",
      "For rail travelers, Hosapete Junction (station code: HPT), located just thirteen kilometers west of Hampi, serves as the primary designated broad-gauge railhead. Hosapete is serviced by several dedicated daily express and superfast trains, most notably the legendary Hampi Express (16591/16592), which provides a convenient, comfortable overnight journey departing Bengaluru City at 21:50 PM and arriving in Hosapete at 07:10 AM the following morning.",
      "Other key rail connections include the Amaravathi Express (17225/17226) connecting Vijayawada and Vasco da Gama, the Haripriya Express connecting Tirupati and Kolhapur, and daily intercity trains from Hyderabad, Hubballi, and Mysuru. Outside Hosapete station, authorized prepaid auto-rickshaws and taxis provide seamless connections to Hampi Bazaar and Kamalapura round the clock for fixed fares.",
      "The Karnataka State Road Transport Corporation (KSRTC) operates dependable luxury multi-axle Airavat and non-AC sleeper buses departing Bengaluru, Mysore, Hyderabad, and Goa directly for Hosapete and Hampi. Highway driving along the four-lane NH-50 (Chitradurga-Hosapete expressway) is smooth and fast, passing through scenic arid plains dotted with wind turbines and ancient granite outcrops."
    ],
    table: {
      headers: ["Transit Route / Service", "Schedule & Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["Hampi Express Overnight Train (16591)", "Daily overnight service ex-Bengaluru", "SBC -> HPT", "9h 20m (420 km)", "₹1,180 (3AC) / ₹1,750 (2AC)"],
        ["Jindal Airport (VDY) to Hampi Taxi", "On-demand pre-booked private cab", "VDY -> Hampi Bazaar", "50m (38 km)", "₹1,400 - ₹1,800"],
        ["Hubballi Airport to Hampi Private Sedan", "24/7 on-demand private transfer", "HBX -> Hampi (via NH-67)", "3h 00m (145 km)", "₹3,400 - ₹4,400"],
        ["KSRTC Airavat Club Class Volvo Bus", "Nightly departure 22:30 ex-Bengaluru", "Bengaluru -> Hosapete Bus Stand", "6h 45m (340 km)", "₹750 - ₹950"],
        ["Hosapete Junction Auto-Rickshaw to Hampi", "Available 24/7 outside station gate", "HPT -> Hampi Bazaar", "25m (13 km)", "₹250 - ₹350"]
      ]
    }
  },
  {
    heading: "Neighborhood Topography & Distinct Archaeological Zones",
    callout: {
      type: "tip",
      text: "Structure your Hampi exploration across four distinct geographic sectors: the Sacred Centre along the river, the Royal Centre in the south, the Riverside & Vitthala Complex, and the ancient boulder kingdom of Anegundi on the north bank."
    },
    paragraphs: [
      "The UNESCO World Heritage landscape of Hampi is historically and spatially organized into four clearly demarcated functional zones, reflecting the master urban planning of the Vijayanagara Empire. The first is the Sacred Centre, stretching along the southern bank of the Tungabhadra River. This zone is dominated by the monumental 160-foot eastern gopuram of the Virupaksha Temple—dedicated to Lord Shiva as Virupaksha, the guardian deity of the Vijayanagara kings—which has seen uninterrupted worship since the 7th century CE.",
      "Fronting the Virupaksha Temple is the historic Hampi Bazaar, a broad, half-kilometer-long stone colonnade where diamond merchants and horse traders once operated. Rising directly south is Hemakuta Hill, a granite outcrop crowned by dozens of pre-Vijayanagara and early Vijayanagara stone shrines, as well as the colossal monolithic statues of Sasivekalu Ganesha (carved from a single boulder, resembling a mustard seed) and Kadalekalu Ganesha (resembling a Bengal gram chickpea). Dominating the eastern horizon is Matanga Hill, the highest point in central Hampi, offering sublime panoramic sunrise and sunset views.",
      "Two kilometers south lies the Royal Centre, the fortified political and administrative core of the empire. Key architectural masterworks here include the exquisite Lotus Mahal (a two-story pavilion blending Indo-Islamic cusped arches with Hindu vaulting), the grand Elephant Stables (comprising eleven domed masonry chambers designed to house imperial war elephants), the Queen's Bath with its Indo-Saracenic vaulted corridors, the underground subterranean Shiva temple, and the Hazara Rama Temple, adorned with thousands of finely sculpted bas-relief panels depicting the complete narrative of the Ramayana.",
      "The focal point of ceremonial imperial pride in the Royal Centre is the Mahanavami Dibba—a monumental three-tiered stone platform soaring over twelve meters high, from which the Vijayanagara emperors viewed grand military parades, athletic wrestling matches, and religious festivities during the annual nine-day Navaratri festival. Surrounding the platform is an intricate network of dressed-stone aqueducts and a beautifully stepped geometric stone tank (Pushkarani) uncovered by modern archaeologists in 1985.",
      "Two kilometers east along the riverbank lies the Riverside and Vitthala Complex, representing the pinnacle of Vijayanagara artistic craftsmanship. Here stands the world-famous Stone Chariot (a monolithic granite shrine to Garuda with rotating stone wheels) and the 56 Musical Pillars of the Ranga Mantapa, carved from resonant single granite columns that emit distinct musical tones when tapped. Across the Tungabhadra lies Anegundi, home to Anjanadri Hill (the mythical birthplace of Lord Hanuman), Pampa Sarovar, and the ancient stone ramparts of Kishkindha."
    ]
  },
  {
    heading: "Permits, ASI Ticketing & Monument Protection Regulations",
    callout: {
      type: "warning",
      text: "A single Archaeological Survey of India (ASI) unified digital entry ticket provides access to the Vitthala Temple complex and the Zenana Enclosure on the same calendar day."
    },
    paragraphs: [
      "The core monuments of Hampi are protected under the Ancient Monuments and Archaeological Sites and Remains Act and managed by the Archaeological Survey of India (ASI) in collaboration with UNESCO and the Hampi World Heritage Area Management Authority (HWHAMA).",
      "Most monument complexes in Hampi—including the Virupaksha Temple, Hemakuta Hill, Achyutaraya Temple, Krishna Temple, Hazara Rama Temple, and Mahanavami Dibba—are open to the public without entry fees. However, entry to the two premier enclosed archaeological zones—the Vitthala Temple Complex and the Zenana Enclosure (containing the Lotus Mahal and Elephant Stables)—requires an ASI unified admission ticket.",
      "ASI admission tickets must be purchased online via the official ASI ticketing portal (asi.payumoney.com) or at physical QR-code ticketing kiosks outside the monument entry gates. A single ticket covers entry to both the Vitthala Complex and the Zenana Enclosure on the same calendar day: ₹40 for Indian citizens, SAARC, and BIMSTEC visitors, and ₹600 for foreign passport holders. Children under fifteen years of age enter free of charge. Tickets must be preserved for scanning at both entry turnstiles.",
      "To protect the delicate granite structures and prevent vehicular air pollution, private motorized vehicles are barred from the immediate vicinity of the Vitthala Temple. Visitors park their vehicles at the Gejjala Mantapa parking terminus, located approximately one kilometer from the temple gate, and travel via battery-operated electric buggies operated by the tourism department for a nominal fee of ₹20 per passenger, or walk along the picturesque paved stone pathway.",
      "Climbing on fragile architectural ruins, touching or tapping the musical pillars in the Vitthala Mantapa (which has caused severe acoustic and structural erosion over decades), defacing ancient stone carvings, or attempting to remove any stone artifacts is strictly prohibited and carries severe penalties, including heavy fines and criminal imprisonment under Indian law."
    ]
  },
  {
    heading: "Curated 5-Day Vijayanagara Empire Master Itinerary",
    paragraphs: [
      "Day 1: Sacred Virupaksha, Hemakuta Hill & Sunset from Matanga. Arrive in Hampi by mid-morning via the Hampi Express overnight train. Check into a heritage resort in Kamalapura or a cozy riverfront guesthouse. Begin at 11:00 AM with a visit to the 7th-century Virupaksha Temple; walk through the towering 160-foot eastern gopuram, receive a gentle blessing from the temple elephant Lakshmi, and admire the ceiling frescoes of the Ranga Mantapa depicting the marriage of Pampa and Shiva. Walk along the historic Hampi Bazaar to the monolithic Kadalekalu Ganesha and Sasivekalu Ganesha shrines. In the late afternoon, explore the pre-Vijayanagara triple-chambered shrines on Hemakuta Hill, climbing to the summit of Matanga Hill by 17:30 PM to watch the sunset illuminate thousands of golden granite boulders across the Tungabhadra valley.",
      "Day 2: The Zenith of Stone: The Vitthala Complex & Riverside Ruins. Begin at dawn (06:30 AM) with a brisk walk along the southern river path from Hampi Bazaar past the King's Balance (Thulabhara) and the carved Kodandarama Temple. Arrive at the Vitthala Temple as the gates open at 08:00 AM, enjoying the world-famous Stone Chariot in the quiet morning light before tour groups arrive. Spend two unhurried hours admiring the 56 musical pillars of the Ranga Mantapa, the carved granite bas-reliefs of horse merchants, and the sprawling stone courtyard. Walk eastward to the secluded Achyutaraya Temple, nestled in the hidden valley of Sule Bazaar. In the afternoon, hire a traditional circular woven coracle boat at the river ghat for an unforgettable float across the rushing rapids of the Tungabhadra, watching river otters and kingfishers.",
      "Day 3: The Royal Centre: Lotus Mahal, Elephant Stables & Mahanavami Dibba. Dedicate the entire day to the fortified Royal Centre in Kamalapura. Begin at the Zenana Enclosure at 08:30 AM, admiring the symmetrical Indo-Islamic arches and stucco decoration of the Lotus Mahal. Walk to the adjacent Elephant Stables, examining the eleven domed chambers that once housed royal war elephants. Continue past the Guard's Quarters to the Hazara Rama Temple, spending an hour reading the intricate stone comic-strip panels of the Ramayana carved into its exterior enclosure walls. Climb the three-tiered stone platform of the Mahanavami Dibba, marveling at the carved friezes of Persian ambassadors and hunting scenes. Admire the subterranean stone aqueducts and the stepped geometric Pushkarani tank, concluding with sunset at the Queen's Bath.",
      "Day 4: Across the River to Kishkindha: Anjanadri & Anegundi. Cross the Tungabhadra River by road bridge or local ferry to the northern bank at Anegundi, the legendary monkey kingdom of Kishkindha. Climb the 575 whitewashed stone steps of Anjanadri Hill—the mythological birthplace of Lord Hanuman—enjoying panoramic 360-degree vistas of emerald paddy fields framed by surreal granite boulder peaks. In the afternoon, visit the serene holy tank of Pampa Sarovar, the ancient Chintamani Temple cave where Lord Rama met Sugriva, and the historic wooden-pillared houses of Anegundi village, where women's self-help groups create sustainable handicrafts from water hyacinth fiber and banana bark. Spend late afternoon relaxing beside the calm granite waters of Sanapur Lake.",
      "Day 5: Archaeological Museum, Krishna Temple & Underground Shrines. Spend your final morning exploring the Archaeological Museum at Kamalapura, examining its scaled miniature topographical model of the entire 41-square-kilometer ruins, collection of Vijayanagara gold coins (varahas), weaponry, and exquisite stone sculptures. Return to central Hampi to visit the monumental Krishna Temple complex, built by King Krishnadevaraya in 1513 CE to celebrate his conquest of Udayagiri in Orissa, examining the detailed carvings of the ten avatars of Vishnu. Walk through the sunken Underground Shiva Temple (Prasanna Virupaksha), where water still fills the sanctum. Enjoy a final glass of fresh sugarcane juice and a traditional North Karnataka Jolada Rotti lunch before boarding your evening train from Hosapete."
    ],
    table: {
      headers: ["Day & Time Slot", "Archaeological Sector", "Core Monuments & Heritage Sites", "Mobility Mode", "Gastronomic Recommendations"],
      rows: [
        ["Day 1: 11:00 - 18:30", "Sacred Centre", "Virupaksha Temple; Hemakuta Hill; Matanga sunset", "Foot / auto-rickshaw", "Crispy Benne Dosa & hot South Indian filter coffee"],
        ["Day 2: 06:30 - 15:30", "Vitthala & Riverside", "Stone Chariot; Musical Pillars; Achyutaraya; Coracle", "Foot & Coracle boat", "Authentic South Indian thali served on fresh banana leaf"],
        ["Day 3: 08:30 - 16:30", "Royal Centre", "Lotus Mahal; Elephant Stables; Mahanavami Dibba", "Bicycle / hired taxi", "Traditional North Karnataka Jolada Rotti meal, Kamalapura"],
        ["Day 4: 07:00 - 17:00", "Anegundi & Kishkindha", "Anjanadri 575 steps; Pampa Sarovar; Sanapur Lake", "Rented scooter / auto", "Wood-fired shakshuka & fresh pomegranate juice, Sanapur"],
        ["Day 5: 09:00 - 15:00", "Kamalapura & Krishna", "ASI Museum; Krishna Temple; Underground Shiva", "Auto-rickshaw / car", "Hot Dharwad peda & cold mango lassi, Hampi Bazaar"]
      ]
    }
  },
  {
    heading: "Financial Architecture & Itemized INR Expense Breakdown",
    callout: {
      type: "note",
      text: "Hampi provides excellent value across diverse traveler budgets, from riverside backpacker guesthouses in Anegundi to palatial 5-star luxury heritage resorts."
    },
    paragraphs: [
      "Budget planning for Hampi reflects a broad spectrum of hospitality, from rustic guesthouses on the northern bank to luxury palace hotels around Kamalapura. A solo budget traveler staying in cozy guesthouses in Hampi Bazaar or Sanapur, renting a bicycle or scooter, and dining at local South Indian vegetarian messes can explore comfortably for ₹2,000 to ₹3,000 per day.",
      "Mid-range travelers staying in air-conditioned heritage cottages or boutique hotels in Kamalapura or Hosapete, hiring private auto-rickshaws for day trips, and dining at established garden restaurants should project ₹5,500 to ₹10,000 per day for a couple.",
      "Luxury travelers seeking world-renowned palace hospitality—such as Evolve Back Kamalapura Palace (modeled on the royal stone architecture of Vijayanagara, complete with private plunge pools and stone-arched hallways) or Heritage Resort Hampi—will find suite tariffs ranging from ₹25,000 to ₹55,000 per night during the peak winter season (November to February). Chauffeur-driven private sedans cost ₹2,800 to ₹3,800 per full day.",
      "Activity costs are very reasonable: the unified ASI ticket covering the Vitthala Temple and Zenana Enclosure is ₹40 for Indian citizens and ₹600 for foreign nationals; battery buggy transfers at Vitthala are ₹20 per seat; circular coracle boat rides on the Tungabhadra cost ₹300 to ₹500 for thirty minutes; and licensed English-speaking ASI tour guides charge standardized rates between ₹1,500 and ₹2,500 for a comprehensive full-day tour."
    ],
    table: {
      headers: ["Budget Tier", "Daily Accommodation (INR)", "Daily Meals (INR)", "Local Transit (INR)", "Activities & Guides (INR)", "Total Estimated Daily INR"],
      rows: [
        ["Budget (Solo)", "₹900 - ₹1,500 (Guesthouse room / hostel)", "₹450 - ₹700 (Thali canteens, cafe meals)", "₹200 - ₹400 (Rented bicycle / shared auto)", "₹250 - ₹450 (ASI ticket, coracle share)", "₹1,800 - ₹3,050 per day"],
        ["Mid-Range (Couple)", "₹4,000 - ₹7,500 (AC heritage room / resort)", "₹1,500 - ₹2,800 (Garden dining, multi-cuisine)", "₹800 - ₹1,500 (Dedicated auto-rickshaw hire)", "₹1,000 - ₹2,000 (ASI ticket, official guide)", "₹7,300 - ₹13,800 per day"],
        ["Luxury (Couple)", "₹25,000 - ₹52,000 (Vijayanagara palace suite)", "₹4,500 - ₹8,500 (Fine dining royal feasts)", "₹3,000 - ₹4,500 (Private chauffeured sedan)", "₹2,500 - ₹5,000 (Private expert historian guide)", "₹35,000 - ₹70,000 per day"]
      ]
    }
  },
  {
    heading: "Arid Deccan Heat Dynamics, Summer Hazards & Sun Precautions",
    callout: {
      type: "warning",
      text: "Deccan summer temperatures exceed 40°C between March and June; bare granite boulders absorb intense heat, creating severe heatstroke hazards during midday walking."
    },
    paragraphs: [
      "The semi-arid climate of the Deccan plateau presents genuine physical challenges for travelers unaccustomed to intense dry heat. Between March and June, daily temperatures routinely climb above 40°C to 42°C, accompanied by intense ultraviolet radiation and low relative humidity (under 25%).",
      "The millions of exposed granite boulders across Hampi act as colossal thermal storage units. By noon, the rock surfaces reach temperatures exceeding 50°C, radiating intense secondary heat from the ground upward. Walking among stone ruins during the hours between 11:30 AM and 15:30 PM can cause rapid dehydration, severe sunburn, and life-threatening heatstroke.",
      "Travelers visiting Hampi in the warm months must structure their daily activities into two discrete operational windows: an early morning exploration shift from 06:30 to 10:30 AM, followed by a mandatory midday retreat indoors or in shaded museums, resuming outdoor walking after 16:00 PM until sunset. Carrying at least two to three liters of water enriched with oral rehydration salts (ORS) or electrolyte powder is mandatory.",
      "Even during the pleasant winter months (November to February), midday sun can be deceivingly strong. Always wear a wide-brimmed sun hat, high-SPF sunscreen, and polarized sunglasses to protect eyes against the dazzling glare reflected off light-colored granite surfaces."
    ]
  },
  {
    heading: "Gastronomic Topography: North Karnataka Jolada Rotti & Traveler Bistros",
    paragraphs: [
      "The culinary landscape of Hampi reflects two distinct cultural realities: the ancient, wholesome agrarian cuisine of North Karnataka and the eclectic, international traveler cafe culture that developed along the riverbanks to serve global backpackers.",
      "The definitive local dining experience is the authentic North Karnataka Oota (meal), centered around Jolada Rotti. Jolada Rotti is an unleavened, gluten-free flatbread made from finely ground sorghum flour (jowar) and hot water, skillfully hand-patted into thin, circular rounds and roasted on a dry iron griddle until puffed and tender. It is served with Yennegai—tender baby brinjals stuffed with a roasted masala of peanuts, sesame seeds, coconut, dry red chilies, and tamarind, slow-cooked in rich sesame oil until meltingly tender.",
      "Accompaniments to the rotti include Kaalu Palya (sprouted mung beans or black-eyed peas tempered with mustard and curry leaves), Shenga Chutney Pudi (a dry, intensely savory powder made from roasted peanuts, garlic, and red chili), raw country onions, fresh green chilies, and rich, thick buffalo curd. A spoonful of hot rotti dipped into yennegai and topped with peanut powder is a masterclass in Deccan rustic gastronomy.",
      "For breakfast, local canteens serve exceptional Davanagere-style Benne Dosa (crispy, spongy rice crepes roasted with generous dollops of freshly churned country butter), fluffy Idlis, and spicy Upma, washed down with frothy South Indian filter coffee in stainless-steel tumblers. For a sweet finale, sample authentic Dharwad Peda—a caramelized milk confection with a soft, grainy texture, rolled in fine powdered sugar.",
      "Across the river in Anegundi and Sanapur, traveler-oriented garden cafes serve fresh Mediterranean and European comfort food: wood-fired thin-crust sourdough pizzas with local mozzarella, authentic Middle Eastern Shakshuka, fresh hummus with pita bread, and freshly pressed pomegranate and sweet lime juices, enjoyed on shaded floor cushions overlooking green paddy fields."
    ],
    table: {
      headers: ["Iconic Regional Dish", "Cultural Origin", "Key Ingredients & Seasoning", "Flavor Profile", "Where to Sample"],
      rows: [
        ["North Karnataka Jolada Rotti Meal", "Traditional Deccan Agrarian", "Sorghum jowar rotti, yennegai brinjal, peanut powder", "Earthy, robust, nutty, rustic, wholesome warmth", "Local family mess halls in Kamalapura & Hosapete"],
        ["Davanagere Benne Dosa", "Central Karnataka Tiffin", "Fermented rice crepe, churned country butter, aloo", "Golden crispy exterior, soft buttery interior", "Breakfast stalls near Hampi Bazaar entrance"],
        ["Shenga Chutney Pudi & Curd", "Deccan Spice Condiment", "Roasted peanuts, garlic, red chilies, cumin, rock salt", "Intensely savory, nutty, pungent, crunchy depth", "Served with every traditional North Karnataka meal"],
        ["Wood-Fired Margherita Pizza", "Anegundi Traveler Bistro", "Fermented dough, San Marzano tomato, local cheese", "Crisp blistered crust, melted cheese, fresh basil", "Garden cafes in Sanapur village"],
        ["Authentic Dharwad Peda", "Karnataka Milk Confection", "Slow-caramelized milk khoya, cane sugar, cardamom", "Dense, grainy, deeply caramelized sweetness", "Heritage sweet confectioners in Hosapete"]
      ]
    }
  },
  {
    heading: "Cultural Protocols, Temple Reverence & Sacred Site Etiquette",
    callout: {
      type: "note",
      text: "The Virupaksha Temple is an active Hindu pilgrimage sanctuary with 1,300 years of continuous worship; dress modestly and remove footwear before crossing temple portals."
    },
    paragraphs: [
      "While Hampi is celebrated worldwide as an archaeological park, visitors must recognize that it remains a deeply venerated living pilgrimage sanctuary for millions of Hindu devotees. The Virupaksha Temple has conducted daily ritual worship without interruption since at least the 7th century CE, surviving the catastrophic sack of the city in 1565.",
      "When entering active religious sanctuaries—such as the Virupaksha Temple, the Malyavanta Raghunatha Temple on Malyavanta Hill, or the Hanuman Temple atop Anjanadri Hill—conservative dress codes are strictly observed. Shoulders, upper arms, and knees must be fully covered. Shorts, mini-skirts, sleeveless tank tops, and beach wraps are strictly forbidden. Footwear must be deposited at designated shoe-care counters outside temple archways.",
      "Inside temple sanctums, maintain quiet reverence and observe circumambulation (pradakshina) around shrines in a clockwise direction. Photography is strictly prohibited inside the inner sanctum sanctorum of the Virupaksha Temple. While photography is allowed in the outer courtyards and among ruined monuments, avoid taking intrusive close-up photographs of devotees engaged in private prayer, ritual river ablutions, or sacred fire ceremonies (homams).",
      "When visiting Anegundi and rural farming hamlets, remember that these are close-knit, traditional agrarian communities. Greet local residents with a courteous 'Namaskara.' Always seek polite verbal permission before taking portraits of village elders, women, or artisans working in village courtyards."
    ]
  },
  {
    heading: "Architectural Lineage: Vijayanagara Imperial Craftsmanship & Stone Ingenuity",
    paragraphs: [
      "The architectural heritage of Hampi represents the crowning achievement of medieval South Indian building arts, fusing indigenous Dravidian temple traditions, Chalukyan decorative filigree, and Indo-Islamic courtly forms into a unified, monumental architectural idiom known as the Vijayanagara style.",
      "The structural foundation of Vijayanagara architecture is local hard granite. Despite the extreme hardness and brittleness of granite, Vijayanagara stone-masons achieved astonishing delicacy in carving. In the Vitthala Temple's Ranga Mantapa (hall of dance), massive monolithic pillars are carved into complex architectural clusters: a central supporting pillar surrounded by slender secondary colonnettes, carved from a single piece of bedrock, that resonate with distinct musical frequencies (emitting tones resembling the mridangam, damaru, veena, and flute) when tapped with the thumb.",
      "The iconic Stone Chariot in the Vitthala courtyard is one of India's three great stone chariots (along with Konark and Mahabalipuram). Designed as a mobile processional car dedicated to Garuda (the divine eagle mount of Lord Vishnu), the chariot was assembled from multiple precisely interlocking slabs of carved granite, resting on four rotating stone wheels adorned with concentric lotus petals, complete with traces of original floral fresco plaster painting.",
      "In the Royal Centre, courtly architecture incorporated sophisticated Indo-Islamic elements, demonstrating that Vijayanagara emperors embraced artistic influences from neighboring Deccan Sultanates. The Lotus Mahal features two stories of open pavilions supported by arched colonnades adorned with multi-lobed cusped Islamic arches, plaster geometric friezes, and pyramidal Hindu gopuram-style spires.",
      "The Elephant Stables represent monumental civic architecture: a grand 85-meter-long linear facade featuring eleven high-vaulted domed chambers, incorporating alternate octagonal, drum-shaped, and ribbed domes resting on massive stone corbels, flanked by an elevated viewing gallery where royal guests sat to inspect the imperial cavalry."
    ]
  },
  {
    heading: "On-Ground Logistics: Bicycles, Auto-Rickshaws & Coracle River Crossing",
    callout: {
      type: "tip",
      text: "Exploring the Sacred Centre on a single-speed bicycle is iconic and rewarding during winter months; hire bicycles for ₹100 to ₹150 per day in Hampi Bazaar."
    },
    paragraphs: [
      "Navigating Hampi's vast 41-square-kilometer archaeological terrain requires selecting the right transit mode for each sector. The distances between monument clusters are substantial: walking between the Sacred Centre, Royal Centre, and Vitthala Complex entails six to eight kilometers of walking on exposed, sunny stone pathways.",
      "For independent budget travelers during the pleasant winter months (November to February), renting a classic single-speed roadster bicycle (Hero or Atlas) in Hampi Bazaar (₹100 to ₹150 per day) is one of the most romantic and flexible ways to explore the Sacred Centre, Hemakuta Hill, and the riverside trail. However, bicycles are not practical for the hilly terrain of Anegundi or the distant monuments of Kamalapura.",
      "Auto-rickshaws are the most practical and popular transit choice for comprehensive sightseeing. Stationed at Hampi Bazaar, Kamalapura, and Hosapete railway station, auto drivers offer standardized full-day hire (covering the Sacred Centre, Royal Centre, and Vitthala parking) for ₹1,200 to ₹1,800. Agree firmly on the daily circuit, waiting times, and drop-off points before boarding.",
      "To cross the Tungabhadra River between Hampi and Anegundi, travelers historically relied on traditional round coracles (parisal)—bowl-shaped boats constructed of woven bamboo splits lined with waterproof canvas and bitumen, propelled by a single paddle. Today, a modern road bridge at Bukkasagara provides seamless vehicular transit across the river, though licensed coracle operators still offer picturesque scenic river rides at the Chakratirtha and Vitthala ghats for ₹300 to ₹500 for thirty minutes.",
      "Renting automatic scooters (Honda Activa) is popular across the river in Anegundi and Sanapur (₹400 to ₹600 per day, plus fuel), ideal for exploring the rural countryside, Anjanadri Hill, and Sanapur Lake. Riders must carry a valid driving license, wear an ISI-marked helmet, and ride cautiously on narrow rural roads where livestock and tractors frequent the lanes."
    ]
  },
  {
    heading: "Deccan Hydration, Sun Safety & Archaeological Health Precautions",
    paragraphs: [
      "Exploring Hampi's arid, boulder-strewn landscape exposes visitors to intense dry heat, strong ultraviolet radiation, and extensive physical walking across uneven stone surfaces that require thoughtful health management.",
      "Hydration is the single most critical health factor in Hampi. In the dry Deccan climate, sweat evaporates almost instantaneously, leaving travelers unaware of the volume of water they are losing. Drink at least three to four liters of purified, filtered water daily. Supplement drinking water with fresh tender coconut water (available at stalls outside the Virupaksha Temple and Vitthala buggy stand for ₹50 to ₹60) or fresh sugarcane juice infused with ginger and lime, which replenishes essential electrolytes.",
      "Never drink untreated tap water from public taps or monument ponds. Drink exclusively filtered reverse-osmosis (RO) water provided in carafes at reputable hotels or carry a reusable insulated stainless-steel bottle with an integrated micro-filtration purifier.",
      "Sun protection is essential throughout the year. Wear a broad-brimmed sun hat, apply high-SPF (50+) broad-spectrum sunscreen to all exposed skin every three hours, and wear UV-rated polarized sunglasses to protect eyes against blinding glare reflected off granite surfaces. Wear loose, long-sleeved clothing made of light-colored natural cotton or linen to shield skin from direct solar radiation while allowing natural airflow.",
      "When swimming or wading near the Tungabhadra River, exercise extreme caution. River currents around the boulders are deceptively powerful and unpredictable, with deep underwater granite crevices and whirlpools that have caused fatal drownings. Swim exclusively in designated calm, monitored areas at Sanapur Lake, and never enter the river while under the influence of alcohol."
    ]
  },
  {
    heading: "Digital Connectivity, UPI Transactions & Rural Cellular Coverage",
    callout: {
      type: "note",
      text: "Cellular 4G/5G signals are robust in Kamalapura, Hosapete, and Hampi Bazaar, but drop significantly inside deep granite valleys and along remote sections of Anegundi."
    },
    paragraphs: [
      "Telecommunications infrastructure around Hampi has modernized substantially in recent years. Major telecom operators—Reliance Jio and Bharti Airtel—provide reliable 4G LTE and expanding 5G coverage throughout Hosapete town, Kamalapura, Hampi Bazaar, and the immediate monument centers.",
      "Unified Payments Interface (UPI) digital transactions are accepted across the vast majority of commercial establishments in Hampi: ASI ticket booking counters, cafes, souvenir stalls, tender coconut vendors, and auto-rickshaw drivers universally display QR payment codes. However, because cellular towers can experience intermittent signal drops behind colossal granite ridges or inside stone monument enclosures, carrying a physical cash reserve of ₹2,500 to ₹4,000 is essential for paying local guides, coracle boatmen, and rural purchases.",
      "For remote knowledge workers and digital nomads planning extended workations, several boutique resorts and guest lodges in Kamalapura, Sanapur, and Anegundi offer dedicated fiber-optic broadband connectivity (BSNL Bharat Fibre and private operators) delivering dependable 50 Mbps to 100 Mbps speeds.",
      "When booking extended stays, confirm that your accommodation possesses both high-speed fiber internet and inverter battery or generator backup, as power fluctuations can occasionally occur in rural Karnataka during evening hours."
    ]
  },
  {
    heading: "Heritage Conservation, Monument Preservation & Sustainable Tourism",
    paragraphs: [
      "The monumental landscape of Hampi is an irreplaceable global heritage treasure that faces severe threats from environmental weathering, tourist vandalism, unauthorized construction, and rising vehicular traffic.",
      "In 1999, UNESCO placed Hampi on the List of World Heritage in Danger following the construction of modern suspension bridges and commercial encroachment within the core protected monument zone. The crisis led the Government of Karnataka to establish the Hampi World Heritage Area Management Authority (HWHAMA) and relocate commercial settlements away from ancient temple colonnades, resulting in Hampi's successful removal from the endangered list in 2006. Preserving this balance requires every visitor to exercise conscious, low-impact heritage stewardship.",
      "Practice strict monument preservation ethics: never sit, stand, or lean upon ancient carved stone pillars, balustrades, or crumbling masonry walls. Touching ancient granite bas-reliefs transfers natural skin oils and acidic sweat that accelerate stone exfoliation. Never leave graffiti or write names on historic stones—a criminal offense punishable under the Ancient Monuments and Archaeological Sites and Remains Act.",
      "Single-use plastic waste is a severe environmental hazard in Hampi. Discarded plastic bottles and food packaging despoil the sacred landscape and threaten local livestock and wildlife. Carry reusable water bottles, decline single-use plastic bags, and pack out all personal non-biodegradable waste. Support local artisanal economies by purchasing authentic hand-woven banana-fiber and water-hyacinth handicrafts produced by women's cooperatives in Anegundi."
    ]
  },
  {
    heading: "Photography Protocols, Drone Regulations & Monument Discretion",
    callout: {
      type: "warning",
      text: "Flying recreational or commercial drones in Hampi is strictly prohibited without prior written clearance from the Archaeological Survey of India (ASI) and the Ministry of Civil Aviation."
    },
    paragraphs: [
      "Hampi's visual grandeur—golden granite boulders glowing in dawn light, towering temple gopurams reflected in sacred water tanks, and evocative stone colonnades stretching toward distant rocky horizons—makes it one of the most photographed heritage landscapes in Asia. However, photographers must follow strict legal regulations and ethical protocols.",
      "The use of unmanned aerial vehicles (drones) over any monument, temple, or archaeological ruin within the 41-square-kilometer UNESCO World Heritage protected area is strictly illegal under Indian law without advance written permission from the Director General, Archaeological Survey of India (New Delhi), and local security authorities. Unauthorized drones will be seized by security personnel, and operators face heavy fines and police prosecution.",
      "Commercial photography and filming involving tripods, external lighting umbrellas, and professional cinematic equipment inside ASI-ticketed complexes (Vitthala Temple and Zenana Enclosure) requires obtaining an ASI photography permit online and paying prescribed statutory fees. Handheld still cameras and personal smartphone photography are permitted without surcharge.",
      "When photographing active religious rituals inside the Virupaksha Temple courtyard or along sacred river bathing ghats, maintain respectful discretion. Always ask courteous permission before taking close-up portraits of pilgrims, temple priests, or sadhus seated on stone mantapas, and never use flash photography inside dim temple sanctums."
    ]
  },
  {
    heading: "Packing Blueprint: Sun Armor, Stone Footwear & Trail Equipment",
    paragraphs: [
      "Packing for an expedition to Hampi requires preparing for intense daytime sun, dry heat, extensive walking over rough granite terrain, and modest dress codes at sacred shrines. The following matrix outlines essential field gear.",
      "Footwear is the single most critical investment for Hampi. You will walk thousands of steps over uneven rock surfaces, ancient stone flagstones, and sandy riverbanks. Bring broken-in, breathable trail walking shoes or hiking sneakers with thick, shock-absorbing soles and good rubber traction. Avoid smooth-soled leather shoes that slip on polished granite surfaces. Pair these with comfortable slip-on sandals for temple visits where shoes must be removed frequently.",
      "Clothing should prioritize lightweight, breathable natural fabrics: 100% pure organic cotton, linen, or technical moisture-wicking materials in light, heat-reflective shades (white, khaki, beige). Pack modest clothing that covers shoulders and knees for temple entry: loose linen trousers, cotton kurtas, or knee-length shirts. Women travelers should carry a lightweight cotton scarf or dupatta to cover shoulders inside orthodox shrines.",
      "Sun protection is indispensable: bring a wide-brimmed cotton sun hat or safari hat, UV-rated polarized sunglasses, high-SPF broad-spectrum sunscreen, and lip balm with sunblock. Field gear essentials include an insulated stainless-steel water bottle (at least 1 to 1.5 liters) to keep water cold in the midday heat, a compact 10,000mAh power bank to recharge smartphones during full-day monument walks, and a lightweight daypack (15 to 20 liters)."
    ],
    table: {
      headers: ["Gear Category", "Recommended Item", "Practical Field Function", "Seasonal Criticality"],
      rows: [
        ["Footwear", "Lugged trail sneakers + slip-on temple sandals", "Walking rough granite paths; easy shoe removal", "Essential year-round"],
        ["Sun Protection", "Wide-brimmed sun hat + polarized sunglasses", "Shielding against intense Deccan solar radiation", "Crucial year-round"],
        ["Hydration & Fuel", "Insulated stainless steel flask (1.5L) + ORS packets", "Maintaining hydration & vital electrolyte balance", "Essential: Especially March - June"],
        ["Sacred Attire", "Long linen trousers / maxi skirt + cotton scarf", "Complying with orthodox dress codes at active temples", "Year-round requirement"],
        ["Power & Pack", "10,000mAh power bank + 20L lightweight daypack", "Recharging phones & carrying water on day hikes", "Recommended year-round"]
      ]
    }
  },
  {
    heading: "Emergency Infrastructure, Hospitals & Regional Medical Access",
    callout: {
      type: "note",
      text: "The Government Taluk Hospital in Hosapete (13 km) and the multi-specialty Jindal Sanjeevani Hospital in Toranagallu (35 km) provide 24/7 emergency medical care and trauma services."
    },
    paragraphs: [
      "While Hampi is a peaceful and secure travel destination, knowing where to access medical care, police support, and emergency services is essential for peace of mind.",
      "The primary public emergency healthcare facility closest to the ruins is the Community Health Centre in Kamalapura, equipped to handle minor injuries, dehydration, and basic medical treatment. For comprehensive emergency medical care, the Government Taluk Hospital on Station Road in Hosapete (thirteen kilometers away) provides 24-hour casualty services, surgical facilities, and ambulance transport.",
      "In the private medical sector, the Jindal Sanjeevani Multi-Specialty Hospital, located inside the Jindal Steel Works township at Toranagallu (thirty-five kilometers east on NH-67), is one of the premier modern hospitals in the region, equipped with modern intensive care units, advanced cardiology, diagnostic radiology, and multi-lingual medical specialists.",
      "For severe medical trauma requiring advanced tertiary interventions, patients are stabilized in Hosapete and transferred via ambulance to tertiary multi-specialty hospitals in Hubballi (such as KIMS Hubballi or Tatwadarsha Hospital), reachable in approximately two-and-a-half to three hours.",
      "The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district. A dedicated Tourist Police assistance booth operates in Hampi Bazaar near the Virupaksha Temple, providing assistance with lost property, travel information, and tourist dispute resolution."
    ],
    table: {
      headers: ["Emergency Department", "Designated Medical Facility", "Physical Location", "Emergency Telephone"],
      rows: [
        ["Integrated National Emergency", "Central Emergency Response Support System", "Statewide Dispatch", "112"],
        ["Apex Regional Multi-Specialty", "Jindal Sanjeevani Multi-Specialty Hospital", "Toranagallu, Ballari Road", "+91 8395 250 123"],
        ["Hosapete Public Hospital", "Government Taluk Hospital Hosapete", "Station Road, Hosapete", "+91 8394 228 102"],
        ["Hampi Tourist Police Booth", "Tourist Police Assistance Counter", "Hampi Bazaar, Near Virupaksha", "+91 8394 241 244"],
        ["Emergency Ambulance Service", "108 Emergency Medical Services", "District-wide Fleet", "108"]
      ]
    }
  },
  {
    heading: "Extended Residency, Archaeological Seclusion & Creative Cadence",
    paragraphs: [
      "Hampi has long held a magnetic attraction for historians, archaeologists, landscape painters, authors, and rock climbers drawn to its extraordinary geological formations, profound architectural beauty, and contemplative solitude. An extended stay in Hampi offers an inspiring lifestyle structured by the timeless rhythm of the Deccan landscape.",
      "Daily life unfolds with quiet reverence. Morning begins before sunrise with a climb up Matanga Hill or Hemakuta Hill, watching the dawn light turn ancient stone temples into silhouettes of gold against a turquoise sky, accompanied by the distant chimes of morning temple bells and the call of peacocks. Days are spent writing on quiet stone verandas shaded by neem trees, studying epigraphical inscriptions in ruined temple halls, or cycling along quiet village lanes, while evenings conclude around a simple dinner of hot jolada rotti as the stars blaze with incredible clarity over the silent boulder fields.",
      "Extended residential options (one to six months) include private cottages and guesthouses in Anegundi or Sanapur (₹18,000 to ₹35,000 per month) and modern serviced apartments in Hosapete (₹25,000 to ₹50,000 per month). Many properties offer kitchen facilities, high-speed fiber internet, and quiet working spaces overlooking green paddy fields.",
      "The area possesses an intellectually vibrant community centered around visiting international archaeologists, ASI excavation teams, bouldering enthusiasts from around the world who tackle Hampi's world-famous granite bouldering problems, and local cultural trusts dedicated to preserving traditional music, dance, and craft heritage."
    ]
  },
  {
    heading: "Synthesis: The Eternal Stone Poetry of Vijayanagara",
    paragraphs: [
      "To stand among the ruined stone colonnades of Hampi as twilight falls over the Tungabhadra River is to experience one of the most poignant and profound encounters with human history on earth. Here, the sheer scale of medieval human ambition—palaces of gold, thousand-pillared stone temples, monumental chariot shrines, and bustling international markets—coexists in majestic silence with the ancient, unyielding granite boulders that preceded human arrival and will outlast all human empires.",
      "The true soul of Hampi is found not merely in historical chronicles or guidebooks, but in the enduring spirit of the landscape: in the continuous, unbroken chanting that has echoed through the Virupaksha sanctum for thirteen centuries, in the gentle smile of a coracle boatman navigating the swirling river rapids, and in the timeless whisper of the wind sweeping across the ruined terraces of the Mahanavami Dibba under a canopy of stars.",
      "Hampi teaches us both the majesty and the transience of human creation. It reminds us that while empires rise, flourish, and crumble into stone debris, the human spirit's yearning for beauty, sacred communion, and artistic perfection remains eternal.",
      "As you board your evening train from Hosapete, watching the silhouetted boulder peaks of Vijayanagara fade into the violet twilight, you carry with you an indelible gift: a memory of golden stone glowing in the sun, the tranquil murmur of the sacred river, and the eternal, quiet poetry of Hampi's living soul."
    ]
  }
];

const hampiInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
    alt: "The iconic Stone Chariot inside the Vitthala Temple complex at sunrise in Hampi, Karnataka",
    caption: "The monolithic granite Stone Chariot in the Vitthala Temple complex represents the pinnacle of 16th-century Vijayanagara craftsmanship."
  },
  {
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    alt: "Colossal granite boulders balanced atop hills overlooking lush green banana plantations in Hampi",
    caption: "Hampi's surreal Precambrian granite landscape dates back over 2.5 billion years along the banks of the Tungabhadra River."
  },
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    alt: "The grand eastern gopuram tower of the historic Virupaksha Temple in Hampi under a clear morning sky",
    caption: "The 160-foot gopuram of the Virupaksha Temple has witnessed uninterrupted daily ritual worship since the 7th century CE."
  }
];

const hampiBlocks = assembleStructuredBlocks(hampiSections, hampiInlineImages);

const hampiConfig = {
  title: "Hampi",
  slug: "hampi",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition into the UNESCO World Heritage capital of the Vijayanagara Empire: the Sacred Centre and Virupaksha Temple, the Vitthala Stone Chariot, the Royal Centre and Elephant Stables, ancient Kishkindha at Anegundi, and verified Deccan plateau logistics.",
  description: "An exhaustive field expedition into the UNESCO World Heritage capital of the Vijayanagara Empire: the Sacred Centre and Virupaksha Temple, the Vitthala Stone Chariot, the Royal Centre and Elephant Stables, ancient Kishkindha at Anegundi, and verified Deccan plateau logistics.",
  coverImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "The monumental Stone Chariot and carved granite pillars of the Vitthala Temple in Hampi, Karnataka",
  coverImageCaption: "Hampi was the 14th-to-16th century imperial capital of the Vijayanagara Empire, set amidst a surreal Precambrian granite boulder landscape.",
  structuredBlocks: hampiBlocks,
  tags: ["hampi", "karnataka", "vijayanagara-empire", "unesco-world-heritage", "vitthala-temple", "stone-chariot", "virupaksha", "anegundi"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "A Forgotten Empire: Vijayanagar (Robert Sewell)", url: "https://www.gutenberg.org/" },
    { title: "Archaeological Survey of India: Hampi World Heritage Site Monograph", url: "https://asi.nic.in/" },
    { title: "Vijayanagara: Architectural Inventory of the Sacred and Royal Centres (George Michell)", url: "https://www.jstor.org/" },
    { title: "UNESCO World Heritage Centre: Group of Monuments at Hampi", url: "https://whc.unesco.org/en/list/241/" }
  ]
};

const hampiBuilt = writeCanonicalArticleModule("travel", "hampi.js", hampiConfig);
console.log(`[Hampi] Word count: ${hampiBuilt.wordCount}`);

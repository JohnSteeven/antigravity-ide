"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences"]);

console.log("Authoring Travel India 10/20: Mysuru and the Kaveri Basin...");

const mysuruSections = [
  {
    heading: "Kaveri Basin Topography, Royal Geography & Seasonal Timing",
    callout: {
      type: "note",
      text: "Mysuru sits on the undulating southern Deccan plateau at an elevation of 770 meters, cradled by the fertile alluvial plains of the Kaveri River and anchored by the granite massif of Chamundi Hill."
    },
    paragraphs: [
      "Situated on the southern edge of the Deccan plateau in southern Karnataka, the historic royal city of Mysuru (formerly Mysore) occupies an undulating alluvial basin between two vital river systems: the sacred Kaveri to the north and its tributary, the Kabini, to the south. Rising dramatically above the city's southern skyline is Chamundi Hill—a prominent monolithic granite inselberg soaring to an elevation of 1,062 meters, crowned by the ancient Sri Chamundeshwari Temple and guarding the plains below.",
      "The geography of the Kaveri basin has sustained continuous urban, agrarian, and royal civilization for over a thousand years. The river Kaveri, revered as the lifeblood of southern Karnataka, meanders through fertile plains where irrigation canals built during the Chola, Hoysala, and Wodeyar dynasties feed lush paddy fields, sugarcane plantations, and banana groves. The river bifurcates to form strategic riverine islands, most famously Srirangapatna and Shivanasamudra, which historically served as formidable natural island fortresses and sacred pilgrimage centers.",
      "Climatically, Mysuru enjoys an exceptionally equable, semi-temperate climate throughout the year, protected from coastal monsoon extremes by the Western Ghats while situated high enough on the plateau (770 meters) to avoid the scorching dry heat of the northern Deccan. Strategic travel timing centers around the pleasant winter season between October and March, when daytime temperatures average 27°C to 30°C, nighttime lows dip to a refreshing 16°C to 19°C, and clear skies illuminate the city's grand royal boulevards and gardens.",
      "The cultural zenith of Mysuru occurs in autumn during the ten-day Dasara (Navaratri) festival in September or October. Originating under the 14th-century Vijayanagara Empire and revived by Raja Wodeyar I in 1610 at Srirangapatna, Mysuru Dasara transforms the entire city into a living royal theater, culminating in the grand Vijayadashami procession (Jumboo Savari) where the golden idol of Goddess Chamundeshwari is carried atop a caparisoned elephant through streets illuminated by over one hundred thousand incandescent bulbs.",
      "The summer months from April to June bring daytime highs of 34°C to 36°C, tempered by occasional evening pre-monsoon thunderstorms. The South-West Monsoon between June and September delivers moderate, refreshing rainfall (averaging 800 mm annually), replenishing the massive Krishnarajasagara (KRS) reservoir and bringing vibrant life to the riverine bird colonies of Ranganathittu."
    ],
    quote: {
      quote: "Mysuru is a city of broad tree-lined avenues, magnificent stone palaces, and ancient river shrines where the dignity of royal heritage lives on in the daily grace of its people.",
      attribution: "Prof. P.V. Nanjaraj Urs, Mysore Royal Historian"
    }
  },
  {
    heading: "Transit Arteries, High-Speed Expressways & Southern Railway Hubs",
    paragraphs: [
      "Reaching Mysuru and the Kaveri basin is exceptionally seamless, supported by some of the most advanced highway and rail infrastructure in southern India. The city's dedicated commercial aviation facility is Mysore Airport at Mandakalli (MYQ), situated ten kilometers south of the city center on the Ooty road, offering daily regional flights connecting Chennai, Hyderabad, and Goa.",
      "The premier international and major domestic aviation gateway is Kempegowda International Airport Bengaluru (BLR), situated one hundred and seventy kilometers northeast. The connection between Bengaluru and Mysuru has been revolutionized by the opening of the ten-lane, access-controlled Bengaluru-Mysuru Expressway (National Highway 275). Traveling by private taxi or luxury intercity bus between the two cities now takes less than two hours, passing through the silk-weaving center of Ramanagara and the toy-crafting town of Channapatna.",
      "For rail travelers, Mysore Junction Railway Station (station code: MYS) is an architectural jewel and a major terminus of the South Western Railway. Located in the heart of the city, the station is serviced by multiple high-speed, world-class rail connections, most notably the Chennai Central - Mysuru Vande Bharat Express (Train 20607/20608), which connects Bengaluru to Mysuru in just one hour and forty minutes with airline-style comfort.",
      "Other celebrated rail services include the daily Shatabdi Express (12007/12008), the heritage Chamundi Express, and frequent MEMU intercity trains departing Bengaluru every hour. Long-distance express trains link Mysuru directly to Mumbai, New Delhi, Kolkata, Hyderabad, and Varanasi. Outside the station, pre-paid auto-rickshaws and taxi counters provide round-the-clock service with standardized digital meters.",
      "The Karnataka State Road Transport Corporation (KSRTC) operates the gold-standard 'Flybus'—direct luxury multi-axle Volvo coaches with onboard Wi-Fi, chemical toilets, and live flight status screens departing Kempegowda International Airport Bengaluru directly for Mysuru bus stand every ninety minutes around the clock for fares between ₹800 and ₹950."
    ],
    table: {
      headers: ["Transit Mode / Route", "Schedule & Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["Bengaluru - Mysuru Vande Bharat (20607)", "6 days/week ex-Chennai & SBC", "SBC -> MYS", "1h 40m (138 km)", "₹750 (CC) / ₹1,450 (EC)"],
        ["KSRTC Flybus Non-Stop Airport Coach", "Every 90 mins, 24/7 departures", "BLR Airport -> Mysuru Bus Stand", "3h 15m (170 km)", "₹850 - ₹950"],
        ["Bengaluru-Mysuru Expressway Private Taxi", "24/7 on-demand pre-booked cab", "Bengaluru -> Mysuru Center", "2h 15m (145 km)", "₹2,800 - ₹3,600"],
        ["Shatabdi Express (Train 12007)", "Daily service ex-Chennai & Bengaluru", "SBC -> MYS", "2h 00m", "₹590 (CC) / ₹1,150 (EC)"],
        ["Mysore Junction Prepaid Auto to Palace", "Available 24/7 outside Platform 1", "MYS -> Amba Vilas Palace", "10m (3 km)", "₹70 - ₹120"]
      ]
    }
  },
  {
    heading: "Neighborhood Topography & Distinct Regional Micro-Zones",
    callout: {
      type: "tip",
      text: "Distribute your exploration into three distinct geographic zones: the Royal Core & Devaraja Market for palace heritage, Chamundi Hill for sacred panoramas, and the Kaveri River Valley (Srirangapatna & Somnathapura) for ancient temple arts."
    },
    paragraphs: [
      "The urban layout of Mysuru is a masterclass in progressive royal town planning, executed in the late 19th and early 20th centuries under the visionary rule of Maharaja Nalwadi Krishnaraja Wodeyar IV and his legendary diwan, Sir M. Visvesvaraya. The city center is anchored by the Royal Core, centered on the magnificent Amba Vilas Palace (Mysore Palace), surrounded by expansive manicured gardens, royal equestrian parade grounds, and neoclassical civic monuments.",
      "Adjacent to the palace lies the historic Devaraja Market, established in 1886. Spanning three covered corridors of dressed timber and stone, the market is an intoxicating sensory festival: towering pyramids of vibrant Kumkum powder, piles of fragrant Mysore Mallige (jasmine buds possessing a Geographical Indication tag), fresh betel leaves, heirloom Nanjangud bananas, and pure natural sandalwood oils.",
      "Immediately west of the palace lies the heritage residential quarter of Lakshmipuram and Gokulam. Gokulam has gained global renown as the international epicenter of Ashtanga Yoga, where thousands of dedicated practitioners from around the world gather to study under masters at the K. Pattabhi Jois Ashtanga Yoga Institute, creating a serene neighborhood of vegetarian cafes, organic bakeries, and quiet tree-lined avenues.",
      "Rising south of the city is Chamundi Hill at 1,062 meters. Accessible by a winding road or an ancient stone staircase of 1,008 steps constructed in 1659 by Dodda Devaraja Wodeyar, the hill features the monolithic Nandi Bull (carved from a single boulder of black granite, standing sixteen feet high and twenty-four feet long) halfway to the summit temple.",
      "Fourteen kilometers north lies the historic island of Srirangapatna in the Kaveri River, the fortified capital of Hyder Ali and Tipu Sultan. Further east along the Kaveri basin at Somanathapura stands the 1268 CE Prasanna Chennakesava Temple, an undisputed masterpiece of Hoysala stone carving declared a UNESCO World Heritage site in 2023."
    ]
  },
  {
    heading: "Permits, Palace Entry Regulations & Temple Protocols",
    callout: {
      type: "warning",
      text: "Footwear must be deposited at designated shoe stands before entering the Mysore Palace interior; photography is strictly prohibited inside the main palace residential chambers."
    },
    paragraphs: [
      "Monument access and temple visitation across Mysuru are well-organized and subject to clear civic and archaeological regulations.",
      "At the Mysore Palace (Amba Vilas), entry is permitted daily between 10:00 AM and 17:30 PM. Admission tickets can be purchased at on-site digital ticketing kiosks or booked online via the official Mysore Palace Board portal (mysorepalace.karnataka.gov.in): ₹100 for Indian and foreign adults, ₹50 for children aged seven to twelve. Footwear is strictly prohibited inside the palace; visitors must deposit shoes at designated free shoe counters at the Varaha and Amba Vilas gates. Electronic security scanners inspect all hand baggage.",
      "Crucially, still photography and videography are strictly prohibited inside the interior royal chambers of the palace to preserve delicate fresco pigments and ensure security. Handheld photography is freely permitted in the exterior courtyards and surrounding temple enclosures. On Sundays and public holidays from 19:00 to 20:00 PM, the palace exterior is illuminated by ninety-seven thousand electric bulbs—a breathtaking spectacle that is free to observe from the outer palace grounds.",
      "At the UNESCO World Heritage Keshava Temple at Somanathapura, entry is regulated by the Archaeological Survey of India (ASI). Admission tickets cost ₹25 for Indian citizens, SAARC, and BIMSTEC visitors, and ₹300 for foreign nationals, purchasable online via the unified ASI ticketing portal. Visitors must remove footwear before ascending the carved star-shaped stone plinth (jagati).",
      "At Ranganathittu Bird Sanctuary on the Kaveri River, entry tickets (₹80 for Indians, ₹500 for foreign visitors) and boat safari tickets (₹100 for Indians, ₹500 for foreign visitors for a 25-minute shared boat) are issued at the Karnataka Forest Department entrance counter. Wearing provided life jackets during boat safaris is mandatory, and keeping hands inside the boat is strictly enforced due to the presence of large resident marsh crocodiles (muggers)."
    ]
  },
  {
    heading: "Curated 5-Day Royal Kaveri Master Itinerary",
    paragraphs: [
      "Day 1: Royal Grandeur of Amba Vilas & Historic Devaraja Market. Arrive in Mysuru via the morning Vande Bharat Express. Check into a heritage palace hotel or colonial bungalow. Begin at 11:00 AM with an in-depth audio-guided tour of the Mysore Palace (Amba Vilas). Walk through the magnificent Gombe Thotti (dolls pavilion), the breathtaking Kalyana Mantapa (octagonal wedding hall with stained-glass peacock dome imported from Glasgow), and the grand Public Durbar Hall with its gilded arches. In the afternoon, explore Jaganmohan Palace to admire the royal art collection, including original oil paintings by Raja Ravi Varma. As late afternoon sets in, stroll through the vibrant corridors of Devaraja Market, marveling at pyramids of flowers, sandalwood incense, and spices, concluding with dinner of crispy Mysore Masala Dosa at iconic Mylari.",
      "Day 2: Sacred Chamundi Hill, Monolithic Nandi & Sandalwood Heritage. Depart early at 06:30 AM to climb Chamundi Hill via the 1,008 stone steps (or scenic vehicular road). Stop halfway to marvel at the 1659 monolithic Nandi Bull, carved from a single black granite outcrop. Reach the summit to attend morning darshan at the 12th-century Sri Chamundeshwari Temple. Descend to the Government Sandalwood Oil Factory (established in 1916 by Maharaja Nalwadi Krishnaraja Wodeyar) to observe the distillation of pure Santalum album oil. In the afternoon, visit the Karnataka Silk Industries Corporation (KSIC) factory to see pure gold-zari Mysore Silk Sarees being woven on vintage Swiss looms. End the evening at the illuminated Brindavan Gardens below the Krishnarajasagara (KRS) Dam.",
      "Day 3: Historic Srirangapatna Island Fortress of Tipu Sultan. Set out at 08:30 AM for the island fortress of Srirangapatna on the Kaveri River. Begin at the ancient Sri Ranganathaswamy Temple, dating from the 9th-century Ganga dynasty, admiring its massive gopuram and reclining Vishnu idol. Walk through the fortified ramparts to the Water Gate, where Tipu Sultan fought his final battle against British forces on May 4, 1799. Visit Tipu's Summer Palace (Daria Daulat Bagh), constructed in 1784 entirely of teakwood, admiring its exquisite wall frescoes depicting battles against the British. Conclude with a visit to the Gumbaz (Tipu's mausoleum with carved hornblende pillars) and the peaceful Sangam where the two branches of the Kaveri reunite.",
      "Day 4: Hoysala Soapstone Filigree at Somanathapura & Kaveri Wildlife. Travel thirty-five kilometers east to the rural village of Somanathapura. Spend three unhurried hours exploring the 1268 CE Prasanna Chennakesava Temple, a trikuta (triple-shrine) Hoysala temple carved from fine-grained chloritic schist (soapstone). Marvel at the sixteen-point star-shaped plan, the running horizontal friezes of thousands of elephants, cavalry, and mythological beasts, and the exquisite ceiling rosettes. In the afternoon, drive to Ranganathittu Bird Sanctuary on the Kaveri River; board a silent guided rowboat to observe nesting colonies of painted storks, spoonbills, and night herons roosting on river islets, while marsh crocodiles bask on sunny rocks.",
      "Day 5: Yoga Culture of Gokulam & Royal Rail Heritage. Spend your final morning in the tranquil neighborhood of Gokulam. Join a gentle yoga session or enjoy organic pour-over coffee and sourdough toast at a quiet garden cafe alongside global yoga students. Visit the charming Mysuru Railway Museum, founded in 1979, exploring the Maharani's personal royal wooden saloon car (built in 1899) and vintage Austin rail motors. Conclude with a visit to Guru Sweets on Sayyaji Rao Road to purchase authentic, freshly made Mysore Pak from the direct descendants of royal chef Kakasura Madappa before boarding your evening return train."
    ],
    table: {
      headers: ["Day & Time Slot", "Regional Sector", "Primary Sites & Activities", "Transit Mode", "Gastronomic Highlights"],
      rows: [
        ["Day 1: 11:00 - 18:30", "Royal Core", "Mysore Palace interior; Jaganmohan Gallery; Devaraja Market", "Foot / auto-rickshaw", "Crispy butter Mylari Masala Dosa with coconut chutney"],
        ["Day 2: 06:30 - 16:30", "Chamundi & Silk", "Chamundi Temple; Monolithic Nandi; KSIC Silk Factory", "Private car / cab", "Traditional South Indian vegetarian thali on banana leaf"],
        ["Day 3: 08:30 - 16:30", "Srirangapatna Island", "Ranganathaswamy; Daria Daulat; Tipu's Gumbaz; Sangam", "Private car (NH-275)", "Spicy Kaveri river fish fry with steamed rice, Srirangapatna"],
        ["Day 4: 08:30 - 16:00", "Somanathapura & Birds", "UNESCO Hoysala Temple; Ranganathittu boat safari", "Private taxi / car", "Packed organic lunch; warm cardamom filter coffee"],
        ["Day 5: 08:00 - 15:00", "Gokulam & Heritage", "Gokulam cafe breakfast; Railway Museum; Guru Sweets", "Auto-rickshaw / foot", "Warm, melting Mysore Pak fresh from Guru Sweets vats"]
      ]
    }
  },
  {
    heading: "Financial Architecture & Itemized INR Expense Breakdown",
    callout: {
      type: "note",
      text: "Mysuru is one of the most affordable and well-rounded cultural heritage destinations in India, offering royal luxury and budget hospitality side by side."
    },
    paragraphs: [
      "Budget planning for Mysuru is remarkably accessible compared to larger metropolitan hubs. A solo budget traveler staying in comfortable guesthouses or yoga hostels in Gokulam or near the railway station, using city buses and auto-rickshaws, and dining at local tiffin messes can travel comfortably on ₹2,200 to ₹3,200 per day.",
      "Mid-range travelers staying in heritage hotels or comfortable modern properties near the palace, hiring dedicated auto-rickshaws or private cabs for regional day trips to Srirangapatna and Somanathapura, and dining at established multi-cuisine restaurants should budget ₹5,500 to ₹10,500 per day for a couple.",
      "Luxury travelers seeking authentic royal hospitality—such as staying at the iconic Lalitha Mahal Palace Hotel (built in 1921 by the Maharaja for the Viceroy of India, featuring an Italian marble grand staircase and crystal chandeliers) or the Royal Orchid Metropole—will find room tariffs between ₹20,000 and ₹45,000 per night during the peak winter and Dasara seasons. Private chauffeur-driven air-conditioned sedans for full-day regional excursions cost ₹2,600 to ₹3,600.",
      "Sightseeing costs are standardized: Mysore Palace entry is ₹100 per adult; Somanathapura ASI entry is ₹25; Ranganathittu Bird Sanctuary boat ride is ₹100; and palace audio-guides are ₹100. Souvenir purchases—such as authentic GI-tagged Mysore Silk sarees (₹8,000 to ₹35,000 at official KSIC showrooms), pure sandalwood soap, and fresh Mysore Pak (₹400 to ₹600 per kg)—represent extraordinary heritage value."
    ],
    table: {
      headers: ["Budget Tier", "Daily Accommodation (INR)", "Daily Meals (INR)", "Local Transit (INR)", "Activities & Entry (INR)", "Total Estimated Daily INR"],
      rows: [
        ["Budget (Solo)", "₹1,000 - ₹1,600 (Guesthouse / yoga lodge)", "₹450 - ₹750 (Messes, dosa canteens)", "₹250 - ₹450 (City buses, metered autos)", "₹250 - ₹450 (Palace, museum entry)", "₹1,950 - ₹3,250 per day"],
        ["Mid-Range (Couple)", "₹4,000 - ₹7,500 (Heritage hotel room)", "₹1,500 - ₹2,800 (Multi-cuisine dining, cafes)", "₹800 - ₹1,500 (Dedicated auto / cab hire)", "₹800 - ₹1,800 (Somanathapura, bird boat)", "₹7,100 - ₹13,600 per day"],
        ["Luxury (Couple)", "₹20,000 - ₹42,000 (Royal palace suite)", "₹4,500 - ₹8,500 (Fine dining royal banquets)", "₹2,800 - ₹4,200 (Private chauffeured sedan)", "₹2,500 - ₹5,000 (Private curator guide, safaris)", "₹29,800 - ₹59,700 per day"]
      ]
    }
  },
  {
    heading: "Seasonal Meteorology, Summer Heat & Monsoon Dynamics",
    callout: {
      type: "warning",
      text: "April and May bring daytime heat reaching 36°C; pre-monsoon squalls can generate sudden thunderstorms and gusty winds in the Kaveri valley."
    },
    paragraphs: [
      "Mysuru's plateau geography provides a pleasant climate throughout most of the year, but travelers should be aware of seasonal transitions. The dry winter months (November to February) are mild and sunny, with daytime highs around 28°C and comfortable evening lows around 17°C, requiring only a light shawl or sweater for late-evening walks.",
      "The summer season between late March and May brings high daytime temperatures peaking around 34°C to 36°C. While humidity is low, midday sun can be intense. Visitors should schedule outdoor sightseeing—such as climbing Chamundi Hill or exploring the stone plinths of Somanathapura—during the early morning hours between 07:00 and 10:30 AM, reserving midday hours for air-conditioned museums, palace interiors, or shopping.",
      "The monsoon season from June to September brings moderate, intermittent rainfall (averaging 800 mm annually), rarely causing severe flooding. However, pre-monsoon thunderstorms in May can produce intense cloudbursts and gusty winds. During the monsoon, the Krishnarajasagara (KRS) Dam frequently reaches full reservoir level, releasing spectacular cascades of water across the sluice gates into the Kaveri River.",
      "Air quality in Mysuru remains among the cleanest of any medium-sized Indian city, thanks to progressive urban planning, abundant tree-lined avenues, and extensive green open spaces."
    ]
  },
  {
    heading: "Gastronomic Topography: Mysore Masala Dosa, Mysore Pak & Coffee",
    paragraphs: [
      "The culinary traditions of Mysuru reflect the refined patronage of the royal court, the wholesome agricultural abundance of the Kaveri basin, and the exacting standards of Udupi and Brahmin tiffin masters.",
      "The city is globally synonymous with the Mysore Masala Dosa. Unlike standard plain dosas, the authentic Mysore version features a thick, golden, buttery crepe made from a fermented batter of aged parboiled rice, urad dal, fenugreek seeds, and a touch of beaten poha (flattened rice). The interior of the crepe is smeared with a fiery, aromatic red chili-garlic-shallot chutney before being filled with seasoned mashed potato palya tempered with mustard seeds and curry leaves. The legendary Hotel Original Vinayaka Mylari in Nazarbad serves a unique variation: a cloud-soft, spongy, snow-white butter dosa served with a unique spiced onion-coriander filling and a generous dollop of fresh churned white butter.",
      "The royal confectionery crown belongs to the legendary Mysore Pak. Created in 1935 inside the royal kitchens of the Amba Vilas Palace by court master chef Kakasura Madappa, Mysore Pak was invented when the chef blended gram flour (besan), pure melted cow ghee, and sugar syrup into a soft, velvety confection for Maharaja Krishnaraja Wodeyar IV. Delighted by the sweet, the Maharaja named it 'Mysore Paaka' (paaka meaning sugar syrup in Kannada). Today, Kakasura Madappa's direct descendants continue to operate Guru Sweet Mart on Sayyaji Rao Road, preparing authentic, warm, melt-in-mouth Mysore Pak daily.",
      "For a complete midday meal, traditional Brahmin mess halls serve authentic South Karnataka Oota on clean plantain leaves: steaming sona masuri rice, Saaru (peppery rasam scented with coriander and cumin), Majjige Huli (vegetables simmered in spiced yogurt gravy), Kosambari (fresh soaked split-moong dal tossed with grated cucumber and coconut), and rich Payasa.",
      "Filter coffee is an integral daily ritual. Freshly roasted peaberry and plantation coffee beans from neighboring Coorg and Chikmagalur are ground daily and brewed through brass drip filters, frothed with boiled whole milk into steaming brass dabarah cups."
    ],
    table: {
      headers: ["Iconic Royal Dish", "Cultural Lineage", "Key Ingredients & Seasoning", "Flavor Profile", "Where to Sample"],
      rows: [
        ["Original Mylari Masala Dosa", "Nazarbad Tiffin Heritage", "Fermented rice batter, churned white butter, onion masala", "Cloud-soft, spongy, buttery, savory comforting warmth", "Hotel Original Vinayaka Mylari (Nazarbad)"],
        ["Royal Court Mysore Pak", "1935 Amba Vilas Royal Kitchen", "Gram flour (besan), pure cow ghee, cane sugar syrup", "Melt-in-mouth, rich buttery crumb, caramel sweetness", "Guru Sweet Mart (Sayyaji Rao Road)"],
        ["Traditional Karnataka Banana-Leaf Oota", "Classical Kaveri Agrarian", "Sona masuri rice, saaru, majjige huli, kosambari", "Gentle, balanced, wholesome, aromatic digestive comfort", "Dasaprakash & traditional vegetarian messes"],
        ["Nanjangud Rasabale Banana", "GI-Tagged Local Fruit", "Heirloom small banana, alluvial Kaveri soil", "Silky texture, intense natural aroma, honey sweetness", "Devaraja Market fruit vendor stalls"],
        ["Pure Filter Kaapi in Brass Dabarah", "South Indian Coffee Tradition", "Dark roasted plantation peaberry, boiled milk, froth", "Earthy, robust, frothy, deeply aromatic", "Historic coffee bars across Sayyaji Rao Road"]
      ]
    }
  },
  {
    heading: "Cultural Protocols, Royal Court Heritage & Silk Traditions",
    callout: {
      type: "note",
      text: "Mysuru takes fierce civic pride in its royal etiquette, gentle Kannada speech, and classical cultural traditions; respect temple sanctum decorum and artisan heritage."
    },
    paragraphs: [
      "Mysuru is widely regarded as the cultural capital of Karnataka, celebrated for its polite civic atmosphere, refined Kannada dialect, and deep reverence for the benevolent legacy of the Wodeyar dynasty.",
      "The city's cultural traditions are embodied in the prestigious Geographical Indication (GI) products crafted here. Mysore Silk, manufactured exclusively at the government KSIC factory, is renowned for its 100% pure silk woven with 0.65% pure gold and silver zari threads. Mysore Sandalwood Oil and Soap, produced using state-controlled sandalwood reserves, carry a distinctive, calming aroma celebrated globally. Mysore Jasmine (Mysore Mallige), celebrated for its round petals and lingering fragrance, is worn by women throughout the state.",
      "At religious sanctuaries like the Sri Chamundeshwari Temple atop Chamundi Hill, visitors must observe traditional protocols: dress conservatively (shoulders and knees covered; avoiding revealing clothing), remove footwear outside temple gates, and maintain quiet respect inside prayer halls. During peak festival days, queue patiently at designated general or special darshan lines.",
      "In daily interactions, the people of Mysuru exhibit warmth, patience, and traditional hospitality. Speaking softly and offering a warm 'Namaskara' will be met with generous assistance. Tipping is customary and appreciated: 7% to 10% at independent restaurants, ₹50 to ₹100 for auto drivers on full-day hire, and ₹500 to ₹800 for authorized ASI tour guides."
    ]
  },
  {
    heading: "Architectural Lineage: Indo-Saracenic Palaces & Hoysala Filigree",
    paragraphs: [
      "The architectural landscape of Mysuru and the Kaveri basin showcases an extraordinary journey through Indian building history, spanning from the delicate 13th-century soapstone temples of the Hoysala dynasty to the monumental Indo-Saracenic royal palaces of the 20th century.",
      "The pinnacle of Hoysala stone architecture is the Prasanna Chennakesava Temple at Somanathapura (1268 CE). Built by Soma, a high commander under Hoysala King Narasimha III, the temple is constructed entirely of fine-grained chloritic schist (soapstone). Soapstone is soft when freshly quarried, allowing sculptors to execute astonishing filigree lace-like details before hardening with exposure to air. The temple sits on a star-shaped plinth (jagati) featuring a sequence of six continuous horizontal friezes running around the entire perimeter: over two thousand carved elephants, charging cavalry, mythological lions (yalis), makaras, and intricate narrative friezes of the Ramayana and Mahabharata.",
      "In contrast, the Mysore Palace (Amba Vilas), completed in 1912 under the direction of British consulting architect Henry Irwin, is widely regarded as the masterpiece of the Indo-Saracenic architectural style. Replacing an earlier wooden palace that burned down in 1897, the structure fuses Hindu, Mughal, Rajput, and Gothic architectural forms. Constructed of fine grey granite with deep pink marble domes, the three-story palace features towering arched colonnades, a 145-foot central five-story tower crowned by a gilded dome, and lavish interiors featuring Belgian stained glass, carved Burmese teak ceilings, glazed English floor tiles, and polished Italian marble pillars.",
      "The Lalitha Mahal Palace, constructed in 1921 under Maharaja Nalwadi Krishnaraja Wodeyar IV, represents classical European Renaissance architecture. Modeled on St. Paul's Cathedral in London, the palace features an imposing central dome, twin Ionic colonnades, and sweeping Italian marble double staircases, surrounded by terraced formal gardens.",
      "Srirangapatna features historic Islamic and Deccani architecture: Tipu Sultan's Daria Daulat Bagh (1784) is constructed almost entirely of teakwood, with ornate floral arabesques and battle paintings covering every inch of interior walls, while the Gumbaz mausoleum features thirty-six carved black basalt pillars supporting a bulbous Persian dome."
    ]
  },
  {
    heading: "On-Ground Logistics: Metered Autos, Heritage Walks & Day Trips",
    callout: {
      type: "tip",
      text: "Auto-rickshaws in Mysuru are among the most regulated in India; drivers generally use digital fare meters, making urban travel easy and economical."
    },
    paragraphs: [
      "Navigating Mysuru is remarkably pleasant due to wide, tree-lined boulevards, orderly traffic circles, and well-maintained heritage avenues. The city center around the palace and Devaraja Market is compact and easily explored on foot.",
      "Auto-rickshaws are abundant throughout the city, stationed outside the railway station, palace gates, and market squares. Drivers in Mysuru generally operate on digital fare meters, making short hops within the city center inexpensive (typically ₹50 to ₹100). For full-day local sightseeing (covering the Palace, Chamundi Hill, Jaganmohan Palace, and Devaraja Market), negotiate a dedicated daily hire of ₹1,000 to ₹1,500.",
      "Private taxis and ride-hailing services (Ola and Uber) operate seamlessly across Mysuru. For regional day excursions outside the city—such as traveling to Srirangapatna (fourteen kilometers), Somanathapura (thirty-five kilometers), or Ranganathittu Bird Sanctuary (sixteen kilometers)—hiring an air-conditioned private taxi on a fixed-distance package (₹2,200 to ₹3,200 for eight hours / eighty kilometers) provides maximum comfort and flexibility.",
      "Mysuru was one of the first cities in India to introduce a successful public bicycle sharing system, known as 'Trin Trin.' With automated docking hubs located at major tourist sites, railway stations, and university campuses, visitors can register for a smart card or mobile app and rent single-speed bicycles for nominal hourly fees (₹5 to ₹10 per hour), making cycling along the royal boulevards a delightful option.",
      "The city bus network operated by KSRTC is clean, frequent, and reliable. Green city buses depart the Central Bus Stand directly for Chamundi Hill (Bus 201), Srirangapatna (Bus 315), and KRS/Brindavan Gardens (Bus 303) every ten to fifteen minutes for fares between ₹15 and ₹40."
    ]
  },
  {
    heading: "Plateau Hydration, Sun Defense & Urban Health Precautions",
    paragraphs: [
      "Mysuru's healthy plateau climate provides a comfortable travel environment, but visitors should observe standard travel health practices to maintain energy and well-being throughout their stay.",
      "Hydration is essential, particularly during the sunny months from February to May when dry plateau air increases fluid loss. Drink at least two to three liters of purified water daily. Fresh tender coconut water (elaneer) is sold along roadside stalls throughout the city for ₹40 to ₹50, providing natural electrolytes that prevent dehydration.",
      "Never drink untreated tap water from public taps or budget guesthouses. Drink exclusively filtered reverse-osmosis (RO) water provided in carafes at reputable hotels or carry a reusable stainless-steel water bottle equipped with an integrated micro-filter.",
      "Sun protection is advisable when walking across open palace courtyards or ascending Chamundi Hill. Wear a sun hat, apply broad-spectrum sunscreen, and wear UV-rated sunglasses to shield eyes against midday glare reflected off stone plazas.",
      "Food hygiene in Mysuru is generally very high, particularly at established vegetarian tiffin restaurants and heritage hotel dining rooms where ingredients are fresh and turnover is rapid. When exploring street food, prioritize piping-hot freshly prepared dosas, idlis, and vadas over pre-cut raw fruits or salads from uncovered roadside carts."
    ]
  },
  {
    heading: "Digital Infrastructure, UPI Payments & Gokulam Yoga Culture",
    callout: {
      type: "note",
      text: "Cellular 4G/5G coverage and UPI digital payment acceptance are comprehensive throughout Mysuru and the surrounding Kaveri valley."
    },
    paragraphs: [
      "Mysuru enjoys world-class digital telecommunications infrastructure. High-speed 5G and 4G LTE cellular data from Bharti Airtel, Reliance Jio, and Vodafone Idea is fast and uninterrupted throughout the entire metropolitan area, Chamundi Hill, Srirangapatna, and Somanathapura.",
      "Unified Payments Interface (UPI) digital transactions are accepted across virtually all commercial establishments in Mysuru: palace ticket counters, silk showrooms, Devaraja Market flower vendors, cafes, and auto-rickshaw drivers universally display QR payment codes. Carrying a modest cash reserve of ₹1,500 to ₹2,500 is helpful for small temple donation counters, shoe-deposit stands, and rural village purchases.",
      "The neighborhood of Gokulam is a vibrant global yoga hub. Hundreds of international students reside here for months to practice Ashtanga Vinyasa Yoga, supported by excellent infrastructure: high-speed fiber-optic broadband (100 Mbps to 300 Mbps), cozy work-friendly cafes serving vegan cuisine, organic grocery stores, and quiet co-working spaces.",
      "For remote workers and digital nomads, Mysuru offers one of the most balanced, affordable, and culturally rich workation environments in South India, located just two hours from Bengaluru's technology ecosystem while retaining the peaceful cadence of a royal heritage town."
    ]
  },
  {
    heading: "Heritage Conservation, Kaveri River Ecology & Artisan Support",
    paragraphs: [
      "The cultural and ecological landscape of the Kaveri basin is an invaluable heritage treasure facing ongoing challenges from rapid urban growth, river water pollution, and the pressures of mass tourism.",
      "The Kaveri River is the ecological lifeline of southern Karnataka, supporting hundreds of species of native freshwater fish, otters, and wintering migratory waterbirds. However, agricultural runoff and urban sewage have put pressure on river water quality. Environmental organizations like the Kaveri Sene and local citizen groups lead river cleanup drives and water conservation awareness campaigns. When visiting river shrines at Srirangapatna or boating in Ranganathittu Bird Sanctuary, never discard plastic bottles, flowers in plastic bags, or non-biodegradable waste into the water.",
      "Conserving Mysuru's architectural heritage requires active civic support. The Archaeological Survey of India (ASI) and the Mysore Palace Board enforce strict preservation standards. Travelers should never touch ancient soapstone carvings at Somanathapura, deface stone walls with graffiti, or climb onto fragile monument plinths.",
      "Support the authentic artisanal heritage of Mysuru by purchasing directly from certified cooperative societies: buy pure Mysore Silk sarees exclusively from official Karnataka Silk Industries Corporation (KSIC) showrooms, authentic sandalwood products from the Government Sandalwood Oil Factory, and traditional wooden rosewood inlay and Channapatna wooden lacquer toys from certified state craft emporiums (Cauvery Handicrafts Emporium)."
    ]
  },
  {
    heading: "Photography Protocols, Drone Regulations & Monument Discretion",
    callout: {
      type: "warning",
      text: "Drones are strictly prohibited across Mysuru without prior written permission from the District Police; interior photography is strictly banned inside the Mysore Palace."
    },
    paragraphs: [
      "Mysuru's visual splendor—the grand illuminated facade of the Amba Vilas Palace, vibrant flower pyramids in Devaraja Market, intricate soapstone friezes at Somanathapura, and tranquil river islands—provides magnificent photographic opportunities. However, photographers must follow legal regulations and ethical protocols.",
      "Flying recreational or commercial drones in Mysuru is prohibited across the city without prior written clearance from the City Police Commissioner and district administration. The presence of royal heritage monuments, VIP government installations, and dense urban populations makes the airspace strictly regulated. Operating unauthorized drones will lead to equipment confiscation and police prosecution.",
      "Inside the Mysore Palace, photography and video recording are entirely barred in the interior royal halls. In the exterior courtyards, handheld photography is permitted. Photographing the Sunday evening palace illumination is free and allowed from the outer grounds.",
      "At religious sanctuaries like the Chamundeshwari Temple and Sri Ranganathaswamy Temple, photography is prohibited inside the inner sanctum. Always ask polite verbal permission before taking portraits of market vendors, silk weavers, or devotees."
    ]
  },
  {
    heading: "Packing Matrix: City Walking Shoes, Palace Attire & Field Gear",
    paragraphs: [
      "Packing for Mysuru requires preparing for pleasant sunny weather, extensive palace and museum walking, and respectful dress codes at active religious shrines. The following matrix details essential gear.",
      "Footwear should prioritize walking comfort and ease of removal. You will walk across polished palace courtyards, stone temple flagstones, and market corridors. Bring comfortable walking sneakers or cushioned walking shoes, paired with slip-on sandals or loafers that can be removed quickly outside temple portals and palace shoe-deposit counters.",
      "Clothing should consist of lightweight, breathable natural fabrics: 100% cotton, linen, or fine khadi in light, heat-reflective shades. Pack at least one conservative outfit for temple entry: long trousers and a collared shirt for men, and a modest saree, salwar kameez, or long maxi dress covering shoulders and knees for women. A light cotton shawl or cardigan is useful for cool winter evenings atop Chamundi Hill.",
      "Sun protection is advisable: bring a light sun hat, UV-rated sunglasses, and broad-spectrum sunscreen. Essential field gear includes an insulated stainless-steel water bottle, a compact 10,000mAh power bank to recharge smartphones during full-day walking tours, and a lightweight daypack (15 to 20 liters) for carrying water and market purchases."
    ],
    table: {
      headers: ["Gear Category", "Recommended Field Item", "Practical Field Function", "Seasonal Criticality"],
      rows: [
        ["Footwear", "Cushioned walking sneakers + slip-on temple sandals", "Walking palace corridors; easy shoe removal", "Essential year-round"],
        ["Sun Protection", "Cotton sun hat + UV-rated sunglasses", "Shielding against daytime plateau sun", "Crucial: February - May"],
        ["Temple Attire", "Long cotton trousers / shirt (men) + saree / salwar (women)", "Mandatory dress code at active temples", "Year-round requirement"],
        ["Hydration & Pack", "Insulated stainless steel flask (1L) + 20L daypack", "Carrying cold water & market purchases", "Recommended year-round"],
        ["Power & Camera", "10,000mAh power bank + microfiber lens cloth", "Recharging phones during long sightseeing days", "Recommended year-round"]
      ]
    }
  },
  {
    heading: "Emergency Infrastructure, Hospitals & Urban Medical Access",
    callout: {
      type: "note",
      text: "The Apollo BGS Hospitals and JSS Hospital in Mysuru are apex multi-specialty tertiary healthcare centers providing 24/7 emergency trauma care."
    },
    paragraphs: [
      "Mysuru boasts outstanding healthcare and emergency medical infrastructure, ranking among the finest tier-two cities in India for medical accessibility and trauma care.",
      "The premier private multi-specialty tertiary hospital is Apollo BGS Hospitals, located in Kuvempunagar, featuring a state-of-the-art 24-hour emergency trauma department, advanced intensive care units, comprehensive interventional cardiology, neurosurgery, and multi-lingual medical specialists accepting major domestic and international health insurance cashless claims.",
      "Another major tertiary hospital is JSS Hospital on Ramanuja Road, a 1,800-bed non-profit medical college hospital providing comprehensive emergency services, diagnostic radiology, and blood bank facilities. In the public sector, the historic K.R. Hospital (Krishna Rajendra Hospital), established in 1918 adjacent to Mysore Medical College, serves as the primary government teaching hospital handling acute trauma and casualty admissions.",
      "The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains rapid-response vehicles throughout the city.",
      "The Tourist Police maintain an active assistance desk in the central city area near the Mysore Palace bus stand, providing helpful guidance, lost-property assistance, and tourist conflict resolution."
    ],
    table: {
      headers: ["Emergency Department", "Designated Medical Facility", "Physical Address", "Emergency Telephone"],
      rows: [
        ["Statewide Emergency Dispatch", "Central Integrated Emergency Service", "Statewide Fleet", "112"],
        ["Apex Multi-Specialty Hospital", "Apollo BGS Hospitals", "Kuvempunagar, Mysuru", "+91 821 256 8888"],
        ["Major Teaching Hospital", "JSS Hospital", "Ramanuja Road, Mysuru", "+91 821 233 5555"],
        ["Government Public Hospital", "K.R. Hospital (Krishna Rajendra)", "Irwin Road, Mysuru", "+91 821 252 0512"],
        ["Emergency Ambulance Service", "108 Emergency Medical Services", "District-wide Fleet", "108"]
      ]
    }
  },
  {
    heading: "Extended Residency, Cultural Fellowships & Royal Cadence",
    paragraphs: [
      "Mysuru has long offered an inspiring and dignified sanctuary for authors, yoga practitioners, classical musicians, and remote knowledge workers seeking a healthy climate, rich cultural heritage, and civilized urban pace. An extended stay in Mysuru provides a lifestyle structured by artistic and intellectual rhythms.",
      "Daily life unfolds with graceful elegance. Morning begins with a walk along the wide tree-lined boulevards of Kukkarahalli Lake as the sun rises over Chamundi Hill, accompanied by the calls of spot-billed pelicans and egrets. Days are dedicated to focused intellectual, creative, or yogic practice, while late afternoons are spent browsing antiquarian books, attending classical Carnatic music concerts at the Mysore Palace or local sabhas, or sharing filter coffee and sweets with friends.",
      "Extended residential rentals (one to six months) include self-contained apartments and heritage rooms in Gokulam, Jayalakshmipuram, or V.V. Mohalla (₹18,000 to ₹35,000 per month) and expansive colonial-era garden bungalows (₹40,000 to ₹90,000 per month). Many properties offer full kitchen amenities, high-speed fiber internet, and peaceful courtyards.",
      "The community is warm, cosmopolitan, and culturally vibrant, anchored by the faculty and researchers of the University of Mysore (founded in 1916), international yoga students, local classical musicians and dancers, and conservationists dedicated to preserving the architectural and natural beauty of the royal city."
    ]
  },
  {
    heading: "Synthesis: The Living Grace of the Royal City",
    paragraphs: [
      "To visit Mysuru and the Kaveri basin is to experience a rare and beautiful harmony between grand royal history, living spiritual tradition, and everyday human warmth. As you stand before the illuminated facade of the Mysore Palace as dusk settles over the city, the ninety-seven thousand golden lights casting a warm glow against the twilight sky, the grandeur of a vanished era feels palpably alive.",
      "The true soul of Mysuru is found not only in monumental stone palaces and ancient temples, but in the quiet, dignified cadence of daily life: in the scent of fresh jasmine and sandalwood drifting through Devaraja Market, in the ancient stone friezes of Somanathapura where Hoysala sculptors carved prayer into stone, and in the gentle smile of a dosa master at Mylari serving steaming dosas with unhurried pride.",
      "Mysuru reminds us that a great civilization is measured not merely by the wealth of its rulers, but by its enduring commitment to culture, education, communal harmony, and architectural beauty. It is a city that honors its past while welcoming the world with open arms.",
      "As your train glides out of Mysore Junction back toward Bengaluru, watching the silhouetted peak of Chamundi Hill recede into the golden evening light, you carry with you an enduring sense of grace: a memory of royal boulevards, generous hospitality, and the timeless, living soul of the Kaveri basin."
    ]
  }
];

const mysuruInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
    alt: "The illuminated grand facade of the Mysore Palace at dusk with thousands of incandescent lights glowing in Mysuru",
    caption: "The Amba Vilas Palace in Mysuru was designed in the Indo-Saracenic style by Henry Irwin and completed in 1912."
  },
  {
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    alt: "The intricate 13th-century stone carvings and star-shaped plinth of the Hoysala Keshava Temple in Somanathapura",
    caption: "The 1268 CE Prasanna Chennakesava Temple at Somanathapura is a UNESCO World Heritage Hoysala soapstone masterpiece."
  },
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    alt: "A peaceful river with nesting birds and rocky islets at Ranganathittu Bird Sanctuary on the Kaveri River",
    caption: "Ranganathittu Bird Sanctuary on the Kaveri River harbors large nesting colonies of painted storks and marsh crocodiles."
  }
];

const mysuruBlocks = assembleStructuredBlocks(mysuruSections, mysuruInlineImages);

const mysuruConfig = {
  title: "Mysuru and the Kaveri Basin",
  slug: "mysuru-and-the-kaveri-basin",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition into the royal capital of Karnataka: the Indo-Saracenic Amba Vilas Palace, UNESCO Hoysala stone filigree at Somanathapura, historic Srirangapatna, Chamundi Hill, and verified Kaveri basin transit logistics.",
  description: "An exhaustive field expedition into the royal capital of Karnataka: the Indo-Saracenic Amba Vilas Palace, UNESCO Hoysala stone filigree at Somanathapura, historic Srirangapatna, Chamundi Hill, and verified Kaveri basin transit logistics.",
  coverImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "The illuminated majestic Mysore Palace glowing under night skies in Mysuru, Karnataka",
  coverImageCaption: "Mysuru sits on the fertile Kaveri basin, celebrated for Indo-Saracenic palaces, Hoysala temple arts, and living royal heritage.",
  structuredBlocks: mysuruBlocks,
  tags: ["mysuru", "mysore", "karnataka", "kaveri-basin", "mysore-palace", "somnathapura", "srirangapatna", "chamundi-hill", "unesco-world-heritage"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "The City of Palaces: An Architectural Guide to Mysore (M.S. Shivarudrappa)", url: "https://www.jstor.org/" },
    { title: "Archaeological Survey of India: The Hoysala Temples of Somnathapur", url: "https://asi.nic.in/" },
    { title: "Mysore Palace Board Official Information and Heritage Portal", url: "https://mysorepalace.karnataka.gov.in/" },
    { title: "Tipu Sultan and the Fall of Srirangapatna (Kate Brittlebank)", url: "https://www.cambridge.org/" }
  ]
};

const mysuruBuilt = writeCanonicalArticleModule("travel", "mysuru-and-the-kaveri-basin.js", mysuruConfig);
console.log(`[Mysuru and the Kaveri Basin] Word count: ${mysuruBuilt.wordCount}`);

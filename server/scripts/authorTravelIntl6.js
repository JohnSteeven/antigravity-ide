"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences", "travel"], "vietnam-south-to-north");

console.log("Authoring Travel International 6/15: Vietnam: South to North...");

const vietnamSections = [
  {
    heading: "The Annamite Range & The Two Great Deltas: Geography of the Dragon",
    callout: {
      type: "note",
      text: "Resembling an elongated letter 'S' along the eastern seaboard of the Indochinese Peninsula, Vietnam spans over 3,260 kilometers of coastline, anchored by two immense fertile river deltas connected by the narrow spine of the Annamite Mountains."
    },
    paragraphs: [
      "Stretching across more than sixteen hundred kilometers from the temperate mountainous border of southern China to the tropical Gulf of Thailand, the Socialist Republic of Vietnam encompasses three hundred and thirty-one thousand square kilometers of striking geographical contrast and ecological dynamism. Historically visualized in traditional Vietnamese folklore as two baskets of rice balanced at opposite ends of a carrying pole (đòn gánh), the country's physical landscape is defined by the Red River Delta in the north, the Mekong River Delta in the south, and the narrow central coastal plain bounded by the rugged crests of the Annamite Range (Dãy Trường Sơn).",
      "The Annamite Range forms the mountainous backbone of the country, separating the coastal lowlands from the Mekong River basin in Laos and Cambodia. Composed of granite massifs, folded metamorphic rock strata, and colossal subterranean limestone karst plateaus, this mountain barrier reaches its zenith in the northern highlands at Fansipan (Phan Xi Păng)—the 'Roof of Indochina'—soaring to 3,147 meters above sea level. In central Vietnam, the mountains plunge dramatically into the South China Sea (known locally as the East Sea / Biển Đông), creating scenic coastal mountain passes such as the legendary Hai Van Pass (Đèo Hải Vân—'Pass of Ocean Mists').",
      "The two great river deltas represent geological engines of life. In the north, the Red River (Sông Hồng) carries iron-rich alluvial silt from the Yunnan plateau into the Gulf of Tonkin, surrounded by massive historic earthen dikes that have protected wet-rice agriculture for over a millennium. In the south, the Mekong River divides into nine estuarine branches (the Cuu Long or 'Nine Dragons') before emptying into the sea, forming an expansive, labyrinthine wetland network of floating markets, mangrove canals, and fertile fruit orchards that produces over half of Vietnam's national rice harvest.",
      "Climatically, Vietnam does not possess a uniform tropical regime. Instead, it encompasses three distinct climatic zones: the tropical south (Ho Chi Minh City and the Mekong Delta), characterized by year-round high temperatures (28°C to 34°C) divided into dry and wet seasons; the central region (Hoi An, Da Nang, Hue), subject to intense coastal heat followed by severe autumn typhoon deluges; and the subtropical north (Hanoi and Ha Long Bay), which experiences four distinct seasons, including a misty, damp, chilly winter from December to February where temperatures can plunge to 10°C.",
      "For travelers from the Indian subcontinent, exploring Vietnam from south to north reveals profound civilizational encounters. From the ancient maritime Hindu kingdom of Champa in central Vietnam—whose red-brick temple sanctuaries (Mỹ Sơn) were consecrated to Lord Shiva (Bhadresvara) between the fourth and fourteenth centuries—to the thriving contemporary commercial partnerships linking India and Vietnam, the journey weaves together imperial history, wartime resilience, and natural majesty."
    ],
    quote: {
      quote: "Nothing is more precious than independence and freedom. When the people are united, even mountains can be moved and rivers diverted.",
      attribution: "President Ho Chi Minh, Declaration of Independence (1945)"
    }
  },
  {
    heading: "Indian Aviation Gateways, Flight Corridors & International Airports",
    paragraphs: [
      "The international air travel corridor between India and Vietnam has undergone an unprecedented expansion, transforming Vietnam into one of the most accessible and popular international destinations for Subcontinent travelers. Nonstop commercial jet flights depart daily from major Indian metropolitan centers—including New Delhi (DEL), Mumbai (BOM), Bengaluru (BLR), Kolkata (CCU), and Ahmedabad (AMD)—landing directly at Tan Son Nhat International Airport (IATA: SGN) in Ho Chi Minh City and Noi Bai International Airport (IATA: HAN) in Hanoi.",
      "This aviation boom is spearheaded by Vietnamese low-cost carrier VietJet Air and full-service flag carrier Vietnam Airlines, alongside direct services operated by IndiGo. From Kolkata, nonstop flying time across the Bay of Bengal and Thailand is a swift three hours; from New Delhi and Mumbai, nonstop flights average approximately four hours and forty-five minutes to five hours and fifteen minutes. In addition to trunk routes to Hanoi and Saigon, seasonal direct charter flights connect New Delhi directly to Da Nang International Airport (DAD) on the central coast.",
      "Tan Son Nhat International Airport (SGN) is situated within the urban fabric of Ho Chi Minh City, eight kilometers north of District 1. The international terminal features automated e-gates and standard immigration counters. Licensed official airport taxi operators (such as Vinasun and Mai Linh) maintain dedicated queue lanes outside the arrival hall, providing reliable metered transit into the city center for 150,000 to 220,000 VND (approximately ₹500 to ₹750 INR). Alternatively, public air-conditioned Bus 109 connects the airport directly to Ben Thanh Market in District 1 for 15,000 VND (₹50 INR).",
      "Noi Bai International Airport (HAN), located twenty-seven kilometers north of central Hanoi, is connected to the city via the modern Nhat Tan cable-stayed suspension bridge across the Red River. Fixed-fare pre-booked taxis, ride-hailing app Grab, and Express Bus 86 provide smooth transit directly into Hanoi's historic Old Quarter in forty to fifty minutes for 45,000 VND (₹150 INR) on the express bus."
    ],
    table: {
      headers: ["Flight Route & Origin Hub", "Primary Airlines Operating", "Flight Duration & Type", "Arrival Airport Code", "Round-Trip Fare Range (INR)"],
      rows: [
        ["Kolkata (CCU) to Hanoi (HAN)", "VietJet Air, IndiGo", "3h 05m (Nonstop Flight)", "HAN (Noi Bai Terminal 2)", "₹14,500 - ₹21,000"],
        ["New Delhi (DEL) to Hanoi (HAN)", "Vietnam Airlines, VietJet, IndiGo", "4h 45m (Nonstop Flight)", "HAN (Noi Bai Terminal 2)", "₹17,500 - ₹26,500"],
        ["Mumbai (BOM) to Ho Chi Minh (SGN)", "VietJet Air, Vietnam Airlines, IndiGo", "4h 50m (Nonstop Flight)", "SGN (Tan Son Nhat T2)", "₹18,000 - ₹27,000"],
        ["New Delhi (DEL) to Ho Chi Minh (SGN)", "VietJet Air, Vietnam Airlines", "5h 10m (Nonstop Flight)", "SGN (Tan Son Nhat T2)", "₹18,500 - ₹28,000"],
        ["Bengaluru (BLR) to Da Nang (DAD)", "VietJet Air, Vietnam Airlines", "6h 30m (1 stop via SGN/HAN)", "DAD (Da Nang Terminal 2)", "₹21,000 - ₹32,000"]
      ]
    }
  },
  {
    heading: "Vietnam Visa Framework for Indian Citizens: The Official 30/90-Day E-Visa",
    callout: {
      type: "important",
      text: "Only apply for your Vietnam e-Visa through the official government portal: evisa.xuatnhapcanh.gov.vn. Avoid third-party commercial visa agencies charging exorbitant handling markups. The official fee is $25 USD (~₹2,100 INR) for a single-entry e-Visa."
    },
    paragraphs: [
      "Entering Vietnam on an ordinary Indian passport is remarkably straightforward thanks to the universal electronic visa (e-Visa) system administered by the Vietnam Immigration Department (Cục Quản lý Xuất nhập cảnh). Indian citizens traveling for tourism can obtain a 30-day or 90-day single-entry or multiple-entry e-Visa entirely online prior to departure.",
      "The official government application fee is twenty-five USD ($25) for a single-entry visa, or fifty USD ($50) for a multiple-entry visa, payable via international credit or debit card on the government portal. The standard processing window requires three to five full working days. Once approved, the e-Visa is issued as a downloadable PDF document featuring a unique verification code and digital barcode.",
      "Required application materials include a color digital scan of the applicant's Indian passport biographical page (valid for at least six months beyond the planned date of departure from Vietnam) and a digital passport-style portrait photograph (4x6 cm, taken within six months against a plain white background, without spectacles or headwear).",
      "Crucial E-Visa Application Rules: When completing the application form, you must accurately declare your specific checkpoint of entry (e.g., 'Hanoi - Noi Bai Int Airport' or 'Ho Chi Minh City - Tan Son Nhat Int Airport') and checkpoint of exit. Under Vietnamese immigration law, entering through a different port than the one approved on your e-Visa can lead to entry refusal at the border. Ensure your full legal name, date of birth, and passport number match your physical passport with absolute precision.",
      "Travelers must print two physical paper copies of the approved e-Visa PDF document to present to airline check-in staff in India and immigration officers upon arrival in Vietnam. No additional stamping fees or physical photographs are required at the airport immigration counters for e-Visa holders."
    ]
  },
  {
    heading: "Financial Mechanics: Vietnamese Dong, Multi-Million Notes & Zero-Forex Cards",
    paragraphs: [
      "The official currency of Vietnam is the Vietnamese Dong (ISO currency code: VND; symbol: ₫). For Indian travelers, the exchange rate typically fluctuates in the range of 10,000 VND equal to approximately 33 to 35 Indian Rupees (INR) (meaning one million VND is approximately ₹3,300 to ₹3,500 INR). Banknotes circulate in large nominal values of 1,000, 2,000, 5,000 (cotton fiber), and 10,000, 20,000, 50,000, 100,000, 200,000, and 500,000 dong (high-durability polymer banknotes with transparent security windows). All banknotes bear the portrait of President Ho Chi Minh on the obverse.",
      "Cash is king across Vietnam. While four-star and five-star hotels, high-end restaurants, supermarket chains, and boutiques accept international credit cards, the overwhelming majority of daily consumer transactions—street food stalls, neighborhood coffee shops, local markets, longtail boatmen, entry tickets at smaller rural pagodas, and cyclo drivers—operate strictly on physical cash.",
      "Take careful note of banknote colors to avoid costly confusion: the green 10,000 VND note (worth ~₹34 INR) and the green 100,000 VND note (worth ~₹340 INR) share similar shades in dim lighting; similarly, the reddish-brown 20,000 VND note and the reddish-brown 500,000 VND note (the highest denomination, worth ~₹1,700 INR) can be easily mistaken by unfamiliar visitors. Inspect your currency carefully before handing notes to street vendors.",
      "Automated Teller Machines (ATMs) operated by reputable local and international banks—including Vietcombank, Techcombank, BIDV, and HSBC—are ubiquitous in all major cities and towns. Withdrawal limits typically range between two million and five million VND per transaction, with local bank ATM fees ranging from 30,000 to 60,000 VND (₹100 to ₹200 INR). Utilizing Indian zero-forex debit or credit cards (Niyo Global, Scapia, or Fi Money) eliminates bank foreign exchange markup fees, saving substantial sums.",
      "For transportation and food delivery, download the Grab mobile application and link your Indian credit or debit card. Grab operates seamlessly across Vietnam for on-demand car rides, motorcycle taxis (GrabBike), and food deliveries, eliminating the need to negotiate fares or handle cash."
    ],
    table: {
      headers: ["Expenditure Category", "Budget Explorer (INR / Day)", "Mid-Tier Cultural (INR / Day)", "Luxury Colonial (INR / Day)", "Key Operational Notes"],
      rows: [
        ["Hotel / Boutique Stay", "₹1,400 - ₹2,800 (Clean 3-star)", "₹4,200 - ₹8,500 (Boutique heritage)", "₹16,000 - ₹40,000+ (5-star colonial resort)", "Old Quarter boutique vs French colonial villa vs riverside luxury"],
        ["Daily Meals & Street Food", "₹600 - ₹1,200 (Street pho/banh mi)", "₹1,800 - ₹3,500 (Heritage cafes/bistros)", "₹5,500 - ₹14,000 (Fine dining degustation)", "Street stalls vs upscale dining vs French-Vietnamese fusion"],
        ["Intercity & Local Transit", "₹500 - ₹900 (Public bus/GrabBike)", "₹1,500 - ₹3,200 (Grab cars/Train berth)", "₹4,500 - ₹10,000 (Private chauffeured car)", "Reunification train/sleeper bus vs Grab cars vs private day tours"],
        ["Excursions & Cruising", "₹800 - ₹1,800 (Pagoda entries)", "₹3,500 - ₹7,500 (Ha Long day cruise)", "₹15,000 - ₹38,000 (Overnight luxury junk)", "Standard monument tickets vs boutique boat vs 5-star cruise"],
        ["Estimated Daily Total", "₹3,300 - ₹6,700 per person", "₹11,000 - ₹22,700 per person", "₹41,000 - ₹102,000 per person", "Excludes international flights from India and personal shopping"]
      ]
    }
  },
  {
    heading: "Overland Transit: The Reunification Express & Coastal Mountain Passes",
    callout: {
      type: "tip",
      text: "The most scenic rail segment in Vietnam is between Da Nang and Hue aboard the Reunification Express: book a soft-sleeper window seat on the right side of the carriage (traveling north) to look down upon the crashing ocean surf of the Hai Van Pass."
    },
    paragraphs: [
      "Traversing Vietnam overland from south to north is one of the world's epic railway journeys. The historic North-South Railway (Đường sắt Bắc Nam)—popularly celebrated as the Reunification Express—spans one thousand seven hundred and twenty-six kilometers along the coastline between Ho Chi Minh City and Hanoi. First engineered under French colonial rule and completed in 1936, the line was repeatedly bombed and severed during the Vietnam War, reopening in December 1976 as a living symbol of national reunification.",
      "Operated by Vietnam Railways (Đường sắt Việt Nam), the flagship SE trains (such as SE2, SE4, SE19) feature air-conditioned four-berth soft-sleeper compartments (khoang 4 giường) equipped with clean mattresses, fresh cotton linens, reading lamps, luggage storage, and power outlets. Taking the overnight train between Hanoi and Hue, or between Da Nang and Nha Trang, offers a leisurely, low-carbon journey through emerald rice fields, rural fishing villages, and coastal lagoons.",
      "The undeniable highlight of the entire rail journey is the crossing of the Hai Van Pass ('Pass of Ocean Mists') between Da Nang and Hue. Here, the railway clings precariously to the forested granite cliffs of the Annamite Range, curling around sheer rock faces high above the azure waters of the East Sea and the secluded white crescent beach of Lang Co, providing railway vistas of breathtaking natural splendor.",
      "Complementing the railway is an extensive network of modern, air-conditioned sleeper buses (xe khách giường nằm) operated by reputable carriers such as Futa Bus Lines (Phuong Trang) and The Sinh Tourist. Featuring double-decker interior pods with reclining flat beds, privacy curtains, USB ports, and Wi-Fi, these buses link secondary regional destinations—such as Dalat, Phong Nha, and Ninh Binh—frequently and economically.",
      "For travelers with constrained schedules, Vietnam's domestic aviation network is world-class. Vietnam Airlines, VietJet, and Bamboo Airways operate high-frequency hourly shuttle flights connecting Saigon, Da Nang, Hue, and Hanoi in approximately seventy to eighty minutes at accessible domestic tariffs."
    ]
  },
  {
    heading: "Southern Metropolis: Ho Chi Minh City, French Colonial Facades & Cu Chi Tunnels",
    paragraphs: [
      "Known historically as Saigon and officially renamed Ho Chi Minh City in 1976, Vietnam's southern metropolis is a frantic, high-octane economic powerhouse of nine million residents and over seven million motorbikes. The city's architectural identity is an extraordinary dialogue between French colonial grandeur, socialist modernist monuments, and soaring contemporary glass skyscrapers.",
      "At the center of District 1 stands the Notre-Dame Cathedral of Saigon (Nhà thờ Đức Bà), constructed between 1863 and 1880 with red terracotta bricks shipped entirely from Marseille, France. Opposite stands the Saigon Central Post Office, designed by Alfred Foulhoux and completed in 1891, featuring a grand barrel-vaulted ceiling, wrought-iron skylights reminiscent of nineteenth-century European railway stations, antique hand-painted maps of South Vietnam and Cambodia, and a monumental mosaic portrait of Ho Chi Minh overlooking the bustling hall.",
      "A short walk leads to the War Remnants Museum (Bảo tàng Chứng tích Chiến tranh), one of the most visited and emotionally harrowing museums in Southeast Asia. The museum provides an unvarnished chronicle of the devastating human, ecological, and generational toll of the Vietnam War (referred to in Vietnam as the American War). Outside stand captured US military fighter jets, tanks, and helicopters; inside, poignant photographic galleries—including the legendary Requiem exhibition honoring photojournalists who perished on both sides—document the catastrophic legacy of Agent Orange defoliant chemicals on Vietnamese civilians and veterans.",
      "Nearby sits the Independence Palace (Reunification Convention Hall), preserved in its pristine 1960s modernist architectural state. Here, on April 30, 1975, North Vietnamese Army tank number 843 crashed through the wrought-iron palace gates, marking the fall of Saigon and the dramatic conclusion of the Vietnam War. Visitors can tour the subterranean war bunkers, telecommunications command centers, and presidential reception rooms.",
      "Seventy kilometers northwest of the city lie the Cu Chi Tunnels—a colossal subterranean network spanning over two hundred and fifty kilometers of multi-tiered tunnels dug by hand by the National Liberation Front (Viet Cong) during the war. Reaching depths of up to ten meters, these hidden underground labyrinths contained living quarters, field hospitals, weapon workshops, and command posts, surviving relentless aerial bombardment and demonstrating the extraordinary tenacity of human survival."
    ]
  },
  {
    heading: "Mekong Delta: River Life & Floating Markets on the Nine Dragons",
    callout: {
      type: "note",
      text: "To experience Cai Rang Floating Market at its bustling commercial peak, arrive before 06:30. Wholesalers advertise their produce by hanging sample fruits—pineapples, watermelons, or dragon fruit—from tall bamboo poles (cây bẹo) mounted on the bow of their wooden boats."
    },
    paragraphs: [
      "Covering forty thousand square kilometers at the southern tip of Vietnam, the Mekong Delta (Đồng bằng Sông Cửu Long—'Delta of the Nine Dragons') is an aquatic wonderland where life has adapted completely to the seasonal ebb and flow of tidal rivers, freshwater canals, and mangrove swamps.",
      "The regional capital of the delta is Can Tho, situated one hundred and seventy kilometers southwest of Saigon along the Hau River (the southern main branch of the Mekong). The defining cultural spectacle of Can Tho is the Cai Rang Floating Market. Commencing before dawn, hundreds of wooden boats and motorized sampans gather on the broad river to trade seasonal tropical produce in bulk. Wholesalers navigate heavy wooden vessels laden with tons of yellow mangoes, green coconuts, pomelos, and sweet potatoes.",
      "Smaller wooden sampans weave agilely between the trading boats, functioning as floating noodle stalls and cafes. Travelers can pull alongside a floating soup vendor to savor a steaming bowl of hot Hu Tieu (pork and shrimp noodle soup with fresh herbs) or sip iced condensed-milk coffee as the morning sun casts gold reflections across the muddy river.",
      "Beyond the floating markets, exploring the delta aboard a traditional wooden rowed sampan through the narrow waterways of Ben Tre and My Tho reveals rural village life. Shaded beneath dense arches of water coconut palms (nipa palms), travelers drift down tranquil canals to visit family-run artisanal workshops where artisans produce handmade coconut candy (kẹo dừa), crispy puffed rice cakes, and pure lotus honey.",
      "The fertile delta is also home to Tra Su Cajuput Forest in An Giang province, an eight-hundred-hectare protected wetland sanctuary where flat-bottomed wooden boats glide silently through a surreal, brilliant lime-green carpet of floating water cabbage, duckweed, and lotus flowers, sheltering nesting colonies of rare storks, egrets, and purple swamphens."
    ]
  },
  {
    heading: "Central Heritage: Hoi An Ancient Town, Silk Lanterns & Tailor Traditions",
    callout: {
      type: "tip",
      text: "Hoi An bans motorized vehicles (motorbikes and cars) from the historic ancient town from 09:00 to 11:00 and 15:00 to 21:30 daily, creating an enchanting, pedestrian-friendly sanctuary ideal for walking and cycling."
    },
    paragraphs: [
      "Inscribed on the UNESCO World Heritage List in 1999, the ancient riverside town of Hoi An ('Peaceful Meeting Place') is one of Southeast Asia's most exquisitely preserved historic trading ports. Situated along the Thu Bon River thirty kilometers south of Da Nang, Hoi An flourished between the fifteenth and nineteenth centuries as an international maritime emporium welcoming merchant communities from Japan, China, Portugal, Holland, and India.",
      "The urban fabric of Hoi An's Ancient Town is an architectural marvel of over eight hundred preserved wooden structures painted in distinctive warm ochre-yellow lime wash with moss-covered terracotta tile roofs. The architectural icon of the town is the Japanese Covered Bridge (Chùa Cầu), constructed in the 1590s by the local Japanese merchant community to link their residential quarter with the Chinese district across the canal. The arched wooden bridge is enclosed beneath an ornamental tiled roof, housing a small Taoist shrine guarded at either end by carved wooden sculptures of dogs and monkeys, marking the auspicious astrological years in which construction began and concluded.",
      "Throughout the ancient town, visitors can explore opulent Chinese Assembly Halls (Hội Quán)—such as the Phuc Kien Assembly Hall (Fujian), constructed in 1697 and dedicated to Thien Hau, the goddess of seafarers. The entrance courtyard is filled with massive coiled incense spirals hanging from high ceilings, which burn slowly for weeks while carrying devotees' written prayers skyward.",
      "Hoi An is internationally celebrated as Vietnam's artisanal tailor and leathercraft capital. Hundreds of skilled master tailoring studios line the streets, capable of crafting bespoke wool suits, linen shirts, cashmere coats, and custom leather boots within twenty-four to forty-eight hours based on customer measurements or photographs, offering exceptional sartorial value.",
      "As twilight descends, Hoi An undergoes an enchanting transformation. Neon lights and fluorescent signs are banned in the historic quarter; instead, thousands of colorful silk lanterns—handcrafted in traditional round, diamond, and lotus shapes—illuminate shophouse facades and wooden bridges with a warm, romantic amber glow. Along the Thu Bon River, visitors release small paper lantern boats carrying flickering candles into the gentle river current, watching their wishes drift across the dark water."
    ]
  },
  {
    heading: "Da Nang & The Marble Mountains: Coastal Bridges & Stone Sanctuaries",
    paragraphs: [
      "Located thirty kilometers north of Hoi An, Da Nang is Vietnam's third-largest city and the dynamic commercial gateway of the central coast. Framed by the azure waters of Da Nang Bay and a thirty-kilometer ribbon of powdery white sand along My Khe Beach, the city presents a striking blend of modern beachfront urbanism and ancient sacred geological wonders.",
      "Spanning the broad waters of the Han River is the iconic Dragon Bridge (Cầu Rồng). Completed in 2013, this 666-meter steel arch bridge is sculpted in the dynamic shape of a colossal golden dragon symbolizing the power of the historic Ly Dynasty. Every Saturday and Sunday evening at 21:00, vehicular traffic is halted across the bridge as thousands of spectators gather to watch the dragon head theatrically spout massive blasts of real fire, followed by high-pressure plumes of water mist illuminated by vibrant LED choreographies.",
      "Just nine kilometers south of the city center rise the Marble Mountains (Ngũ Hành Sơn)—a dramatic cluster of five jagged limestone and marble karst peaks emerging from coastal sands, named after the five cosmological elements of ancient East Asian philosophy: Thủy (Water), Mộc (Wood), Hỏa (Fire), Kim (Metal), and Thổ (Earth).",
      "The largest and most sacred peak is Thuy Son (Water Mountain), accessible via a stone staircase or modern glass elevator. Within its subterranean depths lie vast natural cathedral caves that have served as sacred sanctuaries for centuries. The highlight is Huyen Khong Cave, where natural skylights in the soaring cave ceiling allow shafts of heavenly sunlight to pierce down into the misty cavern, illuminating colossal stone Buddha sculptures carved directly into the living marble rock and ancient Taoist shrines that served as clandestine field hospitals during wartime.",
      "In the mountains west of Da Nang sits Ba Na Hills, a former French colonial hill station situated at 1,487 meters elevation. The site is world-famous for the Golden Bridge (Cầu Vàng)—a 150-meter-long curved pedestrian footbridge that appears to be supported high above the mist by two colossal, weathered stone hands emerging from the mountain forest, offering breathtaking vistas across the East Sea."
    ]
  },
  {
    heading: "Hue: The Imperial Citadel & Royal Tombs of the Nguyen Dynasty",
    callout: {
      type: "note",
      text: "Hue was the imperial capital of Vietnam from 1802 to 1945 under the thirteen emperors of the Nguyen Dynasty. The Imperial City, royal mausoleums, and court music (Nhã Nhạc) are collectively preserved as UNESCO World Heritage treasures."
    },
    paragraphs: [
      "Situated along the tranquil banks of the Song Huong (Perfume River) one hundred kilometers north of Da Nang, Hue is the solemn, dignified imperial capital of Vietnam. Governed by the Nguyen Dynasty for one hundred and forty-three years, Hue was designed as an imperial seat of Confucian governance, royal ancestral veneration, and sophisticated court gastronomy.",
      "The monumental centerpiece of the city is the Imperial Citadel (Kinh thành Huế), surrounded by a ten-kilometer square perimeter of brick ramparts and a deep defensive water moat. Within the citadel lies the Imperial City (Đại Nội), entered through the monumental Noon Gate (Ngọ Môn), above which sits the Belvedere of the Five Phoenixes where emperors reviewed military parades.",
      "At the inner core of the complex was the Forbidden Purple City (Tử Cấm Thành), historically accessible only to the Emperor, the Empress, royal concubines, and palace eunuchs under pain of death. Although heavily damaged during the 1968 Tet Offensive during the Vietnam War, extensive international restoration programs have painstakingly reconstructed the Palace of Supreme Harmony (Điện Thái Hòa)—housing the gilded imperial dragon throne beneath eighty lacquered ironwood columns—and the ancestral dynastic temples (Thế Miếu).",
      "Upriver along the Perfume River, set amidst pine-forested hills, lie the monumental Royal Mausoleums of the Nguyen emperors. Each tomb was designed by the monarch during his lifetime as a philosophical reflection of his character and spiritual outlook. The Tomb of Emperor Tu Duc is a tranquil, poetic retreat featuring lotus ponds, wooden tea pavilions, and pine groves where the melancholy emperor wrote poetry. In striking contrast, the Tomb of Emperor Khai Dinh is a steep, dark monument blending French Gothic, Romanesque, and Vietnamese styles, culminating in an opulent interior throne room encrusted with intricate mosaics made from broken glass, crystal, and colored porcelain.",
      "Dominating a gentle hill beside the river sits the Thien Mu Pagoda (Pagoda of the Celestial Lady), founded in 1601. Its iconic seven-story octagonal tower (Phước Duyên Tower)—rising twenty-one meters—is the historic symbol of Hue. In the rear courtyard stands the blue Austin motor car that carried monk Thich Quang Duc from Hue to Saigon in June 1963, where he performed his heroic, world-shaking self-immolation to protest religious oppression."
    ]
  },
  {
    heading: "Ninh Binh: Limestone Karsts & Waterways of Halong Bay on Land",
    paragraphs: [
      "Located ninety kilometers south of Hanoi at the southern edge of the Red River Delta, the province of Ninh Binh represents one of the most stunning geological and cultural landscapes in Asia. Inscribed as the UNESCO World Heritage Trang An Landscape Complex in 2014, it is celebrated worldwide as 'Halong Bay on Land'—a breathtaking karst landscape where colossal limestone towers rise vertically out of lush green rice paddies and winding river valleys.",
      "The primary way to experience this landscape is by water aboard a traditional flat-bottomed sampan. In the Trang An eco-tourism precinct, local boatwomen maneuver wooden sampans along crystal-clear rivers winding between sheer limestone cliffs, passing through eleven subterranean water caves (including the 320-meter-long Hang Toi / Dark Cave), where passengers must duck their heads as the boat glides beneath ancient stalactites hanging from low cave ceilings.",
      "In adjacent Tam Coc ('Three Caves'), the Ngo Dong River winds through an undulating valley of wet-rice paddies. During harvest season in May and June, the rice paddies turn into a brilliant golden-yellow sea contrasting with the grey limestone karsts. Here, visitors witness the unique regional rowing technique: local rowers steer and propel the oars gracefully using their bare feet while seated upright, conserving arm energy over hours on the water.",
      "For panoramic aerial views, hike the stone staircase of Hang Mua (Mua Cave). Five hundred steep stone steps ascend the jagged limestone ridge of Ngoa Long Mountain, flanked by carved stone dragons. At the summit peak, hikers are rewarded with a 360-degree vista looking down upon the Ngo Dong River winding through green valleys and karsts stretching to the horizon.",
      "Ninh Binh is also rich in early medieval history. At Hoa Lu, tucked into a natural fortress of surrounding limestone peaks, stood Vietnam's ancient capital in the tenth century under the Dinh and Early Le dynasties, prior to King Ly Thai To moving the capital northward to Hanoi in 1010 CE."
    ]
  },
  {
    heading: "Hanoi: The Thousand-Year Capital & The 36 Guild Streets of the Old Quarter",
    callout: {
      type: "tip",
      text: "On weekends (from 19:00 Friday to midnight Sunday), the streets encircling Hoan Kiem Lake are closed to all motorized traffic, transforming into a vibrant pedestrian festival of traditional street games, folk music, rollerblading, and community dance."
    },
    paragraphs: [
      "Celebrating over a thousand years of continuous history since its establishment as Thang Long ('Ascending Dragon') in 1010 CE by Emperor Ly Thai To, Hanoi is the intellectual, political, and cultural heart of Vietnam. Unlike the gleaming skyscrapers of Saigon, Hanoi retains an intimate, nostalgic, and melancholic charm, defined by tree-lined French boulevards, colonial yellow villas, tranquil lakes, and the bustling labyrinth of its historic Old Quarter.",
      "The commercial soul of the city is the Old Quarter (Phố Cổ), historically comprising thirty-six guild streets (36 Phố Phường) arranged north of Hoan Kiem Lake. Dating to the fifteenth century, each street specialized exclusively in a single craft or trade: Hang Bac (Silver Street, still lined with jewelry workshops and money changers), Hang Gai (Silk Street), Hang Ma (Paper Offerings Street, bursting with colorful festival decorations), and Hang Duong (Sugar and Candied Fruit Street).",
      "The architecture of the Old Quarter is famous for its 'tube houses' (nhà ống). In colonial and feudal times, property taxes were levied based on street frontage width; consequently, merchants constructed homes with narrow street facades (often only two to three meters wide) that extended deep into the interior block for up to sixty meters, punctuated by open interior courtyards (giếng trời) that brought light and fresh air into multi-generational family quarters.",
      "At the center of civic life sits Hoan Kiem Lake (Hồ Hoàn Kiếm—'Lake of the Returned Sword'). According to legend, in the fifteenth century, the Golden Turtle God (Kim Qui) bestowed a magical sword upon Emperor Le Loi to drive out Chinese Ming invaders; after victory, while boating on the lake, a giant turtle surfaced and reclaimed the sword to return it to the gods. In the lake center stands the historic Turtle Tower (Tháp Rùa), while a graceful red wooden bridge (Cầu Thê Húc—'Bridge of the Rising Sun') crosses to Ngoc Son Temple on a small jade island.",
      "Cultural pilgrims should not miss the Temple of Literature (Văn Miếu), established in 1070 CE. Dedicated to Confucius and his disciples, this tranquil walled complex served as the Imperial Academy (Quốc Tử Giám)—Vietnam's first national university. Here, eighty-two massive stone turtles carry carved stone steles on their backs, inscribed with the names and birthplaces of thirteen hundred scholars who passed the rigorous triennial royal civil service examinations between 1442 and 1779."
    ]
  },
  {
    heading: "Ha Long Bay & Bai Tu Long: Seascape Karsts & Overnight Cruising Logistics",
    callout: {
      type: "important",
      text: "Choose overnight cruises that explore Bai Tu Long Bay or Lan Ha Bay (departing from Tuan Chau or Got Pier) rather than congested central Ha Long Bay. These outer bays feature identical spectacular limestone karst landscapes with far fewer tourist boats and cleaner waters."
    },
    paragraphs: [
      "Inscribed twice as a UNESCO World Heritage Site (in 1994 for aesthetic value and 2000 for geological geomorphology), Ha Long Bay ('Bay of the Descending Dragon') is one of the most sublime natural wonders on earth. Covering one thousand five hundred square kilometers in the Gulf of Tonkin, the bay encompasses nearly two thousand towering limestone pillar karsts, islets, and grottos emerging dramatically from tranquil, emerald-green waters.",
      "Geologically, this drowned karst landscape evolved over five hundred million years of tropical limestone deposition, tectonic uplift, and marine wave dissolution during alternating glacial sea-level fluctuations. The resulting monoliths are honeycombed with vast prehistoric caverns, such as Sung Sot Cave (Surprise Cave), featuring massive vaulted subterranean chambers adorned with stalactites and stalagmites illuminated by soft architectural lighting.",
      "The definitive way to experience the bay is aboard an overnight luxury wooden junk or modern steel boutique cruiser (typically 2-day/1-night or 3-day/2-night voyages). Departing from Tuan Chau Marina or Halong International Port, vessels navigate into secluded island lagoons where passengers can kayak through natural sea tunnels (such as Luon Cave), swim in calm turquoise waters, hike to the panoramic summit of Ti Top Island, and participate in early-morning Tai Chi meditation sessions on the sundeck as dawn mist drifts across the limestone pinnacles.",
      "For travelers seeking pristine wilderness away from tourist flotillas, sailing into neighboring Bai Tu Long Bay or Lan Ha Bay around Cat Ba Island is an extraordinary alternative. These outer marine zones offer quieter anchorages, secluded white-sand coves, and visits to traditional floating fishing villages (such as Cua Van), where generations of fishing families have lived aboard floating wooden houses supported by plastic drums.",
      "Responsible Cruising Ethics: In recent years, local provincial authorities have implemented strict environmental bans on single-use plastics aboard all cruise vessels in Ha Long Bay. Travelers should bring reusable water bottles, utilize reef-safe sunscreens, and choose eco-certified cruise operators (such as Indochina Junk or Bhaya Cruises) that participate in regular marine cleanup programs."
    ]
  },
  {
    heading: "Culinary Ecosystem & Indian Dietary Navigation from South to North",
    paragraphs: [
      "Vietnamese gastronomy is one of the world's most sophisticated culinary traditions, celebrated for its reliance on fresh mountain herbs, light rice-noodle broths, minimal dairy and fats, and the meticulous philosophical balancing of five fundamental flavor elements: spicy (metal), sour (wood), bitter (fire), salty (water), and sweet (earth).",
      "The undisputed national dish is Pho (phở)—a delicate rice noodle soup simmered for twelve hours with beef marrow bones, charred onions, star anise, cinnamon, black cardamom, and ginger. Pho differs dramatically by region: in the south (Saigon), the broth is sweeter, heavily spiced, and served with a lavish side plate of fresh herbs (Thai basil, culantro), bean sprouts, hoisin sauce, and sriracha; in the north (Hanoi), Pho Bac is minimalist, savory, and pure, served simply with fresh scallions, lime, and pickled garlic slices.",
      "For travelers from the Indian subcontinent—particularly vegetarians and vegans—navigating Vietnamese cuisine requires specific understanding. Traditional Vietnamese cooking relies almost universally on fish sauce (nước mắm) as a seasoning base, even in vegetable dishes. To request strictly vegetarian food, utilize the Vietnamese word 'Ăn Chay' (pronounced 'un chai')—referring to the strict Mahayana Buddhist vegetarian diet, which eliminates all meat, poultry, seafood, fish sauce, and often pungent root aromatics (onions and garlic), perfectly aligning with Indian Jain and vegetarian standards.",
      "Look for restaurants and street signs displaying 'Quán Cơm Chay' (Vegetarian Rice Eatery). These ubiquitous Buddhist dining halls serve lavish buffets of steamed vegetables, braised tofu, mushroom curries, mock meats crafted from soy and gluten, and vegetable spring rolls for 30,000 to 50,000 VND (₹100 to ₹170 INR).",
      "Major cities host thriving Indian restaurants operated by Subcontinent chefs, particularly in District 1 of Saigon (Baba's Kitchen, Ganesh, Saravanaa Bhavan), Da Nang (Mumtaz, Family Indian Restaurant), and Hanoi's Old Quarter and West Lake (Namaste Hanoi, Dalcheeni, Zaika). Don't miss sampling Vietnamese coffee culture: try Cà Phê Trứng (egg coffee in Hanoi, where whipped egg yolk and condensed milk create a creamy, custard-like foam atop rich dark robusta coffee) or refreshing Cà Phê Sữa Đá (slow-dripped coffee over sweetened condensed milk and ice)."
    ],
    table: {
      headers: ["Dish / Culinary Experience", "Key Ingredients & Flavor Profile", "Ideal Region / Street", "Dietary Profile", "Typical Price (VND / INR)"],
      rows: [
        ["Phở Chay (Vegetarian Pho)", "Rice noodles, mushroom-radish broth, tofu, fresh herbs", "Hanoi Old Quarter / Saigon Chay cafes", "Pure Vegetarian / Vegan", "40,000 - 70,000 VND (₹135 - ₹240)"],
        ["Bánh Mì Chay (Baguette)", "Crispy baguette, lemongrass tofu, pickled daikon, cilantro", "Street carts across Vietnam", "Pure Vegetarian / Vegan", "25,000 - 45,000 VND (₹85 - ₹150)"],
        ["Gỏi Cuốn (Fresh Summer Rolls)", "Rice paper, tofu, vermicelli, mint, peanut dipping sauce", "Hoi An / Saigon cafes", "Pure Vegetarian (Chay)", "30,000 - 60,000 VND (₹100 - ₹200)"],
        ["Cà Phê Trứng (Hanoi Egg Coffee)", "Dark robusta coffee, whipped egg yolk, condensed milk", "Cafe Giang (Hanoi Old Quarter)", "Vegetarian (Contains egg)", "35,000 - 50,000 VND (₹120 - ₹170)"],
        ["Cao Lầu Vegetarian", "Chewy rice noodles, crispy croutons, greens, soy broth", "Hoi An ancient town warungs", "Vegetarian upon request", "40,000 - 70,000 VND (₹135 - ₹240)"]
      ]
    }
  },
  {
    heading: "Seasonal Meteorology & Strategic Timing for Subcontinent Travelers",
    paragraphs: [
      "Because Vietnam spans over sixteen degrees of latitude across varying topographic elevations, there is no single 'ideal' weather window that applies uniformly across the entire nation. Travelers planning a comprehensive south-to-north journey must understand the complex regional meteorological divergence between the south, center, and north.",
      "Southern Vietnam (Saigon & Mekong Delta) experiences a consistent tropical climate. The dry season spans from December through April, featuring comfortable humidity, minimal rainfall, and temperatures averaging 28°C to 33°C. The rainy season runs from May through November, characterized by short, intense late-afternoon tropical downpours that rarely disrupt travel itineraries.",
      "Central Vietnam (Hoi An, Da Nang, Hue) experiences pleasant dry weather from February through August (temperatures 28°C to 35°C). However, the central coast is vulnerable to intense autumn monsoon rains and tropical typhoons between September and November, which can cause localized river flooding in Hoi An's ancient quarter and rough seas.",
      "Northern Vietnam (Hanoi, Ninh Binh, Ha Long Bay) has four distinct seasons. The golden travel window for the north is autumn (September to November) and spring (March to April), when skies are clear, temperatures are pleasant (20°C to 26°C), and humidity is moderate. Winter (December to February) brings cold, damp, misty conditions with temperatures dropping to 10°C to 14°C in Hanoi and single digits in mountain areas like Sapa, requiring warm thermal layers, a fleece jacket, and waterproof outerwear.",
      "The Master Recommendation: For Indian travelers undertaking a comprehensive South-to-North journey covering Saigon, Hoi An, Hue, Hanoi, and Ha Long Bay in a single trip, the optimal nationwide window spans from mid-February through late April. During these two months, the south is warm and dry, the central coast is sunny and pleasant without typhoon risks, and the north is transitioning into warm, clear spring conditions."
    ]
  },
  {
    heading: "A 9-Day Comprehensive South-to-North Master Itinerary",
    paragraphs: [
      "To experience the full cultural, imperial, and geological spectrum of Vietnam at an unhurried pace, an intentional nine-day master itinerary connects the southern commercial metropolis, central coastal heritage, imperial temples, and northern karst wonders.",
      "Day 1: Arrival in Ho Chi Minh City & Historic French Quarter. Land at Tan Son Nhat Airport (SGN) in the morning via e-VOA. Transfer to District 1. In the afternoon, visit the Notre-Dame Cathedral, Central Post Office, and the War Remnants Museum. In the evening, stroll along the pedestrian esplanade of Nguyen Hue Boulevard, enjoying rooftop views of the illuminated city.",
      "Day 2: Mekong Delta Waterways & Evening Flight to Da Nang. Early morning excursion to the Mekong Delta (My Tho and Ben Tre): cruise along river canals aboard a wooden sampan, visit fruit orchards, and taste coconut candy. Return to Saigon in the late afternoon and board a 75-minute domestic flight to Da Nang. Transfer to your boutique heritage hotel in Hoi An.",
      "Day 3: Hoi An Ancient Town & Lantern Twilight. Explore the UNESCO Ancient Town on foot: visit the 16th-century Japanese Covered Bridge, the Phuc Kien Assembly Hall, and Tan Ky heritage house. Get measured for custom bespoke tailoring. In the afternoon, cycle through tranquil green rice paddies to An Bang Beach. In the evening, take a wooden boat along the Thu Bon River, releasing a floating silk lantern onto the glowing water.",
      "Day 4: Marble Mountains & Over the Hai Van Pass to Hue. Drive north to Da Nang to explore the sacred marble cave temples of Marble Mountains. Board the scenic morning Reunification Express train or take a private drive over the legendary Hai Van Pass, admiring panoramic coastal cliffs. Arrive in Hue by afternoon. Visit the Thien Mu Pagoda at sunset overlooking the Perfume River.",
      "Day 5: The Imperial Citadel & Overnight Sleeper Train to Hanoi. Dedicate the morning to Hue's Imperial City (Dai Noi), exploring the Noon Gate, the Palace of Supreme Harmony, and the Forbidden Purple City. In the afternoon, visit the poetic lakeside Tomb of Emperor Tu Duc. In the evening, board the comfortable SE4 air-conditioned soft-sleeper overnight train northward to Hanoi.",
      "Day 6: Historic Hanoi & The 36 Guild Streets. Wake up as the train pulls into Hanoi Railway Station at 05:30. Check into your Old Quarter hotel. Walk around misty Hoan Kiem Lake, visiting Ngoc Son Temple and the Temple of Literature. In the afternoon, explore the 36 guild streets of the Old Quarter, savoring authentic Hanoi egg coffee at Cafe Giang. Watch a traditional Water Puppet theater performance in the evening.",
      "Day 7: Ninh Binh 'Halong Bay on Land' Day Excursion. Take an early morning express transfer to Ninh Binh (1h 30m). Board a flat-bottomed sampan at Trang An, drifting through water caves beneath colossal limestone karsts. In the afternoon, climb the five hundred stone steps of Hang Mua for panoramic views over the winding Ngo Dong River before returning to Hanoi.",
      "Day 8: Ha Long Bay Overnight Luxury Cruise. Depart Hanoi on an express limousine van to Ha Long Bay. Embark on a luxury boutique cruise ship. Sail through thousands of soaring limestone karsts, kayak through hidden lagoons at Luon Cave, and explore the vast stalactites of Sung Sot Cave. Enjoy a sunset dinner on the sundeck beneath the stars.",
      "Day 9: Dawn Tai Chi, Return to Hanoi & India Departure. Rise early for sunrise Tai Chi on the sundeck as morning mist drifts across the limestone pinnacles. Visit Ti Top Island for a final swim before the ship cruises back to port. Transfer directly to Noi Bai International Airport (HAN) in Hanoi for your evening commercial flight home to India."
    ],
    table: {
      headers: ["Day & Geographic Zone", "Morning Phase (08:30 - 12:30)", "Afternoon Phase (13:30 - 17:30)", "Evening Phase (18:30 - 22:00)", "Transit Logistics"],
      rows: [
        ["Day 1: Saigon Heritage", "SGN Airport arrival via e-Visa & Check-in", "Notre-Dame Cathedral & War Remnants", "Nguyen Hue walking street & rooftop dinner", "Airport Taxi & On-foot walking"],
        ["Day 2: Mekong Delta", "Mekong Delta riverboat & coconut orchards", "Return to Saigon & Flight to Da Nang", "Arrive in Hoi An & ancient town stroll", "Domestic Flight & Private AC Car"],
        ["Day 3: UNESCO Hoi An", "Japanese Covered Bridge & Assembly Halls", "Bespoke tailoring & An Bang beach cycle", "Thu Bon River silk lantern boat ride", "Bicycle & On-foot walking"],
        ["Day 4: Hai Van Pass to Hue", "Marble Mountains cave temples in Da Nang", "Train over Hai Van Pass to imperial Hue", "Thien Mu Pagoda sunset over Perfume River", "Reunification Express Rail / Private Car"],
        ["Day 5: Imperial Hue", "Imperial Citadel & Forbidden Purple City", "Tomb of Tu Duc & Perfume River incense", "Board overnight soft-sleeper train to Hanoi", "Private Car & Overnight Sleeper Train"],
        ["Day 6: Hanoi Capital", "Hanoi arrival & Hoan Kiem Lake walking", "Temple of Literature & Old Quarter guild walk", "Water Puppet show & Hanoi egg coffee", "Train arrival & Walking / Grab taxi"],
        ["Day 7: Karsts of Ninh Binh", "Express drive to Ninh Binh & Trang An sampan", "Hang Mua dragon peak 500-step hike", "Return to Hanoi & Old Quarter dinner", "Limousine Tourist Bus / Private Car"],
        ["Day 8: Ha Long Bay Cruise", "Transfer to Ha Long & Cruise embarkation", "Sung Sot Cave & Luon Cave sea kayaking", "Sunset sundeck dining & squid fishing", "Luxury Cruise Ship & Kayak"],
        ["Day 9: Dawn Bay to India", "Sunrise Tai Chi & Ti Top Island swim", "Cruise disembarkation & transfer to Hanoi", "Noi Bai Airport (HAN) return flight to India", "Cruise Transfer & International Flight"]
      ]
    }
  },
  {
    heading: "Cultural Decorum, Wartime Sensitivity & Social Protocol",
    callout: {
      type: "important",
      text: "Political & Historical Sensitivity: Never make dismissive, disrespectful, or mocking remarks regarding President Ho Chi Minh (revered as 'Uncle Ho' / Bác Hồ), national sovereignty, or the wartime sacrifices of the Vietnamese people."
    },
    paragraphs: [
      "Vietnamese culture is guided by deep-seated Confucian traditions of filial piety, modesty, respect for elders, and a profound national pride forged through centuries of resisting foreign occupations. Visitors who conduct themselves with quiet dignity, patience, and humility will find warm, generous hospitality across every province.",
      "When visiting Buddhist pagodas, communal houses (đình), and sacred shrines, dress conservatively: shoulders, upper arms, and knees must be covered; hats and sunglasses should be removed before stepping into prayer halls. Never point your feet directly at Buddha images or ancestral altars when seated; sit with legs folded beneath you or cross-legged with feet tucked in.",
      "Public emotional expression across Vietnam values calm self-restraint and harmony. Losing one's temper, shouting, or aggressive confrontation causes severe 'loss of face' (mất mặt) for both parties and is universally counterproductive. In negotiations at markets, keep interactions light-hearted, polite, and smiling; bargaining is expected, but aggressive haggling over trivial sums is considered undignified.",
      "Respecting Wartime Memory: The Vietnam War ended within living memory of millions of Vietnamese citizens, and virtually every family experienced profound losses. When visiting war memorials, military cemeteries, or historic tunnels, maintain solemn decorum: avoid treating tragic war sites as superficial amusement parks, and listen with empathy to the perspectives of local guides whose parents or grandparents lived through the conflict.",
      "In daily social etiquette: always hand money, business cards, or items using both hands, or with your right hand supported gently at the forearm by your left hand; avoid touching anyone on the head (considered sacred); and avoid pointing with your index finger (use an open hand with palm facing downward)."
    ]
  },
  {
    heading: "Environmental Stewardship & Sustainable Tourism Along the Coast",
    paragraphs: [
      "Vietnam's rapid economic and tourism growth has placed acute ecological pressures on its delicate river deltas, marine karst ecosystems, and highland biodiversity corridors. Conscientious travelers have an essential duty to minimize their environmental footprint throughout their journey.",
      "A primary ecological imperative is combating plastic pollution. Marine plastic waste severely threatens the delicate limestone ecosystems of Ha Long Bay, Bai Tu Long, and the coral reefs of Cham Island off Hoi An. Support provincial plastic bans: carry reusable stainless-steel water flasks, decline single-use plastic bags and straws at street markets, and patronize eco-certified cruise operators and hotels that maintain zero-waste policies and advanced wastewater treatment systems.",
      "In rural and agricultural areas—such as the terraced valleys of Sapa, the waterways of Ninh Binh, and the orchards of the Mekong Delta—support community-based homestays (du lịch cộng đồng) operated directly by local families and ethnic minority communities (such as the Hmong, Dao, and Tay). These homestays ensure tourism expenditures directly benefit rural household economies and incentivize the preservation of traditional weaving, wooden architecture, and organic farming methods.",
      "Choose low-carbon transit modes across the country: utilize the historic Reunification Express railway, electric passenger shuttles operating in historic city centers, and bicycles for exploring the flat rural countryside around Hoi An, Hue, and Ninh Binh.",
      "By journeying from south to north with cultural sensitivity, environmental mindfulness, and an open, respectful heart, you will experience an extraordinary civilization of indomitable spirit, magnificent landscapes, and enduring warmth."
    ]
  }
];

const vietnamInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85",
    alt: "Iconic emerald waters and soaring limestone pillar karsts of Ha Long Bay in northern Vietnam",
    caption: "The UNESCO World Heritage limestone pillar karsts of Ha Long Bay emerge dramatically from emerald waters in the Gulf of Tonkin."
  },
  {
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=85",
    alt: "Atmospheric yellow shophouses and colorful silk lanterns illuminating the Thu Bon River in Hoi An",
    caption: "Hoi An Ancient Town preserves centuries of yellow-washed wooden shophouses, Japanese bridges, and handmade silk lanterns."
  },
  {
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85",
    alt: "Majestic Noon Gate and fortified brick walls of the Imperial Citadel of the Nguyen Dynasty in Hue",
    caption: "The Imperial Citadel of Hue served as the seat of the Nguyen Dynasty from 1802 to 1945 along the Perfume River."
  }
];

const vietnamBlocks = assembleStructuredBlocks(vietnamSections, vietnamInlineImages);

const vietnamConfig = {
  title: "Vietnam: South to North",
  slug: "vietnam-south-to-north",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition across the Indochinese seaboard: French colonial Saigon and Mekong Delta waterways, UNESCO lantern-lit Hoi An, imperial Hue, karst sampans of Ninh Binh, Hanoi Old Quarter, Ha Long Bay, and verified Indian e-Visa logistics.",
  description: "An exhaustive field expedition across the Indochinese seaboard: French colonial Saigon and Mekong Delta waterways, UNESCO lantern-lit Hoi An, imperial Hue, karst sampans of Ninh Binh, Hanoi Old Quarter, Ha Long Bay, and verified Indian e-Visa logistics.",
  coverImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "Panoramic view of Ha Long Bay limestone karsts and traditional wooden cruising junks at sunset",
  coverImageCaption: "Vietnam represents a breathtaking transect of dramatic limestone karsts, fertile river deltas, and resilient historical heritage.",
  structuredBlocks: vietnamBlocks,
  tags: ["vietnam", "hanoi", "ho-chi-minh-city", "ha-long-bay", "hoi-an", "hue", "international-travel", "southeast-asia", "reunification-express"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    budgetAssumptions: "Tariffs verified against Vietnam Railways (Đường sắt Việt Nam) soft-sleeper fare tables, official e-Visa portal schedules, and verified mid-range boutique lodging indexes converted to INR.",
    officialSources: [
      { title: "Vietnam National Authority of Tourism (Vietnam Tourism)", url: "https://vietnam.travel/" },
      { title: "Vietnam Immigration Department (Official e-Visa Portal)", url: "https://evisa.xuatnhapcanh.gov.vn/" },
      { title: "Vietnam Railways Corporation (Đường sắt Việt Nam)", url: "https://dsvn.vn/" }
    ],
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "Vietnam: A New History (Christopher Goscha)", url: "https://www.basicbooks.com/" },
    { title: "The Birth of Vietnam (Keith Weller Taylor)", url: "https://www.ucpress.edu/" },
    { title: "Vietnam Railways Official Schedule and Trunk Line Route Map", url: "https://dsvn.vn/" },
    { title: "Vietnam National Authority of Tourism: Official Heritage Guidelines", url: "https://vietnam.travel/" }
  ]
};

const vietnamBuilt = writeCanonicalArticleModule("travel", "vietnam-south-to-north.js", vietnamConfig);
console.log(`[Vietnam: South to North] Word count: ${vietnamBuilt.wordCount}`);

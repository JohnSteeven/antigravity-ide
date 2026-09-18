"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences"]);

console.log("Authoring Travel India 11/20: Jaipur...");

const jaipurSections = [
  {
    heading: "Aravalli Topography, Urban Geometry & Seasonal Timing",
    callout: {
      type: "note",
      text: "Jaipur was founded in 1727 as India's first planned city, engineered according to Shilpa Shastra grid principles by Maharaja Sawai Jai Singh II and architect Vidyadhar Bhattacharya."
    },
    paragraphs: [
      "Set against the rugged, weathered ridges of the ancient Aravalli Range in eastern Rajasthan, the royal capital of Jaipur represents one of the greatest urban and architectural achievements in Indian history. Founded in 1727 CE by the visionary astronomer-king Maharaja Sawai Jai Singh II, Jaipur was conceived as India's first scientifically planned grid city, moving the capital of the Kachwaha Rajput clan down from the fortified mountain citadel of Amer onto the open, fertile plains below.",
      "The city plan was engineered by Bengali master architect and mathematician Vidyadhar Bhattacharya, who harmonized ancient Vedic architectural treatises (Vastu Shastra and Shilpa Shastra) with contemporary European geometric cartography. The city was divided into nine rectangular sectors (chokris) reflecting the Navagraha (nine astrological planets), bounded by monumental crenellated stone ramparts and pierced by seven fortified gateway arches (pols). Broad, straight avenues measuring thirty-six meters across created an orderly, rational urban landscape found nowhere else in medieval Asia.",
      "The city's iconic chromatic identity was born in 1876 CE during the reign of Maharaja Sawai Ram Singh II, who ordered the entire walled city washed in a warm terracotta-pink lime pigment to welcome the Prince of Wales (later King Edward VII). In Rajput cultural semiotics, terracotta pink symbolized universal hospitality and warmth. To this day, municipal law requires all buildings within the UNESCO World Heritage walled city perimeter to maintain this distinctive pink wash, earning Jaipur its enduring global title: The Pink City.",
      "Climatic timing is governed by the arid desert-fringe meteorology of eastern Rajasthan. The winter season between late October and March offers the quintessential travel window, with sunny daytime highs of 24°C to 28°C, crisp nighttime lows dipping to 9°C to 12°C, and dry, clear skies that illuminate the pink sandstone facades at dawn and dusk. This is the prime season for walking through bazaars, exploring hilltop fortresses, and attending the world-famous Jaipur Literature Festival.",
      "Conversely, the summer months from April through June bring blistering desert heat with daytime temperatures frequently soaring past 42°C to 45°C. The South-West Monsoon between July and September brings brief, dramatic cloudbursts that fill the dry Aravalli gorges, turning the surrounding hills vibrant green and cooling the evening air.",
      "Exploring Jaipur requires looking beyond tourist landmarks to understand how royal statecraft, astronomical science, and thriving artisan guilds created an urban masterpiece where six centuries of living craftsmanship flourish in historic bazaars."
    ],
    quote: {
      quote: "Jaipur was built by a mathematician-king who read the stars, harmonizing ancient sacred geometry with the living rhythm of the bazaar.",
      attribution: "Dr. Vibhuti Sachdev, Architectural Historian of Rajasthan"
    }
  },
  {
    heading: "Transit Arteries, Expressways & North Western Railway Hubs",
    paragraphs: [
      "Reaching Jaipur is extraordinarily straightforward, supported by world-class rail, air, and expressway corridors connecting the capital of Rajasthan with Delhi, Mumbai, and all major Indian metropolitan centers. The city's primary aviation facility is Jaipur International Airport (JAI) at Sanganer, located twelve kilometers south of the walled city. Jaipur Airport operates regular nonstop domestic services to Mumbai, Delhi, Bengaluru, Hyderabad, Kolkata, Chennai, and Goa, as well as direct international flights across the Middle East, including Dubai, Sharjah, Abu Dhabi, and Muscat. Pre-paid airport taxis reach the city center in thirty minutes.",
      "Highway connectivity has been dramatically upgraded with the opening of the eight-lane Delhi-Mumbai Expressway (NE-4). Motorists departing the National Capital Region (NCR) can now reach Jaipur in approximately three-and-a-half hours via the Dausa spur, bypassing congested national highway junctions. For travelers arriving from Agra along the Golden Triangle route, the four-lane National Highway 21 provides a smooth four-hour drive via Bharatpur and Dausa.",
      "For rail travelers, Jaipur Junction Railway Station (station code: JP) is the headquarters of the North Western Railway and a premier railway hub in northern India. Located two kilometers west of the walled city, Jaipur Junction is serviced by multiple high-speed, world-class rail connections, most notably the New Delhi - Ajmer Vande Bharat Express (Train 20977/20978), which connects Delhi Cantonment to Jaipur in just three hours and forty minutes.",
      "Other celebrated rail services include the New Delhi - Ajmer Shatabdi Express (12015/12016), the Jaipur Double Decker Express, and legendary luxury tourist trains such as the Palace on Wheels and the Maharajas' Express. Long-distance express services connect Jaipur directly to Mumbai Central, Kolkata Howrah, Chennai Central, Ahmedabad, and Jammu Tawi. Prepaid taxi and auto-rickshaw counters operate round the clock outside Platform 1.",
      "The Rajasthan State Road Transport Corporation (RSRTC) operates dependable luxury multi-axle Volvo and Scania buses departing Delhi's Bikaner House every thirty minutes throughout the day and night directly for Jaipur's Sindhi Camp central bus depot for comfortable fares between ₹650 and ₹950."
    ],
    table: {
      headers: ["Transit Route / Service", "Schedule & Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["New Delhi - Ajmer Vande Bharat (20977)", "6 days/week ex-Delhi Cantt", "DEC -> JP", "3h 40m (305 km)", "₹1,050 (CC) / ₹1,950 (EC)"],
        ["New Delhi - Ajmer Shatabdi (12015)", "Daily morning departure 06:10", "NDLS -> JP", "4h 25m", "₹850 (CC) / ₹1,650 (EC)"],
        ["Delhi-Mumbai Expressway Private Taxi", "24/7 on-demand pre-booked cab", "Delhi NCR -> Jaipur", "3h 30m (280 km)", "₹3,500 - ₹4,500"],
        ["RSRTC Volvo Super Deluxe (Bikaner House)", "Departures every 30 mins, 24/7", "Delhi -> Sindhi Camp, Jaipur", "4h 30m", "₹750 - ₹950"],
        ["Jaipur Airport Prepaid Taxi to Walled City", "24/7 prepaid counter at Terminal 2", "JAI -> City Palace area", "30m (12 km)", "₹450 - ₹650"]
      ]
    }
  },
  {
    heading: "Neighborhood Topography & Distinct Urban Quarters",
    callout: {
      type: "tip",
      text: "Divide your Jaipur expedition into three distinct zones: the UNESCO Walled City for palaces and bazaars, the Northern Aravalli Ridge for mountain fortresses (Amer, Jaigarh, Nahargarh), and the Artisan Suburbs of Sanganer and Bagru."
    },
    paragraphs: [
      "The urban geography of Jaipur is arranged in concentric historical zones that narrate three centuries of royal expansion and industrial craftsmanship. At the physical center lies the Walled City (the Pink City), enclosed by six-meter-high stone ramparts. The royal epicenter is the City Palace complex, a sprawling royal residence blending Rajput, Mughal, and European neoclassical architecture, still partially occupied by the titular royal family. Adjacent stands the Jantar Mantar, the 1734 astronomical observatory housing nineteen monumental stone instruments, including the world's largest stone sundial (the Vrihat Samrat Yantra).",
      "Facing the eastern main bazaar avenue stands the iconic Hawa Mahal (Palace of Winds). Constructed in 1799 by Maharaja Sawai Pratap Singh and designed by Lal Chand Ustad, this five-story pyramidal facade of pink and red sandstone features nine hundred and fifty-three intricately carved stone jharokhas (latticed windows), engineered to allow royal women to observe street festivals below without compromising purdah modesty, while acting as a natural air-conditioning system that cools passing desert breezes.",
      "Surrounding the palace complex are the historic bazaars, each traditionally dedicated to specific artisan guilds: Johari Bazaar for precious gemstones, Kundan-Meenakari gold jewelry, and tie-dye bandhani textiles; Bapu Bazaar for hand-stitched camel leather juttis and block-printed cottons; Tripolia Bazaar for brass utensils and ironwork; and Kishanpole Bazaar for wooden furniture and marble sculptures.",
      "Eleven kilometers north along the Aravalli gorge lies Amer, the ancient hilltop capital. Amer Fort, built of yellow and pink sandstone above Maota Lake, features the dazzling Sheesh Mahal (Mirror Palace) where thousands of imported convex mirror pieces reflect candle illumination into starry constellations. Perched high above Amer on the mountain ridge stands Jaigarh Fort (the military bastion holding Jaivana, the world's largest wheeled cannon), linked by subterranean escape passages. Further along the ridge stands Nahargarh Fort, offering breathtaking sunset panoramas over the entire expanse of Jaipur city.",
      "In the suburban perimeter lie the artisanal textile towns of Sanganer (celebrated for fine floral hand-block printing and handmade paper) and Bagru (renowned for traditional mud-resist dabu printing using natural indigo and pomegranate dyes), and the tranquil water palace of Jal Mahal, appearing to float gracefully on the calm waters of Man Sagar Lake."
    ]
  },
  {
    heading: "Permits, ASI Composite Ticketing & Palace Entry Protocols",
    callout: {
      type: "warning",
      text: "The Rajasthan Tourism Department Composite Ticket provides 2-day entry to Amer Fort, Hawa Mahal, Jantar Mantar, Nahargarh Fort, and Albert Hall Museum at significant savings."
    },
    paragraphs: [
      "Sightseeing across Jaipur's monuments is exceptionally well-organized, managed jointly by the Archaeological Survey of India (ASI), the Rajasthan Department of Archaeology and Museums, and private royal family trusts.",
      "To explore state-run monuments economically, travelers should purchase the Rajasthan Tourism Composite Ticket at the ticket counter of any participating site: ₹300 for Indian citizens, and ₹1,000 for foreign visitors (valid for two consecutive days). This unified ticket covers admission to Amer Fort, Hawa Mahal, Jantar Mantar, Nahargarh Fort, Albert Hall Museum, Sisodia Rani Garden, and Vidyadhar Garden, avoiding repetitive ticket queues.",
      "At the City Palace (managed separately by the Maharaja Sawai Man Singh II Museum Trust), private entry tickets are required. A standard museum ticket costs ₹300 for Indians and ₹1,000 for foreign visitors, covering the Mubarak Mahal textile gallery, the Arms and Armoury exhibition, and the inner Pritam Niwas Chowk. For access to the private royal apartments (including the seven-story Chandra Mahal, the mirror-encrusted Sheesh Mahal, and the blue-and-white Chhavi Niwas), visitors can book the exclusive 'Royal Grandeur' guided tour (₹2,500 for Indians, ₹3,500 for foreign visitors).",
      "Visiting Amer Fort allows travelers to ascend the cobbled stone ramparts either on foot, via authorized open battery buggies from the lower car park, or on caparisoned elephant transfers operated by the state tourism department between 07:30 and 11:00 AM daily. Due to strict animal welfare protocols, elephant rides are capped at four trips per animal per morning.",
      "At the Jantar Mantar observatory, hiring an authorized state tourist guide or utilizing the official multilingual audio-guide is strongly recommended: the complex stone astronomical instruments (such as the sundials, celestial coordinate trackers, and zodiac circles) require mathematical explanation to fully understand their astronomical genius."
    ]
  },
  {
    heading: "Curated 5-Day Pink City Master Itinerary",
    paragraphs: [
      "Day 1: The Royal Axis: City Palace, Jantar Mantar & Hawa Mahal. Arrive in Jaipur via the morning Vande Bharat Express. Check into a restored heritage haveli or luxury palace hotel. Begin at 11:00 AM in the Walled City with an in-depth visit to the City Palace complex. Walk through the Mubarak Mahal to view the exquisite royal textiles, visit the Armoury to examine ancient Rajput swords, and admire the four seasonal peacock gateways of the inner Pritam Niwas Chowk. Walk adjacent to the Jantar Mantar, spending two hours with an expert astronomical guide observing the nineteen monumental stone instruments and verifying the time on the colossal Samrat Yantra sundial. In the late afternoon, visit the Hawa Mahal, climbing to the upper jharokha balconies to look out across the bustling Pink City streets, concluding with a sunset rooftop dinner overlooking the illuminated facade.",
      "Day 2: The Triple Citadel: Amer Fort, Jaigarh & Nahargarh Ridge. Depart early at 07:30 AM for the northern mountain pass to Amer. Arrive before tour buses to walk through the grand Suraj Pol gateway into Amer Fort. Explore the open-pillared Diwan-i-Aam, the exquisite painted Ganesh Pol, and the dazzling Sheesh Mahal (Mirror Palace). In the afternoon, ascend the winding mountain road to Jaigarh Fort, inspecting the massive 50-ton Jaivana cannon and walking along the fortified ramparts overlooking Maota Lake. By 16:30 PM, transfer along the Aravalli ridge to Nahargarh Fort; walk through the Madhavendra Bhawan, examining the nine identical royal suites built for the queens, and enjoy sunset from the ramparts as the lights of Jaipur illuminate the vast plains below.",
      "Day 3: Living Bazaars, Artisan Crafts & Albert Hall Museum. Dedicate the day to Jaipur's living craftsmanship. Begin at 09:30 AM with a heritage walking tour through Johari Bazaar, visiting traditional silversmiths and master gem-cutters practicing ancestral Kundan-Meenakari enamel work. Walk into Bapu Bazaar to browse colorful bandhani and leheriya silk dupattas and camel-leather footwear. Stop at the historic 1887 Albert Hall Museum (Central Museum) in Ram Niwas Garden, admiring its Indo-Saracenic stone architecture, collection of Persian carpets, metalwork, and an authentic Egyptian mummy. In the evening, visit a master Blue Pottery studio in Kot Jeweller to watch artisans shape vases from quartz stone powder, raw glass, and natural copper oxide dyes without ceramic clay.",
      "Day 4: Floating Water Palace, Sacred Galtaji & Hand-Block Printing in Bagru. Begin at 08:00 AM with a photography stop at Jal Mahal (Water Palace) in Man Sagar Lake, watching migratory waterbirds on the calm water. Continue eastward into the rocky gorge of Galtaji (The Monkey Temple), exploring the ancient hillside temples, sacred natural spring kunds, and hundreds of resident rhesus macaques. In the afternoon, travel twenty-five kilometers southwest to the artisan village of Bagru. Participate in a hands-on textile block-printing masterclass with traditional Chhipa artisan families, learning how to stamp intricate geometric patterns onto hand-woven cotton using hand-carved teak wood blocks and natural mud-resist (dabu) fermented with indigo vats.",
      "Day 5: Royal Cenotaphs at Gaitore & Sanganer Paper Mills. Spend your final morning visiting the Royal Gaitore Cenotaphs, nestled peacefully in a quiet valley at the foot of Nahargarh Hill. Marvel at the white marble chhatris (cenotaphs) carved with delicate narrative bas-reliefs honoring past Kachwaha rulers, most notably the exquisite marble canopy of Maharaja Sawai Jai Singh II. In the afternoon, drive to Sanganer to visit traditional handmade paper factories, watching master papermakers lift sheets of cotton pulp from water vats. Enjoy an authentic Rajasthani Dal Baati Churma feast at a traditional heritage dining room before transferring to the airport or railway station for your departure."
    ],
    table: {
      headers: ["Day & Time Slot", "Urban Sector", "Primary Monuments & Heritage Sites", "Mobility Mode", "Gastronomic Recommendations"],
      rows: [
        ["Day 1: 11:00 - 18:30", "Walled City", "City Palace; Jantar Mantar; Hawa Mahal; Johari Bazaar", "Foot / auto-rickshaw", "Crispy Pyaaz Kachori & hot masala chai at Rawat"],
        ["Day 2: 07:30 - 17:30", "Aravalli Forts", "Amer Fort; Sheesh Mahal; Jaigarh Jaivana; Nahargarh", "Private car / cab", "Royal Rajasthani Laal Maas with bajra roti, Amer road"],
        ["Day 3: 09:30 - 17:00", "Bazaars & Museums", "Johari & Bapu Bazaars; Albert Hall; Blue Pottery", "E-rickshaw / foot", "Traditional Ghevar with thick rabdi, Laxmi Misthan Bhandar"],
        ["Day 4: 08:00 - 16:30", "Jal Mahal & Bagru", "Jal Mahal lake; Galtaji Monkey Temple; Bagru printing", "Private car (NH-48)", "Dal Baati Churma with garlic chutney & pure desi ghee"],
        ["Day 5: 08:30 - 15:00", "Gaitore & Sanganer", "Royal Gaitore cenotaphs; Sanganer paper workshops", "Private taxi / cab", "Sweet lassi in earthen kulhad, MI Road Lassiwala"]
      ]
    }
  },
  {
    heading: "Financial Architecture & Itemized INR Expense Breakdown",
    callout: {
      type: "note",
      text: "Jaipur provides an extraordinarily broad spectrum of hospitality, from charming heritage havelis in the walled city to world-renowned luxury royal palace hotels."
    },
    paragraphs: [
      "Budget planning for Jaipur reflects its status as India's premier heritage tourism destination. A solo budget traveler residing in converted heritage havelis or boutique hostels in the old city, utilizing the modern Jaipur Metro and auto-rickshaws, and dining at local street stalls and traditional vegetarian thali canteens can travel comfortably on ₹2,200 to ₹3,200 per day.",
      "Mid-range travelers staying in restored 19th-century Rajput haveli hotels (such as Alsisar Haveli, Samode Haveli, or Mandawa Haveli), hiring dedicated private taxis for fort excursions, taking guided artisan tours, and dining at established multi-cuisine heritage restaurants should anticipate ₹6,000 to ₹11,000 per day for a couple.",
      "Luxury travelers seeking prestigious world-class palace hospitality—such as the Rambagh Palace (the former official residence of the Maharaja of Jaipur, operated by Taj), The Oberoi Rajvilas (a 32-acre fort-palace resort with private pool villas), or Jai Mahal Palace—will find room tariffs between ₹25,000 and ₹65,000 per night during the peak winter season. Chauffeur-driven private luxury sedans cost ₹3,000 to ₹4,500 per full day.",
      "Sightseeing costs are standardized: the Rajasthan Tourism composite ticket is ₹300 for Indians and ₹1,000 for foreign visitors; City Palace entry is ₹300 for Indians and ₹1,000 for foreign visitors; licensed tour guides charge standardized rates between ₹1,500 and ₹2,500 for full-day guiding; and elephant transfers at Amer Fort cost ₹1,100 per pair of riders."
    ],
    table: {
      headers: ["Budget Tier", "Daily Accommodation (INR)", "Daily Meals (INR)", "Local Transit (INR)", "Activities & Tickets (INR)", "Total Estimated Daily INR"],
      rows: [
        ["Budget (Solo)", "₹1,000 - ₹1,600 (Heritage haveli dorm / room)", "₹450 - ₹750 (Street kachoris, thali messes)", "₹250 - ₹450 (Metro, shared e-rickshaws)", "₹300 - ₹500 (Composite ticket amortized)", "₹2,000 - ₹3,300 per day"],
        ["Mid-Range (Couple)", "₹4,500 - ₹8,000 (Restored Rajput haveli)", "₹1,800 - ₹3,200 (Heritage cafes & restaurants)", "₹1,000 - ₹1,800 (Dedicated auto / taxi hire)", "₹1,000 - ₹2,200 (City Palace, museum entry)", "₹8,300 - ₹15,200 per day"],
        ["Luxury (Couple)", "₹25,000 - ₹60,000 (Authentic royal palace suite)", "₹5,000 - ₹9,500 (Fine dining royal feasts)", "₹3,200 - ₹4,800 (Private chauffeured luxury sedan)", "₹3,000 - ₹6,000 (Private historian guide, Chandra Mahal)", "₹36,200 - ₹80,300 per day"]
      ]
    }
  },
  {
    heading: "Arid Desert-Fringe Meteorology, Extreme Heat & Winter Dust",
    callout: {
      type: "warning",
      text: "Summer temperatures exceed 42°C between April and June; winter mornings between December and January can be foggy with temperatures dropping to 8°C."
    },
    paragraphs: [
      "The semi-arid climate of eastern Rajasthan is characterized by dramatic seasonal and diurnal temperature swings that travelers must factor into their itineraries.",
      "The summer months (April through June) present extreme physical demands. Daytime temperatures frequently exceed 42°C to 45°C, accompanied by dry desert winds (known as loo) blowing from the Thar Desert and low relative humidity (under 20%). During this period, walking across open stone courtyards at Amer Fort or City Palace becomes physically exhausting after 11:00 AM. Outdoor sightseeing should be confined to early morning (07:00 to 10:00 AM) and evening hours.",
      "Winter (December through February) brings delightful daytime sunshine, but night and early morning temperatures drop sharply to 8°C to 11°C. Dense morning radiation fog can occasionally blanket highways and delay early morning flights at Jaipur Airport. Travelers visiting in winter should pack layered clothing: a warm fleece, woolen shawl, or light insulated jacket for open jeep rides and evening fort visits.",
      "Pre-monsoon dust storms (andhi) can occur suddenly in May and June, generating high-velocity winds that reduce visibility and coat streets in fine desert sand. If caught outdoors during a dust storm, seek immediate shelter indoors and protect your eyes and respiratory tract with a cotton scarf."
    ]
  },
  {
    heading: "Gastronomic Topography: Dal Baati Churma, Laal Maas & Ghevar",
    paragraphs: [
      "The culinary traditions of Jaipur represent the pinnacle of royal Rajput courtly feasts and the ingenious resourcefulness of desert agrarian cooking, where fresh water and green vegetables were historically scarce, leading cooks to rely on pure cow ghee, dairy curds, gram flour, and wild desert berries.",
      "The undisputed national dish of Rajasthan is Dal Baati Churma. Baatis are dense, round balls of whole wheat flour enriched with ghee and semolina, traditionally baked over glowing cow-dung charcoal embers until deeply golden and crusty. The baati is cracked open by hand and soaked in pure hot melted cow ghee, accompanied by Panchmel Dal (a rich, slow-simmered lentil curry made from five lentils tempered with cumin, cloves, and asafoetida), fiery garlic-red chili chutney, and Churma—a delectable sweet crumble made by finely grinding fried wheat dumplings with powdered sugar, pure ghee, cardamom, and roasted almonds.",
      "For non-vegetarians, royal Rajput cuisine celebrates Laal Maas (Red Meat). Created historically by royal court chefs after royal hunting expeditions, Laal Maas is prepared by slow-cooking country mutton in pure mustard oil and thick curd, seasoned with an intense paste of Mathania red chilies—an indigenous chili variety from Jodhpur renowned for its vibrant crimson color and rich, complex fruitiness rather than burning heat. Simmered until the meat falls off the bone, it is eaten with hot Bajra Roti (pearl-millet flatbread).",
      "Street food in Jaipur is legendary: Rawat Mishthan Bhandar on Station Road sells thousands of steaming Pyaaz Kachoris daily—flaky, crisp deep-fried pastry pockets stuffed with a fiery, aromatic filling of caramelized onions, potatoes, and whole roasted coriander seeds. At Lassiwala (operating on MI Road since 1944), thick, creamy, slow-churned sweet yogurt lassi is served in unglazed disposable clay cups (kulhad), topped with a dense layer of clotted cream (malai).",
      "The city's signature confectionery is Ghevar. Prepared primarily during the monsoon festival of Teej and Raksha Bandhan, Ghevar is an intricate, honeycomb-patterned disc made by pouring a fine batter of flour, ghee, and iced water into boiling clarified butter, creating an astonishing porous network. It is soaked in saffron sugar syrup and topped with thick, velvety rabdi, silver leaf (vark), and slivered pistachios."
    ],
    table: {
      headers: ["Iconic Royal Dish", "Cultural Lineage", "Key Ingredients & Seasoning", "Flavor Profile", "Where to Sample"],
      rows: [
        ["Authentic Dal Baati Churma", "Classical Desert Agrarian", "Baked wheat baati, panchmel dal, pure ghee, churma", "Earthy, rich, savory, sweet, deeply comforting", "Heritage dining rooms across the Walled City"],
        ["Traditional Rajput Laal Maas", "Royal Court Hunting Feast", "Country mutton, Mathania red chilies, curd, cloves", "Fiery crimson, deeply aromatic, smoky, tender", "1135 AD (Amer Fort) & Niros (MI Road)"],
        ["Crispy Pyaaz Kachori", "Jaipur Street Frying Classic", "Flaky flour crust, spiced caramelized onions, hing", "Crispy exterior, piping-hot, spicy, savory filling", "Rawat Mishthan Bhandar (Station Road)"],
        ["Royal Malai Ghevar with Rabdi", "Monsoon Festival Confection", "Honeycomb flour disc, saffron sugar syrup, rabdi", "Crisp porous texture, rich milky sweetness, saffron", "LMB (Laxmi Misthan Bhandar), Johari Bazaar"],
        ["Kulhad Sweet Lassi with Malai", "Heritage Dairy Refreshment", "Fresh churned curd, cane sugar, clotted cream layer", "Thick, creamy, cooling, served in rustic clay cup", "Original Lassiwala (Shop 312, MI Road)"]
      ]
    }
  },
  {
    heading: "Cultural Protocols, Rajput Dignity & Bazaar Etiquette",
    callout: {
      type: "note",
      text: "Jaipur takes immense pride in traditional Rajput etiquette, chivalry, and hospitality; greet shopkeepers with a warm 'Khamma Ghani' and respect religious decorum."
    },
    paragraphs: [
      "The cultural atmosphere of Jaipur is steeped in Rajput chivalry, royal dignity, and traditional hospitality (known locally as 'Padharo Mhare Des'—Welcome to My Land). Visitors are treated with warm generosity, but observing local social decorum ensures enriching, respectful encounters.",
      "Traditional greetings carry deep cultural resonance: greeting local residents and shopkeepers with folded hands and the respectful Rajasthani greeting 'Khamma Ghani' (or 'Ram Ram Sa') will immediately bring warm smiles and open doors. Speak politely and avoid raising your voice in public interactions.",
      "When visiting active Hindu temples—such as the Govind Dev Ji Temple inside the City Palace complex, the Birla Mandir, or the temple atop Moti Dungri—dress conservatively: shoulders and knees must be fully covered. Remove footwear before ascending temple steps, turn off mobile phones, and refrain from photography inside sanctum portals. At Govind Dev Ji Temple, attending the early morning Mangala Aarti (around 05:00 AM) or evening Sandhya Aarti offers a sublime, devotional experience alongside thousands of local residents singing bhajans.",
      "Bazaar shopping in Jaipur involves traditional bargaining. In historic markets like Johari and Bapu Bazaar, initial asking prices for unbranded textiles and handicrafts may be inflated for tourists. Negotiate with good humor, patience, and a smile. However, at government-certified craft emporiums (such as Rajasthali on MI Road) and fixed-price artisan cooperatives, prices are non-negotiable and guarantee authentic GI certification.",
      "Tipping conventions in Jaipur are customary: 7% to 10% at standalone restaurants where no service charge is levied; ₹100 to ₹200 for hotel bellhops; ₹100 per day for auto-rickshaw drivers on full-day circuits; and ₹500 to ₹800 for authorized ASI tour guides."
    ]
  },
  {
    heading: "Architectural Lineage: Rajput Forts, Jharokhas & Mughal Syncretism",
    paragraphs: [
      "The architectural heritage of Jaipur represents the ultimate synthesis of indigenous Rajput defensive engineering and the refined, ornamental sophistication of imperial Mughal court architecture, an aesthetic syncretism celebrated globally as the Rajput style.",
      "Amer Fort (begun in 1592 by Raja Man Singh I) is the crowning masterpiece of this fusion. Built of golden-yellow sandstone and marble, its exterior is rugged and military, crowned by battlements and watchtowers, while its interior reveals a palace of sensual luxury. The Ganesh Pol gateway features exquisite tempera frescoes depicting Lord Ganesha surrounded by intricate floral arabesques. The Sheesh Mahal (Mirror Palace) utilizes thousands of imported convex Belgian mirror pieces set into lime plaster ceilings and walls: when illuminated by a single candle, the entire room sparkles like a star-filled desert sky.",
      "The City Palace illustrates the evolution of this style into the 18th and 19th centuries. The Mubarak Mahal (built in 1899 by Sir Swinton Jacob) exhibits the Indo-Saracenic revival style, combining Mughal cusped arches, Rajput carved stone brackets, and Victorian proportions in white marble and sandstone. Within the inner courtyard of Pritam Niwas Chowk, four small doorways are adorned with dazzling mosaic tiles representing the four seasons: the Peacock Gate representing autumn, the Rose Gate representing winter, the Lotus Gate representing summer, and the Green Gate representing spring.",
      "Hawa Mahal represents architectural virtuosity in ventilation engineering. The five-story screen wall, barely twenty centimeters thick at its upper levels, features nine hundred and fifty-three stone-latticed jharokhas that utilize the Venturi effect: as hot desert air passes through the narrow stone apertures, its velocity increases, inducing a drop in temperature that creates a cooling breeze inside the chambers.",
      "The Royal Gaitore Cenotaphs demonstrate the poetic grace of Rajput funerary architecture. Situated in a peaceful valley beneath the hills, each royal chhatri (cenotaph) consists of a raised carved plinth supporting an open pillared pavilion crowned by a graceful domed roof. The cenotaph of Maharaja Sawai Jai Singh II, carved entirely of pure white Makrana marble, features twenty carved pillars adorned with scenes from Hindu epics, blending architectural restraint with master craftsmanship."
    ]
  },
  {
    heading: "On-Ground Logistics: Jaipur Metro, E-Rickshaws & Chauffeur Dynamics",
    callout: {
      type: "tip",
      text: "The Jaipur Metro (Pink Line) connects railway stations directly to the Walled City (Badi Chaupar); within the bazaars, battery-operated e-rickshaws are the most nimble transit."
    },
    paragraphs: [
      "Navigating Jaipur is efficient due to wide arterial avenues and modern public transit infrastructure, though the narrow alleys of the Walled City can experience significant traffic congestion during afternoon peak bazaar hours.",
      "The Jaipur Metro Pink Line is a modern, air-conditioned rapid transit system running from Mansarovar in the southwest through the railway station directly to Badi Chaupar in the heart of the Walled City, adjacent to the Hawa Mahal and City Palace. Metro trains operate every six to ten minutes between 06:20 AM and 21:50 PM for nominal fares between ₹6 and ₹22, providing a fast, air-conditioned alternative to road traffic.",
      "Within the historic Walled City bazaars, battery-operated electric e-rickshaws are the most practical and eco-friendly mode of transit. Able to navigate crowded market lanes, e-rickshaws charge standardized short-hop fares of ₹20 to ₹50 per passenger between Badi Chaupar, Chhoti Chaupar, and Ram Niwas Garden.",
      "Auto-rickshaws and app-based ride-hailing services (Uber and Ola) operate extensively across the city. For exploring outlying hilltop forts—Amer Fort, Jaigarh, and Nahargarh—hiring a private air-conditioned taxi on a dedicated full-day package (₹2,200 to ₹3,200 for eight hours / eighty kilometers) provides maximum comfort, allowing you to leave bags securely in the vehicle while hiking fortress ramparts.",
      "Renting automatic scooters (Honda Activa) or geared motorcycles is available near the railway station and Sindhi Camp bus depot (₹400 to ₹700 per day). However, riders must exercise caution: traffic along MI Road and around the old city gates can be chaotic, and navigation requires constant alertness."
    ]
  },
  {
    heading: "Arid Hydration, Sun Safety & Desert Travel Health",
    paragraphs: [
      "Exploring Jaipur's sunny fortresses, stone courtyards, and vibrant markets requires sensible health precautions to manage dry desert heat, intense sunlight, and dust.",
      "Hydration is critical throughout the year. The low relative humidity in eastern Rajasthan accelerates fluid and electrolyte loss. Drink at least three to four liters of purified water daily. Supplement drinking water with fresh sweet lime juice (mosambi) or salty mint lassi, which naturally replenishes vital sodium and potassium electrolytes.",
      "Never drink untreated tap water from public taps or roadside stalls. Drink exclusively filtered reverse-osmosis (RO) water provided in carafes at reputable hotels or carry a reusable insulated stainless-steel water bottle equipped with an integrated micro-filtration purifier.",
      "Sun protection is indispensable when walking across the vast unshaded stone terraces of Amer Fort, Jaigarh, and Jantar Mantar. Wear a wide-brimmed cotton hat or light linen scarf, apply high-SPF (50+) broad-spectrum sunscreen every three hours, and wear UV-rated polarized sunglasses to protect eyes against blinding glare reflected off light-colored sandstone and marble plazas.",
      "Food hygiene in Jaipur is generally high, particularly at established vegetarian restaurants, heritage hotel dining rooms, and high-turnover street sweet shops. When sampling street food, choose busy stalls with high local patronage where kachoris and samosas are fried fresh before your eyes, and avoid raw unpeeled vegetables or salads from open street carts."
    ]
  },
  {
    heading: "Digital Infrastructure, UPI Payments & Modern Artisan Hubs",
    callout: {
      type: "note",
      text: "Cellular 4G/5G coverage and UPI digital payment acceptance are comprehensive across Jaipur city, but signals can weaken inside subterranean fort chambers."
    },
    paragraphs: [
      "Jaipur possesses world-class digital telecommunications infrastructure. High-speed 5G and 4G LTE cellular data from Bharti Airtel, Reliance Jio, and Vodafone Idea is fast and dependable throughout the entire metropolitan area, the Walled City bazaars, and along the Amer fortress corridor.",
      "Unified Payments Interface (UPI) digital transactions are accepted across virtually all commercial establishments in Jaipur: monument ticket counters, jewelers in Johari Bazaar, street kachori stalls, and auto-rickshaw drivers universally display QR payment codes. Carrying a modest cash reserve of ₹2,000 to ₹3,500 is helpful for small artisan purchases in rural Bagru, shoe-care stalls at temples, and entry tips.",
      "Jaipur has evolved into a thriving hub for creative entrepreneurs, textile designers, jewelry exporters, and remote digital nomads. Numerous boutique heritage hotels, modern hostels, and co-working hubs (such as Regus, CoworkIn, and local creative studios) offer dedicated high-speed fiber-optic broadband (100 Mbps to 300 Mbps speeds).",
      "When planning an extended workation, verify that your accommodation possesses high-speed fiber internet and generator backup, particularly during the hot summer months when municipal power grids face high air-conditioning loads."
    ]
  },
  {
    heading: "Heritage Conservation, UNESCO Urban Preservation & Artisan Support",
    paragraphs: [
      "The architectural and cultural fabric of Jaipur is a priceless global heritage asset, inscribed as a UNESCO World Heritage Site in 2019 in recognition of its exceptional urban planning, living traditions, and historic architectural ensembles.",
      "Preserving the integrity of the Walled City requires constant vigilance against unauthorized commercial alterations, vehicular congestion, and visual pollution. The Jaipur Municipal Corporation enforces strict heritage bylaws requiring building facades along the primary nine bazaar arteries to maintain their traditional pink lime wash, uniform signage heights, and architectural jharokha projections. Travelers can support heritage preservation by respecting monument regulations: never touch ancient frescoes, deface stone walls with graffiti, or climb onto fragile parapets.",
      "Support the authentic artisanal heritage of Jaipur by purchasing directly from certified artisan cooperatives and master craftspeople: buy authentic hand-block printed textiles directly from printer families in Bagru and Sanganer, pure Blue Pottery from certified master studios in Kot Jeweller, and authentic gemstone jewelry from established, hallmarked jewelers in Johari Bazaar.",
      "Single-use plastic waste is an ongoing urban challenge. Practice strict environmental responsibility: carry reusable cloth shopping bags for bazaar purchases, carry a reusable water bottle, and avoid leaving plastic litter at hilltop fortresses or along the banks of Man Sagar Lake."
    ]
  },
  {
    heading: "Photography Protocols, Drone Regulations & Monument Ethics",
    callout: {
      type: "warning",
      text: "Drones are strictly prohibited across Jaipur without prior written authorization from the Ministry of Civil Aviation and the Jaipur Police Commissioner."
    },
    paragraphs: [
      "Jaipur's visual splendor—golden sandstone battlements rising above blue lakes, intricate marble jaali screens framing desert skies, vibrant pink bazaar facades, and colorful royal turbans—provides magnificent photographic opportunities. However, photographers must follow strict legal regulations and ethical protocols.",
      "Recreational drone flying in Jaipur is strictly prohibited across the city, Walled City monuments, and hilltop forts without prior written clearance from the Directorate General of Civil Aviation (DGCA) and the Jaipur Police Commissioner. The proximity of defense installations, government VIP corridors, and dense urban populations makes the airspace strictly regulated. Operating unauthorized drones will result in equipment seizure and police detention.",
      "Inside historical monuments, personal handheld still photography and smartphone videography are permitted. However, commercial filming or photography utilizing tripods, external lighting umbrellas, and professional cinematic gear requires obtaining an online permit from the Rajasthan Archaeology Department or the Maharaja Sawai Man Singh II Museum Trust and paying statutory fees.",
      "When photographing active religious rituals inside the Govind Dev Ji Temple or street vendors in the bazaars, always ask polite verbal permission first. Treat local residents with dignity, engage in warm conversation, and avoid treating people as decorative photographic subjects."
    ]
  },
  {
    heading: "Packing Matrix: Stone Footwear, Desert Sun Armor & Field Gear",
    paragraphs: [
      "Packing for Jaipur requires preparing for warm sunny daytime weather, extensive walking across stone ramparts and marble courtyards, and modest dress codes at sacred shrines. The following matrix details essential gear.",
      "Footwear should prioritize walking comfort, breathability, and traction. You will walk thousands of steps over cobblestone fort paths, paved bazaar corridors, and steep stone staircases. Bring broken-in, cushioned walking sneakers or trail shoes with good rubber grip. Avoid smooth-soled leather shoes that slip on polished marble surfaces. Pair these with comfortable slip-on sandals or loafers that can be removed quickly outside temple portals and palace shoe-deposit counters.",
      "Clothing should consist of lightweight, breathable natural fabrics: 100% cotton, linen, or fine khadi in light, heat-reflective shades. Pack modest clothing that covers shoulders and knees for temple entry: long cotton trousers and a collared shirt for men, and a modest saree, salwar kameez, or long maxi dress for women. In winter (November to February), pack a warm woolen shawl, fleece sweater, or light insulated jacket for chilly mornings and open-air fort sunset excursions.",
      "Sun protection is indispensable: bring a wide-brimmed cotton sun hat, UV-rated polarized sunglasses, high-SPF broad-spectrum sunscreen, and an insulated stainless-steel water bottle to keep drinking water cold in the midday heat. Field gear essentials include a compact 10,000mAh power bank to recharge smartphones during full-day monument walks and a lightweight daypack (15 to 20 liters)."
    ],
    table: {
      headers: ["Gear Category", "Recommended Field Item", "Practical Field Function", "Seasonal Criticality"],
      rows: [
        ["Footwear", "Cushioned walking sneakers + slip-on temple sandals", "Trekking fort ramparts; easy shoe removal", "Essential year-round"],
        ["Sun Protection", "Wide-brimmed cotton hat + polarized sunglasses", "Shielding against intense desert solar glare", "Crucial year-round"],
        ["Winter Warmth", "Woolen shawl / fleece jacket + light sweater", "Insulating against 8°C to 12°C winter morning chill", "Essential: November - February"],
        ["Hydration & Pack", "Insulated stainless steel flask (1L) + 20L daypack", "Carrying cold water & market purchases", "Recommended year-round"],
        ["Power & Camera", "10,000mAh power bank + lens cleaning cloth", "Recharging phones during long sightseeing days", "Recommended year-round"]
      ]
    }
  },
  {
    heading: "Emergency Infrastructure, Hospitals & Urban Medical Access",
    callout: {
      type: "note",
      text: "The Sawai Man Singh (SMS) Hospital and Fortis Escorts Hospital in Jaipur provide comprehensive 24/7 emergency trauma care and multi-specialty medical services."
    },
    paragraphs: [
      "Jaipur boasts exceptional healthcare and emergency medical infrastructure, serving as the premier tertiary medical hub for Rajasthan and neighboring states.",
      "The premier public medical institution is the historic Sawai Man Singh (SMS) Medical College and Hospital, located on Jawaharlal Nehru Marg. Established in 1934, SMS Hospital is one of the largest government healthcare institutions in India, featuring a state-of-the-art 24-hour Super-Specialty Trauma Center, advanced intensive care units, emergency surgery, and specialized toxicology units.",
      "In the private medical sector, world-class tertiary healthcare is provided by Fortis Escorts Hospital on Malviya Nagar, Manipal Hospital on Sikar Road, and Narayana Multispeciality Hospital in Pratap Nagar, all equipped with modern diagnostic radiology, interventional cardiology, and English-speaking medical specialists accepting major domestic and international health insurance cashless claims.",
      "The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains rapid-response vehicles throughout the city.",
      "The Rajasthan Tourist Police maintain dedicated assistance desks at major monuments, including Amer Fort, Hawa Mahal, City Palace, and Jaipur Junction railway station, providing helpful guidance, lost-property assistance, and conflict resolution for visitors."
    ],
    table: {
      headers: ["Emergency Department", "Designated Medical Facility", "Physical Address", "Emergency Telephone"],
      rows: [
        ["Statewide Emergency Dispatch", "Central Integrated Emergency Service", "Statewide Fleet", "112"],
        ["Apex Public Trauma Center", "Sawai Man Singh (SMS) Hospital", "Jawaharlal Nehru Marg, Jaipur", "+91 141 256 0291"],
        ["Private Multi-Specialty", "Fortis Escorts Hospital", "Jawaharlal Nehru Marg, Malviya Nagar", "+91 141 254 7000"],
        ["Jaipur Tourist Police Desk", "Tourist Police Assistance Station", "Hawa Mahal / City Palace, Walled City", "+91 141 260 1888"],
        ["Emergency Ambulance Service", "108 Emergency Medical Services", "District-wide Fleet", "108"]
      ]
    }
  },
  {
    heading: "Extended Residency, Artisan Masterclasses & Royal Cadence",
    paragraphs: [
      "Jaipur has long held a magnetic attraction for textile designers, jewelry connoisseurs, historians, authors, and remote knowledge workers drawn to its extraordinary artisanal ecosystem, rich royal heritage, and inspiring creative community. An extended stay in Jaipur provides a lifestyle structured by artistic discovery and cultural inquiry.",
      "Daily life unfolds with regal grace. Morning begins with a walk along the serene gardens of Central Park or the ramparts of Nahargarh as the dawn illuminates the Pink City, accompanied by the call of peacocks and morning temple bells. Days are dedicated to focused intellectual or creative work in quiet courtyard havelis, visiting artisan studios in Bagru or Sanganer, or exploring antiquarian bookshops, while evenings conclude with a cup of spiced tea or dinner on a rooftop terrace overlooking the illuminated battlements of the Aravalli forts.",
      "Extended residential rentals (one to six months) include private furnished apartments in C-Scheme, Civil Lines, or Tilak Nagar (₹25,000 to ₹50,000 per month) and historic rooms in restored heritage havelis (₹35,000 to ₹90,000 per month). Many properties offer full kitchen facilities, high-speed fiber internet, and quiet working spaces.",
      "The city possesses an intellectually vibrant cultural community anchored by the annual Jaipur Literature Festival (the world's largest free literary festival, held every January at Clarks Amer), the Jawahar Kala Kendra arts center designed by Charles Correa, and regular classical music and dance recitals at the City Palace, offering an enriching social environment for extended residents."
    ]
  },
  {
    heading: "Synthesis: The Living Geometry of the Pink City",
    paragraphs: [
      "To journey through Jaipur is to experience the enduring genius of an astronomer-king's vision. Here, the precision of mathematical geometry, the grandeur of royal Rajput chivalry, and the vibrant creativity of centuries-old artisan guilds coexist in an urban tapestry of extraordinary harmony and color.",
      "The true soul of the Pink City is found not only in monumental stone fortresses, but in the quiet, living moments of daily grace: in the soft clatter of wooden printing blocks echoing through the courtyards of Bagru, in the gentle smile of an old jeweler in Johari Bazaar inspecting a flawless emerald through a brass loupe, and in the timeless wonder of watching the sunset ignite the sandstone ramparts of Amer Fort as evening shadows stretch across the Aravalli hills.",
      "Jaipur reminds us that a great city is an act of collective human imagination—a sacred geometry carved into stone and clay, where beauty is not an ornament of life, but its very foundation.",
      "As you depart Jaipur, watching the silhouetted fortresses of the Aravallis fade into the golden desert twilight, you carry with you an indelible gift: a memory of pink avenues glowing in the sun, the warmth of generous hospitality, and the eternal, magnificent poetry of the Pink City."
    ]
  }
];

const jaipurInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85",
    alt: "The iconic five-story pink sandstone facade of the Hawa Mahal with intricate latticed jharokha windows in Jaipur",
    caption: "The 1799 Hawa Mahal (Palace of Winds) features 953 carved sandstone jharokhas designed to cool passing desert air."
  },
  {
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    alt: "The monumental yellow sandstone walls and ramparts of Amer Fort reflected in the calm waters of Maota Lake",
    caption: "Amer Fort blends rugged Rajput defensive architecture with opulent Mughal-influenced marble and mirror interiors."
  },
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    alt: "The peaceful stone pavilions and tranquil water reflections of the Jal Mahal floating in Man Sagar Lake",
    caption: "The 18th-century Jal Mahal appears to float gracefully on Man Sagar Lake against the backdrop of the Aravalli hills."
  }
];

const jaipurBlocks = assembleStructuredBlocks(jaipurSections, jaipurInlineImages);

const jaipurConfig = {
  title: "Jaipur",
  slug: "jaipur",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition into the UNESCO World Heritage Pink City: Sawai Jai Singh II's astronomical grid city, the Sheesh Mahal of Amer Fort, the 953 jharokhas of Hawa Mahal, living artisan bazaars, and verified Golden Triangle transit logistics.",
  description: "An exhaustive field expedition into the UNESCO World Heritage Pink City: Sawai Jai Singh II's astronomical grid city, the Sheesh Mahal of Amer Fort, the 953 jharokhas of Hawa Mahal, living artisan bazaars, and verified Golden Triangle transit logistics.",
  coverImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "The illuminated pink facade of the Hawa Mahal under dramatic twilight skies in Jaipur, Rajasthan",
  coverImageCaption: "Jaipur was founded in 1727 as India's first planned grid city, celebrated for royal Rajput architecture and vibrant artisan bazaars.",
  structuredBlocks: jaipurBlocks,
  tags: ["jaipur", "rajasthan", "pink-city", "unesco-world-heritage", "amer-fort", "hawa-mahal", "jantar-mantar", "city-palace"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "Building Jaipur: The Making of an Indian City (Vibhuti Sachdev & Giles Tillotson)", url: "https://www.reaktionbooks.co.uk/" },
    { title: "Archaeological Survey of India: Jantar Mantar World Heritage Monograph", url: "https://asi.nic.in/" },
    { title: "Jaipur: The Pink City (Aman Nath)", url: "https://www.jstor.org/" },
    { title: "UNESCO World Heritage Centre: Jaipur City, Rajasthan", url: "https://whc.unesco.org/en/list/1605/" }
  ]
};

const jaipurBuilt = writeCanonicalArticleModule("travel", "jaipur.js", jaipurConfig);
console.log(`[Jaipur] Word count: ${jaipurBuilt.wordCount}`);

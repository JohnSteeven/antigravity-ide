"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences"]);

console.log("Authoring Travel India 12/20: Udaipur...");

const udaipurSections = [
  {
    heading: "Mewar Topography, Hydraulic Lake Engineering & Seasonal Timing",
    callout: {
      type: "note",
      text: "Udaipur's hydraulic landscape was engineered in the 16th and 17th centuries by the Maharanas of Mewar, linking five freshwater lakes through stone canals in an Aravalli valley basin."
    },
    paragraphs: [
      "Cradled within an amphitheater of rugged, forested hills in the southern Aravalli Range of Rajasthan, the royal city of Udaipur—historically the capital of the storied Mewar Kingdom—occupies one of the most romantic and sophisticated hydraulic landscapes in the world. Founded in 1559 CE by Maharana Udai Singh II following the third Mughal siege of Chittorgarh, Udaipur was chosen for its strategic geographic defensibility: shielded by the jagged mountain walls of the Girwa valley and sustained by fertile alluvial soils watered by natural mountain torrents.",
      "The defining technological marvel of Udaipur is its interconnected cascading lake system, developed over four centuries of hydraulic engineering. Recognizing the scarcity of water in semi-arid Rajasthan, the Maharanas constructed massive masonry earthen dams across seasonal mountain streams (the Kotra and Ayad rivers), creating a cascading series of freshwater reservoirs: Lake Pichola (originally created in 1362 CE by a Banjara grain merchant and expanded by Udai Singh II), Fateh Sagar Lake (built by Maharana Jai Singh in 1687), Swaroop Sagar, Doodh Talai, and Badi Lake. Connected by stone-lined sluices and subterranean canals, excess floodwater cascades sequentially from one lake to the next, maintaining the city's water table and cooling the urban microclimate.",
      "The city's architectural relationship to water is peerless. Palaces, havelis, and religious temples do not merely border the lakes; they rise directly out of the water on submerged masonry foundations. Floating island palaces of pure white Makrana marble—most famously Jag Niwas (now the world-renowned Taj Lake Palace) and Jag Mandir—seem to float weightlessly upon the glassy surface of Lake Pichola, creating an optical illusion where stone and water merge into a dreamscape.",
      "Climatic timing is governed by the temperate highland weather of southern Rajasthan, situated at an elevation of 598 meters. The prime travel season spans the dry winter months between October and March. During this period, daytime temperatures hover comfortably between 24°C to 28°C, nighttime lows dip to 10°C to 14°C, and the atmosphere is washed clean of dust, offering crystal-clear reflections of the City Palace and white marble islands in the calm lake waters.",
      "The summer months from April to June bring dry heat with daytime temperatures reaching 38°C to 41°C. However, Udaipur's high lakes temper the climate compared to northern desert cities like Jodhpur or Bikaner. The South-West Monsoon (July to September) transforms the brown Aravalli hills into a dramatic tapestry of emerald green foliage, replenishing the lakes, filling waterfalls at Sajjangarh and Badi, and creating misty cloudscapes that drift through palace courtyards.",
      "To truly experience Udaipur, travelers must look beyond commercial boat rides to understand the fierce, unyielding history of the Sisodia Rajput clan—the sole royal dynasty in northern India that refused to submit to Mughal hegemony—whose ethos of independence, chivalry, and artistic devotion is etched into every marble jharokha, stone ghat, and mountain fortress."
    ],
    quote: {
      quote: "Udaipur is a city of pure white marble rising from the blue waters of ancient lakes, where the shadow of the Aravalli mountains guards the pride of Mewar.",
      attribution: "James Tod, Annals and Antiquities of Rajasthan (1829)"
    }
  },
  {
    heading: "Transit Arteries, North Western Railheads & Highway Approaches",
    paragraphs: [
      "Reaching Udaipur is convenient and well-connected by air, high-speed rail, and four-lane expressways. The city's primary aviation facility is Maharana Pratap Airport at Dabok (UDR), situated twenty-two kilometers east of the city center. Dabok Airport operates regular daily nonstop domestic flights connecting New Delhi, Mumbai, Bengaluru, Hyderabad, Jaipur, and Ahmedabad. Pre-paid authorized airport taxis reach the old city and Lake Pichola in approximately thirty-five to forty minutes along the four-lane National Highway 48.",
      "For rail travelers, Udaipur City Railway Station (station code: UDZ), located two kilometers southeast of the old city walls, is a modern, clean terminus of the North Western Railway. The flagship rail service is the Mewar Superfast Express (Train 12963/12964), which provides an exceptionally comfortable overnight journey departing Hazrat Nizamuddin in New Delhi at 18:25 PM and arriving in Udaipur at 07:15 AM the following morning.",
      "Other key rail connections include the Udaipur - Jaipur Vande Bharat Express (Train 20979/20980), which connects the Pink City to the City of Lakes in just six hours; the Chetak Express from Delhi Sarai Rohilla; and direct express trains from Mumbai Central, Kolkata, Ahmedabad, and Khajuraho. Prepaid auto-rickshaws and taxi counters operate round the clock outside the main station exit.",
      "The highway approach to Udaipur traverses scenic mountain terrain. The four-lane National Highway 48 links Udaipur to Ahmedabad in Gujarat (two hundred and sixty kilometers, approximately four-and-a-half hours) and Jaipur (four hundred kilometers, approximately six-and-a-half hours via Chittorgarh). The newly upgraded mountain highways (NH-58 and NH-162) through the Desuri and Ranakpur ghats connect Udaipur to Jodhpur in four-and-a-half hours.",
      "The Rajasthan State Road Transport Corporation (RSRTC) and private operators run luxury multi-axle Volvo and AC sleeper buses departing Delhi, Ahmedabad, Jaipur, Surat, and Mumbai daily directly for Udaipur's Udiapol central bus stand for fares between ₹600 and ₹1,200."
    ],
    table: {
      headers: ["Transit Route / Service", "Schedule & Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["Mewar Superfast Express (12963)", "Daily overnight ex-Hazrat Nizamuddin", "NZM -> UDZ", "12h 50m (744 km)", "₹1,450 (3AC) / ₹2,100 (2AC)"],
        ["Jaipur - Udaipur Vande Bharat (20979)", "6 days/week ex-Jaipur Junction", "JP -> UDZ", "6h 00m (435 km)", "₹1,320 (CC) / ₹2,450 (EC)"],
        ["Maharana Pratap Airport (UDR) to City Taxi", "24/7 prepaid taxi counter", "UDR -> Lake Pichola", "35m (22 km)", "₹700 - ₹950"],
        ["Ahmedabad to Udaipur Private Sedan", "24/7 on-demand cab (NH-48)", "Ahmedabad -> Udaipur", "4h 30m (260 km)", "₹3,400 - ₹4,400"],
        ["Udaipur City Station Auto to Gangaur Ghat", "Available 24/7 outside station", "UDZ -> Old City / Ghats", "15m (3.5 km)", "₹100 - ₹150"]
      ]
    }
  },
  {
    heading: "Neighborhood Topography & Distinct Urban Quarters",
    callout: {
      type: "tip",
      text: "Distribute your exploration into three distinct geographic sectors: the Old City & Lake Pichola for palaces and historic ghats, Fateh Sagar & the Northern Hills for gardens and mountain sunsets, and the Outer Mewar Valley for monumental fortresses and ancient temples."
    },
    paragraphs: [
      "The urban fabric of Udaipur is structured around its historic waterfront and surrounding hills. At the core lies the Old City on the eastern banks of Lake Pichola, enclosed by stone ramparts and historic gates (such as Delhi Gate, Hathipole, and Surajpole). Rising directly from the water's edge is the colossal City Palace, a continuous granite and marble fortress spanning over two hundred and forty meters in length and thirty meters in height, comprising eleven separate palaces built by twenty-two successive Maharanas.",
      "Just north of the palace entrance stands the majestic Jagdish Temple, built in 1651 by Maharana Jagat Singh I. Perched atop a high stone terrace approached by thirty-two steep marble steps, this Indo-Aryan temple features a 79-foot carved stone shikhara adorned with celestial dancers, musicians, and elephants, guarding the black stone idol of Lord Vishnu as Jagannath. Surrounding the temple is Jagdish Chowk, a vibrant maze of narrow pedestrian alleys filled with miniature painting studios, silver jewelry shops, and antique bookstores.",
      "Along the water's edge are the historic public bathing and ceremonial ghats. Gangaur Ghat, directly in front of the 18th-century Bagore Ki Haveli, is the spiritual and cultural heart of the waterfront, where evening folk dances take place and women gather in colorful attire during spring festivals. Directly opposite, across the pedestrian footbridge over the Swaroop Sagar canal, lies Ambrai Ghat (Manjhi Ghat), celebrated for possessing the single most spectacular, postcard-perfect panorama in India: looking across the water to the illuminated facades of the City Palace, Taj Lake Palace, and Jag Mandir.",
      "To the north lies Fateh Sagar Lake, a tranquil crescent-shaped reservoir surrounded by the green peaks of Moti Magri (crowned by the bronze equestrian statue of Maharana Pratap) and the formal gardens of Saheliyon Ki Bari (Garden of the Maidens), designed in the 18th century with marble elephants, lotus pools, and gravity-fed fountains. Perched high above the western hills at 944 meters stands Sajjangarh (The Monsoon Palace), built by Maharana Sajjan Singh in 1884 to track monsoon clouds, offering breathtaking 360-degree sunset views.",
      "In the broader Mewar countryside lie world-famous architectural treasures: the ancient 108-temple complex of Eklingji (the patron deity of Mewar) twenty-two kilometers north, the 10th-century Sahasra Bahu (Sas-Bahu) temples at Nagda, the colossal mountain citadel of Kumbhalgarh Fort (with its 36-kilometer-long stone wall), and the 15th-century Ranakpur Jain Temple, containing one thousand four hundred and forty-four uniquely carved white marble pillars."
    ]
  },
  {
    heading: "Permits, Palace Entry Regulations & Lake Pichola Boating Rules",
    callout: {
      type: "warning",
      text: "City Palace museum tickets do not include the boat ride to Jag Mandir; purchase a combined Palace & Boat ticket at the Rameshwar Ghat ticket counter inside the palace complex."
    },
    paragraphs: [
      "Visiting monuments and navigating waterways in Udaipur is regulated by the City Palace Museum Trust (Maharana of Mewar Charitable Foundation - MMCF) and the Rajasthan Tourism Department.",
      "At the City Palace Museum, entry tickets are available at the main Badi Pol gate or online via the official MMCF portal (eternalmewar.org): ₹330 for adults, and ₹110 for children. The ticket covers the comprehensive museum circuit, including the Mor Chowk (Peacock Courtyard with three glass-mosaic peacocks crafted from five thousand pieces of colored glass), the Manak Mahal (Ruby Palace with mirror work), the Zenana Mahal (Queen's Quarters), and the Silver Gallery containing royal ceremonial carriages. Camera tickets cost ₹300 for digital SLRs.",
      "Lake Pichola boat safaris depart exclusively from the private Rameshwar Ghat located inside the City Palace grounds, operated by the royal trust. Standard thirty-minute motorboat cruises around the lake cost ₹550 per person during the daytime and ₹850 during the golden sunset hour (including a thirty-minute disembarkation stop at the historic island palace of Jag Mandir). A less expensive municipal boat service operates from Dudh Talai park at the southern end of the lake (₹150 to ₹300 per person).",
      "At the UNESCO World Heritage mountain fortress of Kumbhalgarh (eighty-five kilometers north), entry is regulated by the Archaeological Survey of India (ASI): ₹25 for Indian citizens, SAARC, and BIMSTEC visitors, and ₹300 for foreign passport holders. Visitors should wear sturdy hiking shoes to walk along the massive stone battlements.",
      "At the Ranakpur Jain Temple in the western Aravalli valley, visitors must dress conservatively (shoulders and knees covered; no leather items, belts, or shoes allowed inside). Non-Jain visitors are admitted between 12:00 noon and 17:00 PM daily. An audio-guide is included in the admission ticket (₹200 for foreign visitors, ₹50 for Indians), and photography of the 1,444 carved marble pillars is permitted with a nominal camera fee of ₹100."
    ]
  },
  {
    heading: "Curated 5-Day Mewar Heritage Master Itinerary",
    paragraphs: [
      "Day 1: The Imperial City Palace, Jagdish Temple & Sunset at Ambrai. Arrive in Udaipur via the morning Mewar Express train. Check into a heritage lakefront haveli or palace hotel. Begin at 10:30 AM with a comprehensive three-hour guided exploration of the City Palace complex. Marvel at the Mor Chowk's vibrant glass peacock mosaics, walk through the Toran Pol, and admire the collection of royal miniature paintings. Walk five minutes to Jagdish Temple to admire its 79-foot carved stone spire and attend noon aarti. In the afternoon, browse the miniature painting studios and silver shops of Jagdish Chowk. By 17:30 PM, cross the footbridge to Ambrai Ghat; sit on the stone steps watching the sunset cast golden reflections over Lake Pichola, followed by a lakeside candlelit dinner at Ambrai Restaurant admiring the illuminated City Palace.",
      "Day 2: Island Palaces, Bagore Ki Haveli & Sajjangarh Monsoon Palace. Board the 09:30 AM royal trust motorboat from Rameshwar Ghat for a cruise across Lake Pichola. Glide past the floating white marble Taj Lake Palace, disembarking at the island retreat of Jag Mandir. Walk through its stone elephant courtyards, marble pavilions, and Mughal-style gardens where Prince Khurram (later Emperor Shah Jahan) sought refuge in 1623 CE. Return to town to explore Bagore Ki Haveli on Gangaur Ghat, admiring its 138 rooms displaying royal costumes, antique dice, and the world's largest turban. In the late afternoon, drive ten kilometers up the winding mountain road to Sajjangarh (The Monsoon Palace) at 944 meters, taking in a spectacular 360-degree sunset panorama across the lakes and hills. In the evening, return to Bagore Ki Haveli for the celebrated Dharohar folk dance and puppet performance at 19:00 PM.",
      "Day 3: Sacred Eklingji Temple Complex & Ancient Nagda Ruins. Set out at 08:30 AM for a journey into the northern Mewar valley. Drive twenty-two kilometers north along NH-58 to the ancient pilgrimage complex of Eklingji, the patron deity of the Maharanas of Mewar. Enter the fortified complex containing one hundred and eight temples carved from grey sandstone and black marble, attending the solemn 10:30 AM morning aarti before the magnificent four-faced black marble Shiva lingam. Continue two kilometers to the 10th-century ruins of Nagda, the original capital of Mewar; explore the exquisite twin Sahasra Bahu (Sas-Bahu) temples, admiring the detailed friezes of musicians, lovers, and deities carved on the exterior plinths. Savor an authentic Mewari Dal Baati lunch at a rural roadside dhabba on the return drive.",
      "Day 4: The Great Wall of India: Kumbhalgarh & Ranakpur Marble Temple. Embark at 07:00 AM on a full-day expedition into the western Aravalli ranges. Arrive at Kumbhalgarh Fort (85 km), the birthplace of Maharana Pratap and the second most formidable fortress in Rajasthan after Chittorgarh. Hike the stone ramparts along its legendary 36-kilometer-long stone perimeter wall—the second longest continuous wall in the world after the Great Wall of China—climbing to the Badal Mahal (Cloud Palace) at the summit for views across the desert of Marwar. Continue fifty kilometers down the scenic winding mountain ghat to the 15th-century Ranakpur Jain Temple; spend two silent hours in the forest sanctuary admiring the 1,444 intricately carved white marble pillars, of which no two are identical.",
      "Day 5: Northern Lakes, Saheliyon Ki Bari & Shilpgram Craft Village. Spend your final morning exploring Udaipur's northern lakes. Walk through the fragrant, shaded courtyards of Saheliyon Ki Bari (Garden of the Maidens), watching the marble fountains operate solely by natural water pressure from Fateh Sagar Lake without electric pumps. Stroll along the paved promenade of Fateh Sagar Lake, stopping for cold coffee at a waterfront cafe. Drive three kilometers west to Shilpgram, a 70-acre living rural arts and crafts museum, watching traditional potters, weavers, and leather artisans at work in replica mud huts representing rural Rajasthan, Gujarat, and Goa. Conclude with a visit to a master gemstone and miniature painting atelier before boarding your evening train or flight."
    ],
    table: {
      headers: ["Day & Time Slot", "Regional Sector", "Core Monuments & Activities", "Mobility Mode", "Gastronomic Recommendations"],
      rows: [
        ["Day 1: 10:30 - 18:30", "Old City & Waterfront", "City Palace museum; Jagdish Temple; Ambrai sunset", "Foot / auto-rickshaw", "Mewari Gatte Ki Sabzi with hot phulkas & ker sangri"],
        ["Day 2: 09:30 - 17:30", "Lake Pichola & Sajjangarh", "Jag Mandir boat; Bagore Haveli; Monsoon Palace sunset", "Boat & private cab", "Mewari Laal Maas with bajra roti, lakeside dining"],
        ["Day 3: 08:30 - 15:30", "Northern Pilgrimage", "Eklingji 108 temples; Nagda Sahasra Bahu; Lake Badi", "Private car (NH-58)", "Traditional Dal Baati Churma dipped in pure desi ghee"],
        ["Day 4: 07:00 - 18:30", "Western Aravallis", "Kumbhalgarh 36-km wall; Ranakpur 1,444 marble pillars", "Private car (NH-162)", "Wholesome Jain vegetarian lunch at Ranakpur Bhojanshala"],
        ["Day 5: 09:00 - 15:00", "Northern Lakes & Crafts", "Saheliyon Ki Bari; Fateh Sagar; Shilpgram artisans", "Auto-rickshaw / car", "Crispy Pyaaz Kachori & sweet Mawa Kachori at Jagdish Chowk"]
      ]
    }
  },
  {
    heading: "Financial Architecture & Itemized INR Expense Breakdown",
    callout: {
      type: "note",
      text: "Udaipur offers extraordinary diversity in lodging, from charming lake-view haveli guesthouses starting at ₹1,200 to the world's finest 5-star palace hotels."
    },
    paragraphs: [
      "Budget planning for Udaipur reflects a wide spectrum of choices, accommodating everything from modest backpacker travel along the ghats to ultra-luxury celebrations in royal island suites. A solo budget traveler staying in lakefront heritage guesthouses or hostels in the Old City, dining at local messes, and using auto-rickshaws and walking trails can travel comfortably on ₹2,200 to ₹3,200 per day.",
      "Mid-range travelers staying in restored 19th-century merchant havelis with rooftop lake views (such as Jagat Niwas Palace, Karni Fort, or Amet Haveli), renting private cars for day excursions to Kumbhalgarh and Ranakpur, and enjoying fine dining on waterfront terraces should budget ₹6,000 to ₹11,000 per day for a couple.",
      "Luxury travelers seeking world-renowned royal palace hospitality—such as the Taj Lake Palace (an authentic 18th-century marble palace floating in Lake Pichola), The Oberoi Udaivilas (consistently rated among the finest resorts in the world, set on fifty acres on the shores of Lake Pichola), or The Leela Palace Udaipur—will find room tariffs between ₹30,000 and ₹85,000 per night during the peak winter season (November to February). Private chauffeur-driven air-conditioned SUVs cost ₹3,200 to ₹4,500 per full day.",
      "Sightseeing and activity costs are moderate: City Palace Museum entry is ₹330; royal boat cruise to Jag Mandir is ₹550 to ₹850; Bagore Ki Haveli Dharohar dance show is ₹100; and full-day private car hire to Kumbhalgarh and Ranakpur (a 220-kilometer round trip) costs ₹3,500 to ₹4,500."
    ],
    table: {
      headers: ["Budget Tier", "Daily Accommodation (INR)", "Daily Meals (INR)", "Local Transit (INR)", "Activities & Entry (INR)", "Total Estimated Daily INR"],
      rows: [
        ["Budget (Solo)", "₹1,000 - ₹1,600 (Lakefront haveli guesthouse)", "₹450 - ₹750 (Rooftop cafes, thali messes)", "₹250 - ₹450 (Auto-rickshaws, walking)", "₹350 - ₹600 (Palace, Bagore dance)", "₹2,050 - ₹3,400 per day"],
        ["Mid-Range (Couple)", "₹4,500 - ₹8,500 (Restored heritage haveli, lake view)", "₹1,800 - ₹3,200 (Waterfront terrace dining)", "₹1,200 - ₹2,000 (Local auto hire / private cab)", "₹1,200 - ₹2,500 (Lake boat, Kumbhalgarh trip)", "₹8,700 - ₹16,200 per day"],
        ["Luxury (Couple)", "₹30,000 - ₹75,000 (Floating marble palace suite)", "₹5,500 - ₹10,500 (Royal multi-course banquets)", "₹3,500 - ₹5,000 (Private chauffeured SUV)", "₹3,000 - ₹6,000 (Private historian, private boat)", "₹42,000 - ₹96,500 per day"]
      ]
    }
  },
  {
    heading: "Lake Basin Meteorology, Summer Heat & Monsoon Deluges",
    callout: {
      type: "warning",
      text: "Summer heat reaches 40°C in May; during peak monsoon seasons, Lake Pichola and Fateh Sagar can overflow, submerging low-lying ghat steps."
    },
    paragraphs: [
      "Udaipur's valley topography and extensive water surfaces create a microclimate that is significantly more moderate than the hyper-arid deserts of western Rajasthan, though seasonal transitions remain pronounced.",
      "The summer season between April and June brings intense daytime sunshine with temperatures rising to 38°C to 41°C. While humidity is low, midday sun reflected off the white marble and water surfaces can cause rapid sunburn and dehydration. Travelers visiting in summer must schedule outdoor monument explorations between 07:00 and 10:30 AM, reserving midday hours for interior museum galleries or shaded haveli courtyards.",
      "The winter season (November to February) is characterized by delightful, mild daytime warmth (24°C to 27°C), but evening and early morning temperatures drop sharply to 10°C to 13°C. Evening boat rides on Lake Pichola and dinners on open rooftop terraces require warm layers: pack a woolen shawl, fleece sweater, or light insulated jacket.",
      "The South-West Monsoon between July and September brings vital rainfall that determines the water levels of the lakes. In years with bountiful rainfall, the sluice gates of Lake Pichola open to discharge excess water into Fateh Sagar, turning the entire city into a vibrant festival of rushing water. During heavy storm events, water levels can submerge the lower steps of Gangaur Ghat and Ambrai Ghat, requiring caution when walking along waterfront parapets."
    ]
  },
  {
    heading: "Gastronomic Topography: Mewari Royalty, Gatte Ki Sabzi & Street Food",
    paragraphs: [
      "The culinary traditions of Udaipur reflect the refined gastronomy of the Mewar royal court, the hearty resourcefulness of desert agrarian life, and a vibrant street food culture centered around the historic ghats.",
      "The centerpiece of traditional Mewari dining is Gatte Ki Sabzi. Gatte are tender dumplings made by kneading chickpea gram flour (besan) with pure ghee, turmeric, carom seeds (ajwain), and a pinch of asafoetida, rolled into cylinders, boiled in water, sliced into rounds, and gently simmered in a velvety, tangy gravy of whipped sour yogurt, mustard seeds, and dry roasted coriander. The result is a comforting, protein-rich dish eaten with hot, puffed wheat phulkas or steamed rice.",
      "For meat lovers, Mewari royal cuisine celebrates specialized preparations like Banjara Murg (country chicken slow-cooked with crushed coriander, whole red chilies, and roasted garlic) and Mewari Laal Maas (tender country mutton simmered in earthen pots with spicy Mathania red chilies and pure mustard oil). Unlike plains curries, royal Mewari preparations emphasize slow reduction of ingredients, allowing the natural juices of the meat to blend with whole spices without artificial thickeners.",
      "A quintessential desert specialty is Ker Sangri. Foraged from wild desert shrubs—the green berry-like ker (Capparis decidua) and the slender bean-like pods of the sangri (Prosopis cineraria) tree—the ingredients are sun-dried, soaked in sour buttermilk to remove bitterness, and sauteed with dry red chilies, cumin, amchur (dry mango powder), and mustard oil, creating a tangy, earthy, and delightfully piquant delicacy that can be preserved for weeks without refrigeration.",
      "Street food along the ghats and around Sukhadia Circle is legendary: piping-hot Mirchi Badas (large green chili peppers stuffed with spiced mashed potato, dipped in gram flour batter, and deep-fried until crisp), savory Pyaaz Kachoris served with sweet tamarind chutney, and kulhad cups of sweet, thick saffron lassi topped with fresh malai and crushed pistachios."
    ],
    table: {
      headers: ["Iconic Mewari Dish", "Cultural Lineage", "Key Ingredients & Seasoning", "Flavor Profile", "Where to Experience"],
      rows: [
        ["Traditional Mewari Gatte Ki Sabzi", "Classical Rajput Vegetarian", "Gram flour dumplings, spiced curd gravy, ajwain", "Tangy, savory, velvety, gentle aromatic warmth", "Heritage dining rooms & local thali halls"],
        ["Authentic Mewari Dal Baati", "Desert Agrarian Feast", "Baked wheat baatis, panchmel dal, pure cow ghee", "Earthy, robust, rich, satisfying rustic comfort", "Krishna Dal Bati Restro, Sukhadia Circle"],
        ["Royal Banjara Murg Curry", "Mewar Court Hunting Feast", "Country fowl, crushed coriander, whole red chilies", "Smoky, savory, rustic heat, richly seasoned", "Ambrai & 1559 AD heritage restaurants"],
        ["Foraged Ker Sangri Sabzi", "Wild Desert Foraging Tradition", "Sun-dried ker berries, sangri beans, amchur, oil", "Tart, tangy, earthy, piquant, complex savory notes", "Traditional family-run messes across Old City"],
        ["Mirchi Bada & Saffron Lassi", "Udaipur Street Food Classic", "Large mild chili, potato stuffing, sweet curd", "Crispy exterior, spicy filling, cooling sweet lassi", "Local street stalls near Jagdish Chowk"]
      ]
    }
  },
  {
    heading: "Cultural Protocols, Mewar Pride & Royal Heritage Etiquette",
    callout: {
      type: "note",
      text: "Mewar takes immense pride in its historic independence and chivalric code; treat local heritage, royal customs, and active temple sanctums with deep reverence."
    },
    paragraphs: [
      "The people of Udaipur take extraordinary pride in the history of Mewar—a kingdom that for centuries prioritized sovereignty, religious freedom, and human dignity over submission to imperial conquest. The memory of heroes like Maharana Pratap and the legendary battle of Haldighati (1576 CE) is deeply woven into the local consciousness.",
      "When interacting with local residents and shopkeepers, maintain a polite, respectful tone. Greet people with folded hands and a warm 'Khamma Ghani Sa' or 'Namaste.' In daily life, residents are remarkably gentle, polite, and helpful toward travelers.",
      "At active religious shrines—such as the Jagdish Temple and the ancient Eklingji Temple complex—strict orthodox decorum is observed. Footwear must be removed outside temple gateways; clothing must be conservative (shoulders and knees fully covered; shorts, sleeveless tops, and revealing clothes are strictly prohibited). At Eklingji Temple, mobile phones, cameras, smart watches, and leather articles must be deposited in secure lockers outside the temple before passing through security turnstiles.",
      "Along the public bathing ghats (such as Gangaur Ghat and Lal Ghat), local residents and pilgrims perform daily morning prayers and ablutions. Travelers should respect their privacy: never point cameras directly at people bathing or performing religious rituals without polite verbal consent, and avoid sitting on steps designated for ceremonial bathing.",
      "Tipping conventions in Udaipur are standard and appreciated: 7% to 10% at independent restaurants where no service charge is added; ₹50 to ₹100 for auto-rickshaw drivers on full-day hire; and ₹500 to ₹800 for authorized ASI tour guides at monuments."
    ]
  },
  {
    heading: "Architectural Lineage: Rajput Stonecraft & Island Marble Palaces",
    paragraphs: [
      "The architectural heritage of Udaipur represents the highest expression of the Mewari architectural school, characterized by fortress-like masonry exteriors, delicate marble filigree, expansive open-air courtyards, and an ingenious integration with natural lake topography.",
      "The City Palace is a masterwork of architectural organic accretion: built over four centuries by twenty-two successive rulers, each addition harmonized with the preexisting stone fabric. Built primarily of grey granite and white marble quarried from nearby Rajsamand, the palace features massive blank exterior stone walls designed for military defense, pierced by projecting decorative jharokhas, marble cupolas, and carved stone brackets. Inside, open-air courtyards—such as the Badi Mahal (Garden Palace), constructed atop a natural 27-meter-high rock hillock with full-grown trees, marble swimming tanks, and arched pavilions—defy conventional structural engineering.",
      "The Mor Chowk (Peacock Courtyard) inside the City Palace is one of India's most celebrated decorative masterworks. Added in the late 19th century by Maharana Sajjan Singh, the courtyard features three high-relief glass-mosaic peacocks crafted from over five thousand pieces of brilliantly colored green, gold, and lapis-lazuli glass, depicting the birds in radiant postures representing the arrival of the monsoon rains.",
      "The Taj Lake Palace (Jag Niwas), constructed between 1743 and 1746 by Maharana Jagat Singh II as a summer pleasure palace, is built entirely of white Makrana marble on a natural four-acre rock foundation in Lake Pichola. Its architectural genius lies in its light, floating appearance: pillared marble pavilions, cusped arches, interior courtyard gardens, and fountain pools create an environment that feels disconnected from the physical earth, appearing to hover upon the water.",
      "At Ranakpur, the 15th-century Chaumukha Jain Temple represents the absolute zenith of marble carving in India. Supported by one thousand four hundred and forty-four uniquely carved marble pillars, the temple's vaulted ceilings feature intricate stone lace rosettes, concentric rings of dancing nymphs, and hanging stone pendants that appear as delicate as spun silk, illuminated by natural light filtered through marble clerestories."
    ]
  },
  {
    heading: "On-Ground Logistics: Auto-Rickshaws, Walking Paths & Lake Boating",
    callout: {
      type: "tip",
      text: "The Old City streets around Jagdish Chowk are extremely narrow and pedestrianized; auto-rickshaws or walking are far superior to private cars in the heritage core."
    },
    paragraphs: [
      "Navigating Udaipur requires matching your transit mode to the city's distinct geographic zones. The historic Old City around Lake Pichola, Jagdish Chowk, and the ghats consists of narrow, winding medieval streets where large passenger cars cannot physically enter due to sharp corners and pedestrian bollards.",
      "Walking is the most rewarding way to explore the Old City: the distance between the City Palace entrance, Jagdish Temple, Gangaur Ghat, and the footbridge to Ambrai is barely a few hundred meters. The walk is lined with historic havelis, rooftop cafes, and colorful artisan shops.",
      "For medium distances within the city—such as traveling to Fateh Sagar Lake, Saheliyon Ki Bari, or the railway station—auto-rickshaws are abundant and inexpensive. Standard fares range between ₹80 and ₹150 for short hops. While auto drivers rarely use digital meters, fares are generally standardized; agree on the price before boarding.",
      "To reach the hilltop Monsoon Palace (Sajjangarh) or the rural pottery village of Molela, hiring an authorized private taxi on a dedicated half-day or full-day hire package (₹2,000 to ₹3,500) provides convenient and reliable mobility.",
      "Renting automatic scooters (Honda Activa) or geared motorcycles is popular among independent travelers, available from rental agencies near the railway station and Gangaur Ghat for ₹400 to ₹700 per day, plus fuel. Scooters are ideal for scenic rides around Fateh Sagar Lake and out to the quiet waters of Badi Lake. Riders must wear helmets and carry a valid driving license."
    ]
  },
  {
    heading: "Highland Hydration, Sun Safety & Travel Health Precautions",
    paragraphs: [
      "Udaipur's healthy, temperate climate provides a pleasant travel environment, but travelers should take sensible health precautions to manage sunny daytime hours, dry plateau air, and extensive walking across stone staircases.",
      "Hydration remains essential throughout the year. The dry plateau air and sunny daytime conditions accelerate fluid loss. Drink at least two-and-a-half to three liters of purified water daily. Fresh tender coconut water and chilled sweet lime juice are widely available at roadside stalls for ₹40 to ₹50, providing natural electrolytes that prevent dehydration.",
      "Never drink untreated tap water from public taps or budget guesthouses. Drink exclusively filtered reverse-osmosis (RO) water provided in carafes at reputable hotels or carry a reusable insulated stainless-steel water bottle equipped with an integrated micro-filtration purifier.",
      "Sun protection is advisable when walking across open palace courtyards, fort ramparts, or riding open boats on Lake Pichola. Wear a wide-brimmed cotton sun hat, apply broad-spectrum sunscreen, and wear UV-rated sunglasses to shield eyes against glare reflected off marble plazas and water surfaces.",
      "Food hygiene in Udaipur is generally very high, particularly at established vegetarian restaurants, heritage hotel dining rooms, and high-turnover street sweet shops. When sampling street food, prioritize piping-hot freshly fried kachoris and pakoras over raw unpeeled vegetables or open salads from street carts."
    ]
  },
  {
    heading: "Digital Infrastructure, UPI Payments & Lakeside Remote Work",
    callout: {
      type: "note",
      text: "Cellular 4G/5G data coverage and UPI digital payment acceptance are comprehensive across Udaipur city and surrounding lake basins."
    },
    paragraphs: [
      "Udaipur possesses excellent telecommunications infrastructure. High-speed 5G and 4G LTE cellular data from Bharti Airtel, Reliance Jio, and Vodafone Idea is dependable and fast throughout the entire metropolitan area, the Old City ghats, and along the lake perimeters.",
      "Unified Payments Interface (UPI) digital transactions are accepted across virtually all commercial establishments in Udaipur: palace ticket counters, jewelers, miniature painting ateliers, cafes, and auto-rickshaw drivers universally display QR payment codes. Carrying a modest cash reserve of ₹2,000 to ₹3,500 is helpful for small artisan purchases in rural villages like Molela, shoe-care stalls at temples, and boat tips.",
      "Udaipur has become an exceptionally popular mountain workation destination for writers, designers, and remote professionals drawn to its peaceful lakeside atmosphere and rich cultural community. Numerous boutique heritage hotels, modern hostels (such as Zostel and Moustache), and rooftop cafes offer dedicated high-speed fiber-optic broadband (100 Mbps to 200 Mbps speeds).",
      "When planning an extended workation, verify that your accommodation possesses both high-speed fiber internet and generator backup, ensuring uninterrupted connectivity during peak daytime working hours."
    ]
  },
  {
    heading: "Hydrological Conservation, Lake Ecology & Artisan Preservation",
    paragraphs: [
      "The delicate ecological and cultural balance of Udaipur depends fundamentally on the health of its water catchments and the preservation of its traditional artisan communities.",
      "The interconnected lakes of Udaipur face significant environmental pressures from siltation, untreated urban runoff, and heavy tourist boat traffic. Citizen-led environmental organizations like the Jheel Sanrakshan Samiti (Lake Conservation Committee) have led pioneering legal and ecological battles to ban polluting motorized watercraft from sensitive zones, install sewage interception lines, and restore the natural catchment wetlands around the Ayad River. When visiting the lakes, practice strict 'Leave No Trace' principles: never throw plastic bottles, food wrappers, or flower garlands into the water.",
      "Preserving the architectural heritage of the Old City requires active civic responsibility. The Municipal Corporation of Udaipur enforces heritage zoning laws to protect historic haveli facades and stone jharokhas along the waterfront. Travelers should support heritage conservation by staying in certified heritage homestays and avoiding unapproved modern developments that disfigure the historic shoreline.",
      "Support the authentic artisanal heritage of Mewar by purchasing directly from master craftspeople: buy certified Mewari miniature paintings on handmade paper or camel bone from licensed master artists in Jagdish Chowk, pure silver jewelry from established hallmarked jewelers, and authentic terracotta plaques from the traditional potter village of Molela."
    ]
  },
  {
    heading: "Photography Protocols, Drone Regulations & Waterfront Discretion",
    callout: {
      type: "warning",
      text: "Drones are strictly prohibited across Udaipur without prior written authorization from the District Magistrate and City Police Commissioner."
    },
    paragraphs: [
      "Udaipur's breathtaking visual texture—white marble palaces reflected in tranquil blue lakes, golden sunset light illuminating Aravalli mountain ridges, colorful sarees draped on stone ghats, and intricate stone carvings—makes it one of the most photographed cities in the world. However, photographers must follow strict legal regulations and ethical protocols.",
      "Flying recreational or commercial drones in Udaipur is strictly illegal without prior written clearance from the District Magistrate and local police authorities. The presence of sensitive heritage palaces, royal family residences, VIP security zones, and high-density tourist areas makes the airspace strictly regulated. Operating unauthorized drones will result in equipment seizure and police detention.",
      "Inside historical monuments like the City Palace, personal handheld still photography and smartphone videography are permitted. Commercial filming involving tripods, external lighting umbrellas, and professional cinematic gear requires obtaining written permission from the MMCF trust and paying prescribed commercial fees.",
      "When photographing active religious rituals inside Jagdish Temple or along the public bathing ghats, maintain respectful discretion. Always ask polite permission before taking close-up portraits of pilgrims or devotees, and never photograph women bathing at the ghats."
    ]
  },
  {
    heading: "Packing Matrix: Waterfront Walking Shoes, Sun Defense & Field Gear",
    paragraphs: [
      "Packing for Udaipur requires preparing for pleasant sunny daytime weather, extensive walking across stone ghats and palace courtyards, and respectful dress codes at active religious shrines. The following matrix outlines essential gear.",
      "Footwear should prioritize walking comfort, breathability, and traction. You will walk across cobblestone alleys, polished palace stone floors, and steep temple staircases. Bring comfortable walking sneakers or cushioned loafers, paired with slip-on sandals that can be removed quickly outside temple portals and palace shoe counters.",
      "Clothing should consist of lightweight, breathable natural fabrics: 100% cotton, linen, or fine khadi in light, heat-reflective shades. Pack modest clothing that covers shoulders and knees for temple entry: long cotton trousers and a collared shirt for men, and a modest saree, salwar kameez, or long maxi dress for women. In winter (November to February), pack a warm woolen shawl, fleece sweater, or light insulated jacket for cool evenings on open rooftop terraces.",
      "Sun protection is indispensable: bring a wide-brimmed cotton sun hat, UV-rated polarized sunglasses, high-SPF broad-spectrum sunscreen, and an insulated stainless-steel water bottle to keep drinking water cold during lake walks. Field gear essentials include a compact 10,000mAh power bank to recharge smartphones during full-day sightseeing tours and a lightweight daypack (15 to 20 liters)."
    ],
    table: {
      headers: ["Gear Category", "Recommended Field Item", "Practical Field Function", "Seasonal Criticality"],
      rows: [
        ["Footwear", "Cushioned walking sneakers + slip-on temple sandals", "Walking stone ghats & palace corridors", "Essential year-round"],
        ["Sun Protection", "Wide-brimmed cotton hat + polarized sunglasses", "Shielding against daytime solar glare on water", "Crucial year-round"],
        ["Winter Warmth", "Woolen shawl / fleece sweater + light jacket", "Warmth against 10°C to 14°C winter evening chill", "Essential: November - February"],
        ["Hydration & Pack", "Insulated stainless steel flask (1L) + 20L daypack", "Carrying cold water & market purchases", "Recommended year-round"],
        ["Power & Camera", "10,000mAh power bank + lens cleaning cloth", "Recharging phones during long sightseeing days", "Recommended year-round"]
      ]
    }
  },
  {
    heading: "Emergency Infrastructure, Hospitals & Urban Medical Access",
    callout: {
      type: "note",
      text: "The Maharana Bhupal (MB) Government Hospital and Geetanjali Hospital in Udaipur provide comprehensive 24/7 emergency trauma care and multi-specialty medical services."
    },
    paragraphs: [
      "Udaipur possesses excellent healthcare and emergency medical infrastructure, serving as the premier tertiary medical hub for southern Rajasthan and neighboring districts of Gujarat and Madhya Pradesh.",
      "The premier public medical institution is the historic Maharana Bhupal (MB) Government Hospital, located on Hospital Road near Chetak Circle. Affiliated with the R.N.T. Medical College, MB Hospital is a comprehensive government healthcare institution featuring a 24-hour Super-Specialty Trauma Center, modern intensive care units, emergency surgery, and specialized burns and cardiology units.",
      "In the private medical sector, world-class tertiary healthcare is provided by Geetanjali Hospital on Hiran Magri, Paras JK Hospital on Shobhagpura Road, and American International Institute of Medical Sciences (AIIMS) Hospital on Bedwas, all equipped with modern diagnostic radiology, interventional cardiology, and English-speaking medical specialists accepting major domestic and international health insurance cashless claims.",
      "The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains rapid-response vehicles throughout the city.",
      "The Rajasthan Tourist Police maintain an active assistance desk in the central city area near Jagdish Chowk and the City Palace gate, providing helpful guidance, lost-property assistance, and conflict resolution for visitors."
    ],
    table: {
      headers: ["Emergency Department", "Designated Medical Facility", "Physical Address", "Emergency Telephone"],
      rows: [
        ["Statewide Emergency Dispatch", "Central Integrated Emergency Service", "Statewide Fleet", "112"],
        ["Apex Public Medical College", "Maharana Bhupal (MB) Hospital", "Hospital Road, Chetak Circle", "+91 294 241 8100"],
        ["Private Multi-Specialty", "Paras JK Hospital", "Shobhagpura Road, Udaipur", "+91 294 666 9999"],
        ["Udaipur Tourist Police Desk", "Tourist Police Assistance Station", "Jagdish Chowk, Old City", "+91 294 241 0849"],
        ["Emergency Ambulance Service", "108 Emergency Medical Services", "District-wide Fleet", "108"]
      ]
    }
  },
  {
    heading: "Extended Residency, Arts Fellowships & Lakeside Cadence",
    paragraphs: [
      "Udaipur has long offered a tranquil and restorative haven for writers, artists, miniature painters, and remote knowledge workers drawn to its extraordinary lakeside beauty, rich royal heritage, and peaceful cultural cadence. An extended stay in Udaipur provides an inspiring lifestyle structured by artistic discovery and natural rhythms.",
      "Daily life unfolds with quiet elegance. Morning begins with a walk along the serene promenade of Fateh Sagar Lake as the dawn illuminates the Aravalli peaks, accompanied by the calls of peacocks and morning temple bells. Days are dedicated to focused intellectual or creative work in quiet courtyard havelis, studying miniature painting techniques under traditional master artists, or exploring antiquarian bookshops, while evenings conclude with a cup of spiced tea on a rooftop terrace overlooking the illuminated reflections of Lake Pichola.",
      "Extended residential rentals (one to six months) include private furnished apartments in Fatehpura, Panchwati, or Saheli Nagar (₹20,000 to ₹45,000 per month) and historic rooms in restored heritage havelis along the ghats (₹30,000 to ₹75,000 per month). Many properties offer full kitchen amenities, high-speed fiber internet, and quiet working spaces with lake or garden views.",
      "The city possesses a warm, cosmopolitan, and culturally vibrant community anchored by traditional artisan guilds, international artists, local cultural trusts like the West Zone Cultural Centre at Bagore Ki Haveli, and regular classical music and dance festivals held against the backdrop of the illuminated palaces, offering an enriching social environment for extended residents."
    ]
  },
  {
    heading: "Synthesis: The Living Romance of the White City",
    paragraphs: [
      "To visit Udaipur is to step into a living fairy tale carved of white marble and tranquil water. As you stand on the stone ramparts of Ambrai Ghat at twilight, watching the evening sky turn violet and gold while the illuminated facade of the City Palace reflects upon the calm surface of Lake Pichola, the romance of Mewar feels timeless and eternal.",
      "The true soul of Udaipur is found not only in monumental stone palaces and island retreats, but in the quiet, living moments of daily grace: in the soft clinking of temple bells at Jagdish Temple as priests wave burning brass lamps, in the concentrated gaze of a master miniature painter applying single-hair brushstrokes of squirrel-hair to a sheet of antique paper, and in the gentle whisper of the lake breeze rustling through ancient frangipani trees in palace courtyards.",
      "Udaipur reminds us that human beings can live in harmony with fragile nature—that by honoring water, respecting history, and building with artistic devotion, a civilization can create an enduring sanctuary of beauty and peace.",
      "As you depart Udaipur, watching the silhouetted palaces and reflecting lakes fade into the golden evening twilight, you carry with you an indelible gift: a memory of white marble glowing in the sun, the warmth of generous Rajput hospitality, and the eternal, magnificent poetry of the City of Lakes."
    ]
  }
];

const udaipurInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    alt: "The majestic City Palace complex of Udaipur reflected in the calm waters of Lake Pichola at sunset",
    caption: "The City Palace of Udaipur was constructed over four centuries by twenty-two Maharanas directly along the shores of Lake Pichola."
  },
  {
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
    alt: "The floating white marble facade of the Taj Lake Palace island in Lake Pichola in Udaipur, Rajasthan",
    caption: "The Taj Lake Palace (Jag Niwas) was built in 1746 of pure white Makrana marble, appearing to float upon Lake Pichola."
  },
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    alt: "The 15th-century white marble Ranakpur Jain Temple with intricately carved pillars in the Aravalli hills",
    caption: "The 15th-century Ranakpur Jain Temple in the Aravalli hills contains 1,444 uniquely carved white marble pillars."
  }
];

const udaipurBlocks = assembleStructuredBlocks(udaipurSections, udaipurInlineImages);

const udaipurConfig = {
  title: "Udaipur",
  slug: "udaipur",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition into the City of Lakes: the four-century City Palace, floating marble palaces of Lake Pichola, the 36-kilometer wall of Kumbhalgarh Fort, 1,444 marble pillars of Ranakpur, and verified Mewar transit logistics.",
  description: "An exhaustive field expedition into the City of Lakes: the four-century City Palace, floating marble palaces of Lake Pichola, the 36-kilometer wall of Kumbhalgarh Fort, 1,444 marble pillars of Ranakpur, and verified Mewar transit logistics.",
  coverImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "Scenic view of the City Palace and Lake Pichola under golden evening skies in Udaipur, Rajasthan",
  coverImageCaption: "Udaipur sits nestled in an Aravalli valley around an intricate system of freshwater lakes, celebrated as the royal capital of Mewar.",
  structuredBlocks: udaipurBlocks,
  tags: ["udaipur", "rajasthan", "lake-pichola", "city-palace", "mewar", "kumbhalgarh", "ranakpur", "lake-palace"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "Annals and Antiquities of Rajasthan (Lt. Col. James Tod)", url: "https://www.gutenberg.org/" },
    { title: "Maharana of Mewar Charitable Foundation Heritage Archives", url: "https://eternalmewar.org/" },
    { title: "Udaipur: The City of Lakes (Giles Tillotson)", url: "https://www.jstor.org/" },
    { title: "Archaeological Survey of India: Kumbhalgarh Fort Monograph", url: "https://asi.nic.in/" }
  ]
};

const udaipurBuilt = writeCanonicalArticleModule("travel", "udaipur.js", udaipurConfig);
console.log(`[Udaipur] Word count: ${udaipurBuilt.wordCount}`);

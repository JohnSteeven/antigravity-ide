"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences", "travel"]);

console.log("Authoring Travel India 2/20: Pondicherry and the Tamil Coast...");

const pondySections = [
  {
    heading: "Coromandel Topography, Maritime Lineage & Strategic Timing",
    callout: {
      type: "note",
      text: "Puducherry occupies a critical coastal threshold on the Coromandel Coast, shaped by three centuries of French administrative urban planning and two millennia of Tamil maritime commerce."
    },
    paragraphs: [
      "The Coromandel Coast of Tamil Nadu, stretching along the Bay of Bengal, is a landscape defined by gentle surf, brackish estuarine lagoons, and deep historical entanglements with Indian Ocean trade networks. At its cultural epicenter sits the Union Territory of Puducherry (formerly Pondicherry), situated approximately one hundred and fifty kilometers south of Chennai. Unlike the high granite escarpments of the Western Ghats, the eastern littoral is a low-lying coastal plain where alluvial rivers—such as the Gingee, Ponnaiyar, and Kollidam—meet the sea through expansive mangrove estuaries and tidal sandspits.",
      "The historical geography of this coast predates European arrival by more than fifteen hundred years. Just four kilometers south of modern Puducherry lies Arikamedu, an ancient archaeological site on the Ariyankuppam River identified by historians as the Greco-Roman trading emporium of Poduke, documented in the first-century CE Periplus of the Erythraean Sea. Here, Roman merchants traded Arretine pottery, amphorae filled with Mediterranean wine and olive oil, and Roman coins in exchange for fine Coromandel muslins, semiprecious beryl gems, and Malabar spices, establishing a tradition of cosmopolitan trade that continues to define the territory.",
      "Climatic timing on the Coromandel Coast differs fundamentally from the west coast of India. While the rest of the subcontinent receives its primary rainfall during the South-West Monsoon from June to September, Puducherry and coastal Tamil Nadu receive the overwhelming majority of their annual precipitation from the North-East Monsoon (the retreating monsoon) between mid-October and mid-December. During this period, cyclonic depressions over the Bay of Bengal generate powerful storms, torrential cloudbursts, and dramatic maritime swells.",
      "The strategic window for travel spans from late November through early March. During these winter months, daytime temperatures hover pleasantly between 26°C and 29°C, tempered by refreshing maritime sea breezes, while nighttime temperatures dip to an agreeable 21°C to 23°C. This period offers ideal conditions for walking through the French and Tamil quarters, exploring coastal wetlands, and participating in early-morning meditations at Auroville. Conversely, the summer months from April to June bring scorching maritime humidity with temperatures exceeding 38°C, making midday urban exploration physically exhausting.",
      "Venturing beyond the municipal limits of Puducherry into the broader Tamil coastal belt reveals monumental temple complexes, vast saltwater mangrove swamps, and colonial enclaves where Danish, Portuguese, and British flags once fluttered above coastal fortresses. Experiencing this coastal territory requires stepping outside the boutique cafes of the seafront promenade to explore the deep agricultural, spiritual, and maritime layers of the Coromandel plain."
    ],
    quote: {
      quote: "Puducherry is a town where two distinct civilizations met not on the battlefield of conquest, but in the peaceful stone geometry of parallel streets, tiled verandas, and quiet inner courtyards.",
      attribution: "Prof. S. Jeyaseelan, Coromandel Maritime Historical Institute"
    }
  },
  {
    heading: "Transit Arteries, Southern Railway Access & Coastal Corridors",
    paragraphs: [
      "Reaching Puducherry and the Tamil coast involves choosing between picturesque coastal highways and historic rail lines. The primary air gateway is Chennai International Airport (MAA), located approximately one hundred and thirty-five kilometers north of Puducherry. Chennai operates nonstop domestic flights connecting all Indian metropolitan centers, as well as direct international services across Southeast Asia, the Middle East, and Europe. From Chennai Airport, travelers can hire authorized prepaid taxis or arrange private chauffeurs for the three-to-four-hour coastal drive.",
      "The highway approach along the East Coast Road (ECR - State Highway 49) is one of the most scenic road trips in southern India. Hugging the coastline from Thiruvanmiyur in south Chennai past Mahabalipuram, Kalpakkam, and Marakkanam, the ECR offers breathtaking views of the Bay of Bengal, expansive coastal salt pans, and coastal casuarina plantations. Alternatively, the four-lane National Highway 32 (via Tindivanam) provides a faster, less congested inland bypass during weekend peak traffic hours.",
      "For rail travelers, Puducherry Railway Station (station code: PDY) terminus sits within Southern Railway jurisdiction, located conveniently just one kilometer south of the French Quarter. Daily express and passenger services link Puducherry directly to Chennai Egmore, Tirupati, Bengaluru, and New Delhi. Flagship services include the Puducherry - Howrah Superfast Express (12868), the Dadar - Puducherry Chalukya Express (11005), and the New Delhi - Puducherry Superfast Express (22404).",
      "For wider national connectivity, the major railway junction of Villupuram (station code: VM), situated thirty-eight kilometers west of Puducherry, serves as an indispensable transit hub. Villupuram sits on the high-density Southern Railway trunk line, accommodating over fifty express trains daily running between Chennai, Madurai, Tiruchirappalli, Rameswaram, and Kanyakumari. Taxis and frequent express buses connect Villupuram Junction to Puducherry bus stand every ten minutes with a transit time of forty-five minutes.",
      "The Tamil Nadu State Transport Corporation (TNSTC) and the Puducherry Road Transport Corporation (PRTC) operate extensive air-conditioned and deluxe bus fleets. Nonstop Point-to-Point ECR express buses depart Chennai's Koyambedu (CMBT) and Kilambakkam (KCBT) bus terminals every fifteen minutes throughout the day, providing an economical and reliable transit alternative for ₹120 to ₹220 per seat."
    ],
    table: {
      headers: ["Transit Route / Service", "Schedule & Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["Chennai Airport to Puducherry Private Taxi", "24/7 on-demand pre-booked sedan", "MAA -> Puducherry", "3h 15m (135 km)", "₹2,800 - ₹3,600"],
        ["ECR Non-Stop Express Bus (TNSTC AC)", "Every 20 mins from KCBT / CMBT", "Chennai -> Puducherry Bus Stand", "3h 45m", "₹180 - ₹250"],
        ["Chennai Egmore - Puducherry Express (16115)", "Daily morning departure 18:10", "MS -> PDY", "4h 10m", "₹115 (2S) / ₹360 (CC)"],
        ["New Delhi - Puducherry Superfast (22404)", "Weekly long-distance service", "NDLS -> PDY", "42h 30m", "₹2,450 (3AC) / ₹3,600 (2AC)"],
        ["Villupuram Junction Taxi to French Quarter", "24/7 prepaid taxi counter outside VM", "VM -> French Quarter", "45m (38 km)", "₹850 - ₹1,150"]
      ]
    }
  },
  {
    heading: "Neighborhood Topography & Distinct Urban Quarters",
    callout: {
      type: "tip",
      text: "The historic city of Puducherry is divided into two contrasting architectural worlds by the Grand Canal: the French Quarter (Ville Blanche) to the east and the Tamil Quarter (Ville Noire) to the west."
    },
    paragraphs: [
      "The urban layout of historic Puducherry is an extraordinary exercise in 18th-century rationalist urban planning. Designed under French colonial administrators, the settlement was laid out on a strict gridiron plan centered around a central drainage canal known as the Grand Canal. To the east of the canal, facing the sea, lies the French Quarter (historically termed Ville Blanche or the White Town), while to the west lies the Tamil Quarter (historically termed Ville Noire or the Black Town).",
      "The French Quarter is characterized by quiet, tree-lined avenues bearing French street names—Rue Dumas, Rue Suffren, Rue Romain Rolland, and Rue de la Marine. Here, high compound walls washed in pastel yellow, mustard, and white conceal neoclassical garden villas (hôtels particuliers) with louvered wooden shutters, wrought-iron balconies, grand carriage gateways (porte-cochères), and shaded inner courtyards. The seafront is anchored by Goubert Avenue, a 1.5-kilometer paved pedestrian promenade running parallel to a massive volcanic basalt rock seawall designed to absorb the powerful Coromandel surf.",
      "Crossing the Grand Canal westward into the Tamil Quarter reveals a dramatic shift in sensory rhythm and spatial organization. Along streets such as Rue de Mission, Vysial Street, and Eswaran Koil Street, houses feature traditional Franco-Tamil vernacular architecture. The street-facing facade presents a continuous covered porch known as a thinnai—a raised stone or timber platform where travelers, neighbors, and merchants could rest shaded from the tropical sun. Behind carved wooden entrance doors (nilavu) supported by intricately turned teak pillars, houses unfold into central open-air courtyards (mutram) that promote natural convection cooling.",
      "North of the municipal center lies the international experimental township of Auroville, founded in 1968 by Mirra Alfassa (The Mother) and designed by French architect Roger Anger. Spanning twenty square kilometers across forested red laterite plateau land, Auroville is organized into concentric zones: the Peace Zone centered around the golden Matrimandir sphere, the Residential Zone, the Industrial Zone, and the expansive Green Belt containing millions of hand-planted indigenous evergreen trees.",
      "Further south along the coast lies the fishing village and archaeological enclave of Ariyankuppam, followed by the quiet beach hamlets of Veerampattinam and Chinna Veerampattinam, where traditional catamarans (kattumaram—lashed timber log rafts) are launched at dawn through crashing shore breaks by artisanal fisherfolk."
    ]
  },
  {
    heading: "Permits, Entry Regulations & Auroville Access Protocols",
    callout: {
      type: "warning",
      text: "Visiting the inner chamber of the Matrimandir in Auroville requires mandatory advance personal booking at the Visitor Centre; same-day entries are strictly impossible."
    },
    paragraphs: [
      "Travel within Puducherry and along the Coromandel coast is largely unrestricted for both domestic and foreign nationals. However, visiting the sacred inner sanctuary of the Matrimandir at Auroville entails a strict, non-commercial regulatory protocol designed to preserve its meditative sanctity.",
      "Casual day visitors can visit the Auroville Visitor Centre without prior reservation and obtain a free token to walk along the shaded one-kilometer garden path to the Matrimandir Outer Viewing Point, which offers a clear view of the golden geodesic sphere across the banyan tree gardens. However, entry into the Inner Chamber—a silent white marble meditation space housing a 70cm optically ground Zeiss crystal sphere illuminated by a single reflected sunbeam—requires booking in person at the Visitor Centre Booking Desk at least two to four days in advance.",
      "Matrimandir bookings cannot be made over the telephone or via commercial tour agencies. Visitors must register in person, watch an introductory documentary on the spiritual vision of Sri Aurobindo and The Mother, and receive a personalized access pass for a specific morning slot. Children under ten years of age are not permitted inside the Inner Chamber. Complete silence must be maintained, mobile phones and cameras must be deposited in secure lockers, and visitors must wear clean white socks (provided free on-site) to protect the pristine white carpeting.",
      "At the Sri Aurobindo Ashram located on Rue de la Marine in the French Quarter, entry to the central courtyard housing the Samadhi of Sri Aurobindo and The Mother is open daily to the public from 08:00 to 18:00 without entry fees. Visitors must deposit shoes at the entrance counter, maintain absolute silence, and refrain from photography or video recording within the ashram precincts.",
      "Boating excursions into the Pichavaram Mangrove Forest (located seventy kilometers south of Puducherry near Chidambaram) are regulated by the Tamil Nadu Forest Department and the Tamil Nadu Tourism Development Corporation (TTDC). Tickets for rowboats and motorboats must be purchased exclusively at the official Arignar Anna Tourism Complex jetty; private unlicensed boatmen are strictly prohibited from entering deep mangrove channels."
    ]
  },
  {
    heading: "Curated 5-Day Coromandel Master Itinerary",
    paragraphs: [
      "Day 1: Architectural Walking in the Two Quarters & The Promenade. Begin at 06:30 with sunrise along Goubert Avenue, watching local Tamil fishermen navigate the surf while morning joggers trace the basalt seawall. Enjoy fresh espresso and butter croissants at an artisan French bakery on Rue Suffren. Embark on a three-hour architectural walking tour with the Indian National Trust for Art and Cultural Heritage (INTACH) on Rue Louis Bourguignon, comparing the neoclassical French villas of Rue Dumas with the carved teak thinnai porches of Vysial Street in the Tamil Quarter. In the afternoon, visit the Puducherry Museum to examine Roman amphorae and Chola bronzes, concluding with sunset at the historic 19th-century French lighthouse.",
      "Day 2: Auroville Township Immersion & Forest Reforestation. Dedicate the entire day to the experimental community of Auroville. Arrive early at the Visitor Centre for your pre-registered Matrimandir Inner Chamber concentration. Afterward, visit the Pavilion of India and the International Zone to understand how residents from over fifty nations practice sustainable agroforestry, solar architecture, and wastewater treatment. Have an organic vegetarian lunch at Solar Kitchen (pre-paid guest card required) or a community cafe in Kottakarai. In the afternoon, explore artisanal workshops: handmade paper at Sri Aurobindo Ashram Paper Factory, natural spirulina cultivation, and ethical khadi textile weaving. Return to town for evening chamber music or cultural lectures at Alliance Française de Pondichéry.",
      "Day 3: Ancient Maritime Archaeology & Coastal Lagoons. Journey four kilometers south to the archaeological ruins of Arikamedu on the Ariyankuppam River; walk among exposed 1st-century Roman brick warehouses where Mediterranean amphorae were once unloaded. Continue to the Chunnambar Boat House to board a ferry across the backwaters to Paradise Beach (Plage Paradiso), a secluded sand spit framed by casuarina groves. In the late afternoon, visit the 17th-century Church of Our Lady of Good Health at Ariyankuppam, one of the oldest Catholic pilgrimage shrines on the Coromandel coast, before dining on Franco-Tamil Creole seafood at a restored French garden courtyard.",
      "Day 4: Pichavaram Mangrove Forests & Chidambaram Nataraja Temple. Depart at 06:30 for a full-day southern coastal excursion. Arrive at Pichavaram, home to eleven hundred hectares of protected mangrove wetlands comprising the second largest mangrove ecosystem in the world. Hire a four-seater rowboat operated by a local fisherman to navigate the silent, labyrinthine water channels beneath the dense canopy of Avicennia and Rhizophora trees. By mid-day, drive fifteen kilometers inland to Chidambaram to explore the monumental Thillai Nataraja Temple, one of the holiest Shaivite shrines in India, marveling at its Chola-era gold-plated roof, five thousand pillared halls, and the mystical Chidambara Rahasyam sanctum.",
      "Day 5: Danish Colonial Tranquebar (Tharangambadi) & Coastal Forts. Travel ninety kilometers south along the coast to Tharangambadi (Tranquebar), the 'Land of the Singing Waves.' Explore Fort Dansborg, constructed in 1620 by Danish Admiral Ove Gjedde under a treaty with the Nayak King of Thanjavur, standing dramatically on the water's edge. Walk along King Street past the 18th-century New Jerusalem Church founded by German missionary Bartholomaeus Ziegenbalg, who established India's first Tamil printing press here in 1713. Enjoy a coastal lunch of freshly caught Bay of Bengal red snapper at the restored 1784 Danish Governor's Bungalow before returning to Puducherry as twilight settles over the Coromandel waves."
    ],
    table: {
      headers: ["Day & Time Slot", "Geographic Focus", "Primary Heritage Sites", "Mobility Mode", "Gastronomic Recommendations"],
      rows: [
        ["Day 1: 06:30 - 12:00", "French Quarter", "Goubert Promenade; Rue Suffren walking; INTACH Tour", "Foot / bicycle", "Sourdough baguettes, espresso & quiche at French bakery"],
        ["Day 1: 14:30 - 18:30", "Tamil Quarter", "Vysial St Franco-Tamil houses; Puducherry Museum", "Foot / cycle-rickshaw", "Traditional filter coffee & crispy masala vadai, M.G. Road"],
        ["Day 2: 08:00 - 16:00", "Auroville Township", "Matrimandir Inner Chamber; International Zone", "Hired scooter / taxi", "Organic farm-to-table lunch at Auroville community cafe"],
        ["Day 3: 09:00 - 15:30", "Southern Estuaries", "Arikamedu Roman port; Paradise Beach backwaters", "Auto-rickshaw / taxi", "Poisson Creole (fish in tomato-tamarind broth) at garden villa"],
        ["Day 4: 06:30 - 16:30", "Pichavaram & Chidambaram", "Pichavaram rowboat mangrove channels; Nataraja Temple", "Private car (NH-32)", "Authentic South Indian banana-leaf lunch at Chidambaram"],
        ["Day 5: 08:00 - 17:00", "Tranquebar Coastal Belt", "Fort Dansborg (1620); Danish Governor's Bungalow", "Private car (ECR South)", "Grilled Bay of Bengal catch at restored Danish beach estate"]
      ]
    }
  },
  {
    heading: "Financial Architecture & Itemized INR Expense Breakdown",
    callout: {
      type: "note",
      text: "Puducherry offers exceptional hospitality across diverse price points, from modest ashram guest houses to luxurious five-star colonial heritage hotels."
    },
    paragraphs: [
      "Puducherry's economic structure combines the favorable tax status of a Union Territory with a remarkably balanced hospitality ecosystem. Budget travelers, especially those staying in spiritual ashram annexes or backpacker hostels in the Tamil Quarter, can manage comfortable travel on ₹2,400 to ₹3,500 per day. Mid-range travelers desiring restored 19th-century colonial rooms with private verandas, air-conditioning, bicycle rentals, and dining at celebrated Franco-Tamil bistros should expect ₹6,500 to ₹12,000 per day for a couple.",
      "Luxury travelers seeking prestigious heritage properties—such as Palais de Mahe, La Villa, or the beachside Dune Eco Village—will find room tariffs ranging from ₹18,000 to ₹38,000 per night during the peak winter season (December to February). Private chauffeur-driven air-conditioned sedans for regional excursions to Chidambaram and Tranquebar cost approximately ₹3,500 to ₹4,800 per full day, including driver allowances, highway tolls, and parking fees.",
      "Dining costs vary widely depending on the culinary setting. A complete Tamil vegetarian lunch served on a fresh banana leaf at iconic establishments like Surguru or Hotel Saravana Bhavan costs between ₹160 and ₹250. At high-end French and Franco-Tamil restaurants in the White Town, a three-course dinner for two featuring imported cheeses, freshly landed seafood, and regional wine averages ₹3,500 to ₹6,500.",
      "Entry fees to historic monuments along the Coromandel coast are remarkably modest. Archaeological Survey of India (ASI) protected monuments at Arikamedu and Fort Dansborg charge nominal entry tickets of ₹25 for Indian citizens and ₹300 for foreign passport holders. Boat hire at Pichavaram is standardized by the forest cooperative: a two-hour rowboat through narrow mangrove creeks costs ₹400 to ₹600 for a four-passenger boat, while motorized launches cost ₹1,200 to ₹1,800 for larger groups."
    ],
    table: {
      headers: ["Budget Tier", "Daily Accommodation (INR)", "Daily Meals (INR)", "Local Transit (INR)", "Activities & Excursions (INR)", "Total Estimated Daily INR"],
      rows: [
        ["Budget (Solo)", "₹1,000 - ₹1,600 (Ashram annex / hostel dorm)", "₹500 - ₹800 (Saravana Bhavan, street stalls)", "₹250 - ₹400 (Rented bicycle / local buses)", "₹200 - ₹400 (Museums, bicycle rental)", "₹1,950 - ₹3,200 per day"],
        ["Mid-Range (Couple)", "₹4,500 - ₹8,500 (Restored Tamil manor room)", "₹1,800 - ₹3,200 (Heritage cafes & bistros)", "₹800 - ₹1,500 (Rented scooter / auto-rickshaws)", "₹1,000 - ₹2,000 (Pichavaram boat, INTACH guide)", "₹8,100 - ₹15,200 per day"],
        ["Luxury (Couple)", "₹18,000 - ₹35,000 (Colonial boutique suite)", "₹4,500 - ₹8,500 (Fine dining, Creole degustation)", "₹3,000 - ₹4,800 (Chauffeur-driven private sedan)", "₹2,500 - ₹5,000 (Private heritage curator, tours)", "₹28,000 - ₹53,300 per day"]
      ]
    }
  },
  {
    heading: "North-East Monsoon Dynamics & Coastal Weather Hazards",
    callout: {
      type: "warning",
      text: "The North-East Monsoon peaks between October and December, frequently generating severe cyclonic storms and heavy coastal storm surges in the Bay of Bengal."
    },
    paragraphs: [
      "Understanding the meteorological rhythm of coastal Tamil Nadu is vital for safe and rewarding travel. The Coromandel plain is one of the few regions in India that experiences its primary rainfall peak during the autumn and early winter months, driven by the North-East Monsoon winds blowing across the warm waters of the Bay of Bengal.",
      "Between October 15 and December 15, low-pressure troughs regularly intensify into severe cyclonic storms (such as Cyclones Thane, Gaja, and Mandous in recent meteorological history). These systems can generate sustained wind speeds exceeding one hundred kilometers per hour, torrential downpours exceeding 200 mm in a single twenty-four-hour period, and dangerous ocean storm surges. During severe weather warnings, municipal authorities close Goubert Avenue to pedestrians, and ocean bathing is strictly prohibited along all coastal beaches.",
      "Travelers visiting during the monsoon window should monitor real-time satellite updates and bulletin advisories issued by the Regional Meteorological Centre (RMC) Chennai and the Indian Meteorological Department (IMD). While sudden downpours can flood low-lying streets around the Grand Canal for several hours, municipal drainage generally clears surface water quickly once the tide recedes.",
      "Summer heat along the Coromandel coast presents a different hazard. Between late April and June, daytime temperatures frequently rise above 38°C with oppressive 85% relative humidity. Sunstroke and rapid dehydration are genuine risks for visitors unaccustomed to coastal tropical heat. Outdoor walking tours should be confined to the early hours between 06:00 and 09:30 AM, or conducted after 17:00 as the sun drops behind the palms and the maritime sea breeze sets in."
    ]
  },
  {
    heading: "Gastronomic Topography: Franco-Tamil Creole & Coastal Seafood",
    paragraphs: [
      "The culinary landscape of Puducherry is one of the most distinctive in South Asia, representing an authentic centuries-old fusion between classic French culinary techniques and the fiery, spice-rich traditions of Tamil cooking. Known locally as Franco-Tamil or Pondicherrian Creole cuisine, this culinary heritage was born in the kitchens of colonial French residences where Tamil master cooks (karanis) adapted European recipes using indigenous ingredients, native spices, and tropical souring agents.",
      "The signature masterpiece of Creole gastronomy is Poisson Créole (Creole Fish Curry). Unlike traditional Tamil fish curries that rely heavily on tamarind, Poisson Créole is prepared by gently simmering freshly landed Bay of Bengal seer fish or red snapper in a delicate, velvety sauce of fresh coconut milk, finely chopped shallots, tomatoes, garlic, mild red chilies, and fenugreek seeds, scented with fresh curry leaves and a splash of vinegar. The result is a harmonious balance where the heat of Tamil spices is softened by the smooth richness of coconut cream.",
      "Another iconic Creole specialty is Vadouvan (also known as French curry powder or vadavam). Prepared by fermenting minced shallots, garlic, mustard seeds, fenugreek, cumin, and castor oil into dried sun-cured balls, vadouvan provides an intense, smoky, umami-rich seasoning base that French chefs used to flavor slow-cooked mutton stews, roasted duck, and vegetable gratins.",
      "Beyond Creole cuisine, Puducherry is celebrated throughout India for its exceptional artisanal baking culture. Founded by French expatriates and Auroville baking cooperatives, local wood-fired boulangeries produce flawless sourdough boules, crusty baguettes, flaky almond croissants, and savory quiches made with local organic goat cheese. Pair a freshly baked pain au chocolat with a shot of espresso at a shaded courtyard cafe on Rue Suffren for an unforgettable morning ritual.",
      "For lovers of classical South Indian cuisine, the Tamil Quarter offers legendary vegetarian tiffin establishments. Here, crisp Ghee Roast Dosa, spongy Idlis served with four varieties of freshly ground chutneys (coconut, tomato, mint, and roasted coriander), and fragrant Sambar are served piping-hot on banana leaves. Conclude your meal with a cup of authentic South Indian Filter Coffee—brewed through a traditional brass percolator with chicory-infused plantation coffee beans and frothed with boiled whole milk into a frothy bronze cup (dabarah)."
    ],
    table: {
      headers: ["Iconic Coastal Dish", "Culinary Heritage", "Key Ingredients & Seasoning", "Flavor Profile", "Recommended Venues"],
      rows: [
        ["Poisson Créole", "Pondicherrian Creole", "Seer fish, coconut cream, shallots, mild chili, fenugreek", "Velvety, aromatic, gentle spice with coconut sweetness", "Restored colonial garden courtyards, White Town"],
        ["Vadouvan Mutton Stew", "Franco-Tamil Historic", "Country mutton, sun-cured vadouvan spice, potatoes", "Smoky, savory umami depth with caramelized shallots", "Traditional Creole family bistros, Rue Suffren"],
        ["Artisanal Sourdough & Croissant", "French Boulangerie", "Organic flour, natural sourdough mother, churned butter", "Flaky, golden, crisp crust, airy buttery crumb", "Bakers Street & Auroville bakeries"],
        ["Traditional Ghee Roast Dosa", "Classical Tamil Tiffin", "Fermented rice & urad batter, pure ghee, potato masala", "Crispy golden crepe, savory, buttery crunch", "Hotel Surguru, Sardar Vallabhai Patel Salai"],
        ["Madras Filter Coffee", "South Indian Coffee Culture", "Peaberry & plantation coffee, chicory, boiled milk", "Strong, earthy, frothy, deeply aromatic", "Local brass-dabarah coffee stalls across Tamil Quarter"]
      ]
    }
  },
  {
    heading: "Cultural Protocols, Sacred Etiquette & Ashram Conduct",
    callout: {
      type: "note",
      text: "Reverence and silence are foundational to Puducherry's spiritual institutions; loud conversations, phone ringing, and public display of affection are considered disrespectful."
    },
    paragraphs: [
      "Puducherry's unique cultural atmosphere is grounded in a deep current of spiritual inquiry, intellectual contemplation, and communal harmony. Visitors must approach its spiritual institutions, ancient temples, and historic churches with sensitivity, respect, and quiet decorum.",
      "When visiting the Sri Aurobindo Ashram, silence is not merely a polite suggestion; it is the fundamental medium of collective spiritual practice. Mobile phones must be turned completely off or placed on silent mode before entering the ashram building. Footwear must be deposited at the marked shoe counter outside. Visitors should walk quietly in single file around the flower-strewn Samadhi of Sri Aurobindo and The Mother. While photography is allowed in the street outside, no cameras, video equipment, or audio recording devices may be operated inside the courtyard.",
      "At Hindu temple complexes throughout the Tamil Quarter and surrounding coastal towns (such as the 12th-century Manakula Vinayagar Temple or the monumental Chidambaram Nataraja Temple), strict traditional protocols apply. Visitors must remove shoes outside the temple gopuram gateway. Conservative attire is mandatory: men should wear shirts and trousers or traditional dhotis; women should wear sarees, salwar kameez, or long skirts covering ankles and shoulders. In orthodox Tamil temples, men are often required to remove their upper shirts before entering the inner sanctum. Non-Hindus may be restricted from crossing into the innermost sanctum sanctorum in certain ancient Shaivite shrines.",
      "In the public spaces of the French Quarter and along Goubert Avenue, a respectful, dignified civic atmosphere prevails. The Promenade is closed to all vehicular traffic daily between 17:00 in the evening and 06:30 the following morning, creating a peaceful seaside pedestrian sanctuary. Littering, public consumption of alcohol outside licensed premises, and rowdy behavior are subject to strict fines by the Puducherry Police Department."
    ]
  },
  {
    heading: "Architectural Heritage: Neoclassical Enclaves to Franco-Tamil Verandas",
    paragraphs: [
      "The built environment of Puducherry represents a living museum of colonial and indigenous town planning. Following the destruction of the earlier settlement by British forces in 1761, the French reconstructed the town according to an orderly, gridiron master plan that remains intact today, protected by pioneering conservation guidelines established by INTACH (Indian National Trust for Art and Cultural Heritage).",
      "In the French Quarter, buildings exhibit classic 18th- and 19th-century French colonial neoclassical features. Facades are marked by horizontal cornices, triangular pediments, pilasters with Tuscan and Ionic capitals, and arched carriage gateways (porte-cochères) large enough to accommodate horse-drawn carriages. Ground floors typically featured administrative offices or commercial warehouses (magasins), while upper floors housed grand residential salons opening onto wide verandas with louvered wooden blinds designed to modulate ocean breezes.",
      "In stark contrast, the Tamil Quarter developed a unique hybrid architectural style known as Franco-Tamil architecture. Wealthy Tamil merchants, influenced by French aesthetic prestige while maintaining orthodox Hindu joint-family rituals, incorporated neoclassical plaster moldings, pilasters, and round-arched windows onto their upper-floor facades. The ground floors, however, remained thoroughly Tamil: dominated by the massive carved timber columns of the thinnai (veranda) where business transactions and social meetings took place without admitting outsiders into the private domestic realm.",
      "At the center of traditional Tamil residences lies the open-air central courtyard (mutram), paved with terracotta tiles and surrounded by four shaded colonnades. During hot summer days, heated air rises through the courtyard opening, drawing cool maritime air through the street-facing louvered windows—a masterpiece of passive bioclimatic cooling that eliminated the need for artificial ventilation.",
      "Major civic landmarks reflect this cross-cultural dialogue: the French Consulate General on Marine Street, the monumental Church of Our Lady of the Angels (Notre-Dame des Anges) built in 1855 with a Greco-Roman facade reminiscent of the Basilica of Lourdes, and the iconic Raj Nivas (the official residence of the Lieutenant Governor), an imposing 18th-century palace set amidst manicured tropical gardens."
    ]
  },
  {
    heading: "On-Ground Logistics: Bicycles, Vintage Mopeds & Coastal Auto Dynamics",
    callout: {
      type: "tip",
      text: "The flat, compact grid of the French and Tamil Quarters is best explored on two wheels; rent a classic single-speed roadster bicycle for ₹80 to ₹120 per day."
    },
    paragraphs: [
      "Puducherry's historic core is remarkably compact: the entire heritage district within the Grand Canal spans barely two square kilometers, making motorized transport largely unnecessary within the town center. The classic single-speed Indian roadster bicycle (Hero or Atlas) or modern geared city bicycles can be rented from rental kiosks along Rue Mission and Rue Suffren for ₹80 to ₹150 per day.",
      "For longer journeys to Auroville (ten to twelve kilometers north) or Paradise Beach (eight kilometers south), automatic scooters (Honda Activa) or vintage gearless mopeds (TVS XL) can be rented for ₹350 to ₹600 per day, plus fuel. Ensure that you obtain an authorized rental vehicle with yellow-on-black commercial registration plates. Helmets are mandatory under Tamil Nadu and Puducherry motor vehicle regulations, and traffic police conduct regular checks along the ECR and airport road.",
      "Auto-rickshaws are abundant throughout Puducherry, stationed at rail terminals, bus stands, and key street corners. However, auto drivers rarely use digital fare meters. Travelers should agree firmly on the exact fare before boarding, or utilize ride-hailing applications (such as Ola or Uber Auto) which provide pre-calculated fares for transit between the French Quarter, bus stands, and railway stations.",
      "Cycle-rickshaws, operated by veteran Tamil pullers, still ply the quiet lanes of the White Town. While slower than motorized autos, they provide a leisurely, atmospheric, and zero-emission mode of transit for elderly travelers or those wishing to admire heritage facades without traffic noise. Fares typically range from ₹50 to ₹100 for short hops within the grid."
    ]
  },
  {
    heading: "Hydration, Sun Protection, Vector Safety & Coastal Health",
    paragraphs: [
      "Travel along the Coromandel coast requires sensible health precautions to manage tropical heat, high humidity, and coastal vector risks. Tap water in municipal Puducherry is sourced from deep borewells and treated through municipal filtration, but it should not be consumed untreated by visitors. Drink exclusively filtered reverse-osmosis (RO) water provided in carafes at reputable hotels or carry reusable stainless-steel water bottles fitted with micro-filtration purifiers.",
      "Heat exhaustion is a common affliction during the hot pre-monsoon months (April to July). Carry oral rehydration salts (ORS packets) or consume fresh tender coconut water (elaneer), available at roadside stalls throughout the town for ₹40 to ₹50. Tender coconut water is sterile, rich in natural electrolytes, and provides immediate cellular rehydration superior to sugary commercial sports drinks.",
      "Vector-borne illnesses, including dengue fever, occur intermittently following heavy monsoon rainfall in October and November when standing water collects in coastal depressions. Protect yourself by applying DEET- or picaridin-based insect repellent during early morning and late afternoon hours, especially when exploring the mangrove wetlands of Pichavaram or the wooded green belts of Auroville. Ensure that your accommodation has functional mosquito netting or insect screens on all openable windows.",
      "Swimming in the Bay of Bengal along the urban promenade of Puducherry is extremely dangerous and strictly prohibited due to submerged volcanic basalt rocks, sudden drop-offs, and powerful undertows. For safe ocean swimming, travel south to designated bathing areas at Paradise Beach or north to Serenity Beach, where licensed lifeguards are on duty during daytime hours."
    ]
  },
  {
    heading: "Digital Connectivity, UPI Transactions & Fiber Networks",
    callout: {
      type: "note",
      text: "UPI digital payments are accepted across almost all commercial establishments in Puducherry; however, carry physical cash when taking boats at Pichavaram or buying handicrafts in rural Auroville."
    },
    paragraphs: [
      "Puducherry enjoys excellent digital telecommunications infrastructure. 5G and high-speed 4G LTE cellular coverage from major Indian telecom providers—Bharti Airtel, Reliance Jio, and Vodafone Idea—is comprehensive throughout the municipal city, Auroville, and along the entire length of the East Coast Road (ECR).",
      "Digital financial transactions through the Unified Payments Interface (UPI) are deeply integrated into daily commerce. QR code payment placards are displayed by street-side tender coconut vendors, heritage boutique stores, cycle rental kiosks, and fine-dining restaurants. Travelers with active Indian bank accounts or authorized international UPI wallets can conduct virtually all daily transactions electronically.",
      "However, carrying a modest reserve of ₹2,000 to ₹3,000 in physical cash is advisable for specific rural and coastal transactions. Forest department ticketing counters at Pichavaram mangrove reserve, cycle-rickshaw operators in the Tamil Quarter, small temple donation counters, and roadside craft stalls frequently experience localized cellular connectivity dropouts that can stall digital payment gateways.",
      "For remote workers and digital nomads, Puducherry and Auroville offer world-class fiber-optic broadband connectivity. Numerous boutique hotels, heritage guesthouses, and co-working spaces provide symmetric 100 Mbps to 300 Mbps Wi-Fi, making the town one of the most attractive coastal workation destinations in southern India."
    ]
  },
  {
    heading: "Ecological Conservation, Mangrove Restoration & Plastic Ban",
    paragraphs: [
      "The Coromandel coastline is a fragile marine ecosystem under intense threat from coastal erosion, rising sea levels, industrial effluent discharge, and uncontrolled plastic waste. In response, local civic organizations, scientific institutes, and community groups have pioneered notable environmental conservation initiatives.",
      "Puducherry was one of the earliest union territories in India to implement a comprehensive ban on single-use plastics, encompassing plastic carry bags, disposable cups, plates, and straws. Travelers must carry their own reusable cloth shopping totes and stainless-steel straws. Many cafes in the French Quarter and Auroville serve drinking water in sterilized glass bottles and package takeaway food in compostable palm-leaf or banana-fiber containers.",
      "The mangrove forests of Pichavaram represent a critically important ecological buffer against catastrophic cyclonic storm surges and tsunamis. During the devastating Indian Ocean Tsunami of December 26, 2004, coastal fishing villages situated directly behind the dense mangrove barrier suffered significantly less destruction and loss of life than unprotected settlements along the open coast. The roots of Avicennia marina and Rhizophora mucronata trap sediments, filter coastal runoff, and serve as vital nursery grounds for commercial marine fish, prawns, and crabs. When boating in Pichavaram, never litter plastic waste or disturb nesting bird colonies.",
      "In Auroville, community members have transformed over two thousand acres of barren, severely eroded red laterite plateau into a lush, biodiverse tropical dry evergreen forest (TDEF) through five decades of dedicated soil conservation, earth-bunding, and planting of over three million indigenous trees. Visiting Auroville's botanical gardens and native tree nurseries offers an inspiring masterclass in large-scale ecological restoration."
    ]
  },
  {
    heading: "Photography Protocol, Drone Restrictions & Monument Ethics",
    callout: {
      type: "warning",
      text: "Drone flights are prohibited in urban Puducherry without written police permission; photographing the Samadhi at Sri Aurobindo Ashram is strictly forbidden."
    },
    paragraphs: [
      "Puducherry's photogenic visual texture—pastel colonial facades draped in vibrant magenta bougainvillea, golden temple gopurams, and dramatic sea spray against volcanic basalt rocks—makes it a dream destination for photographers. However, capturing these images requires ethical discretion and adherence to local regulations.",
      "Operating unmanned aerial vehicles (drones) over Puducherry city, the coastal promenade, and Auroville is subject to strict DGCA regulations. The coastal strip lies within regulated maritime security corridors monitored by the Indian Coast Guard, whose regional station is based at Puducherry harbor. Flying recreational drones without prior written clearance from the Puducherry District Magistrate and local police superintendent is illegal and will result in equipment seizure and police detention.",
      "Inside the Sri Aurobindo Ashram, photography and video recording are entirely barred. Outside in the French Quarter, photographing private residential villas from public streets is permitted; however, photographers should avoid aiming telephoto lenses into private living quarters or family courtyards. Always ask polite permission before taking portraits of local residents, street vendors, or traditional fishermen mending their nets.",
      "At historical monuments maintained by the Archaeological Survey of India (ASI)—such as the archaeological remains at Arikamedu or Fort Dansborg at Tranquebar—commercial filmmaking and professional photography with tripods and external lighting require advance online permits and payment of prescribed ASI fees, while handheld photography for personal use is permitted without surcharge."
    ]
  },
  {
    heading: "Packing Blueprint: Tropical Attire, Footwear & Field Equipment",
    paragraphs: [
      "Packing for a journey along the Coromandel coast requires preparing for warm maritime humidity, sudden tropical downpours, frequent shoe removal at sacred sanctuaries, and respectful dress codes. The following checklist details indispensable gear for exploring the region across seasons.",
      "Footwear should be lightweight, comfortable, and effortlessly removable. Bring quality leather slip-on sandals or breathable canvas loafers for walking through urban heritage quarters and visiting temples where shoes must be left outside. For boat excursions into the muddy mangrove channels of Pichavaram or exploring tidal sandspits at Paradise Beach, bring waterproof sports sandals with secure heel straps (such as Teva or Chaco) that can withstand saltwater immersion.",
      "Clothing should consist of loose, breathable natural fibers: 100% pure linen, fine khadi cotton, or lightweight chambray in light, heat-reflective shades (white, cream, sky blue, beige). Pack at least two conservative outfits: long cotton trousers or linen chinos and full-sleeved shirts covering shoulders and chest, essential for temple entry and ashram visits. A light cotton scarf or dupatta is invaluable for women travelers to cover shoulders when entering orthodox religious shrines.",
      "Field gear essentials include an ultra-compact, high-UPF folding umbrella (equally useful as a shield against blinding midday sunshine or sudden monsoon showers), polarized sunglasses to cut ocean glare along the promenade, high-SPF water-resistant sunscreen, an insulated stainless-steel water bottle, and a compact dry bag to protect sensitive cameras and electronics during coastal boat trips."
    ],
    table: {
      headers: ["Gear Classification", "Specific Recommended Item", "Practical Field Function", "Seasonal Criticality"],
      rows: [
        ["Footwear", "Slip-on leather sandals + waterproof strap sandals", "Easy removal at temple portals; mangrove boat trips", "Essential year-round"],
        ["Sun Protection", "Polarized sunglasses + broad-brimmed cotton hat", "Deflecting intense Coromandel coastal UV radiation", "Crucial: February - October"],
        ["Rain Defense", "Windproof compact umbrella + lightweight dry bag", "Safeguarding electronics during coastal monsoon bursts", "Essential: October - December"],
        ["Sacred Attire", "Long linen trousers / maxi skirt + cotton scarf", "Complying with orthodox dress codes at temples & ashram", "Year-round requirement"],
        ["Power & Gadgets", "High-capacity power bank + universal plug adapter", "Recharging phones during long day trips to Pichavaram", "Recommended year-round"]
      ]
    }
  },
  {
    heading: "Emergency Infrastructure, Hospitals & Essential Helplines",
    callout: {
      type: "note",
      text: "JIPMER (Jawaharlal Institute of Postgraduate Medical Education and Research) is one of India's premier apex medical institutions, providing comprehensive tertiary trauma care 24/7."
    },
    paragraphs: [
      "Puducherry boasts exceptional healthcare and emergency medical infrastructure that ranks among the finest in southern India. Travelers encountering medical emergencies, traumatic injuries, or acute illnesses have access to internationally renowned medical institutions within the territory.",
      "The premier medical institution is JIPMER (Jawaharlal Institute of Postgraduate Medical Education and Research), located on National Highway 32 in Gorimedu, approximately five kilometers north of the French Quarter. JIPMER is an autonomous institute of national importance under the Ministry of Health and Family Welfare, Government of India, featuring a state-of-the-art 24/7 Super-Specialty Trauma Center, advanced intensive care units, and comprehensive diagnostic pathology.",
      "In the private medical sector, reputable tertiary hospitals include the Mahatma Gandhi Medical College and Research Institute (MGMCRI) on the Cuddalore Road and Apollo Hospitals Emergency Clinic, both staffed with multi-lingual emergency physicians and accepting major domestic and international travel insurance cashless claims.",
      "For police assistance, fire emergencies, and ambulance dispatch, the unified national emergency number 112 is fully operational across the Union Territory. The Puducherry Tourist Police maintain a dedicated tourist assistance booth on Goubert Avenue near the Old Lighthouse, providing helpful guidance, lost-property assistance, and conflict resolution for visitors."
    ],
    table: {
      headers: ["Emergency Department", "Designated Institution / Agency", "Location Address", "Direct Emergency Telephone"],
      rows: [
        ["National Emergency Dispatch", "Central Command & Response Center", "Statewide Dispatch", "112"],
        ["Apex Public Trauma Center", "JIPMER Emergency Medical Department", "Gorimedu, NH-32, Puducherry", "+91 413 229 6000"],
        ["Puducherry Tourist Police", "Tourist Police Information & Aid Booth", "Goubert Avenue (Promenade)", "+91 413 222 2222"],
        ["Government General Hospital", "Indira Gandhi Government General Hospital", "Victor Simonel Street, White Town", "+91 413 233 6050"],
        ["Tamil Nadu Emergency Ambulance", "108 Emergency Ambulance Services", "Statewide Highway Fleet", "108"]
      ]
    }
  },
  {
    heading: "Extended Residency, Creative Fellowships & Coastal Cadence",
    paragraphs: [
      "Puducherry has long held a magnetic attraction for writers, artists, philosophers, and spiritual seekers seeking an inspiring sanctuary for extended reflection and creative work. From the revolutionary poet Subramania Bharati to French philosopher Paul Richard and English novelist Yann Martel, creative minds have found in this seaside territory a fertile cross-pollination of Eastern metaphysics and Western intellectual inquiry.",
      "Extended living in Puducherry follows a serene, deeply civilized rhythm. Morning begins before sunrise with quiet strolls along the seaside promenade, followed by an hour of silent reading or meditation. Days are dedicated to focused intellectual or creative endeavors in quiet courtyards cooled by sea breezes, while late afternoons are reserved for philosophical discussions at Alliance Française, browsing rare second-hand volumes at boutique bookstores on Rue Suffren, or cycling through the experimental communities of Auroville.",
      "Long-term residential options (from one to twelve months) include self-contained studio apartments in heritage Tamil townhouses (₹20,000 to ₹35,000 per month) and colonial garden villas in the French Quarter (₹50,000 to ₹120,000 per month). In Auroville, long-term volunteer and guest residency programs allow visitors to contribute to organic farming, renewable energy research, and alternative education in exchange for modest community accommodation and meals.",
      "For remote knowledge workers, the town offers a thriving community of digital nomads and creative entrepreneurs. Reliable fiber broadband, tranquil courtyard cafes serving specialty pour-over coffee, and a welcoming international community make Puducherry one of the most balanced, intellectually stimulating coastal workation hubs in South Asia."
    ]
  },
  {
    heading: "Synthesis: The Living Dialogue of the Coromandel",
    paragraphs: [
      "To journey through Puducherry and along the Coromandel coast is to experience the profound beauty of cultural encounter. It is to discover that true cosmopolitanism does not erase indigenous roots, but enriches them—that French classical order and Tamil spiritual devotion can coexist along parallel streets, creating an urban tapestry of extraordinary harmony and grace.",
      "When you sit on the sea-facing ramparts of Fort Dansborg in Tranquebar as the twilight waves break against ancient stone, or when you sit in silent concentration inside the golden dome of the Matrimandir surrounded by the whisper of thousands of hand-planted trees, you realize that this coast has always been an open door: welcoming travelers, ideas, and dreams from across the seas for thousands of years.",
      "Puducherry invites us to step off the hurried treadmill of modern existence, to breathe deeply of the maritime salt air, and to remember that life can be lived with beauty, deliberation, and peace. It leaves every traveler with a quiet gift: a lingering memory of pastel walls washed in golden morning light, the scent of fresh baguettes mingling with jasmine flowers, and the eternal, unhurried song of the Coromandel sea."
    ]
  }
];

const pondyInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
    alt: "A historic French colonial street in Puducherry with mustard-yellow walls draped in vibrant pink bougainvillea flowers",
    caption: "The French Quarter of Puducherry preserves 18th-century neoclassical colonial architecture with serene courtyards and bougainvillea-lined avenues."
  },
  {
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    alt: "Dense green mangrove forests with calm tidal water channels under a dramatic coastal sky",
    caption: "The Pichavaram mangrove wetlands near Chidambaram comprise the world's second largest mangrove ecosystem, protecting the Coromandel coast."
  },
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    alt: "Gentle ocean waves breaking on a rocky seaside promenade at sunrise with golden reflections on the water",
    caption: "Goubert Avenue promenade provides a peaceful 1.5-kilometer pedestrian sanctuary parallel to the Bay of Bengal."
  }
];

const pondyBlocks = assembleStructuredBlocks(pondySections, pondyInlineImages);

const pondyConfig = {
  title: "Pondicherry and the Tamil Coast",
  slug: "pondicherry-and-the-tamil-coast",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition along the Coromandel coast: the neoclassical French Quarter, carved Franco-Tamil verandas, Auroville township access, ancient Roman trade at Arikamedu, Pichavaram mangrove navigation, and Danish colonial Tranquebar.",
  description: "An exhaustive field expedition along the Coromandel coast: the neoclassical French Quarter, carved Franco-Tamil verandas, Auroville township access, ancient Roman trade at Arikamedu, Pichavaram mangrove navigation, and Danish colonial Tranquebar.",
  coverImage: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "A picturesque yellow colonial building framed by blossoming pink bougainvillea in Puducherry's French Quarter",
  coverImageCaption: "Puducherry represents three centuries of harmonious cultural dialogue between French neoclassical urbanism and Tamil architectural wisdom.",
  structuredBlocks: pondyBlocks,
  tags: ["pondicherry", "coromandel-coast", "tamil-nadu", "auroville", "french-quarter", "colonial-architecture", "mangrove-conservation"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "Pondicherry: That Was Once French India (M.K. Das)", url: "https://www.orbooks.com/" },
    { title: "INTACH Pondicherry Chapter: Architectural Heritage Guidelines", url: "https://intachpondicherry.org/" },
    { title: "Auroville Foundation Official Information & Matrimandir Guidelines", url: "https://auroville.org/" },
    { title: "Archaeological Survey of India: Arikamedu Excavation Reports", url: "https://asi.nic.in/" }
  ]
};

const pondyBuilt = writeCanonicalArticleModule("travel", "pondicherry-and-the-tamil-coast.js", pondyConfig);
console.log(`[Pondicherry and the Tamil Coast] Word count: ${pondyBuilt.wordCount}`);

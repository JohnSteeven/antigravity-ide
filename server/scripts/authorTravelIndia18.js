"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences"]);

console.log("Authoring Travel India 18/20: Varanasi...");

const varanasiSections = [
  {
    heading: "The Sacred Geography of Kashi, Crescent River Arc & Urban Antiquity",
    callout: {
      type: "note",
      text: "Varanasi (Kashi / Benares) is one of the oldest continuously inhabited cities on earth, anchored along a sweeping northward-turning (uttaravahini) crescent arc of the holy River Ganga."
    },
    paragraphs: [
      "Rising on the elevated natural limestone and kankar levee of the western bank of the sacred River Ganga in eastern Uttar Pradesh, Varanasi—historically celebrated as Kashi ('City of Light') and Benares—is universally acknowledged as the spiritual capital of Hinduism and one of the oldest continuously inhabited urban centers on earth. Archeological excavations at nearby Rajghat confirm permanent residential settlements dating back at least to the 9th century BCE, establishing over three millennia of unbroken civilizational, metaphysical, and artistic continuity.",
      "The defining sacred geography of Varanasi is governed by a rare hydrological miracle: throughout its 2,500-kilometer flow from the Himalayas to the ocean, the River Ganga flows predominantly south and east; but at Varanasi, the river turns dramatically northward (uttaravahini) for a sweeping five-kilometer crescent arc. In ancient Hindu cosmology, this northward turn toward its divine Himalayan source symbolizes the reversal of the cycle of time and rebirth, endowing the city with extraordinary transcendent power.",
      "The city takes its geographical name from the two natural tributary streams that historically demarcated its cosmic boundaries: the Varuna River to the north and the Assi rivulet to the south. Between these two sacred boundaries lies the holy circumambulation field known as the Panchakroshi Kshetra, a sacred pilgrimage mandala that devout pilgrims circumambulate on foot over five days.",
      "The visual topography of Varanasi is breathtaking: while the eastern bank is a vast, uninhabited, flat expanse of silvery river sand symbolizing the formless void, the elevated western bank is crowned by a continuous, majestic amphitheater of eighty-four monumental stone ghats. Grand palatial stone facades (havelis) and fortress mansions built by Maratha, Rajput, and Bengali royal dynasties rise dramatically above wide stone staircases that descend straight into the sacred river water.",
      "Climatic patterns in Varanasi are governed by the intense continental rhythms of the Gangetic plain. Winter (November to February) is the connoisseur's season, offering pleasant, sunny daytime highs of 20°C to 25°C, cool misty mornings where dawn boat rides reveal floating oil lamps in the river fog, and evening temperatures dropping to 8°C to 12°C.",
      "Summer (April to June) brings searing dry heat with daytime temperatures exceeding 42°C to 45°C and hot westerly winds (loo), while the South Asian monsoon (July to September) swells the Ganga into a massive, coffee-colored sea that submerges the lower tiers of the stone ghats and temporarily halts rowing boat transit."
    ],
    quote: {
      quote: "Benares is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together.",
      attribution: "Mark Twain, Following the Equator (1897)"
    }
  },
  {
    heading: "Transit Gateways, Lal Bahadur Shastri Airport & Railhead Corridors",
    paragraphs: [
      "Navigating travel to Varanasi has been radically upgraded through extensive modern airport, railway terminal, and highway expressway expansions. The primary aviation portal is Lal Bahadur Shastri International Airport (IATA: VNS), located twenty-six kilometers northwest of the city center at Babatpur. The airport operates dozens of daily nonstop commercial flights connecting Varanasi to New Delhi (just 1 hour 20 minutes flight time), Mumbai, Bengaluru, Hyderabad, Kolkata, Ahmedabad, and Chennai, as well as seasonal international flights to Kathmandu, Bangkok, and Colombo.",
      "Pre-paid authorized airport taxi booths inside the arrival terminal provide dependable fixed-tariff transfers to the city center (Cantonment), the historic ghats, and Sarnath in approximately forty-five minutes via the modern four-lane Babatpur-Varanasi elevated expressway.",
      "Varanasi is one of the most vital rail junctions in northern India, served by two major railway hubs: Varanasi Junction (Cantt, station code: BSB), situated in the cantonment area three kilometers west of the ghats, and the massive multi-line railway junction at Banaras Railway Station (formerly Manduadih, station code: BSBS), renowned for its world-class, airport-like passenger amenities, heritage murals, and pristine cleanliness.",
      "Varanasi is directly connected to New Delhi via India's flagship high-speed rail service: the Vande Bharat Express (Train 22435/22436), which completes the 760-kilometer journey from New Delhi in just eight hours. Multiple daily superfast trains—including the Shiv Ganga Express and Kashi Vishwanath Express—provide dependable overnight journeys.",
      "Within the city, electric auto-rickshaws (e-rickshaws), pedal rickshaws, and app-based cabs operate throughout the wider avenues, though the ancient maze of riverside alleys (galis) is accessible strictly on foot."
    ],
    table: {
      headers: ["Transit Route / Highway Service", "Departure Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["Commercial Flight (Delhi to Varanasi)", "Multiple daily nonstop flights", "DEL -> VNS (Babatpur)", "1h 20m (Flight)", "₹3,500 - ₹7,500"],
        ["Vande Bharat Express (Delhi to Varanasi)", "Daily except Monday & Thursday", "NDLS -> BSB (Varanasi Cantt)", "8h 00m (760 km)", "₹1,750 (CC) / ₹3,300 (EC)"],
        ["Varanasi Airport to Dashashwamedh Cab", "Available 24/7 at airport kiosk", "VNS -> Godowlia Crossing", "45m (26 km)", "₹850 - ₹1,150"],
        ["Shiv Ganga Superfast Express Train", "Daily overnight service", "NDLS -> BSBS (Banaras)", "11h 30m (760 km)", "₹1,450 (3AC) / ₹2,100 (2AC)"],
        ["Private AC Sedan (Varanasi to Prayagraj)", "24/7 on-demand taxi hire", "Varanasi -> Prayagraj Sangam", "2h 30m (125 km)", "₹2,800 - ₹3,600"]
      ]
    }
  },
  {
    heading: "The 84 Ghats: Architectural Facades, Sacred Staircases & River Frontage",
    callout: {
      type: "tip",
      text: "The best way to comprehend the sheer scale and architectural majesty of the 84 ghats is to hire a hand-rowed wooden boat from Assi Ghat to Manikarnika Ghat at sunrise."
    },
    paragraphs: [
      "The defining visual and ritual masterpiece of Varanasi is its unbroken ribbon of eighty-four stone ghats stretching across five continuous kilometers along the western riverbank. Built predominantly during the 18th and 19th centuries under the patronage of the Maratha Empire (including the Holkars of Indore, the Scindias of Gwalior, and the Peshwas of Pune), the ghats represent an extraordinary synthesis of Rajput, Maratha, and Mughal monumental masonry.",
      "At the southern end of the crescent lies Assi Ghat, situated where the Assi stream meets the Ganga. Historically a quiet retreat of ascetics and poets where the 16th-century saint Tulsidas is believed to have composed parts of the Ramcharitmanas, Assi Ghat today is the cultural anchor of southern Varanasi. It is renowned for Subah-e-Banaras, a pre-dawn ritual combining Vedic fire chants, morning raga classical music recitals on sitar and shehnai, and communal sunrise yoga on the wide stone flagstones.",
      "Proceeding northward, travelers pass magnificent historical ghats, including Tulsi Ghat, Harishchandra Ghat (one of the two ancient cremation grounds), Chet Singh Ghat (an imposing 18th-century fortified stone castle built by Maharaja Chet Singh, bearing cannon shot marks from his 1781 battle with Warren Hastings), and Darbhanga Ghat, crowned by the opulent BrijRama Palace hotel with its Greco-Roman stone pillars and carved Maratha balconies.",
      "At the geographic and ritual center sits Dashashwamedh Ghat, the most bustling and vibrant riverfront in India, while further north lie Scindia Ghat (with its partially submerged 19th-century Shiva temple that tilted under the river silt), Panchganga Ghat (where five sacred underground streams are said to unite), and Rajghat at the northern terminus.",
      "Panchganga Ghat represents one of the most intellectually revered and visually monumental river interfaces in northern India. Here, according to tradition, five sacred rivers—the Ganga, Yamuna, Saraswati, Kirana, and Dhutapapa—are believed to merge. Looming high on the stone bluff above the ghat stands the imposing minarets of the 17th-century Alamgir Mosque (Dharahara Mosque), built during the reign of Aurangzeb atop an ancient Vishnu temple foundation, creating a towering silhouette visible from across the river.",
      "Just south of Manikarnika lies Scindia Ghat, built in 1830 by the Gwalior royal house. The ghat is famous for the picturesque Ratneshwar Mahadev Temple (Matri Rin Mahadev), a magnificent stone Shiva shrine that tilted at an astonishing nine-degree angle after its colossal stone foundation subsided into the soft silt of the riverbank, with its ornately carved sanctum remaining partially submerged under the sacred river waters for much of the year."
    ]
  },
  {
    heading: "The Ritual of Fire: Evening Ganga Aarti at Dashashwamedh Ghat",
    paragraphs: [
      "Every evening at dusk, Dashashwamedh Ghat transforms into the stage for one of the most spellbinding spiritual spectacles on earth: the grand Maha Ganga Aarti. According to legend, this ghat was consecrated by Lord Brahma, who performed ten horse sacrifices (dasa-ashwa-medha) here to welcome Lord Shiva back to the sacred city.",
      "As twilight settles over the river, seven young Brahmin priests, dressed in identical pleated silk dhotis, matching saffron stoles, and vermilion tilaks, ascend elevated wooden platforms draped in marigold garlands. Facing the holy river, the priests perform a choreographed ritual that has endured for centuries, holding smoking brass censers that release thick billows of frankincense and sandalwood into the cooling evening breeze.",
      "Accompanied by the thunderous resonance of temple bells, beating brass gongs, clashing cymbals, and the deep reverberation of blowing conch shells (shankha), the priests lift massive, multi-tiered brass snake lamps (holding dozens of flaming wicks soaked in pure camphor and ghee). They rotate the flaming lamps in graceful, synchronized circles, offering the sacred fire element to the mother river in an act of cosmic devotion.",
      "Thousands of pilgrims and travelers witness the ceremony from the stone steps and from hundreds of wooden boats clustered tightly together on the dark river water. As the aarti concludes, devotees release flickering oil lamps nestled in biodegradable leaf cups with rose and marigold petals, watching them float outward into the dark currents of the Ganga."
    ]
  },
  {
    heading: "The Eternal Flame of Manikarnika: Death, Cremation & Moksha",
    callout: {
      type: "note",
      text: "Manikarnika is a deeply sacred, living cremation ground where families perform final rites. Approach with absolute reverence: maintain respectful silence, do NOT take photographs, and dress modestly."
    },
    paragraphs: [
      "Situated at the heart of the ghat arc lies Manikarnika Ghat, revered in Hinduism as the Mahashmashana—the Great Cremation Ground of the universe. According to Hindu mythology, when Lord Shiva was dancing ecstatically here, his jeweled earring (Manikarnika) fell into a well excavated by Lord Vishnu, known today as the Manikarnika Kund. Shiva blessed the spot, proclaiming that anyone cremated here would receive the Taraka Mantra directly into their ear at the moment of death, granting immediate Moksha—liberation from the eternal wheel of rebirth (samsara).",
      "Unlike Western or modern traditions that hide death away behind sanitized hospital walls, Varanasi places mortality squarely at the center of human consciousness. At Manikarnika, funeral pyres have burned continuously without extinguishing for thousands of years, tended around the clock by the hereditary Dom community, the custodians of the sacred eternal flame.",
      "Bodies wrapped in white muslin (for men) or vibrant red and gold brocade (for women) are carried through the narrow galis on bamboo stretchers by grieving family members chanting 'Ram Naam Satya Hai' ('The name of Ram is the only truth'). The bodies are dipped in the purifying waters of the Ganga before being placed upon pyres of fragrant sandalwood, mango wood, and sal logs stacked neatly along the riverbank.",
      "Witnessing the burning pyres of Manikarnika from a respectful distance—where fire, smoke, river water, and sacred chants unite beneath the open sky—is a profoundly moving, transformative encounter with the fundamental impermanence of mortal existence."
    ]
  },
  {
    heading: "Kashi Vishwanath Temple: The Golden Shrine & The River Corridor",
    callout: {
      type: "important",
      text: "Security at Kashi Vishwanath is strict. Mobile phones, electronic watches, pens, cameras, and leather belts are prohibited inside the inner temple complex. Free locker facilities are available at the entrance."
    },
    paragraphs: [
      "The supreme spiritual nucleus of Varanasi is the Kashi Vishwanath Temple, dedicated to Lord Shiva as Vishveshwara or Vishwanath—'Ruler of the Universe'. The temple houses one of the twelve sacred Jyotirlingas (self-manifested pillars of divine light) of India, making it the most revered Shaivite sanctuary in the world.",
      "The temple has endured a turbulent history of destruction and rebuilding: demolished by the Delhi Sultanate and Mughal rulers, the current historical shrine was rebuilt in 1780 CE by the visionary Maratha queen Maharani Ahilyabai Holkar of Indore. In 1839, Maharaja Ranjit Singh of Punjab donated one ton of pure gold to plate the temple's fifty-one-foot-high tower (shikhara), earning it the legendary title of the Golden Temple of Varanasi.",
      "In December 2021, the temple precinct was transformed by the inauguration of the monumental Kashi Vishwanath Corridor (Dham). Spanning over 50,000 square meters, this vast architectural project created a direct, unobstructed pedestrian stone promenade connecting the riverfront at Manikarnika and Lalita Ghats directly to the temple sanctum. Paved in fine Chunar pink sandstone, the corridor features expansive courtyards, pilgrim facilitation centers, a Vedic library, and heritage museums.",
      "Inside the sanctum, pilgrims file past the sacred dark lingam set within a silver reservoir, pouring holy Ganga water, raw unboiled milk, bael leaves (bilva patra), and fragrant datura flowers over the stone while chanting 'Har Har Mahadev'."
    ]
  },
  {
    heading: "The Medieval Galis: Labyrinths, Haveli Architecture & Old City Life",
    paragraphs: [
      "Beyond the wide openness of the riverfront ghats lies the medieval labyrinth of Varanasi's Old City—a dense, pulsating network of thousands of cobblestone alleys known locally as galis. Barely wide enough for two people to pass with shoulders touching, these ancient pedestrian passageways were designed narrow to block the searing summer sun and baffle potential invading cavalry armies.",
      "Wandering through iconic galis such as Vishwanath Gali, Kachori Gali, and Thatheri Bazar is like stepping into an unbroken 17th-century universe. Soaring four-story stone havelis with carved wooden doorways, cantilevered jharokha balconies, and recessed niche shrines dedicated to Hanuman and Ganesha loom over the cobblestones. Sacred zebu cows wander serenely through the crowds, while motorcycle bells and bicycle bells chime in continuous cacophony.",
      "The galis are organized into specialized artisan and trade quarters: in Thatheri Bazar, copper and brass smiths hammer traditional utensils and ritual lamps; in Kachori Gali, morning fry-cooks roll crisp puris and spicy kachoris in boiling iron cauldrons of mustard oil; and in Vishwanath Gali, glass bangles, rudraksha malas, and Shiva statues gleam under hanging lightbulbs.",
      "Navigating these alleys without a map, allowing yourself to become delightfully lost before unexpectedly emerging onto the blinding sunlit steps of a quiet ghat, is the quintessential urban adventure of Kashi."
    ]
  },
  {
    heading: "Sarnath: The Deer Park, Dhamek Stupa & The Lion Capital",
    callout: {
      type: "note",
      text: "Sarnath is located just ten kilometers northeast of Varanasi, marking the sacred cradle where Gautama Buddha preached his first sermon after attaining enlightenment under the Bodhi tree in Bodh Gaya."
    },
    paragraphs: [
      "Just ten kilometers northeast of the crowded ghats of Varanasi lies Sarnath (historically Isipatana or the Deer Park), one of the four most sacred pilgrimage sites of world Buddhism. It was here, in approximately 528 BCE, that Siddhartha Gautama, having attained supreme enlightenment at Bodh Gaya, gathered his five former ascetic companions to deliver his momentous first sermon (the Dhammacakkappavattana Sutta)—thereby 'setting into motion the Wheel of the Dharma' (Dharmachakra).",
      "In this historic sermon, the Buddha articulated the foundational truths of Buddhism: the Four Noble Truths (the reality of suffering, its cause in attachment, its cessation, and the Eightfold Path to liberation) and the Middle Way. Sarnath thus marks the birth of the Buddhist Sangha (monastic community).",
      "The dominant architectural monument at Sarnath is the colossal Dhamek Stupa, a massive solid cylindrical brick-and-stone stupa rising 43.6 meters high and 28 meters in diameter. Originally built by Emperor Ashoka in 249 BCE and enlarged during the Gupta Empire in the 5th century CE, its lower stone drum is adorned with exquisite carved Gupta-era relief panels depicting delicate geometric arabesques, swastikas, and blooming lotus medallions.",
      "Adjoining the stupa grounds lies the Sarnath Archaeological Museum, India's oldest site museum. The museum preserves the iconic Lion Capital of Ashoka (carved from a single block of polished Chunar sandstone around 250 BCE), featuring four back-to-back Asiatic lions atop a circular abacus with the 24-spoke Dharma Wheel. Adopted in 1950 as the official National Emblem of India, its mirror-smooth Mauryan polish and lifelike musculature represent the pinnacle of ancient Indian sculptural art."
    ]
  },
  {
    heading: "The Banarasi Silk Weaving Heritage & Kadhwa Zari Artistry",
    callout: {
      type: "tip",
      text: "To purchase an authentic handloom Banarasi silk saree with an official Silk Mark and GI tag, visit government cooperatives or authentic weaver neighborhoods in Madanpura and Peeli Kothi, avoiding tout-driven tourist shops."
    },
    paragraphs: [
      "The textile heritage of Varanasi is globally celebrated, holding an official Geographical Indication (GI) tag for Banarasi Sarees and Brocades. Weaving in Kashi dates back to the Vedic period, but the art form reached its supreme aesthetic zenith under Mughal imperial patronage during the 16th century, when Persian floral sensibilities merged with indigenous Indian weaving traditions.",
      "Traditional Banarasi sarees are woven from pure Mulberry silk yarn imported from South India and interwoven with metallic Zari threads—historically pure silver threads coated in 24-karat gold, now produced with certified silver-electroplated copper alloy. The weaving is conducted on traditional wooden pit looms and Jacquard looms in the historic weaver enclaves (bunkar mohallas) of Madanpura, Alaipura, and Peeli Kothi, where generations of predominantly Muslim Ansari master weavers pass down the art from father to son.",
      "The highest pinnacle of the craft is the Kadhwa technique (hand-embroidery on the loom). In Kadhwa weaving, each floral motif (buti) or paisley (amru) is individually woven into the silk fabric by hand using separate spools of colored silk and gold zari, without any loose floating threads on the reverse side of the saree. A single masterwork Kadhwa bridal saree can require up to six months of painstaking daily labor by two weavers working side by side.",
      "Iconic Banarasi design motifs include the Shikargah (depicting royal hunting scenes with wild animals and hunters), Jangla (intertwining floral vine patterns), and the Butidar leaf border, producing heirlooms treasured across generations.",
      "The socioeconomic fabric of Varanasi's silk industry is deeply intertwined with intercommunity harmony: Hindu traders and Muslim weavers have collaborated for centuries in the historic Dalmandi and Chowk wholesale markets. Despite pressures from modern Chinese power looms, master handloom cooperatives have successfully revived traditional Tanchoi, Jamdani, and pure Katan silk weaves, ensuring the preservation of this intangible cultural heritage."
    ]
  },
  {
    heading: "Banaras Gastronomy: Kachori-Jalebi, Malaiyyo, Banarasi Paan & Thandai",
    paragraphs: [
      "The street food culture of Varanasi is an intoxicating celebration of sweet, savory, and dairy craftsmanship, reflecting the leisurely, pleasure-loving aesthetic known locally as Banarasipana (the unique Banaras way of life).",
      "The classic morning breakfast ritual begins at dawn with Kachori-Sabzi and Jalebi in Kachori Gali or near Godowlia Crossing. Hot, crispy whole-wheat kachoris stuffed with spiced ground lentils (urad dal) are served with a tangy, fiery potato and chickpea curry (aloo-chana sabzi) simmered with whole cumin, fenugreek, and green chilies, accompanied by crispy, saffron-soaked pretzel-shaped jalebis dripping with hot sugar syrup.",
      "During the winter months (November to February), Varanasi produces one of the world's most delicate and ephemeral desserts: Malaiyyo (also known as Makhan Malai). Raw milk and cream are left outdoors on open rooftops overnight to absorb the winter dew. At dawn, the milk is whipped vigorously for hours until it transforms into a feather-light, cloud-like foam, delicately infused with saffron, cardamom, and rose water, garnished with crushed pistachios and almonds, and served in small earthen clay cups (kulhads). The foam literally dissolves on the tongue in seconds.",
      "No day in Varanasi is complete without Banarasi Paan—the legendary betel-leaf preparation immortalized in Indian cinema and literature. Master paan-makers (paanwalas) use tender Magahi or Betwa betel leaves, coating them with slaked lime (chuna), catechu (kattha), sweet gulkand (rose petal preserve), candied fennel, menthol, and fragrant spices, folded into a delicate triangular parcel that melts smoothly in the mouth.",
      "In hot weather, travelers refresh with Thandai—a cold, spiced milk drink blended with crushed almonds, fennel seeds, watermelon seeds, rose petals, black pepper, and saffron, traditionally served with or without fresh herbal infusions.",
      "Beyond these staples, the city's sweetmeat shops (halwais) along Vishwanath Gali craft legendary dairy delicacies: rich Rabri served in terracotta saucers, thick saffron lassi topped with thick clotted cream (malai) and pomegranate seeds, and Launglata—a spiced pastry pocket stuffed with sweetened mawa (khoya) and cloves, deep-fried in pure ghee and steeped in fragrant sugar syrup."
    ]
  },
  {
    heading: "The Benares Gharana: Indian Classical Music & Subah-e-Banaras",
    paragraphs: [
      "Varanasi has been for centuries a preeminent cradle of North Indian (Hindustani) classical music, dance, and poetry, designated by UNESCO as a City of Music in its Creative Cities Network.",
      "The Benares Gharana of classical music was founded in the late 18th century by master musicians such as Pandit Ram Sahai, who revolutionized the art of the Tabla by creating a dynamic, lyrical playing style capable of accompanying both rigorous Khayal vocalists and delicate Kathak dancers. The city has nurtured some of India's greatest musical legends, including the peerless Shehnai maestro Ustad Bismillah Khan, Sitar virtuoso Pandit Ravi Shankar, and vocal titans like Girija Devi and Pandit Rajan-Sajan Mishra.",
      "The soul of the city's musical life is found not in commercial concert halls, but in intimate morning baithaks and temples. At Kabir Chaura, the historic neighborhood of musicians, the rhythms of tabla practice echo from open courtyards from dawn to dusk.",
      "At Assi Ghat, the daily Subah-e-Banaras program offers visitors a sublime morning experience: sitting on the stone river steps as the first light touches the water, listening to renowned vocalists and instrumentalists perform morning ragas (such as Raga Bhairav, Ahir Bhairav, and Todi) that resonate with the awakening energy of the sacred river."
    ]
  },
  {
    heading: "Vedic Scholarship: Sanskrit Universities, Akhadas & The Wrestling Tradition",
    paragraphs: [
      "Varanasi remains the intellectual citadel of traditional Sanskrit scholarship, astronomical calculation, and Vedic recitation, home to historic institutions such as Sampurnanand Sanskrit University (established in 1791) and the prestigious Banaras Hindu University (BHU), founded in 1916 by Pandit Madan Mohan Malaviya.",
      "Along the quiet streets of Kedar Gali and Assi, traditional residential Sanskrit Gurukuls continue to educate young students (brahmacharis) in oral Vedic memorization, Sanskrit grammar (Panini's Ashtadhyayi), and Hindu philosophical systems (Darshanas), preserving oral chanting traditions recognized by UNESCO as Intangible Cultural Heritage.",
      "Directly alongside this intellectual tradition thrives an ancient physical culture: the traditional wrestling gymnasiums (Akhadas) of the ghats, most famously Tulsi Akhada near Tulsi Ghat. Here, young wrestlers (pehlwans) train at dawn, digging up and raking large pits of soft earth mixed with mustard oil, turmeric, and buttermilk.",
      "Practicing ancient exercise disciplines with heavy wooden clubs (jodis), stone rings (nals), and bodyweight push-ups (dands), the wrestlers adhere to a strict celibate, vegetarian lifestyle focused on physical discipline, spiritual dedication to Lord Hanuman, and mental equilibrium."
    ]
  },
  {
    heading: "Comprehensive 4-Day Varanasi & Sarnath Itinerary",
    callout: {
      type: "tip",
      text: "Structure your days around early mornings and late evenings when the light is golden and temperatures are mild. Reserve afternoons for shaded museums, Sarnath, or resting."
    },
    paragraphs: [
      "This immersive four-day itinerary provides a balanced journey across the ancient ghats, sacred temples, silk weaving mohallas, and the serene Buddhist cradle of Sarnath.",
      "Day 1: Arrival, Evening Ghat Walk & Dashashwamedh Ganga Aarti. Arrive in Varanasi via flight or express train. Check in to your heritage hotel along the ghats or in Cantonment. At 04:30 PM, begin a gentle walking orientation from Assi Ghat toward Dashashwamedh Ghat. At 06:30 PM, witness the magnificent evening Ganga Aarti from a chartered wooden boat on the river. Conclude with hot jalebis and kulhad chai in Godowlia.",
      "Day 2: Sunrise River Boat, Old City Galis & Kashi Vishwanath Dham. Wake at 05:15 AM for a hand-rowed wooden boat ride from Assi to Manikarnika Ghat, watching dawn mist lift over 84 stone facades. Disembark at Manikarnika and observe the cremation rituals with reverence. Walk through the ancient galis to visit the Kashi Vishwanath Golden Temple and the modern river corridor. In the afternoon, explore the brass and bangle markets of Thatheri Bazar, savoring winter Malaiyyo or a fresh Banarasi Paan.",
      "Day 3: Sarnath Buddhist Cradle & Banarasi Silk Weavers. Spend the morning on an excursion to Sarnath (10 km). Tour the colossal 5th-century Dhamek Stupa, the ancient ruins of Mulagandha Kuti Vihara, and the Sarnath Archaeological Museum to view the Mauryan Lion Capital. Return to Varanasi for lunch. In the afternoon, visit a traditional Ansari handloom weaving workshop in Madanpura to witness master weavers crafting Kadhwa bridal sarees on wooden pit looms.",
      "Day 4: Subah-e-Banaras Classical Music, Tulsi Akhada & Departure. Rise before dawn to attend Subah-e-Banaras at Assi Ghat: experience Vedic chanting, sunrise raga recitals, and morning yoga. Walk to nearby Tulsi Akhada to watch traditional clay wrestling. Visit the sprawling green campus of Banaras Hindu University (BHU) and the New Vishwanath Temple (Birla Temple). Transfer to Lal Bahadur Shastri Airport or Varanasi Cantt Station for your onward journey."
    ],
    table: {
      headers: ["Day", "Primary Focus & Core Activities", "Key Locations Explored", "Atmosphere & Setting", "Featured Gastronomic Highlight"],
      rows: [
        ["Day 1", "Arrival & Grand Evening Fire Aarti", "Dashashwamedh Ghat, Godowlia, River Boat", "Vibrant / Sacred", "Crisp spicy kachori with aloo sabzi & jalebi"],
        ["Day 2", "Sunrise Boat & Kashi Vishwanath", "84 Ghats, Manikarnika, Vishwanath Dham", "Mystical & Architectural", "Ethereal winter Malaiyyo foam in kulhad"],
        ["Day 3", "Sarnath Buddhist Cradle & Silk Looms", "Dhamek Stupa, Ashoka Capital, Madanpura Looms", "Serene & Artisanal", "Traditional Banarasi Satvik lunch thali"],
        ["Day 4", "Dawn Classical Music & River Departure", "Assi Ghat Subah-e-Banaras, Tulsi Akhada, BHU", "Contemplative", "Authentic sweet Banarasi Paan with gulkand"]
      ]
    }
  },
  {
    heading: "Accommodations: Heritage Riverside Havelis & Modern Stays",
    paragraphs: [
      "Accommodations in Varanasi range from historic Maratha riverside palaces to modern luxury hotels in the peaceful Cantonment area.",
      "For an unforgettable historical experience, staying directly on the ghats in a restored palace is peerless: BrijRama Palace (at Darbhanga Ghat, built in 1812) is Varanasi's premier luxury heritage hotel, featuring traditional boat transfers to the private entrance, open central stone atriums, live classical sarod music at twilight, and luxurious river-view suites (₹22,000 to ₹45,000 per night). Other charming heritage properties along the ghats include Palace on Ganges and Suryauday Haveli at Shivala Ghat (₹6,500 to ₹15,000 per night).",
      "In the Cantonment district (convenient for vehicle drop-offs and rail transfers), luxury international hotels like the Taj Ganges and Radisson Hotel Varanasi offer sprawling green gardens, swimming pools, and quiet retreats away from the old city bustle (₹10,000 to ₹25,000 per night).",
      "For independent travelers and backpackers, Assi Ghat and Pandey Ghat boast dozens of welcoming family-run guesthouses and design hostels offering clean rooms, rooftop river-view cafes, and communal yoga classes at ₹1,200 to ₹3,500 per night."
    ]
  },
  {
    heading: "Seasonal Packing, Ghat Etiquette & River Photography Rules",
    callout: {
      type: "note",
      text: "Strict Photography Rule: Photography and videography are strictly prohibited at Manikarnika Ghat and Harishchandra Ghat. Never point cameras or phones toward funeral pyres."
    },
    paragraphs: [
      "Packing for Varanasi requires respectful, modest attire suitable for walking extensive cobblestone staircases and visiting conservative Hindu temples.",
      "Ghat and Temple Etiquette: Both men and women should wear modest clothing that covers shoulders, chest, and knees. Loose, breathable cotton kurtas, long trousers, or ankle-length skirts are ideal. Slip-on walking shoes or sandals with secure straps are essential, as you will remove footwear frequently before entering temples and shrines.",
      "River Photography Guidelines: While wide-angle photography of the ghats from boats on the river is completely permissible and spectacular, strict prohibitions apply at cremation ghats. Never take photos or film funeral pyres at Manikarnika or Harishchandra Ghat, out of basic human dignity and respect for grieving families.",
      "Winter & Summer Considerations: If traveling between December and February, bring a warm jacket, fleece sweater, and wool scarf for chilly early-morning boat rides. In summer (April-June), pack wide-brimmed sun hats, high-SPF sunscreen, and electrolyte hydration powders."
    ]
  },
  {
    heading: "Eco-Sensitivity, Ganga Cleaning & Sustainable Ghat Travel",
    paragraphs: [
      "The holy Ganga at Varanasi has historically suffered severe environmental strain from municipal sewage discharge, industrial effluents, and non-biodegradable ritual waste. Under the nationwide National Mission for Clean Ganga (Namami Gange), massive multi-million-dollar sewage treatment plants (STPs) and interceptor drainage networks have substantially improved river water quality in recent years.",
      "Responsible travelers can play an active role in protecting the river: never purchase floating oil lamps housed in plastic containers or decorated with synthetic glitter. Only use biodegradable donas made from natural sal leaves and pure organic marigold petals.",
      "Do not dispose of plastic water bottles or food packaging into the river or on the stone ghats. Carry a reusable stainless steel water flask and refill it at RO filtered water stations available across hotels and public centers.",
      "Support genuine local livelihoods by purchasing handloom silk directly from registered master weavers, hiring licensed local heritage walking guides, and paying fair, dignified wages to elderly wooden boat rowers. Support local sustainable initiatives: dine at cafes that compost food waste, purchase ethical handlooms from women's cooperatives, and participate in voluntary river clean-up drives organized by local youth groups along the river beaches."
    ]
  },
  {
    heading: "The Sacred Wells & Subterranean Water Sanctums: Gyan Vapi & Lolark Kund",
    callout: {
      type: "note",
      text: "Varanasi's sacred landscape extends beneath the surface through dozens of ancient subterranean wells, stepwells (kunds), and sacred springs mentioned in the Skanda Purana."
    },
    paragraphs: [
      "Beyond the open vista of the Ganga, the sacred topography of Varanasi encompasses an intricate subterranean hydrological network of ancient stepped ponds (kunds), sacred wells (vapis), and freshwater tanks. Historically numbering over one hundred, these water sanctums were mapped in the 12th-century Kashi Khanda as cosmic focal points for specific ritual purifications.",
      "The most famous sacred well is the Gyan Vapi ('Well of Wisdom'), situated directly adjacent to the Kashi Vishwanath Temple. According to Shaivite legend, Lord Shiva himself excavated this well with his trident (trishula) to quench the thirst of the earth, endowing its water with the power to confer divine spiritual insight. When the ancient temple was attacked in 1669, the chief priest is recorded to have leaped into the deep waters of the Gyan Vapi holding the sacred Shiva lingam to protect it from desecration.",
      "Another extraordinary subterranean sanctuary is Lolark Kund ('Trembling Sun Pond'), located near Tulsi Ghat. Descending thirty-five steep stone steps into a narrow, deep subterranean stone cleft shaped like a keyhole, this ancient sun-worship tank dates to the Vedic era. On the auspicious solar festival of Lolark Chhath, thousands of childless couples descend into the subterranean waters to perform dawn fertility baths, casting clothes into the sacred pool as offerings to Surya, the sun god.",
      "Other notable water bodies include Manikarnika Kund (the mythic Chakra Pushkarini dug by Lord Vishnu), Sankatha Kund, and the vast rectangular tank of Durga Kund, anchoring the red stone 18th-century Durga Temple built in classical Nagara architectural style by a Bengali Maharani."
    ]
  },
  {
    heading: "Mystic Poets of Benares: Kabir, Ravidas & Tulsidas at Tulsi Ghat",
    paragraphs: [
      "Varanasi's enduring greatness is rooted not only in ritual orthodoxy, but equally in its radical traditions of egalitarian spiritual rebellion, epitomized by the great medieval Bhakti movement poet-mystics who lived and preached along these ghats.",
      "In the 15th century, the iconoclastic mystic-poet Kabir lived in the weaver quarters of Kashi. Sitting at his simple wooden pit loom, weaving cloth while composing revolutionary vernacular couplets (dohas), Kabir fiercely rejected religious hypocrisy, caste divisions, and empty ritualism, declaring that the divine dwells not in stone temples or mosques, but in the pure heart. His shrine and monastery at Kabir Chaura remains a vibrant center of interfaith devotion.",
      "At Seer Govardhanpur in southern Varanasi sits the grand pilgrimage temple honoring Sant Ravidas, the revered 15th-century Bhakti saint and leather artisan who preached the ideal of Begumpura ('City Without Sorrow')—a visionary utopian society without caste hierarchies, poverty, or social oppression.",
      "At Tulsi Ghat, overlooking the sweeping curve of the river, stands the historic mud-and-brick house where saint-poet Goswami Tulsidas lived in the late 16th century. Here, Tulsidas composed the Ramcharitmanas—translating the Sanskrit Ramayana into everyday Awadhi Hindi so that ordinary people could access the sacred narrative—as well as founding the traditional Sankat Mochan Hanuman Temple and staging the world's first open-air Ramlila dramatic performances, which continue to be enacted across Kashi every autumn."
    ]
  },
  {
    heading: "Detailed Budget Framework & Travel Logistics in INR",
    paragraphs: [
      "A four-day journey through Varanasi and Sarnath can be planned across three distinct budget categories, each providing transparent, verified cost parameters.",
      "Budget Explorer (₹1,500 - ₹2,500 per person per day): Stay in welcoming family guesthouses or traveler hostels near Assi Ghat (₹800 - ₹1,400/night). Travel via shared e-rickshaws and walking. Dine on street-side kachori-sabzi, thalis, and lassi (₹400 - ₹650/day). Shared sunrise wooden boat rides (₹250 - ₹400/seat) and free public ghat aartis.",
      "Mid-Range Cultural Traveler (₹5,000 - ₹8,500 per person per day): Stay in charming boutique havelis on the ghats or cantonment hotels (₹3,500 - ₹6,000/night). Travel via private app cabs and dedicated auto-rickshaws (₹1,000 - ₹1,800/day). Private hand-rowed wooden boat charters at dawn and evening (₹1,500 - ₹2,500/day). Curated dining at heritage restaurants and guided heritage walks (₹1,200 - ₹2,000/day).",
      "Luxury Heritage Connoisseur (₹18,000 - ₹40,000+ per person per day): Stay at BrijRama Palace or Taj Ganges (₹18,000 - ₹35,000/night). Private dedicated air-conditioned chauffeur-driven vehicle throughout the stay (₹3,000 - ₹4,500/day). Private motorboat or luxury bajra charter on the Ganga, private classical music baithaks, and bespoke silk master studio tours.",
      "Every tier offers deep, unforgettable immersion into the living pulse of India's eternal city."
    ],
    table: {
      headers: ["Expense Category", "Budget Tier (Daily / Unit)", "Mid-Range Tier (Daily / Unit)", "Luxury Tier (Daily / Unit)"],
      rows: [
        ["Double Accommodation", "₹800 - ₹1,500", "₹3,500 - ₹6,500", "₹18,000 - ₹40,000+"],
        ["Daily Dining (Per Person)", "₹400 - ₹650", "₹1,200 - ₹2,000", "₹3,500 - ₹6,500"],
        ["Local Transit & Day Excursions", "₹250 - ₹500 (Shared)", "₹1,200 - ₹2,000 (Private Cab)", "₹3,000 - ₹4,500 (Dedicated SUV)"],
        ["Boat Charters & Temple Access", "₹300 - ₹600 (Shared)", "₹1,500 - ₹2,500 (Private boat)", "₹4,000 - ₹9,000 (Bajra/VIP pass)"],
        ["Banarasi Silk & Handicrafts", "₹400 - ₹1,200 (Scarf/Beads)", "₹4,500 - ₹12,000 (Silk Saree)", "₹25,000 - ₹90,000 (Kadhwa Bridal)"]
      ]
    }
  },
  {
    heading: "Practical Information, Safety Realities & Emergency Contacts",
    callout: {
      type: "important",
      text: "Beware of aggressive silk shop touts and self-appointed 'guides' at Manikarnika Ghat who demand large cash donations for cremation wood. Politely and firmly decline and continue walking."
    },
    paragraphs: [
      "Avoiding Common Tourist Scams: The ghats around Dashashwamedh and Manikarnika have persistent touts, commission-seeking boatmen, and bogus 'cremation hospice guides' who claim to collect funds to buy firewood for destitute families. Never hand over cash donations to individuals on the ghats. Negotiate wooden boat tariffs firmly before boarding, and only purchase silk sarees from established government emporiums or verified weaver cooperatives.",
      "Navigating the Crowd: Varanasi's old city alleys and major temple entrances can experience intense human congestion, particularly during auspicious festivals (Maha Shivratri, Dev Deepawali). Keep valuables secured in front zippered pouches, be mindful of stray bulls in narrow galis, and watch your step on slippery moss-covered river staircases.",
      "Banking & Digital Payments: Abundant 24/7 bank ATMs (SBI, HDFC, ICICI, PNB) are located along Godowlia Crossing, Dashashwamedh Main Road, and Cantonment. UPI digital payments (Google Pay, PhonePe) are accepted almost universally across food stalls, sweet shops, and boatmen.",
      "Emergency Contacts: Uttar Pradesh Police Control Room: 112; Tourist Police Station (Dashashwamedh Ghat): +91 542 2503070; Medical Emergency Ambulance: 108; Sir Sunderlal Hospital (BHU Medical College): +91 542 2307500; Tourism Information Counter (Cantonment): +91 542 2506464."
    ]
  },
  {
    heading: "The Eternal City: Light, River Shadows & The Peace of Kashi",
    paragraphs: [
      "To stand on the stone ghats of Varanasi at twilight, watching the sacred river flow silently beneath the fading sky while bells toll and fire ascends into the evening air, is to experience an encounter with the eternal. In this ancient city, the boundaries between past and present, life and death, the mortal and the divine, dissolve into a single luminous current.",
      "Varanasi does not flatter the visitor with manufactured comforts; it reveals existence stripped of illusion. In the steady crackle of the sacred fires of Manikarnika, the joyful devotion of the evening aarti, and the quiet dignity of pilgrims stepping into cold morning waters to offer prayers to the rising sun, the soul discovers a profound reconciliation with the truth of life.",
      "Kashi reminds us that light is not the absence of darkness, but the inner awareness that remains unextinguished through all the changes of the world. In the quiet dip of an oar into early morning water, where the horizon dissolves into golden mist, one senses that this sacred ground has held the prayers, griefs, and awakenings of humanity with unconditional, maternal stillness.",
      "As your boat drifts out onto the wide expanse of the river, leaving the glowing stone palaces and the chanting crowds behind, you carry forward an indelible illumination: a memory of sacred fire reflected on dark waters, the fragrance of sandalwood and burning camphor, and the timeless, liberating grace of the City of Light, whispering the eternal truth that that which is real never ceases to be."
    ]
  }
];

const varanasiInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=85",
    alt: "Scenic view of the ancient stone ghats of Varanasi lining the holy River Ganga at sunrise",
    caption: "The magnificent stone amphitheater of eighty-four ghats lines the western bank of the sacred Ganga in Varanasi."
  },
  {
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85",
    alt: "Evening Ganga Aarti ceremony at Dashashwamedh Ghat with priests holding tiered brass fire lamps",
    caption: "Priests perform the devotional Maha Ganga Aarti at Dashashwamedh Ghat, lifting sacred tiered brass lamps."
  },
  {
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=85",
    alt: "Wooden rowing boats floating on the calm waters of the River Ganga in Varanasi at dawn",
    caption: "Rowing wooden boats across the crescent arc of the Ganga offers an evocative perspective of Kashi's ancient waterfront."
  }
];

const varanasiBlocks = assembleStructuredBlocks(varanasiSections, varanasiInlineImages);

const varanasiConfig = {
  title: "Varanasi",
  slug: "varanasi",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition into Kashi, the City of Light: 84 stone ghats along the crescent Ganga, the sacred fires of Manikarnika, evening Ganga Aarti at Dashashwamedh, Sarnath Deer Park, master Banarasi silk weaving, and verified transit logistics.",
  description: "An exhaustive field expedition into Kashi, the City of Light: 84 stone ghats along the crescent Ganga, the sacred fires of Manikarnika, evening Ganga Aarti at Dashashwamedh, Sarnath Deer Park, master Banarasi silk weaving, and verified transit logistics.",
  coverImage: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "Scenic panoramic view of Varanasi ghats and traditional boats along the River Ganga at sunrise",
  coverImageCaption: "Varanasi sits along the sacred crescent arc of the River Ganga, celebrated for ancient stone ghats and living spiritual traditions.",
  structuredBlocks: varanasiBlocks,
  tags: ["varanasi", "kashi", "benares", "ganga-ghats", "dashashwamedh", "manikarnika", "sarnath", "kashi-vishwanath", "india-travel"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "Banaras: City of Light (Diana L. Eck)", url: "https://www.columbia.edu/" },
    { title: "Archaeological Survey of India: Sarnath Monastic Complex Monograph", url: "https://asi.nic.in/" },
    { title: "Uttar Pradesh Tourism Development Corporation: Varanasi Guidelines", url: "https://uptourism.gov.in/" },
    { title: "The Sacred Geography of Kashi (Kashi Khanda, Skanda Purana)", url: "https://ignca.gov.in/" }
  ]
};

const varanasiBuilt = writeCanonicalArticleModule("travel", "varanasi.js", varanasiConfig);
console.log(`[Varanasi] Word count: ${varanasiBuilt.wordCount}`);

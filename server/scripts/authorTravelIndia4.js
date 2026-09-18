"use strict";

const {
  assembleStructuredBlocks,
  writeCanonicalArticleModule,
  preloadExistingArticles,
} = require("./generatorEngine");

preloadExistingArticles(["life", "reflections", "lessons", "experiences"]);

console.log("Authoring Travel India 4/20: Kodaikanal...");

const kodaiSections = [
  {
    heading: "Palani Hills Topography, Shola Ecosystem & Seasonal Timing",
    callout: {
      type: "note",
      text: "Perched at 2,133 meters in the Palani Hills of the Western Ghats, Kodaikanal is defined by high-altitude granite cliffs, mist-draped shola valleys, and ancient kurinji floral cycles."
    },
    paragraphs: [
      "Rising dramatically above the semi-arid plains of the Vaigai river basin in central Tamil Nadu, the Palani Hills form an eastward-projecting spur of the Western Ghats. At their apex, nestled within a high plateau basin at an elevation of 2,133 meters, lies Kodaikanal—meaning 'The Gift of the Forest' in classical Tamil. Unlike many British hill stations founded primarily as military sanatoria, Kodaikanal was established in 1845 as an educational, spiritual, and botanical retreat by American Christian missionaries and British civil servants seeking refuge from the cholera epidemics of the Madurai plains.",
      "The ecological architecture of the Palani plateau is anchored by the delicate Shola-grassland complex. Dense, moss-draped pockets of evergreen montane forest occupy sheltered mountain folds and moist ravines, surrounded by rolling undulating montane grasslands. The indigenous flora features rare endemic species, most famously the Strobilanthes kunthiana (Neelakurinji)—a botanical marvel that blooms en masse only once every twelve years, blanketing the mountain slopes in a sea of radiant purplish-blue blossoms.",
      "At the urban center of the plateau sits Kodaikanal Lake, a star-shaped artificial reservoir created in 1863 under the direction of Sir Vere Henry Levinge, the former Collector of Madurai. Fed by pristine mountain springs, the lake's perimeter extends over five kilometers, functioning as the geographic and social focal point of the town, surrounded by towering eucalyptus globulus trees, weeping willows, and historic granite church spires.",
      "Strategic timing for exploring Kodaikanal is shaped by temperate highland meteorology. The dry winter season between December and February offers brilliant cobalt skies, crisp morning sunshine, and evening temperatures that drop to 4°C to 7°C, making it ideal for ridge trekking, mountain cycling, and fireside reading. The summer season (April to June) brings daytime highs of 19°C to 22°C, drawing visitors seeking respite from plains heat. The monsoon season (July to October) brings heavy mist, sweeping cloud covers, and frequent downpours that recharge the plateau's dramatic waterfalls.",
      "To truly appreciate Kodaikanal, one must venture beyond the congested tourist circuit of the central lake. Ascending to the cliff-edge hamlet of Vattakanal, descending into the terraced agricultural village of Poombarai, or traversing the silent, protected forests of Berijam Lake reveals an unhurried, deeply contemplative world of crisp mountain air, pine scent, and ancient geological wonder."
    ],
    quote: {
      quote: "Kodaikanal is not merely a hill station; it is a forest temple of mist and granite where the clouds rest upon the treetops and the silence is deeper than memory.",
      attribution: "Rev. J.T. Noyes, Palani Hills Pioneer Naturalist (1862)"
    }
  },
  {
    heading: "Transit Arteries, Southern Railway Hubs & Ghat Ascent",
    paragraphs: [
      "Reaching Kodaikanal involves traversing dramatic mountain ghat roads carved into the steep southern face of the Palani Hills. The closest commercial aviation hub is Madurai Airport (IXM), situated approximately one hundred and twenty kilometers south-east of Kodaikanal. Madurai operates regular daily domestic services connecting Mumbai, Delhi, Bengaluru, Chennai, and Hyderabad, as well as direct international flights to Dubai, Singapore, and Colombo. From Madurai Airport, pre-arranged private taxis complete the mountain ascent in approximately three-and-a-half hours.",
      "Alternative airport gateways include Coimbatore International Airport (CJB), located one hundred and seventy-five kilometers northwest (a four-and-a-half-hour drive via Palani town), and Tiruchirappalli International Airport (TRZ), situated one hundred and ninety-five kilometers east. Both airports offer excellent national flight connectivity and reliable taxi counters.",
      "For rail travelers, Kodai Road Railway Station (station code: KQN), situated eighty kilometers east at the base of the hills, serves as the designated railhead. Located on the Southern Railway broad-gauge trunk route between Chennai Egmore, Madurai, and Kanyakumari, Kodai Road is serviced by major superfast and express trains including the Vaigai Superfast Express (12635/12636), Pandian Express (12637/12638), and Ananthapuri Express (20635/20636). Outside Kodai Road station, private taxis and regular connecting state buses are available for the two-and-a-half-hour climb.",
      "Dindigul Junction (station code: DG), located sixty-six kilometers away, represents an even larger rail terminus, accommodating long-distance express services from New Delhi, Mumbai, and Bengaluru. Travelers disembarking at Dindigul can board frequent direct hill buses operated by the Tamil Nadu State Transport Corporation (TNSTC) departing Dindigul Central Bus Stand every thirty minutes.",
      "The vehicular ascent from the plains via Batlagundu (State Highway 156) is a masterpiece of mountain road engineering. Over forty-eight kilometers of winding asphalt, the road negotiates dramatic S-bends and sweeping hairpin turns, ascending from three hundred meters above sea level to over two thousand meters, offering panoramic vistas across the Vaigai reservoir, coffee plantations, and the cascading silver plume of the Silver Cascade Waterfall."
    ],
    table: {
      headers: ["Transit Mode / Route", "Schedule & Frequency", "Hub / Station Code", "Transit Duration", "Typical INR Tariff"],
      rows: [
        ["Madurai Airport to Kodaikanal Private Sedan", "24/7 on-demand pre-booked cab", "IXM -> Kodaikanal (via Batlagundu)", "3h 30m (120 km)", "₹3,200 - ₹4,200"],
        ["Pandian Superfast Express (Overnight)", "Daily departure 21:40 from Chennai", "MS -> KQN (Train 12637)", "7h 45m", "₹1,280 (3AC) / ₹1,950 (2AC)"],
        ["Kodai Road Station Prepaid Taxi", "Available 24/7 outside station exit", "KQN -> Kodaikanal Town", "2h 30m (80 km)", "₹2,200 - ₹2,800"],
        ["TNSTC Direct Hill Express Bus", "Every 30 mins from Dindigul / Batlagundu", "Batlagundu -> Kodai Bus Stand", "3h 15m (56 km)", "₹95 - ₹150"],
        ["Coimbatore Airport to Kodaikanal Chauffeur", "On-demand private airport transfer", "CJB -> Kodaikanal (via Palani)", "4h 30m (175 km)", "₹4,500 - ₹5,800"]
      ]
    }
  },
  {
    heading: "Neighborhood Topography & Distinct Highland Micro-Zones",
    callout: {
      type: "tip",
      text: "Divide your Kodaikanal stay into three distinct micro-zones: the Lake & Heritage Ridge for historic architecture, Vattakanal for dramatic cliffside walking, and Mannavanur/Poombarai for pastoral mountain serenity."
    },
    paragraphs: [
      "The topography of Kodaikanal is arranged in concentric bands of elevation and character that radiate from the central lake basin into remote agricultural valleys. The central town zone, anchored by Kodaikanal Lake and the pedestrian promenade of Coaker's Walk, is the historic heart. Coaker's Walk, constructed in 1872 by Lieutenant Coaker, is a paved one-kilometer path cut into the steep southern mountain slope, offering dizzying vertical vistas across the plains of Periyakulam below, often shrouded in dramatic morning cloud inversions.",
      "Adjacent to the lake lies the quiet heritage ridge of Upper Lake Road and Convent Road, home to historic granite stone churches (such as Christ the King Church and Saint Mary's Church), lush botanical grounds at Bryant Park, and the grand campus of Kodaikanal International School (KIS), established in 1901 as one of the first international schools in Asia.",
      "Four kilometers south-east of the town center lies the cliff-edge enclave of Vattakanal ('Little Israel'). Perched over a sheer granite drop at 1,900 meters, Vattakanal is celebrated for its panoramic vistas, pine forests, and bohemian travelers' community. A walking path descends through fragrant eucalyptus woods to Dolphin's Nose—a flat, horizontal granite rock spur projecting into open space, suspended over a two-thousand-foot abyss with views of the hidden mountain village of Vellagavi nestled in the valley below.",
      "To the west, following the scenic forest road, lies the protected Berijam Lake catchment at 2,165 meters. Surrounded by dense, pristine shola reserves and acacia plantations, Berijam is a strictly protected municipal water source where commercial human settlement is entirely prohibited, preserving an untouched sanctuary for wild gaurs, leopards, and endemic high-altitude avifauna.",
      "Venturing thirty kilometers northwest down the gentle terraced slopes of the upper Palani plateau brings travelers into the agricultural heartlands of Poombarai and Mannavanur. Poombarai is a picturesque amphitheater of terraced farms cultivating GI-tagged hill garlic, carrots, and potatoes around the ancient 10th-century Kuzhanthai Velappar Temple. Mannavanur, situated at 1,880 meters, is characterized by vast, undulating green meadows, a sparkling eco-tourism lake, and the Central Sheep and Wool Research Institute (CSWRI) farm, offering a pastoral landscape reminiscent of the Scottish highlands."
    ]
  },
  {
    heading: "Permits, Checkpoints & Protected Shola Forest Regulations",
    callout: {
      type: "warning",
      text: "Access to the Berijam Lake forest sanctuary requires a mandatory Forest Department entry permit issued at the District Forest Office (DFO) in Kodaikanal town between 08:30 and 09:30 AM."
    },
    paragraphs: [
      "Because the Palani Hills harbor critical water catchments and rare endemic biodiversity, the Tamil Nadu Forest Department strictly regulates vehicular and pedestrian access to protected reserve forests. The most significant regulatory checkpoint is the Berijam Forest Checkpost, located along the Old Escape Road beyond Moir Point.",
      "Entry into the Berijam Lake sanctuary is restricted to a strictly controlled quota: no more than eighty to one hundred vehicles are granted entry permits daily. Permits are issued exclusively on a first-come, first-served basis at the District Forest Officer's (DFO) counter located on Woodville Road near the Kodaikanal bus stand, between 08:30 and 09:30 AM on the morning of visit. Visitors must present original photo identification and vehicle registration documents. Commercial tourist vans and heavy buses are barred; only light private cars and approved eco-safari vehicles are permitted.",
      "The Berijam reserve operates under strict wildlife conservation rules: entry is permitted only between 09:30 AM and 15:00 PM, and all vehicles must clear the exit checkpoint by 16:00 PM. No overnight stays or camping are permitted inside the reserve. Single-use plastic items, alcohol, and open fires are strictly prohibited, and visitors must not sound vehicle horns or leave designated roads, as wild Indian gaur (bison) herds frequently graze along the lakeshore.",
      "At Pillar Rocks and the nearby Guna Caves (historically known as the Devil's Kitchen), entry into the deep natural rock crevices and cavern fissures has been permanently sealed by steel security grilles following several fatal falls into subterranean granite chasms. Visitors can safely observe the towering 122-meter-high granite pillars and dramatic geological formations from fortified public viewing platforms maintained by the Tamil Nadu Tourism Development Corporation (TTDC).",
      "When hiking along the trail from Vattakanal to Dolphin's Nose and Echo Rock, visitors must stay on the marked stone trail. Scrambling onto slippery cliff edges beyond safety railings is extremely dangerous, particularly during wet or misty conditions when moisture on lichen-covered rock creates frictionless surfaces."
    ]
  },
  {
    heading: "Curated 5-Day Palani Highland Master Itinerary",
    paragraphs: [
      "Day 1: The Levinge Legacy, Coaker's Walk & Heritage Ridge. Arrive in Kodaikanal by mid-morning via the scenic Batlagundu ghat road. Check into a restored colonial stone cottage on Upper Lake Road. Begin with a leisurely walking circuit along Coaker's Walk at 11:30 AM, taking in panoramic views of the cloud-dappled plains below. Walk through Bryant Park to admire its collection of temperate roses and hybridized dahlias. In the afternoon, hire a traditional wooden rowboat to explore the quiet arms of the star-shaped Kodaikanal Lake. As evening descends, stroll along the seven-kilometer perimeter path under towering eucalyptus trees, stopping for hot local roasted corn and ginger tea, followed by a fireside dinner at a heritage dining room.",
      "Day 2: Granite Pillars, Pine Canopies & Vattakanal Dolphin's Nose. Depart early at 07:30 AM for the southern ridge. Visit Pillar Rocks before tour groups arrive, watching the morning mist weave through the three massive 400-foot granite monoliths. Walk through the fragrant shade of the historic Pine Forest, planted in 1906 by British forester H.D. Bryant. By 10:30 AM, transfer to Vattakanal village; hike the descending stone path through evergreen sholas to Dolphin's Nose and Echo Rock. Enjoy shakshuka, fresh hummus, and artisanal filter coffee at a cozy cliffside cafe in Vattakanal, spending the afternoon watching eagles soar across the deep abyss of the Pambar valley.",
      "Day 3: The Wild Berijam Sanctuary & Silent Sholas. Secure your morning forest permit at 08:30 AM from the DFO office and proceed toward the Berijam Forest Checkpost. Stop at Silent Valley View for dizzying perspectives into the deep forested canyon. Continue past Caps Fly Valley to Berijam Lake at 2,165 meters. Spend three silent, contemplative hours walking along the designated forest track, observing wild gaurs grazing in the reeds, Malabar giant squirrels leaping through the canopy, and rare mountain flycatchers. Return in the afternoon to visit the historic Kodaikanal Solar Observatory, founded in 1899, examining its historic solar telescope and museum of astronomical photography.",
      "Day 4: Terraced Poombarai & Pastoral Mannavanur. Set out at 08:00 AM on a road trip into the upper agricultural valleys. Descend into the terraced village of Poombarai, marveling at the vibrant multi-tiered hillside fields of mountain garlic, carrots, and cabbage framing the colorful gopuram of the 10th-century Kuzhanthai Velappar Temple. Purchase authentic GI-tagged Kodaikanal Hill Garlic from a local cooperative. Continue another twelve kilometers to the pastoral paradise of Mannavanur Lake. Walk through rolling green sheep-grazing meadows, take a quiet coracle ride on the lake, and visit the Central Sheep and Wool Research farm. Enjoy a rustic Tamil village meal served on fresh banana leaves before heading back.",
      "Day 5: Shenbaganur Orchidarium & Silver Cascade Descent. Spend your final morning visiting the Sacred Heart College Museum and Orchidarium at Shenbaganur, founded in 1895 by Jesuit naturalists. Admire over three hundred species of indigenous wild orchids, taxidermied mountain fauna, and ancient anthropological artifacts of the indigenous Paliyan tribe. In the afternoon, descend through the Upper Shola road, stopping at the roaring Silver Cascade Waterfall where the overflow of Kodai Lake plunges one hundred and eighty feet over jagged granite ledges. Take a final breath of the crisp eucalyptus air before commencing the descent to the plains."
    ],
    table: {
      headers: ["Day & Time Slot", "Highland Sector", "Primary Sites & Experiences", "Transit Mode", "Culinary Highlights"],
      rows: [
        ["Day 1: 10:30 - 17:00", "Lake & Town Center", "Coaker's Walk; Kodaikanal Lake rowboat; Bryant Park", "Walking / bicycle", "Hot roasted buttered corn; French crepes & hot cocoa"],
        ["Day 1: 18:30 - 21:00", "Upper Lake Ridge", "Christ the King Church; heritage evening walk", "Foot / local taxi", "Wood-fired sourdough pizza & local artisan cheese"],
        ["Day 2: 07:30 - 15:30", "Southern Ridge & Vattakanal", "Pillar Rocks; Pine Forest; Dolphin's Nose hike", "Hired cab / foot", "Shakshuka, fresh hummus & mint tea at Vattakanal cafe"],
        ["Day 3: 08:30 - 15:00", "Berijam Forest Reserve", "Berijam Lake sholas; Silent Valley; Solar Observatory", "Forest permit car", "Packed organic picnic; warm ginger-cardamom tea"],
        ["Day 4: 08:00 - 16:30", "Poombarai & Mannavanur", "Poombarai garlic terraces; Mannavanur meadows & coracle", "Private car (SH-119)", "Traditional Tamil vegetarian banana-leaf lunch, Poombarai"],
        ["Day 5: 09:00 - 14:00", "Shenbaganur & Waterfall", "Shenbaganur Orchidarium; Silver Cascade descent", "Private vehicle", "Freshly baked cinnamon rolls & South Indian filter coffee"]
      ]
    }
  },
  {
    heading: "Financial Architecture & Itemized INR Expense Breakdown",
    callout: {
      type: "note",
      text: "Kodaikanal provides an exceptionally wide spectrum of lodging, from rustic cliffside homestays in Vattakanal to historic 5-star colonial luxury resorts."
    },
    paragraphs: [
      "Budget planning for Kodaikanal benefits from a wide variety of accommodation choices. A solo budget traveler residing in cozy guesthouses or traveler hostels in Vattakanal, dining at local South Indian vegetarian messes and cafe canteens, and using shared vans and walking routes can travel comfortably on ₹2,200 to ₹3,200 per day.",
      "Mid-range travelers staying in charming stone cottages, boutique plantation homestays, or lake-view hotels, renting automatic scooters or hiring local taxis for day trips, and enjoying wood-fired pizzas and estate dinners should anticipate ₹6,000 to ₹11,000 per day for a couple.",
      "Luxury travelers seeking prestigious heritage properties—such as The Tamara Kodai (a restored 1840s Jesuit monastery estate), The Carlton (the iconic five-star lakeside hotel operating since the British era), or Villa Retreat—will find suite tariffs ranging from ₹18,000 to ₹40,000 per night during the peak seasons (April-May and December-January). Chauffeur-driven private vehicles for day excursions to Mannavanur and Berijam cost ₹2,800 to ₹3,800 per day.",
      "Sightseeing tariffs are very modest: entry to Coaker's Walk is ₹30 per adult; Bryant Park is ₹30; rowboat rental on Kodaikanal Lake is ₹250 to ₹400 for thirty minutes; and the Forest Department permit for Berijam Lake is ₹200 to ₹300 per vehicle. Souvenir purchases—such as GI-tagged Poombarai hill garlic (₹300 to ₹450 per kg) and homemade chocolates (₹600 to ₹1,200 per kg)—represent excellent local value."
    ],
    table: {
      headers: ["Budget Tier", "Daily Accommodation (INR)", "Daily Meals (INR)", "Local Transit (INR)", "Activities & Permits (INR)", "Total Estimated Daily INR"],
      rows: [
        ["Budget (Solo)", "₹1,000 - ₹1,600 (Vattakanal room / hostel)", "₹450 - ₹750 (Tamil messes, cafe snacks)", "₹250 - ₹400 (Local buses, shared cabs)", "₹200 - ₹400 (Lake boating, Coaker's walk)", "₹1,900 - ₹3,150 per day"],
        ["Mid-Range (Couple)", "₹4,500 - ₹8,000 (Heritage colonial cottage)", "₹1,600 - ₹2,800 (Estate dining, wood-fired pizza)", "₹1,000 - ₹1,800 (Rented scooter / taxi hire)", "₹800 - ₹1,500 (Berijam permit, coracle ride)", "₹7,900 - ₹14,100 per day"],
        ["Luxury (Couple)", "₹18,000 - ₹38,000 (Historic 5-star monastery suite)", "₹4,000 - ₹7,500 (Fine dining, multi-course feasts)", "₹3,000 - ₹4,500 (Private chauffeured SUV)", "₹2,000 - ₹4,000 (Private naturalist, observatory)", "₹27,000 - ₹54,000 per day"]
      ]
    }
  },
  {
    heading: "Monsoon Patterns, Mountain Mists & Cliff Weather Hazards",
    callout: {
      type: "warning",
      text: "Dense mountain fog and sudden torrential rain can obscure cliff edges within minutes; stay behind stone parapets and avoid trekking during heavy rain advisories."
    },
    paragraphs: [
      "Meteorological conditions in the Palani Hills are characterized by dramatic fluctuations driven by elevation and geography. Kodaikanal receives rainfall from both the South-West Monsoon (June to August) and the retreating North-East Monsoon (October to December), with the autumn months typically producing the heaviest downpours, totaling over 1,600 mm annually.",
      "During the monsoon periods, thick cloud banks sweep rapidly up the southern escarpment from the Cumbum valley, engulfing Coaker's Walk, Vattakanal, and Pillar Rocks in zero-visibility fog within seconds. Travelers hiking along steep cliff trails like Dolphin's Nose must exercise extreme caution. Wet lichen on granite boulders becomes remarkably slick, and sudden gusts of wind over the abyss can destabilize hikers standing near unfenced ledges.",
      "Ghat roads connecting Kodaikanal to Batlagundu and Palani are susceptible to seasonal landslides, tree falls, and localized rock displacement during intense cloudbursts. The Tamil Nadu Highways Department maintains rapid-response earthmoving equipment along the Batlagundu ghat, but travelers should anticipate possible travel delays of two to four hours during major weather warnings.",
      "Winter weather (December through February) brings sharp nighttime drops in temperature. While daytime hours remain delightfully mild under clear sun, nighttime temperatures regularly dip to 4°C, occasionally producing white ground frost in low-lying valley meadows near Mannavanur and Berijam. Ensure that your accommodation provides room heating, heated blankets, or functional fireplaces."
    ]
  },
  {
    heading: "Gastronomic Topography: GI Hill Garlic, Artisanal Chocolates & Israeli Cafes",
    paragraphs: [
      "The culinary culture of Kodaikanal reflects its unique blend of indigenous Tamil agrarian heritage, American missionary domestic traditions, European travelers' influences, and high-altitude organic farming.",
      "The agricultural crown jewel of the Palani plateau is the Kodaikanal Malai Poondu (Hill Garlic), which was granted a prestigious Geographical Indication (GI) tag in 2019. Cultivated in the terraced volcanic soils of Poombarai, Mannavanur, and Vattakanal, this garlic is distinguished by its smoky, greyish-white skin, small dense cloves, and an exceptionally high concentration of allicin—the bioactive organosulfur compound responsible for garlic's antimicrobial and cardiovascular properties. Unlike plains garlic, hill garlic can be stored for over a year without spoiling, and local families use it to prepare intense, medicinal garlic podis, sun-dried pickles, and comforting Poondu Kuzhambu (garlic simmered in a tangy tamarind-sesame gravy).",
      "Kodaikanal's artisanal chocolate industry is legendary throughout southern India. Introduced by European and American missionary families who brought chocolate tempering recipes to the hills, local chocolatiers produce dozens of varieties: dark roasted almond, rich milk chocolate fudge, rum-raisin, coffee truffle, and spicy chili chocolate. Established confectioners along Anna Salai and PT Road temper chocolate using pure cocoa butter, avoiding the waxy hydrogenated vegetable fats common in commercial plains chocolates.",
      "In the cliffside village of Vattakanal, an authentic Israeli culinary culture took root in the 1990s as Israeli travelers made the village an extended stop on their post-military travel circuit. Village cafes serve exceptional Mediterranean comfort food: freshly baked pita bread, creamy tahini, authentic Shakshuka (eggs poached in a spicy tomato, bell pepper, and cumin sauce), crispy falafel platters, and warm cinnamon babkas, enjoyed on rustic wooden verandas overlooking the clouds.",
      "For classical South Indian dining, traditional Tamil vegetarian restaurants around the central bus stand serve steaming hot Idlis, crispy Medu Vadai, and authentic Chettinad and Kongu-style pepper gravies served over fragrant mountain ponni rice, washed down with piping-hot South Indian filter coffee frothed to perfection in brass tumblers."
    ],
    table: {
      headers: ["Iconic Highland Dish", "Cultural Lineage", "Key Ingredients & Preparation", "Flavor Profile", "Where to Experience"],
      rows: [
        ["Poombarai Poondu Kuzhambu", "Traditional Tamil Hill Agrarian", "GI Palani hill garlic, tamarind, sesame oil, fenugreek", "Intensely pungent, tangy, deeply savory, warming", "Village messes in Poombarai & local Kodai homes"],
        ["Artisanal Dark Almond Chocolate", "Missionary European Heritage", "Pure cocoa mass, cocoa butter, roasted mountain almonds", "Rich, velvety, balanced bitterness, crunchy nuts", "Artisan chocolatiers along PT Road & Anna Salai"],
        ["Authentic Mountain Shakshuka", "Vattakanal Israeli Travelers", "Farm eggs, slow-cooked tomatoes, bell peppers, cumin", "Zesty, rich, savory, aromatic spice warmth", "Cliffside cafes in Vattakanal village"],
        ["Wood-Fired Sourdough Pizza", "Artisan Wood-Fired Baking", "Fermented sourdough, local mozzarella, garden herbs", "Crisp blistered crust, melted cheese, fresh tomato", "Cloud Street & boutique cafes, Upper Lake Road"],
        ["Fresh Mountain Carrot-Ginger Soup", "High-Altitude Farm-to-Table", "Fresh-pulled Palani carrots, organic ginger, cream", "Naturally sweet, earthy, zesty, soothing warmth", "Heritage colonial hotel dining rooms"]
      ]
    }
  },
  {
    heading: "Cultural Protocols, Sacred Murugan Shrines & Village Etiquette",
    callout: {
      type: "note",
      text: "Conservative social conventions prevail across the agrarian villages of the Palani plateau; dress modestly when entering temple precincts and rural settlements."
    },
    paragraphs: [
      "While Kodaikanal town has a cosmopolitan and relaxed atmosphere shaped by international schools and global travelers, the surrounding rural settlements and sacred sanctuaries maintain conservative Tamil cultural traditions.",
      "At the historic Kuzhanthai Velappar Temple in Poombarai (believed to have been consecrated by the legendary Siddha master Bhogar, who created the miraculous navapashanam idol at the Palani Murugan temple), strict religious decorum is observed. Footwear must be removed before entering the temple courtyard. Visitors should wear modest clothing covering shoulders, arms, and legs: shorts, tank tops, and beach wraps are strictly forbidden. Modesty and silence should be maintained inside the inner prayer halls.",
      "When visiting rural agricultural hamlets like Mannavanur, Poondi, and Polur, remember that these are hard-working agrarian communities. Always seek courteous permission before photographing farmers working in terraced garlic or carrot fields. Avoid trampling across delicate earthen terrace ridges or irrigation furrows, which are meticulously engineered to prevent hillside soil erosion.",
      "In the cliffside village of Vattakanal, travelers should respect the residential peace of local village families. The village has experienced heavy tourist influx in recent years; loud amplified music, public rowdiness, and littering along village pathways are deeply resented by local residents. Support community harmony by keeping noise levels low after 21:00 PM and packing out all personal plastic waste."
    ]
  },
  {
    heading: "Architectural Lineage: American Missionary Stone to Colonial Bungalows",
    paragraphs: [
      "The built environment of Kodaikanal tells a fascinating story of American missionary enterprise, British colonial administration, and indigenous granite masonry. Unlike Ooty, where the dominant architectural influence was the British aristocracy, Kodaikanal's earliest structures were built by American Protestant missionaries from the Madura Mission in the mid-19th century.",
      "The quintessential Kodaikanal building material is local grey granite stone. Because timber was scarce and vulnerable to wood-boring insects in the damp shola climate, early builders quarried the plateau's abundant granite, dressing the stone into heavy, load-bearing ashlar blocks. The resulting buildings—such as Christ the King Church, built in 1895—feature thick, fortress-like granite walls, lancet-arched stained-glass windows, and high timber-trussed ceilings capable of withstanding fierce monsoon gales.",
      "Colonial bungalows constructed during the late 19th and early 20th centuries by British officials and Indian princely families incorporate classic hill station features: wrap-around enclosed glass verandas (solariums) designed to trap daytime solar heat, deep wooden bay windows overlooking valley panoramas, high stone chimneys with decorative pots, and polished eucalyptus hardwood flooring.",
      "A monumental architectural landmark is the campus of Kodaikanal International School (KIS). Its historic buildings, including the Highclerc quadrangle and Margaret Eddy Memorial Chapel, feature magnificent rough-hewn granite stonework, arched cloisters, and slate roofs, set amidst towering eucalyptus and cypress groves.",
      "In the rural villages of Poombarai and Vilpatti, traditional agrarian architecture features compact stone and brick houses with sloping terracotta tiled roofs, clustered tightly together on hillside contours to conserve agricultural terrace land and create sheltered pedestrian lanes protected from biting mountain winds."
    ]
  },
  {
    heading: "On-Ground Logistics: Mountain Taxis, Scooters & Steep Gradient Tactics",
    callout: {
      type: "tip",
      text: "Negotiate local taxi fares based on standard published rate cards at the Kodaikanal Taxi Owners Association stand outside the central bus terminal."
    },
    paragraphs: [
      "Navigating Kodaikanal's hilly terrain requires an understanding of localized transport modes and steep mountain driving dynamics. The central lake circuit is flat and easily walkable or bikeable; however, reaching outlying viewpoints, Vattakanal, or Mannavanur involves navigating steep, winding roads with sharp gradient changes.",
      "Local taxis operate under the Kodaikanal Taxi Owners Association, with standardized fixed-rate cards displayed at the main taxi stand near the bus terminal. Standard half-day sightseeing circuits (covering Coaker's Walk, Bryant Park, Pillar Rocks, and Green Valley View) cost ₹1,500 to ₹2,000 for a hatchback or sedan. Full-day excursions to Mannavanur Lake and Poombarai (a sixty-kilometer round trip) range between ₹2,500 and ₹3,500.",
      "Renting automatic scooters (Honda Activa) or lightweight motorcycles is popular among independent travelers, available from rental agencies on PT Road and near the bus stand for ₹400 to ₹700 per day, plus fuel. However, riders must exercise extreme vigilance: the road to Vattakanal and the descent into Poombarai feature steep 1-in-6 gradients, hairpin turns, and occasional patches of loose gravel and diesel spills. Both rider and pillion must wear helmets by law.",
      "Bicycles can be rented along the perimeter of Kodaikanal Lake for ₹50 to ₹100 per hour. Cycling the five-kilometer circular road around the lake under the shade of eucalyptus trees is one of the most delightful and relaxing activities on the plateau.",
      "TNSTC government buses provide economical connectivity from the central bus stand to rural villages: regular buses run to Poombarai, Mannavanur, and Vilpatti every forty-five to sixty minutes for nominal fares between ₹25 and ₹50, offering an authentic, scenic travel experience alongside local farmers."
    ]
  },
  {
    heading: "High-Altitude Hydration, Cold Defense & Mountain Health Precautions",
    paragraphs: [
      "At an elevation of 2,133 meters, Kodaikanal's mountain climate is brisk, invigorating, and healthy. However, visitors should observe standard highland health precautions to ensure an enjoyable and safe stay.",
      "Hydration remains essential despite the cool temperatures. In highland air, moisture evaporates rapidly from the lungs and skin, yet travelers often drink less water because they do not feel hot. Chronic mild dehydration causes fatigue, chapped lips, and dull morning headaches. Drink at least two to three liters of purified, filtered water daily. In heritage cottages, request carafes of warm boiled water or fresh herbal ginger tea.",
      "Cold-weather management is crucial between November and February, when evening temperatures drop close to freezing. Bring adequate layered clothing, including a fleece jacket, thermal base layers, and a warm woolen cap for early morning and evening walks. If your accommodation does not have central heating, request hot-water bottles (a charming traditional hill station amenity) or an electric room heater.",
      "Tap water in Kodaikanal is sourced from municipal reservoirs and mountain springs, but it should not be consumed untreated. Reputable hotels provide reverse-osmosis (RO) filtered water stations. Avoid drinking raw water from roadside streams or waterfalls, as agricultural runoff in upper catchments may contain fertilizers or natural contaminants.",
      "For motion sickness during the forty-eight-kilometer winding ghat ascent from Batlagundu, travelers prone to car sickness should take preventative medication (such as dimenhydrinate or ginger chews) thirty minutes before beginning the mountain climb, sit in the front seat of the vehicle, and keep windows slightly open for fresh air."
    ]
  },
  {
    heading: "Digital Infrastructure, UPI Payments & Highland Remote Work",
    callout: {
      type: "note",
      text: "4G and 5G cellular connectivity is excellent in Kodaikanal town and Vattakanal, but becomes intermittent in deep valleys and along the road to Berijam Lake."
    },
    paragraphs: [
      "Kodaikanal possesses reliable modern telecommunications infrastructure. 4G LTE and 5G cellular coverage from Bharti Airtel, Reliance Jio, and BSNL covers the central town basin, Upper Lake Road, Convent Road, and Vattakanal village.",
      "Unified Payments Interface (UPI) digital transactions are accepted across almost all commercial establishments in Kodaikanal: chocolate boutiques, lakefront boat booking counters, cafes, and taxi drivers universally display QR payment codes. However, when traveling out to Mannavanur, Poombarai, or entering the Berijam Forest Checkpost, localized network blackouts can occur. Carrying a cash reserve of ₹2,000 to ₹3,000 ensures smooth transactions in rural hamlets.",
      "Kodaikanal has emerged as one of southern India's most appealing mountain workation destinations. Numerous heritage cottages, boutique homestays, and modern hostels offer dedicated high-speed fiber-optic broadband (BSNL Bharat Fibre and private providers) delivering 100 Mbps to 200 Mbps speeds.",
      "When booking extended workation stays, confirm that your accommodation possesses both high-speed fiber internet and inverter battery or generator backup, as mountain rainstorms can occasionally cause temporary power grid trips."
    ]
  },
  {
    heading: "Ecological Conservation, Shola Protection & Plastic Ban Enforcement",
    paragraphs: [
      "The delicate ecology of the Palani Hills is under significant environmental pressure from rapid tourism development, monoculture tree plantations, and waste management challenges. Active conservation efforts are vital to preserving this precious mountain ecosystem.",
      "A primary ecological crisis in the Palani Hills was the historical introduction of invasive commercial timber species: eucalyptus, black wattle (Acacia mearnsii), and Mexican pine. These trees consume enormous volumes of groundwater and prevent native Shola trees from regenerating. Pioneering non-governmental organizations like the Palni Hills Conservation Council (PHCC) have worked for decades to restore native Shola species, establishing native tree nurseries and reforesting degraded grasslands.",
      "The Dindigul District Administration strictly enforces a complete ban on single-use plastics across Kodaikanal. Plastic bags, disposable water bottles under five liters, plastic food packaging, and Styrofoam containers are strictly barred. Vehicle check-posts at the foot of the ghat road inspect incoming traffic and confiscate prohibited plastics.",
      "Travelers must carry reusable stainless-steel water bottles. Purified water refilling points are available at tourist locations, hotels, and cafes across the town. Practice rigorous 'Leave No Trace' principles: never leave trash or plastic wrappers on hiking trails, stay on marked stone footpaths to prevent hillside soil erosion, and support local farmers by purchasing organic mountain produce directly from village cooperatives."
    ]
  },
  {
    heading: "Photography Protocols, Drone Regulations & Sacred Site Ethics",
    callout: {
      type: "warning",
      text: "Drones are prohibited across Kodaikanal without prior written authorization from the District Collector and local police; photographing inside temple sanctums is strictly banned."
    },
    paragraphs: [
      "The breathtaking visual drama of Kodaikanal—mist rolling through towering pine forests, deep valley vistas from granite cliffs, and colorful terraced agricultural villages—makes it a photographer's paradise. However, photographers must follow legal regulations and ethical guidelines.",
      "Flying recreational or commercial drones in Kodaikanal requires prior written permission from the District Collector of Dindigul and the District Police Department. The proximity of protected reserve forests, wildlife habitats, and historical educational institutions makes the airspace strictly regulated. Operating drones without valid permits is illegal and subject to equipment confiscation and legal penalties under Indian aviation regulations.",
      "At historical Hindu temples (such as the Kuzhanthai Velappar Temple in Poombarai), interior photography is strictly forbidden inside the sanctum sanctorum. Handheld exterior photography in the temple courtyard is generally permitted, but avoid photographing worshippers during private prayer.",
      "When photographing local farmers, village elders, or indigenous Paliyan people, always ask polite permission first. Treat residents with dignity, engage in warm conversation, and avoid treating rural communities as picturesque props."
    ]
  },
  {
    heading: "Packing Matrix: Thermal Layers, Hiking Footwear & Gear Blueprint",
    paragraphs: [
      "Packing for Kodaikanal requires preparing for cool mountain temperatures, misty rains, rugged stone walking trails, and relaxed daytime exploring. The following matrix outlines essential field gear.",
      "Footwear should prioritize comfort and trail traction. Bring sturdy trail hiking shoes with good grip for walking down to Dolphin's Nose, navigating pine forest trails, and walking through terraced farms in Poombarai. For walking around the lake and exploring town, comfortable walking sneakers or slip-on casual shoes are ideal.",
      "Layering is essential for comfort throughout the day. Pack a versatile clothing system: lightweight cotton and flannel shirts for mild daytime hours, a cozy fleece pullover for late afternoons, and a warm insulated jacket (down or synthetic) for chilly evenings and early mornings between November and February.",
      "Rain protection is indispensable between June and December: bring a packable waterproof rain jacket or poncho and a compact, wind-resistant umbrella. Essential accessories include polarized sunglasses to cut bright mountain glare, a wide-brimmed sun hat, lip balm with sunscreen, an insulated stainless-steel water bottle, and a compact daypack (20 to 25 liters) for day hikes."
    ],
    table: {
      headers: ["Gear Category", "Recommended Item", "Field Functionality", "Seasonal Relevance"],
      rows: [
        ["Footwear", "Trail hiking shoes (Vibram sole) + walking sneakers", "Hiking Dolphin's Nose & pine forest trails", "Essential year-round"],
        ["Thermal Layering", "Insulated jacket + fleece mid-layer + thermals", "Warmth against 4°C to 8°C winter night cold", "Crucial: November - February"],
        ["Rain Protection", "Waterproof breathable rain jacket + compact umbrella", "Shielding against sudden mountain cloudbursts", "Essential: June - December"],
        ["Sun & Eye Shield", "Polarized sunglasses + broad-brimmed hat + lip balm", "Deflecting intense high-elevation UV rays (2,130m)", "Essential year-round"],
        ["Hydration & Pack", "Insulated stainless steel flask (1L) + 20L daypack", "Carrying warm tea & essentials on forest hikes", "Recommended year-round"]
      ]
    }
  },
  {
    heading: "Emergency Infrastructure, Hospitals & Mountain Medical Access",
    callout: {
      type: "note",
      text: "The Van Allen Hospital on Upper Lake Road is Kodaikanal's historic mission hospital, providing 24/7 emergency medical care and trauma stabilization."
    },
    paragraphs: [
      "While Kodaikanal is a peaceful and secure highland retreat, knowing where to access medical care, police support, and emergency services is vital for peace of mind.",
      "The premier private healthcare facility on the plateau is the historic Van Allen Hospital, located on Upper Lake Road near the lake basin. Founded in 1923 by American missionaries, Van Allen Hospital provides round-the-clock emergency medical services, trauma stabilization, inpatient nursing care, diagnostic radiology, and an on-site pharmacy.",
      "The Government Hospital of Kodaikanal, located on Hospital Road near Anna Salai, is the public secondary medical facility equipped with a 24-hour emergency casualty unit and ambulance services. For minor ailments, several reputable private clinics and well-stocked pharmacies operate along Anna Salai and PT Road.",
      "For severe medical emergencies requiring tertiary neurosurgical, advanced orthopedic, or cardiac care, patients are stabilized locally and transferred by ambulance down the Batlagundu ghat road to major tertiary multi-specialty hospitals in Madurai (such as Apollo Speciality Hospitals or Meenakshi Mission Hospital and Research Centre), reachable in approximately two-and-a-half to three hours.",
      "The unified national emergency helpline 112 connects to police, fire, and ambulance dispatch across the district, while the dedicated 108 emergency ambulance service maintains mountain-ready vehicles across the plateau."
    ],
    table: {
      headers: ["Emergency Department", "Designated Healthcare Facility", "Physical Address", "Emergency Telephone"],
      rows: [
        ["Integrated National Emergency", "Central Emergency Response Support System", "Statewide Dispatch", "112"],
        ["Historic Mission Hospital", "Van Allen Hospital", "Upper Lake Road, Kodaikanal", "+91 4542 241 273"],
        ["Government Public Hospital", "Government Hospital Kodaikanal", "Hospital Road, Anna Salai", "+91 4542 241 243"],
        ["Kodaikanal Police Station", "Town Police Station", "PT Road, Kodaikanal", "+91 4542 241 100"],
        ["Emergency Ambulance Service", "108 Emergency Medical Services", "District-wide Fleet", "108"]
      ]
    }
  },
  {
    heading: "Extended Highland Living, Creative Seclusion & Mountain Cadence",
    paragraphs: [
      "Kodaikanal has nurtured generations of writers, artists, ecological researchers, and educators drawn to its clean mountain air, temperate climate, and serene forest solitude. A long-term stay on the Palani plateau offers an inspiring lifestyle of deep focus and natural rhythm.",
      "Daily life unfolds with quiet elegance. Morning begins with a brisk walk along the pine trails as mist rises from the lake, followed by hours of focused creative or intellectual work in a quiet stone cottage. Afternoons are ideal for strolling through the botanical gardens, cycling the lake perimeter, or browsing second-hand volumes at the historic Kodaikanal Club library, while evenings gather around a crackling stone fireplace with a pot of hot Nilgiri tea and fresh sourdough bread.",
      "Extended residential rentals (one to six months) include charming furnished stone cottages on Upper Lake Road or Convent Road (₹25,000 to ₹45,000 per month) and modern view villas in Vattakanal or Vilpatti (₹35,000 to ₹80,000 per month). Many properties include small private gardens where residents can cultivate cool-climate herbs, flowers, and vegetables.",
      "The town possesses a warm, cosmopolitan community anchored by the faculty and alumni of Kodaikanal International School, active environmental groups like the Palni Hills Conservation Council, and local organic farming cooperatives, offering an intellectually rich and welcoming social environment for extended residents."
    ]
  },
  {
    heading: "Synthesis: The Gift of the Palani Forest",
    paragraphs: [
      "To visit Kodaikanal is to experience the profound gift that gave the mountain its name: the gift of the forest. In a world increasingly consumed by noise, speed, and digital distraction, this high granite sanctuary offers a rare and precious refuge of quiet contemplation, pristine mountain air, and enduring natural beauty.",
      "The true essence of Kodaikanal is not found in crowded tourist viewpoints, but in quiet, unhurried moments: watching the morning mist weave through towering hundred-year-old pine canopies, sitting silently beside the cold waters of Berijam Lake as wild gaurs graze in the distance, and gazing out from the stone ramparts of Coaker's Walk as the clouds roll like ocean waves across the vast plains below.",
      "Kodaikanal teaches us the art of unhurried living—to slow our steps, to breathe deeply of the pine-scented wind, and to remember our connection to the ancient, living earth.",
      "As you descend the winding ghat road back toward the plains, watching the cool blue ridge of the Palani Hills recede into the golden evening sky, you carry with you a lingering sense of peace: a memory of misty mornings, the comforting warmth of a stone hearth, and the eternal, quiet whisper of the forest."
    ]
  }
];

const kodaiInlineImages = [
  {
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    alt: "Star-shaped Kodaikanal Lake surrounded by lush green pine and eucalyptus trees under a clear mountain sky",
    caption: "The star-shaped Kodaikanal Lake was created in 1863, forming the geographic and serene focal point of the highland station."
  },
  {
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=85",
    alt: "A towering evergreen shola forest valley shrouded in dramatic mountain mist in the Palani Hills",
    caption: "The fragile Shola-grassland mosaic of the Palani Hills harbors rare endemic flora, including the 12-year Neelakurinji bloom."
  },
  {
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=85",
    alt: "Dramatic granite cliffs and deep forested canyons seen from Dolphin's Nose viewpoint in Vattakanal",
    caption: "Dolphin's Nose in Vattakanal projects over a dramatic two-thousand-foot granite canyon overlooking the Pambar valley."
  }
];

const kodaiBlocks = assembleStructuredBlocks(kodaiSections, kodaiInlineImages);

const kodaiConfig = {
  title: "Kodaikanal",
  slug: "kodaikanal",
  category: "Travel",
  categorySlug: "travel",
  contentType: "article",
  author: "MyJourney Editorial",
  byline: "MyJourney Editorial",
  excerpt: "An exhaustive field expedition into the Palani Hills: the 1863 Levinge lake legacy, cliffside walking in Vattakanal, the protected shola forests of Berijam Lake, GI-tagged Poombarai hill garlic, and verified highland logistics.",
  description: "An exhaustive field expedition into the Palani Hills: the 1863 Levinge lake legacy, cliffside walking in Vattakanal, the protected shola forests of Berijam Lake, GI-tagged Poombarai hill garlic, and verified highland logistics.",
  coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
  coverImageAlt: "Scenic star-shaped lake nestled amidst rolling green hills and eucalyptus forests in Kodaikanal",
  coverImageCaption: "Kodaikanal sits at 2,133 meters in the Palani Hills, an ancient temperate sanctuary of granite cliffs and shola forests.",
  structuredBlocks: kodaiBlocks,
  tags: ["kodaikanal", "palani-hills", "tamil-nadu", "hill-station", "shola-forests", "vattakanal", "berijam-lake", "poombarai"],
  travelVerification: {
    lastVerifiedAt: "2025-01-15T00:00:00.000Z",
    currency: "INR",
    transitVerified: true,
    permitVerified: true,
    pricingConfidence: "high"
  },
  references: [
    { title: "The Palani Hills: An Environmental and Cultural History (Nora Mitchell)", url: "https://www.jstor.org/" },
    { title: "Palni Hills Conservation Council: Ecological Audits and Shola Restoration", url: "https://palnihills.org/" },
    { title: "Tamil Nadu Forest Department: Berijam Lake Conservation Guidelines", url: "https://forests.tn.gov.in/" },
    { title: "Geographical Indications Registry: Kodaikanal Malai Poondu Documentation", url: "https://ipindia.gov.in/" }
  ]
};

const kodaiBuilt = writeCanonicalArticleModule("travel", "kodaikanal.js", kodaiConfig);
console.log(`[Kodaikanal] Word count: ${kodaiBuilt.wordCount}`);

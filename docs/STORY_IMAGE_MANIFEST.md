# Story Image Manifest & Visual Continuity Guide

This document maintains character, environmental, and narrative visual continuity for the 10 canonical MyJourney Life launch stories.

All illustrations and photography assets strictly respect character ages, physical motifs, geographic realism, socioeconomic context, and narrative timeframes.

---

## 1. Visual Character & Environmental Continuity Standard

Across all multi-image stories, character and world elements maintain strict physical fidelity:
- **Character Continuity**: Protagonists depicted across different years maintain facial geometry, skin tone, hair progression, and era-appropriate dress.
- **Socioeconomic Realism**: Early life moments feature authentic middle-class artifacts (rusted tin KSRTC bus shelters, Sheesham school desks, Chetak scooters, HMT Janata watches, Rs 180 ruled notebooks). Later career scenes reflect precise contemporary realities (Cyber City glass towers, Bangalore craft breweries, Gurgaon high-rise penthouses, Lucknow ancestral courtyards).
- **Zero Generic Repetition**: Every scene image is dedicated to an exact narrative turning point in the story text. No image is reused across different stories or unrelated scenes.
- **Monochrome & Neutral Typography Integrity**: Story layouts express their visual personality through spatial structure, asymmetric margins, split columns, and editorial figure placements before decorative color accents are applied.
- **Aspect-Ratio & CLS Contract**: All assets declare true intrinsic source dimensions (`imageWidth` and `imageHeight`) alongside their editorial presentation aspect ratio. Browsers reserve the exact visual box before media download, preventing Cumulative Layout Shift (CLS).

---

## 2. Launch Catalog Media Inventory Summary

| # | Story Title | Layout Preset | Engine | Hero Image | Scene Images | Total Media | Asset Types |
|---|---|---|---|---|---|---|---|
| 1 | The Report Card in the Drawer | chapter-journey | chapter-flow | Unsplash Cover | 2 Generated Assets | 3 | 1 Curated, 2 Final Generated |
| 2 | The Friend Who Stopped Waiting | alternating-editorial | split-right | Unsplash Cover | 2 Generated Assets | 3 | 1 Curated, 2 Final Generated |
| 3 | The Last Bench Promise | scene-by-scene | chapter-flow | Unsplash Cover | 1 Generated, 2 Curated | 4 | 3 Curated, 1 Final Generated |
| 4 | The House with Two Expectations | editorial-sidebar | side-rail | Unsplash Rail | 1 Generated, 1 Curated | 3 | 2 Curated, 1 Final Generated |
| 5 | The First Salary Envelope | book-page | prose | Unsplash Cover | 1 Generated, 1 Curated | 3 | 2 Curated, 1 Final Generated |
| 6 | The City That Knew Nobody | cinematic-rhythm | split-right | Unsplash Cover | 1 Generated, 2 Curated | 4 | 3 Curated, 1 Final Generated |
| 7 | The Message Left Unsent | letter-memory | prose | Unsplash Cover | 1 Generated, 1 Curated | 3 | 2 Curated, 1 Final Generated |
| 8 | The Friend Who Became Successful First | triple-rhythm | split-right | Unsplash Cover | 1 Generated, 1 Curated | 3 | 2 Curated, 1 Final Generated |
| 9 | The Wedding Before the Dream | mixed-editorial | chapter-flow | Unsplash Cover | 1 Generated, 2 Curated | 4 | 3 Curated, 1 Final Generated |
| 10 | The Raise That Made Him Poorer | alternating-wide-moment | split-right | Unsplash Cover | 2 Generated, 1 Curated | 4 | 2 Curated, 2 Final Generated |
| **Total** | **10 Stories** | **10 Distinct Presets** | — | **10 Heroes** | **24 Scene Images** | **34 Media Assets** | **21 Curated, 13 Final Generated** |
| 11 | The Room Between Two People | alternating-editorial | split-right | Unsplash Cover | 3 Curated | 4 | 4 Curated Editorial |
| 12 | The Child Who Watched Everything | scene-by-scene | chapter-flow | Unsplash Cover | 3 Curated | 4 | 4 Curated Editorial |
| 13 | The Promotion Nobody Celebrated | editorial-sidebar | side-rail | Unsplash Cover | 7 Curated | 8 | 8 Curated Editorial |
| 14 | The Brother Who Signed the Papers | triple-rhythm | split-right | Unsplash Cover | 8 Curated | 9 | 9 Curated Editorial |
| 15 | The Hospital Corridor at 3:17 AM | cinematic-rhythm | split-right | Unsplash Cover | 10 Curated | 11 | 11 Curated Editorial |
| **Total** | **15 Stories** | **10 Distinct Presets** | — | **15 Heroes** | **55 Scene Images** | **70 Media Assets** | **57 Curated, 13 Final Generated** |

---

## 3. Story-Specific Media Maps

### 1. The Report Card in the Drawer
- **Slug**: `the-report-card-in-the-drawer`
- **Layout Preset**: `chapter-journey`
- **Cover Image**: https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A sharpened graphite pencil centered vertically on white paper
- **Cover Dimensions**: Intrinsic: 1600x2400 (Source Aspect: 2:3) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (June 1987 — The Afternoon)**:
    - **Asset**: https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A sharpened graphite pencil with white wooden barrel centered vertically on white paper
    - **Caption**: The envelope had been opened without ceremony. Sixty-three out of a hundred.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x2400 (Source Aspect: 2:3)
    - **Presentation Aspect**: 2:3 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 4 (August 1987 — The Bus Stop)**:
    - **Asset**: /uploads/stories/report-card-bus-stop.jpg
    - **Alt**: A South Indian schoolboy holding an umbrella under a rusted tin bus shelter in heavy monsoon rain
    - **Caption**: August 1987. The KSRTC bus rumbling through red mud water, and twenty-two minutes before he had to be home.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 11 (The Bottom Drawer)**:
    - **Asset**: /uploads/stories/report-card-brass-box.jpg
    - **Alt**: An antique carved brass lockbox on a dark wooden desk beside a fountain pen and notebook
    - **Caption**: The bottom drawer of the teak sideboard. Forty years of silence kept inside a brass box with three keys.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)

### 2. The Friend Who Stopped Waiting
- **Slug**: `the-friend-who-stopped-waiting`
- **Layout Preset**: `alternating-editorial`
- **Cover Image**: https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A modern freestanding stone bathtub set on white river pebbles beside a potted palm
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (Now — The Vocabulary of Drift)**:
    - **Asset**: https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A modern freestanding stone bathtub set on white river pebbles beside a potted palm against a concrete wall
    - **Caption**: The third-floor balcony apartment in Chennai. Two cups of black tea that had gone cold forty minutes ago.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 3 (1998 — The Geometry of the Laboratory)**:
    - **Asset**: /uploads/stories/friend-biology-lab.jpg
    - **Alt**: Two high school students in white lab coats examining specimens with a vintage brass microscope
    - **Caption**: The botany laboratory in 1998. Dissecting hibiscus flowers while deciding what life outside Madurai might look like.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1200x896 (Source Aspect: ~4:3)
    - **Presentation Aspect**: 4:3 (medium)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 4 (Now — The Blue Notebook)**:
    - **Asset**: /uploads/stories/friend-blue-notebook.jpg
    - **Alt**: An open botanical field notebook with pressed flower specimens and detailed sketches beside a fountain pen
    - **Caption**: The blue ruled notebook from 2004. Twelve dried bougainvillea petals pressed between pages of handwritten dreams.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)

### 3. The Last Bench Promise
- **Slug**: `the-last-bench-promise`
- **Layout Preset**: `scene-by-scene`
- **Cover Image**: https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: An empty classroom with wooden student desks arranged in rows facing a chalkboard
- **Cover Dimensions**: Intrinsic: 1600x900 (Source Aspect: 16:9) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (Scene 1: The Gold Card on the Screen (2024))**:
    - **Asset**: https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An empty classroom viewed down the center aisle with wooden desks facing a chalkboard and podium
    - **Caption**: Section 9B, afternoon light. The back row where two boys decided mathematics was a negotiable reality.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x900 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 1 (Scene 2: Room 9, Class 9B (1998))**:
    - **Asset**: /uploads/stories/bench-school-desk.jpg
    - **Alt**: A weathered wooden school desk with initials carved into the wood beside an open notebook and pen
    - **Caption**: The corner desk carved with initials. DM + SQ 1994 still legible beneath coats of varnish.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1200x896 (Source Aspect: ~4:3)
    - **Presentation Aspect**: 4:3 (medium)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 7 (Scene 4: The Last Day of Class 9B (1998))**:
    - **Asset**: https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Students seated in a classroom seen from behind while a teacher explains a lesson at the whiteboard
    - **Caption**: Class 11 revision hour. Forty-two students copying trigonometry formulas while two planned a startup.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x996 (Source Aspect: 16:10)
    - **Presentation Aspect**: 16:10 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 13 (Scene 7: Paper Cups at Midnight (2024))**:
    - **Asset**: https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A cup of coffee on a saucer resting on white bed linens beside a folded duvet and flowers
    - **Caption**: Morning coffee in the guest room in Pune. The conversation after twenty years that took forty-five minutes to start.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x2133 (Source Aspect: 3:4)
    - **Presentation Aspect**: 3:4 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 4. The House with Two Expectations
- **Slug**: `the-house-with-two-expectations`
- **Layout Preset**: `editorial-sidebar`
- **Cover Image**: https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A minimalist living room with a black loveseat, potted indoor tree, and white chest of drawers
- **Cover Dimensions**: Intrinsic: 1600x1068 (Source Aspect: 3:2) | Presentation: Responsive Rail
- **Media Moments**:
  - **Section 0 (Chapter I: The House on P.S. Sivaswamy Salai)**:
    - **Asset**: /uploads/stories/house-sewing-machine.jpg
    - **Alt**: An elderly Indian woman in a cotton sari working at a black vintage treadle sewing machine on a veranda
    - **Caption**: The east veranda in Mandaveli. Four decades of salwar suits measured with the same wooden tailor rule.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 11 (Chapter IV: The Attic Staircase)**:
    - **Asset**: https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A classical oil painting of an elaborate floral bouquet in a vase on a stone ledge
    - **Caption**: The attic staircase. Sixty-four stretched canvases wrapped in butter paper, never shown to the family.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x2276 (Source Aspect: ~3:4)
    - **Presentation Aspect**: 3:4 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 5. The First Salary Envelope
- **Slug**: `the-first-salary-envelope`
- **Layout Preset**: `book-page`
- **Cover Image**: https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A small green plant shoot growing out of a pile of silver and copper coins
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (Page 1: 11:04 AM, Friday)**:
    - **Asset**: https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A small green plant seedling sprouting from a pile of silver and copper coins on a white surface
    - **Caption**: The initial deposit of ₹4,200. The crisp brown envelope delivered to his mother hands on a humid July evening.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 4 (The Sindhi Camp Depot at 5 AM)**:
    - **Asset**: https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A modern passenger coach bus with headlights illuminated parked at dusk against a mountain backdrop
    - **Caption**: Sindhi Camp depot, Jaipur, at five in the morning. Rakesh Sharma checking the oil pressure of Bus 4812.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1069 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 17 (Page 6: The ₹180 Notebook)**:
    - **Asset**: /uploads/stories/salary-accounts-notebook.jpg
    - **Alt**: An open accounting ledger with handwritten financial entries beside a paper envelope and fountain pen
    - **Caption**: The ₹180 black buckram notebook. Seven lines of entries that balanced twenty-four years of debt.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1200x896 (Source Aspect: ~4:3)
    - **Presentation Aspect**: 4:3 (medium)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)

### 6. The City That Knew Nobody
- **Slug**: `the-city-that-knew-nobody`
- **Layout Preset**: `cinematic-rhythm`
- **Cover Image**: https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: The Gateway of India monument in Mumbai at sunset with people gathered in the foreground
- **Cover Dimensions**: Intrinsic: 1600x2133 (Source Aspect: 3:4) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Platform with Seven Thousand Taxis)**:
    - **Asset**: https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=85
    - **Alt**: The Gateway of India monument in Mumbai at sunset with crowds gathered on the plaza under a pink evening sky
    - **Caption**: Mumbai. The city arriving through every window at once.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x2133 (Source Aspect: 3:4)
    - **Presentation Aspect**: 3:4 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 6 (V. Lower Parel: The Fire Escape Factory)**:
    - **Asset**: https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An architect drafting blueprints and floor plans on a wooden table with drafting instruments
    - **Caption**: The Lower Parel studio. Fourteen-foot ceilings, structural drawings, and seventy hours a week.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x900 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 9 (VI. Santosh Kaka and the Dadar Flower Market)**:
    - **Asset**: /uploads/stories/city-dadar-tea-stall.jpg
    - **Alt**: A roadside tea stall with a boiling brass kettle, wire glass rack, and baskets of fresh orange marigolds
    - **Caption**: Santosh Kaka tea stall by the flower market bridge. Two cutting chais and fifteen minutes of silence.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1200x896 (Source Aspect: ~4:3)
    - **Presentation Aspect**: 4:3 (medium)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 13 (IX. The Sunset at Bandra Bandstand)**:
    - **Asset**: https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Gentle ocean waves washing over a sandy shoreline under a soft pastel sky at sunrise
    - **Caption**: Bandra Bandstand at low tide. The Arabian Sea turning copper, and the city finally quiet.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1064 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 7. The Message Left Unsent
- **Slug**: `the-message-left-unsent`
- **Layout Preset**: `letter-memory`
- **Cover Image**: https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: An open lined notebook with handwritten notes, a fountain pen, and reading glasses on a desk
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Ghost in the Sidebar)**:
    - **Asset**: https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An open notebook with lined paper, handwritten notes, a gold-nib fountain pen, and reading glasses
    - **Caption**: The Drafts folder that stayed at 1. Delhi, two in the morning.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 2 (II. The Ber Sarai Years)**:
    - **Asset**: https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Top-down view of black coffee in a white ceramic mug on a dark rustic wood surface
    - **Caption**: The Ber Sarai rooftop terrace. Photocopied readings held down by a river stone, and chai in chipped mugs.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x2400 (Source Aspect: 2:3)
    - **Presentation Aspect**: 2:3 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 7 (IV. The Sunday in Daryaganj and the Airport)**:
    - **Asset**: /uploads/stories/message-daryaganj-book.jpg
    - **Alt**: An open vintage hardcover book displayed on a pavement stall with a handwritten inscription on the page
    - **Caption**: The Daryaganj Sunday book market. To Ananya Sen. Keep reading, keep dreaming. November 2016.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)

### 8. The Friend Who Became Successful First
- **Slug**: `the-friend-who-became-successful-first`
- **Layout Preset**: `triple-rhythm`
- **Cover Image**: https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: Two friends sitting together on an urban building rooftop at dusk overlooking city lights
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. Movement One: The Terrace of Equals (2016))**:
    - **Asset**: https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Two friends sitting together on a rooftop fire escape against an urban twilight cityscape
    - **Caption**: Movement One: Two plastic chairs on the asbestos roof. The company existed only on a whiteboard.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 5 (III. Movement Two: The Series A Tab (2019))**:
    - **Asset**: /uploads/stories/successful-bar-tab.jpg
    - **Alt**: A black credit card resting on an open leather bill folder with a printed receipt on a dark wood table
    - **Caption**: Movement Two: The Series A celebration on 100 Feet Road. The bill paid before Siddharth could reach his wallet.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 15 (VII. The True Ledger (2024))**:
    - **Asset**: https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Illuminated skyscraper windows at night viewed through a metal railing
    - **Caption**: Movement Three: The fire escape of the Indiranagar penthouse. Two paper cups, after the valuation fell.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x2001 (Source Aspect: 4:5)
    - **Presentation Aspect**: 4:5 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 9. The Wedding Before the Dream
- **Slug**: `the-wedding-before-the-dream`
- **Layout Preset**: `mixed-editorial`
- **Cover Image**: https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: An elegant outdoor venue with floral arrangements and chairs arranged under trees
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Clock in Qaiserbagh)**:
    - **Asset**: https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An elegant outdoor garden setting with chairs and floral decorations under soft daylight
    - **Caption**: The mahogany grandfather clock in the Qaiserbagh lightwell. It had measured four generations of family compromise.
    - **Placement**: right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 2 (II. Sunita and the Suheli Reeds)**:
    - **Asset**: https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Misty morning fog over a dense forest river valley and wetlands at sunrise
    - **Caption**: Dudhwa National Park. The Suheli river transect lines where Sunita spent her doctoral years.
    - **Placement**: left
    - **Intrinsic Dimensions**: 1600x953 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 5 (III. The Wedding and the Silent Expectation)**:
    - **Asset**: https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Folded traditional Indian silk garments showcasing intricate gold zari embroidery
    - **Caption**: The bridal Banarasi sarees in sandalwood trunks, with field binoculars hidden beneath the silk.
    - **Placement**: right
    - **Intrinsic Dimensions**: 1600x2400 (Source Aspect: 2:3)
    - **Presentation Aspect**: 2:3 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 18 (VIII. The Binoculars on the Cedar Desk)**:
    - **Asset**: /uploads/stories/wedding-binoculars-desk.jpg
    - **Alt**: A pair of black field binoculars resting on a rustic wooden veranda table overlooking misty forest trees
    - **Caption**: Sonaripur rest house veranda at dawn. The binoculars resting openly on the cedar writing desk.
    - **Placement**: inline
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)

### 10. The Raise That Made Him Poorer
- **Slug**: `the-raise-that-made-him-poorer`
- **Layout Preset**: `alternating-wide-moment`
- **Cover Image**: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A modern glass and steel commercial skyscraper rising toward the sky
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Encrypted PDF with the New Number)**:
    - **Asset**: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A modern glass and steel commercial skyscraper reaching upward into a clear sky
    - **Caption**: Cyber City at seven in the evening. The promotion letter arrived as a password-protected PDF.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 2 (II. The Meerut Scooters and the Chetak)**:
    - **Asset**: https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A vintage cruiser motorcycle parked beside an old brick wall
    - **Caption**: Sector 14, Meerut, 1996. The grey Bajaj Chetak and the monthly household ledger that never went into the red.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 10 (V. The 2:00 AM Spreadsheet)**:
    - **Asset**: /uploads/stories/raise-2am-spreadsheet.jpg
    - **Alt**: A glowing laptop displaying a financial spreadsheet on a table at night with city skyline lights outside
    - **Caption**: The 2:00 AM spreadsheet at The Pinnacle Crest. Negative monthly cash flow despite the highest salary in the family history.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1376x768 (Source Aspect: 16:9)
    - **Presentation Aspect**: 16:9 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)
  - **Section 13 (VI. The Father Arrival and the Janata Watch)**:
    - **Asset**: /uploads/stories/raise-janata-watch.jpg
    - **Alt**: A vintage mechanical wristwatch with a white dial and black leather strap resting on a marble surface
    - **Caption**: The HMT Janata watch on the marble coaster. Ticking quietly through forty-one years of service.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1200x896 (Source Aspect: ~4:3)
    - **Presentation Aspect**: 4:3 (medium)
    - **Editorial Status**: Final
    - **Storage Status**: local/dev, pending production object storage (Phase 18)

### 11. The Room Between Two People
- **Slug**: `the-room-between-two-people`
- **Layout Preset**: `alternating-editorial`
- **Cover Image**: https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: Interior doorway between two quiet living spaces with filtered morning light
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Sound of the Front Door at 7:15 AM)**:
    - **Asset**: https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Interior doorway between two quiet living spaces with filtered morning light
    - **Caption**: The flat in Indiranagar, 7:15 in the morning. Ten years of shared geometry, and four inches of open door.
    - **Placement**: split-right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 4 (III. The Kitchen at 11:30 PM)**:
    - **Asset**: https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A quiet apartment interior with a wooden dining table and filtered afternoon light
    - **Caption**: The dining table at midnight. Cold yellow dal, two stainless steel spoons, and the unspoken ledger.
    - **Placement**: split-left
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 10 (VI. The Notebook on the Balcony Ledge)**:
    - **Asset**: https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An open notebook and a single ceramic coffee mug resting on a balcony ledge overlooking twilight trees
    - **Caption**: Dawn over Indiranagar. The open notebook, and the realization that civility can be a form of abandonment.
    - **Placement**: split-right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 12. The Child Who Watched Everything
- **Slug**: `the-child-who-watched-everything`
- **Layout Preset**: `scene-by-scene`
- **Cover Image**: https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A young child looking out through a rain-streaked windowpane
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Blue Formica Dining Table)**:
    - **Asset**: https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A child looking out through a rain-streaked glass windowpane in soft daylight
    - **Caption**: The rain against the bedroom pane. A nine-year-old child learning to read the barometric pressure of adults.
    - **Placement**: inline
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 4 (III. The Hallway and the Whispering Kitchen)**:
    - **Asset**: https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A dim hallway looking toward a warm doorway illuminated from an adjacent room
    - **Caption**: The dark hallway outside the kitchen door. The sound of a stainless steel lid placed down without a click.
    - **Placement**: inline
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 8 (V. The Balcony at Twilight)**:
    - **Asset**: https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Two adults standing near a balcony rail seen from behind from a lower perspective
    - **Caption**: The balcony in Mayur Vihar at dusk. Two adults standing three feet apart, pretending everything is normal.
    - **Placement**: inline
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 13. The Promotion Nobody Celebrated
- **Slug**: `the-promotion-nobody-celebrated`
- **Layout Preset**: `editorial-sidebar`
- **Cover Image**: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A commercial skyscraper with lit windows rising into a dusk sky
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. Band 9 and the Boardroom in Tower 4B)**:
    - **Asset**: https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An empty corporate boardroom with modern leather chairs and night skyline views through floor-to-ceiling glass
    - **Caption**: Tower 4B, Cyber City, 9:15 in the morning. Managing Director and Head of Quantitative Risk.
    - **Placement**: sidebar
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 4 (III. The Slack Channel with Forty-Two Reactions)**:
    - **Asset**: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A modern commercial high-rise tower seen from a low perspective at twilight
    - **Caption**: Five o'clock company-wide email. Forty-two Slack celebrations, and zero missed calls on the personal phone.
    - **Placement**: sidebar
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 8 (V. Sudhir Malhotra and the Two Potted Ferns)**:
    - **Asset**: https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An empty corporate parking basement with concrete pillars and distant red taillights
    - **Caption**: Basement Level B-2, seven-fifteen in the evening. Two potted ferns and eleven years of service packed into a trunk.
    - **Placement**: sidebar
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 2:3 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 14 (VIII. The Yellow Dal at the Sector Fifty-Four Diner)**:
    - **Asset**: https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A lonely highway through a car windshield with streetlights stretching into night haze
    - **Caption**: Sector 54, midnight. One hundred and forty rupees of yellow dal, and the only honest words of the day.
    - **Placement**: sidebar
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 14. The Brother Who Signed the Papers
- **Slug**: `the-brother-who-signed-the-papers`
- **Layout Preset**: `triple-rhythm`
- **Cover Image**: https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: An ancient carved wooden door frame and stone courtyard in early morning light
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. The Sagwan Latch in Sadashiv Peth)**:
    - **Asset**: https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An ancient carved wooden door frame and stone courtyard in early morning light
    - **Caption**: Movement One: Sadashiv Peth, 1938. The Sagwan latch forged in Saswad, and eighty-seven years of family gravity.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 6 (IV. The Queue on the Third Floor)**:
    - **Asset**: https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Government legal documents, stamp duty papers, and ink seals on an office desk
    - **Caption**: Movement Two: The Swargate Sub-Registrar's Office, third floor. Two inches of green stamp paper and forty years of land dust.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 12 (VII. The Walk Through Sadashiv Peth)**:
    - **Asset**: https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Two glass cups of steaming tea on a rustic wooden street table in afternoon sunlight
    - **Caption**: Movement Three: Samarth Tea House, Bajirao Road. Two cutting chais, and the collapse of a fourteen-year ledger.
    - **Placement**: layout-determined
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

### 15. The Hospital Corridor at 3:17 AM
- **Slug**: `the-hospital-corridor-at-3-17-am`
- **Layout Preset**: `cinematic-rhythm`
- **Cover Image**: https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=85
- **Cover Alt**: A quiet, modern hospital corridor with polished floors receding into soft pale light
- **Cover Dimensions**: Intrinsic: 1600x1067 (Source Aspect: 3:2) | Presentation: Responsive Cover
- **Media Moments**:
  - **Section 0 (I. 23:45 — The Blue Plastic Bag)**:
    - **Asset**: https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A quiet, modern hospital corridor with polished floors receding into soft pale light
    - **Caption**: 23:45 — The emergency bay at Dhakuria. One point eight kilograms of blue plastic holding seventy-six years of life.
    - **Placement**: split-right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 2:3 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 2 (II. 00:30 — The Geometry of the Fifth Floor)**:
    - **Asset**: https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=85
    - **Alt**: A view down an empty hospital corridor with clinical doors and reflective vinyl flooring
    - **Caption**: 00:30 — The fifth-floor Neuro-ICU corridor. Forty-five thousand deposit, and a German piston breathing for Bed 7.
    - **Placement**: split-right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 12 (VII. 03:17 — The Dead Hour)**:
    - **Asset**: https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=85
    - **Alt**: An empty hospital corridor bench in the middle of the night under dim fluorescent tubes
    - **Caption**: 03:17 — The Dead Hour. Four keys, a yellow scrap of yarn, and three weeks of silence that cannot be bought back.
    - **Placement**: split-right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 2:3 (portrait)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)
  - **Section 18 (X. 05:30 — The Grey Dawn over the Lake)**:
    - **Asset**: https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1600&q=85
    - **Alt**: Early morning dawn light through a tall window overlooking city trees and distant mist
    - **Caption**: 05:30 — The grey dawn over Dhakuria. Two children holding a blue bag, waiting for the morning.
    - **Placement**: split-right
    - **Intrinsic Dimensions**: 1600x1067 (Source Aspect: 3:2)
    - **Presentation Aspect**: 3:2 (landscape)
    - **Editorial Status**: Final
    - **Storage Status**: Curated Editorial (Unsplash License)

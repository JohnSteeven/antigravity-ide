# Story preset verification

This matrix records the 2026-08-23 structural verification of the existing 30 Story presets. It does not claim visual browser QA. Every preset uses the shared `StoryEngine`/`StoryLayoutRenderer`/`StorySectionRenderer` path, preserves `data-story-layout`, `data-story-engine`, `data-story-mode`, and `data-story-preset`, and maps to one of the six approved engines.

Legend:

- `PASS-S`: source/contract/Jest verified.
- `BQA`: real-browser visual verification remains required in the final browser matrix.
- Light, Dark, and Custom cover semantic token propagation and shared renderer contrast contracts; they do not substitute for screenshot review.
- Premium covers server-side body/section filtering and preservation of preset metadata.

| Preset | Engine | Desktop | Tablet | Mobile | Light | Dark | Custom theme | Media | Quote | Premium | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `classic-reader` | PROSE | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `reader-image-right` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `reader-image-left` | SPLIT LEFT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `editorial-sidebar` | SIDE RAIL | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `alternating-editorial` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `alternating-wide-moment` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `wide-banner-reader` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `magazine-feature` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `visual-story` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `minimal-longform` | PROSE | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `book-page` | PROSE | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `book-spread` | BOOK COLUMNS | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `chapter-journey` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `immersive-moments` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `mixed-editorial` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `portrait-companion-right` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `portrait-companion-left` | SPLIT LEFT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `double-rhythm` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `triple-rhythm` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `five-moment-journey` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `chapter-image-right` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `chapter-image-left` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `chapter-alternating` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `image-notes-rail` | SIDE RAIL | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `editorial-portrait-rail` | SIDE RAIL | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `reflection-with-image` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `letter-memory` | PROSE | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `scene-by-scene` | CHAPTER FLOW | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `journal-reader` | PROSE | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |
| `cinematic-rhythm` | SPLIT RIGHT | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S | PASS-S / BQA |

## Evidence

- `storyLayouts.test.js`: stable IDs, engine mapping, unique preset signatures, placement precedence, 0/1/2/3/5/8 image behavior, API persistence, and required data attributes.
- `storyRenderingContract.test.js`: 430/820/1024/1440/1920 responsive contracts, reader routing, media bounds, CMS/public renderer reuse, structured quote metadata, SEO/body controls, and no slug-specific layout CSS.
- `storyContent.test.js` and `storyMedia.test.js`: legacy normalization, reading time, publish validation, cover/section media, captions/alt text, and structured quote source/style.
- Premium controller/content suites: unauthorized bodies and sections stay server-side while Story layout/preset metadata remains available for the gated preview.

Run:

```bash
npm test -- --runInBand server/tests/storyLayouts.test.js server/tests/storyRenderingContract.test.js server/tests/storyContent.test.js server/tests/storyMedia.test.js server/tests/premiumControllers.test.js server/tests/premiumContent.test.js
```

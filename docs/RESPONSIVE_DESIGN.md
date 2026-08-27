# Responsive design

This document records the repository's responsive intent and verification limits. It is not a claim that every viewport has been visually approved.

## Viewport strategy

- Large desktop: preserve established page composition and use bounded content widths rather than stretching reading surfaces.
- Laptop/tablet: reduce gutters and columns deliberately; discovery-heavy pages may retain wider application layouts.
- Mobile: prioritize the primary task, stack essential content, use drawers for secondary navigation/filtering, and remove only decorative duplication.

Feature CSS remains scoped. Shared semantic colors, focus treatment, the public header, and the Home shell live in `index.css`; Learn, Creator, Life, Premium, Agent, and Story behavior stays in each feature stylesheet.

The Coding category landing uses one responsive 16–28px gutter below the sticky public header. Its terminal hero does not add a second top gutter, so the IDE window stays close to the navigation without changing its internal dimensions.

Individual Coding article pages follow the same top-gutter contract. The article hero owns the single responsive 16–28px offset; the terminal container adds no top margin.

The Coding comment form keeps its background transparent and uses a scoped submit action with visible hover, keyboard-focus, pressed, and disabled states. At 480px and below, the action expands to the form width.

Experience-category article banners use a compact 440px desktop minimum with tighter internal gaps and a two-column story-snapshot grid. The banner remains content-driven: below 900px its minimum height is removed, and below 640px snapshot details stack in one column so no metadata is clipped.

## Mobile content decisions

| Surface | Keep | Stack / condense | Drawer / collapse | Hide only when decorative |
| --- | --- | --- | --- | --- |
| Home hero | eyebrow, title, supporting copy, reading/about actions, one representative card | centered copy and compact card | none | rear cards and promotional floating badge |
| Articles / Stories | filters, result state, cards, pagination/load-more | single-column controls/cards at narrow widths | secondary filters where implemented | decorative imagery only |
| Learn | search, topics, catalog, access labels, progress | focused Course/Lesson reading width | topic discovery drawer at tablet/mobile | decorative hero treatments |
| Creators | search/filter, identity, formats/languages, follow state | directory/profile/Studio grids | secondary Studio navigation where implemented | decorative artwork |
| Life | Today loop, capture, tasks/habits/goals, privacy actions | cards and forms | mobile navigation and dialogs | non-semantic decoration |
| Premium / Agent / CMS | primary action/state, errors, forms | controls and panels | modal/drawer surfaces | decorative effects |

The Home mobile hero intentionally removes the two rear desktop cards and the floating badge at widths up to 640px. The front card remains as a representative visual, and its animation is disabled.

## Accessibility interaction contract

- Public routes expose a keyboard-visible “Skip to main content” link.
- Modal drawers use `role="dialog"`, `aria-modal="true"`, an accessible name, Escape handling, Tab containment, body-scroll locking, and focus restoration.
- The public mobile navigation trigger and close control have 44px targets.
- Header branding is not a page heading; each route owns its semantic page heading.
- Global and feature focus styles remain visible in Light and Dark themes.
- Reduced-motion rules disable the Home card and public drawer animations, with additional feature-scoped rules for Stories, Learn, Creators, Life, Premium, Agent, and games.
- Meaningful images require alternative text; decorative imagery should use empty alt text or be hidden from assistive technology.

## Structural breakpoint coverage

The source contains explicit responsive tiers for the public shell, Articles, Stories, Story readers, Learn, Creators, Life, Premium, Agent, About, Contact, authentication, and CMS layouts. Learn additionally defines large and ultra-wide tiers, while Story readers use container queries so presets respond to their actual reading shell.

Automated source contracts verify these breakpoints and the shared accessibility primitives. They do not detect real clipping, text reflow, crop quality, focus visibility, or pointer behavior.

## Browser QA status

The in-app browser backend was not connected during the 2026-08-23 hardening run or the Dark Mode defect Pass 2 verification. No viewport below is marked visually passed:

| Width | Light | Dark | CMS custom theme |
| --- | --- | --- | --- |
| 390 | NOT TESTED | NOT TESTED | NOT TESTED |
| 430 | NOT TESTED | NOT TESTED | NOT TESTED |
| 768 | NOT TESTED | NOT TESTED | NOT TESTED |
| 1024 | NOT TESTED | NOT TESTED | NOT TESTED |
| 1366 | NOT TESTED | NOT TESTED | NOT TESTED |
| 1440 | NOT TESTED | NOT TESTED | NOT TESTED |
| 1600 | NOT TESTED | NOT TESTED | NOT TESTED |
| 1920 | NOT TESTED | NOT TESTED | NOT TESTED |
| 2560 | NOT TESTED | NOT TESTED | NOT TESTED |

Required status: **STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED**.

Dark Mode defect Pass 2 specifically requires the Categories dropdown, a representative category list, an Article detail, and a Story detail to be inspected in both Light and Dark modes at 1440px, 1920px, 768px, and 430px. Every cell in that route/theme matrix remains `NOT TESTED` visually; the source contracts, focused suites, full regression, and production build do not replace that check.

When browser automation is approved, add a reviewed Playwright visual suite rather than introducing unreviewed screenshot dependencies. High-value baselines are Home, Articles/detail, Stories and one preset per engine, Learn/Course/Lesson, Creators/profile/Studio, Life, Premium, Agent, About, Contact, Login, Story CMS, and Theme CMS.

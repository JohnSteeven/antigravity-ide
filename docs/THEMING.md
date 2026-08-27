# Theming and dark mode

## Contract

The active public theme is a sanitized design-token contract. Server allowlists validate token names and values before persistence and again before CSS-variable generation. The client applies generated CSS through `textContent`; executable theme markup is never evaluated.

Supported semantic groups include page/surface colors, foreground/muted text, borders, brand/accent colors, typography, spacing, radii, shadows, and light/dark mode metadata. Components should use semantic variables rather than literal white/black/gray values when the color must adapt across themes.

`index.css` is the runtime stylesheet linked by `index.html`; `src/styles/base/variables.css` is the maintained token catalog. Runtime aliases include adaptive page/card surfaces plus explicit fixed-surface relationships: `--surface-light-fixed` with `--text-on-light*`, and `--surface-dark-fixed` with `--text-on-dark*`. A component that intentionally keeps a Light surface in Dark Mode must use the Light-surface foreground contract locally. It must not inherit the page foreground.

The home hero is an intentional fixed warm-Light surface. Learn owns one scoped adaptive token set for its discovery shell, course/lesson pages, and video/podcast/resource details. Creator Studio and the related application/profile surfaces own a separate warm-neutral `--creator-*` contract: Light literals remain the approved defaults, while only `body.theme-dark` remaps cards, controls, text roles, borders, actions, placeholders, and status messages to semantic Dark surfaces. Creator actions retain the warm workspace identity and do not inherit Coding blue. Article cards share one Dark hierarchy across every `CardResolver` category variant; category identity is limited to accents, badges, tags, and actions. Coding keeps its blue Light treatment but cannot replace Dark card body colors. The Categories mega-menu is also an intentional fixed-Light surface and binds its title, description, icons, and actions to the `text-on-light` relationship even while the surrounding page is Dark. Desktop navigation foreground selectors target only direct top-level links, so they cannot leak the header's Dark foreground into the menu's footer actions. Article-detail widgets mark adaptive Dark cards and intentional fixed-Light cards explicitly: author/share/newsletter/comments and the Experience story rail use the active Dark surface hierarchy, while Related Reflections binds to `text-on-light*`. Incidents, Life, and Travel detail roots also replace their fixed Light page/card/text variables under `body.theme-dark`; their prose, memoir cards, metrics, calls to action, related cards, and sidebars therefore share the same Dark canvas instead of mixing Light page backgrounds with Dark widgets. Story landing and all six shared reader engines recognize `body.theme-dark`.

## Article/detail content-surface inventory

| Area | Renderer/marker | Dark surface | Foreground authority | Exception |
| --- | --- | --- | --- | --- |
| Default, News, and unknown categories | `DefaultExperience` + `article-detail-theme--standard` | adaptive page/card | `--article-detail-*` | none |
| Life, Reflections, Growth, Philosophy, Mindset, Wisdom | `LifeExperience` + standard marker | adaptive page/card | standard contract mapped through `--life-*` | fixed-Light modules below |
| Lessons | `LessonsExperience` delegates to `LifeExperience` | adaptive page/card | Life mapping | no second renderer contract |
| Experiences/Incidents aliases | `IncidentsExperience` + standard marker | adaptive page/card | standard contract mapped through `--incidents-*` | image hero remains image-owned |
| Travel aliases | `TravelExperience` + standard marker | adaptive page/card | standard contract mapped through `--travel-*` | image hero remains image-owned |
| Coding/Development/Tech aliases | `CodingExperience` + `article-detail-theme--coding` | Coding-owned | Coding blue/slate contract | excluded from standard selectors |
| Prose, chapters, summaries, milestones, navigation, metrics, collections | standard root plus component classes | adaptive Dark | primary/secondary detail roles | accent icons and labels retain category identity |
| Author, share, newsletter, comments, notes, and story forms | `detail-card--dark`, `detail-comments`, action/form roles | adaptive Dark/input | detail text/input/action roles | Coding owns its controls |
| Reflection Note, author-history note, Watch/Audio resources, Related Reflections | `detail-card--light` | `--surface-light-fixed` | `--text-on-light*` | intentional fixed-Light cards |
| Category Most Popular/Topics | `category-side-panel` | adaptive Dark | global semantic Dark roles | separate from Article-detail root |
| Creator Studio, application, directory, and public profile | `.creator-studio` / `.creator-page` | adaptive Dark cards and controls | scoped `--creator-*` roles | warm Creator accent; no Coding palette |
| Story readers | six established reader engines | Story-owned | `--story-reader-*` | not an Article Experience template |

The final content-surface layer is the cascade authority for Dark Article details. It supersedes the earlier fixed-Light Life literals, broad `body.theme-dark` slate widget rules, and global blue `view-more` hover without deleting the approved Light declarations. Normal nested TOC items keep their Light indentation/opacity but are restored to fully opaque semantic secondary text in Dark Mode. Standard selectors always require `article-detail-theme--standard`; they cannot match the Coding root.

## Safety and workflow

- Raw custom CSS and JavaScript are rejected on writes and excluded from ordinary queries/public responses.
- URL-like token values are scheme/format validated; tokens cannot introduce scripts or arbitrary declarations.
- Normal text and muted text against page, card, and panel surfaces are critical WCAG 4.5:1 activation checks. Brand-primary against the page remains a reported 3:1 representative non-text check.
- Preview is temporary, shares the production renderer, and restores the active theme on cancel/reset.
- A personal Light/Dark preference is separate from the Admin-selected public theme.
- Generated Dark tokens are scoped to `body.theme-dark`, never `:root`, so switching back to Light cannot retain stale Dark root values.
- A saved theme draft is not the active public theme; activation is explicit.

Historical unsafe raw fields remain dormant for compatibility and should be removed only through a reviewed migration.

## Verification

Automated contracts cover token validation, dormant raw fields, public response shape, CSS generation and mode scoping, activation contrast, preview/reset behavior, surface-authoritative Home/Article/Learn/Creator/Story/menu CSS, and migration 010. Visual verification must still inspect representative pages at 390, 430, 768, 1024, 1440, 1920, and important pages at 2560 in Light, Dark, and a representative custom theme.

The in-app browser was unavailable during the 2026-08-23 pass, so the viewport/theme matrix remains `NOT TESTED` visually:

> STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED

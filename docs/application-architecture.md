# MyJourney Application Architecture

## Phase 1 Scope

This phase establishes the production architecture inside the current React codebase without breaking the existing Parcel app. The domain model, category pages, CMS shell, and PostgreSQL schema are now separated so the project can continue module by module.

## Folder Structure

```text
src/
  components/
    layout/            Shared application and CMS layout shells
    shared/            Reusable UI primitives
    *.js               Existing page and feature components
  context/             Client-side providers and persisted CMS state
  data/                Seed content and demo CMS data
  domain/              Taxonomy, routes, CMS module registry, capabilities
  features/
    categories/        Public category page experience
  hooks/               Reusable React hooks
  services/            Auth, OTP, and user services
  utils/               Generic helpers and validators
prisma/
  schema.prisma        Normalized PostgreSQL data model
docs/
  application-architecture.md
```

## Routing Structure

Public routes:

- `/` - Homepage with hero, category cards, featured content, and quotes.
- `/articles` - Searchable article index.
- `/articles/:slug` - Article detail with comments, likes, bookmarks, and related articles.
- `/category/:slug` - Dedicated category page for Life, Incidents, Reflections, Lessons, Travel, and Coding.
- `/read-my-story` and `/readmystory` - Personal story page.

Protected routes:

- `/cms` - CMS dashboard and module shell.
- `/profile` - Account/profile dashboard.
- `/edit-profile` - Profile management.

Auth routes:

- `/login`
- `/register`
- `/verify-otp`
- `/forgot-password`
- `/reset-password`

## Domain Modules

The category taxonomy lives in `src/domain/knowledgeArchitecture.js`. It defines:

- Category metadata and hero imagery.
- Category subcategories from the product brief.
- Article capability groups.
- Public and protected route registries.
- Full CMS menu registry.

## CMS Modules

Implemented in this phase:

- Dashboard overview.
- Articles editor.
- Categories and subcategories management.
- Tags management.
- Media library with search, folders, previews, replace, delete, and bulk upload.
- Homepage hero management.
- Quotes management.
- Projects management.
- Timeline management.
- Comments moderation.
- Settings and footer management.

Registered for the next phases:

- Users.
- Roles.
- Permissions.
- Analytics.
- SEO.
- Navigation menu.
- Testimonials.
- Gallery.
- Newsletters.
- Contact messages.
- Backups.
- Logs.
- Profile.

## Database Design

The Prisma schema in `prisma/schema.prisma` is normalized for PostgreSQL and includes:

- Users, roles, permissions, and role assignments.
- Articles, categories, subcategories, tags, article tags, media, article media, and versions.
- Comments, likes, bookmarks, and article views.
- Settings, navigation, pages, SEO, audit logs, and notifications.

## Next.js Migration Target

When the project moves from Parcel React to Next.js App Router, the current module boundaries map cleanly:

```text
app/
  (site)/
    page.tsx
    articles/page.tsx
    articles/[slug]/page.tsx
    category/[slug]/page.tsx
    profile/page.tsx
  (auth)/
    login/page.tsx
    register/page.tsx
  cms/
    layout.tsx
    page.tsx
    articles/page.tsx
    categories/page.tsx
    media/page.tsx
    users/page.tsx
  api/
    auth/
    articles/
    categories/
    tags/
    media/
    users/
    comments/
    analytics/
    search/
    settings/
```

The current `src/domain`, `src/features`, and `src/components/shared` modules should move into a `src/` folder beside the Next `app/` directory and stay framework-neutral where possible.

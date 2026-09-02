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

The application uses MongoDB as its database, with schemas defined in `server/models/` using Mongoose:

- **User**: Manages system users, authentication hashes, and roles. Tracks article references like liked articles and bookmarks.
- **Article**: Stores title, body, status, category (referencing Category), views, likes, and bookmarked counts. Configured with a text search index on title, description, body, and tags.
- **Category**: Stores category metadata, description, icon, and active status.
- **SubCategory**: Manages sub-taxonomies linked to parent categories.
- **Tag**: Metadata tags for categorization.
- **Media**: Stores files uploaded through the Media API with folder, URL, and mime-type.
- **Comment**: Tracks article comments and their moderation status (approved, pending, spam).
- **Role**: Manages system roles.
- **Permission**: Defines specific modules and keys for access control.
- **Setting**: Key-value pairs for global configurations.
- **Backup**: Archive files generated from system backups.
- **NewsletterCampaign**: Newsletter campaign metadata and template details.
- **ContactMessage**: Stores contact submissions.

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

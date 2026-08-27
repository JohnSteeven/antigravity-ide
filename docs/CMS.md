# CMS and Admin

## Authorization boundary

The CMS client is mounted at `/cms/*`. There is no separate `/admin` client application. Every management API must enforce `authenticate` plus `requireAdmin` (and any finer permission middleware) on the server. Creator Studio is a separate active-Creator surface and never implies Admin access.

`requireAdmin` accepts only the exact `Admin` role; `Editor` is not treated as Admin. The public header mirrors that policy by showing the Administrator label and CMS navigation only to authenticated Admins, but server middleware remains the business-authorization authority.

Public delivery routes expose only active/published representations. Draft collections, protected Article/Story bodies, workflow/ownership fields, theme source records, operational history, and provider configuration remain management-only.

## Content authority

Article and Story records share the Article persistence domain. Public lists are bounded and metadata-only; public detail serialization enforces publication, deletion, and Premium rules. The CMS does not use bundled article bodies or browser local storage as persistent fallbacks. Story editing preserves structured sections, the 30 preset identifiers, six shared engines, and the legacy renderer boundary documented in `STORY_PRESET_VERIFICATION.md`.

SEO fields are persisted with Article/Page records. The Admin SEO dashboard derives its metrics from published records. Public sitemap and JSON-LD endpoints exclude draft, deleted, private, and missing content.

## Themes and operational consoles

Theme management accepts allowlisted design tokens only. Raw CSS and JavaScript fields are legacy-dormant: management writes reject them and public reads/preview/compilation never emit them. Activation validates critical contrast pairs. See `THEMING.md`.

The launch console reads live configuration/database evidence and recorded release, deployment, and test history. Audit GETs are read-only. Empty history remains empty; the application never manufactures sample releases, successful deployments, test executions, or a default readiness score.

Provider-dependent CMS actions must surface 503/unavailable when their provider is absent. Configuration presence is not equivalent to a successful provider connectivity test.

## Change checklist

1. Confirm the server authorization and serializer boundary.
2. Reuse the existing model/service/route instead of creating a parallel domain.
3. Add a focused authorization, persistence, or source-contract regression test.
4. Verify dark/custom themes and responsive behavior in a real browser when available.
5. Update the relevant architecture, feature, security, testing, and data documentation.

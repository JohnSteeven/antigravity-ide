# MyJourney coding-agent instructions

## Repository expectations

- Read this file, the relevant document under `docs/`, and the implementation files for the area before changing code.
- Reuse existing models, services, routes, serializers, renderers, entitlement checks, and authorization middleware. Do not create parallel systems for an existing domain.
- Make the smallest architecture-consistent change and preserve unrelated working-tree changes.
- MongoDB is required for persistent runtime behavior. Do not describe or implement a fake in-memory server mode.

## Permanent architecture rules

- Articles and Stories share the established Article persistence domain. Story changes must preserve the structured-section and preset/renderer architecture.
- MyJourney Premium is the global account-level Premium model. Billing duration choices never create feature tiers.
- Premium access is server-authoritative. Protected bodies, lessons, media, and resources must be filtered or denied by the server, not merely hidden in React.
- Creator, Topic, and Content Type are separate concepts.
- Creator Studio and CMS/Admin are separate authorization surfaces. Active Creator access does not imply Admin access.
- MyJourney Life is private to its user. Creator status never grants access to another user's Life data.
- Creator ownership, learner progress ownership, and Admin review authorization are enforced on the server.
- Provider-dependent features must report unavailable honestly; do not manufacture checkout, streaming, payouts, AI results, or integrations.

## Git safety

Unless the user explicitly requests it, do not commit, push, deploy, merge, rebase, reset, switch branches, discard dirty files, or apply production migrations. Never overwrite unrelated working-tree changes.

## Verification

For meaningful code changes:

- Run the relevant focused Jest suites.
- Run the full regression suite where practical.
- Run `npm run check:server` for server JavaScript changes.
- Run `npm run build` and `git diff --check`.
- Do not claim browser QA unless a real browser was available. Use `STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED` when only source, build, API, or integration checks were possible.

## Documentation is part of the change

Code + tests + relevant documentation are one change. Update only what the change affects:

- `README.md`: setup, commands, routes, prerequisites, or major capabilities.
- `docs/ARCHITECTURE.md`: architecture, control flow, or domain boundaries.
- `docs/FEATURES.md`: capability or implementation status.
- `docs/DEVELOPMENT.md`: environment, startup, fixtures, or developer workflow.
- `docs/TESTING.md`: test commands or expectations.
- `docs/DATA_AND_MIGRATIONS.md`: models, migrations, seeders, retention, or deletion lifecycle.
- `docs/SECURITY.md`: authentication, authorization, privacy, or protected-resource behavior.

A task is incomplete when documentation made stale by that task is not updated.

## Where to look

- Story work: `docs/ARCHITECTURE.md` → Article and Story domains; `src/stories/`; `server/controllers/storyController.js`.
- Premium work: `docs/ARCHITECTURE.md` → Premium; `server/premium/`; entitlement and subscription services.
- Creator/Learn work: Creator and Learn sections in `docs/ARCHITECTURE.md`; `server/creators/`, `server/learn/`, `src/features/creators/`, and `src/features/learn/`.
- Life work: Life section in `docs/ARCHITECTURE.md`; `server/life/` and `src/features/life/`.
- Runtime problems: `docs/DEVELOPMENT.md`.
- Tests and data lifecycle: `docs/TESTING.md` and `docs/DATA_AND_MIGRATIONS.md`.

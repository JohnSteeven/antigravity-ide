# Feature status

Statuses describe the code in this repository, not a launch or security certification.

| Area | Status | Engineering truth |
| --- | --- | --- |
| Public home/navigation/footer | Implemented | React shell, CMS-backed contexts, navigation, and public landing sections exist. |
| Articles | Implemented | Public/CMS flows, categories, tags, comments, Free/Premium serialization, and search boundaries exist. |
| Stories | Implemented | Structured sections, validation, reading time, dedicated routes, and multiple established layouts exist. |
| Authentication | Implemented | Registration, OTP, password login/reset/change, cookie sessions, refresh rotation, logout, and protected routes exist. SMTP/SMS delivery depends on configuration. |
| MyJourney Premium entitlement | Implemented | One account-level Premium plan grants the entitlement catalog for 1/3/6/12-month billing durations. |
| Premium checkout/billing sync | Deferred | Provider adapter reports checkout, portal, webhooks, cancellation sync, and price mapping unavailable. |
| MyJourney Life | Implemented | Private Premium APIs/UI cover Today, habits, routines, tasks, goals, health, money, journal, insights, search, reports, notifications, export, and deletion. |
| Life web push | Implemented / requires external configuration | Requires valid VAPID credentials. |
| Life AI review | Implemented / requires external configuration | Requires `LIFE_AI_ENABLED=true` and an enabled AI provider; deterministic reports remain available. |
| Calendar/health-device integrations | Foundation only | Capability registries exist; no real adapter is connected by default. |
| Creator applications/review | Implemented | Applicant workflow and Admin review/history are server-authorized. |
| Creator directory/profiles/follows | Implemented | Public active profiles, shelves, owner state, follow/unfollow, dedupe, and self-follow prevention exist. |
| Creator Studio | Implemented | Active-Creator profile, content, course/curriculum, analytics, and media-metadata workflows exist. |
| Creator economy | Foundation only | Analytics/earnings/ledger models and inactive UI state exist; no real earnings or payouts are produced. |
| Topics | Implemented | Public Topics and Admin management exist independently of Creators/content types. |
| Learn home/catalog/search | Implemented | Topics and Free/Premium catalogs are exposed through `/api/learn`. |
| Courses/lessons | Implemented | Curriculum, public previews, Premium lessons, enrollment, progress, and Continue Learning exist. |
| Video metadata/catalog | Implemented | Metadata, ownership, access serialization, and catalog/detail UI exist. |
| Video streaming/upload | Deferred | No configured direct upload, adaptive streaming, signed delivery, or scanning provider. |
| Podcasts | Implemented / provider-dependent delivery | Series/episode metadata, catalogs, access checks, and transcript/show-note serialization exist; protected playback delivery is unavailable without a media provider. |
| Learning resources | Implemented / provider-dependent delivery | Metadata/catalog/access checks exist; Premium resources require protected assets and real delivery is unavailable. |
| Exams | Foundation only | Exam metadata/catalog exists; `assessmentEngineAvailable` is intentionally false. |
| Notifications | Implemented / requires provider configuration | In-app and scheduled flows exist; email, SMS, and web push depend on configured providers. |
| CMS/Admin | Implemented | `/cms/*` and a broad set of server-authorized management APIs exist. Some enterprise modules remain capability-gated. |
| AI platform | Implemented / requires external configuration | Provider registry/adapters exist; no provider means explicit 503 rather than fabricated output. |
| News integrations | Implemented / requires external configuration | External news providers require their API keys. |
| Play Life | Implemented | Client engine, content, persistence, and tests exist. |
| Play With Friends | Implemented | Room APIs, guest identity, Socket.IO, games, metrics, QR invites, and integration tests exist. |
| Redis multiplayer scaling | Implemented / requires external configuration | Local mode can run in process; horizontally scaled production needs Redis. |
| Life Auction | Implemented | Timed auction engine, modes, content packs, realtime, and load/integration tests exist. |
| Secret Vault | Implemented / requires external configuration | AES-256-GCM storage exists and is disabled without an explicit 32-byte key. |
| Social login | Deferred | No authentication provider route is configured; the client reports unavailable. |
| MyJourney Agent | Implemented | Server-authoritative unified Agent (`/api/agent/v1`), persistent conversation state, Zod-validated tool registry, permission & entitlement enforcement, cryptographic single-use confirmation tokens, idempotent message delivery, telemetry & audit redaction, and `MockAgentProvider` / `LocalAgentProvider`. |
| Agent Voice (Talk to MyJourney) | Implemented | Browser speech-to-text / text-to-speech integration into the same authenticated Agent conversation pipeline with press-to-talk state machine, stop actions, and zero background audio storage. |

When capability status changes, update this inventory in the same change as code and tests.

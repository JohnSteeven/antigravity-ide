# MyJourney Agent Architecture & Reference

The MyJourney Agent is the unified, secure, server-authoritative assistant platform for MyJourney. It brings together knowledge search (RAG), user Life data, learning curriculum, creator discovery, and account operations behind a single conversation model, permission system, and tool registry.

## Core Architectural Principles

1. **One Unified Assistant**: Both the floating `AskMyJourneyWidget` and the full-screen `/agent` page route through the canonical Agent backend at `/api/agent/v1/*`. There is only one conversation and tool execution architecture.
2. **Server-Authoritative Security & Privacy**: Identity is always derived from authenticated session context. The AI model has no direct database access; all data interactions pass through registered, permission-checked tools.
3. **Private User Scoping**: MyJourney Life data, course progress, and personal accounts are strictly scoped to the authenticated user. User A cannot read or affect User B's data through the Agent.
4. **Deterministic Zero-Cost Fallback**: In development or environments without paid model APIs, `MockAgentProvider` parses user intent and exercises the real tool/permission pipeline, generating deterministic responses from actual user data.
5. **No Persistent Microphone Listening**: Voice interactions use an explicit press-to-talk state machine. Audio is transcribed client-side using browser APIs; no raw audio is uploaded or stored.

---

## Agent Request Lifecycle

```text
User Message (Typed or Voice Transcript)
              │
              ▼
    AgentContext / agentApi
              │
    POST /api/agent/v1/conversations/:id/messages
              │
              ▼
    authenticate middleware (401 if unauthenticated)
              │
              ▼
    LocalRateLimiter & LocalConcurrencyLimiter
              │
              ▼
    agentController.sendMessage (generates requestId)
              │
              ▼
    agentOrchestrator.runAgentTurn
              │
    ├── 1. Feature flag check (`agent_enabled`)
    ├── 2. Verify conversation ownership (404 if not owner)
    ├── 3. Save user message (idempotency enforced by unique index)
    ├── 4. Load bounded context window (capped by count and characters)
    ├── 5. Provider Turn (`AgentProviderRegistry` -> Mock / Local / Cloud)
    │        │
    │        ├── Provider requests tool execution
    │        │         │
    │        │         ▼
    │        ├── `permissionService.authorizeTool`
    │        │     (checks auth, Premium entitlements, write flags)
    │        │         │
    │        │         ▼
    │        ├── `ToolRegistry.execute`
    │        │     (Zod schema validation + timeout wrapper)
    │        │         │
    │        │         ▼
    │        ├── Domain Services (habitService, courseService, knowledgeSearch)
    │        │         │
    │        │         ▼
    │        └── `AgentToolExecution` audit logged (output redacted)
    │                  │
    │                  ▼
    │        Tool result returned to provider
    │
    ├── 6. Provider generates final assistant text
    ├── 7. Save assistant message (linked to tool execution IDs)
    └── 8. Return response payload to client
              │
              ▼
    Client receives response; VoiceController plays TTS if voice replies active
```

---

## Tool Registry & Catalog

All tools are registered in `server/agent/tools/definitions.js` with Zod input/output validation, timeout budgets, and audit policies.

| Tool Key | Category | Permission Level | Auth Required | Required Entitlement | Description |
|---|---|---|---|---|---|
| `account.getProfile` | Account | READ | Yes | None | Safe user profile (bio, role, name). |
| `account.getSubscription` | Account | READ | Yes | None | Current plan, access reason, and entitlements. |
| `life.getToday` | Life | READ | Yes | `life_access` | Aggregated timeline, schedule, and goals for today. |
| `life.getHabits` | Life | READ | Yes | `life_access` | Active habits, measurement types, and schedules. |
| `life.getGoals` | Life | READ | Yes | `life_access` | Active goals with calculated progress. |
| `life.getRecentProgress` | Life | READ | Yes | `life_access` | Recent completion events and timeline entries. |
| `life.recordWater` | Life | LOW_RISK_WRITE | Yes | `life_access` | Record water intake (ml). |
| `life.completeHabit` | Life | LOW_RISK_WRITE | Yes | `life_access` | Log habit completion event. |
| `life.createTask` | Life | LOW_RISK_WRITE | Yes | `life_access` | Create a scheduled or unscheduled Life task. |
| `learn.searchCourses` | Learn | READ | No | None | Public course catalog search. |
| `learn.getEnrollments` | Learn | READ | Yes | None | User's active course enrollments and progress. |
| `learn.getProgress` | Learn | READ | Yes | None | Detailed lesson progress per enrolled course. |
| `learn.getNextLesson` | Learn | READ | Yes | None | Next uncompleted lesson for continue learning. |
| `content.searchArticles` | Content | READ | No | None | Published article search. |
| `content.searchStories` | Content | READ | No | None | Published story search. |
| `creators.search` | Creators | READ | No | None | Public active creator directory search. |
| `knowledge.search` | Knowledge | READ | No | None | RAG search over published articles and knowledge chunks. |

---

## Confirmation Token Architecture

For actions requiring user confirmation (`CONFIRM_REQUIRED`), the Agent implements a cryptographic token system:

1. **Token Issuance**: `confirmationService.issueToken` generates a cryptographically random UUID (`crypto.randomUUID()`).
2. **Hash-Only Persistence**: Only the SHA-256 hash (`tokenHash`) is persisted in `agentconfirmationtokens`. The raw token is returned to the client once.
3. **Cryptographic Binding**: Each token is bound to `(userId, conversationId, toolKey, argsHash)`. A token issued for User A cannot be redeemed by User B, nor used for a different tool or modified arguments.
4. **Single-Use Atomic Consumption**: Verification hashes the provided raw token and consumes it using atomic `findOneAndUpdate({ status: "pending" }, { status: "consumed" })`.
5. **TTL Automatic Cleanup**: Documents expire via MongoDB TTL index on `expiresAt` after `AGENT_CONFIRMATION_TTL_SECONDS` (default: 5 minutes).

---

## Observability & Privacy Rules

- **Telemetry Redaction**: All logs hash user identifiers (`hashIdentifier`) using a server salt (`AGENT_TELEMETRY_SALT`). Raw emails, tokens, and names are never logged.
- **HTTP Correlation**: The global request context supplies `req.id`/`X-Request-Id`; HTTP completion/error logs contain route templates, status, latency, and a `REQUEST_LOG_SALT` user hash, never raw URLs, queries, bodies, cookies, or raw user IDs.
- **Audit Redaction**: `AgentToolExecution.outputSummary` stores only minimal operational summaries (e.g. `"3 item(s) returned"`, `"habit completed"`). It **never** stores raw journal bodies, financial entries, health details, full RAG documents, or raw model prompts.
- **Circuit Breaker**: `AgentProviderRegistry` tracks provider failures with a configurable threshold (`circuitFailureThreshold`) and recovery window (`circuitResetMs`).
- **Scale Boundary**: Agent request rate/concurrency guards and metrics are process-local Maps. They are bounded and correct for one API process, but require distributed rate/concurrency leases and centralized metrics before horizontal scale.

---

## Voice Pipeline Architecture

- **Client Controller**: `src/features/agent/voice/agentVoiceController.cjs` manages the state machine: `idle` -> `listening` -> `processing` -> `speaking`.
- **Browser Abstraction**: `BrowserSpeechToTextProvider` uses `window.webkitSpeechRecognition` / `window.SpeechRecognition`. `BrowserTextToSpeechProvider` uses `window.speechSynthesis`.
- **Shared Pipeline**: Voice transcripts feed directly into `AgentContext.sendMessage({ source: "voice" })`. Assistant replies trigger text-to-speech automatically when voice replies are enabled.
- **Safety**: No persistent listening, no background recording, no audio uploads to server.
- **Verification Boundary**: Source contracts cover the press-to-talk state machine and shared Agent pipeline. Microphone permissions, recognition quality, voice availability, interruption behavior, and assistive-technology interaction still require real browser/device QA.

---

## REST API Specification

All persistent endpoints mount under `/api/agent/v1` and require cookie/Bearer authentication:

- `GET /api/agent/v1/capabilities`: Discovers available tools, provider status, and request limits (optional authentication).
- `GET /api/agent/v1/conversations`: Returns paginated active conversations owned by the user (`cursor`, `limit`).
- `POST /api/agent/v1/conversations`: Creates a new active conversation.
- `GET /api/agent/v1/conversations/:id/messages`: Returns paginated messages for a conversation owned by the user.
- `POST /api/agent/v1/conversations/:id/messages`: Submits a user message (`message`, `clientRequestId`, `source`, `pageContext`) and returns `{ userMessage, assistantMessage, toolExecutions, conversation }`.
- `PATCH /api/agent/v1/conversations/:id`: Updates conversation status (e.g. `{ archived: true }`).

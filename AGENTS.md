# AGENTS.md

## Project Context

Recon is the backend for a 3-day, 600-person DEFCON-style cybersecurity fest (Apr 19-21, VIT-AP). It powers the participant-facing PWA, admin ops dashboard, and sponsor/partner dashboards. The backend is a FastAPI application with PostgreSQL (Neon), Redis, and Logfire observability.

**External systems (do NOT rebuild):**
- **Luma** handles registration, RSVP, and ticket scanning. Participants who pass selection are directed to sign up on our platform.
- **CTFd** (self-hosted on AWS EC2) handles the CTF competition platform.
- **KOTH** runs on local VLAN-segmented infrastructure (not cloud).
- **n8n** handles form automation (Google Forms -> webhook -> our DB).
- **Grafana/CloudWatch** handles infrastructure monitoring.
- **Telegram/WhatsApp** handles volunteer comms and escalation channels.

**What this backend DOES own:**
- Participant PWA backend: schedule, zone map, queue indicators, passport points, leaderboard, push notifications, check-in state.
- NFC Lock Hunt system: `/tap`, `/solve`, `/progress`, `/final` endpoints with team state machine and NFC token verification.
- Points/passport economy: all point mutations across zones and events.
- Zone management: capacity tracking, queue position, status (red/amber/green).
- Incident logging: webhook ingestion from n8n/Google Forms.
- Admin dashboard: aggregated ops view, overrides, role checks.
- Sponsor/partner dashboard: post-event ROI metrics, footfall, engagement data.

---

## Commit Rules

- **NEVER** add "Co-Authored-By" lines or any co-author attribution in commits. Do not mention co-authorship in any capacity.
- Any push, PR, issue, or other GitHub action performed via `gh` or git must use the authenticated GitHub account `AbhiramVSA` only. Do not use any other account.

---

## Tech Stack

- **Framework:** FastAPI (async)
- **ORM / Validation:** SQLModel (SQLAlchemy + Pydantic combined)
- **Database:** PostgreSQL via asyncpg (Neon managed, serverless)
- **Cache / Messaging:** Redis (`redis.asyncio`)
- **Observability:** Logfire (auto-instrumented for FastAPI, asyncpg, Redis)
- **Auth:** Stateless JWT access tokens (60min) + stateful refresh tokens (7 days) in httpOnly cookies. OAuth via Authlib (Google).
- **Config:** Pydantic Settings (`app/core/config.py`)
- **Migrations:** Alembic (async, autodiscovery from `app/models/__init__.py`)
- **File Storage:** AWS S3 with presigned URLs

---

## Architecture

### Pattern: Router -> Controller -> Service -> CRUD

```
Router (thin HTTP layer)  ->  Controller (orchestration + parsing)  ->  Service (business logic)  ->  CRUD (DB queries)
```

- **Routers** (`router.py`): Parse HTTP request, pull dependencies via `Depends()`, return response. NO business logic. No direct DB queries.
- **Controllers** (`controller.py`): Orchestration layer. Handles any pre/post-processing, payload transformation, or multi-service coordination that doesn't belong in the HTTP layer or business logic. May call multiple services. No HTTP context (`Request`/`Response`).
- **Services** (`service.py`): Pure business logic for a single concern. No HTTP context. Receives typed data, returns domain objects or raises `HTTPException`.
- **CRUD** (`crud.py`): Raw database operations only. SELECT, INSERT, UPDATE, DELETE. No business decisions.

### Audience-Based Top-Level Structure

The codebase is split by **audience** at the top level. Each top-level folder represents a distinct stakeholder surface with its own concerns and access patterns:

| Folder | Audience | What belongs here |
|---|---|---|
| `domains/` | Participants | Participant-facing event concepts. Owns DB tables. Vertical slices — one sub-folder per feature. |
| `admin/` | Ops staff / event admins | Aggregated ops dashboard, overrides, role management. Aggregates across domains. Horizontal layers inside. |
| `partners/` | Sponsors / partners | Post-event ROI metrics, footfall, engagement data, booth management. Horizontal layers inside. |
| `infrastructure/` | (app-wide) | Technical capabilities with no audience affinity — object storage, Redis helpers, WebSocket/chatroom. |
| `utils/` | (app-wide) | Pure framework plumbing — `Depends()`, exception classes, SQLModel base. Flat files only. |

**The decision rule:**
- Participant-facing event feature → `domains/<feature>/`
- Ops or admin surface → `admin/`
- Sponsor or partner surface → `partners/`
- Technical capability (storage, caching, realtime) → `infrastructure/<capability>/`
- Framework glue → `utils/`

`admin/` and `partners/` use **horizontal layers** internally (a single `models/`, `schemas/`, `crud/`, `service/`, `controller/`, `router/` each) because they are each a single coherent surface — not collections of independent sub-features. Their service layer will call into domain services for data rather than owning the source of truth.

### Directory Structure

```
backend/app/
  main.py                       # Lifespan, middleware, app mounts
  core/                         # Config, security, OAuth — do not restructure
    config.py
    security.py
    oauth.py
  db/
    database.py
  models/
    __init__.py                 # Alembic aggregator — import all domain models here
  utils/                        # Framework plumbing only — flat files, no sub-packages
    deps.py                     # get_db, get_redis, get_current_user, require_roles
    exceptions.py               # Shared HTTP exception classes
    rbac.py                     # Startup role seeding and admin bootstrap
    models/
      base.py                   # Base SQLModel (id, created_at, updated_at)
  infrastructure/               # Technical capabilities with logic and endpoints
    storage/                    # AWS S3 — presigned upload/read URLs
      service/                  # r2_service.py — boto3 client, URL generation
      controller/               # r2_controller.py — validation, file key logic
      router/                   # r2_router.py — GET /r2/upload-url, /r2/read-url
      schemas/                  # r2_schemas.py — PresignedUploadResponse, PresignedReadResponse
      tests/
    cache/                      # Redis helpers — no HTTP endpoints, service-only
      service/
        cache_service.py        # get, set, delete, publish, sorted-set, counter helpers
        keys.py                 # Key namespace constants and builders (recon:{domain}:{entity}:{id})
  domains/                      # Participant-facing event features — vertical slices
    auth/                       # COMPLETE — OAuth, JWT, user CRUD
      models/                   # user.py, role.py, oauth_account.py, refresh_token.py
      schemas/                  # UserRead, UserCreate, UserUpdate, UserProfile, RoleRead
      crud/                     # All DB operations for auth models
      service/                  # auth_service.py, user_service.py, helpers.py
      controller/               # auth_controller.py, user_controller.py
      router/                   # auth_router.py (/auth/*), user_router.py (/users/*)
      tests/
    participants/               # IMPLEMENTED — profile, discovery, check-in, talent visibility
    zones/                      # SCAFFOLD ONLY
    points/                     # PARTIAL — point_ledger table defined; service layer TBD
    shop/                       # IMPLEMENTED — catalogue, redemption, fulfillment, points integration
    schedule/                   # SCAFFOLD ONLY
    announcements/              # IMPLEMENTED — active feed + admin publish/edit/delete
    teams/                      # SCAFFOLD ONLY
    incidents/                  # SCAFFOLD ONLY
    webhooks/                   # SCAFFOLD ONLY
  admin/                        # SCAFFOLD ONLY — ops dashboard (horizontal layers)
    models/
    schemas/
    crud/
    service/                    # aggregates across domain services — no owned source of truth
    controller/
    router/
    tests/
  partners/                     # SCAFFOLD ONLY — sponsor/partner dashboard (horizontal layers)
    models/
    schemas/
    crud/
    service/
    controller/
    router/
    tests/
  api/
    v1/
      api.py                    # Mounts all routers — domains + admin + partners + infrastructure
```

### Adding a Participant Domain Feature

1. Create folder under `domains/<name>/` with: `__init__.py`, `models/`, `schemas/`, `crud/`, `service/`, `controller/`, `router/`, `tests/`
2. Add model imports to `app/models/__init__.py` so Alembic discovers them
3. Add one `include_router()` line in `api/v1/api.py`
4. Write tests in `domains/<name>/tests/`
5. Update the **Project State** section in this file

### Adding to Admin or Partners

Work inside `admin/` or `partners/` horizontally. New endpoints go in `router/`, new business logic in `service/`, new DB queries in `crud/`. If a new table is needed, add the model to `models/` and import it in `app/models/__init__.py`. Do not create new sub-folders inside `admin/` or `partners/` — keep them flat.

### Adding a New Infrastructure Capability

1. Create folder under `infrastructure/<name>/` with: `service/`, `controller/`, `router/` (and `schemas/`, `tests/` as needed)
2. Add one `include_router()` line in `api/v1/api.py` if it has HTTP endpoints
3. Update the **Project State** section in this file

A contributor owns their entire folder end-to-end. Cross-cutting touches (model aggregator, router mount, AGENTS.md state) are the only shared files.

---

## Base Model

All database models inherit from `app.utils.models.base.Base` which provides:
- `id`: UUID primary key (auto-generated)
- `created_at`: timezone-aware datetime with server default
- `updated_at`: timezone-aware datetime with onupdate trigger

```python
from app.utils.models.base import Base

class Zone(Base, ZoneBase, table=True):
    __tablename__ = "zones"
    # domain-specific fields here
```

---

## Dependency Injection

Never import raw Redis or Session clients in business logic. Always use `Depends()`:

```python
from app.utils.deps import get_db, get_redis, get_current_user, require_roles

@router.get("/zones")
async def list_zones(db: AsyncSession = Depends(get_db)):
    ...

@router.post("/zones/{id}/override")
async def override_zone(user: User = Depends(require_roles("admin", "ops_chief"))):
    ...
```

### Roles

Defined in `app/domains/auth/models/role.py`. Current roles: `admin`, `participant`, `partner`. Default role assigned to all new users is `participant`. Use `require_roles()` from `app/utils/deps.py` for route-level access control. Every route must declare its required role explicitly. The `applicant` role has been removed — registration and selection are handled externally by Luma.

---

## Points Economy Rule

All point mutations MUST go through the points domain service with a named reason code. No domain writes directly to the points table.

```python
await points_service.award(db, participant_id=pid, amount=50, reason="zone.nfc_lock_hunt.complete")
await points_service.award(db, participant_id=pid, amount=10, reason="zone.forensics_sprint.flag")
```

This gives a clean audit log and the leaderboard is always derivable from a single table.

---

## Observability

Logfire is auto-instrumented in `main.py` for FastAPI, asyncpg, and Redis. Do not add verbose `logging.info()` blocks. Use `logfire.span()` for meaningful business state context only:

```python
import logfire
with logfire.span("calculating_leaderboard"):
    result = await compute_leaderboard(db)
```

---

## Security Rules

- Never log or expose participant PII (emails, tokens, passwords) in responses or logs.
- All challenge/competition endpoints must be sandbox-aware.
- Access tokens are read from `access_token` httpOnly cookie, not headers.
- Refresh tokens use SHA-256 hashing in DB with theft detection (reuse = revoke all).
- Secrets and keys live in `.env` only. Never hardcode them.

---

## Database Conventions

- Use `SQLModel` with `table=True` for DB models. Use plain `SQLModel` (no `table=True`) for Pydantic schemas.
- All async: `AsyncSession`, `async def`, `await db.exec()`.
- Session lifecycle managed by `get_db()` dependency (auto-commit on success, rollback on exception).
- Foreign keys use UUID type matching the `Base.id` field.
- Migrations via Alembic: `cd backend && alembic revision --autogenerate -m "description"` then `alembic upgrade head`.

---

## Testing (For Contributors)

Pattern: HTTP in, assert the response. No direct DB manipulation in tests.

```python
async def test_zone_checkin_succeeds(client, seed_zone, seed_participant):
    response = await client.post(f"/zones/{seed_zone.id}/checkin", json={
        "participant_id": seed_participant.id
    })
    assert response.status_code == 200
    assert response.json()["status"] == "checked_in"
```

Rules:
1. One test file per router file
2. Test the happy path first, then the most obvious failure case
3. Never assert on IDs, assert on status codes and meaningful fields
4. If setup needs more than 3 things, it needs a fixture

---

## Project State (Agent-Maintained)

Agents MUST update this section after completing any meaningful change — domain additions, structural migrations, schema changes, or architectural decisions. This is the living state of the codebase. Do not leave it stale.

### Current Architecture Status

Audience-based top-level structure is complete and stable:

- **`utils/`** — flat files only: `deps.py`, `exceptions.py`, `rbac.py`, `models/base.py`
- **`infrastructure/storage/`** — fully implemented: S3 presigned upload/read URLs via boto3 with namespace-aware authorization for read access. Mounts at `/api/v1/r2/`
- **`infrastructure/cache/`** — fully implemented: Redis helpers (get/set with TTL, pub/sub, sorted-set leaderboard, counters) + namespaced key builders. Service-only, no HTTP endpoints.
- **`domains/auth/`** — fully implemented: Google OAuth, JWT tokens, refresh/logout, user CRUD, RBAC seeding, settings-driven OAuth/callback URLs, file-backed Google sign-in allowlist enforcement with startup validation and automatic on-disk reload when the allowlist file changes, and bootstrap-admin email promotion both at startup and during user creation/login
- **App-level CORS handling** — normal responses use `CORSMiddleware`; unhandled 500 JSON responses now mirror allowed origins from the global exception handler so browser clients still receive CORS headers on crash paths
- **`domains/announcements/`** — implemented: active feed + admin publish/edit/delete routes with expiry/pinning support
- **`domains/teams/`** — implemented: reusable team creation, invite-code joins, roster reads; single source of truth for team ownership across event features
- **`domains/treasure_hunt/`** — implemented: QR-token problem reveal, team flag submission, solve ledger, projected leaderboard, and first-four finisher tracking
- **`domains/zones/`** — participant registration + scanner-safe check-in flow now implemented: signed QR-backed event registrations (`POST /events/{eventId}/registrations`, `GET /registrations/{registrationId}/qr`) and admin scan ingestion (`POST /admin/scans/check-in`) persist request idempotency, enforce one check-in row per registration, and award participant points atomically through the points domain
- **`admin/`** — scaffolded (horizontal layers: models/, schemas/, crud/, service/, controller/, router/, tests/)
- **`partners/`** — scaffolded (horizontal layers: models/, schemas/, crud/, service/, controller/, router/, tests/)
- Remaining participant domain folders (`schedule/`, `webhooks/`) are scaffolded (empty `__init__.py` files only)
- `app/models/__init__.py` is the Alembic aggregator — import new domain models here when added
- `api/v1/api.py` mounts all live routers (including announcements, domains, partners, and infrastructure)

### Participant Domains Status

| Domain | Status | Notes |
|---|---|---|
| auth | Complete | Google OAuth, JWT tokens, refresh/logout, settings-driven callback/redirect URLs, hardened session/trusted-host middleware wiring, and a file-backed Google sign-in allowlist at `backend/app/domains/auth/data/google_oauth_allowlist.txt`. Startup now validates that the allowlist file exists and is non-empty, while request-time checks automatically reload the file when it changes on disk. Google OAuth rejects non-allowlisted emails with `403` before user/session creation, except that bootstrap admin emails from `BOOTSTRAP_ADMIN_EMAILS` are always admitted and already-seeded admin users in the database are also allowed to sign in, so admin access cannot be broken by a stale allowlist file or stale env on the server. Bootstrap admin emails are also promoted through both the startup RBAC seeder and the normal auth/user creation paths, so matching emails do not depend on an app restart to receive the `admin` role. The global exception handler now mirrors allowed origins onto unhandled 500 JSON responses so browser clients still receive `Access-Control-Allow-Origin` on crash paths. |
| users | Complete | CRUD, role assignment, RBAC seeding. Roles: admin/participant/partner. No applicant role. |
| participants | In progress | Profile creation/update, participant discovery, admin list/filter, admin check-in, talent visibility toggle, and participant portal dashboard endpoints (`GET /me/dashboard` and compatibility `GET /participants/me/dashboard`) that aggregate points balance/rank + zone registration/check-in stats. Dashboard rank and balance are read directly from the DB-backed points projection/ledger path. Participant create/update schemas now reject `year < 1` and `year > 5` at validation time so the backend contract matches the portal form rules. QR endpoint intentionally deferred because Luma handles ticketing; NFC persistence deferred. |
| zones | In progress (registration + atomic scanner check-in) | Existing catalog + pass endpoints remain live: `GET /zones`, `GET /zones/{id}`, `POST /zones/{id}/register`, `DELETE /zones/{id}/register`, `GET /me/registrations`, `GET /me/passes`. Participant-facing zone lookup/register/unregister endpoints now accept either the zone UUID or the zone `short_name` (case-insensitive), so frontend clients can safely use keys like `ctf` without tripping FastAPI UUID validation. Frontend contract endpoints are now added: `POST /events/{eventId}/registrations` returns a signed QR JWT for the active registration, `GET /registrations/{registrationId}/qr` refreshes or returns the current QR, and `POST /admin/scans/check-in` enforces `X-Idempotency-Key`, verifies QR signature/expiry, locks the registration, writes a single `zone_check_ins` row, and awards points exactly once through the points domain. Same-key duplicate scans now wait for the completed stored response instead of surfacing an in-flight conflict. The zone payload contract now also exposes `registrationRequired`, `registrationPoints`, and `checkInPoints`; legacy catalog `points` is aligned to `check_in_points` for portal compatibility. Registration now creates the canonical pass/QR only and does not mint spendable points; the reward is issued only after a successful admin scan through `zone.event_check_in`. Open-access is intentionally narrow: only zones such as `art` and `gaming` should set `registration_required=false`, while the rest of the event catalog requires registration before check-in. Data model additions: `zone_registrations.qr_jti`, `zone_registrations.qr_expires_at`, new tables `zone_check_ins` and `zone_scan_requests`, plus `zones.registration_required`, `zones.registration_points`, and `zones.check_in_points`. DB guardrails now include one-check-in-per-registration plus a partial unique index on `point_ledger` for `reason='zone.event_check_in'` so retries/concurrent scans cannot mint duplicate awards. Postgres concurrency coverage for zones now boots the Alembic head before running, so the migration-only unique indexes are exercised instead of bypassed. Cross-domain participant lookup still goes through service helpers, while legacy participant dashboard tests now seed QR metadata on direct registration rows. Migrations: `a1b2c3d4e5f6`, `d4e5f6a7b8c9`, `e8f9a0b1c2d3`, `f0a1b2c3d4e6`, `a7b8c9d0e1f2` (current head `a7b8c9d0e1f2`). |
| points | Complete (participant economy + team competition scoring + settlement) | Participant economy remains append-only `point_ledger` + `participant_points` projection for spendable individual points (`GET /points/me`, `GET /points/leaderboard`, `POST /points/award`, shop spends, etc.). Team-scored competitions use a separate append-only ledger `team_competition_ledger` plus round-aware projection `team_competition_round_scores`, so CTF/KOTH/Treasure Hunt do not mutate participant balances live. Admins can now explicitly convert a settled team round into participant wallet points through `POST /points/team-events/settlements/preview`, `POST /points/team-events/settlements`, `GET /points/team-events/settlements`, and `GET /points/team-events/settlements/{id}`. Settlement is one-time per `(team_id, event_key, round_key)`, uses current team membership at finalization time, and allocates budget deterministically via equal split with stable remainder ordering by membership age. Team competition scores are normalized per event/round using raw-score ceilings + normalized-score ceilings stored on each round projection; participant minting is a separate admin budget so competition ranking and economy inflation stay decoupled. Participant points still use row locking (`FOR UPDATE`) and idempotency; team competition mutations use the same pattern on `(team_id, event_key, round_key)` projections with monotonic snapshot enforcement (score decreases require a new `round_key` for resets). Migrations: `f1a2b3c4d5e6` retires legacy outbox, `b6e7f8a9c1d2` adds team competition tables, `c4d5e6f7a8b9` adds settlement tables + participant self-service lock. Test coverage includes in-process router tests plus optional Postgres-backed race tests gated by `TEST_POSTGRES_DSN`, now including concurrent team-event delta and settlement idempotency cases. |
| schedule | Not started | Sessions, announcements, zone map data |
| incidents | Complete | Incident tracking layer: webhooks ingestion, ops assignment, and status lifecycle. Update flow now validates `assigned_to` against real users and returns `404` for stale assignee IDs instead of surfacing a database `500`, and the incidents model imports the auth user table explicitly so FK refresh/update paths do not depend on incidental import order. |
| webhooks | Not started | n8n form payload ingestion |
| shop | Complete (catalogue, redemption, returns) | Full catalogue + redemption store. Tables: `shop_items`, `redemptions`. Admin-only returns are now supported at `PATCH /shop/redemptions/{id}/return`, which refunds the original snapped point cost through the points service and releases stock by marking the redemption returned instead of deleting audit history. Redemption rows now snapshot `item_name` and `point_cost` at purchase time so later item edits cannot mutate history, and admin list filtering supports both `fulfilled` and `returned` flags. Concurrent redeem/return safety relies on explicit row locks plus points-domain idempotency, not DB RLS. Input validation now trims/rejects blank item fields and return notes/idempotency keys. Mounts at `/api/v1/shop/`. Migrations: `e6f7a8b9c0d1`, `d7e8f9a0b1c2`. Test coverage includes in-process router tests plus optional Postgres-backed return race tests gated by `TEST_POSTGRES_DSN`. |
| teams | Complete (participant self-service + admin management) | Reusable team domain with `teams` + `team_memberships` tables. Participant self-service is intentionally narrow: `POST /teams` and `POST /teams/join` are participant-only and can only be used once per participant, enforced by `participants.team_self_service_locked`; `GET /teams/me` returns the caller's current team context. All later roster movement is admin-only through `GET /teams/admin`, `POST /teams/admin`, `GET /teams/admin/{id}`, `PATCH /teams/admin/{id}`, `DELETE /teams/admin/{id}`, and `PUT /teams/admin/participants/{participant_id}/team`. Admin assignment/removal does not reopen self-service, so swaps remain controlled. Teams with competition history cannot be deleted because score/settlement audit trails are preserved. Migrations: `18db06de1e12` for base team tables, `c4d5e6f7a8b9` for the one-time self-service lock and nullable admin-created teams. |
| treasure_hunt | Complete (integrated with team competition scoring) | QR-driven team challenge flow for 10 seeded cybersec problems. Tables: `treasure_hunt_problems`, `treasure_hunt_solves`, `treasure_hunt_team_progress`. Endpoints: `GET /treasure-hunt/scan/{qr_token}`, `POST /treasure-hunt/problems/{problem_id}/submit`, `GET /treasure-hunt/me/progress`, `GET /treasure-hunt/leaderboard`, `GET /treasure-hunt/finishers`. Solve writes remain synchronous because max throughput is low and finish order is prize-critical. First-four finisher slots are claimed atomically through unique `finish_rank`; `treasure_hunt_team_progress` still owns hunt-state/progress, while each solve and finisher bonus now also emits a team competition score mutation into the points domain (`event_key=treasure_hunt`, round `main`) so Treasure Hunt contributes to the shared normalized team leaderboard without minting spendable participant points. Seed/operator assets live under `DOCS/treasure_hunt/` with QR PNGs and manifest. Migration: `18db06de1e12` for hunt tables, `b6e7f8a9c1d2` for normalized team competition scoring. |
| announcements | Complete (initial API) | Active feed (`GET /announcements`, `GET /announcements/{id}`) is now mounted in the live API alongside admin publish/edit/delete (`POST /announcements`, `PATCH /announcements/{id}`, `DELETE /announcements/{id}`), fields: priority/published_at/expires_at/is_pinned/created_by. Table: `announcements`. Migrations: `d1f2a3b4c5d6`, repair drift migration `1dff7bf50d72`. Realtime pub/sub events published on create/update/delete to Redis channel `announcements.live`. |

### Admin Status

| Surface | Status | Notes |
|---|---|---|
| admin | Not started | Aggregated ops dashboard, overrides, zone controls, incident feed |

### Partners Status

| Surface | Status | Notes |
|---|---|---|
| partners | Complete (models, schemas, CRUD, service, controller, router) | Application form, incentives (+ add more), asset uploads, admin review/approval, role promotion on approval. Tables: `partners`, `partner_incentives`, `partner_assets`, `partner_reports`. Migration: `cb0dd356e35b`. |

### Infrastructure Status

| Capability | Status | Notes |
|---|---|---|
| storage (S3) | Complete | Presigned upload/read URLs with namespace-aware private/public authorization. Uses boto3 credential resolution (env/shared config/IAM role). `infrastructure/storage/`. Mounts at `/api/v1/r2/`. |
| cache (Redis) | Complete | Redis helpers (get/set, pub/sub, sorted-set, counters) + namespaced key builders. `infrastructure/cache/`. No HTTP endpoints. |
| realtime | In progress | Redis pub/sub event publisher added for announcements (`infrastructure/realtime/service/announcement_events.py`), WebSocket live stream endpoint added at `GET ws /api/v1/realtime/announcements/ws` (subscribes to Redis channel `announcements.live`), optional FCM topic push dispatch added for announcement create/update when `FCM_SERVER_KEY` is configured (`infrastructure/realtime/service/push_notifications.py`). Announcement realtime/push dispatch now runs through DB post-commit hooks (`db/post_commit.py`) to preserve commit-then-publish semantics. |

---

## What NOT to Do

- Do not leave the **Project State** section outdated after making changes. Update it before finishing any task.
- Do not add a flat `controllers/` file outside of its audience folder. Controllers belong inside `domains/<name>/controller/`, `admin/controller/`, `partners/controller/`, or `infrastructure/<name>/controller/`.
- Do not create sub-folders inside `admin/` or `partners/`. They are single-surface, flat-layer folders. New features within them extend the existing horizontal layers, not new vertical slices.
- Do not import raw `engine` or `Redis()` in service/business logic. Use `Depends()`.
- Do not put business logic in routers. Routers validate input and call services.
- Do not create models without adding their import to `app/models/__init__.py`.
- Do not modify `core/config.py`, `core/security.py`, or `main.py` without explicit review.
- Do not build incident tracking UI, network monitoring, chat/helpdesk, or registration flows. These are handled by external tools.

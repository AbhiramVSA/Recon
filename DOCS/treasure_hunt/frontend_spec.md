# Treasure Hunt Frontend Spec

## Purpose

This document defines what the frontend must implement to support the treasure hunt event end to end using the existing backend endpoints.

Scope:
- team creation and join
- QR scanner flow
- problem reveal and flag submission
- team progress and leaderboard
- PWA behavior expectations
- exact request/response contracts
- expected UX states and failure handling

This is written for a participant-facing PWA. Admin-only needs are limited to reading leaderboard and finishers.

---

## Core Product Rules

- A participant must already be authenticated.
- Authentication is cookie-based. The frontend must send requests with credentials.
- A participant must have a participant profile before using treasure hunt features.
- A participant must belong to exactly one team before scanning or solving.
- Each QR maps to exactly one backend `qr_token`.
- Each team can solve each problem once.
- Solve persistence is immediate and authoritative. Do not build a fake optimistic completion model that can diverge from the response.
- The first four teams to complete all 10 problems get persisted `finish_rank` values `1..4`.
- The fifth team can still complete all 10 problems, but will have `finish_rank = null`.

---

## Frontend Pages

Minimum required pages/screens:

1. Team Setup
- Create team
- Join team by invite code
- Show current team and roster

2. Hunt Home
- Team summary card
- Solved count
- Remaining count
- Current rank
- Finisher badge if applicable
- CTA to open scanner
- CTA to open leaderboard

3. QR Scanner
- Camera preview
- Scan frame
- Manual fallback entry field for `qr_token`
- Loading state while resolving token

4. Problem Detail
- Problem title
- Problem body rendered from markdown
- Hint section
- Flag entry box
- Submit button
- Solved badge if already solved

5. Team Progress
- Ordered list of all 10 problems
- Solved/unsolved state
- `solved_at` timestamps where available

6. Leaderboard
- Ranked team list
- Separate visual treatment for completed teams
- Finisher slot indicator for ranks `1..4`

7. Optional Admin/MC Display
- Large-screen leaderboard view
- Finishers-only view

---

## Navigation Model

Recommended route structure:

- `/hunt`
- `/hunt/team`
- `/hunt/scan`
- `/hunt/problem/:problemId`
- `/hunt/leaderboard`

Recommended behavior:
- If user opens `/hunt` and has no team, redirect to `/hunt/team`.
- If user opens `/hunt/problem/:problemId` directly, do not assume they scanned it in-session. Load problem context only if already known from scan or progress state; otherwise prefer routing through scan flow.
- If scan succeeds, route to `/hunt/problem/:problemId`.

---

## Authentication and Networking

The backend reads `access_token` from an `httpOnly` cookie.

Frontend requirement:
- Every authenticated request must use `credentials: "include"`.

Example:

```ts
await fetch("/api/v1/treasure-hunt/me/progress", {
  method: "GET",
  credentials: "include",
});
```

Do not attempt to read the access token in JavaScript.

---

## API Contract

Base prefix:
- `/api/v1`

### 1. Create Team

Endpoint:
- `POST /api/v1/teams/`

Request body:

```json
{
  "name": "Zero Cool"
}
```

Validation:
- trimmed
- minimum 3 chars
- maximum 80 chars
- unique team name

Success:
- `201 Created`

Response:

```json
{
  "id": "uuid",
  "name": "Zero Cool",
  "invite_code": "AB12CD",
  "created_by_participant_id": "uuid",
  "created_at": "2026-04-17T14:00:00Z",
  "members": [
    {
      "participant_id": "uuid",
      "display_name": "ciphercat",
      "joined_at": "2026-04-17T14:00:00Z"
    }
  ]
}
```

Frontend expectations:
- show team created toast
- show invite code prominently
- offer copy button
- transition to hunt home

Known failure cases:
- `404` participant profile missing
- `409` team name already exists
- `409` participant already in a team
- `422` invalid body

---

### 2. Join Team

Endpoint:
- `POST /api/v1/teams/join`

Request body:

```json
{
  "invite_code": "ab12cd"
}
```

Backend normalization:
- trims
- uppercases

Success:
- `200 OK`

Response:
- same shape as `TeamRead`

Frontend expectations:
- normalize invite code in UI too
- allow paste from clipboard
- show roster after success

Known failure cases:
- `404` team not found
- `404` participant profile missing
- `409` participant already in a team
- `422` invalid body

---

### 3. Get My Team

Endpoint:
- `GET /api/v1/teams/me`

Success:
- `200 OK`

Response:
- same shape as `TeamRead`

Known failure cases:
- `404` participant is not part of a team

Frontend expectations:
- use this at app boot for hunt entry
- cache in memory for the session
- refetch after create/join

---

### 4. Scan QR / Resolve Problem

Endpoint:
- `GET /api/v1/treasure-hunt/scan/{qr_token}`

Example:
- `GET /api/v1/treasure-hunt/scan/th-01-shifted-ssid`

Success:
- `200 OK`

Response:

```json
{
  "id": "uuid",
  "slug": "shifted-ssid",
  "title": "Shifted SSID",
  "teaser": "The Wi-Fi sticky note looks shifted. Recover the real flag.",
  "body_markdown": "markdown content",
  "hint_markdown": "hint content",
  "qr_token": "th-01-shifted-ssid",
  "sort_order": 1,
  "already_solved": false,
  "solved_at": null
}
```

Known failure cases:
- `404` participant is not part of a team
- `404` participant profile missing
- `404` problem not found
- `403` wrong role

Frontend expectations:
- stop camera scanning immediately after first valid decode
- show loading overlay during resolve request
- if `already_solved = true`, still show the problem page but mark it solved and disable normal submit CTA

---

### 5. Submit Flag

Endpoint:
- `POST /api/v1/treasure-hunt/problems/{problem_id}/submit`

Request body:

```json
{
  "flag": "RECON{CAESAR_OVER_COFFEE}",
  "idempotency_key": "hunt-submit-b91b4f7b-f2bb-4d0f-a9ef-3dc3cae7b8c1"
}
```

Important:
- `idempotency_key` is mandatory
- generate a new key for each distinct submit attempt
- if the user double-clicks the same submit, reuse the same in-flight key
- do not reuse the same key for another problem

Success:
- `200 OK`

Response:

```json
{
  "correct": true,
  "status": "solved",
  "team_id": "uuid",
  "problem_id": "uuid",
  "solved_count": 3,
  "total_problems": 10,
  "completed_at": null,
  "finish_rank": null
}
```

`status` semantics:
- `incorrect`: submitted flag is wrong
- `solved`: this request created the team solve
- `already_solved`: team had already solved it earlier or this was an idempotent replay

Known failure cases:
- `404` problem not found
- `404` participant/team missing
- `409` `idempotency_key` reused for a different solve request
- `422` blank flag or blank idempotency key

Frontend expectations:
- while submitting, disable submit button
- preserve the same idempotency key across retries of the same network request
- on `incorrect`, show non-destructive inline error and keep the input editable
- on `solved`, refresh progress and leaderboard snippets
- on `already_solved`, show solved state and refresh progress
- if `finish_rank` becomes non-null, trigger a completion celebration screen

---

### 6. Get My Team Progress

Endpoint:
- `GET /api/v1/treasure-hunt/me/progress`

Success:
- `200 OK`

Response:

```json
{
  "team_id": "uuid",
  "team_name": "Zero Cool",
  "solved_count": 3,
  "total_problems": 10,
  "remaining_count": 7,
  "leaderboard_rank": 12,
  "last_solved_at": "2026-04-17T15:05:00Z",
  "completed_at": null,
  "finish_rank": null,
  "problems": [
    {
      "problem_id": "uuid",
      "slug": "shifted-ssid",
      "title": "Shifted SSID",
      "sort_order": 1,
      "solved": true,
      "solved_at": "2026-04-17T14:10:00Z"
    }
  ]
}
```

Frontend expectations:
- this is the canonical overview payload for hunt home
- poll this after successful solves
- also refresh on app foreground/resume

---

### 7. Leaderboard

Endpoint:
- `GET /api/v1/treasure-hunt/leaderboard?skip=0&limit=50`

Success:
- `200 OK`

Response:

```json
{
  "total_teams": 87,
  "entries": [
    {
      "rank": 1,
      "team_id": "uuid",
      "team_name": "Zero Cool",
      "solved_count": 10,
      "total_problems": 10,
      "last_solved_at": "2026-04-17T16:00:00Z",
      "completed_at": "2026-04-17T16:00:00Z",
      "finish_rank": 1
    }
  ]
}
```

Access:
- participant
- admin

Frontend expectations:
- default to `limit=50`
- support pagination if needed
- highlight current team if present
- display completed teams above incomplete teams due to backend ordering

---

### 8. Finishers

Endpoint:
- `GET /api/v1/treasure-hunt/finishers`

Success:
- `200 OK`

Response:
- same envelope as leaderboard, but only finisher rows

Access:
- participant
- admin

Frontend expectations:
- use for prize screen / “treasure boxes claimed” widget
- if fewer than 4 finishers exist, display empty slots in UI

---

## Error Handling Contract

The frontend should not treat all non-200 statuses the same.

Recommended handling:

- `401`
  Redirect to login/session refresh flow.

- `403`
  Show “You do not have access to this feature.”

- `404` on team endpoints
  Interpret as missing participant profile or missing team depending on route context.

- `404` on scan
  Show “This QR is invalid or inactive.”

- `409` on create/join
  Show exact business conflict message from backend.

- `409` on submit
  Treat as serious request mismatch, likely a client bug or stale retry key.
  Clear current submit key and allow the user to retry with a new one.

- `422`
  Render field-level validation messages.

---

## Team Setup UX

### Team Setup Screen Requirements

Show two tabs or two cards:
- Create Team
- Join Team

Create Team form:
- team name input
- helper text: “3-80 characters”
- submit button

Join Team form:
- invite code input
- uppercase transform as user types
- paste-friendly
- submit button

After success:
- show team card
- show invite code with copy button
- show roster list
- show “Go to Hunt” CTA

Do not add:
- leave team
- kick member
- rename team

Those do not exist in the backend.

---

## Scanner Spec

### Scanner Technology

Preferred:
- `BarcodeDetector` API where supported

Fallback:
- camera stream + QR decoding library

Fallback of last resort:
- manual token input field

Supported payload expectation:
- the physical QR may encode either:
  - full frontend route
  - full backend scan URL
  - raw `qr_token`

Frontend normalization rule:
- if payload is a URL, extract the last path segment if it matches scan pattern
- if payload is already a token like `th-01-shifted-ssid`, use it directly

### Scanner UX

Required:
- request camera permission only after explicit user tap
- show permission denied state with recovery text
- show a visible scan frame
- vibrate or animate briefly on successful decode
- immediately pause scanning after first valid decode
- prevent duplicate network requests from repeated frames

Recommended states:
- idle
- requesting_permission
- active
- resolving_token
- success
- invalid_code
- permission_denied
- camera_unavailable

### Manual Token Fallback

Required because event environments are noisy:
- text input for token
- submit button
- same resolve flow as scanner

---

## Problem Detail UX

### Required Layout

- title
- teaser
- markdown-rendered problem statement
- optional hint accordion
- solved badge if already solved
- flag input
- submit button
- result banner

### Markdown Rendering

Backend returns markdown in `body_markdown` and `hint_markdown`.

Frontend should:
- support headings, paragraphs, inline code, fenced code blocks
- preserve line breaks for challenge readability
- use monospace styling for code/encoded strings

### Submit Interaction

Input behavior:
- trim on submit
- do not auto-uppercase or auto-lowercase
- allow paste

Button behavior:
- disabled while request is in flight
- if request times out, allow retry with the same idempotency key for the same attempt

Result behavior:
- `incorrect`: red inline banner, keep field populated
- `solved`: green success banner, lock or collapse submit form
- `already_solved`: neutral/green banner, lock form

---

## Hunt Home UX

Required sections:
- Team name
- Invite code
- Solved count / total
- Remaining count
- Rank
- Last solve time
- Completion badge if all solved
- Finisher badge if `finish_rank != null`

Recommended cards:
- “Scan Next QR”
- “View Progress”
- “Leaderboard”
- “Top 4 Finishers”

If completed:
- replace primary CTA with “View Leaderboard”
- show prize instruction banner if `finish_rank != null`

Suggested completion banner copy:
- `finish_rank = 1..4`: “Your team has unlocked a treasure box. Show this screen to event staff.”
- completed but no rank: “Your team completed the hunt. All treasure box slots are already claimed.”

---

## Leaderboard UX

### Ordering

Do not sort client-side differently from the backend.

Use backend order exactly.

### Visual Treatment

Each entry should show:
- rank
- team name
- solved count
- completion state
- finisher slot if present

Recommended badges:
- `finish_rank = 1`: Gold
- `finish_rank = 2`: Silver
- `finish_rank = 3`: Bronze
- `finish_rank = 4`: Final Box

Current team highlighting:
- if the current team is on the visible page, highlight its row

Refresh behavior:
- poll every `5s` while page is visible
- pause polling when tab is backgrounded

---

## PWA Expectations

### Required

- installable manifest
- mobile-safe viewport
- fullscreen-friendly scanner layout
- wake-lock request during active scan if supported
- app should work well in portrait mode

### Caching

Safe to cache:
- static assets
- shell routes

Do not aggressively cache:
- `/teams/me`
- `/treasure-hunt/me/progress`
- `/treasure-hunt/leaderboard`
- `/treasure-hunt/finishers`
- scanned problem resolution

Reason:
- event state is live and prize order matters

### Offline

Not required for solve flow.

Explicitly:
- scanning and solving require network
- show a clear offline banner if request fails due to connectivity
- do not queue solve submissions offline

Reason:
- offline queueing conflicts with prize-order correctness and idempotency semantics

---

## Client State Model

Recommended client stores:

- `auth`
- `team`
- `huntProgress`
- `currentProblem`
- `leaderboard`
- `scanner`

Recommended refresh triggers:

- on login success
- on app launch
- on app foreground
- after create team
- after join team
- after scan resolve
- after successful solve

Recommended minimal state machine:

1. authenticated
2. participant profile exists
3. team exists
4. hunt home active
5. scanner or progress or leaderboard

---

## Idempotency Key Rules For Frontend

For `POST /treasure-hunt/problems/{problem_id}/submit`:

- generate one UUID per submit intent
- reuse the same key only if retrying the exact same request
- if the user changes the flag text and submits again, generate a new key
- never reuse a key across problems

Recommended helper:

```ts
const key = crypto.randomUUID();
```

Recommended format:
- plain UUID is enough
- or prefixed UUID like `hunt-submit-${crypto.randomUUID()}`

---

## Suggested Frontend Copy

### Empty Team State
- “Create a team or join one before scanning any hunt QR.”

### Invalid QR
- “This QR code is not part of the hunt, or it is no longer active.”

### Already Solved
- “Your team already solved this challenge.”

### Incorrect Flag
- “That flag is not correct. Try again.”

### Missing Profile
- “Create your participant profile before joining the hunt.”

### Missing Team
- “Join or create a team before scanning hunt QR codes.”

---

## Recommended Polling Strategy

For participant PWA:
- `GET /treasure-hunt/me/progress` every `10-15s` on Hunt Home
- `GET /treasure-hunt/leaderboard` every `5s` on Leaderboard page
- `GET /treasure-hunt/finishers` every `5s` on prize/leaderboard screen

Do not poll the scanner route.
Only call scan resolve when the user actually scans a code.

---

## What Frontend Must Not Assume

- Do not assume a team can be edited, renamed, or left.
- Do not assume all 10 problems must be fetched upfront individually; progress gives the index.
- Do not assume `finish_rank` exists just because `solved_count == total_problems`.
- Do not assume scan payload is already trusted. Normalize and validate it first.
- Do not assume token auth in headers. This backend uses cookies.
- Do not assume offline submission is safe.

---

## Implementation Checklist

- [ ] authenticated fetch wrapper uses `credentials: "include"`
- [ ] team setup page supports create and join
- [ ] scanner page supports camera + manual fallback
- [ ] QR payload normalization implemented
- [ ] problem page renders markdown safely
- [ ] flag submit uses generated idempotency keys
- [ ] progress page shows all problems and solved states
- [ ] leaderboard page polls and highlights current team
- [ ] finisher badge shown on home/progress/leaderboard
- [ ] offline/network failure states handled explicitly
- [ ] duplicate scan frames do not trigger duplicate requests
- [ ] duplicate submit taps do not trigger different idempotency keys while request is in flight


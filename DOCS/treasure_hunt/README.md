# Treasure Hunt

## Architecture

- `POST /api/v1/teams/`
  Creates a reusable team row plus the creator's membership. No event-specific team table was added.
- `POST /api/v1/teams/join`
  Joins an existing team by invite code. A participant can belong to only one team.
- `GET /api/v1/teams/me`
  Returns the caller's current team and roster.
- `GET /api/v1/treasure-hunt/scan/{qr_token}`
  Resolves a QR token to one active problem for the caller's team.
- `POST /api/v1/treasure-hunt/problems/{problem_id}/submit`
  Validates the submitted flag against the DB-stored flag hash, inserts one durable solve row, and updates team progress atomically.
- `GET /api/v1/treasure-hunt/me/progress`
  Returns the caller's team progress, solved problems, rank, and finisher slot if completed.
- `GET /api/v1/treasure-hunt/leaderboard`
  Ranks teams by `solved_count DESC`, then earliest `completed_at`, then earliest `last_solved_at`.
- `GET /api/v1/treasure-hunt/finishers`
  Returns only the first four completion slots.

## Batch Decision

Canonical solve writes are **not batched**.

Reason:
- Maximum write volume is tiny: `300 teams * 10 problems = 3000` solve rows.
- Finish order is prize-critical, so delaying DB writes would weaken correctness for no real scale benefit.
- The code still keeps leaderboard reads cheap by maintaining `treasure_hunt_team_progress` as the projection row per team.

If you want the UI to feel "batchy", poll `/leaderboard` every `3-5s`. Do not batch solve persistence.

## Problem Bank

| # | QR Token | Title | Answer Flag |
|---|---|---|---|
| 1 | `th-01-shifted-ssid` | Shifted SSID | `RECON{CAESAR_OVER_COFFEE}` |
| 2 | `th-02-badge-b64` | Badge B64 | `RECON{B64_BADGE_BINGO}` |
| 3 | `th-03-redirect-maze` | Redirect Maze | `RECON{URLS_CAN_LIE}` |
| 4 | `th-04-packet-hex` | Packet Hex | `RECON{HEX_DUMPS_TELL_STORIES}` |
| 5 | `th-05-binary-buzz` | Binary Buzz | `RECON{BITS_BEAT_GUESSES}` |
| 6 | `th-06-rot13-breach` | ROT13 Breach | `RECON{ROT13_IS_NOT_SECURITY}` |
| 7 | `th-07-leet-locker` | Leet Locker | `RECON{LEETSPEAK_IS_NOT_ENCRYPTION}` |
| 8 | `th-08-cookie-crumbs` | Cookie Crumbs | `RECON{COOKIES_SPLIT_SECRETS}` |
| 9 | `th-09-header-hunt` | Header Hunt | `RECON{READ_THE_HEADERS}` |
| 10 | `th-10-reverse-rumor` | Reverse Rumor | `RECON{MOBILE_FORENSICS_WINS}` |

## QR Payload Base

The generated QR assets in `DOCS/treasure_hunt/qrs/` currently encode:

`https://event.example.com/api/v1/treasure-hunt/scan/{qr_token}`

Replace the host before printing for the live event if your public API hostname differs.

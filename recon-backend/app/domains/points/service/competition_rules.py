from dataclasses import dataclass


CTF_EVENT_KEY = "ctf"
KOTH_EVENT_KEY = "koth"
TREASURE_HUNT_EVENT_KEY = "treasure_hunt"

TREASURE_HUNT_MAIN_ROUND_KEY = "main"
TREASURE_HUNT_SOLVE_RAW_POINTS = 100
TREASURE_HUNT_FINISH_BONUS_RAW_POINTS = {
    1: 200,
    2: 150,
    3: 100,
    4: 50,
}


@dataclass(frozen=True)
class TeamCompetitionRule:
    event_key: str
    display_name: str
    default_raw_score_ceiling: int | None
    default_normalized_points_ceiling: int
    supports_snapshot_ingest: bool
    supports_delta_awards: bool
    note: str


TEAM_COMPETITION_RULES = {
    CTF_EVENT_KEY: TeamCompetitionRule(
        event_key=CTF_EVENT_KEY,
        display_name="CTF",
        default_raw_score_ceiling=9500,
        default_normalized_points_ceiling=500,
        supports_snapshot_ingest=True,
        supports_delta_awards=False,
        note="CTF uses snapshot ingestion. Raw scoreboard ceiling is fixed at 9500.",
    ),
    KOTH_EVENT_KEY: TeamCompetitionRule(
        event_key=KOTH_EVENT_KEY,
        display_name="King of the Hill",
        default_raw_score_ceiling=None,
        default_normalized_points_ceiling=300,
        supports_snapshot_ingest=True,
        supports_delta_awards=True,
        note=(
            "KOTH raw ceiling depends on round duration/objective count. "
            "Pass raw_score_ceiling explicitly per round, for example "
            "floor(duration_seconds / 30) * objectives."
        ),
    ),
    TREASURE_HUNT_EVENT_KEY: TeamCompetitionRule(
        event_key=TREASURE_HUNT_EVENT_KEY,
        display_name="Treasure Hunt",
        default_raw_score_ceiling=(
            TREASURE_HUNT_SOLVE_RAW_POINTS * 10
            + TREASURE_HUNT_FINISH_BONUS_RAW_POINTS[1]
        ),
        default_normalized_points_ceiling=200,
        supports_snapshot_ingest=False,
        supports_delta_awards=True,
        note=(
            "Treasure Hunt awards 100 raw points per solve plus finish bonuses "
            "for the first four teams."
        ),
    ),
}


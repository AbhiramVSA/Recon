/** Mirrors backend team + treasure hunt DTOs (JSON: UUIDs as strings, datetimes as ISO strings). */

export interface TeamMemberRead {
    participant_id: string;
    display_name: string;
    joined_at: string;
}

export interface TeamRead {
    id: string;
    name: string;
    invite_code: string;
    created_by_participant_id: string;
    created_at: string;
    members: TeamMemberRead[];
}

export interface TeamCreatePayload {
    name: string;
}

export interface TeamJoinPayload {
    invite_code: string;
}

export interface TreasureHuntProblemRead {
    id: string;
    slug: string;
    title: string;
    teaser: string;
    body_markdown: string;
    hint_markdown: string | null;
    qr_token: string;
    route_hash: string;
    sort_order: number;
    already_solved: boolean;
    solved_at: string | null;
}

export interface TreasureHuntProblemStatusRead {
    problem_id: string;
    slug: string;
    title: string;
    route_hash: string;
    sort_order: number;
    solved: boolean;
    solved_at: string | null;
}

export type TreasureHuntSubmitStatus = 'incorrect' | 'solved' | 'already_solved';

export interface TreasureHuntFlagSubmitPayload {
    flag: string;
    idempotency_key: string;
}

export interface TreasureHuntFlagSubmitRead {
    correct: boolean;
    status: TreasureHuntSubmitStatus;
    team_id: string;
    problem_id: string;
    next_hint: string | null;
    solved_count: number;
    total_problems: number;
    completed_at: string | null;
    finish_rank: number | null;
}

export interface TreasureHuntLeaderboardEntryRead {
    rank: number;
    team_id: string;
    team_name: string;
    solved_count: number;
    total_problems: number;
    last_solved_at: string | null;
    completed_at: string | null;
    finish_rank: number | null;
}

export interface TreasureHuntLeaderboardRead {
    total_teams: number;
    entries: TreasureHuntLeaderboardEntryRead[];
}

export interface TreasureHuntTeamProgressRead {
    team_id: string;
    team_name: string;
    solved_count: number;
    total_problems: number;
    remaining_count: number;
    leaderboard_rank: number;
    last_solved_at: string | null;
    completed_at: string | null;
    finish_rank: number | null;
    problems: TreasureHuntProblemStatusRead[];
}

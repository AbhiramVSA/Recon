import type {
    TreasureHuntFlagSubmitPayload,
    TreasureHuntFlagSubmitRead,
    TreasureHuntLeaderboardRead,
    TreasureHuntProblemRead,
    TreasureHuntTeamProgressRead,
} from '../lib/treasureHuntTypes';
import { apiFetch } from './client';

function scanPath(qrToken: string) {
    const encoded = encodeURIComponent(qrToken);
    return `/api/v1/treasure-hunt/scan/${encoded}`;
}

export async function scanProblem(qrToken: string) {
    return apiFetch<TreasureHuntProblemRead>(scanPath(qrToken), { method: 'GET' });
}

export async function submitFlag(problemId: string, payload: TreasureHuntFlagSubmitPayload) {
    return apiFetch<TreasureHuntFlagSubmitRead>(
        `/api/v1/treasure-hunt/problems/${encodeURIComponent(problemId)}/submit`,
        { method: 'POST', json: payload },
    );
}

export async function getMyProgress() {
    return apiFetch<TreasureHuntTeamProgressRead>('/api/v1/treasure-hunt/me/progress', {
        method: 'GET',
    });
}

export async function getLeaderboard(skip = 0, limit = 50) {
    const q = new URLSearchParams();
    q.set('skip', String(skip));
    q.set('limit', String(limit));
    return apiFetch<TreasureHuntLeaderboardRead>(`/api/v1/treasure-hunt/leaderboard?${q.toString()}`, {
        method: 'GET',
    });
}

export async function getFinishers() {
    return apiFetch<TreasureHuntLeaderboardRead>('/api/v1/treasure-hunt/finishers', { method: 'GET' });
}

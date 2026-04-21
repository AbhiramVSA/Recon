import type {
    TreasureHuntFlagSubmitPayload,
    TreasureHuntFlagSubmitRead,
    TreasureHuntLeaderboardRead,
    TreasureHuntProblemRead,
    TreasureHuntTeamProgressRead,
} from '../lib/treasureHuntTypes';
import { apiFetch } from './client';

const SHA_ROUTE_RE = /^[a-f0-9]{64}$/i;

function scanPath(qrToken: string) {
    const encoded = encodeURIComponent(qrToken);
    return `/api/v1/treasure-hunt/scan/${encoded}`;
}

function scanRoutePath(routeHash: string) {
    const encoded = encodeURIComponent(routeHash.trim().toLowerCase());
    return `/api/v1/treasure-hunt/scan/routes/${encoded}`;
}

export function isShaRouteHash(value: string): boolean {
    return SHA_ROUTE_RE.test(value.trim());
}

export async function scanProblemByRouteHash(routeHash: string) {
    return apiFetch<TreasureHuntProblemRead>(scanRoutePath(routeHash), { method: 'GET' });
}

export async function scanProblem(scanPayload: string) {
    if (isShaRouteHash(scanPayload)) {
        return scanProblemByRouteHash(scanPayload);
    }
    return apiFetch<TreasureHuntProblemRead>(scanPath(scanPayload), { method: 'GET' });
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

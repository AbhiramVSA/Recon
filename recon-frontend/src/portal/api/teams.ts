import type { TeamCreatePayload, TeamJoinPayload, TeamRead } from '../lib/treasureHuntTypes';
import { apiFetch } from './client';

export async function createTeam(payload: TeamCreatePayload) {
    return apiFetch<TeamRead>('/api/v1/teams/', { method: 'POST', json: payload });
}

export async function joinTeam(payload: TeamJoinPayload) {
    return apiFetch<TeamRead>('/api/v1/teams/join', { method: 'POST', json: payload });
}

export async function getMyTeam() {
    return apiFetch<TeamRead>('/api/v1/teams/me');
}

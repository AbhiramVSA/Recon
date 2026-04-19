import { apiFetch } from './client';

type AnyObj = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidLike(value: string) {
    return UUID_PATTERN.test(value.trim());
}

async function resolveZoneRegistrationIdentifiers(zoneIdentifier: string) {
    const normalized = zoneIdentifier.trim();
    if (!normalized) {
        throw new Error('Zone identifier is required.');
    }

    if (!isUuidLike(normalized)) {
        const zone = await apiFetch<AnyObj>(`/api/v1/zones/${encodeURIComponent(normalized)}`);
        const zoneId = String(zone.id ?? '').trim();
        const eventId = String(zone.shortName ?? '').trim();
        if (!zoneId || !eventId) {
            throw new Error('Zone lookup did not return the identifiers required for registration.');
        }
        return { zoneId, eventId };
    }

    const zone = await apiFetch<AnyObj>(`/api/v1/zones/${encodeURIComponent(normalized)}`);
    const eventId = String(zone.shortName ?? '').trim();
    if (!eventId) {
        throw new Error('Zone lookup did not return a short name for registration.');
    }
    return { zoneId: normalized, eventId };
}

// auth
export const authApi = {
    googleLoginUrl: '/api/v1/auth/google/login',
    googleCallbackUrl: '/api/v1/auth/google/callback',
    me: () => apiFetch<AnyObj>('/api/v1/auth/me'),
    refresh: () => apiFetch<AnyObj>('/api/v1/auth/refresh', { method: 'POST' }),
    logout: () => apiFetch<AnyObj>('/api/v1/auth/logout', { method: 'POST' }),
};

// users
export const usersApi = {
    create: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/users/', { method: 'POST', json: payload }),
    list: (params?: { skip?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.skip != null) query.set('skip', String(params.skip));
        if (params?.limit != null) query.set('limit', String(params.limit));
        const suffix = query.size > 0 ? `?${query.toString()}` : '';
        return apiFetch<AnyObj[]>(`/api/v1/users/${suffix}`);
    },
    get: (userId: string) => apiFetch<AnyObj>(`/api/v1/users/${encodeURIComponent(userId)}`),
    update: (userId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/users/${encodeURIComponent(userId)}`, { method: 'PATCH', json: payload }),
    remove: (userId: string) =>
        apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
};

// incidents
export const incidentsApi = {
    create: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/incidents/', { method: 'POST', json: payload }),
    list: () => apiFetch<AnyObj[]>('/api/v1/incidents/'),
    get: (incidentId: string) => apiFetch<AnyObj>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`),
    update: (incidentId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/incidents/${encodeURIComponent(incidentId)}`, { method: 'PATCH', json: payload }),
};

// participants
export const participantsApi = {
    me: () => apiFetch<AnyObj>('/api/v1/participants/me'),
    myDashboard: () => apiFetch<AnyObj>('/api/v1/participants/me/dashboard'),
    createMe: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/participants/me', { method: 'POST', json: payload }),
    updateMe: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/participants/me', { method: 'PATCH', json: payload }),
    updateTalentVisibility: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/participants/me/talent-visibility', { method: 'PATCH', json: payload }),
    get: (participantId: string) =>
        apiFetch<AnyObj>(`/api/v1/participants/${encodeURIComponent(participantId)}`),
    list: (params?: { checkedIn?: boolean; skip?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.checkedIn != null) query.set('checked_in', String(params.checkedIn));
        if (params?.skip != null) query.set('skip', String(params.skip));
        if (params?.limit != null) query.set('limit', String(params.limit));
        const suffix = query.size > 0 ? `?${query.toString()}` : '';
        return apiFetch<AnyObj[]>(`/api/v1/participants/${suffix}`);
    },
    checkIn: (participantId: string) =>
        apiFetch<AnyObj>(`/api/v1/participants/${encodeURIComponent(participantId)}/checkin`, { method: 'POST' }),
};

// points
export const pointsApi = {
    award: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/points/award', { method: 'POST', json: payload }),
    me: (recentLimit = 20) => apiFetch<AnyObj>(`/api/v1/points/me?recent_limit=${recentLimit}`),
    leaderboard: (skip = 0, limit = 50) =>
        apiFetch<AnyObj>(`/api/v1/points/leaderboard?skip=${skip}&limit=${limit}`),
    leaderboardMe: () => apiFetch<AnyObj>('/api/v1/points/leaderboard/me'),
    transactions: (params: URLSearchParams) => apiFetch<AnyObj>(`/api/v1/points/transactions?${params.toString()}`),
    teamAwardDelta: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/points/team-events/award-delta', { method: 'POST', json: payload }),
    teamIngestSnapshot: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/points/team-events/ingest-snapshot', { method: 'POST', json: payload }),
    teamLeaderboard: (eventKey?: string, skip = 0, limit = 50) => {
        const query = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (eventKey) query.set('event_key', eventKey);
        return apiFetch<AnyObj>(`/api/v1/points/team-events/leaderboard?${query.toString()}`);
    },
    teamMe: () => apiFetch<AnyObj>('/api/v1/points/team-events/me'),
    teamRules: () => apiFetch<AnyObj>('/api/v1/points/team-events/rules'),
    previewSettlement: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/points/team-events/settlements/preview', { method: 'POST', json: payload }),
    finalizeSettlement: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/points/team-events/settlements', { method: 'POST', json: payload }),
    listSettlements: (params?: { teamId?: string; eventKey?: string }) => {
        const query = new URLSearchParams();
        if (params?.teamId) query.set('team_id', params.teamId);
        if (params?.eventKey) query.set('event_key', params.eventKey);
        const suffix = query.size > 0 ? `?${query.toString()}` : '';
        return apiFetch<AnyObj>(`/api/v1/points/team-events/settlements${suffix}`);
    },
    getSettlement: (settlementId: string) =>
        apiFetch<AnyObj>(`/api/v1/points/team-events/settlements/${encodeURIComponent(settlementId)}`),
};

// zones
export const zonesApi = {
    list: () => apiFetch<AnyObj[]>('/api/v1/zones'),
    get: (zoneId: string) => apiFetch<AnyObj>(`/api/v1/zones/${encodeURIComponent(zoneId)}`),
    register: async (zoneIdentifier: string) => {
        const { eventId } = await resolveZoneRegistrationIdentifiers(zoneIdentifier);
        return apiFetch<AnyObj>(`/api/v1/events/${encodeURIComponent(eventId)}/registrations`, { method: 'POST' });
    },
    unregister: async (zoneIdentifier: string) => {
        const { zoneId } = await resolveZoneRegistrationIdentifiers(zoneIdentifier);
        return apiFetch<AnyObj>(`/api/v1/zones/${encodeURIComponent(zoneId)}/register`, { method: 'DELETE' });
    },
    myRegistrations: () => apiFetch<AnyObj>('/api/v1/me/registrations'),
    myPasses: () => apiFetch<AnyObj>('/api/v1/me/passes'),
    adminScanCheckIn: (payload: AnyObj, idempotencyKey: string) =>
        apiFetch<AnyObj>('/api/v1/admin/scans/check-in', {
            method: 'POST',
            json: payload,
            headers: {
                'X-Idempotency-Key': idempotencyKey,
            },
        }),
};

// teams
export const teamsApi = {
    create: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/teams/', { method: 'POST', json: payload }),
    join: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/teams/join', { method: 'POST', json: payload }),
    me: () => apiFetch<AnyObj>('/api/v1/teams/me'),
    listAdmin: () => apiFetch<AnyObj>('/api/v1/teams/admin'),
    createAdmin: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/teams/admin', { method: 'POST', json: payload }),
    getAdmin: (teamId: string) => apiFetch<AnyObj>(`/api/v1/teams/admin/${encodeURIComponent(teamId)}`),
    updateAdmin: (teamId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/teams/admin/${encodeURIComponent(teamId)}`, { method: 'PATCH', json: payload }),
    deleteAdmin: (teamId: string) =>
        apiFetch<void>(`/api/v1/teams/admin/${encodeURIComponent(teamId)}`, { method: 'DELETE' }),
    assignParticipant: (participantId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/teams/admin/participants/${encodeURIComponent(participantId)}/team`, {
            method: 'PUT',
            json: payload,
        }),
};

// storage (query params match FastAPI `s3_router`: filename, content_type, optional scope)
export const storageApi = {
    uploadUrl: (filename: string, contentType: string, scope?: string) => {
        const q = new URLSearchParams({
            filename,
            content_type: contentType,
        });
        if (scope) q.set('scope', scope);
        return apiFetch<AnyObj>(`/api/v1/r2/upload-url?${q.toString()}`);
    },
    readUrl: (fileKey: string) =>
        apiFetch<AnyObj>(`/api/v1/r2/read-url?file_key=${encodeURIComponent(fileKey)}`),
};

// partners
export const partnersApi = {
    apply: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/partners/apply', { method: 'POST', json: payload }),
    me: () => apiFetch<AnyObj>('/api/v1/partners/me'),
    addIncentive: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/partners/me/incentives', { method: 'POST', json: payload }),
    editIncentive: (incentiveId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/partners/me/incentives/${encodeURIComponent(incentiveId)}`, { method: 'PATCH', json: payload }),
    removeIncentive: (incentiveId: string) =>
        apiFetch<void>(`/api/v1/partners/me/incentives/${encodeURIComponent(incentiveId)}`, { method: 'DELETE' }),
    addAsset: (payload: AnyObj) =>
        apiFetch<AnyObj>('/api/v1/partners/me/assets', { method: 'POST', json: payload }),
    removeAsset: (assetId: string) =>
        apiFetch<void>(`/api/v1/partners/me/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' }),
    list: () => apiFetch<AnyObj[]>('/api/v1/partners/'),
    get: (partnerId: string) => apiFetch<AnyObj>(`/api/v1/partners/${encodeURIComponent(partnerId)}`),
    review: (partnerId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/partners/${encodeURIComponent(partnerId)}/review`, { method: 'POST', json: payload }),
};

// schedule + speakers
export const scheduleApi = {
    listSessions: () => apiFetch<AnyObj[]>('/api/v1/schedule'),
    createSession: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/schedule', { method: 'POST', json: payload }),
    getSession: (sessionId: string) => apiFetch<AnyObj>(`/api/v1/schedule/${encodeURIComponent(sessionId)}`),
    updateSession: (sessionId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/schedule/${encodeURIComponent(sessionId)}`, { method: 'PATCH', json: payload }),
    deleteSession: (sessionId: string) =>
        apiFetch<void>(`/api/v1/schedule/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),
    attachSpeaker: (sessionId: string, speakerId: string, displayOrder = 0) =>
        apiFetch<void>(
            `/api/v1/schedule/${encodeURIComponent(sessionId)}/speakers?speaker_id=${encodeURIComponent(speakerId)}&display_order=${displayOrder}`,
            { method: 'POST' },
        ),
    detachSpeaker: (sessionId: string, speakerId: string) =>
        apiFetch<void>(`/api/v1/schedule/${encodeURIComponent(sessionId)}/speakers/${encodeURIComponent(speakerId)}`, {
            method: 'DELETE',
        }),
    listSpeakers: () => apiFetch<AnyObj[]>('/api/v1/schedule/speakers/all'),
    createSpeaker: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/schedule/speakers', { method: 'POST', json: payload }),
    updateSpeaker: (speakerId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/schedule/speakers/${encodeURIComponent(speakerId)}`, { method: 'PATCH', json: payload }),
    deleteSpeaker: (speakerId: string) =>
        apiFetch<void>(`/api/v1/schedule/speakers/${encodeURIComponent(speakerId)}`, { method: 'DELETE' }),
};

// announcements
export const announcementsApi = {
    list: () => apiFetch<AnyObj[]>('/api/v1/announcements'),
    get: (announcementId: string) => apiFetch<AnyObj>(`/api/v1/announcements/${encodeURIComponent(announcementId)}`),
    create: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/announcements', { method: 'POST', json: payload }),
    update: (announcementId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/announcements/${encodeURIComponent(announcementId)}`, { method: 'PATCH', json: payload }),
    remove: (announcementId: string) =>
        apiFetch<void>(`/api/v1/announcements/${encodeURIComponent(announcementId)}`, { method: 'DELETE' }),
};

// shop
export const shopApi = {
    list: () => apiFetch<AnyObj[]>('/api/v1/shop'),
    get: (itemId: string) => apiFetch<AnyObj>(`/api/v1/shop/${encodeURIComponent(itemId)}`),
    redeem: (itemId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/shop/${encodeURIComponent(itemId)}/redeem`, { method: 'POST', json: payload }),
    myRedemptions: () => apiFetch<AnyObj[]>('/api/v1/shop/me/redemptions'),
    redemptions: (params?: { fulfilled?: boolean; returned?: boolean }) => {
        const query = new URLSearchParams();
        if (params?.fulfilled != null) query.set('fulfilled', String(params.fulfilled));
        if (params?.returned != null) query.set('returned', String(params.returned));
        const suffix = query.size > 0 ? `?${query.toString()}` : '';
        return apiFetch<AnyObj[]>(`/api/v1/shop/redemptions${suffix}`);
    },
    fulfill: (redemptionId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/shop/redemptions/${encodeURIComponent(redemptionId)}/fulfill`, {
            method: 'PATCH',
            json: payload,
        }),
    returnRedemption: (redemptionId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/shop/redemptions/${encodeURIComponent(redemptionId)}/return`, {
            method: 'PATCH',
            json: payload,
        }),
    create: (payload: AnyObj) => apiFetch<AnyObj>('/api/v1/shop', { method: 'POST', json: payload }),
    update: (itemId: string, payload: AnyObj) =>
        apiFetch<AnyObj>(`/api/v1/shop/${encodeURIComponent(itemId)}`, { method: 'PATCH', json: payload }),
};


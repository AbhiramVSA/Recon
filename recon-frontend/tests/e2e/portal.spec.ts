import { expect, test } from '@playwright/test';

type RouteContext = {
    createdProfiles: unknown[];
    updatedProfiles: unknown[];
    eventRegistrations: string[];
    createdTeams: unknown[];
    joinedTeams: unknown[];
    updatedTeams: unknown[];
    deletedTeams: string[];
    adminAssignments: unknown[];
    scanRequests: unknown[];
    createdUsers: unknown[];
    updatedUsers: unknown[];
    deletedUsers: string[];
    createdAnnouncements: unknown[];
    updatedAnnouncements: unknown[];
    deletedAnnouncements: string[];
    createdShopItems: unknown[];
    updatedShopItems: unknown[];
    redeemedRequests: string[];
    fulfilledRedemptions: string[];
    returnedRedemptions: string[];
    pointAwards: unknown[];
    teamEventAwards: unknown[];
    settlementPreviews: unknown[];
    settlementFinalizations: unknown[];
};

type UserRow = Record<string, unknown>;
type TeamRow = Record<string, unknown>;
type ParticipantRow = Record<string, unknown>;
type AnnouncementRow = Record<string, unknown>;
type ShopItemRow = Record<string, unknown>;
type RedemptionRow = Record<string, unknown>;

async function stubPortalApi(page: import('@playwright/test').Page, options?: {
    participantProfile?: Record<string, unknown> | null;
    dashboard?: Record<string, unknown>;
    zones?: Array<Record<string, unknown>>;
    registrations?: string[];
    passes?: Array<Record<string, unknown>>;
    teams?: TeamRow[];
    myTeam?: TeamRow | null;
    participants?: ParticipantRow[];
    huntProgress?: Record<string, unknown>;
    users?: UserRow[];
    announcements?: AnnouncementRow[];
    shopItems?: ShopItemRow[];
    redemptions?: RedemptionRow[];
    isAdmin?: boolean;
}) {
    const ctx: RouteContext = {
        createdProfiles: [],
        updatedProfiles: [],
        eventRegistrations: [],
        createdTeams: [],
        joinedTeams: [],
        updatedTeams: [],
        deletedTeams: [],
        adminAssignments: [],
        scanRequests: [],
        createdUsers: [],
        updatedUsers: [],
        deletedUsers: [],
        createdAnnouncements: [],
        updatedAnnouncements: [],
        deletedAnnouncements: [],
        createdShopItems: [],
        updatedShopItems: [],
        redeemedRequests: [],
        fulfilledRedemptions: [],
        returnedRedemptions: [],
        pointAwards: [],
        teamEventAwards: [],
        settlementPreviews: [],
        settlementFinalizations: [],
    };

    const participantProfile = options?.participantProfile ?? null;
    const dashboard = options?.dashboard ?? {
        displayName: participantProfile?.display_name ?? 'Ciphercat',
        registrationId: participantProfile?.id ?? 'participant-1',
        pointsBalance: 120,
        zonesCheckedInCount: 2,
        checkedInZoneIds: ['zone-ctf', 'zone-web'],
        eventsRegisteredCount: 3,
        leaderboardRank: 4,
    };
    const zones = options?.zones ?? [
        {
            id: 'zone-ctf',
            name: 'CTF',
            shortName: 'CTF',
            category: 'FLAGSHIP',
            type: 'flagship',
            tags: ['binary', 'web'],
            status: 'green',
            location: 'Block A',
            points: 100,
            registrationRequired: true,
            registrationPoints: 0,
            checkInPoints: 100,
            registeredCount: 12,
            color: '#ffaa00',
        },
        {
            id: 'zone-forensics',
            name: 'Forensics Sprint',
            shortName: 'FOREN',
            category: 'FORENSICS',
            type: 'side',
            tags: ['forensics'],
            status: 'green',
            location: 'Block B',
            points: 100,
            registrationRequired: true,
            registrationPoints: 0,
            checkInPoints: 20,
            registeredCount: 6,
            color: '#00ffaa',
        },
    ];
    const registrations = options?.registrations ?? ['zone-ctf'];
    const passes = options?.passes ?? [
        {
            zoneId: 'zone-ctf',
            code: 'PASS-CTF-001',
            isActive: true,
            checkedInAt: null,
        },
    ];
    const teams = options?.teams ?? [
        {
            id: 'team-1',
            name: 'Zero Cool',
            invite_code: 'AB12CD',
            created_by_participant_id: 'participant-1',
            created_at: '2026-04-19T08:00:00Z',
            members: [{ participant_id: 'participant-1', display_name: 'Ciphercat', joined_at: '2026-04-19T08:00:00Z' }],
        },
    ];
    const participants = options?.participants ?? [
        { id: 'participant-1', display_name: 'Ciphercat', institution: 'VIT-AP' },
        { id: 'participant-2', display_name: 'Shellfox', institution: 'VIT-AP' },
    ];
    const users = options?.users ?? Array.from({ length: 25 }, (_, index) => ({
        id: `user-${index + 1}`,
        email: `user${index + 1}@example.com`,
        username: `user${index + 1}`,
        is_active: index % 6 !== 0,
        created_at: `2026-04-${String((index % 9) + 10).padStart(2, '0')}T08:00:00Z`,
        role: { id: `role-${index + 1}`, name: index % 5 === 0 ? 'admin' : 'participant' },
    }));
    const announcements = options?.announcements ?? [
        {
            id: 'announcement-1',
            title: 'Opening Briefing',
            body: 'Report to the main hall by 09:00.',
            priority: 'info',
            published_at: '2026-04-19T08:00:00Z',
            expires_at: null,
            is_pinned: true,
        },
    ];
    const shopItems = options?.shopItems ?? [
        {
            id: 'shop-1',
            name: 'RECON Tee',
            description: 'Operator edition',
            point_cost: 2000,
            stock: 20,
            remaining_stock: 18,
            is_active: true,
            photo_key: '/merch/merch01.webp',
        },
    ];
    const redemptions = options?.redemptions ?? [
        {
            id: 'redemption-1',
            participant_id: 'participant-1',
            participant_display_name: 'Ciphercat',
            participant_email: 'ciphercat@example.com',
            participant_username: 'ciphercat',
            item_id: 'shop-1',
            item_name: 'RECON Tee',
            point_cost: 2000,
            redeemed_at: '2026-04-19T10:00:00Z',
            fulfilled_at: null,
            fulfillment_notes: null,
            returned_at: null,
            return_notes: null,
        },
    ];

    let currentRegistrations = [...registrations];
    let currentPasses = [...passes];
    let currentTeams = teams.map((team) => ({ ...team, members: [...((team.members as Array<Record<string, unknown>> | undefined) ?? [])] }));
    let currentMyTeam = options?.myTeam === undefined
        ? (currentTeams[0] ?? null)
        : (options.myTeam ? { ...options.myTeam, members: [...((options.myTeam.members as Array<Record<string, unknown>> | undefined) ?? [])] } : null);
    let currentPointsBalance = Number(dashboard.pointsBalance ?? 120);
    let currentUsers = users.map((user) => ({ ...user }));
    let currentAnnouncements = announcements.map((row) => ({ ...row }));
    let currentShopItems = shopItems.map((item) => ({ ...item }));
    let currentRedemptions = redemptions.map((row) => ({ ...row }));
    let currentSettlements: Array<Record<string, unknown>> = [];

    const currentParticipantId = String(participantProfile?.id ?? 'participant-1');
    const currentParticipantName = String(participantProfile?.display_name ?? 'Ciphercat');
    const currentHuntProgress = options?.huntProgress ?? {
        team_id: String(currentMyTeam?.id ?? 'team-1'),
        team_name: String(currentMyTeam?.name ?? 'Zero Cool'),
        solved_count: 0,
        total_problems: 10,
        remaining_count: 10,
        leaderboard_rank: 4,
        last_solved_at: null,
        completed_at: null,
        finish_rank: null,
        problems: [],
    };
    const registrationLookup = new Map<string, { registrationId: string; eventId: string; zoneId: string }>();

    const findZone = (identifier: string) =>
        zones.find((zone) => zone.id === identifier || String(zone.shortName).toLowerCase() === identifier.toLowerCase()) ?? null;

    await page.route('**/api/v1/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;
        const method = request.method();

        if (path.endsWith('/auth/me')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: options?.isAdmin ? 'user-admin' : 'user-1',
                    email: 'ciphercat@example.com',
                    username: 'ciphercat',
                    is_active: true,
                    created_at: '2026-04-19T08:00:00Z',
                    role: { id: options?.isAdmin ? 'role-admin' : 'role-participant', name: options?.isAdmin ? 'admin' : 'participant' },
                }),
            });
        }

        if (path.endsWith('/users/') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentUsers),
            });
        }

        if (path.endsWith('/users/') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.createdUsers.push(payload);
            const created = {
                id: `user-${currentUsers.length + 1}`,
                email: String(payload.email ?? ''),
                username: String(payload.username ?? ''),
                is_active: true,
                created_at: '2026-04-19T12:00:00Z',
                role: { id: `role-${currentUsers.length + 1}`, name: String(payload.role_name ?? 'participant') },
            };
            currentUsers = [created, ...currentUsers];
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.includes('/users/') && method === 'GET') {
            const userId = path.split('/users/')[1];
            const user = currentUsers.find((row) => row.id === userId);
            return route.fulfill({
                status: user ? 200 : 404,
                contentType: 'application/json',
                body: JSON.stringify(user ?? { detail: 'User not found' }),
            });
        }

        if (path.includes('/users/') && method === 'PATCH') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            const userId = path.split('/users/')[1];
            ctx.updatedUsers.push({ userId, ...payload });
            currentUsers = currentUsers.map((row) => (
                row.id === userId
                    ? {
                        ...row,
                        email: String(payload.email ?? row.email),
                        username: String(payload.username ?? row.username),
                        is_active: payload.is_active == null ? row.is_active : Boolean(payload.is_active),
                        role: payload.role_name ? { ...(row.role as Record<string, unknown>), name: String(payload.role_name) } : row.role,
                    }
                    : row
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentUsers.find((row) => row.id === userId)),
            });
        }

        if (path.includes('/users/') && method === 'DELETE') {
            const userId = path.split('/users/')[1];
            ctx.deletedUsers.push(userId);
            currentUsers = currentUsers.filter((row) => row.id !== userId);
            return route.fulfill({ status: 204, body: '' });
        }

        if (path.endsWith('/participants/me') && method === 'GET') {
            if (!participantProfile) {
                return route.fulfill({
                    status: 404,
                    contentType: 'application/json',
                    body: JSON.stringify({ detail: 'Participant profile not found' }),
                });
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(participantProfile),
            });
        }

        if (path.endsWith('/participants/me') && method === 'POST') {
            ctx.createdProfiles.push(request.postDataJSON());
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'participant-1',
                    user_id: 'user-1',
                    display_name: 'Ciphercat',
                    institution: 'VIT-AP',
                    year: 5,
                    talent_visible: false,
                    talent_contact_shareable: false,
                    created_at: '2026-04-19T08:00:00Z',
                    can_edit: true,
                    is_self: true,
                }),
            });
        }

        if (path.endsWith('/participants/me') && method === 'PATCH') {
            ctx.updatedProfiles.push(request.postDataJSON());
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ...(participantProfile ?? {}),
                    ...(request.postDataJSON() as Record<string, unknown>),
                }),
            });
        }

        if (path.endsWith('/participants/me/dashboard') || path.endsWith('/me/dashboard')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(dashboard),
            });
        }

        if (path.endsWith('/announcements') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentAnnouncements),
            });
        }

        if (path.endsWith('/announcements') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.createdAnnouncements.push(payload);
            const created = {
                id: `announcement-${currentAnnouncements.length + 1}`,
                title: String(payload.title ?? 'Announcement'),
                body: String(payload.body ?? ''),
                priority: String(payload.priority ?? 'info'),
                published_at: String(payload.published_at ?? '2026-04-19T08:00:00Z'),
                expires_at: payload.expires_at ?? null,
                is_pinned: Boolean(payload.is_pinned),
            };
            currentAnnouncements = [created, ...currentAnnouncements];
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.includes('/announcements/') && method === 'PATCH') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            const announcementId = path.split('/announcements/')[1];
            ctx.updatedAnnouncements.push({ announcementId, ...payload });
            currentAnnouncements = currentAnnouncements.map((row) => (
                row.id === announcementId ? { ...row, ...payload } : row
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentAnnouncements.find((row) => row.id === announcementId)),
            });
        }

        if (path.includes('/announcements/') && method === 'DELETE') {
            const announcementId = path.split('/announcements/')[1];
            ctx.deletedAnnouncements.push(announcementId);
            currentAnnouncements = currentAnnouncements.filter((row) => row.id !== announcementId);
            return route.fulfill({ status: 204, body: '' });
        }

        if (path.endsWith('/zones') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(zones),
            });
        }

        if (path.includes('/zones/') && method === 'GET') {
            const identifier = decodeURIComponent(path.split('/zones/')[1] ?? '');
            const zone = findZone(identifier);
            return route.fulfill({
                status: zone ? 200 : 404,
                contentType: 'application/json',
                body: JSON.stringify(zone ?? { detail: 'Zone not found' }),
            });
        }

        if (path.endsWith('/me/registrations')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ zoneIds: currentRegistrations }),
            });
        }

        if (path.endsWith('/me/passes')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ passes: currentPasses }),
            });
        }

        if (path.includes('/events/') && path.endsWith('/registrations')) {
            const eventId = path.split('/events/')[1].split('/registrations')[0];
            const zone = findZone(eventId);
            const zoneId = String(zone?.id ?? eventId);
            const registrationId = `registration-${eventId}`;
            ctx.eventRegistrations.push(eventId);
            if (!currentRegistrations.includes(zoneId)) {
                currentRegistrations = [...currentRegistrations, zoneId];
            }
            currentPasses = currentPasses.filter((pass) => String(pass.zoneId) !== zoneId);
            currentPasses.push({
                zoneId,
                code: `PASS-${eventId.toUpperCase()}`,
                isActive: true,
                checkedInAt: null,
            });
            registrationLookup.set(registrationId, { registrationId, eventId, zoneId });
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    registrationId,
                    eventId,
                    qrToken: `signed-token-${eventId}`,
                    qrExpiresAt: '2026-04-20T08:00:00Z',
                    pointsAwarded: 0,
                    newPointsBalance: currentPointsBalance,
                }),
            });
        }

        if (path.includes('/registrations/') && path.endsWith('/qr')) {
            const registrationId = path.split('/registrations/')[1].split('/qr')[0];
            const registration = registrationLookup.get(registrationId);
            return route.fulfill({
                status: registration ? 200 : 404,
                contentType: 'application/json',
                body: JSON.stringify(
                    registration
                        ? {
                            registrationId,
                            eventId: registration.eventId,
                            qrToken: `signed-token-${registration.eventId}`,
                            qrExpiresAt: '2026-04-20T08:00:00Z',
                            pointsAwarded: 0,
                            newPointsBalance: currentPointsBalance,
                        }
                        : { detail: 'Registration not found' },
                ),
            });
        }

        if (path.endsWith('/points/me')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    participant_id: currentParticipantId,
                    balance: currentPointsBalance,
                }),
            });
        }

        if (path.endsWith('/points/leaderboard')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    total_ranked: 2,
                    skip: 0,
                    limit: 50,
                    entries: [
                        { rank: 1, participant_id: 'participant-1', display_name: 'Ciphercat', points: currentPointsBalance },
                        { rank: 2, participant_id: 'participant-2', display_name: 'Shellfox', points: 90 },
                    ],
                }),
            });
        }

        if (path.endsWith('/points/transactions')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    total: 1,
                    skip: 0,
                    limit: 100,
                    transactions: [
                        {
                            id: 'txn-1',
                            participant_id: currentParticipantId,
                            amount: 10,
                            reason: 'manual_award',
                            reference_id: null,
                            idempotency_key: 'txn-key',
                            note: 'Awarded from admin ops',
                            resulting_balance: currentPointsBalance,
                            awarded_by_user_id: 'user-admin',
                            created_at: '2026-04-19T11:00:00Z',
                        },
                    ],
                }),
            });
        }

        if (path.endsWith('/points/award') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.pointAwards.push(payload);
            currentPointsBalance += Number(payload.amount ?? 0);
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    transaction: {
                        id: 'txn-award',
                        participant_id: String(payload.participant_id),
                        amount: Number(payload.amount),
                        reason: String(payload.reason),
                        reference_id: null,
                        idempotency_key: String(payload.idempotency_key),
                        note: payload.note ?? null,
                        resulting_balance: currentPointsBalance,
                        awarded_by_user_id: 'user-admin',
                        created_at: '2026-04-19T11:10:00Z',
                    },
                    resulting_balance: currentPointsBalance,
                }),
            });
        }

        if (path.endsWith('/points/team-events/rules')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    rules: [
                        {
                            event_key: 'treasure_hunt',
                            display_name: 'Treasure Hunt',
                            default_raw_score_ceiling: 100,
                            default_normalized_points_ceiling: 100,
                            supports_snapshot_ingest: true,
                            supports_delta_awards: true,
                            note: 'Stubbed rules',
                        },
                    ],
                }),
            });
        }

        if (path.endsWith('/points/team-events/leaderboard')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    event_key: 'treasure_hunt',
                    total_ranked: 1,
                    skip: 0,
                    limit: 50,
                    entries: [
                        { rank: 1, team_id: 'team-1', team_name: 'Zero Cool', normalized_points: 100, last_activity_at: '2026-04-19T11:00:00Z' },
                    ],
                }),
            });
        }

        if ((path.endsWith('/points/team-events/award-delta') || path.endsWith('/points/team-events/ingest-snapshot')) && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.teamEventAwards.push(payload);
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    transaction: {
                        id: 'team-award-1',
                        team_id: String(payload.team_id),
                        event_key: String(payload.event_key),
                        round_key: String(payload.round_key ?? 'main'),
                        mutation_type: path.endsWith('/award-delta') ? 'delta' : 'snapshot',
                        raw_score_delta: Number(payload.raw_score_delta ?? 0),
                        normalized_points_delta: 15,
                        resulting_raw_score: Number(payload.raw_score_total ?? payload.raw_score_delta ?? 0),
                        resulting_normalized_points: 15,
                        raw_score_ceiling: Number(payload.raw_score_ceiling ?? 100),
                        normalized_points_ceiling: Number(payload.normalized_points_ceiling ?? 100),
                        source: String(payload.source ?? 'admin.portal'),
                        source_reference: payload.source_reference ?? null,
                        idempotency_key: String(payload.idempotency_key),
                        note: payload.note ?? null,
                        details_json: payload.details_json ?? null,
                        recorded_by_user_id: 'user-admin',
                        created_at: '2026-04-19T11:20:00Z',
                    },
                    round_score: {
                        team_id: String(payload.team_id),
                        event_key: String(payload.event_key),
                        round_key: String(payload.round_key ?? 'main'),
                        raw_score_total: Number(payload.raw_score_total ?? payload.raw_score_delta ?? 0),
                        raw_score_ceiling: Number(payload.raw_score_ceiling ?? 100),
                        normalized_points_total: 15,
                        normalized_points_ceiling: Number(payload.normalized_points_ceiling ?? 100),
                        last_activity_at: '2026-04-19T11:20:00Z',
                    },
                }),
            });
        }

        if (path.endsWith('/points/team-events/settlements/preview') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.settlementPreviews.push(payload);
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    team_id: String(payload.team_id),
                    team_name: 'Zero Cool',
                    event_key: String(payload.event_key),
                    round_key: String(payload.round_key),
                    allocation_mode: 'equal_split',
                    member_count: 2,
                    participant_points_budget: Number(payload.participant_points_budget),
                    source_raw_score_total: 100,
                    source_raw_score_ceiling: 100,
                    source_normalized_points_total: 50,
                    source_normalized_points_ceiling: 100,
                    allocations: [
                        { participant_id: 'participant-1', display_name: 'Ciphercat', allocated_points: 150 },
                        { participant_id: 'participant-2', display_name: 'Shellfox', allocated_points: 150 },
                    ],
                    note: payload.note ?? null,
                }),
            });
        }

        if (path.endsWith('/points/team-events/settlements') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.settlementFinalizations.push(payload);
            const created = {
                id: `settlement-${currentSettlements.length + 1}`,
                team_id: String(payload.team_id),
                team_name: 'Zero Cool',
                event_key: String(payload.event_key),
                round_key: String(payload.round_key),
                allocation_mode: 'equal_split',
                participant_points_budget: Number(payload.participant_points_budget),
                source_raw_score_total: 100,
                source_raw_score_ceiling: 100,
                source_normalized_points_total: 50,
                source_normalized_points_ceiling: 100,
                settled_at: '2026-04-19T11:30:00Z',
                settled_by_user_id: 'user-admin',
                idempotency_key: String(payload.idempotency_key),
                note: payload.note ?? null,
                allocations: [
                    { participant_id: 'participant-1', display_name: 'Ciphercat', allocated_points: 150 },
                    { participant_id: 'participant-2', display_name: 'Shellfox', allocated_points: 150 },
                ],
            };
            currentSettlements = [created, ...currentSettlements];
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.endsWith('/points/team-events/settlements') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ settlements: currentSettlements }),
            });
        }

        if (path.includes('/points/team-events/settlements/') && method === 'GET') {
            const settlementId = path.split('/points/team-events/settlements/')[1];
            const settlement = currentSettlements.find((row) => String(row.id) === settlementId);
            return route.fulfill({
                status: settlement ? 200 : 404,
                contentType: 'application/json',
                body: JSON.stringify(settlement ?? { detail: 'Settlement not found' }),
            });
        }

        if (path.endsWith('/admin/scans/check-in') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.scanRequests.push(payload);
            const token = String(payload.qrToken ?? '');
            const eventId = token.replace('signed-token-', '');
            const zone = findZone(eventId);
            const awarded = Number(zone?.checkInPoints ?? 0);
            currentPointsBalance += awarded;
            currentPasses = currentPasses.map((pass) => (
                String(pass.zoneId) === String(zone?.id)
                    ? { ...pass, isActive: false, checkedInAt: '2026-04-19T11:00:00Z' }
                    : pass
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'checked_in',
                    checkInId: `checkin-${eventId}`,
                    participantId: currentParticipantId,
                    participantName: currentParticipantName,
                    eventId,
                    eventName: zone?.name ?? eventId,
                    pointsAwarded: awarded,
                    newPointsBalance: currentPointsBalance,
                    checkedInAt: '2026-04-19T11:00:00Z',
                }),
            });
        }

        if (path.endsWith('/teams/me') && method === 'GET') {
            if (!currentMyTeam) {
                return route.fulfill({
                    status: 404,
                    contentType: 'application/json',
                    body: JSON.stringify({ detail: 'Participant is not part of a team' }),
                });
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentMyTeam),
            });
        }

        if (path.endsWith('/teams/join') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.joinedTeams.push(payload);
            const inviteCode = String(payload.invite_code ?? '').trim().toUpperCase();
            const matched = currentTeams.find((team) => String(team.invite_code).toUpperCase() === inviteCode);
            if (!matched) {
                return route.fulfill({
                    status: 404,
                    contentType: 'application/json',
                    body: JSON.stringify({ detail: 'Team not found' }),
                });
            }
            const nextMember = {
                participant_id: currentParticipantId,
                display_name: currentParticipantName,
                joined_at: '2026-04-19T09:00:00Z',
            };
            const dedupedMembers = [
                ...(((matched.members as Array<Record<string, unknown>> | undefined) ?? []).filter((member) => String(member.participant_id) !== currentParticipantId)),
                nextMember,
            ];
            currentMyTeam = { ...matched, members: dedupedMembers };
            currentTeams = currentTeams.map((team) => team.id === matched.id ? currentMyTeam as Record<string, unknown> : team);
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentMyTeam),
            });
        }

        if (path.endsWith('/teams/') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.createdTeams.push(payload);
            const created = {
                id: `team-${currentTeams.length + 1}`,
                name: String(payload.name ?? 'New Team'),
                invite_code: 'ZX90QP',
                created_by_participant_id: currentParticipantId,
                created_at: '2026-04-19T08:30:00Z',
                members: [
                    {
                        participant_id: currentParticipantId,
                        display_name: currentParticipantName,
                        joined_at: '2026-04-19T08:30:00Z',
                    },
                ],
            };
            currentTeams = [...currentTeams, created];
            currentMyTeam = created;
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.endsWith('/teams/admin') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ teams: currentTeams }),
            });
        }

        if (path.includes('/teams/admin/') && method === 'GET' && !path.includes('/participants/')) {
            const teamId = path.split('/teams/admin/')[1];
            const team = currentTeams.find((row) => row.id === teamId);
            return route.fulfill({
                status: team ? 200 : 404,
                contentType: 'application/json',
                body: JSON.stringify(team ?? { detail: 'Team not found' }),
            });
        }

        if (path.endsWith('/participants/') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(participants),
            });
        }

        if (path.endsWith('/teams/admin') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.createdTeams.push(payload);
            const created = {
                id: `team-${currentTeams.length + 1}`,
                name: String(payload.name ?? 'Admin Team'),
                invite_code: 'MN45PQ',
                created_by_participant_id: payload.created_by_participant_id ?? null,
                created_at: '2026-04-19T08:45:00Z',
                members: [],
            };
            currentTeams = [...currentTeams, created];
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.includes('/teams/admin/participants/') && path.endsWith('/team')) {
            const payload = request.postDataJSON() as Record<string, unknown>;
            const participantId = path.split('/teams/admin/participants/')[1].split('/team')[0];
            ctx.adminAssignments.push({ participantId, ...payload });
            const targetTeamId = String(payload.target_team_id ?? '');
            currentTeams = currentTeams.map((team) => ({
                ...team,
                members: ((team.members as Array<Record<string, unknown>> | undefined) ?? []).filter((member) => String(member.participant_id) !== participantId),
            }));
            if (targetTeamId) {
                currentTeams = currentTeams.map((team) => (
                    team.id === targetTeamId
                        ? {
                            ...team,
                            members: [
                                ...(((team.members as Array<Record<string, unknown>> | undefined) ?? [])),
                                {
                                    participant_id: participantId,
                                    display_name: participants.find((participant) => participant.id === participantId)?.display_name ?? 'Participant',
                                    joined_at: '2026-04-19T09:05:00Z',
                                },
                            ],
                        }
                        : team
                ));
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    participant_id: participantId,
                    team_id: targetTeamId || null,
                    team_name: currentTeams.find((team) => team.id === targetTeamId)?.name ?? null,
                }),
            });
        }

        if (path.includes('/teams/admin/') && method === 'PATCH') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            const teamId = path.split('/teams/admin/')[1];
            ctx.updatedTeams.push({ teamId, ...payload });
            currentTeams = currentTeams.map((team) => (
                team.id === teamId
                    ? {
                        ...team,
                        name: String(payload.name ?? team.name),
                        invite_code: Boolean(payload.regenerate_invite_code) ? 'RG56ST' : String(payload.invite_code ?? team.invite_code),
                        created_by_participant_id: payload.created_by_participant_id ?? team.created_by_participant_id,
                    }
                    : team
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentTeams.find((team) => team.id === teamId)),
            });
        }

        if (path.includes('/teams/admin/') && method === 'DELETE') {
            const teamId = path.split('/teams/admin/')[1];
            ctx.deletedTeams.push(teamId);
            currentTeams = currentTeams.filter((team) => team.id !== teamId);
            return route.fulfill({ status: 204, body: '' });
        }

        if (path.endsWith('/shop') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentShopItems),
            });
        }

        if (path.endsWith('/shop/redemptions') && method === 'GET') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentRedemptions),
            });
        }

        if (path.endsWith('/shop/me/redemptions') && method === 'GET') {
            const mine = currentRedemptions.filter((row) => String(row.participant_id) === currentParticipantId);
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mine),
            });
        }

        if (path.includes('/shop/') && path.endsWith('/redeem') && method === 'POST') {
            const itemId = path.split('/shop/')[1].split('/redeem')[0];
            ctx.redeemedRequests.push(itemId);
            const item = currentShopItems.find((row) => row.id === itemId);
            if (!item) {
                return route.fulfill({
                    status: 404,
                    contentType: 'application/json',
                    body: JSON.stringify({ detail: 'Shop item not found' }),
                });
            }

            const remaining = Number(item.remaining_stock ?? item.stock ?? 0);
            if (remaining <= 0) {
                return route.fulfill({
                    status: 409,
                    contentType: 'application/json',
                    body: JSON.stringify({ detail: 'Item is out of stock' }),
                });
            }

            currentShopItems = currentShopItems.map((row) => (
                row.id === itemId
                    ? { ...row, remaining_stock: Math.max(0, Number(row.remaining_stock ?? row.stock ?? 0) - 1) }
                    : row
            ));

            const created = {
                id: `redemption-${currentRedemptions.length + 1}`,
                participant_id: currentParticipantId,
                participant_display_name: currentParticipantName,
                participant_email: 'ciphercat@example.com',
                participant_username: 'ciphercat',
                item_id: String(item.id),
                item_name: String(item.name),
                point_cost: Number(item.point_cost ?? 0),
                redeemed_at: '2026-04-19T12:05:00Z',
                fulfilled_at: null,
                fulfillment_notes: null,
                returned_at: null,
                return_notes: null,
            };
            currentRedemptions = [created, ...currentRedemptions];
            currentPointsBalance = Math.max(0, currentPointsBalance - Number(item.point_cost ?? 0));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.endsWith('/shop') && method === 'POST') {
            const payload = request.postDataJSON() as Record<string, unknown>;
            ctx.createdShopItems.push(payload);
            const created = {
                id: `shop-${currentShopItems.length + 1}`,
                name: String(payload.name ?? 'New Item'),
                description: String(payload.description ?? ''),
                point_cost: Number(payload.point_cost ?? 100),
                stock: payload.stock ?? 10,
                remaining_stock: payload.stock ?? 10,
                is_active: true,
                photo_key: payload.photo_key ?? null,
            };
            currentShopItems = [created, ...currentShopItems];
            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
        }

        if (path.includes('/shop/redemptions/') && path.endsWith('/fulfill') && method === 'PATCH') {
            const redemptionId = path.split('/shop/redemptions/')[1].split('/fulfill')[0];
            ctx.fulfilledRedemptions.push(redemptionId);
            currentRedemptions = currentRedemptions.map((row) => (
                row.id === redemptionId ? { ...row, fulfilled_at: '2026-04-19T12:10:00Z' } : row
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentRedemptions.find((row) => row.id === redemptionId)),
            });
        }

        if (path.includes('/shop/redemptions/') && path.endsWith('/return') && method === 'PATCH') {
            const redemptionId = path.split('/shop/redemptions/')[1].split('/return')[0];
            ctx.returnedRedemptions.push(redemptionId);
            currentRedemptions = currentRedemptions.map((row) => (
                row.id === redemptionId ? { ...row, returned_at: '2026-04-19T12:15:00Z' } : row
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentRedemptions.find((row) => row.id === redemptionId)),
            });
        }

        if (path.includes('/shop/') && method === 'PATCH' && !path.includes('/redemptions/')) {
            const payload = request.postDataJSON() as Record<string, unknown>;
            const itemId = path.split('/shop/')[1];
            ctx.updatedShopItems.push({ itemId, ...payload });
            currentShopItems = currentShopItems.map((row) => (
                row.id === itemId ? { ...row, ...payload } : row
            ));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(currentShopItems.find((row) => row.id === itemId)),
            });
        }

        if (path.endsWith('/treasure-hunt/me/progress')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ...currentHuntProgress,
                    team_id: String(currentMyTeam?.id ?? currentHuntProgress.team_id),
                    team_name: String(currentMyTeam?.name ?? currentHuntProgress.team_name),
                }),
            });
        }

        if (path.includes('/auth/logout') || path.includes('/auth/refresh') || path.endsWith('/participants/me/talent-visibility')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ status: 'ok' }),
            });
        }

        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({}),
        });
    });

    return ctx;
}

test('profile setup enforces year bounds and submits valid year', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null });

    await page.goto('/profile/setup');
    await page.getByPlaceholder('Alex Operator').fill('Ciphercat');
    await page.getByPlaceholder('VIT-AP University').fill('VIT-AP');

    await page.locator('input[type="number"]').first().fill('0');
    await expect(page.getByText('Year must be at least 1.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CREATE PROFILE ->' })).toBeDisabled();

    await page.locator('input[type="number"]').first().fill('6');
    await expect(page.getByText('Year must not exceed 5.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CREATE PROFILE ->' })).toBeDisabled();

    await page.locator('input[type="number"]').first().fill('5');
    await page.getByRole('button', { name: 'CREATE PROFILE ->' }).click();

    await expect.poll(() => ctx.createdProfiles.length).toBe(1);
    expect(ctx.createdProfiles[0]).toMatchObject({ year: 5, display_name: 'Ciphercat', institution: 'VIT-AP' });
});

test('settings blocks invalid year and patches valid update', async ({ page }) => {
    const profile = {
        id: 'participant-1',
        user_id: 'user-1',
        display_name: 'Ciphercat',
        institution: 'VIT-AP',
        year: 2,
        talent_visible: false,
        talent_contact_shareable: false,
        created_at: '2026-04-19T08:00:00Z',
        can_edit: true,
        is_self: true,
    };
    const ctx = await stubPortalApi(page, { participantProfile: profile });

    await page.goto('/settings');
    await page.locator('input[type="number"]').first().fill('6');
    await expect(page.getByText('Year must not exceed 5.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'SAVE PROFILE' })).toBeDisabled();

    await page.locator('input[type="number"]').first().fill('5');
    await page.getByRole('button', { name: 'SAVE PROFILE' }).click();

    await expect.poll(() => ctx.updatedProfiles.length).toBe(1);
    expect(ctx.updatedProfiles[0]).toMatchObject({ year: 5 });
});

test('dashboard shows backend rank and zone registration uses canonical event endpoint', async ({ page }) => {
    const profile = {
        id: 'participant-1',
        user_id: 'user-1',
        display_name: 'Ciphercat',
        institution: 'VIT-AP',
        year: 2,
        talent_visible: false,
        talent_contact_shareable: false,
        created_at: '2026-04-19T08:00:00Z',
        can_edit: true,
        is_self: true,
    };
    const ctx = await stubPortalApi(page, {
        participantProfile: profile,
        dashboard: {
            displayName: 'Ciphercat',
            registrationId: 'participant-1',
            pointsBalance: 320,
            zonesCheckedInCount: 2,
            checkedInZoneIds: ['zone-ctf', 'zone-web'],
            eventsRegisteredCount: 4,
            leaderboardRank: 3,
        },
    });

    await page.goto('/dashboard');
    const stats = page.locator('.grid.grid-cols-2.lg\\:grid-cols-4 > div');
    await expect(stats.nth(2)).toContainText('4');
    await expect(stats.nth(3)).toContainText('#3');

    await page.goto('/zones');
    await page.getByRole('button', { name: 'REGISTER FOR THIS ZONE ->' }).first().click();
    await page.getByRole('button', { name: 'ACKNOWLEDGE ->' }).click();

    await expect.poll(() => ctx.eventRegistrations.includes('FOREN')).toBeTruthy();
    await expect(page.getByRole('button', { name: 'VIEW PASS ->' })).toHaveCount(1);
});

test('admin users page loads the full directory and supports create + update', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null, isAdmin: true });
    const createForm = page.locator('form').nth(0);
    const editForm = page.locator('form').nth(1);

    await page.goto('/admin/users');
    await expect(page.getByText('DIRECTORY (25/25)')).toBeVisible();

    await createForm.getByPlaceholder('email', { exact: true }).fill('ops-new@example.com');
    await createForm.getByPlaceholder('username', { exact: true }).fill('opsnew');
    await createForm.getByPlaceholder('password', { exact: true }).fill('super-secret');
    await createForm.locator('select').selectOption('partner');
    await createForm.getByRole('button', { name: 'CREATE USER' }).click();

    await expect.poll(() => ctx.createdUsers.length).toBe(1);
    expect(ctx.createdUsers[0]).toMatchObject({ email: 'ops-new@example.com', role_name: 'partner' });

    await page.getByRole('button', { name: /ops-new@example.com/ }).click();
    await expect(page.getByPlaceholder('user uuid')).toHaveValue(/user-\d+/);
    await expect(page.getByText(/Selected: ops-new@example\.com · user-\d+/)).toBeVisible();
    await expect(editForm.getByLabel('role_name')).toHaveValue('partner');
    await editForm.getByLabel('role_name').selectOption('admin');
    await expect(editForm.getByLabel('role_name')).toHaveValue('admin');
    await editForm.getByRole('button', { name: 'SAVE CHANGES' }).click();

    await expect.poll(() => ctx.updatedUsers.length).toBe(1);
    expect(ctx.updatedUsers[0]).toMatchObject({ role_name: 'admin' });
});

test('admin teams page creates, reassigns, updates, and deletes teams', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null, isAdmin: true });

    await page.goto('/admin/teams');
    const createForm = page.locator('form').nth(0);
    const editForm = page.locator('form').nth(1);
    const assignmentForm = page.locator('form').nth(2);

    await createForm.getByPlaceholder('team name', { exact: true }).fill('Blue Team');
    await createForm.getByRole('button', { name: 'CREATE TEAM' }).click();

    await expect.poll(() => ctx.createdTeams.length).toBe(1);
    expect(ctx.createdTeams[0]).toMatchObject({ name: 'Blue Team' });

    await page.getByRole('button', { name: /Zero Cool/ }).first().click();
    await expect(editForm.getByPlaceholder('team uuid')).toHaveValue('team-1');
    await expect(editForm.getByPlaceholder('team name', { exact: true })).toHaveValue('Zero Cool');

    await assignmentForm.getByPlaceholder('participant uuid', { exact: true }).fill('participant-2');
    await assignmentForm.locator('select').selectOption('team-1');
    await assignmentForm.getByRole('button', { name: 'APPLY ASSIGNMENT' }).click();

    await expect.poll(() => ctx.adminAssignments.length).toBe(1);
    expect(ctx.adminAssignments[0]).toMatchObject({ participantId: 'participant-2', target_team_id: 'team-1' });

    await expect(assignmentForm.getByPlaceholder('participant uuid', { exact: true })).toHaveValue('');
    await expect(editForm.getByPlaceholder('team uuid')).toHaveValue('team-1');
    await expect(page.getByText('Shellfox').last()).toBeVisible();
    await editForm.getByPlaceholder('team name', { exact: true }).fill('Zero Cool Elite');
    await expect(editForm.getByPlaceholder('team name', { exact: true })).toHaveValue('Zero Cool Elite');
    await editForm.getByRole('button', { name: 'SAVE TEAM' }).click();

    await expect.poll(() => ctx.updatedTeams.length).toBe(1);
    expect(ctx.updatedTeams[0]).toMatchObject({ teamId: 'team-1', name: 'Zero Cool Elite' });

    page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Delete team Zero Cool Elite?');
        await dialog.accept();
    });
    await editForm.getByRole('button', { name: 'DELETE TEAM' }).click();
    await expect.poll(() => ctx.deletedTeams).toContain('team-1');
});

test('hunt team join accepts invite code and redirects into the hunt flow', async ({ page }) => {
    const profile = {
        id: 'participant-2',
        user_id: 'user-2',
        display_name: 'Shellfox',
        institution: 'VIT-AP',
        year: 2,
        talent_visible: false,
        talent_contact_shareable: false,
        created_at: '2026-04-19T08:00:00Z',
        can_edit: true,
        is_self: true,
    };
    const ctx = await stubPortalApi(page, {
        participantProfile: profile,
        myTeam: null,
        teams: [
            {
                id: 'team-join',
                name: 'Packet Ninjas',
                invite_code: 'AB12CD',
                created_by_participant_id: 'participant-1',
                created_at: '2026-04-19T08:00:00Z',
                members: [{ participant_id: 'participant-1', display_name: 'lead', joined_at: '2026-04-19T08:00:00Z' }],
            },
        ],
    });

    await page.goto('/hunt/team');
    await page.getByPlaceholder('AB12CD').fill(' ab12cd ');
    await page.getByRole('button', { name: 'JOIN TEAM' }).click();

    await expect.poll(() => ctx.joinedTeams.length).toBe(1);
    expect(ctx.joinedTeams[0]).toMatchObject({ invite_code: 'AB12CD' });
    await expect(page).toHaveURL(/\/hunt$/);
    await expect(page.locator('main').getByText('Packet Ninjas').last()).toBeVisible();
});

test('admin announcements page supports create and delete', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null, isAdmin: true });

    await page.goto('/admin/announcements');
    await page.getByPlaceholder('title').fill('Ops update');
    await page.getByPlaceholder('body').fill('Scanner line moved to block B.');
    await page.getByRole('button', { name: 'CREATE ANNOUNCEMENT' }).click();

    await expect.poll(() => ctx.createdAnnouncements.length).toBe(1);
    expect(ctx.createdAnnouncements[0]).toMatchObject({ title: 'Ops update' });

    await page.getByRole('button', { name: /Ops update/ }).click();
    page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Delete announcement');
        await dialog.accept();
    });
    await page.getByRole('button', { name: 'DELETE' }).click();

    await expect.poll(() => ctx.deletedAnnouncements.length).toBe(1);
});

test('admin shop page updates items and processes fulfillment + returns', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null, isAdmin: true });

    await page.goto('/admin/shop');
    await page.getByRole('button', { name: /RECON Tee/ }).click();
    await page.getByPlaceholder('item name').fill('RECON Tee Updated');
    await page.getByRole('button', { name: 'SAVE ITEM' }).click();

    await expect.poll(() => ctx.updatedShopItems.length).toBe(1);
    expect(ctx.updatedShopItems[0]).toMatchObject({ name: 'RECON Tee Updated' });

    await page.getByRole('button', { name: 'FULFILL' }).click();
    await expect.poll(() => ctx.fulfilledRedemptions).toContain('redemption-1');

    await page.locator('select').last().selectOption('all');
    await page.getByRole('button', { name: 'RETURN' }).click();
    await expect.poll(() => ctx.returnedRedemptions).toContain('redemption-1');
});

test('merch page redeem creates a pending pickup record for the participant', async ({ page }) => {
    const profile = {
        id: 'participant-1',
        user_id: 'user-1',
        display_name: 'Ciphercat',
        institution: 'VIT-AP',
        year: 2,
        talent_visible: false,
        talent_contact_shareable: false,
        created_at: '2026-04-19T08:00:00Z',
        can_edit: true,
        is_self: true,
    };
    const ctx = await stubPortalApi(page, {
        participantProfile: profile,
        dashboard: {
            displayName: 'Ciphercat',
            registrationId: 'participant-1',
            pointsBalance: 3200,
            zonesCheckedInCount: 2,
            checkedInZoneIds: ['zone-ctf'],
            eventsRegisteredCount: 3,
            leaderboardRank: 4,
        },
        redemptions: [],
        shopItems: [
            {
                id: 'shop-1',
                name: 'RECON Tee',
                description: 'Operator edition',
                point_cost: 2000,
                stock: 20,
                remaining_stock: 20,
                is_active: true,
                photo_key: '/merch/merch01.webp',
            },
        ],
    });

    await page.goto('/merch');
    await page.getByRole('button', { name: 'REDEEM ->' }).first().click();
    await page.getByRole('button', { name: 'CONFIRM REDEMPTION' }).click();

    await expect.poll(() => ctx.redeemedRequests).toContain('shop-1');
    await expect(page.getByRole('dialog').getByText('REDEMPTION CONFIRMED')).toBeVisible();
    await expect(page.getByText('PENDING PICKUP')).toBeVisible();
});

test('admin shop awaiting collection list shows buyer and removes row after fulfill', async ({ page }) => {
    const ctx = await stubPortalApi(page, {
        participantProfile: null,
        isAdmin: true,
        redemptions: [
            {
                id: 'redemption-awaiting-1',
                participant_id: 'participant-7',
                participant_display_name: 'Awaiting Player',
                participant_email: 'awaiting@example.com',
                participant_username: 'awaitingplayer',
                item_id: 'shop-1',
                item_name: 'RECON Tee',
                point_cost: 2000,
                redeemed_at: '2026-04-19T10:00:00Z',
                fulfilled_at: null,
                fulfillment_notes: null,
                returned_at: null,
                return_notes: null,
            },
        ],
    });

    await page.goto('/admin/shop');
    await expect(page.getByText('AWAITING COLLECTION (1)')).toBeVisible();
    await expect(page.getByText('Awaiting Player')).toBeVisible();
    await expect(page.getByText('awaiting@example.com')).toBeVisible();

    await page.getByRole('button', { name: 'FULFILL' }).click();
    await expect.poll(() => ctx.fulfilledRedemptions).toContain('redemption-awaiting-1');
    await expect(page.getByText('AWAITING COLLECTION (0)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'FULFILL' })).toHaveCount(0);

    await page.locator('select').last().selectOption('fulfilled');
    await expect(page.getByText('Awaiting Player')).toBeVisible();
    await expect(page.locator('span.status-pill', { hasText: 'fulfilled' })).toHaveCount(1);
});

test('admin points page awards participant points and finalizes settlements', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null, isAdmin: true });

    await page.goto('/admin/points');
    await page.getByPlaceholder('participant uuid').fill('participant-1');
    await page.getByRole('button', { name: 'AWARD POINTS' }).click();

    await expect.poll(() => ctx.pointAwards.length).toBe(1);
    expect(ctx.pointAwards[0]).toMatchObject({ participant_id: 'participant-1', amount: 10 });

    await page.getByPlaceholder('team uuid').fill('team-1');
    await page.getByRole('button', { name: 'PREVIEW' }).click();
    await expect.poll(() => ctx.settlementPreviews.length).toBe(1);

    await page.getByRole('button', { name: 'FINALIZE' }).click();
    await expect.poll(() => ctx.settlementFinalizations.length).toBe(1);
});

test('admin zone scanner awards points when a registered event pass is scanned', async ({ page }) => {
    const ctx = await stubPortalApi(page, { participantProfile: null, isAdmin: true });

    await page.goto('/admin/zone-scanner');
    await page.locator('textarea[placeholder="paste the backend-issued qr token or a URL containing it"]').fill('signed-token-FOREN');
    await page.getByRole('button', { name: 'SUBMIT TOKEN' }).click();

    await expect.poll(() => ctx.scanRequests.length).toBe(1);
    await expect(page.getByText('Forensics Sprint')).toBeVisible();
    await expect(page.getByText('Ciphercat earned 20 points.')).toBeVisible();
});

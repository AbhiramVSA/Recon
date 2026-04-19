import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Participant } from '../lib/types';
import type { BackendParticipant } from '../api/participants';
import type { BackendUserProfile } from '../api/auth';
import { fetchMyParticipantProfile } from '../api/participants';
import { fetchMe, logout as apiLogout } from '../api/auth';
import { ApiError } from '../api/client';
import { participantsApi } from '../../api/backend';

interface AuthState {
    sessionStatus: 'unknown' | 'authenticated' | 'unauthenticated';
    profileStatus: 'unknown' | 'present' | 'missing';
    user: BackendUserProfile | null;
    participantProfile: BackendParticipant | null;
    participant: Participant | null;
    bootstrapSession: () => Promise<void>;
    clearSession: () => void;
    signOut: () => Promise<void>;
}

const baseState = {
    sessionStatus: 'unknown' as const,
    profileStatus: 'unknown' as const,
    user: null,
    participantProfile: null,
    participant: null as Participant | null,
};

const BOOTSTRAP_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const t = window.setTimeout(() => reject(new Error('Auth bootstrap timed out')), ms);
        promise.then(
            (v) => {
                clearTimeout(t);
                resolve(v);
            },
            (e) => {
                clearTimeout(t);
                reject(e);
            },
        );
    });
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            ...baseState,
            bootstrapSession: async () => {
                let user: BackendUserProfile;
                try {
                    user = await withTimeout(fetchMe(), BOOTSTRAP_TIMEOUT_MS);
                } catch {
                    set({
                        sessionStatus: 'unauthenticated',
                        profileStatus: 'unknown',
                        user: null,
                        participantProfile: null,
                        participant: null,
                    });
                    return;
                }

                const loadParticipantAndPortalData = async (loggedIn: BackendUserProfile) => {
                    let profile: BackendParticipant | null = null;
                    let profileStatus: AuthState['profileStatus'] = 'unknown';
                    try {
                        profile = await fetchMyParticipantProfile();
                        profileStatus = 'present';
                    } catch (err) {
                        if (err instanceof ApiError && err.status === 404) {
                            profileStatus = 'missing';
                        }
                    }

                    const dashboardResp =
                        profileStatus === 'present'
                            ? await participantsApi.myDashboard().catch(() => null)
                            : null;

                    const zoneIdsRaw = (dashboardResp as { checkedInZoneIds?: string[] } | null)?.checkedInZoneIds ?? [];
                    const checkedInZones = Array.isArray(zoneIdsRaw)
                        ? zoneIdsRaw.map((id) => String(id))
                        : [];
                    const points = Number((dashboardResp as { pointsBalance?: number } | null)?.pointsBalance ?? 0);
                    const leaderboardRank = (dashboardResp as { leaderboardRank?: number | null } | null)?.leaderboardRank ?? null;
                    const eventsRegisteredCount = (dashboardResp as { eventsRegisteredCount?: number } | null)?.eventsRegisteredCount ?? 0;
                    const zonesCheckedInCount = (dashboardResp as { zonesCheckedInCount?: number } | null)?.zonesCheckedInCount ?? checkedInZones.length;

                    set({
                        sessionStatus: 'authenticated',
                        profileStatus,
                        user: loggedIn,
                        participantProfile: profile,
                        participant: profile
                            ? {
                                  id: profile.id,
                                  email: loggedIn.email,
                                  displayName: profile.display_name,
                                  registrationId: profile.id,
                                  points: Number.isFinite(points) ? points : 0,
                                  checkedInZones,
                                  leaderboardRank: typeof leaderboardRank === 'number' ? leaderboardRank : null,
                                  eventsRegisteredCount,
                                  zonesCheckedInCount,
                              }
                            : null,
                    });
                };

                try {
                    await withTimeout(loadParticipantAndPortalData(user), BOOTSTRAP_TIMEOUT_MS);
                } catch {
                    set({
                        sessionStatus: 'authenticated',
                        profileStatus: 'unknown',
                        user,
                        participantProfile: null,
                        participant: null,
                    });
                }
            },
            clearSession: () => set({ ...baseState, sessionStatus: 'unauthenticated' }),
            signOut: async () => {
                try {
                    await apiLogout();
                } finally {
                    set({
                        ...baseState,
                        sessionStatus: 'unauthenticated',
                    });
                }
            },
        }),
        {
            name: 'recon-portal-auth',
            partialize: (state) => ({
                user: state.user,
                participantProfile: state.participantProfile,
                participant: state.participant,
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error || !state?.user) return;
                useAuthStore.setState({
                    sessionStatus: 'unknown',
                    profileStatus: state.participantProfile ? 'present' : 'missing',
                });
            },
        },
    ),
);

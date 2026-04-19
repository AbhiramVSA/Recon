import { create } from 'zustand';
import { getMyTeam } from '../api/teams';
import { ApiError } from '../api/client';
import type { TeamRead } from '../lib/treasureHuntTypes';

type TeamLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TeamState {
    team: TeamRead | null;
    teamLoadStatus: TeamLoadStatus;
    teamError: string | null;
    loadMyTeam: () => Promise<TeamRead | null>;
    setTeam: (team: TeamRead | null) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
    team: null,
    teamLoadStatus: 'idle',
    teamError: null,
    loadMyTeam: async () => {
        set({ teamLoadStatus: 'loading', teamError: null });
        try {
            const team = await getMyTeam();
            set({ team, teamLoadStatus: 'ready', teamError: null });
            return team;
        } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
                set({ team: null, teamLoadStatus: 'ready', teamError: null });
                return null;
            }
            let msg = 'Failed to load team';
            if (e instanceof ApiError) {
                if (e.status >= 500) {
                    msg = 'Something went wrong on our end. Please try again in a moment.';
                } else {
                    msg = e.message;
                }
            } else if (e instanceof Error) {
                msg = e.message;
            }
            set({ teamLoadStatus: 'error', teamError: msg });
            return null;
        }
    },
    setTeam: (team) => set({ team, teamLoadStatus: 'ready', teamError: null }),
}));

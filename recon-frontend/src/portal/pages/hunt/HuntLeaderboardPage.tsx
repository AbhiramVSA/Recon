import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../../api/treasureHunt';
import { ApiError } from '../../api/client';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import type { TreasureHuntLeaderboardEntryRead, TreasureHuntLeaderboardRead } from '../../lib/treasureHuntTypes';
import PortalPage from '../../components/PortalPage';
import { GhostButton, PortalCard, SectionLabel } from '../../components/primitives';
import { useTeamStore } from '../../stores/teamStore';
import { useToastStore } from '../../stores/toastStore';

const POLL_MS = 5000;

function finisherLabel(rank: number | null): string | null {
    if (rank == null) return null;
    if (rank === 1) return 'Gold';
    if (rank === 2) return 'Silver';
    if (rank === 3) return 'Bronze';
    if (rank === 4) return 'Final box';
    return null;
}

export default function HuntLeaderboardPage() {
    const navigate = useNavigate();
    const myTeamId = useTeamStore((s) => s.team?.id);
    const addToast = useToastStore((s) => s.addToast);

    const [data, setData] = useState<TreasureHuntLeaderboardRead | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await getLeaderboard(0, 50);
            setData(res);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                navigate('/login', { state: { from: '/hunt/leaderboard' } });
                return;
            }
            if (err instanceof ApiError && err.status === 403) {
                addToast({
                    type: 'error',
                    title: 'ACCESS DENIED',
                    body: 'You do not have access to this feature.',
                });
                return;
            }
            addToast({
                type: 'error',
                title: 'LEADERBOARD FAILED',
                body: getApiErrorMessage(err, 'Could not load leaderboard.'),
            });
        } finally {
            setLoading(false);
        }
    }, [navigate, addToast]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;

        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            void load();
        };

        intervalId = window.setInterval(tick, POLL_MS);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') void load();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            if (intervalId) window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [load]);

    return (
        <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-3xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- LEADERBOARD --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,6vw,44px)] leading-none text-[var(--fg)] mt-2">
                    TREASURE <span className="text-[var(--amber)]">HUNT</span>
                </div>
                <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                    Live order from the server — updates every {POLL_MS / 1000}s while this tab is visible.
                </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <Link
                    to="/hunt"
                    className="font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--amber)] hover:underline"
                >
                    ← Hunt home
                </Link>
                <Link
                    to="/hunt/display"
                    className="font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[color-mix(in_srgb,var(--dim)_70%,white_8%)] hover:text-[var(--fg)]"
                >
                    Projector view
                </Link>
            </div>

            <PortalCard className="mt-6 p-0 overflow-hidden" attr>
                {loading && !data ? (
                    <div className="p-8 text-center font-portal-mono text-[10px] uppercase text-[color-mix(in_srgb,var(--dim)_70%,white_8%)]">
                        Loading…
                    </div>
                ) : data ? (
                    <>
                        <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-dim)] font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                            {data.total_teams} teams
                        </div>
                        <ul className="divide-y divide-[var(--border-dim)]">
                            {data.entries.map((entry: TreasureHuntLeaderboardEntryRead) => {
                                const isMine = myTeamId != null && entry.team_id === myTeamId;
                                const completed = entry.completed_at != null;
                                const fl = finisherLabel(entry.finish_rank);
                                return (
                                    <li
                                        key={entry.team_id}
                                        className={`px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 ${
                                            isMine
                                                ? 'bg-[color-mix(in_srgb,var(--amber)_10%,transparent)] border-l-2 border-l-[var(--amber)]'
                                                : ''
                                        }`}
                                    >
                                        <span className="font-portal-display text-[22px] sm:text-[26px] text-[var(--amber)] w-10 shrink-0">
                                            #{entry.rank}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-portal-mono text-[14px] sm:text-[15px] text-[var(--fg)] truncate">
                                                {entry.team_name}
                                                {isMine ? (
                                                    <span className="ml-2 text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                                                        You
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 font-portal-mono text-[10px] text-[color-mix(in_srgb,var(--dim)_78%,white_6%)]">
                                                {entry.solved_count} / {entry.total_problems} solved
                                                {completed ? ' · Finished' : ''}
                                            </div>
                                        </div>
                                        {fl ? (
                                            <span
                                                className={`font-portal-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 border shrink-0 ${
                                                    entry.finish_rank === 1
                                                        ? 'border-[color-mix(in_srgb,var(--amber)_80%,white_20%)] text-[var(--amber)]'
                                                        : entry.finish_rank === 2
                                                          ? 'border-[color-mix(in_srgb,var(--dim)_55%,white_35%)] text-[color-mix(in_srgb,var(--dim)_85%,white_12%)]'
                                                          : entry.finish_rank === 3
                                                            ? 'border-[color-mix(in_srgb,var(--amber)_45%,black_30%)] text-[color-mix(in_srgb,var(--amber)_75%,black_15%)]'
                                                            : 'border-[var(--border-dim)] text-[color-mix(in_srgb,var(--dim)_80%,white_10%)]'
                                                }`}
                                            >
                                                {fl}
                                            </span>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                ) : (
                    <div className="p-8 text-center font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_80%,white_8%)]">
                        No data.
                    </div>
                )}
            </PortalCard>

            <GhostButton type="button" className="mt-6" onClick={() => void load()}>
                Refresh now
            </GhostButton>
        </PortalPage>
    );
}

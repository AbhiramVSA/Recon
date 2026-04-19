import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFinishers, getLeaderboard } from '../../api/treasureHunt';
import type { TreasureHuntLeaderboardEntryRead, TreasureHuntLeaderboardRead } from '../../lib/treasureHuntTypes';
import PortalPage from '../../components/PortalPage';
import { SectionLabel } from '../../components/primitives';
import { useTeamStore } from '../../stores/teamStore';

const POLL_MS = 5000;

export default function HuntDisplayPage() {
    const myTeamId = useTeamStore((s) => s.team?.id);

    const [leaderboard, setLeaderboard] = useState<TreasureHuntLeaderboardRead | null>(null);
    const [finishers, setFinishers] = useState<TreasureHuntLeaderboardRead | null>(null);

    const load = useCallback(async () => {
        try {
            const [lb, fin] = await Promise.all([getLeaderboard(0, 50), getFinishers()]);
            setLeaderboard(lb);
            setFinishers(fin);
        } catch {
            /* projector: fail quietly; operator refreshes */
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            void load();
        };
        const id = window.setInterval(tick, POLL_MS);
        const onVisibility = () => {
            if (document.visibilityState === 'visible') void load();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [load]);

    const finisherSlots: (TreasureHuntLeaderboardEntryRead | null)[] = [0, 1, 2, 3].map((i) => finishers?.entries[i] ?? null);

    return (
        <PortalPage className="pt-16 pb-24 px-4 sm:px-6 max-w-5xl mx-auto min-h-[100dvh]">
            <div data-portal-header className="text-center">
                <SectionLabel className="justify-center">-- LIVE DISPLAY --</SectionLabel>
                <div className="font-portal-display text-[clamp(36px,8vw,64px)] leading-none text-[var(--fg)] mt-4">
                    TREASURE <span className="text-[var(--amber)]">HUNT</span>
                </div>
                <Link
                    to="/hunt/leaderboard"
                    className="inline-block mt-4 font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[color-mix(in_srgb,var(--dim)_65%,white_10%)] hover:text-[var(--amber)]"
                >
                    Standard leaderboard
                </Link>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
                <section>
                    <h2 className="font-portal-mono text-[11px] tracking-[0.25em] uppercase text-[var(--amber)] mb-4">
                        Leaderboard
                    </h2>
                    <div className="space-y-2">
                        {(leaderboard?.entries ?? []).slice(0, 15).map((entry) => {
                            const isMine = myTeamId != null && entry.team_id === myTeamId;
                            return (
                                <div
                                    key={entry.team_id}
                                    className={`flex items-baseline justify-between gap-4 py-2 border-b border-[var(--border-dim)] ${
                                        isMine ? 'bg-[color-mix(in_srgb,var(--amber)_8%,transparent)] -mx-2 px-2' : ''
                                    }`}
                                >
                                    <span className="font-portal-display text-[clamp(22px,4vw,34px)] text-[var(--amber)] shrink-0">
                                        #{entry.rank}
                                    </span>
                                    <span className="font-portal-mono text-[clamp(14px,2.5vw,20px)] text-[var(--fg)] text-right truncate flex-1">
                                        {entry.team_name}
                                    </span>
                                    <span className="font-portal-mono text-[clamp(12px,2vw,16px)] text-[color-mix(in_srgb,var(--dim)_75%,white_10%)] shrink-0">
                                        {entry.solved_count}/{entry.total_problems}
                                    </span>
                                </div>
                            );
                        })}
                        {leaderboard && leaderboard.entries.length === 0 && (
                            <p className="font-portal-mono text-[12px] text-[color-mix(in_srgb,var(--dim)_70%,white_8%)]">No entries yet.</p>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="font-portal-mono text-[11px] tracking-[0.25em] uppercase text-[var(--amber)] mb-4">
                        Treasure boxes (first 4 finishers)
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        {finisherSlots.map((slot, idx) => (
                            <div
                                key={idx}
                                className="min-h-[120px] sm:min-h-[140px] border border-[var(--border-dim)] p-4 flex flex-col justify-center items-center text-center"
                            >
                                {slot ? (
                                    <>
                                        <div className="font-portal-display text-[clamp(28px,5vw,44px)] text-[var(--amber)]">
                                            #{slot.rank}
                                        </div>
                                        <div className="mt-2 font-portal-mono text-[clamp(12px,2vw,16px)] text-[var(--fg)] leading-tight">
                                            {slot.team_name}
                                        </div>
                                        <div className="mt-1 font-portal-mono text-[10px] text-[color-mix(in_srgb,var(--dim)_72%,white_8%)]">
                                            Finisher {idx + 1}
                                        </div>
                                    </>
                                ) : (
                                    <span className="font-portal-mono text-[11px] tracking-[0.15em] uppercase text-[color-mix(in_srgb,var(--dim)_55%,white_8%)]">
                                        Open
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </PortalPage>
    );
}

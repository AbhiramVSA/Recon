import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getMyProgress } from '../../api/treasureHunt';
import { ApiError } from '../../api/client';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import type { TreasureHuntTeamProgressRead } from '../../lib/treasureHuntTypes';
import PortalPage from '../../components/PortalPage';
import { GhostButton, PortalCard, SectionLabel, StatusPill } from '../../components/primitives';
import { useTeamStore } from '../../stores/teamStore';
import { useToastStore } from '../../stores/toastStore';

function formatTs(iso: string | null | undefined) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

export default function HuntHomePage() {
    const navigate = useNavigate();
    const team = useTeamStore((s) => s.team);
    const teamLoadStatus = useTeamStore((s) => s.teamLoadStatus);
    const teamError = useTeamStore((s) => s.teamError);
    const loadMyTeam = useTeamStore((s) => s.loadMyTeam);
    const addToast = useToastStore((s) => s.addToast);

    const [progress, setProgress] = useState<TreasureHuntTeamProgressRead | null>(null);
    const [progressLoading, setProgressLoading] = useState(true);
    const [progressFailed, setProgressFailed] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setProgressLoading(true);
            try {
                const t = await loadMyTeam();
                if (cancelled) return;
                if (useTeamStore.getState().teamLoadStatus === 'error') {
                    return;
                }
                if (!t) {
                    setProgress(null);
                    setProgressFailed(false);
                    return;
                }
                const p = await getMyProgress();
                if (!cancelled) {
                    setProgress(p);
                    setProgressFailed(false);
                }
            } catch (err) {
                if (cancelled) return;
                if (err instanceof ApiError && err.status === 401) {
                    navigate('/login', { state: { from: '/hunt' } });
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
                setProgressFailed(true);
                addToast({
                    type: 'error',
                    title: 'PROGRESS FAILED',
                    body: getApiErrorMessage(err, 'Could not load hunt progress.'),
                });
            } finally {
                if (!cancelled) setProgressLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadMyTeam, navigate, addToast, retryKey]);

    useEffect(() => {
        if (!team) return;
        const onVis = () => {
            if (document.visibilityState !== 'visible') return;
            void getMyProgress()
                .then(setProgress)
                .catch(() => {});
        };
        const onFocus = () => {
            void getMyProgress()
                .then(setProgress)
                .catch(() => {});
        };
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('focus', onFocus);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('focus', onFocus);
        };
    }, [team]);

    if (teamLoadStatus === 'loading' || teamLoadStatus === 'idle') {
        return (
            <div className="min-h-[50dvh] flex items-center justify-center px-6">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    Loading hunt…
                </div>
            </div>
        );
    }

    if (teamLoadStatus === 'error') {
        return (
            <PortalPage className="pt-20 pb-28 px-4 max-w-xl mx-auto">
                <div data-portal-header>
                    <SectionLabel>-- TREASURE HUNT --</SectionLabel>
                    <div className="font-portal-display text-[clamp(26px,5vw,36px)] leading-none text-[var(--fg)] mt-2">
                        Team unavailable
                    </div>
                </div>
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <p className="font-portal-body text-[13px] text-[var(--fg)]">{teamError ?? 'Could not load team.'}</p>
                    <GhostButton type="button" className="mt-4" onClick={() => setRetryKey((k) => k + 1)}>
                        Retry
                    </GhostButton>
                </PortalCard>
            </PortalPage>
        );
    }

    if (!team) {
        return <Navigate to="/hunt/team" replace />;
    }

    if (progressLoading && !progress) {
        return (
            <div className="min-h-[50dvh] flex items-center justify-center px-6">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    Loading progress…
                </div>
            </div>
        );
    }

    const total = progress?.total_problems ?? 0;
    const solved = progress?.solved_count ?? 0;
    const remaining = progress?.remaining_count ?? Math.max(0, total - solved);
    const rank = progress?.leaderboard_rank;
    const completedAll = Boolean(progress && total > 0 && solved >= total);
    const finishRank = progress?.finish_rank ?? null;

    return (
        <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- TREASURE HUNT --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,6vw,44px)] leading-none text-[var(--fg)] mt-2">
                    {progress?.team_name ?? team.name}
                </div>
                <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                    Team progress and hunt actions. Invite:{' '}
                    <span className="font-portal-mono text-[var(--amber)]">{team.invite_code}</span>
                </p>
            </div>

            {finishRank != null && (
                <div className="mt-4 p-4 border border-[var(--amber)] bg-[color-mix(in_srgb,var(--amber)_12%,transparent)] font-portal-body text-[13px] text-[var(--fg)]">
                    Your team has unlocked a treasure box. Show this screen to event staff.
                </div>
            )}

            {completedAll && finishRank == null && (
                <div className="mt-4 p-4 border border-[var(--border-dim)] font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_88%,white_8%)]">
                    Your team completed the hunt. All treasure box slots are already claimed.
                </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
                {finishRank != null ? (
                    <StatusPill label={`Finisher #${finishRank}`} tone="amber" />
                ) : completedAll ? (
                    <StatusPill label="Completed" tone="green" />
                ) : null}
            </div>

            <PortalCard className="mt-6 p-5 sm:p-6" attr>
                {progressFailed ? (
                    <p className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_85%,white_8%)]">
                        Hunt progress could not be loaded. Refresh the page or try again shortly.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                                Solved
                            </div>
                            <div className="mt-1 font-portal-display text-[28px] text-[var(--amber)]">
                                {solved} / {total}
                            </div>
                        </div>
                        <div>
                            <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                                Remaining
                            </div>
                            <div className="mt-1 font-portal-display text-[28px] text-[var(--fg)]">{remaining}</div>
                        </div>
                        <div>
                            <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                                Rank
                            </div>
                            <div className="mt-1 font-portal-display text-[28px] text-[var(--fg)]">
                                {rank != null ? `#${rank}` : '—'}
                            </div>
                        </div>
                        <div>
                            <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                                Last solve
                            </div>
                            <div className="mt-1 font-portal-mono text-[12px] text-[var(--fg)] leading-snug">
                                {formatTs(progress?.last_solved_at)}
                            </div>
                        </div>
                    </div>
                )}
            </PortalCard>

            <div className="mt-6 grid gap-3">
                {!completedAll ? (
                    <Link
                        to="/hunt/scan"
                        className="block w-full min-h-11 bg-[var(--amber)] text-[var(--bg)] hover:brightness-90 font-portal-mono text-[12px] tracking-[0.15em] uppercase px-4 py-3 text-center leading-none"
                    >
                        Scan next QR
                    </Link>
                ) : (
                    <Link
                        to="/hunt/leaderboard"
                        className="block w-full min-h-11 bg-[var(--amber)] text-[var(--bg)] hover:brightness-90 font-portal-mono text-[12px] tracking-[0.15em] uppercase px-4 py-3 text-center leading-none"
                    >
                        View leaderboard
                    </Link>
                )}
                <Link
                    to="/hunt/progress"
                    className="block w-full min-h-11 border border-[var(--border-dim)] hover:border-[var(--border)] font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--fg)] px-4 py-3 transition-all text-center leading-none"
                >
                    View progress
                </Link>
                <Link
                    to="/hunt/leaderboard"
                    className="block w-full min-h-11 border border-[var(--border-dim)] hover:border-[var(--border)] font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--fg)] px-4 py-3 transition-all text-center leading-none"
                >
                    Leaderboard
                </Link>
                <Link
                    to="/hunt/team"
                    className="block w-full min-h-11 border border-[var(--border-dim)] hover:border-[var(--border)] font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--fg)] px-4 py-3 transition-all text-center leading-none"
                >
                    Team &amp; invite
                </Link>
            </div>
        </PortalPage>
    );
}

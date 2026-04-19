import { useEffect, useMemo, useState } from 'react';
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

export default function HuntProgressPage() {
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
                    navigate('/login', { state: { from: '/hunt/progress' } });
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
        const refresh = () =>
            void getMyProgress()
                .then(setProgress)
                .catch(() => {});
        const onVis = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('focus', refresh);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('focus', refresh);
        };
    }, [team]);

    const ordered = useMemo(() => {
        if (!progress?.problems?.length) return [];
        return [...progress.problems].sort((a, b) => a.sort_order - b.sort_order);
    }, [progress?.problems]);

    if (teamLoadStatus === 'loading' || teamLoadStatus === 'idle') {
        return (
            <div className="min-h-[50dvh] flex items-center justify-center px-6">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    Loading…
                </div>
            </div>
        );
    }

    if (teamLoadStatus === 'error') {
        return (
            <PortalPage className="pt-20 pb-28 px-4 max-w-xl mx-auto">
                <div data-portal-header>
                    <SectionLabel>-- PROGRESS --</SectionLabel>
                    <div className="font-portal-display text-[clamp(26px,5vw,36px)] leading-none text-[var(--fg)] mt-2">
                        Team unavailable
                    </div>
                </div>
                <PortalCard className="mt-6 p-5" attr>
                    <p className="font-portal-body text-[13px] text-[var(--fg)]">{teamError ?? 'Could not load your team.'}</p>
                    <GhostButton type="button" className="mt-4" onClick={() => void loadMyTeam()}>
                        Retry
                    </GhostButton>
                </PortalCard>
            </PortalPage>
        );
    }

    if (teamLoadStatus === 'ready' && !team) {
        return <Navigate to="/hunt/team" replace />;
    }

    const total = progress?.total_problems ?? 0;
    const solved = progress?.solved_count ?? 0;
    const finishRank = progress?.finish_rank ?? null;

    return (
        <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- ALL CHALLENGES --</SectionLabel>
                <div className="font-portal-display text-[clamp(28px,6vw,40px)] leading-none text-[var(--fg)] mt-2">
                    Progress
                </div>
                <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_78%,white_8%)] mt-3">
                    Tap a challenge to open it. Full prompt text appears after you scan that challenge&apos;s QR or paste its
                    token.
                </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-portal-mono text-[10px] uppercase text-[color-mix(in_srgb,var(--amber)_65%,black_18%)]">
                    {progress?.team_name ?? 'Team'}
                </span>
                <span className="font-portal-mono text-[10px] text-[color-mix(in_srgb,var(--dim)_75%,white_8%)]">
                    {solved} / {total} solved
                </span>
                {finishRank != null ? <StatusPill label={`Finisher #${finishRank}`} tone="amber" /> : null}
            </div>

            <Link
                to="/hunt"
                className="inline-block mt-4 font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--amber)] hover:underline"
            >
                ← Hunt home
            </Link>

            {progressFailed ? (
                <PortalCard className="mt-6 p-5" attr>
                    <p className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_85%,white_8%)]">
                        Progress could not be loaded.
                    </p>
                    <GhostButton type="button" className="mt-4" onClick={() => setRetryKey((k) => k + 1)}>
                        Retry
                    </GhostButton>
                </PortalCard>
            ) : progressLoading ? (
                <p className="mt-8 font-portal-mono text-[10px] uppercase text-[color-mix(in_srgb,var(--amber)_55%,black_20%)]">
                    Loading challenges…
                </p>
            ) : ordered.length === 0 ? (
                <PortalCard className="mt-6 p-5" attr>
                    <p className="font-portal-body text-[13px] text-[var(--fg)]">No challenges listed yet.</p>
                </PortalCard>
            ) : (
                <ul className="mt-6 grid gap-2 list-none p-0">
                    {ordered.map((row) => (
                        <li key={row.problem_id}>
                            <Link
                                to={`/hunt/problem/${row.problem_id}`}
                                className="block portal-card p-4 sm:p-5 no-underline text-[var(--fg)] hover:border-[var(--amber)] border border-[var(--border-dim)] transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="font-portal-mono text-[10px] text-[color-mix(in_srgb,var(--dim)_70%,white_8%)]">
                                            #{row.sort_order}
                                        </div>
                                        <div className="mt-1 font-portal-display text-[18px] leading-tight text-[var(--fg)]">
                                            {row.title}
                                        </div>
                                        <div className="mt-2 font-portal-mono text-[11px] text-[color-mix(in_srgb,var(--dim)_78%,white_8%)]">
                                            {row.solved ? `Solved ${formatTs(row.solved_at)}` : 'Not solved'}
                                        </div>
                                    </div>
                                    <div className="shrink-0 pt-1">
                                        {row.solved ? (
                                            <StatusPill label="Solved" tone="green" />
                                        ) : (
                                            <StatusPill label="Open" tone="amber" />
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-8 grid gap-3">
                <Link
                    to="/hunt/scan"
                    className="block w-full min-h-11 bg-[var(--amber)] text-[var(--bg)] hover:brightness-90 font-portal-mono text-[12px] tracking-[0.15em] uppercase px-4 py-3 text-center leading-none"
                >
                    Scan QR
                </Link>
                <Link
                    to="/hunt/leaderboard"
                    className="block w-full min-h-11 border border-[var(--border-dim)] hover:border-[var(--border)] font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--fg)] px-4 py-3 text-center leading-none"
                >
                    Leaderboard
                </Link>
            </div>
        </PortalPage>
    );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMyProgress, scanProblemByRouteHash, submitFlag } from '../../api/treasureHunt';
import { ApiError } from '../../api/client';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { getHuntStoryBeat, getNextHuntHint } from '../../lib/huntStory';
import type { TreasureHuntProblemRead, TreasureHuntFlagSubmitRead } from '../../lib/treasureHuntTypes';
import PortalPage from '../../components/PortalPage';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel, StatusPill } from '../../components/primitives';
import PortalModal from '../../components/PortalModal';
import { useHuntScanStore } from '../../stores/huntScanStore';
import Seo from '../../../components/Seo';

const mdBase =
    'prose prose-invert max-w-none prose-p:font-portal-body prose-p:text-[var(--fg)] prose-p:text-[14px] prose-p:leading-relaxed prose-headings:font-portal-display prose-h1:text-[var(--fg)] prose-h2:text-[var(--fg)] prose-p:my-2 prose-pre:bg-[var(--bg)] prose-pre:border prose-pre:border-[var(--border-dim)] prose-pre:p-3 prose-pre:text-[13px]';

export default function HuntProblemPage() {
    const { problemId, routeHash } = useParams<{ problemId: string; routeHash: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const getProblemCache = useHuntScanStore((s) => s.getProblemCache);
    const setProblemCache = useHuntScanStore((s) => s.setProblemCache);

    const [problem, setProblem] = useState<TreasureHuntProblemRead | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [flag, setFlag] = useState('');
    const [submitBusy, setSubmitBusy] = useState(false);
    const [submitBanner, setSubmitBanner] = useState<{ tone: 'error' | 'success' | 'neutral'; text: string } | null>(
        null,
    );
    const [lastSubmit, setLastSubmit] = useState<TreasureHuntFlagSubmitRead | null>(null);

    const idempotencyKeyRef = useRef<string | null>(null);
    const lastFlagTrimmedRef = useRef<string>('');
    const inFlightRef = useRef(false);

    const [hintOpen, setHintOpen] = useState(false);
    const [celebrationOpen, setCelebrationOpen] = useState(false);

    useEffect(() => {
        setFlag('');
        setSubmitBanner(null);
        setLastSubmit(null);
        idempotencyKeyRef.current = null;
        lastFlagTrimmedRef.current = '';
        setHintOpen(false);
        setCelebrationOpen(false);
    }, [problemId, routeHash]);

    useEffect(() => {
        if (!problemId && !routeHash) {
            setLoadError('Missing problem id.');
            setLoading(false);
            return;
        }

        let cancelled = false;
        const stateProblem = (location.state as { problem?: TreasureHuntProblemRead } | null)?.problem;

        const resolve = async () => {
            setLoadError(null);
            if (routeHash) {
                if (stateProblem && stateProblem.route_hash === routeHash) {
                    setProblem(stateProblem);
                    setProblemCache(stateProblem);
                    setLoading(false);
                    return;
                }

                setProblem(null);
                setLoading(true);
                try {
                    const scanned = await scanProblemByRouteHash(routeHash);
                    if (cancelled) return;
                    setProblem(scanned);
                    setProblemCache(scanned);
                } catch (err) {
                    if (cancelled) return;
                    if (err instanceof ApiError && err.status === 401) {
                        navigate('/login', { state: { from: location.pathname } });
                        return;
                    }
                    if (err instanceof ApiError && err.status === 404) {
                        setLoadError('This QR route is not active for the hunt.');
                    } else {
                        setLoadError(getApiErrorMessage(err, 'Could not load challenge.'));
                    }
                } finally {
                    if (!cancelled) setLoading(false);
                }
                return;
            }

            if (!problemId) {
                setLoadError('Missing problem id.');
                setLoading(false);
                return;
            }

            if (stateProblem && stateProblem.id === problemId) {
                setProblem(stateProblem);
                setProblemCache(stateProblem);
                setLoading(false);
                return;
            }

            setProblem(null);
            setLoading(true);

            const cached = getProblemCache(problemId);
            if (cached) {
                if (cancelled) return;
                setProblem(cached);
                setLoading(false);
                return;
            }

            try {
                const progress = await getMyProgress();
                if (cancelled) return;
                const row = progress.problems.find((p) => p.problem_id === problemId);
                if (!row) {
                    setProblem(null);
                    setLoadError('This challenge is not in your progress list. Scan a hunt QR to open it.');
                    setLoading(false);
                    return;
                }
                setLoadError(
                    'Full challenge text is available after scanning the QR for this challenge. Use the scanner or paste the token.',
                );
                setProblem({
                    id: problemId,
                    slug: row.slug,
                    title: row.title,
                    teaser: '',
                    body_markdown: '',
                    hint_markdown: null,
                    qr_token: '',
                    route_hash: row.route_hash,
                    sort_order: row.sort_order,
                    already_solved: row.solved,
                    solved_at: row.solved_at,
                });
            } catch (err) {
                if (cancelled) return;
                if (err instanceof ApiError && err.status === 401) {
                    navigate('/login', { state: { from: location.pathname } });
                    return;
                }
                setLoadError(getApiErrorMessage(err, 'Could not load problem.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void resolve();
        return () => {
            cancelled = true;
        };
    }, [problemId, routeHash, location.state, location.pathname, getProblemCache, setProblemCache, navigate]);

    const problemReady = useMemo(() => problem != null && problem.body_markdown.length > 0, [problem]);
    const storyBeat = useMemo(() => (problem ? getHuntStoryBeat(problem.sort_order) : null), [problem]);
    const postSolveHint = useMemo(() => {
        if (!problem) return null;
        return lastSubmit?.next_hint ?? (problem.already_solved ? getNextHuntHint(problem.sort_order) : null);
    }, [lastSubmit?.next_hint, problem]);

    const getOrCreateIdempotencyKey = (trimmedFlag: string) => {
        if (trimmedFlag !== lastFlagTrimmedRef.current) {
            lastFlagTrimmedRef.current = trimmedFlag;
            idempotencyKeyRef.current = `hunt-submit-${crypto.randomUUID()}`;
        }
        if (!idempotencyKeyRef.current) {
            idempotencyKeyRef.current = `hunt-submit-${crypto.randomUUID()}`;
        }
        return idempotencyKeyRef.current;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!problem || !problemReady || submitBusy || problem.already_solved) return;
        const trimmed = flag.trim();
        if (!trimmed) return;
        if (inFlightRef.current) return;

        const key = getOrCreateIdempotencyKey(trimmed);
        setSubmitBusy(true);
        setSubmitBanner(null);
        inFlightRef.current = true;
        try {
            const res = await submitFlag(problem.id, { flag: trimmed, idempotency_key: key });
            setLastSubmit(res);
            if (res.status === 'incorrect') {
                setSubmitBanner({ tone: 'error', text: 'That flag is not correct. Try again.' });
            } else if (res.status === 'solved' || res.status === 'already_solved') {
                setSubmitBanner({
                    tone: res.status === 'already_solved' ? 'neutral' : 'success',
                    text:
                        res.status === 'already_solved'
                            ? 'Your team already solved this challenge.'
                            : 'Correct — challenge solved.',
                });
                setProblem((prev) =>
                    prev
                        ? {
                              ...prev,
                              already_solved: true,
                              solved_at: prev.solved_at ?? new Date().toISOString(),
                          }
                        : prev,
                );
                if (res.finish_rank != null) {
                    setCelebrationOpen(true);
                }
            }
            void getMyProgress().catch(() => {});
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                idempotencyKeyRef.current = null;
                lastFlagTrimmedRef.current = '';
                setSubmitBanner({
                    tone: 'error',
                    text: 'Request conflict. Please submit again with a fresh attempt.',
                });
            } else {
                setSubmitBanner({
                    tone: 'error',
                    text: getApiErrorMessage(err, 'Submit failed.'),
                });
            }
        } finally {
            setSubmitBusy(false);
            inFlightRef.current = false;
        }
    };

    if (loading) {
        return (
            <>
                <Seo
                    title="Treasure Hunt Challenge"
                    description="QR-only treasure hunt challenge route."
                    path={location.pathname}
                    noIndex
                />
                <div className="min-h-[40dvh] flex items-center justify-center">
                    <span className="font-portal-mono text-[10px] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                        Loading…
                    </span>
                </div>
            </>
        );
    }

    if (!problem) {
        return (
            <PortalPage className="pt-20 pb-28 px-4 max-w-xl mx-auto">
                <Seo
                    title="Treasure Hunt Challenge"
                    description="QR-only treasure hunt challenge route."
                    path={location.pathname}
                    noIndex
                />
                <PortalCard className="p-5" attr>
                    <p className="font-portal-body text-[13px] text-[var(--fg)]">{loadError ?? 'Unknown problem.'}</p>
                    <Link to="/hunt" className="mt-4 inline-block font-portal-mono text-[10px] uppercase text-[var(--amber)]">
                        Go to hunt home →
                    </Link>
                </PortalCard>
            </PortalPage>
        );
    }

    return (
        <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
            <Seo
                title={`Treasure Hunt · ${problem.title}`}
                description="QR-only treasure hunt challenge route."
                path={location.pathname}
                noIndex
            />
            <div data-portal-header>
                <SectionLabel>-- CHALLENGE --</SectionLabel>
                <div className="font-portal-display text-[clamp(28px,6vw,40px)] leading-none text-[var(--fg)] mt-2">
                    {problem.title}
                </div>
                {problem.teaser ? (
                    <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_78%,white_8%)] mt-3">
                        {problem.teaser}
                    </p>
                ) : null}
            </div>

            <Link
                to="/hunt"
                className="inline-block mt-4 font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--amber)] hover:underline"
            >
                ← Hunt home
            </Link>

            {problem.already_solved && (
                <div className="mt-4">
                    <StatusPill label="Solved" tone="green" />
                </div>
            )}

            {storyBeat && (
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <SectionLabel>{`-- FIELD NOTE ${problem.sort_order.toString().padStart(2, '0')} --`}</SectionLabel>
                    <div className="mt-2 font-portal-display text-[22px] leading-tight text-[var(--amber)]">
                        {storyBeat.title}
                    </div>
                    <div className="mt-3 grid gap-2">
                        {storyBeat.lines.map((line) => (
                            <p key={line} className="font-portal-body text-[14px] leading-relaxed text-[var(--fg)]">
                                "{line}"
                            </p>
                        ))}
                    </div>
                </PortalCard>
            )}

            {problemReady ? (
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <div className={`${mdBase} text-[var(--fg)]`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code: ({ className, children }) => (
                                    <code
                                        className={`font-portal-mono text-[13px] bg-[var(--bg)] text-[var(--fg)] px-1 py-0.5 border border-[var(--border-dim)] ${className ?? ''}`}
                                    >
                                        {children}
                                    </code>
                                ),
                                pre: ({ children }) => (
                                    <pre className="font-portal-mono text-[12px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                                        {children}
                                    </pre>
                                ),
                            }}
                        >
                            {problem.body_markdown}
                        </ReactMarkdown>
                    </div>
                </PortalCard>
            ) : (
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <p className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_85%,white_8%)]">
                        {loadError}
                    </p>
                    <PrimaryButton type="button" className="mt-4" onClick={() => navigate('/hunt')}>
                        Hunt home
                    </PrimaryButton>
                </PortalCard>
            )}

            {problemReady && problem.hint_markdown ? (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setHintOpen((o) => !o)}
                        className="w-full text-left font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[var(--amber)] border border-[var(--border-dim)] px-4 py-3 hover:border-[var(--amber)]"
                    >
                        {hintOpen ? 'Hide hint' : 'Show hint'}
                    </button>
                    {hintOpen && (
                        <PortalCard className="mt-2 p-4 sm:p-5" attr>
                            <div className={`${mdBase} text-[13px]`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.hint_markdown}</ReactMarkdown>
                            </div>
                        </PortalCard>
                    )}
                </div>
            ) : null}

            {problemReady && (
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div>
                            <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                                Flag
                            </label>
                            <input
                                value={flag}
                                onChange={(e) => setFlag(e.target.value)}
                                disabled={problem.already_solved || submitBusy}
                                className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)] disabled:opacity-60"
                                placeholder="Enter decoded flag"
                                autoComplete="off"
                            />
                        </div>
                        {submitBanner && (
                            <p
                                className={`font-portal-body text-[13px] ${
                                    submitBanner.tone === 'error'
                                        ? 'text-[var(--portal-red)]'
                                        : submitBanner.tone === 'success'
                                          ? 'text-[color-mix(in_srgb,var(--amber)_90%,white_10%)]'
                                          : 'text-[color-mix(in_srgb,var(--dim)_85%,white_10%)]'
                                }`}
                            >
                                {submitBanner.text}
                            </p>
                        )}
                        {postSolveHint && (
                                <div className="border border-[var(--amber)] bg-[color-mix(in_srgb,var(--amber)_14%,transparent)] px-4 py-3">
                                    <p className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[var(--amber)]">
                                        Next clue
                                    </p>
                                    <p className="mt-1 font-portal-body text-[13px] leading-relaxed text-[var(--fg)]">
                                        {postSolveHint}
                                    </p>
                                </div>
                            )}
                        <PrimaryButton type="submit" disabled={submitBusy || problem.already_solved}>
                            {submitBusy ? 'SUBMITTING…' : 'Submit flag'}
                        </PrimaryButton>
                    </form>
                </PortalCard>
            )}

            <div className="mt-6">
                <GhostButton type="button" onClick={() => navigate('/hunt/scan')}>
                    Back to scanner
                </GhostButton>
            </div>

            <PortalModal
                open={celebrationOpen}
                onClose={() => setCelebrationOpen(false)}
                title="TREASURE BOX"
            >
                <p className="font-portal-body text-[14px] text-[var(--fg)] leading-relaxed">
                    Your team has unlocked a treasure box. Show this screen to event staff.
                </p>
                {lastSubmit?.finish_rank != null && (
                    <p className="mt-3 font-portal-display text-[26px] text-[var(--amber)]">
                        Finisher #{lastSubmit.finish_rank}
                    </p>
                )}
            </PortalModal>
        </PortalPage>
    );
}

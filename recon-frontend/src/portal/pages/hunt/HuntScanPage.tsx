import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { scanProblem } from '../../api/treasureHunt';
import { ApiError } from '../../api/client';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { normalizeQrPayload } from '../../lib/qrToken';
import PortalPage from '../../components/PortalPage';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel } from '../../components/primitives';
import { useHuntScanStore } from '../../stores/huntScanStore';
import { useTeamStore } from '../../stores/teamStore';
import { useToastStore } from '../../stores/toastStore';

type ScanUiState =
    | 'idle'
    | 'requesting_permission'
    | 'active'
    | 'resolving_token'
    | 'invalid_code'
    | 'permission_denied'
    | 'camera_unavailable';

export default function HuntScanPage() {
    const navigate = useNavigate();
    const loadMyTeam = useTeamStore((s) => s.loadMyTeam);
    const team = useTeamStore((s) => s.team);
    const teamLoadStatus = useTeamStore((s) => s.teamLoadStatus);
    const teamError = useTeamStore((s) => s.teamError);
    const setProblemCache = useHuntScanStore((s) => s.setProblemCache);
    const addToast = useToastStore((s) => s.addToast);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const stoppedRef = useRef(false);
    const resolvingRef = useRef(false);
    const rafRef = useRef<number>(0);
    const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    /** Returned by ZXing `decodeFromVideoDevice`; must call `stop()` to end the decode loop. */
    const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const [ui, setUi] = useState<ScanUiState>('idle');
    const [manual, setManual] = useState('');
    const [apiError, setApiError] = useState<string | null>(null);

    const stopTracks = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const releaseWakeLock = useCallback(async () => {
        try {
            await wakeLockRef.current?.release();
        } catch {
            /* ignore */
        }
        wakeLockRef.current = null;
    }, []);

    useEffect(() => {
        void loadMyTeam();
    }, [loadMyTeam]);

    useEffect(() => {
        return () => {
            stoppedRef.current = true;
            cancelAnimationFrame(rafRef.current);
            void releaseWakeLock();
            stopTracks();
            try {
                zxingControlsRef.current?.stop();
            } catch {
                /* ignore */
            }
            zxingControlsRef.current = null;
            zxingReaderRef.current = null;
        };
    }, [releaseWakeLock, stopTracks]);

    const resolveToken = useCallback(
        async (rawPayload: string) => {
            if (resolvingRef.current) return;
            const token = normalizeQrPayload(rawPayload);
            if (!token) {
                setUi('invalid_code');
                setApiError(null);
                if (navigator.vibrate) navigator.vibrate(30);
                return;
            }
            resolvingRef.current = true;
            setApiError(null);
            setUi('resolving_token');
            stopTracks();
            void releaseWakeLock();
            try {
                cancelAnimationFrame(rafRef.current);
                const problem = await scanProblem(token);
                setProblemCache(problem);
                if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
                navigate(`/hunt/problem/${problem.id}`, { state: { problem } });
            } catch (err) {
                resolvingRef.current = false;
                if (err instanceof ApiError && err.status === 401) {
                    navigate('/login', { state: { from: '/hunt/scan' } });
                    return;
                }
                if (err instanceof ApiError && err.status === 403) {
                    setApiError('You do not have access to this feature.');
                } else if (err instanceof ApiError && err.status === 404) {
                    setApiError('This QR code is not part of the hunt, or it is no longer active.');
                } else {
                    setApiError(getApiErrorMessage(err, 'Could not resolve challenge.'));
                }
                setUi('idle');
                addToast({
                    type: 'error',
                    title: 'SCAN FAILED',
                    body: getApiErrorMessage(err, 'Could not resolve challenge.'),
                });
            }
        },
        [addToast, navigate, releaseWakeLock, setProblemCache, stopTracks],
    );

    const startBarcodeDetectorLoop = useCallback(
        (video: HTMLVideoElement) => {
            const BD = window.BarcodeDetector;
            if (!BD) return false;
            const detector = new BD({ formats: ['qr_code'] });
            const tick = async () => {
                if (stoppedRef.current || !videoRef.current) return;
                const v = videoRef.current;
                if (v.readyState >= 2) {
                    try {
                        const codes = await detector.detect(v);
                        if (codes.length > 0 && !stoppedRef.current) {
                            stoppedRef.current = true;
                            stopTracks();
                            void releaseWakeLock();
                            void resolveToken(codes[0].rawValue);
                            return;
                        }
                    } catch {
                        /* frame decode miss */
                    }
                }
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
            return true;
        },
        [releaseWakeLock, resolveToken, stopTracks],
    );

    const startZxing = useCallback(
        async (video: HTMLVideoElement) => {
            try {
                zxingControlsRef.current?.stop();
            } catch {
                /* ignore */
            }
            zxingControlsRef.current = null;

            const reader = new BrowserMultiFormatReader();
            zxingReaderRef.current = reader;
            const controls = await reader.decodeFromVideoDevice(undefined, video, (result, err) => {
                if (stoppedRef.current) return;
                if (err && String(err).includes('NotFound')) return;
                if (result) {
                    stoppedRef.current = true;
                    try {
                        zxingControlsRef.current?.stop();
                    } catch {
                        /* ignore */
                    }
                    zxingControlsRef.current = null;
                    zxingReaderRef.current = null;
                    stopTracks();
                    void releaseWakeLock();
                    void resolveToken(result.getText());
                }
            });
            zxingControlsRef.current = controls;
        },
        [releaseWakeLock, resolveToken, stopTracks],
    );

    const startCamera = useCallback(async () => {
        try {
            await loadMyTeam();
            if (!useTeamStore.getState().team) {
                navigate('/hunt/team', { replace: true });
                return;
            }
            setUi('requesting_permission');
            setApiError(null);
            stoppedRef.current = false;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (!video) {
                stopTracks();
                setUi('camera_unavailable');
                return;
            }
            video.srcObject = stream;
            await video.play().catch(() => {});

            if (navigator.wakeLock?.request) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                } catch {
                    /* ignore */
                }
            }

            setUi('active');
            const usedBD = startBarcodeDetectorLoop(video);
            if (!usedBD) {
                void startZxing(video);
            }
        } catch (e) {
            const name = e instanceof Error ? e.name : '';
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setUi('permission_denied');
            } else {
                setUi('camera_unavailable');
            }
            stopTracks();
        }
    }, [loadMyTeam, navigate, startBarcodeDetectorLoop, startZxing, stopTracks]);

    const onManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        stoppedRef.current = false;
        void resolveToken(manual);
    };

    if (teamLoadStatus === 'loading' || teamLoadStatus === 'idle') {
        return (
            <div className="min-h-[50dvh] flex items-center justify-center px-6">
                <span className="font-portal-mono text-[10px] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    Loading…
                </span>
            </div>
        );
    }

    if (teamLoadStatus === 'error') {
        return (
            <PortalPage className="pt-20 pb-28 px-4 max-w-xl mx-auto">
                <div data-portal-header>
                    <SectionLabel>-- SCAN QR --</SectionLabel>
                    <div className="font-portal-display text-[clamp(26px,5vw,36px)] leading-none text-[var(--fg)] mt-2">
                        Team unavailable
                    </div>
                </div>
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <p className="font-portal-body text-[13px] text-[var(--fg)]">
                        {teamError ?? 'Could not load your team. Try again, or go to team setup.'}
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <GhostButton type="button" onClick={() => void loadMyTeam()}>
                            Retry
                        </GhostButton>
                        <Link
                            to="/hunt/team"
                            className="block w-full min-h-11 border border-[var(--border-dim)] hover:border-[var(--border)] font-portal-mono text-[11px] tracking-[0.12em] uppercase text-[var(--fg)] px-4 py-3 text-center leading-none"
                        >
                            Team setup
                        </Link>
                    </div>
                </PortalCard>
            </PortalPage>
        );
    }

    if (teamLoadStatus === 'ready' && !team) {
        return <Navigate to="/hunt/team" replace />;
    }

    return (
        <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-lg mx-auto min-h-[100dvh]">
            <div data-portal-header>
                <SectionLabel>-- SCAN QR --</SectionLabel>
                <div className="font-portal-display text-[clamp(28px,6vw,40px)] leading-none text-[var(--fg)] mt-2">
                    HUNT <span className="text-[var(--amber)]">SCANNER</span>
                </div>
                <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                    Camera starts only after you tap the button. You can also enter a token manually.
                </p>
            </div>

            <Link
                to="/hunt"
                className="inline-block mt-4 font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--amber)] hover:underline"
            >
                ← Hunt home
            </Link>

            <PortalCard className="mt-6 p-0 overflow-hidden bg-black aspect-[4/5] max-h-[70dvh] relative" attr>
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />
                <div className="pointer-events-none absolute inset-8 border-2 border-[color-mix(in_srgb,var(--amber)_70%,transparent)] rounded-sm" />
                {(ui === 'idle' ||
                    ui === 'invalid_code' ||
                    ui === 'permission_denied' ||
                    ui === 'camera_unavailable' ||
                    ui === 'requesting_permission') ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center px-4 max-w-xs">
                            {ui === 'permission_denied' && (
                                <p className="font-portal-body text-[13px] text-[var(--fg)]">
                                    Camera permission was denied. Allow camera access in your browser settings, or use manual
                                    entry below.
                                </p>
                            )}
                            {ui === 'camera_unavailable' && (
                                <p className="font-portal-body text-[13px] text-[var(--fg)]">
                                    Camera could not be started. Use manual entry below.
                                </p>
                            )}
                            {ui === 'invalid_code' && (
                                <p className="font-portal-body text-[13px] text-[var(--portal-red)]">
                                    That text does not look like a valid hunt token. Try again or use manual entry with a
                                    token like th-01-shifted-ssid.
                                </p>
                            )}
                            {(ui === 'idle' || ui === 'invalid_code') && (
                                <p className="font-portal-mono text-[10px] text-[color-mix(in_srgb,var(--dim)_70%,white_8%)]">
                                    Tap start to use the camera.
                                </p>
                            )}
                            {ui === 'requesting_permission' && (
                                <p className="font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--amber)]">
                                    Starting camera…
                                </p>
                            )}
                        </div>
                    </div>
                ) : null}
                {ui === 'resolving_token' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/75">
                        <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                            Resolving…
                        </div>
                    </div>
                )}
            </PortalCard>

            <div className="mt-4 grid gap-3">
                {ui === 'idle' ||
                ui === 'invalid_code' ||
                ui === 'permission_denied' ||
                ui === 'camera_unavailable' ||
                ui === 'requesting_permission' ? (
                    <PrimaryButton
                        type="button"
                        disabled={ui === 'requesting_permission'}
                        onClick={() => void startCamera()}
                    >
                        {ui === 'requesting_permission' ? 'Starting…' : 'Start camera'}
                    </PrimaryButton>
                ) : null}
                {ui === 'active' && (
                    <GhostButton
                        type="button"
                        onClick={() => {
                            stoppedRef.current = true;
                            cancelAnimationFrame(rafRef.current);
                            try {
                                zxingControlsRef.current?.stop();
                            } catch {
                                /* ignore */
                            }
                            zxingControlsRef.current = null;
                            zxingReaderRef.current = null;
                            stopTracks();
                            void releaseWakeLock();
                            setUi('idle');
                        }}
                    >
                        Stop camera
                    </GhostButton>
                )}
            </div>

            {apiError && (
                <p className="mt-4 font-portal-body text-[13px] text-[var(--portal-red)] border border-[var(--border-dim)] p-3">
                    {apiError}
                </p>
            )}

            <PortalCard className="mt-6 p-5 sm:p-6" attr>
                <SectionLabel className="mb-3">-- MANUAL TOKEN --</SectionLabel>
                <form onSubmit={onManualSubmit} className="grid gap-3">
                    <input
                        value={manual}
                        onChange={(e) => setManual(e.target.value)}
                        placeholder="th-01-shifted-ssid or paste URL"
                        className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[13px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                        autoComplete="off"
                    />
                    <PrimaryButton type="submit" disabled={ui === 'resolving_token'}>
                        {ui === 'resolving_token' ? 'LOADING…' : 'Load challenge'}
                    </PrimaryButton>
                </form>
            </PortalCard>
        </PortalPage>
    );
}

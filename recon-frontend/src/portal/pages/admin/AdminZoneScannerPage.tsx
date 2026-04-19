import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel, StatusPill } from '../../components/primitives';
import { zonesApi } from '../../../api/backend';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { normalizeZoneQrPayload } from '../../lib/zoneQr';
import { useToastStore } from '../../stores/toastStore';

type ScanUiState =
    | 'idle'
    | 'requesting_permission'
    | 'active'
    | 'processing'
    | 'permission_denied'
    | 'camera_unavailable'
    | 'invalid_code';

type ScanResult = {
    status: string;
    checkInId?: string | null;
    participantId?: string | null;
    participantName?: string | null;
    eventId?: string | null;
    eventName?: string | null;
    pointsAwarded?: number | null;
    newPointsBalance?: number | null;
    checkedInAt?: string | null;
    message?: string | null;
    reason?: string | null;
};

function makeIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resultTone(status: string | undefined) {
    if (status === 'checked_in') return 'green' as const;
    if (status === 'already_checked_in') return 'amber' as const;
    return 'red' as const;
}

export default function AdminZoneScannerPage() {
    const addToast = useToastStore((state) => state.addToast);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const resolvingRef = useRef(false);
    const stoppedRef = useRef(false);
    const rafRef = useRef<number>(0);
    const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const [ui, setUi] = useState<ScanUiState>('idle');
    const [manual, setManual] = useState('');
    const [scannerDeviceId, setScannerDeviceId] = useState('portal-admin-scanner');
    const [apiError, setApiError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<ScanResult | null>(null);

    const stopTracks = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
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

    const stopScanner = useCallback(() => {
        stoppedRef.current = true;
        cancelAnimationFrame(rafRef.current);
        try {
            zxingControlsRef.current?.stop();
        } catch {
            /* ignore */
        }
        zxingControlsRef.current = null;
        stopTracks();
        void releaseWakeLock();
    }, [releaseWakeLock, stopTracks]);

    useEffect(() => () => {
        stopScanner();
    }, [stopScanner]);

    const submitToken = useCallback(
        async (rawPayload: string) => {
            if (resolvingRef.current) return;
            const qrToken = normalizeZoneQrPayload(rawPayload);
            if (!qrToken) {
                setUi('invalid_code');
                setApiError('The scanned payload did not include a usable zone QR token.');
                if (navigator.vibrate) navigator.vibrate(30);
                return;
            }
            if (!scannerDeviceId.trim()) {
                setApiError('Scanner device id is required.');
                setUi('idle');
                return;
            }

            resolvingRef.current = true;
            setUi('processing');
            setApiError(null);
            stopScanner();

            try {
                const result = await zonesApi.adminScanCheckIn(
                    {
                        qrToken,
                        scannerDeviceId: scannerDeviceId.trim(),
                        scannedAt: new Date().toISOString(),
                    },
                    makeIdempotencyKey(),
                ) as ScanResult;
                setLastResult(result);
                setUi('idle');
                if (result.status === 'checked_in') {
                    addToast({
                        type: 'success',
                        title: 'CHECK-IN RECORDED',
                        body: `${result.participantName ?? 'Participant'} earned ${result.pointsAwarded ?? 0} points.`,
                    });
                } else if (result.status === 'already_checked_in') {
                    addToast({
                        type: 'warning',
                        title: 'ALREADY CHECKED IN',
                        body: result.message ?? 'This pass has already been scanned.',
                    });
                } else {
                    addToast({
                        type: 'error',
                        title: 'INVALID PASS',
                        body: result.reason ?? 'Could not validate this QR pass.',
                    });
                }
            } catch (err) {
                setApiError(getApiErrorMessage(err, 'Could not process this scan.'));
                setUi('idle');
                addToast({
                    type: 'error',
                    title: 'SCAN FAILED',
                    body: getApiErrorMessage(err, 'Could not process this scan.'),
                });
            } finally {
                resolvingRef.current = false;
            }
        },
        [addToast, scannerDeviceId, stopScanner],
    );

    const startBarcodeDetectorLoop = useCallback((video: HTMLVideoElement) => {
        const BarcodeDetectorApi = window.BarcodeDetector;
        if (!BarcodeDetectorApi) return false;
        const detector = new BarcodeDetectorApi({ formats: ['qr_code'] });

        const tick = async () => {
            if (stoppedRef.current || !videoRef.current) return;
            const currentVideo = videoRef.current;
            if (currentVideo.readyState >= 2) {
                try {
                    const codes = await detector.detect(currentVideo);
                    if (codes.length > 0 && codes[0].rawValue) {
                        void submitToken(codes[0].rawValue);
                        return;
                    }
                } catch {
                    /* decode miss */
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return true;
    }, [submitToken]);

    const startZxing = useCallback(async (video: HTMLVideoElement) => {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(undefined, video, (result, err) => {
            if (stoppedRef.current) return;
            if (err && String(err).includes('NotFound')) return;
            if (result) {
                void submitToken(result.getText());
            }
        });
        zxingControlsRef.current = controls;
    }, [submitToken]);

    const startCamera = useCallback(async () => {
        try {
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
            const usedBarcodeDetector = startBarcodeDetectorLoop(video);
            if (!usedBarcodeDetector) {
                void startZxing(video);
            }
        } catch (err) {
            const name = err instanceof Error ? err.name : '';
            setUi(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'permission_denied' : 'camera_unavailable');
            stopTracks();
        }
    }, [releaseWakeLock, startBarcodeDetectorLoop, startZxing, stopTracks]);

    return (
        <AdminPageShell
            title="ZONE SCANNER"
            subtitle="Scan participant zone passes, validate backend-issued QR tokens, and award check-in points."
        >
            <PortalCard className="p-5 mb-5" attr>
                <SectionLabel className="mb-3">-- SCANNER CONTROL --</SectionLabel>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="relative bg-black aspect-[4/3] overflow-hidden border border-[var(--border-dim)]">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                        <div className="pointer-events-none absolute inset-6 border-2 border-[color-mix(in_srgb,var(--amber)_70%,transparent)] rounded-sm" />
                        {(ui === 'idle' || ui === 'invalid_code' || ui === 'permission_denied' || ui === 'camera_unavailable' || ui === 'requesting_permission') && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
                                <div className="font-portal-body text-[13px] text-[var(--fg)] max-w-xs">
                                    {ui === 'permission_denied' && 'Camera permission was denied. Allow camera access or use manual token entry below.'}
                                    {ui === 'camera_unavailable' && 'Camera could not be started on this device. Use manual token entry below.'}
                                    {ui === 'invalid_code' && 'The scanned payload was not a valid zone QR token.'}
                                    {(ui === 'idle' || ui === 'requesting_permission') && 'Tap start camera to scan a participant pass.'}
                                </div>
                            </div>
                        )}
                        {ui === 'processing' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                                    Processing…
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3">
                        <input
                            value={scannerDeviceId}
                            onChange={(event) => setScannerDeviceId(event.target.value)}
                            placeholder="scanner device id"
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[13px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            autoComplete="off"
                        />
                        {ui === 'active' ? (
                            <GhostButton type="button" onClick={() => {
                                stopScanner();
                                setUi('idle');
                            }}>
                                STOP CAMERA
                            </GhostButton>
                        ) : (
                            <PrimaryButton type="button" onClick={() => void startCamera()} disabled={ui === 'requesting_permission' || ui === 'processing'}>
                                {ui === 'requesting_permission' ? 'STARTING…' : 'START CAMERA'}
                            </PrimaryButton>
                        )}
                        <GhostButton type="button" onClick={() => {
                            setLastResult(null);
                            setApiError(null);
                            setManual('');
                            setUi('idle');
                        }}>
                            CLEAR RESULT
                        </GhostButton>
                    </div>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5" attr>
                <SectionLabel className="mb-3">-- MANUAL TOKEN --</SectionLabel>
                <div className="grid gap-3">
                    <textarea
                        value={manual}
                        onChange={(event) => setManual(event.target.value)}
                        placeholder="paste the backend-issued qr token or a URL containing it"
                        className="w-full min-h-28 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[12px] text-[var(--fg)] outline-none focus:border-[var(--amber)] resize-y"
                    />
                    <PrimaryButton type="button" onClick={() => void submitToken(manual)} disabled={ui === 'processing'}>
                        {ui === 'processing' ? 'PROCESSING…' : 'SUBMIT TOKEN'}
                    </PrimaryButton>
                </div>
            </PortalCard>

            {apiError && (
                <PortalCard className="p-4 mb-5 border-[color-mix(in_srgb,var(--portal-red)_30%,var(--border-dim))]" attr>
                    <div className="font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--portal-red)] mb-2">
                        Scan error
                    </div>
                    <div className="font-portal-body text-[13px] text-[var(--fg)]">
                        {apiError}
                    </div>
                </PortalCard>
            )}

            <PortalCard className="p-5" attr>
                <SectionLabel className="mb-3">-- LAST RESULT --</SectionLabel>
                {!lastResult ? (
                    <div className="font-portal-mono text-[10px] tracking-[0.12em] uppercase text-[var(--dim)]">
                        No scan processed yet.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusPill tone={resultTone(lastResult.status)} label={String(lastResult.status).replaceAll('_', ' ')} />
                            {lastResult.eventName && (
                                <div className="font-portal-display text-[20px] leading-none text-[var(--fg)] uppercase">
                                    {lastResult.eventName}
                                </div>
                            )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                ['Participant', lastResult.participantName ?? '—'],
                                ['Participant ID', lastResult.participantId ?? '—'],
                                ['Event', lastResult.eventId ?? '—'],
                                ['Points Awarded', lastResult.pointsAwarded != null ? String(lastResult.pointsAwarded) : '—'],
                                ['Balance', lastResult.newPointsBalance != null ? String(lastResult.newPointsBalance) : '—'],
                                ['Checked In At', lastResult.checkedInAt ?? '—'],
                            ].map(([label, value]) => (
                                <div key={label} className="border border-[var(--border-dim)] bg-[var(--bg)] p-3">
                                    <div className="font-portal-mono text-[9px] tracking-[0.16em] uppercase text-[var(--amber)] mb-1">
                                        {label}
                                    </div>
                                    <div className="font-portal-mono text-[11px] break-all text-[var(--fg)]">
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(lastResult.message || lastResult.reason) && (
                            <div className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_82%,white_5%)]">
                                {lastResult.message ?? lastResult.reason}
                            </div>
                        )}
                    </div>
                )}
            </PortalCard>
        </AdminPageShell>
    );
}

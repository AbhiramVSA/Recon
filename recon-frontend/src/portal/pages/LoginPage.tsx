import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Link } from 'react-router-dom';
import BootSequence from '../components/BootSequence';
import PortalDiagnostics from '../components/PortalDiagnostics';
import { PrimaryButton } from '../components/primitives';
import { getBackendAuthLoginUrl } from '../api/client';
import { EVENT_DATE_RANGE_LABEL } from '../lib/data';

const BOOT_LINES = [
    'RECON 2026 // SECURE ACCESS TERMINAL',
    'INITIALIZING PARTICIPANT AUTHENTICATION...',
    'STATUS: AWAITING CREDENTIALS',
];

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [bootDone, setBootDone] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!bootDone || !formRef.current || !buttonRef.current) return;

        gsap.fromTo(
            formRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
        );
        gsap.fromTo(
            buttonRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, delay: 0.1 },
        );
    }, [bootDone]);

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (loading) return;
        setLoading(true);
        window.location.href = getBackendAuthLoginUrl();
    };

    return (
        <div className="min-h-[100dvh] bg-[var(--bg)] portal-grain relative px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center justify-center overflow-y-auto">
            <header className="fixed top-[max(0.75rem,env(safe-area-inset-top))] inset-x-0 z-[120] px-4 sm:px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-start">
                    <Link to="/" className="font-display text-sm tracking-[0.3em] text-paper uppercase" aria-label="Go to RECON home page">
                        RECON
                    </Link>
                </div>
            </header>

            <BootSequence lines={BOOT_LINES} speed={40} onComplete={() => setBootDone(true)} />

            <div ref={formRef} className="w-full max-w-md mt-6 sm:mt-8 opacity-0">
                <div className="portal-card px-5 py-8 sm:px-8 sm:py-10">
                    <div className="font-portal-display text-[36px] leading-none text-[var(--fg)] tracking-[0.03em]">
                        RECON <span className="text-[var(--amber)]">2026</span>
                    </div>
                    <div className="mt-2 font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--dim)_76%,white_6%)]">
                        PARTICIPANT CLEARANCE PORTAL
                    </div>
                    <div className="mt-2 font-portal-mono text-[9px] tracking-[0.16em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                        {EVENT_DATE_RANGE_LABEL} // VIT-AP
                    </div>

                    <div className="h-px bg-[var(--border-dim)] my-6" />

                    <form onSubmit={onSubmit}>
                        <div ref={buttonRef} className="opacity-0">
                            <PrimaryButton type="submit" disabled={loading}>
                                {loading ? (
                                    <span className="inline-flex items-center gap-1">
                                        TRANSMITTING
                                        <span className="typing-dots" aria-hidden="true" />
                                    </span>
                                ) : (
                                    'SIGN IN WITH GOOGLE ->'
                                )}
                            </PrimaryButton>
                        </div>

                        <p className="mt-4 text-center font-portal-mono text-[9px] tracking-[0.08em] text-[color-mix(in_srgb,var(--dim)_58%,black_20%)] leading-relaxed">
                            Sign-in is handled via Google. You will be redirected back automatically.
                        </p>
                    </form>
                </div>
            </div>

            <PortalDiagnostics />
        </div>
    );
}

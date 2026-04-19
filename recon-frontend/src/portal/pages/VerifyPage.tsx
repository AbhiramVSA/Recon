import { Link, useNavigate } from 'react-router-dom';
import PortalDiagnostics from '../components/PortalDiagnostics';
import { PrimaryButton } from '../components/primitives';
import { EVENT_DATE_RANGE_LABEL } from '../lib/data';

export default function VerifyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[100dvh] bg-[var(--bg)] portal-grain relative px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center justify-center overflow-y-auto">
            <header className="fixed top-[max(0.75rem,env(safe-area-inset-top))] inset-x-0 z-[120] px-4 sm:px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-start">
                    <Link to="/" className="font-display text-sm tracking-[0.3em] text-paper uppercase" aria-label="Go to RECON home page">
                        RECON
                    </Link>
                </div>
            </header>

            <div className="w-full max-w-md mt-6 sm:mt-8" data-portal-card>
                <div className="portal-card px-5 py-8 sm:px-8 sm:py-10">
                    <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_70%,black_10%)]">
                        AUTH FLOW UPDATED
                    </div>

                    <div className="mt-3 font-portal-display text-[28px] leading-none text-[var(--fg)] tracking-[0.03em]">
                        USE
                        <br />
                        <span className="text-[var(--amber)]">GOOGLE SIGN-IN</span>
                    </div>
                    <div className="mt-2 font-portal-mono text-[9px] tracking-[0.16em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_12%)]">
                        {EVENT_DATE_RANGE_LABEL} // VIT-AP
                    </div>

                    <div className="h-px bg-[var(--border-dim)] my-6" />
                    <div className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)]">
                        This portal now authenticates via Google OAuth. Return to login to continue.
                    </div>

                    <div className="mt-5">
                        <PrimaryButton type="button" onClick={() => navigate('/login', { replace: true })}>
                            RETURN TO LOGIN
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <PortalDiagnostics />
        </div>
    );
}

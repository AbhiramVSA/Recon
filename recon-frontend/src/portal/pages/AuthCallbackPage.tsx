import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalDiagnostics from '../components/PortalDiagnostics';
import { useAuthStore } from '../stores/authStore';
import { PrimaryButton } from '../components/primitives';

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const bootstrapSession = useAuthStore((state) => state.bootstrapSession);
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const profileStatus = useAuthStore((state) => state.profileStatus);

    useEffect(() => {
        void bootstrapSession();
    }, [bootstrapSession]);

    useEffect(() => {
        if (sessionStatus !== 'authenticated') return;
        if (profileStatus === 'missing') {
            navigate('/profile/setup', { replace: true });
            return;
        }
        if (profileStatus === 'present') {
            navigate('/dashboard', { replace: true });
            return;
        }
        if (profileStatus === 'unknown') {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate, profileStatus, sessionStatus]);

    return (
        <div className="min-h-[100dvh] bg-[var(--bg)] portal-grain relative px-4 sm:px-6 py-10 flex flex-col items-center justify-center overflow-y-auto">
            <div className="w-full max-w-md" data-portal-card>
                <div className="portal-card px-5 py-8 sm:px-8 sm:py-10 text-center">
                    <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_70%,black_10%)]">
                        AUTH CALLBACK
                    </div>
                    <div className="mt-3 font-portal-display text-[28px] leading-none text-[var(--fg)] tracking-[0.03em]">
                        COMPLETING
                        <br />
                        <span className="text-[var(--amber)]">SIGN-IN</span>
                    </div>

                    {sessionStatus === 'unauthenticated' && (
                        <div className="mt-6">
                            <div className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)]">
                                We couldn&apos;t establish a session. Please try signing in again.
                            </div>
                            <div className="mt-4">
                                <PrimaryButton type="button" onClick={() => navigate('/login', { replace: true })}>
                                    RETURN TO LOGIN
                                </PrimaryButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PortalDiagnostics />
        </div>
    );
}


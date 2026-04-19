import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const DEV_BYPASS_AUTH =
    import.meta.env.DEV
    && ((import.meta.env.VITE_PORTAL_DEV_BYPASS_AUTH as string | undefined)?.trim() === '1');

function AuthCheckShell() {
    return (
        <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--fg)] portal-grain flex items-center justify-center px-6">
            <div className="portal-card px-6 py-6 text-center max-w-sm">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    ESTABLISHING LINK
                </div>
                <div className="mt-3 font-portal-display text-[26px] leading-none">AUTH CHECK</div>
            </div>
        </div>
    );
}

export function RequireVerified() {
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const bootstrapSession = useAuthStore((state) => state.bootstrapSession);
    const location = useLocation();
    const bootstrappedRef = useRef(false);

    if (DEV_BYPASS_AUTH) {
        return <Outlet />;
    }

    useEffect(() => {
        if (bootstrappedRef.current) return;
        bootstrappedRef.current = true;
        void bootstrapSession();
    }, [bootstrapSession]);

    if (sessionStatus === 'unknown') {
        return <AuthCheckShell />;
    }

    if (sessionStatus !== 'authenticated') {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}

function ProfileCheckShell() {
    return (
        <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--fg)] portal-grain flex items-center justify-center px-6">
            <div className="portal-card px-6 py-6 text-center max-w-sm">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    LOADING PROFILE
                </div>
                <div className="mt-3 font-portal-display text-[26px] leading-none">PROFILE CHECK</div>
            </div>
        </div>
    );
}

/** Treasure hunt and other routes that need a participant profile. */
export function RequireParticipantProfile() {
    const profileStatus = useAuthStore((state) => state.profileStatus);
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const location = useLocation();

    if (DEV_BYPASS_AUTH) {
        return <Outlet />;
    }

    if (sessionStatus !== 'authenticated') {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (profileStatus === 'unknown') {
        return <ProfileCheckShell />;
    }

    if (profileStatus === 'missing') {
        return <Navigate to="/profile/setup" replace state={{ from: location.pathname + location.search }} />;
    }

    return <Outlet />;
}

export function RedirectIfVerified() {
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const location = useLocation();

    if (DEV_BYPASS_AUTH) {
        return <Outlet />;
    }

    // Keep verified users away from OTP verification, but allow opening /login explicitly.
    if (sessionStatus === 'authenticated' && location.pathname.startsWith('/verify')) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

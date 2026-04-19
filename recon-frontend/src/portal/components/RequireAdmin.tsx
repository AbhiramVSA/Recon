import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isPrivilegedUser } from '../lib/admin';

/**
 * Nested under `RequireVerified` + `PortalLayout`. Non-privileged users go to `/dashboard`.
 */
export function RequireAdmin() {
    const sessionStatus = useAuthStore((s) => s.sessionStatus);
    const user = useAuthStore((s) => s.user);
    const location = useLocation();

    if (sessionStatus === 'unknown') {
        return (
            <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--fg)] portal-grain flex items-center justify-center px-6">
                <div className="portal-card px-6 py-6 text-center max-w-sm">
                    <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                        VERIFYING CLEARANCE
                    </div>
                    <div className="mt-3 font-portal-display text-[26px] leading-none">
                        ADMIN ACCESS
                    </div>
                </div>
            </div>
        );
    }

    if (sessionStatus !== 'authenticated') {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (!isPrivilegedUser(user)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}

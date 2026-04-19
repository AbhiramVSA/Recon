import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PortalNavigation from './PortalNavigation';
import PortalToasts from './PortalToasts';
import PortalDiagnostics from './PortalDiagnostics';
import { getAnnouncementsWebSocketUrl, type BackendAnnouncementEvent } from '../api/announcements';
import { useAnnouncementStore } from '../stores/announcementStore';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { useZoneStore } from '../stores/zoneStore';

export default function PortalLayout() {
    const MAX_ANNOUNCEMENT_WS_RETRIES = 3;
    const sessionStatus = useAuthStore((state) => state.sessionStatus);
    const announcements = useAnnouncementStore((state) => state.announcements);
    const hydrated = useAnnouncementStore((state) => state.hydrated);
    const fetchAnnouncements = useAnnouncementStore((state) => state.fetchAnnouncements);
    const upsertAnnouncement = useAnnouncementStore((state) => state.upsertAnnouncement);
    const removeAnnouncement = useAnnouncementStore((state) => state.removeAnnouncement);
    const setHighlightedAnnouncement = useAnnouncementStore(
        (state) => state.setHighlightedAnnouncement,
    );
    const hydrateZones = useZoneStore((state) => state.hydrateZones);
    const zonesHydrated = useZoneStore((state) => state.hydrated);
    const addToast = useToastStore((state) => state.addToast);

    useEffect(() => {
        if (sessionStatus !== 'authenticated') return;
        if (hydrated) return;
        void fetchAnnouncements().catch((err) => {
            addToast({
                type: 'error',
                title: 'FAILED TO LOAD ANNOUNCEMENTS',
                body: err instanceof Error ? err.message : 'Please refresh and try again.',
                durationMs: 5000,
            });
        });
    }, [addToast, fetchAnnouncements, hydrated, sessionStatus]);

    useEffect(() => {
        if (sessionStatus !== 'authenticated') return;

        let websocket: WebSocket | null = null;
        let reconnectTimer: number | null = null;
        let closedByUser = false;
        let reconnectAttempts = 0;

        const scheduleReconnect = () => {
            if (closedByUser) return;
            if (reconnectAttempts >= MAX_ANNOUNCEMENT_WS_RETRIES) {
                return;
            }
            const delay = Math.min(10_000, 1_000 * (reconnectAttempts + 1));
            reconnectTimer = window.setTimeout(connect, delay);
            reconnectAttempts += 1;
        };

        const connect = () => {
            websocket = new WebSocket(getAnnouncementsWebSocketUrl());

            websocket.onopen = () => {
                reconnectAttempts = 0;
            };

            websocket.onmessage = (event) => {
                let payload: BackendAnnouncementEvent;
                try {
                    payload = JSON.parse(String(event.data)) as BackendAnnouncementEvent;
                } catch {
                    return;
                }

                if (!payload.announcement?.id) return;
                if (payload.event === 'announcement.deleted') {
                    removeAnnouncement(payload.announcement.id);
                    return;
                }
                if (payload.event === 'announcement.created' || payload.event === 'announcement.updated') {
                    upsertAnnouncement(payload.announcement as NonNullable<BackendAnnouncementEvent['announcement']> & {
                        title: string;
                        body: string;
                        priority: 'urgent' | 'update' | 'info' | 'general';
                        published_at: string;
                        is_pinned: boolean;
                        created_by: string;
                        created_at: string;
                        updated_at: string;
                    });
                }
            };

            websocket.onerror = () => {
                websocket?.close();
            };

            websocket.onclose = () => {
                websocket = null;
                scheduleReconnect();
            };
        };

        connect();

        return () => {
            closedByUser = true;
            if (reconnectTimer != null) {
                window.clearTimeout(reconnectTimer);
            }
            websocket?.close();
        };
    }, [removeAnnouncement, sessionStatus, upsertAnnouncement]);

    useEffect(() => {
        if (sessionStatus !== 'authenticated') return;
        if (zonesHydrated) return;
        void hydrateZones().catch((err) => {
            addToast({
                type: 'error',
                title: 'FAILED TO LOAD ZONES',
                body: err instanceof Error ? err.message : 'Please refresh and try again.',
                durationMs: 5000,
            });
        });
    }, [addToast, hydrateZones, sessionStatus, zonesHydrated]);

    useEffect(() => {
        const hasFired = sessionStorage.getItem('recon-portal-ann-toast-fired');
        if (hasFired) return;

        const featured = announcements[0];
        if (!featured) return;

        const id = window.setTimeout(() => {
            addToast({
                type: featured.priority === 'URGENT' ? 'error' : 'warning',
                title: 'NEW ANNOUNCEMENT',
                body: `${featured.title} - ${featured.body.slice(0, 60)}...`,
                durationMs: featured.priority === 'URGENT' ? 8000 : 4000,
                ctaPath: '/announcements',
            });
            setHighlightedAnnouncement(featured.id);
            sessionStorage.setItem('recon-portal-ann-toast-fired', '1');
        }, 30000);

        return () => clearTimeout(id);
    }, [addToast, announcements, setHighlightedAnnouncement]);

    return (
        <div className="h-[100dvh] bg-[var(--bg)] text-[var(--fg)] portal-grain overflow-hidden">
            <PortalNavigation />
            <PortalToasts />
            <PortalDiagnostics />
            <main
                className="h-full overflow-y-auto overscroll-none overflow-x-hidden app-shell-scroll"
                data-portal-scroll-root
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <Outlet />
            </main>
        </div>
    );
}

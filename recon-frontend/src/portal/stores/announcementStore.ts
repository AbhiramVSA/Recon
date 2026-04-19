import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Announcement } from '../lib/types';
import { fetchAnnouncements } from '../api/announcements';
import type { BackendAnnouncement } from '../api/announcements';

function toPriority(priority: BackendAnnouncement['priority']): Announcement['priority'] {
    if (priority === 'urgent') return 'URGENT';
    if (priority === 'update') return 'UPDATE';
    if (priority === 'info') return 'INFO';
    return 'GENERAL';
}

function relativeLabel(iso: string) {
    const published = new Date(iso).getTime();
    const diffMs = published - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    const absMin = Math.abs(diffMin);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (absMin < 60) return rtf.format(diffMin, 'minute');

    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');

    const diffDay = Math.round(diffHr / 24);
    return rtf.format(diffDay, 'day');
}

function mapAnnouncement(item: BackendAnnouncement): Announcement {
    return {
        id: item.id,
        title: item.title.toUpperCase(),
        body: item.body,
        priority: toPriority(item.priority),
        // Backend does not include per-zone categories in current schema.
        category: 'GENERAL',
        postedBy: 'RECON COMMAND',
        timeLabel: relativeLabel(item.published_at),
        createdAt: item.published_at,
        unread: true,
    };
}

interface AnnouncementState {
    announcements: Announcement[];
    unreadCount: number;
    highlightedAnnouncementId: string | null;
    hydrated: boolean;
    fetchAnnouncements: () => Promise<void>;
    addAnnouncement: (announcement: Announcement) => void;
    upsertAnnouncement: (announcement: BackendAnnouncement) => void;
    removeAnnouncement: (id: string) => void;
    markAllRead: () => void;
    markRead: (id: string) => void;
    setHighlightedAnnouncement: (id: string | null) => void;
    resetAnnouncements: () => void;
}

const initialAnnouncements: Announcement[] = [];
const initialUnreadCount = 0;

export const useAnnouncementStore = create<AnnouncementState>()(
    persist(
        (set, get) => ({
            announcements: initialAnnouncements,
            unreadCount: initialUnreadCount,
            highlightedAnnouncementId: null,
            hydrated: false,
            fetchAnnouncements: async () => {
                const items = await fetchAnnouncements();
                const mapped = items.map(mapAnnouncement);
                set({
                    announcements: mapped,
                    unreadCount: mapped.filter((a) => a.unread).length,
                    hydrated: true,
                });
            },
            addAnnouncement: (announcement) => {
                const exists = get().announcements.some((a) => a.id === announcement.id);
                if (exists) return;
                const next = [{ ...announcement, unread: true }, ...get().announcements];
                set({
                    announcements: next,
                    unreadCount: next.filter((a) => a.unread).length,
                });
            },
            upsertAnnouncement: (announcement) => {
                const mapped = mapAnnouncement(announcement);
                const current = get().announcements;
                const existing = current.find((item) => item.id === mapped.id);
                const next = existing
                    ? current.map((item) =>
                        item.id === mapped.id
                            ? { ...mapped, unread: item.unread || item.createdAt !== mapped.createdAt }
                            : item,
                    )
                    : [{ ...mapped, unread: true }, ...current];
                set({
                    announcements: next,
                    unreadCount: next.filter((a) => a.unread).length,
                });
            },
            removeAnnouncement: (id) => {
                const next = get().announcements.filter((announcement) => announcement.id !== id);
                set({
                    announcements: next,
                    unreadCount: next.filter((announcement) => announcement.unread).length,
                });
            },
            markAllRead: () => {
                const updated = get().announcements.map((a) => ({ ...a, unread: false }));
                set({ announcements: updated, unreadCount: 0 });
            },
            markRead: (id) => {
                const updated = get().announcements.map((a) =>
                    a.id === id ? { ...a, unread: false } : a,
                );
                set({
                    announcements: updated,
                    unreadCount: updated.filter((a) => a.unread).length,
                });
            },
            setHighlightedAnnouncement: (id) => set({ highlightedAnnouncementId: id }),
            resetAnnouncements: () =>
                set({
                    announcements: initialAnnouncements,
                    unreadCount: initialUnreadCount,
                    highlightedAnnouncementId: null,
                    hydrated: false,
                }),
        }),
        {
            name: 'recon-portal-announcements',
            partialize: (state) => ({
                announcements: state.announcements,
                unreadCount: state.unreadCount,
            }),
            merge: (persistedState, currentState) => {
                const persisted = (persistedState ?? {}) as Partial<AnnouncementState>;
                return {
                    ...currentState,
                    announcements: persisted.announcements ?? currentState.announcements,
                    unreadCount: persisted.unreadCount ?? currentState.unreadCount,
                    highlightedAnnouncementId: null,
                    hydrated: false,
                };
            },
        },
    ),
);

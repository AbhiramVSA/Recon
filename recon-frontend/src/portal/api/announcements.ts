import { apiFetch, buildApiUrl } from './client';

export type BackendAnnouncementPriority = 'urgent' | 'update' | 'info' | 'general';

export interface BackendAnnouncement {
    id: string;
    title: string;
    body: string;
    priority: BackendAnnouncementPriority;
    published_at: string;
    expires_at?: string | null;
    is_pinned: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface BackendAnnouncementEvent {
    event: 'connected' | 'announcement.created' | 'announcement.updated' | 'announcement.deleted';
    channel?: string;
    announcement?: Partial<BackendAnnouncement> & { id: string };
}

export async function fetchAnnouncements() {
    return apiFetch<BackendAnnouncement[]>('/api/v1/announcements');
}

export function getAnnouncementsWebSocketUrl() {
    const url = new URL(buildApiUrl('/api/v1/realtime/announcements/ws'));
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString();
}


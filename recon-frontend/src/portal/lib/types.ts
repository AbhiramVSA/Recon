export type ZoneType = 'flagship' | 'side';
export type ZoneStatus = 'open' | 'closed' | 'soon';

export type ZoneCategory =
    | 'FLAGSHIP'
    | 'HARDWARE'
    | 'WEB'
    | 'FORENSICS'
    | 'COMPETITIVE'
    | 'EXPO'
    | 'PUZZLE'
    | 'GAMING'
    | 'CREATIVE';

export interface Zone {
    id: string;
    type: ZoneType;
    name: string;
    shortName: string;
    tags: string[];
    category: ZoneCategory;
    description: string;
    teamSize: string;
    prizes?: string;
    duration?: string;
    format?: string;
    points: number;
    registrationRequired: boolean;
    registrationPoints: number;
    checkInPoints: number;
    location: string;
    registeredCount: number;
    status: ZoneStatus;
    color: string;
}

export interface MerchItem {
    id: string;
    name: string;
    type: 'APPAREL' | 'ACCESSORIES';
    pointsCost: number;
    stock: number;
    description: string;
    image?: string;
}

export type AnnouncementPriority = 'URGENT' | 'UPDATE' | 'INFO' | 'GENERAL';

export interface Announcement {
    id: string;
    title: string;
    body: string;
    priority: AnnouncementPriority;
    category: string;
    postedBy: string;
    timeLabel: string;
    createdAt: string;
    unread?: boolean;
}

export interface Participant {
    id: string;
    email: string;
    displayName: string;
    registrationId?: string | null;
    points?: number | null;
    checkedInZones?: string[];
    leaderboardRank?: number | null;
    eventsRegisteredCount?: number;
    zonesCheckedInCount?: number;
}

export interface ZoneQrCode {
    zoneId: string;
    registrationId: string;
    code: string;
    qrToken: string;
    qrExpiresAt: string;
    isActive: boolean;
    checkedIn?: boolean;
    checkedInAt?: string;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    body: string;
    durationMs?: number;
    ctaPath?: string;
}

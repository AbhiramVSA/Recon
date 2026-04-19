import { apiFetch } from './client';

export interface BackendZoneCatalogItem {
    id: string;
    name: string;
    shortName: string;
    category: string;
    type: string;
    tags: string[];
    status: string;
    location: string;
    points: number;
    registrationRequired: boolean;
    registrationPoints: number;
    checkInPoints: number;
    registeredCount: number;
    color: string;
}

export interface BackendEventRegistrationQr {
    registrationId: string;
    eventId: string;
    qrToken: string;
    qrExpiresAt: string;
    pointsAwarded: number;
    newPointsBalance?: number | null;
}

export interface BackendZonePass {
    zoneId: string;
    code: string;
    isActive: boolean;
    checkedInAt?: string | null;
}

export interface BackendMyRegistrations {
    zoneIds: string[];
}

export interface BackendMyPasses {
    passes: BackendZonePass[];
}

function asString(value: unknown, fallback = '') {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || fallback;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return fallback;
}

function asNumber(value: unknown, fallback = 0) {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function asBoolean(value: unknown, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    return fallback;
}

function asStringArray(value: unknown) {
    if (Array.isArray(value)) {
        return value.map((entry) => String(entry).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
}

function deriveShortName(name: string) {
    const initials = name
        .split(/\s+/)
        .map((word) => word[0] ?? '')
        .join('')
        .toUpperCase();
    if (initials.length >= 2) return initials.slice(0, 8);
    return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'ZONE';
}

function normalizeZone(raw: unknown): BackendZoneCatalogItem | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;

    const id = asString(record.id ?? record.zone_id);
    const name = asString(record.name ?? record.zone_name ?? record.title);
    if (!id || !name) return null;

    const shortName = asString(record.shortName ?? record.short_name ?? record.shortname, deriveShortName(name));
    const category = asString(record.category ?? record.zone_category, 'FLAGSHIP').toUpperCase();
    const type = asString(record.type ?? record.zone_type, category === 'FLAGSHIP' ? 'flagship' : 'side').toLowerCase();
    const tags = asStringArray(record.tags ?? record.labels);
    const status = asString(record.status ?? record.zone_status ?? (record.is_active === false ? 'closed' : 'open'), 'open').toLowerCase();
    const location = asString(record.location ?? record.venue ?? record.room, 'TBD');
    const points = asNumber(record.points ?? record.reward_points ?? record.point_cost, 0);
    const registrationRequired = asBoolean(record.registrationRequired ?? record.registration_required, true);
    const registrationPoints = asNumber(record.registrationPoints ?? record.registration_points ?? points, points);
    const checkInPoints = asNumber(record.checkInPoints ?? record.check_in_points, 0);
    const registeredCount = asNumber(record.registeredCount ?? record.registered_count ?? record.registration_count, 0);
    const color = asString(record.color ?? record.accent_color, '#8fb0ff');

    return {
        id,
        name,
        shortName,
        category,
        type,
        tags,
        status,
        location,
        points,
        registrationRequired,
        registrationPoints,
        checkInPoints,
        registeredCount,
        color,
    };
}

function extractZoneArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;

    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        const candidate = [record.items, record.data, record.results, record.zones].find(Array.isArray);
        if (Array.isArray(candidate)) return candidate;
    }

    return [];
}

export async function fetchZonesCatalog() {
    const payload = await apiFetch<unknown>('/api/v1/zones');
    return extractZoneArray(payload)
        .map((item) => normalizeZone(item))
        .filter((item): item is BackendZoneCatalogItem => Boolean(item));
}

export async function fetchZoneById(zoneId: string) {
    const payload = await apiFetch<unknown>(`/api/v1/zones/${encodeURIComponent(zoneId)}`);
    const zone = normalizeZone(payload);
    if (!zone) {
        throw new Error('Invalid zone response payload.');
    }
    return zone;
}

export async function createEventRegistration(eventId: string) {
    return apiFetch<BackendEventRegistrationQr>(`/api/v1/events/${encodeURIComponent(eventId)}/registrations`, {
        method: 'POST',
    });
}

export async function fetchRegistrationQr(registrationId: string) {
    return apiFetch<BackendEventRegistrationQr>(`/api/v1/registrations/${encodeURIComponent(registrationId)}/qr`);
}

export async function fetchMyRegistrations() {
    return apiFetch<BackendMyRegistrations>('/api/v1/me/registrations');
}

export async function fetchMyPasses() {
    return apiFetch<BackendMyPasses>('/api/v1/me/passes');
}

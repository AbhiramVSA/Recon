/**
 * Normalizes QR decode / paste input into either:
 * - legacy `qr_token` payloads for GET /treasure-hunt/scan/{qr_token}
 * - SHA route hashes for GET /treasure-hunt/scan/routes/{route_hash}
 *
 * Supports raw values, full URLs, or path suffixes whose last segment matches a known payload format.
 */

const HUNT_TOKEN_RE = /^th-[a-z0-9._-]+$/i;
const HUNT_ROUTE_HASH_RE = /^[a-f0-9]{64}$/i;

export type HuntScanPayload =
    | { kind: 'qr_token'; value: string }
    | { kind: 'route_hash'; value: string };

export function isLikelyHuntQrToken(segment: string): boolean {
    const s = segment.trim();
    return s.length > 0 && HUNT_TOKEN_RE.test(s);
}

export function isLikelyHuntRouteHash(segment: string): boolean {
    const s = segment.trim();
    return s.length > 0 && HUNT_ROUTE_HASH_RE.test(s);
}

/**
 * @param raw - Scanner output or pasted text (may be URL or path).
 * @returns Parsed payload when recognized; `null` when no hunt payload was found.
 */
export function normalizeQrPayload(raw: string): HuntScanPayload | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    if (isLikelyHuntQrToken(trimmed)) {
        return { kind: 'qr_token', value: trimmed };
    }

    if (isLikelyHuntRouteHash(trimmed)) {
        return { kind: 'route_hash', value: trimmed.toLowerCase() };
    }

    let pathname = '';
    try {
        const u = new URL(trimmed);
        const queryRouteHash = u.searchParams.get('routeHash') ?? u.searchParams.get('route_hash');
        if (queryRouteHash && isLikelyHuntRouteHash(queryRouteHash)) {
            return { kind: 'route_hash', value: queryRouteHash.trim().toLowerCase() };
        }
        const queryQrToken = u.searchParams.get('qrToken') ?? u.searchParams.get('qr_token') ?? u.searchParams.get('qr');
        if (queryQrToken && isLikelyHuntQrToken(queryQrToken)) {
            return { kind: 'qr_token', value: queryQrToken.trim() };
        }
        pathname = u.pathname;
    } catch {
        if (trimmed.includes('://')) {
            return null;
        }
        pathname = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }

    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? '';
    let decoded = last;
    try {
        decoded = decodeURIComponent(last);
    } catch {
        return null;
    }
    if (isLikelyHuntRouteHash(decoded)) {
        return { kind: 'route_hash', value: decoded.trim().toLowerCase() };
    }
    if (isLikelyHuntQrToken(decoded)) {
        return { kind: 'qr_token', value: decoded };
    }

    return null;
}

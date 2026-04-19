/**
 * Normalizes QR decode / paste input into a `qr_token` for GET /treasure-hunt/scan/{qr_token}.
 * Supports raw tokens (e.g. th-01-shifted-ssid), full URLs, or path suffixes whose last segment looks like a hunt token.
 */

const HUNT_TOKEN_RE = /^th-[a-z0-9._-]+$/i;

export function isLikelyHuntQrToken(segment: string): boolean {
    const s = segment.trim();
    return s.length > 0 && HUNT_TOKEN_RE.test(s);
}

/**
 * @param raw - Scanner output or pasted text (may be URL or path).
 * @returns Token string when recognized; empty string when no hunt-shaped token was found.
 */
export function normalizeQrPayload(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';

    if (isLikelyHuntQrToken(trimmed)) {
        return trimmed;
    }

    let pathname = '';
    try {
        const u = new URL(trimmed);
        pathname = u.pathname;
    } catch {
        if (trimmed.includes('://')) {
            return '';
        }
        pathname = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }

    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? '';
    let decoded = last;
    try {
        decoded = decodeURIComponent(last);
    } catch {
        return '';
    }
    if (isLikelyHuntQrToken(decoded)) {
        return decoded;
    }

    return '';
}

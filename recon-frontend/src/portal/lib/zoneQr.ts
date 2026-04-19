const JWTISH_RE = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;

export function normalizeZoneQrPayload(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';

    if (JWTISH_RE.test(trimmed)) {
        return trimmed;
    }

    try {
        const url = new URL(trimmed);
        const directParam = url.searchParams.get('qrToken')
            ?? url.searchParams.get('qr')
            ?? url.searchParams.get('token');
        if (directParam) {
            const decoded = directParam.trim();
            if (decoded) return decoded;
        }

        const lastSegment = url.pathname.split('/').filter(Boolean).pop() ?? '';
        const decodedSegment = decodeURIComponent(lastSegment).trim();
        if (decodedSegment) {
            return decodedSegment;
        }
    } catch {
        return trimmed;
    }

    return '';
}

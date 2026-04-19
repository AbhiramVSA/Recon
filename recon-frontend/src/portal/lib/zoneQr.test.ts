import { describe, expect, it } from 'vitest';
import { normalizeZoneQrPayload } from './zoneQr';

describe('normalizeZoneQrPayload', () => {
    it('returns raw JWT-like tokens unchanged', () => {
        const token = 'header.payload.signature';
        expect(normalizeZoneQrPayload(token)).toBe(token);
    });

    it('extracts a qrToken query parameter from URLs', () => {
        expect(normalizeZoneQrPayload('https://reconhq.tech/scan?qrToken=header.payload.signature')).toBe(
            'header.payload.signature',
        );
    });

    it('falls back to the last path segment for URL payloads', () => {
        expect(normalizeZoneQrPayload('https://reconhq.tech/zone-pass/header.payload.signature')).toBe(
            'header.payload.signature',
        );
    });

    it('returns plain trimmed text when the scanner returns raw non-url content', () => {
        expect(normalizeZoneQrPayload('  not-a-url-token  ')).toBe('not-a-url-token');
    });
});

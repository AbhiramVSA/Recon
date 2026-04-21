import { describe, expect, it } from 'vitest';
import { normalizeQrPayload } from './qrToken';

const SAMPLE_HASH = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

describe('normalizeQrPayload', () => {
    it('parses legacy hunt tokens', () => {
        expect(normalizeQrPayload('th-01-dancing-men')).toEqual({
            kind: 'qr_token',
            value: 'th-01-dancing-men',
        });
    });

    it('parses sha route hashes', () => {
        expect(normalizeQrPayload(SAMPLE_HASH)).toEqual({
            kind: 'route_hash',
            value: SAMPLE_HASH,
        });
    });

    it('parses route hashes from URL path', () => {
        expect(normalizeQrPayload(`https://www.reconhq.tech/hunt/r/${SAMPLE_HASH}`)).toEqual({
            kind: 'route_hash',
            value: SAMPLE_HASH,
        });
    });

    it('parses route hashes from query params', () => {
        expect(normalizeQrPayload(`https://www.reconhq.tech/hunt?routeHash=${SAMPLE_HASH}`)).toEqual({
            kind: 'route_hash',
            value: SAMPLE_HASH,
        });
    });

    it('returns null for unrelated text', () => {
        expect(normalizeQrPayload('not-a-valid-payload')).toBeNull();
    });
});

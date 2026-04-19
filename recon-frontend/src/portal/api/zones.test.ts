import { describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
    apiFetch: vi.fn(),
}));

import { apiFetch } from './client';
import { fetchZonesCatalog } from './zones';

describe('fetchZonesCatalog', () => {
    it('preserves false registration_required values from backend payloads', async () => {
        vi.mocked(apiFetch).mockResolvedValueOnce([
            {
                id: 'zone-art',
                name: 'Art Zone',
                short_name: 'ART',
                category: 'CREATIVE',
                type: 'side',
                registration_required: false,
                registration_points: 0,
                check_in_points: 0,
                points: 0,
                registered_count: 10,
                status: 'open',
                location: 'Room 316',
                tags: ['CREATIVE', 'ART'],
            },
            {
                id: 'zone-ctf',
                name: 'Capture The Flag',
                short_name: 'CTF',
                category: 'COMPETITIVE',
                type: 'flagship',
                registration_required: true,
                registration_points: 0,
                check_in_points: 200,
                points: 200,
                registered_count: 124,
                status: 'open',
                location: 'Lab 101',
                tags: ['OVERNIGHT'],
            },
        ]);

        const zones = await fetchZonesCatalog();

        expect(zones[0]?.registrationRequired).toBe(false);
        expect(zones[1]?.registrationRequired).toBe(true);
    });
});

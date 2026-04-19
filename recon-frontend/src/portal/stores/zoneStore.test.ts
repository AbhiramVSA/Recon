import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/zones', () => ({
    createEventRegistration: vi.fn(),
    fetchMyPasses: vi.fn(),
    fetchMyRegistrations: vi.fn(),
    fetchRegistrationQr: vi.fn(),
    fetchZonesCatalog: vi.fn(),
}));

vi.mock('../../api/backend', () => ({
    zonesApi: {
        unregister: vi.fn(),
    },
}));

import {
    createEventRegistration,
    fetchMyPasses,
    fetchMyRegistrations,
    fetchZonesCatalog,
} from '../api/zones';
import { useZoneStore } from './zoneStore';

describe('useZoneStore.registerZone', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.removeItem('recon-portal-zones');
        useZoneStore.setState({
            registeredZones: [],
            qrCodes: [],
            hydrated: false,
        });
    });

    it('falls back to static zone short names when the live catalog is unavailable', async () => {
        vi.mocked(fetchZonesCatalog)
            .mockRejectedValueOnce(new Error('catalog unavailable'))
            .mockRejectedValueOnce(new Error('catalog unavailable'));
        vi.mocked(createEventRegistration).mockResolvedValueOnce({
            registrationId: 'registration-ctf',
            eventId: 'CTF',
            qrToken: 'signed-token-ctf',
            qrExpiresAt: '2026-04-19T12:00:00Z',
            pointsAwarded: 0,
            newPointsBalance: 120,
        });
        vi.mocked(fetchMyRegistrations).mockResolvedValueOnce({ zoneIds: [] });
        vi.mocked(fetchMyPasses).mockResolvedValueOnce({ passes: [] });

        const pass = await useZoneStore.getState().registerZone('ctf');

        expect(createEventRegistration).toHaveBeenCalledWith('CTF');
        expect(pass).toMatchObject({
            zoneId: 'ctf',
            registrationId: 'registration-ctf',
            qrToken: 'signed-token-ctf',
            isActive: true,
        });
        expect(useZoneStore.getState().registeredZones).toContain('ctf');
    });
});

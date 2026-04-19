import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('./client', () => ({
    apiFetch: apiFetchMock,
}));

describe('zonesApi registration helpers', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
    });

    it('register resolves short names through zone lookup and uses the canonical events endpoint', async () => {
        apiFetchMock.mockResolvedValueOnce({
            id: '900adfbc-bd4e-45b1-a806-9fbdc3bde06a',
            shortName: 'koth',
        });
        apiFetchMock.mockResolvedValueOnce({
            registrationId: 'registration-koth',
        });

        const { zonesApi } = await import('./backend');

        await zonesApi.register('koth');

        expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/v1/zones/koth');
        expect(apiFetchMock).toHaveBeenNthCalledWith(
            2,
            '/api/v1/events/koth/registrations',
            { method: 'POST' },
        );
    });

    it('unregister resolves short names to UUIDs before calling the legacy unregister endpoint', async () => {
        apiFetchMock.mockResolvedValueOnce({
            id: '900adfbc-bd4e-45b1-a806-9fbdc3bde06a',
            shortName: 'koth',
        });
        apiFetchMock.mockResolvedValueOnce({
            status: 'ok',
        });

        const { zonesApi } = await import('./backend');

        await zonesApi.unregister('koth');

        expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/v1/zones/koth');
        expect(apiFetchMock).toHaveBeenNthCalledWith(
            2,
            '/api/v1/zones/900adfbc-bd4e-45b1-a806-9fbdc3bde06a/register',
            { method: 'DELETE' },
        );
    });
});

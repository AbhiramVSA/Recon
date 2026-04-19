import { describe, expect, it, vi } from 'vitest';

vi.mock('../../api/client', () => ({
    ApiError: class ApiError extends Error {},
    apiFetch: vi.fn(),
    buildApiUrl: (path: string) => `https://api.reconhq.tech${path}`,
}));

describe('getBackendAuthLoginUrl', () => {
    it('returns the canonical Google login endpoint URL', async () => {
        const { getBackendAuthLoginUrl } = await import('./client');
        expect(getBackendAuthLoginUrl()).toBe('https://api.reconhq.tech/api/v1/auth/google/login');
    });
});

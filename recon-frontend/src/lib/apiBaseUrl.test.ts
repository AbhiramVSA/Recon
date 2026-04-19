import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './apiBaseUrl';

describe('resolveApiBaseUrl', () => {
    it('prefers an explicit VITE_API_BASE_URL when provided', () => {
        expect(resolveApiBaseUrl({
            envUrl: 'https://api-preview.reconhq.tech ',
            isProd: true,
            hostname: 'recon-git-auth-fix.vercel.app',
        })).toBe('https://api-preview.reconhq.tech');
    });

    it('uses the local FastAPI origin during development without env overrides', () => {
        expect(resolveApiBaseUrl({
            envUrl: '',
            isProd: false,
            hostname: 'localhost',
        })).toBe('http://localhost:8000');
    });

    it('uses the canonical API host in production even on preview hosts', () => {
        expect(resolveApiBaseUrl({
            envUrl: '',
            isProd: true,
            hostname: 'recon-git-auth-fix.vercel.app',
        })).toBe('https://api.reconhq.tech');
    });
});

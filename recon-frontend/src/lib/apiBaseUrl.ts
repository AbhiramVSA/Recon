const PROD_API_FALLBACK = 'https://api.reconhq.tech';

type ResolveApiBaseUrlOptions = {
    envUrl?: string | undefined;
    isProd: boolean;
    hostname?: string | undefined;
};

/**
 * Resolves the FastAPI base URL for browser fetches.
 * - `VITE_API_BASE_URL` wins when set.
 * - Local dev uses the local FastAPI origin.
 * - Production defaults to the canonical API host even on preview/custom frontend hosts so
 *   auth and credentialed API calls do not get routed back into the static SPA host.
 */
export function resolveApiBaseUrl({ envUrl, isProd }: ResolveApiBaseUrlOptions): string {
    const normalizedEnvUrl = envUrl?.trim();
    if (normalizedEnvUrl) return normalizedEnvUrl;
    if (!isProd) {
        return 'http://localhost:8000';
    }
    return PROD_API_FALLBACK;
}

export function getApiBaseUrl(): string {
    return resolveApiBaseUrl({
        envUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
        isProd: import.meta.env.PROD,
        hostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
    });
}

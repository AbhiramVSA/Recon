import { getApiBaseUrl } from '../lib/apiBaseUrl';

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

function joinUrl(base: string, path: string) {
    const b = base.replace(/\/+$/, '');
    const p = path.replace(/^\/+/, '');
    return `${b}/${p}`;
}

export { getApiBaseUrl };

export async function apiFetch<T>(
    path: string,
    init: RequestInit & { json?: unknown } = {},
): Promise<T> {
    const { json, headers, ...rest } = init;

    const reqInit: RequestInit = {
        ...rest,
        credentials: 'include',
        headers: {
            ...(json ? { 'Content-Type': 'application/json' } : {}),
            ...(headers || {}),
        },
        body: json ? JSON.stringify(json) : rest.body,
    };

    const res = await fetch(joinUrl(getApiBaseUrl(), path), reqInit);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
        const msg = typeof body === 'string' && body ? body : `Request failed (${res.status})`;
        throw new ApiError(msg, res.status, body);
    }

    return body as T;
}

export function buildApiUrl(path: string) {
    return joinUrl(getApiBaseUrl(), path);
}


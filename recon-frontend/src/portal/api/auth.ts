import { apiFetch } from './client';

export interface BackendRole {
    id: string;
    name: string;
    description?: string | null;
}

export interface BackendUserProfile {
    id: string;
    email: string;
    username: string;
    is_active: boolean;
    created_at: string;
    role?: BackendRole | null;
}

export async function fetchMe() {
    return apiFetch<BackendUserProfile>('/api/v1/auth/me');
}

export async function logout() {
    return apiFetch<{ status: string }>('/api/v1/auth/logout', { method: 'POST' });
}


import { buildApiUrl } from '../../api/client';

export { ApiError, apiFetch, buildApiUrl } from '../../api/client';

export function getBackendAuthLoginUrl() {
    return buildApiUrl('/api/v1/auth/google/login');
}


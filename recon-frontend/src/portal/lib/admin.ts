import type { BackendUserProfile } from '../api/auth';

const PRIVILEGED_ROLE_NAMES = new Set(['admin', 'ops']);

export function isPrivilegedUser(user: BackendUserProfile | null | undefined): boolean {
    const name = user?.role?.name?.toLowerCase();
    return name != null && PRIVILEGED_ROLE_NAMES.has(name);
}

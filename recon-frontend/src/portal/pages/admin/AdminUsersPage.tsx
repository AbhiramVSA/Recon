import { useCallback, useEffect, useMemo, useState } from 'react';
import { usersApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton, StatusPill } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type UserRole = {
    id?: string;
    name?: string;
};

type UserRow = {
    id: string;
    email: string;
    username: string;
    is_active: boolean;
    created_at?: string;
    role?: UserRole | null;
};

const CREATE_ROLE_OPTIONS = ['participant', 'admin', 'partner'] as const;
const FILTER_ROLE_OPTIONS = ['all', 'admin', 'participant', 'partner'] as const;

function formatTimestamp(value?: string) {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
}

export default function AdminUsersPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [rows, setRows] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<(typeof FILTER_ROLE_OPTIONS)[number]>('all');

    const [createEmail, setCreateEmail] = useState('');
    const [createUsername, setCreateUsername] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createRole, setCreateRole] = useState<(typeof CREATE_ROLE_OPTIONS)[number]>('participant');

    const [patchEmail, setPatchEmail] = useState('');
    const [patchUsername, setPatchUsername] = useState('');
    const [patchPassword, setPatchPassword] = useState('');
    const [patchActive, setPatchActive] = useState(true);
    const [patchRole, setPatchRole] = useState('participant');
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

    const hydrateSelection = useCallback((user: UserRow) => {
        setSelectedId(user.id);
        setSelectedUser(user);
        setPatchEmail(user.email);
        setPatchUsername(user.username);
        setPatchPassword('');
        setPatchActive(Boolean(user.is_active));
        setPatchRole(user.role?.name ?? 'participant');
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await usersApi.list({ limit: 500 });
            const normalized = Array.isArray(list) ? list as UserRow[] : [];
            setRows(normalized);
            if (selectedId) {
                const matching = normalized.find((row) => row.id === selectedId);
                if (matching) {
                    hydrateSelection(matching);
                } else {
                    setSelectedId('');
                    setSelectedUser(null);
                }
            }
        } catch (err) {
            addToast({ type: 'error', title: 'LIST FAILED', body: getApiErrorMessage(err, 'Could not load users.') });
        } finally {
            setLoading(false);
        }
    }, [addToast, hydrateSelection, selectedId]);

    useEffect(() => {
        void load();
    }, [load]);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        return rows.filter((row) => {
            const roleName = row.role?.name ?? '—';
            if (roleFilter !== 'all' && roleName !== roleFilter) return false;
            if (!query) return true;
            return [row.email, row.username, roleName, row.id].some((value) => value.toLowerCase().includes(query));
        });
    }, [roleFilter, rows, search]);

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await usersApi.create({
                email: createEmail.trim(),
                username: createUsername.trim(),
                password: createPassword,
                role_name: createRole,
            }) as UserRow;
            addToast({ type: 'success', title: 'USER CREATED', body: created.email });
            setCreateEmail('');
            setCreateUsername('');
            setCreatePassword('');
            setCreateRole('participant');
            await load();
            hydrateSelection(created);
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Create failed.') });
        }
    };

    const onLoadOne = async (idOverride?: string) => {
        const id = (idOverride ?? selectedId).trim();
        if (!id) return;
        try {
            const user = await usersApi.get(id) as UserRow;
            hydrateSelection(user);
            addToast({ type: 'success', title: 'LOADED', body: user.email });
        } catch (err) {
            addToast({ type: 'error', title: 'GET FAILED', body: getApiErrorMessage(err, 'Could not load user.') });
        }
    };

    const onUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = selectedId.trim();
        if (!id) return;
        try {
            const payload: Record<string, unknown> = {
                email: patchEmail.trim(),
                username: patchUsername.trim(),
                is_active: patchActive,
                role_name: patchRole,
            };
            if (patchPassword.trim()) payload.password = patchPassword;
            const updated = await usersApi.update(id, payload) as UserRow;
            hydrateSelection(updated);
            addToast({ type: 'success', title: 'UPDATED', body: updated.email });
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'UPDATE FAILED', body: getApiErrorMessage(err, 'Update failed.') });
        }
    };

    const onDelete = async () => {
        const id = selectedId.trim();
        if (!id || !selectedUser) return;
        if (!window.confirm(`Delete user ${selectedUser.email}?`)) return;
        try {
            await usersApi.remove(id);
            addToast({ type: 'success', title: 'DELETED', body: selectedUser.email });
            setSelectedId('');
            setSelectedUser(null);
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'DELETE FAILED', body: getApiErrorMessage(err, 'Delete failed.') });
        }
    };

    return (
        <AdminPageShell
            title="USERS"
            subtitle="Admin-only user CRUD on /api/v1/users. The directory now loads the live set instead of a stale first-page slice."
        >
            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        DIRECTORY ({loading ? '…' : `${filteredRows.length}/${rows.length}`})
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <GhostButton type="button" className="!w-auto min-h-9 px-4" onClick={() => void load()}>
                            REFRESH
                        </GhostButton>
                    </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="grid gap-2">
                        <input
                            placeholder="search email / username / role / id"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value as (typeof FILTER_ROLE_OPTIONS)[number])}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        >
                            {FILTER_ROLE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="max-h-72 overflow-auto border border-[var(--border-dim)] divide-y divide-[var(--border-dim)]">
                        {filteredRows.map((user) => {
                            const selected = user.id === selectedId;
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={`w-full text-left px-3 py-3 hover:bg-[var(--surface)] ${
                                        selected ? 'bg-[var(--surface-2)]' : ''
                                    }`}
                                    onClick={() => void onLoadOne(user.id)}
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`font-portal-mono text-[11px] ${selected ? 'text-[var(--amber)]' : 'text-[var(--fg)]'}`}>
                                            {user.email}
                                        </span>
                                        <StatusPill label={user.role?.name ?? '—'} tone={user.is_active ? 'green' : 'red'} />
                                    </div>
                                    <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-1">
                                        {user.username} · {user.id.slice(0, 8)}… · created {formatTimestamp(user.created_at)}
                                    </div>
                                </button>
                            );
                        })}
                        {!loading && filteredRows.length === 0 && (
                            <div className="px-3 py-6 text-center font-portal-mono text-[11px] text-[var(--dim)]">
                                No users match the current filters.
                            </div>
                        )}
                    </div>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">CREATE USER</div>
                <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
                    <input
                        type="email"
                        required
                        placeholder="email"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <input
                        required
                        placeholder="username"
                        value={createUsername}
                        onChange={(e) => setCreateUsername(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <input
                        required
                        type="password"
                        placeholder="password"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <select
                        value={createRole}
                        onChange={(event) => setCreateRole(event.target.value as (typeof CREATE_ROLE_OPTIONS)[number])}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    >
                        {CREATE_ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <div className="md:col-span-2">
                        <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                            CREATE USER
                        </PrimaryButton>
                    </div>
                </form>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">EDIT USER</div>
                <div className="flex flex-wrap gap-2 mb-4">
                    <input
                        placeholder="user uuid"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="flex-1 min-w-[200px] min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => void onLoadOne()}>
                        LOAD
                    </GhostButton>
                </div>
                {selectedUser && (
                    <div className="mb-4 font-portal-mono text-[10px] text-[var(--dim)]">
                        Selected: {selectedUser.email} · {selectedUser.id}
                    </div>
                )}
                <form onSubmit={onUpdate} className="grid gap-3">
                    <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        email
                        <input
                            value={patchEmail}
                            onChange={(e) => setPatchEmail(e.target.value)}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                    </label>
                    <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        username
                        <input
                            value={patchUsername}
                            onChange={(e) => setPatchUsername(e.target.value)}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                    </label>
                    <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        new password (optional)
                        <input
                            type="password"
                            value={patchPassword}
                            onChange={(e) => setPatchPassword(e.target.value)}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                            role_name
                            <select
                                value={patchRole}
                                onChange={(e) => setPatchRole(e.target.value)}
                                className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                            >
                                {CREATE_ROLE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 font-portal-mono text-[11px] text-[var(--fg)] mt-6">
                            <input type="checkbox" checked={patchActive} onChange={(e) => setPatchActive(e.target.checked)} />
                            active
                        </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="submit" className="!w-auto min-h-10 px-6" disabled={!selectedId.trim()}>
                            SAVE CHANGES
                        </PrimaryButton>
                        <GhostButton
                            type="button"
                            className="!w-auto min-h-10 px-6 border-[var(--portal-red)] text-[var(--portal-red)]"
                            onClick={() => void onDelete()}
                            disabled={!selectedId.trim()}
                        >
                            DELETE
                        </GhostButton>
                    </div>
                </form>
            </PortalCard>
        </AdminPageShell>
    );
}

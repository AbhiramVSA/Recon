import { useCallback, useEffect, useMemo, useState } from 'react';
import { announcementsApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton, StatusPill } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type AnnouncementRow = {
    id: string;
    title: string;
    body: string;
    priority: string;
    published_at: string;
    expires_at?: string | null;
    is_pinned: boolean;
};

const PRIORITY_OPTIONS = ['info', 'warning', 'critical'] as const;

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function toLocalDateTimeInput(value?: string | null) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function toLocalDateTimeLabel(value: string) {
    if (!value) return 'Not scheduled';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Invalid date';
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())} local`;
}

function toIsoFromLocalInput(value: string) {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return parsed.toISOString();
}

function nowAsLocalInput() {
    const now = new Date();
    now.setSeconds(0, 0);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function AdminAnnouncementsPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [rows, setRows] = useState<AnnouncementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>('info');
    const [publishedAt, setPublishedAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    const selected = useMemo(
        () => rows.find((row) => row.id === selectedId) ?? null,
        [rows, selectedId],
    );

    const hydrate = useCallback((row: AnnouncementRow | null) => {
        if (!row) {
            setSelectedId('');
            setTitle('');
            setBody('');
            setPriority('info');
            setPublishedAt('');
            setExpiresAt('');
            setIsPinned(false);
            return;
        }
        setSelectedId(row.id);
        setTitle(row.title);
        setBody(row.body);
        setPriority((PRIORITY_OPTIONS.includes(row.priority as (typeof PRIORITY_OPTIONS)[number]) ? row.priority : 'info') as (typeof PRIORITY_OPTIONS)[number]);
        setPublishedAt(toLocalDateTimeInput(row.published_at));
        setExpiresAt(toLocalDateTimeInput(row.expires_at));
        setIsPinned(Boolean(row.is_pinned));
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const announcements = await announcementsApi.list();
            const normalized = Array.isArray(announcements) ? announcements as AnnouncementRow[] : [];
            setRows(normalized);
            if (selectedId) {
                const match = normalized.find((row) => row.id === selectedId) ?? null;
                hydrate(match);
            }
        } catch (err) {
            addToast({ type: 'error', title: 'LOAD FAILED', body: getApiErrorMessage(err, 'Could not load announcements.') });
        } finally {
            setLoading(false);
        }
    }, [addToast, hydrate, selectedId]);

    useEffect(() => {
        void load();
    }, [load]);

    const buildPayload = () => ({
        title: title.trim(),
        body: body.trim(),
        priority,
        is_pinned: isPinned,
        published_at: toIsoFromLocalInput(publishedAt),
        expires_at: expiresAt ? toIsoFromLocalInput(expiresAt) : null,
    });

    const onCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const created = await announcementsApi.create(buildPayload()) as AnnouncementRow;
            addToast({ type: 'success', title: 'ANNOUNCEMENT CREATED', body: created.title });
            await load();
            hydrate(created);
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Could not create announcement.') });
        }
    };

    const onUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedId) return;
        try {
            const updated = await announcementsApi.update(selectedId, buildPayload()) as AnnouncementRow;
            addToast({ type: 'success', title: 'ANNOUNCEMENT UPDATED', body: updated.title });
            await load();
            hydrate(updated);
        } catch (err) {
            addToast({ type: 'error', title: 'UPDATE FAILED', body: getApiErrorMessage(err, 'Could not update announcement.') });
        }
    };

    const onDelete = async () => {
        if (!selectedId || !selected) return;
        if (!window.confirm(`Delete announcement "${selected.title}"?`)) return;
        try {
            await announcementsApi.remove(selectedId);
            addToast({ type: 'success', title: 'ANNOUNCEMENT DELETED', body: selected.title });
            hydrate(null);
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'DELETE FAILED', body: getApiErrorMessage(err, 'Could not delete announcement.') });
        }
    };

    return (
        <AdminPageShell
            title="ANNOUNCEMENTS"
            subtitle="Admin publish/edit/delete flow for the live announcement feed."
        >
            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        LIVE FEED ({loading ? '…' : rows.length})
                    </span>
                    <GhostButton type="button" className="!w-auto min-h-9 px-4" onClick={() => void load()}>
                        REFRESH
                    </GhostButton>
                </div>
                <div className="max-h-72 overflow-auto border border-[var(--border-dim)] divide-y divide-[var(--border-dim)]">
                    {rows.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            className={`w-full text-left px-3 py-3 hover:bg-[var(--surface)] ${row.id === selectedId ? 'bg-[var(--surface-2)]' : ''}`}
                            onClick={() => hydrate(row)}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-portal-mono text-[11px] text-[var(--fg)]">{row.title}</div>
                                <StatusPill label={row.priority} tone={row.priority === 'critical' ? 'red' : row.priority === 'warning' ? 'amber' : 'blue'} />
                                {row.is_pinned && <StatusPill label="pinned" tone="green" />}
                            </div>
                            <div className="font-portal-body text-[12px] text-[var(--dim)] mt-2 line-clamp-2">{row.body}</div>
                        </button>
                    ))}
                </div>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">
                    {selectedId ? 'EDIT ANNOUNCEMENT' : 'CREATE ANNOUNCEMENT'}
                </div>
                <form onSubmit={selectedId ? onUpdate : onCreate} className="grid gap-3">
                    <input
                        placeholder="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        required
                    />
                    <textarea
                        placeholder="body"
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        className="min-h-32 bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-3 font-portal-body text-[13px] text-[var(--fg)]"
                        required
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                        <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                            priority
                            <select
                                value={priority}
                                onChange={(event) => setPriority(event.target.value as (typeof PRIORITY_OPTIONS)[number])}
                                className="mt-1 min-h-11 w-full bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                            >
                                {PRIORITY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                            publish at
                            <div className="mt-1 flex gap-2">
                                <input
                                    aria-label="publish at"
                                    type="datetime-local"
                                    value={publishedAt}
                                    onChange={(event) => setPublishedAt(event.target.value)}
                                    className="min-h-11 flex-1 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                                />
                                <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => setPublishedAt(nowAsLocalInput())}>
                                    NOW
                                </GhostButton>
                                <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => setPublishedAt('')}>
                                    CLEAR
                                </GhostButton>
                            </div>
                            <div className="mt-2 font-portal-mono text-[10px] normal-case tracking-normal text-[var(--dim)]">
                                Leave blank to publish immediately. Stored in UTC, shown here in your local time.
                            </div>
                            <div className="mt-1 font-portal-mono text-[10px] normal-case tracking-normal text-[var(--fg)]">
                                {toLocalDateTimeLabel(publishedAt)}
                            </div>
                        </label>
                        <label className="block font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                            expires at
                            <div className="mt-1 flex gap-2">
                                <input
                                    aria-label="expires at"
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(event) => setExpiresAt(event.target.value)}
                                    className="min-h-11 flex-1 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                                />
                                <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => setExpiresAt('')}>
                                    CLEAR
                                </GhostButton>
                            </div>
                            <div className="mt-2 font-portal-mono text-[10px] normal-case tracking-normal text-[var(--dim)]">
                                Optional. Leave blank if the announcement should stay active until manually removed.
                            </div>
                            <div className="mt-1 font-portal-mono text-[10px] normal-case tracking-normal text-[var(--fg)]">
                                {toLocalDateTimeLabel(expiresAt)}
                            </div>
                        </label>
                    </div>
                    <label className="flex items-center gap-2 font-portal-mono text-[11px] text-[var(--fg)]">
                        <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
                        pin on top
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                            {selectedId ? 'SAVE ANNOUNCEMENT' : 'CREATE ANNOUNCEMENT'}
                        </PrimaryButton>
                        {selectedId && (
                            <>
                                <GhostButton type="button" className="!w-auto min-h-10 px-6" onClick={() => hydrate(null)}>
                                    RESET FORM
                                </GhostButton>
                                <GhostButton
                                    type="button"
                                    className="!w-auto min-h-10 px-6 border-[var(--portal-red)] text-[var(--portal-red)]"
                                    onClick={() => void onDelete()}
                                >
                                    DELETE
                                </GhostButton>
                            </>
                        )}
                    </div>
                </form>
            </PortalCard>
        </AdminPageShell>
    );
}

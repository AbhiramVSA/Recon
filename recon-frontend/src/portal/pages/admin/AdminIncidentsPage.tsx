import { useCallback, useEffect, useState } from 'react';
import { incidentsApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type Row = Record<string, unknown>;

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['open', 'acknowledged', 'resolved'] as const;

export default function AdminIncidentsPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>('low');
    const [zoneId, setZoneId] = useState('');

    const [patchStatus, setPatchStatus] = useState<(typeof STATUSES)[number]>('open');
    const [patchSeverity, setPatchSeverity] = useState<(typeof SEVERITIES)[number]>('low');
    const [assignTo, setAssignTo] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await incidentsApi.list();
            setRows(Array.isArray(list) ? list : []);
        } catch (err) {
            addToast({ type: 'error', title: 'LIST FAILED', body: getApiErrorMessage(err, 'Could not load incidents.') });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load();
    }, [load]);

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Record<string, unknown> = {
                title: title.trim(),
                description: description.trim(),
                severity,
            };
            if (zoneId.trim()) payload.zone_id = zoneId.trim();
            await incidentsApi.create(payload);
            addToast({ type: 'success', title: 'CREATED', body: title.trim() });
            setTitle('');
            setDescription('');
            setZoneId('');
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Create failed.') });
        }
    };

    const onLoadOne = async () => {
        const id = selectedId.trim();
        if (!id) return;
        try {
            const row = await incidentsApi.get(id);
            setPatchStatus((row as { status?: string }).status as (typeof STATUSES)[number] ?? 'open');
            setPatchSeverity((row as { severity?: string }).severity as (typeof SEVERITIES)[number] ?? 'low');
            setAssignTo(String((row as { assigned_to?: string }).assigned_to ?? ''));
            setResolutionNotes(String((row as { resolution_notes?: string }).resolution_notes ?? ''));
            addToast({ type: 'success', title: 'LOADED', body: id });
        } catch (err) {
            addToast({ type: 'error', title: 'GET FAILED', body: getApiErrorMessage(err, 'Could not load incident.') });
        }
    };

    const onUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = selectedId.trim();
        if (!id) return;
        try {
            const payload: Record<string, unknown> = {
                status: patchStatus,
                severity: patchSeverity,
                resolution_notes: resolutionNotes.trim() || null,
            };
            if (assignTo.trim()) payload.assigned_to = assignTo.trim();
            else payload.assigned_to = null;
            await incidentsApi.update(id, payload);
            addToast({ type: 'success', title: 'UPDATED', body: id });
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'UPDATE FAILED', body: getApiErrorMessage(err, 'Update failed.') });
        }
    };

    return (
        <AdminPageShell title="INCIDENTS" subtitle="Create and triage incidents via /api/v1/incidents.">
            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        QUEUE ({loading ? '…' : rows.length})
                    </span>
                    <GhostButton type="button" className="!w-auto min-h-9 px-4" onClick={() => void load()}>
                        REFRESH
                    </GhostButton>
                </div>
                <div className="max-h-56 overflow-auto border border-[var(--border-dim)] divide-y divide-[var(--border-dim)]">
                    {rows.map((r) => (
                        <button
                            key={String(r.id)}
                            type="button"
                            className={`w-full text-left px-3 py-2 font-portal-mono text-[11px] hover:bg-[var(--surface)] ${
                                String(r.id) === selectedId ? 'bg-[var(--surface-2)] text-[var(--amber)]' : 'text-[var(--fg)]'
                            }`}
                            onClick={() => setSelectedId(String(r.id))}
                        >
                            {String(r.title)} · {String((r as { status?: string }).status ?? '')}
                        </button>
                    ))}
                    {!loading && rows.length === 0 && (
                        <div className="px-3 py-6 text-center font-portal-mono text-[11px] text-[var(--dim)]">No incidents</div>
                    )}
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">CREATE</div>
                <form onSubmit={onCreate} className="grid gap-3">
                    <input
                        placeholder="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        required
                    />
                    <textarea
                        placeholder="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px] text-[var(--fg)]"
                        required
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                        <select
                            value={severity}
                            onChange={(e) => setSeverity(e.target.value as (typeof SEVERITIES)[number])}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        >
                            {SEVERITIES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <input
                            placeholder="zone_id (uuid, optional)"
                            value={zoneId}
                            onChange={(e) => setZoneId(e.target.value)}
                            className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                    </div>
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        OPEN INCIDENT
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">UPDATE</div>
                <div className="flex flex-wrap gap-2 mb-4">
                    <input
                        placeholder="incident uuid"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="flex-1 min-w-[200px] min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => void onLoadOne()}>
                        LOAD
                    </GhostButton>
                </div>
                <form onSubmit={onUpdate} className="grid sm:grid-cols-2 gap-3">
                    <label className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        status
                        <select
                            value={patchStatus}
                            onChange={(e) => setPatchStatus(e.target.value as (typeof STATUSES)[number])}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        severity
                        <select
                            value={patchSeverity}
                            onChange={(e) => setPatchSeverity(e.target.value as (typeof SEVERITIES)[number])}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        >
                            {SEVERITIES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="sm:col-span-2 font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        assigned_to (uuid)
                        <input
                            value={assignTo}
                            onChange={(e) => setAssignTo(e.target.value)}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                    </label>
                    <label className="sm:col-span-2 font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        resolution_notes
                        <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            rows={3}
                            className="mt-1 w-full bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                    </label>
                    <PrimaryButton type="submit" className="sm:col-span-2 !w-auto min-h-10 px-6">
                        SAVE PATCH
                    </PrimaryButton>
                </form>
            </PortalCard>
        </AdminPageShell>
    );
}

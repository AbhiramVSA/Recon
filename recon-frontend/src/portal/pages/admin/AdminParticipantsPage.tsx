import { useCallback, useEffect, useState } from 'react';
import { participantsApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type Row = Record<string, unknown>;

export default function AdminParticipantsPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState('');
    const [detail, setDetail] = useState<Row | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const list = await participantsApi.list({ limit: 500 });
            setRows(Array.isArray(list) ? list : []);
        } catch (err) {
            addToast({ type: 'error', title: 'LIST FAILED', body: getApiErrorMessage(err, 'Could not load participants.') });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load();
    }, [load]);

    const onFetchDetail = async () => {
        const id = selectedId.trim();
        if (!id) return;
        try {
            const d = await participantsApi.get(id);
            setDetail(d as Row);
            addToast({ type: 'success', title: 'LOADED', body: id });
        } catch (err) {
            setDetail(null);
            addToast({ type: 'error', title: 'GET FAILED', body: getApiErrorMessage(err, 'Could not load participant.') });
        }
    };

    const onCheckIn = async () => {
        const id = selectedId.trim();
        if (!id) return;
        try {
            await participantsApi.checkIn(id);
            addToast({ type: 'success', title: 'CHECK-IN', body: id });
            await load();
            await onFetchDetail();
        } catch (err) {
            addToast({ type: 'error', title: 'CHECK-IN FAILED', body: getApiErrorMessage(err, 'Check-in failed.') });
        }
    };

    return (
        <AdminPageShell
            title="PARTICIPANTS"
            subtitle="Admin directory and check-in via /api/v1/participants."
        >
            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        ALL ({loading ? '…' : rows.length})
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
                            {String((r as { display_name?: string }).display_name ?? '—')} · {String(r.id).slice(0, 8)}…
                        </button>
                    ))}
                    {!loading && rows.length === 0 && (
                        <div className="px-3 py-6 text-center font-portal-mono text-[11px] text-[var(--dim)]">No participants</div>
                    )}
                </div>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">DETAIL & CHECK-IN</div>
                <div className="flex flex-wrap gap-2 mb-4">
                    <input
                        placeholder="participant uuid"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className="flex-1 min-w-[200px] min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => void onFetchDetail()}>
                        LOAD
                    </GhostButton>
                    <PrimaryButton type="button" className="!w-auto min-h-11 px-4" onClick={() => void onCheckIn()}>
                        CHECK IN
                    </PrimaryButton>
                </div>
                {detail && (
                    <pre className="text-[10px] font-portal-mono text-[color-mix(in_srgb,var(--dim)_90%,white_5%)] overflow-auto max-h-64 p-3 border border-[var(--border-dim)] bg-[var(--bg)]">
                        {JSON.stringify(detail, null, 2)}
                    </pre>
                )}
            </PortalCard>
        </AdminPageShell>
    );
}

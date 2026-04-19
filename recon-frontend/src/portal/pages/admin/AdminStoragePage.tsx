import { useState } from 'react';
import { storageApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

const SCOPES = ['participant_private', 'partner_private', 'public', 'admin_private'] as const;

export default function AdminStoragePage() {
    const addToast = useToastStore((s) => s.addToast);
    const [file, setFile] = useState<File | null>(null);
    const [scope, setScope] = useState<(typeof SCOPES)[number]>('participant_private');
    const [busy, setBusy] = useState(false);
    const [lastKey, setLastKey] = useState('');
    const [readUrl, setReadUrl] = useState('');

    const onUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setBusy(true);
        setReadUrl('');
        try {
            const filename = file.name || 'upload.bin';
            const contentType = file.type || 'application/octet-stream';
            const presign = (await storageApi.uploadUrl(filename, contentType, scope)) as {
                upload_url?: string;
                file_key?: string;
            };
            const putUrl = presign.upload_url;
            const key = presign.file_key;
            if (!putUrl || !key) {
                addToast({ type: 'error', title: 'BAD RESPONSE', body: 'Missing upload_url or file_key' });
                return;
            }
            const put = await fetch(putUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType,
                },
            });
            if (!put.ok) {
                addToast({ type: 'error', title: 'PUT FAILED', body: `${put.status}` });
                return;
            }
            setLastKey(key);
            addToast({ type: 'success', title: 'UPLOADED', body: key });
        } catch (err) {
            addToast({ type: 'error', title: 'UPLOAD FAILED', body: getApiErrorMessage(err, 'Failed.') });
        } finally {
            setBusy(false);
        }
    };

    const onRead = async () => {
        if (!lastKey.trim()) return;
        setBusy(true);
        try {
            const res = (await storageApi.readUrl(lastKey.trim())) as { read_url?: string };
            setReadUrl(res.read_url ?? '');
            if (!res.read_url) addToast({ type: 'error', title: 'NO URL', body: 'Response missing read_url' });
        } catch (err) {
            addToast({ type: 'error', title: 'READ URL FAILED', body: getApiErrorMessage(err, 'Failed.') });
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminPageShell
            title="STORAGE"
            subtitle="Presigned PUT to R2, then read URL for the same file_key."
        >
            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">UPLOAD</div>
                <form onSubmit={onUpload} className="grid gap-4">
                    <label className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        file
                        <input
                            type="file"
                            accept="*/*"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            className="mt-2 block w-full font-portal-mono text-[11px] text-[var(--fg)]"
                        />
                    </label>
                    <label className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">
                        scope
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as (typeof SCOPES)[number])}
                            className="mt-1 w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        >
                            {SCOPES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <PrimaryButton type="submit" disabled={busy || !file}>
                        {busy ? 'WORKING…' : 'UPLOAD VIA PRESIGN'}
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">READ URL</div>
                <div className="font-portal-mono text-[10px] text-[var(--dim)] break-all mb-2">
                    file_key: {lastKey || '—'}
                </div>
                <div className="flex flex-wrap gap-2">
                    <GhostButton type="button" className="!w-auto min-h-10 px-4" disabled={busy || !lastKey} onClick={() => void onRead()}>
                        GET READ URL
                    </GhostButton>
                </div>
                {readUrl && (
                    <a
                        href={readUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-block font-portal-mono text-[11px] text-[var(--portal-blue)] break-all underline"
                    >
                        {readUrl}
                    </a>
                )}
            </PortalCard>
        </AdminPageShell>
    );
}

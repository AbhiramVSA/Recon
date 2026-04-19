import { useCallback, useEffect, useState } from 'react';
import { scheduleApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type Any = Record<string, unknown>;

const SESSION_TYPES = ['talk', 'workshop', 'ctf_round', 'ceremony', 'break', 'social'] as const;

export default function AdminSchedulePage() {
    const addToast = useToastStore((s) => s.addToast);
    const [tab, setTab] = useState<'sessions' | 'speakers'>('sessions');

    const [sessions, setSessions] = useState<Any[]>([]);
    const [speakers, setSpeakers] = useState<Any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selSession, setSelSession] = useState('');
    const [sTitle, setSTitle] = useState('');
    const [sDesc, setSDesc] = useState('');
    const [sStart, setSStart] = useState('');
    const [sEnd, setSEnd] = useState('');
    const [sType, setSType] = useState<(typeof SESSION_TYPES)[number]>('talk');
    const [sZone, setSZone] = useState('');
    const [sCap, setSCap] = useState('');
    const [sPub, setSPub] = useState(false);
    const [sTags, setSTags] = useState('');

    const [spkName, setSpkName] = useState('');
    const [spkBio, setSpkBio] = useState('');
    const [spkOrg, setSpkOrg] = useState('');
    const [spkPhoto, setSpkPhoto] = useState('');
    const [selSpeaker, setSelSpeaker] = useState('');

    const [attachSession, setAttachSession] = useState('');
    const [attachSpeaker, setAttachSpeaker] = useState('');
    const [attachOrder, setAttachOrder] = useState(0);

    const loadSessions = useCallback(async () => {
        try {
            const list = await scheduleApi.listSessions();
            setSessions(Array.isArray(list) ? list : []);
        } catch (err) {
            addToast({ type: 'error', title: 'SESSIONS', body: getApiErrorMessage(err, 'List failed.') });
        }
    }, [addToast]);

    const loadSpeakers = useCallback(async () => {
        try {
            const list = await scheduleApi.listSpeakers();
            setSpeakers(Array.isArray(list) ? list : []);
        } catch (err) {
            addToast({ type: 'error', title: 'SPEAKERS', body: getApiErrorMessage(err, 'List failed.') });
        }
    }, [addToast]);

    const refresh = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadSessions(), loadSpeakers()]);
        setLoading(false);
    }, [loadSessions, loadSpeakers]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const fillSessionFromRow = (row: Any) => {
        setSelSession(String(row.id));
        setSTitle(String(row.title ?? ''));
        setSDesc(String(row.description ?? ''));
        const a = row.starts_at ? new Date(String(row.starts_at)) : null;
        const b = row.ends_at ? new Date(String(row.ends_at)) : null;
        setSStart(a ? a.toISOString().slice(0, 16) : '');
        setSEnd(b ? b.toISOString().slice(0, 16) : '');
        setSType((String(row.session_type ?? 'talk') as (typeof SESSION_TYPES)[number]) || 'talk');
        setSZone(String(row.zone_id ?? ''));
        setSCap(row.capacity != null ? String(row.capacity) : '');
        setSPub(Boolean(row.is_published));
        const tags = row.tags;
        setSTags(Array.isArray(tags) ? tags.join(', ') : '');
    };

    const onCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Record<string, unknown> = {
                title: sTitle.trim(),
                description: sDesc.trim() || null,
                starts_at: new Date(sStart).toISOString(),
                ends_at: new Date(sEnd).toISOString(),
                session_type: sType,
                is_published: sPub,
            };
            if (sZone.trim()) payload.zone_id = sZone.trim();
            if (sCap.trim()) payload.capacity = Number(sCap);
            if (sTags.trim()) payload.tags = sTags.split(',').map((t) => t.trim()).filter(Boolean);
            await scheduleApi.createSession(payload);
            addToast({ type: 'success', title: 'SESSION CREATED', body: sTitle });
            await loadSessions();
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    const onUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selSession.trim()) return;
        try {
            const payload: Record<string, unknown> = {
                title: sTitle.trim(),
                description: sDesc.trim() || null,
                starts_at: new Date(sStart).toISOString(),
                ends_at: new Date(sEnd).toISOString(),
                session_type: sType,
                is_published: sPub,
            };
            if (sZone.trim()) payload.zone_id = sZone.trim();
            else payload.zone_id = null;
            if (sCap.trim()) payload.capacity = Number(sCap);
            else payload.capacity = null;
            if (sTags.trim()) payload.tags = sTags.split(',').map((t) => t.trim()).filter(Boolean);
            else payload.tags = [];
            await scheduleApi.updateSession(selSession.trim(), payload);
            addToast({ type: 'success', title: 'SESSION UPDATED', body: selSession });
            await loadSessions();
        } catch (err) {
            addToast({ type: 'error', title: 'UPDATE FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    const onDeleteSession = async () => {
        if (!selSession.trim()) return;
        if (!window.confirm('Delete this session?')) return;
        try {
            await scheduleApi.deleteSession(selSession.trim());
            addToast({ type: 'success', title: 'DELETED', body: selSession });
            setSelSession('');
            await loadSessions();
        } catch (err) {
            addToast({ type: 'error', title: 'DELETE FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    const onCreateSpeaker = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await scheduleApi.createSpeaker({
                name: spkName.trim(),
                bio: spkBio.trim() || null,
                org: spkOrg.trim() || null,
                photo_key: spkPhoto.trim() || null,
            });
            addToast({ type: 'success', title: 'SPEAKER CREATED', body: spkName });
            setSpkName('');
            setSpkBio('');
            setSpkOrg('');
            setSpkPhoto('');
            await loadSpeakers();
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    const onDeleteSpeaker = async () => {
        if (!selSpeaker.trim()) return;
        if (!window.confirm('Delete speaker?')) return;
        try {
            await scheduleApi.deleteSpeaker(selSpeaker.trim());
            addToast({ type: 'success', title: 'DELETED', body: selSpeaker });
            setSelSpeaker('');
            await loadSpeakers();
        } catch (err) {
            addToast({ type: 'error', title: 'DELETE FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    const onAttach = async () => {
        try {
            await scheduleApi.attachSpeaker(attachSession.trim(), attachSpeaker.trim(), attachOrder);
            addToast({ type: 'success', title: 'ATTACHED', body: `${attachSpeaker} → ${attachSession}` });
        } catch (err) {
            addToast({ type: 'error', title: 'ATTACH FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    const onDetach = async () => {
        try {
            await scheduleApi.detachSpeaker(attachSession.trim(), attachSpeaker.trim());
            addToast({ type: 'success', title: 'DETACHED', body: `${attachSpeaker}` });
        } catch (err) {
            addToast({ type: 'error', title: 'DETACH FAILED', body: getApiErrorMessage(err, 'Failed.') });
        }
    };

    return (
        <AdminPageShell
            title="SCHEDULE"
            subtitle={`Sessions & speakers. Loaded: ${loading ? '…' : `${sessions.length} sessions, ${speakers.length} speakers`}`}
        >
            <div className="flex gap-2 mb-6">
                <button
                    type="button"
                    onClick={() => setTab('sessions')}
                    className={`font-portal-mono text-[10px] tracking-[0.15em] uppercase px-4 py-2 border ${
                        tab === 'sessions'
                            ? 'border-[var(--amber)] text-[var(--amber)]'
                            : 'border-[var(--border-dim)] text-[var(--dim)]'
                    }`}
                >
                    Sessions
                </button>
                <button
                    type="button"
                    onClick={() => setTab('speakers')}
                    className={`font-portal-mono text-[10px] tracking-[0.15em] uppercase px-4 py-2 border ${
                        tab === 'speakers'
                            ? 'border-[var(--amber)] text-[var(--amber)]'
                            : 'border-[var(--border-dim)] text-[var(--dim)]'
                    }`}
                >
                    Speakers
                </button>
                <GhostButton type="button" className="!w-auto min-h-10 px-4 ml-auto" onClick={() => void refresh()}>
                    REFRESH ALL
                </GhostButton>
            </div>

            {tab === 'sessions' && (
                <>
                    <PortalCard className="p-5 mb-5">
                        <div className="max-h-40 overflow-auto border border-[var(--border-dim)] mb-4">
                            {sessions.map((row) => (
                                <button
                                    key={String(row.id)}
                                    type="button"
                                    className={`w-full text-left px-3 py-2 font-portal-mono text-[11px] hover:bg-[var(--surface)] ${
                                        String(row.id) === selSession ? 'bg-[var(--surface-2)] text-[var(--amber)]' : ''
                                    }`}
                                    onClick={() => fillSessionFromRow(row)}
                                >
                                    {String(row.title)}
                                </button>
                            ))}
                        </div>
                        <form onSubmit={onCreateSession} className="grid gap-2 border-t border-[var(--border-dim)] pt-4">
                            <div className="font-portal-mono text-[10px] text-[var(--amber)] uppercase tracking-[0.2em]">New session</div>
                            <input
                                placeholder="title"
                                value={sTitle}
                                onChange={(e) => setSTitle(e.target.value)}
                                className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                                required
                            />
                            <textarea
                                placeholder="description"
                                value={sDesc}
                                onChange={(e) => setSDesc(e.target.value)}
                                rows={2}
                                className="bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px]"
                            />
                            <div className="grid sm:grid-cols-2 gap-2">
                                <input
                                    type="datetime-local"
                                    value={sStart}
                                    onChange={(e) => setSStart(e.target.value)}
                                    className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                                    required
                                />
                                <input
                                    type="datetime-local"
                                    value={sEnd}
                                    onChange={(e) => setSEnd(e.target.value)}
                                    className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                                    required
                                />
                            </div>
                            <div className="grid sm:grid-cols-3 gap-2">
                                <select
                                    value={sType}
                                    onChange={(e) => setSType(e.target.value as (typeof SESSION_TYPES)[number])}
                                    className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                                >
                                    {SESSION_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    placeholder="zone uuid"
                                    value={sZone}
                                    onChange={(e) => setSZone(e.target.value)}
                                    className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                                />
                                <input
                                    placeholder="capacity"
                                    value={sCap}
                                    onChange={(e) => setSCap(e.target.value)}
                                    className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                                />
                            </div>
                            <label className="flex items-center gap-2 font-portal-mono text-[11px]">
                                <input type="checkbox" checked={sPub} onChange={(e) => setSPub(e.target.checked)} />
                                published
                            </label>
                            <input
                                placeholder="tags (comma-separated)"
                                value={sTags}
                                onChange={(e) => setSTags(e.target.value)}
                                className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                            />
                            <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                                CREATE SESSION
                            </PrimaryButton>
                        </form>
                        <form onSubmit={onUpdateSession} className="grid gap-2 mt-6 border-t border-[var(--border-dim)] pt-4">
                            <div className="font-portal-mono text-[10px] text-[var(--amber)] uppercase tracking-[0.2em]">
                                Update selected ({selSession ? selSession.slice(0, 8) : 'none'}…)
                            </div>
                            <PrimaryButton type="submit" className="!w-auto min-h-10 px-6" disabled={!selSession}>
                                SAVE SESSION
                            </PrimaryButton>
                            <GhostButton type="button" className="!w-auto min-h-10 px-6 border-[var(--portal-red)] text-[var(--portal-red)]" onClick={() => void onDeleteSession()}>
                                DELETE SESSION
                            </GhostButton>
                        </form>
                    </PortalCard>

                    <PortalCard className="p-5">
                        <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">
                            Link speaker to session
                        </div>
                        <div className="grid sm:grid-cols-3 gap-2">
                            <input
                                placeholder="session uuid"
                                value={attachSession}
                                onChange={(e) => setAttachSession(e.target.value)}
                                className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                            />
                            <input
                                placeholder="speaker uuid"
                                value={attachSpeaker}
                                onChange={(e) => setAttachSpeaker(e.target.value)}
                                className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                            />
                            <input
                                type="number"
                                placeholder="order"
                                value={attachOrder}
                                onChange={(e) => setAttachOrder(Number(e.target.value))}
                                className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-2 font-portal-mono text-[11px]"
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <PrimaryButton type="button" className="!w-auto min-h-10 px-4" onClick={() => void onAttach()}>
                                ATTACH
                            </PrimaryButton>
                            <GhostButton type="button" className="!w-auto min-h-10 px-4" onClick={() => void onDetach()}>
                                DETACH
                            </GhostButton>
                        </div>
                    </PortalCard>
                </>
            )}

            {tab === 'speakers' && (
                <PortalCard className="p-5">
                    <div className="max-h-40 overflow-auto border border-[var(--border-dim)] mb-4">
                        {speakers.map((row) => (
                            <button
                                key={String(row.id)}
                                type="button"
                                className={`w-full text-left px-3 py-2 font-portal-mono text-[11px] hover:bg-[var(--surface)] ${
                                    String(row.id) === selSpeaker ? 'bg-[var(--surface-2)] text-[var(--amber)]' : ''
                                }`}
                                onClick={() => setSelSpeaker(String(row.id))}
                            >
                                {String(row.name)}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={onCreateSpeaker} className="grid gap-2">
                        <input
                            placeholder="name"
                            value={spkName}
                            onChange={(e) => setSpkName(e.target.value)}
                            className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                            required
                        />
                        <textarea
                            placeholder="bio"
                            value={spkBio}
                            onChange={(e) => setSpkBio(e.target.value)}
                            rows={2}
                            className="bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-2 font-portal-mono text-[12px]"
                        />
                        <input
                            placeholder="org"
                            value={spkOrg}
                            onChange={(e) => setSpkOrg(e.target.value)}
                            className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                        />
                        <input
                            placeholder="photo_key (storage key)"
                            value={spkPhoto}
                            onChange={(e) => setSpkPhoto(e.target.value)}
                            className="min-h-10 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px]"
                        />
                        <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                            CREATE SPEAKER
                        </PrimaryButton>
                        <GhostButton
                            type="button"
                            className="!w-auto min-h-10 px-6 border-[var(--portal-red)] text-[var(--portal-red)]"
                            disabled={!selSpeaker}
                            onClick={() => void onDeleteSpeaker()}
                        >
                            DELETE SELECTED
                        </GhostButton>
                    </form>
                </PortalCard>
            )}
        </AdminPageShell>
    );
}

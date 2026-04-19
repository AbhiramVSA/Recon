import { useMemo, useState } from 'react';
import { pointsApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

function makeIdempotencyKey(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseDetailsJson(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    return JSON.parse(trimmed) as Record<string, unknown>;
}

export default function AdminPointsPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [output, setOutput] = useState('Ready.');

    const [participantId, setParticipantId] = useState('');
    const [amount, setAmount] = useState('10');
    const [reason, setReason] = useState('manual_award');
    const [note, setNote] = useState('Awarded from admin ops');
    const [awardIdempotencyKey, setAwardIdempotencyKey] = useState(() => makeIdempotencyKey('points-award'));

    const [teamId, setTeamId] = useState('');
    const [eventKey, setEventKey] = useState('treasure_hunt');
    const [roundKey, setRoundKey] = useState('main');
    const [rawScoreDelta, setRawScoreDelta] = useState('10');
    const [rawScoreTotal, setRawScoreTotal] = useState('100');
    const [rawScoreCeiling, setRawScoreCeiling] = useState('100');
    const [normalizedPointsCeiling, setNormalizedPointsCeiling] = useState('100');
    const [source, setSource] = useState('admin.portal');
    const [sourceReference, setSourceReference] = useState('');
    const [detailsJson, setDetailsJson] = useState('');
    const [teamEventIdempotencyKey, setTeamEventIdempotencyKey] = useState(() => makeIdempotencyKey('team-event'));

    const [participantPointsBudget, setParticipantPointsBudget] = useState('300');
    const [settlementNote, setSettlementNote] = useState('Settled from admin portal');
    const [settlementId, setSettlementId] = useState('');

    const transactionParams = useMemo(() => {
        const params = new URLSearchParams({ limit: '100' });
        if (participantId.trim()) params.set('participant_id', participantId.trim());
        if (reason.trim()) params.set('reason', reason.trim());
        return params;
    }, [participantId, reason]);

    const run = async (title: string, fn: () => Promise<unknown>) => {
        try {
            const result = await fn();
            setOutput(JSON.stringify(result, null, 2));
            addToast({ type: 'success', title, body: 'Request succeeded.' });
        } catch (err) {
            const body = getApiErrorMessage(err, 'Request failed.');
            setOutput(body);
            addToast({ type: 'error', title, body });
        }
    };

    return (
        <AdminPageShell
            title="POINTS OPS"
            subtitle="Participant wallet awards plus team-event scoring and settlement endpoints."
        >
            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">
                    PARTICIPANT POINTS
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <input value={participantId} onChange={(event) => setParticipantId(event.target.value)} placeholder="participant uuid" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="amount" type="number" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="reason" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="note" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={awardIdempotencyKey} onChange={(event) => setAwardIdempotencyKey(event.target.value)} placeholder="idempotency key" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] md:col-span-2" />
                </div>
                <div className="grid md:grid-cols-3 gap-2 mt-4">
                    <PrimaryButton
                        type="button"
                        className="!w-auto min-h-10 px-6"
                        onClick={() => void run('POINTS AWARD', () => pointsApi.award({
                            participant_id: participantId.trim(),
                            amount: Number(amount),
                            reason: reason.trim(),
                            note: note.trim() || null,
                            idempotency_key: awardIdempotencyKey.trim(),
                        }))}
                        disabled={!participantId.trim()}
                    >
                        AWARD POINTS
                    </PrimaryButton>
                    <GhostButton type="button" className="!w-auto min-h-10 px-6" onClick={() => void run('TRANSACTIONS', () => pointsApi.transactions(transactionParams))}>
                        TRANSACTIONS
                    </GhostButton>
                    <GhostButton type="button" className="!w-auto min-h-10 px-6" onClick={() => void run('LEADERBOARD', () => pointsApi.leaderboard())}>
                        LEADERBOARD
                    </GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">
                    TEAM EVENT SCORING
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <input value={teamId} onChange={(event) => setTeamId(event.target.value)} placeholder="team uuid" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={eventKey} onChange={(event) => setEventKey(event.target.value)} placeholder="event key" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={roundKey} onChange={(event) => setRoundKey(event.target.value)} placeholder="round key" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="source" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={rawScoreDelta} onChange={(event) => setRawScoreDelta(event.target.value)} type="number" placeholder="raw score delta" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={rawScoreTotal} onChange={(event) => setRawScoreTotal(event.target.value)} type="number" placeholder="raw score total" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={rawScoreCeiling} onChange={(event) => setRawScoreCeiling(event.target.value)} type="number" placeholder="raw score ceiling" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={normalizedPointsCeiling} onChange={(event) => setNormalizedPointsCeiling(event.target.value)} type="number" placeholder="normalized ceiling" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} placeholder="source reference" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] md:col-span-2" />
                    <textarea value={detailsJson} onChange={(event) => setDetailsJson(event.target.value)} placeholder='details json (optional)' className="min-h-24 bg-[var(--bg)] border border-[var(--border-dim)] px-3 py-3 font-portal-mono text-[12px] text-[var(--fg)] md:col-span-2" />
                    <input value={teamEventIdempotencyKey} onChange={(event) => setTeamEventIdempotencyKey(event.target.value)} placeholder="idempotency key" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] md:col-span-2" />
                </div>
                <div className="grid md:grid-cols-4 gap-2 mt-4">
                    <PrimaryButton
                        type="button"
                        className="!w-auto min-h-10 px-6"
                        disabled={!teamId.trim()}
                        onClick={() => void run('TEAM AWARD DELTA', () => pointsApi.teamAwardDelta({
                            team_id: teamId.trim(),
                            event_key: eventKey.trim(),
                            round_key: roundKey.trim(),
                            raw_score_delta: Number(rawScoreDelta),
                            raw_score_ceiling: Number(rawScoreCeiling),
                            normalized_points_ceiling: Number(normalizedPointsCeiling),
                            source: source.trim(),
                            source_reference: sourceReference.trim() || null,
                            idempotency_key: teamEventIdempotencyKey.trim(),
                            note: note.trim() || null,
                            details_json: parseDetailsJson(detailsJson),
                        }))}
                    >
                        AWARD DELTA
                    </PrimaryButton>
                    <GhostButton
                        type="button"
                        className="!w-auto min-h-10 px-6"
                        disabled={!teamId.trim()}
                        onClick={() => void run('INGEST SNAPSHOT', () => pointsApi.teamIngestSnapshot({
                            team_id: teamId.trim(),
                            event_key: eventKey.trim(),
                            round_key: roundKey.trim(),
                            raw_score_total: Number(rawScoreTotal),
                            raw_score_ceiling: Number(rawScoreCeiling),
                            normalized_points_ceiling: Number(normalizedPointsCeiling),
                            source: source.trim(),
                            source_reference: sourceReference.trim() || null,
                            idempotency_key: teamEventIdempotencyKey.trim(),
                            note: note.trim() || null,
                            details_json: parseDetailsJson(detailsJson),
                        }))}
                    >
                        INGEST SNAPSHOT
                    </GhostButton>
                    <GhostButton type="button" className="!w-auto min-h-10 px-6" onClick={() => void run('TEAM RULES', () => pointsApi.teamRules())}>
                        RULES
                    </GhostButton>
                    <GhostButton type="button" className="!w-auto min-h-10 px-6" onClick={() => void run('TEAM LEADERBOARD', () => pointsApi.teamLeaderboard(eventKey.trim() || undefined))}>
                        TEAM LEADERBOARD
                    </GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">
                    TEAM EVENT SETTLEMENTS
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <input value={participantPointsBudget} onChange={(event) => setParticipantPointsBudget(event.target.value)} type="number" min={0} placeholder="participant points budget" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={settlementNote} onChange={(event) => setSettlementNote(event.target.value)} placeholder="settlement note" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]" />
                    <input value={settlementId} onChange={(event) => setSettlementId(event.target.value)} placeholder="settlement uuid" className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] md:col-span-2" />
                </div>
                <div className="grid md:grid-cols-4 gap-2 mt-4">
                    <PrimaryButton
                        type="button"
                        className="!w-auto min-h-10 px-6"
                        disabled={!teamId.trim()}
                        onClick={() => void run('SETTLEMENT PREVIEW', () => pointsApi.previewSettlement({
                            team_id: teamId.trim(),
                            event_key: eventKey.trim(),
                            round_key: roundKey.trim(),
                            participant_points_budget: Number(participantPointsBudget),
                            note: settlementNote.trim() || null,
                        }))}
                    >
                        PREVIEW
                    </PrimaryButton>
                    <GhostButton
                        type="button"
                        className="!w-auto min-h-10 px-6"
                        disabled={!teamId.trim()}
                        onClick={() => void run('SETTLEMENT FINALIZE', () => pointsApi.finalizeSettlement({
                            team_id: teamId.trim(),
                            event_key: eventKey.trim(),
                            round_key: roundKey.trim(),
                            participant_points_budget: Number(participantPointsBudget),
                            idempotency_key: makeIdempotencyKey('settlement'),
                            note: settlementNote.trim() || null,
                        }))}
                    >
                        FINALIZE
                    </GhostButton>
                    <GhostButton type="button" className="!w-auto min-h-10 px-6" onClick={() => void run('SETTLEMENTS LIST', () => pointsApi.listSettlements({
                        teamId: teamId.trim() || undefined,
                        eventKey: eventKey.trim() || undefined,
                    }))}>
                        LIST
                    </GhostButton>
                    <GhostButton type="button" className="!w-auto min-h-10 px-6" disabled={!settlementId.trim()} onClick={() => void run('SETTLEMENT GET', () => pointsApi.getSettlement(settlementId.trim()))}>
                        GET
                    </GhostButton>
                </div>
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-3">
                    API OUTPUT
                </div>
                <pre className="text-[10px] font-portal-mono text-[color-mix(in_srgb,var(--dim)_90%,white_5%)] overflow-auto max-h-96 p-3 border border-[var(--border-dim)] bg-[var(--bg)]">
                    {output}
                </pre>
                <GhostButton type="button" className="!w-auto min-h-10 px-6 mt-3" onClick={() => setOutput('Ready.')}>
                    CLEAR OUTPUT
                </GhostButton>
            </PortalCard>
        </AdminPageShell>
    );
}

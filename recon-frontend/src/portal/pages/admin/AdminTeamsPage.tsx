import { useCallback, useEffect, useMemo, useState } from 'react';
import { participantsApi, teamsApi } from '../../../api/backend';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { GhostButton, PortalCard, PrimaryButton, StatusPill } from '../../components/primitives';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import { useToastStore } from '../../stores/toastStore';

type TeamMember = {
    participant_id: string;
    display_name: string;
    joined_at: string;
};

type TeamRow = {
    id: string;
    name: string;
    invite_code: string;
    created_by_participant_id?: string | null;
    members: TeamMember[];
};

type TeamListResponse = {
    teams?: TeamRow[];
};

type ParticipantRow = {
    id: string;
    display_name?: string;
    institution?: string;
};

function displayParticipant(participant: ParticipantRow | undefined) {
    if (!participant) return 'Participant';
    return participant.display_name?.trim() || participant.id;
}

export default function AdminTeamsPage() {
    const addToast = useToastStore((s) => s.addToast);
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [participants, setParticipants] = useState<ParticipantRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [teamSearch, setTeamSearch] = useState('');
    const [participantSearch, setParticipantSearch] = useState('');

    const [teamName, setTeamName] = useState('');
    const [teamInviteCode, setTeamInviteCode] = useState('');
    const [regenerateInviteCode, setRegenerateInviteCode] = useState(false);
    const [editCreatedByParticipantId, setEditCreatedByParticipantId] = useState('');

    const [newTeamName, setNewTeamName] = useState('');
    const [createCreatedByParticipantId, setCreateCreatedByParticipantId] = useState('');
    const [newMemberIds, setNewMemberIds] = useState('');

    const [assignParticipantId, setAssignParticipantId] = useState('');
    const [assignTargetTeamId, setAssignTargetTeamId] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [teamList, participantList] = await Promise.all([
                teamsApi.listAdmin(),
                participantsApi.list({ limit: 500 }),
            ]);
            const rows = Array.isArray((teamList as TeamListResponse).teams)
                ? (teamList as TeamListResponse).teams ?? []
                : [];
            setTeams(rows);
            setParticipants(Array.isArray(participantList) ? participantList as ParticipantRow[] : []);
        } catch (err) {
            addToast({ type: 'error', title: 'LOAD FAILED', body: getApiErrorMessage(err, 'Could not load team operations.') });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void load();
    }, [load]);

    const loadTeamDetail = useCallback(async (teamId: string) => {
        if (!teamId.trim()) return;
        try {
            const detail = await teamsApi.getAdmin(teamId.trim()) as TeamRow;
            setSelectedTeamId(detail.id);
            setTeamName(detail.name);
            setTeamInviteCode(detail.invite_code);
            setEditCreatedByParticipantId(detail.created_by_participant_id ?? '');
            setRegenerateInviteCode(false);
            setTeams((current) => {
                const hasExisting = current.some((team) => team.id === detail.id);
                const next = hasExisting
                    ? current.map((team) => (team.id === detail.id ? detail : team))
                    : [detail, ...current];
                return next;
            });
        } catch (err) {
            addToast({ type: 'error', title: 'TEAM LOAD FAILED', body: getApiErrorMessage(err, 'Could not load team detail.') });
        }
    }, [addToast]);

    const selectedTeam = useMemo(
        () => teams.find((team) => team.id === selectedTeamId) ?? null,
        [selectedTeamId, teams],
    );

    useEffect(() => {
        if (!selectedTeam) {
            setTeamName('');
            setTeamInviteCode('');
            setEditCreatedByParticipantId('');
            setRegenerateInviteCode(false);
            return;
        }
        setTeamName(selectedTeam.name);
        setTeamInviteCode(selectedTeam.invite_code);
        setEditCreatedByParticipantId(selectedTeam.created_by_participant_id ?? '');
        setRegenerateInviteCode(false);
    }, [selectedTeam]);

    const filteredTeams = useMemo(() => {
        const query = teamSearch.trim().toLowerCase();
        if (!query) return teams;
        return teams.filter((team) =>
            [team.name, team.invite_code, team.id].some((value) => value.toLowerCase().includes(query)),
        );
    }, [teamSearch, teams]);

    const participantTeamLookup = useMemo(() => {
        const lookup = new Map<string, { teamId: string; teamName: string }>();
        teams.forEach((team) => {
            team.members.forEach((member) => {
                lookup.set(member.participant_id, { teamId: team.id, teamName: team.name });
            });
        });
        return lookup;
    }, [teams]);

    const filteredParticipants = useMemo(() => {
        const query = participantSearch.trim().toLowerCase();
        if (!query) return participants;
        return participants.filter((participant) =>
            [participant.id, participant.display_name ?? '', participant.institution ?? '']
                .some((value) => value.toLowerCase().includes(query)),
        );
    }, [participantSearch, participants]);

    const parseMemberIds = (value: string) =>
        value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await teamsApi.createAdmin({
                name: newTeamName.trim(),
                member_participant_ids: parseMemberIds(newMemberIds),
                created_by_participant_id: createCreatedByParticipantId.trim() || null,
            }) as TeamRow;
            addToast({ type: 'success', title: 'TEAM CREATED', body: created.name });
            setNewTeamName('');
            setNewMemberIds('');
            setCreateCreatedByParticipantId('');
            await load();
            await loadTeamDetail(created.id);
        } catch (err) {
            addToast({ type: 'error', title: 'CREATE FAILED', body: getApiErrorMessage(err, 'Could not create team.') });
        }
    };

    const onUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeamId.trim()) return;
        try {
            const updated = await teamsApi.updateAdmin(selectedTeamId, {
                name: teamName.trim(),
                invite_code: teamInviteCode.trim() || null,
                regenerate_invite_code: regenerateInviteCode,
                created_by_participant_id: editCreatedByParticipantId.trim() || null,
            }) as TeamRow;
            addToast({ type: 'success', title: 'TEAM UPDATED', body: updated.name });
            await load();
            await loadTeamDetail(updated.id);
        } catch (err) {
            addToast({ type: 'error', title: 'UPDATE FAILED', body: getApiErrorMessage(err, 'Could not update team.') });
        }
    };

    const onDelete = async () => {
        if (!selectedTeamId.trim() || !selectedTeam) return;
        if (!window.confirm(`Delete team ${selectedTeam.name}?`)) return;
        try {
            await teamsApi.deleteAdmin(selectedTeamId);
            addToast({ type: 'success', title: 'TEAM DELETED', body: selectedTeam.name });
            setSelectedTeamId('');
            await load();
        } catch (err) {
            addToast({ type: 'error', title: 'DELETE FAILED', body: getApiErrorMessage(err, 'Could not delete team.') });
        }
    };

    const onAssign = async (participantId: string, targetTeamId: string | null) => {
        if (!participantId.trim()) return;
        try {
            const assignment = await teamsApi.assignParticipant(participantId.trim(), {
                target_team_id: targetTeamId,
            }) as { participant_id: string; team_name?: string | null };
            addToast({
                type: 'success',
                title: targetTeamId ? 'PARTICIPANT ASSIGNED' : 'PARTICIPANT REMOVED',
                body: assignment.team_name ?? participantId,
            });
            setAssignParticipantId('');
            setAssignTargetTeamId('');
            await load();
            if (selectedTeamId) {
                await loadTeamDetail(selectedTeamId);
            }
        } catch (err) {
            addToast({ type: 'error', title: 'ASSIGNMENT FAILED', body: getApiErrorMessage(err, 'Could not move participant.') });
        }
    };

    return (
        <AdminPageShell
            title="TEAMS"
            subtitle="Full admin control over every team: create, inspect, edit invite codes, change ownership, move members, and delete."
        >
            <PortalCard className="p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <span className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        TEAM DIRECTORY ({loading ? '…' : `${filteredTeams.length}/${teams.length}`})
                    </span>
                    <GhostButton type="button" className="!w-auto min-h-9 px-4" onClick={() => void load()}>
                        REFRESH
                    </GhostButton>
                </div>
                <input
                    placeholder="search team name / invite code / id"
                    value={teamSearch}
                    onChange={(event) => setTeamSearch(event.target.value)}
                    className="min-h-11 w-full bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] mb-4"
                />
                <div className="grid gap-3 lg:grid-cols-2">
                    {filteredTeams.map((team) => (
                        <button
                            key={team.id}
                            type="button"
                            className={`text-left border px-4 py-4 transition-colors ${
                                team.id === selectedTeamId
                                    ? 'border-[var(--amber)] bg-[var(--surface-2)]'
                                    : 'border-[var(--border-dim)] hover:border-[var(--amber)]'
                            }`}
                            onClick={() => void loadTeamDetail(team.id)}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-portal-display text-[20px] text-[var(--fg)]">{team.name}</div>
                                <StatusPill label={`${team.members.length} members`} tone="blue" />
                            </div>
                            <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-2">
                                invite {team.invite_code} · {team.id.slice(0, 8)}…
                            </div>
                            <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-2">
                                {team.members.map((member) => member.display_name).join(' · ') || 'No roster yet'}
                            </div>
                        </button>
                    ))}
                    {!loading && filteredTeams.length === 0 && (
                        <div className="border border-[var(--border-dim)] px-3 py-6 text-center font-portal-mono text-[11px] text-[var(--dim)]">
                            No teams match the current filter.
                        </div>
                    )}
                </div>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">CREATE TEAM</div>
                <form onSubmit={onCreate} className="grid gap-3">
                    <input
                        placeholder="team name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        required
                    />
                    <select
                        value={createCreatedByParticipantId}
                        onChange={(event) => setCreateCreatedByParticipantId(event.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    >
                        <option value="">no creator override</option>
                        {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                                {displayParticipant(participant)} · {participant.id.slice(0, 8)}…
                            </option>
                        ))}
                    </select>
                    <input
                        placeholder="initial member participant ids (comma-separated, optional)"
                        value={newMemberIds}
                        onChange={(e) => setNewMemberIds(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    />
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        CREATE TEAM
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="p-5 mb-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">EDIT TEAM</div>
                <form onSubmit={onUpdate} className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                        <input
                            placeholder="team uuid"
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="flex-1 min-w-[200px] min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        />
                        <GhostButton type="button" className="!w-auto min-h-11 px-4" onClick={() => void loadTeamDetail(selectedTeamId)}>
                            LOAD
                        </GhostButton>
                    </div>
                    <input
                        placeholder="team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        disabled={!selectedTeam}
                    />
                    <input
                        placeholder="invite code"
                        value={teamInviteCode}
                        onChange={(e) => setTeamInviteCode(e.target.value.toUpperCase())}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] uppercase"
                        disabled={!selectedTeam}
                    />
                    <select
                        value={editCreatedByParticipantId}
                        onChange={(event) => setEditCreatedByParticipantId(event.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        disabled={!selectedTeam}
                    >
                        <option value="">no creator override</option>
                        {participants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                                {displayParticipant(participant)} · {participant.id.slice(0, 8)}…
                            </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 font-portal-mono text-[11px] text-[var(--fg)]">
                        <input
                            type="checkbox"
                            checked={regenerateInviteCode}
                            onChange={(e) => setRegenerateInviteCode(e.target.checked)}
                            disabled={!selectedTeam}
                        />
                        regenerate invite code
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="submit" className="!w-auto min-h-10 px-6" disabled={!selectedTeam}>
                            SAVE TEAM
                        </PrimaryButton>
                        <GhostButton
                            type="button"
                            className="!w-auto min-h-10 px-6 border-[var(--portal-red)] text-[var(--portal-red)]"
                            disabled={!selectedTeam}
                            onClick={() => void onDelete()}
                        >
                            DELETE TEAM
                        </GhostButton>
                    </div>
                </form>
                {selectedTeam && (
                    <div className="mt-5 border-t border-[var(--border-dim)] pt-5">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="font-portal-mono text-[9px] uppercase text-[var(--dim)]">Roster</div>
                            <StatusPill label={selectedTeam.invite_code} tone="amber" />
                        </div>
                        <div className="grid gap-2">
                            {selectedTeam.members.map((member) => (
                                <div key={member.participant_id} className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border-dim)] bg-[var(--bg)] px-3 py-3">
                                    <div>
                                        <div className="font-portal-mono text-[11px] text-[var(--fg)]">{member.display_name}</div>
                                        <div className="font-portal-mono text-[10px] text-[var(--dim)]">{member.participant_id}</div>
                                    </div>
                                    <GhostButton
                                        type="button"
                                        className="!w-auto min-h-9 px-4 border-[var(--portal-red)] text-[var(--portal-red)]"
                                        onClick={() => void onAssign(member.participant_id, null)}
                                    >
                                        REMOVE
                                    </GhostButton>
                                </div>
                            ))}
                            {selectedTeam.members.length === 0 && (
                                <div className="font-portal-mono text-[11px] text-[var(--dim)]">No members in this team.</div>
                            )}
                        </div>
                    </div>
                )}
            </PortalCard>

            <PortalCard className="p-5">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">MOVE PARTICIPANTS</div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void onAssign(assignParticipantId, assignTargetTeamId.trim() || null);
                    }}
                    className="grid gap-3 mb-5"
                >
                    <input
                        placeholder="participant uuid"
                        value={assignParticipantId}
                        onChange={(e) => setAssignParticipantId(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                        required
                    />
                    <select
                        value={assignTargetTeamId}
                        onChange={(e) => setAssignTargetTeamId(e.target.value)}
                        className="min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)]"
                    >
                        <option value="">remove from team</option>
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                    <PrimaryButton type="submit" className="!w-auto min-h-10 px-6">
                        APPLY ASSIGNMENT
                    </PrimaryButton>
                </form>

                <input
                    placeholder="search participant name / institution / id"
                    value={participantSearch}
                    onChange={(event) => setParticipantSearch(event.target.value)}
                    className="min-h-11 w-full bg-[var(--bg)] border border-[var(--border-dim)] px-3 font-portal-mono text-[12px] text-[var(--fg)] mb-4"
                />
                <div className="max-h-72 overflow-auto space-y-2">
                    {filteredParticipants.map((participant) => {
                        const assignment = participantTeamLookup.get(participant.id);
                        return (
                            <button
                                key={participant.id}
                                type="button"
                                className="w-full text-left border border-[var(--border-dim)] px-3 py-3 hover:border-[var(--amber)]"
                                onClick={() => setAssignParticipantId(participant.id)}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-portal-mono text-[11px] text-[var(--fg)]">
                                        {displayParticipant(participant)}
                                    </div>
                                    <StatusPill label={assignment?.teamName ?? 'unassigned'} tone={assignment ? 'blue' : 'red'} />
                                </div>
                                <div className="font-portal-mono text-[10px] text-[var(--dim)] mt-1">
                                    {participant.institution ?? '—'} · {participant.id}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </PortalCard>
        </AdminPageShell>
    );
}

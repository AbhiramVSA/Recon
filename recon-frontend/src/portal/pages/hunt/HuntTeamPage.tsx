import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeam, joinTeam } from '../../api/teams';
import { ApiError } from '../../api/client';
import { getApiErrorMessage } from '../../lib/apiErrorMessage';
import PortalPage from '../../components/PortalPage';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel } from '../../components/primitives';
import { useTeamStore } from '../../stores/teamStore';
import { useToastStore } from '../../stores/toastStore';

export default function HuntTeamPage() {
    const navigate = useNavigate();
    const team = useTeamStore((s) => s.team);
    const loadMyTeam = useTeamStore((s) => s.loadMyTeam);
    const setTeam = useTeamStore((s) => s.setTeam);
    const teamLoadStatus = useTeamStore((s) => s.teamLoadStatus);
    const teamError = useTeamStore((s) => s.teamError);
    const addToast = useToastStore((s) => s.addToast);

    const [createName, setCreateName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [createLoading, setCreateLoading] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);

    useEffect(() => {
        void loadMyTeam();
    }, [loadMyTeam]);

    const createValid = useMemo(() => {
        const t = createName.trim();
        return t.length >= 3 && t.length <= 80;
    }, [createName]);

    const joinValid = useMemo(() => joinCode.trim().length >= 4, [joinCode]);

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createValid || createLoading) return;
        setCreateLoading(true);
        try {
            const t = await createTeam({ name: createName.trim() });
            setTeam(t);
            setCreateName('');
            addToast({ type: 'success', title: 'TEAM CREATED', body: t.name });
            navigate('/hunt');
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                navigate('/login', { state: { from: '/hunt/team' } });
                return;
            }
            addToast({
                type: 'error',
                title: 'CREATE FAILED',
                body:
                    err instanceof ApiError && err.status >= 500
                        ? 'Server error. Please try again in a moment.'
                        : getApiErrorMessage(err, 'Could not create team.'),
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const onJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinValid || joinLoading) return;
        setJoinLoading(true);
        try {
            const t = await joinTeam({ invite_code: joinCode.trim().toUpperCase() });
            setTeam(t);
            setJoinCode('');
            addToast({ type: 'success', title: 'JOINED TEAM', body: t.name });
            navigate('/hunt');
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                navigate('/login', { state: { from: '/hunt/team' } });
                return;
            }
            addToast({
                type: 'error',
                title: 'JOIN FAILED',
                body:
                    err instanceof ApiError && err.status >= 500
                        ? 'Server error. Please try again in a moment.'
                        : getApiErrorMessage(err, 'Could not join team.'),
            });
        } finally {
            setJoinLoading(false);
        }
    };

    const copyInvite = async () => {
        if (!team) return;
        try {
            await navigator.clipboard.writeText(team.invite_code);
            addToast({ type: 'success', title: 'COPIED', body: 'Invite code copied to clipboard.' });
        } catch {
            addToast({ type: 'error', title: 'COPY FAILED', body: 'Could not copy invite code.' });
        }
    };

    if (teamLoadStatus === 'loading' || teamLoadStatus === 'idle') {
        return (
            <div className="min-h-[50dvh] flex items-center justify-center px-6">
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_60%,black_18%)]">
                    Loading team…
                </div>
            </div>
        );
    }

    if (teamLoadStatus === 'error') {
        return (
            <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
                <div data-portal-header>
                    <SectionLabel>-- TEAM --</SectionLabel>
                    <div className="font-portal-display text-[clamp(26px,5vw,36px)] leading-none text-[var(--fg)] mt-2">
                        Could not load team
                    </div>
                </div>
                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <p className="font-portal-body text-[13px] text-[color-mix(in_srgb,var(--dim)_88%,white_8%)]">{teamError}</p>
                    <GhostButton type="button" className="mt-4" onClick={() => void loadMyTeam()}>
                        Retry
                    </GhostButton>
                </PortalCard>
            </PortalPage>
        );
    }

    if (team) {
        return (
            <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
                <div data-portal-header>
                    <SectionLabel>-- YOUR TEAM --</SectionLabel>
                    <div className="font-portal-display text-[clamp(30px,6vw,44px)] leading-none text-[var(--fg)] mt-2">
                        {team.name}
                    </div>
                    <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                        Share the invite code so teammates can join before the hunt.
                    </p>
                </div>

                <PortalCard className="mt-6 p-5 sm:p-6" attr>
                    <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                        Invite code
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="font-portal-mono text-[22px] sm:text-[26px] tracking-[0.12em] text-[var(--amber)]">
                            {team.invite_code}
                        </span>
                        <button
                            type="button"
                            onClick={() => void copyInvite()}
                            className="min-h-9 px-3 border border-[var(--border-dim)] font-portal-mono text-[10px] tracking-[0.15em] uppercase text-[var(--fg)] hover:border-[var(--amber)]"
                        >
                            Copy
                        </button>
                    </div>
                </PortalCard>

                <PortalCard className="mt-4 p-5 sm:p-6" attr>
                    <div className="font-portal-mono text-[10px] tracking-[0.18em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)]">
                        Roster
                    </div>
                    <ul className="mt-3 space-y-2">
                        {team.members.map((m) => (
                            <li
                                key={m.participant_id}
                                className="font-portal-mono text-[13px] text-[var(--fg)] flex justify-between gap-3"
                            >
                                <span>{m.display_name}</span>
                            </li>
                        ))}
                    </ul>
                </PortalCard>

                <PrimaryButton type="button" className="mt-6" onClick={() => navigate('/hunt')}>
                    Go to Hunt
                </PrimaryButton>
            </PortalPage>
        );
    }

    return (
        <PortalPage className="pt-20 pb-28 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- TEAM SETUP --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,6vw,44px)] leading-none text-[var(--fg)] mt-2">
                    CREATE OR <span className="text-[var(--amber)]">JOIN</span>
                </div>
                <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                    Create a team or join one before scanning any hunt QR.
                </p>
            </div>

            <PortalCard className="mt-6 p-5 sm:p-6" attr>
                <SectionLabel className="mb-4">-- CREATE TEAM --</SectionLabel>
                <form onSubmit={onCreate} className="grid gap-4">
                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            Team name
                        </label>
                        <input
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            placeholder="Zero Cool"
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            autoComplete="off"
                        />
                        <p className="mt-1.5 font-portal-mono text-[10px] text-[color-mix(in_srgb,var(--dim)_70%,white_6%)]">
                            3–80 characters
                        </p>
                    </div>
                    <PrimaryButton type="submit" disabled={!createValid || createLoading}>
                        {createLoading ? 'CREATING…' : 'CREATE TEAM'}
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="mt-4 p-5 sm:p-6" attr>
                <SectionLabel className="mb-4">-- JOIN TEAM --</SectionLabel>
                <form onSubmit={onJoin} className="grid gap-4">
                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            Invite code
                        </label>
                        <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="AB12CD"
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)] uppercase tracking-widest"
                            autoComplete="off"
                        />
                    </div>
                    <GhostButton type="submit" disabled={!joinValid || joinLoading}>
                        {joinLoading ? 'JOINING…' : 'JOIN TEAM'}
                    </GhostButton>
                </form>
            </PortalCard>
        </PortalPage>
    );
}

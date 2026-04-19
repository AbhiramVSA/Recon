import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalPage from '../components/PortalPage';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel } from '../components/primitives';
import { authApi } from '../../api/backend';
import { updateMyParticipantProfile, updateMyTalentVisibility } from '../api/participants';
import { getParticipantYearError, isValidParticipantYear, PARTICIPANT_YEAR_MAX, PARTICIPANT_YEAR_MIN } from '../lib/participantProfile';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import { getApiErrorMessage } from '../lib/apiErrorMessage';

export default function SettingsPage() {
    const navigate = useNavigate();
    const sessionStatus = useAuthStore((s) => s.sessionStatus);
    const profileStatus = useAuthStore((s) => s.profileStatus);
    const participantProfile = useAuthStore((s) => s.participantProfile);
    const bootstrapSession = useAuthStore((s) => s.bootstrapSession);
    const addToast = useToastStore((s) => s.addToast);

    const [displayName, setDisplayName] = useState('');
    const [institution, setInstitution] = useState('');
    const [year, setYear] = useState(1);
    const [linkedin, setLinkedin] = useState('');
    const [github, setGithub] = useState('');
    const [x, setX] = useState('');
    const [phone, setPhone] = useState('');
    const [talentVisible, setTalentVisible] = useState(false);
    const [talentShareable, setTalentShareable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const yearError = getParticipantYearError(year);

    useEffect(() => {
        if (sessionStatus === 'authenticated' && profileStatus === 'missing') {
            navigate('/profile/setup', { replace: true });
        }
    }, [sessionStatus, profileStatus, navigate]);

    useEffect(() => {
        if (!participantProfile) return;
        setDisplayName(participantProfile.display_name);
        setInstitution(participantProfile.institution);
        setYear(participantProfile.year);
        setLinkedin(participantProfile.linkedin_acc ?? '');
        setGithub(participantProfile.github_acc ?? '');
        setX(participantProfile.x_acc ?? '');
        setPhone(participantProfile.phone ?? '');
        setTalentVisible(participantProfile.talent_visible);
        setTalentShareable(participantProfile.talent_contact_shareable);
    }, [participantProfile]);

    const dirty = useMemo(() => {
        if (!participantProfile) return false;
        return (
            displayName.trim() !== participantProfile.display_name
            || institution.trim() !== participantProfile.institution
            || year !== participantProfile.year
            || (linkedin.trim() || null) !== (participantProfile.linkedin_acc ?? null)
            || (github.trim() || null) !== (participantProfile.github_acc ?? null)
            || (x.trim() || null) !== (participantProfile.x_acc ?? null)
            || (phone.trim() || null) !== (participantProfile.phone ?? null)
        );
    }, [
        participantProfile,
        displayName,
        institution,
        year,
        linkedin,
        github,
        x,
        phone,
    ]);

    const talentDirty = useMemo(() => {
        if (!participantProfile) return false;
        return (
            talentVisible !== participantProfile.talent_visible
            || talentShareable !== participantProfile.talent_contact_shareable
        );
    }, [participantProfile, talentVisible, talentShareable]);

    const onSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!participantProfile || loading) return;
        if (!isValidParticipantYear(year)) {
            addToast({
                type: 'error',
                title: 'INVALID YEAR',
                body: yearError ?? 'Year must be between 1 and 5.',
            });
            return;
        }
        setLoading(true);
        try {
            await updateMyParticipantProfile({
                display_name: displayName.trim(),
                institution: institution.trim(),
                year,
                linkedin_acc: linkedin.trim() || null,
                github_acc: github.trim() || null,
                x_acc: x.trim() || null,
                phone: phone.trim() || null,
            });
            await bootstrapSession();
            addToast({ type: 'success', title: 'PROFILE SAVED', body: 'Your participant record is updated.' });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'UPDATE FAILED',
                body: getApiErrorMessage(err, 'Unable to update profile.'),
            });
        } finally {
            setLoading(false);
        }
    };

    const onSaveTalent = async () => {
        if (!participantProfile || loading) return;
        setLoading(true);
        try {
            await updateMyTalentVisibility({
                talent_visible: talentVisible,
                talent_contact_shareable: talentShareable,
            });
            await bootstrapSession();
            addToast({ type: 'success', title: 'VISIBILITY UPDATED', body: 'Talent visibility settings saved.' });
        } catch (err) {
            addToast({
                type: 'error',
                title: 'UPDATE FAILED',
                body: getApiErrorMessage(err, 'Unable to update visibility.'),
            });
        } finally {
            setLoading(false);
        }
    };

    const onRefreshSession = async () => {
        setRefreshing(true);
        try {
            await authApi.refresh();
            await bootstrapSession();
            addToast({ type: 'success', title: 'SESSION REFRESHED', body: 'Cookie session refreshed with the server.' });
        } catch (err) {
            const status = typeof err === 'object' && err && 'status' in err ? (err as { status?: unknown }).status : undefined;
            const msg = status === 401 ? 'Not authenticated.' : getApiErrorMessage(err, 'Refresh failed.');
            addToast({ type: 'error', title: 'REFRESH FAILED', body: msg });
        } finally {
            setRefreshing(false);
        }
    };

    if (profileStatus === 'missing' || sessionStatus !== 'authenticated') {
        return null;
    }

    if (!participantProfile) {
        return (
            <PortalPage className="pt-24 pb-24 px-4 max-w-xl mx-auto">
                <div className="portal-card p-6 text-center font-portal-mono text-[12px] text-[var(--dim)]">
                    Loading profile…
                </div>
            </PortalPage>
        );
    }

    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- ACCOUNT --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,6vw,44px)] leading-none text-[var(--fg)] mt-2">
                    SETTINGS
                </div>
                <p className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                    Update your participant profile, talent visibility, and session refresh.
                </p>
            </div>

            <PortalCard className="mt-6 p-5 sm:p-6" attr>
                <form onSubmit={onSaveProfile} className="grid gap-4">
                    <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)]">
                        PROFILE
                    </div>
                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            DISPLAY NAME
                        </label>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                        />
                    </div>
                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            INSTITUTION
                        </label>
                        <input
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                        />
                    </div>
                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            YEAR
                        </label>
                        <input
                            type="number"
                            min={PARTICIPANT_YEAR_MIN}
                            max={PARTICIPANT_YEAR_MAX}
                            value={year}
                            onChange={(e) => setYear(e.target.value === '' ? Number.NaN : Number(e.target.value))}
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                        />
                        <p className={`mt-1.5 font-portal-mono text-[10px] ${yearError ? 'text-[var(--portal-red)]' : 'text-[color-mix(in_srgb,var(--dim)_70%,white_6%)]'}`}>
                            {yearError ?? `Use a year between ${PARTICIPANT_YEAR_MIN} and ${PARTICIPANT_YEAR_MAX}.`}
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                                LINKEDIN
                            </label>
                            <input
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                                placeholder="URL or handle"
                                className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            />
                        </div>
                        <div>
                            <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                                GITHUB
                            </label>
                            <input
                                value={github}
                                onChange={(e) => setGithub(e.target.value)}
                                className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            />
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                                X (TWITTER)
                            </label>
                            <input
                                value={x}
                                onChange={(e) => setX(e.target.value)}
                                className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            />
                        </div>
                        <div>
                            <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                                PHONE
                            </label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            />
                        </div>
                    </div>
                    <PrimaryButton type="submit" disabled={loading || !dirty || !isValidParticipantYear(year)}>
                        {loading ? 'SAVING…' : 'SAVE PROFILE'}
                    </PrimaryButton>
                </form>
            </PortalCard>

            <PortalCard className="mt-5 p-5 sm:p-6" attr>
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-4">
                    TALENT VISIBILITY
                </div>
                <label className="flex items-center gap-3 font-portal-mono text-[12px] text-[var(--fg)] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={talentVisible}
                        onChange={(e) => setTalentVisible(e.target.checked)}
                        className="size-4 accent-[var(--amber)]"
                    />
                    Show on talent directory
                </label>
                <label className="flex items-center gap-3 font-portal-mono text-[12px] text-[var(--fg)] cursor-pointer mt-3">
                    <input
                        type="checkbox"
                        checked={talentShareable}
                        onChange={(e) => setTalentShareable(e.target.checked)}
                        className="size-4 accent-[var(--amber)]"
                    />
                    Allow contact sharing for recruiters
                </label>
                <PrimaryButton
                    type="button"
                    className="mt-5"
                    disabled={loading || !talentDirty}
                    onClick={() => void onSaveTalent()}
                >
                    {loading ? 'SAVING…' : 'SAVE VISIBILITY'}
                </PrimaryButton>
            </PortalCard>

            <PortalCard className="mt-5 p-5 sm:p-6" attr>
                <div className="font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[var(--amber)] mb-2">
                    SESSION
                </div>
                <p className="font-portal-body text-[12px] text-[color-mix(in_srgb,var(--dim)_78%,white_6%)] mb-4">
                    Calls <span className="font-portal-mono text-[10px]">POST /api/v1/auth/refresh</span> then reloads your portal state.
                </p>
                <GhostButton type="button" disabled={refreshing} onClick={() => void onRefreshSession()}>
                    {refreshing ? 'REFRESHING…' : 'REFRESH SESSION'}
                </GhostButton>
            </PortalCard>
        </PortalPage>
    );
}

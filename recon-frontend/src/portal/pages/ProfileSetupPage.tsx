import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalPage from '../components/PortalPage';
import { GhostButton, PortalCard, PrimaryButton, SectionLabel } from '../components/primitives';
import { createMyParticipantProfile } from '../api/participants';
import { ApiError } from '../api/client';
import { getParticipantYearError, isValidParticipantYear, PARTICIPANT_YEAR_MAX, PARTICIPANT_YEAR_MIN } from '../lib/participantProfile';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const bootstrapSession = useAuthStore((s) => s.bootstrapSession);
    const signOut = useAuthStore((s) => s.signOut);
    const addToast = useToastStore((s) => s.addToast);

    const [displayName, setDisplayName] = useState('');
    const [institution, setInstitution] = useState('');
    const [year, setYear] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const yearError = getParticipantYearError(year);

    const canSubmit = useMemo(() => {
        return (
            displayName.trim().length >= 3
            && institution.trim().length >= 2
            && isValidParticipantYear(year)
        );
    }, [displayName, institution, year]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true);
        try {
            await createMyParticipantProfile({
                display_name: displayName.trim(),
                institution: institution.trim(),
                year,
                talent_visible: false,
                talent_contact_shareable: false,
            });
            await bootstrapSession();
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const msg =
                err instanceof ApiError && typeof err.body === 'object' && err.body && 'detail' in err.body
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      String((err.body as any).detail)
                    : 'Unable to create participant profile.';
            addToast({ type: 'error', title: 'SETUP FAILED', body: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-xl mx-auto">
            <div data-portal-header>
                <SectionLabel>-- FIRST TIME SETUP --</SectionLabel>
                <div className="font-portal-display text-[clamp(30px,6vw,44px)] leading-none text-[var(--fg)] mt-2">
                    CREATE <span className="text-[var(--amber)]">PROFILE</span>
                </div>
                <div className="font-portal-body text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_75%,white_8%)] mt-3">
                    Your account is authenticated, but you don’t have a participant profile yet. Fill this once to enter the portal.
                </div>
            </div>

            <PortalCard className="mt-6 p-5 sm:p-6" attr>
                <form onSubmit={onSubmit} className="grid gap-4">
                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            DISPLAY NAME
                        </label>
                        <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Alex Operator"
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            INSTITUTION
                        </label>
                        <input
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="VIT-AP University"
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-portal-mono text-[10px] tracking-[0.2em] uppercase text-[color-mix(in_srgb,var(--amber)_62%,black_12%)] mb-2">
                            YEAR
                        </label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value === '' ? Number.NaN : Number(e.target.value))}
                            min={PARTICIPANT_YEAR_MIN}
                            max={PARTICIPANT_YEAR_MAX}
                            className="w-full min-h-11 bg-[var(--bg)] border border-[var(--border-dim)] px-4 py-3 font-portal-mono text-[14px] text-[var(--fg)] outline-none focus:border-[var(--amber)]"
                            required
                        />
                        <p className={`mt-1.5 font-portal-mono text-[10px] ${yearError ? 'text-[var(--portal-red)]' : 'text-[color-mix(in_srgb,var(--dim)_70%,white_6%)]'}`}>
                            {yearError ?? `Use a year between ${PARTICIPANT_YEAR_MIN} and ${PARTICIPANT_YEAR_MAX}.`}
                        </p>
                    </div>

                    <div className="grid gap-2 mt-2">
                        <PrimaryButton type="submit" disabled={!canSubmit || loading}>
                            {loading ? 'CREATING...' : 'CREATE PROFILE ->'}
                        </PrimaryButton>
                        <GhostButton
                            type="button"
                            onClick={async () => {
                                await signOut();
                                navigate('/login', { replace: true });
                            }}
                        >
                            SIGN OUT
                        </GhostButton>
                    </div>
                </form>
            </PortalCard>
        </PortalPage>
    );
}


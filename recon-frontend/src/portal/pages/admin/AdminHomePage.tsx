import { Link } from 'react-router-dom';
import PortalPage from '../../components/PortalPage';
import { PortalCard, SectionLabel } from '../../components/primitives';

const LINKS: { to: string; title: string; blurb: string }[] = [
    { to: '/admin/users', title: 'USERS', blurb: 'Create, list, update, and remove user accounts.' },
    { to: '/admin/incidents', title: 'INCIDENTS', blurb: 'Report and triage operational incidents.' },
    { to: '/admin/participants', title: 'PARTICIPANTS', blurb: 'Directory, detail lookup, and check-in.' },
    { to: '/admin/zone-scanner', title: 'ZONE SCANNER', blurb: 'Scan participant zone passes and award check-in points.' },
    { to: '/admin/teams', title: 'TEAMS', blurb: 'Admin team creation, roster review, and reassignment.' },
    { to: '/admin/announcements', title: 'ANNOUNCEMENTS', blurb: 'Publish, pin, expire, and remove live announcements.' },
    { to: '/admin/shop', title: 'SHOP OPS', blurb: 'Manage merch items, fulfillment, and returns.' },
    { to: '/admin/points', title: 'POINTS OPS', blurb: 'Award participant points and run team-event settlements.' },
    { to: '/admin/schedule', title: 'SCHEDULE', blurb: 'Sessions, speakers, and speaker attachments.' },
    { to: '/admin/partners', title: 'PARTNERS', blurb: 'Applications, review, incentives, and assets.' },
    { to: '/admin/storage', title: 'STORAGE', blurb: 'Presigned upload and read URLs (R2).' },
    { to: '/admin/api-coverage', title: 'DEBUG CONSOLE', blurb: 'Low-level API runners for edge-case verification.' },
];

export default function AdminHomePage() {
    return (
        <PortalPage className="pt-20 pb-24 lg:pb-8 px-4 sm:px-5 lg:px-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <SectionLabel>-- OPERATIONS --</SectionLabel>
                <h1 className="font-portal-display text-[clamp(32px,6vw,48px)] leading-none text-[var(--fg)] mt-2">
                    COMMAND <span className="text-[var(--amber)]">CENTER</span>
                </h1>
                <p className="font-portal-body text-[14px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_78%,white_6%)] mt-4 max-w-2xl">
                    Internal tools wired to the live API. Actions require an admin or ops role on your account.
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                {LINKS.map((item) => (
                    <Link key={item.to} to={item.to} className="group block">
                        <PortalCard className="h-full p-5 transition-all border border-transparent hover:border-[color-mix(in_srgb,var(--amber)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-2)_100%,transparent)]">
                            <div className="font-portal-display text-[22px] text-[var(--fg)] group-hover:text-[var(--amber)] transition-colors">
                                {item.title}
                            </div>
                            <p className="font-portal-body text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--dim)_85%,white_5%)] mt-2">
                                {item.blurb}
                            </p>
                            <div className="font-portal-mono text-[9px] tracking-[0.2em] uppercase text-[var(--amber)] mt-4 opacity-80">
                                OPEN →
                            </div>
                        </PortalCard>
                    </Link>
                ))}
            </div>
        </PortalPage>
    );
}

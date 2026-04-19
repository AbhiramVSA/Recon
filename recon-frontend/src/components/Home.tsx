import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import Hero from './Hero';
import Marquee from './Marquee';
import { Label } from './ui';
import { stats, partners as fallbackPartners, type Partner } from '../data';
import { useCountUp } from '../hooks';
import ScrambleText from './ScrambleText';
import Seo from './Seo';
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_NAME, SITE_URL } from '../seo';
import { partnersApi } from '../api/backend';

const SIZE_CLASS: Record<NonNullable<Partner['size']>, string> = {
    sm: 'max-h-8',
    md: 'max-h-10',
    lg: 'max-h-12',
};

/* ── Sponsor logo strip (Hacktron-style) ──────────────────────── */
const HOST_INSTITUTION = 'VIT-AP University';
const COLLABORATOR_NAMES = new Set(['IIT Madras']);
const LANDING_COMMUNITY_PARTNERS = new Set(['HackTheBox Mumbai', 'BSides Vizag']);
const LANDING_LOGO_SIZE_OVERRIDES: Record<string, string> = {
    'HackTheBox Mumbai': 'max-h-14 md:max-h-16',
    'BSides Vizag': 'max-h-14 md:max-h-16',
};

const logoWrapClass = 'group flex items-center justify-center px-2 py-2';

function logoImgClass(partner: Partner) {
    const size = LANDING_LOGO_SIZE_OVERRIDES[partner.name] ?? SIZE_CLASS[partner.size ?? 'md'];
    const base = `object-contain transition-all duration-200 opacity-85 group-hover:opacity-100 filter ${size}`;
    if (partner.fix === 'brighten') return `${base} brightness-130 contrast-115`;
    if (partner.fix === 'invert') return `${base} brightness-120 contrast-125`;
    if (partner.fix === 'glow') return `${base} brightness-120 contrast-120 drop-shadow-[0_0_6px_rgba(245,244,249,0.35)] drop-shadow-[0_0_2px_rgba(245,244,249,0.7)]`;
    return `${base} brightness-110 contrast-110`;
}
function SponsorStrip({ partnersData }: { partnersData: Partner[] }) {
    const hostInstitution = partnersData.find((p) => p.name === HOST_INSTITUTION);
    const collaboratorInstitutions = partnersData.filter((p) => COLLABORATOR_NAMES.has(p.name));
    const supportSponsors = partnersData.filter(
        (p) => (p.tier !== 'community' || LANDING_COMMUNITY_PARTNERS.has(p.name))
            && p.name !== HOST_INSTITUTION
            && !COLLABORATOR_NAMES.has(p.name),
    );

    return (
        <section className="relative z-10 border-y border-edge px-6 py-14">
            <div className="max-w-6xl mx-auto">
                {(hostInstitution || collaboratorInstitutions.length > 0) && (
                    <>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-10">
                            {hostInstitution && (
                                <div className="text-center">
                                    <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/50">
                                        Hosted By
                                    </span>
                                    <div className="mt-4 flex items-center justify-center">
                                        <a href={hostInstitution.url} target="_blank" rel="noopener noreferrer" className={logoWrapClass}>
                                            <img
                                                src={hostInstitution.logo}
                                                alt={hostInstitution.name}
                                                className={logoImgClass(hostInstitution)}
                                                loading="eager"
                                                fetchPriority="high"
                                                decoding="sync"
                                            />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {collaboratorInstitutions.length > 0 && (
                                <div className="text-center">
                                    <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/50">
                                        In Collaboration With
                                    </span>
                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                                        {collaboratorInstitutions.map((institution) => (
                                            <a key={institution.name} href={institution.url} target="_blank" rel="noopener noreferrer" className={logoWrapClass}>
                                                <img
                                                    src={institution.logo}
                                                    alt={institution.name}
                                                    className={logoImgClass(institution)}
                                                    loading="eager"
                                                    fetchPriority="high"
                                                    decoding="sync"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-edge/60 mb-10" />
                    </>
                )}

                <div className="text-center mb-10">
                    <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-cream/50">
                        With Support From
                    </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
                    {supportSponsors.map((s) => (
                        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className={logoWrapClass}>
                            <img
                                src={s.logo}
                                alt={s.name}
                                className={logoImgClass(s)}
                                loading="eager"
                                fetchPriority="high"
                                decoding="sync"
                            />
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ── Stat card with count-up ──────────────────────────────────── */
function StatCard({ label, value, prefix, suffix }: { label: string; value: number; prefix?: string; suffix?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    const { formatted } = useCountUp(value, { trigger: inView, prefix, suffix, duration: 2200 });

    return (
        <div ref={ref} className="border border-edge bg-panel/30 p-5 text-center group hover:border-paper/25 transition-colors duration-300">
            <div className="font-display text-2xl md:text-3xl text-paper tabular-nums">{formatted}</div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.3em] uppercase text-muted">{label}</div>
        </div>
    );
}

/* ── About section (Hacktron layout) ──────────────────────────── */

function AboutSection() {
    return (
        <section className="relative z-10 px-6 py-16">
            <div className="max-w-7xl mx-auto">
                {/* Label row */}
                <Label>About</Label>

                <div className="mt-2">
                    {/* Large box with ASCII art background + text overlay */}
                    <div className="relative border border-edge overflow-hidden min-h-[420px] md:min-h-[520px]">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-paper/40 z-20" />
                        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-paper/40 z-20" />
                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-paper/40 z-20" />
                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-paper/40 z-20" />

                        {/* ASCII art background image — desktop only */}
                        <img
                            src="/satellite_disk_ascii.webp"
                            alt=""
                            className="hidden sm:block absolute right-[-50px] top-20 h-full w-auto object-contain scale-125 origin-right opacity-100 select-none pointer-events-none"
                            style={{
                                filter: 'grayscale(100%) sepia(100%) hue-rotate(265deg) saturate(320%) brightness(1.05) contrast(1.05)',
                            }}
                            draggable={false}
                            loading="lazy"
                            decoding="async"
                        />

                        {/* Gradient overlays for readability */}

                        {/* Text content */}
                        <div className="relative z-20 p-8 md:p-12 flex flex-col justify-between h-full">
                            <div>
                                <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-paper tracking-tight leading-[1.15]">
                                    <ScrambleText text="Where hackers converge." tag="span" speed={16} />
                                    <br />
                                    <span className="text-paper/80">Hunt. Break. Defend.</span>
                                </h2>

                                <p className="mt-6 font-body text-sm text-cream/70 leading-relaxed max-w-md">
                                    RECON 2026 is a 3-day cybersecurity festival organized by{' '}
                                    <span className="text-paper">ReconHQ</span> at VIT-AP University, Amaravati.
                                    From overnight CTFs and attack-defence warzones to hardware badge soldering
                                    and deepfake forensics — this is the largest campus security event in South India.
                                </p>

                                <p className="mt-3 font-body text-sm text-cream/70 leading-relaxed max-w-md">
                                    Whether you're a seasoned red-teamer or writing your first exploit,
                                    RECON has a track for you. Join 600+ hackers, compete for ₹1.5M+ in prizes,
                                    and connect with the community.
                                </p>

                                <p className="mt-5 font-mono text-xs text-paper/50 leading-relaxed max-w-md">
                                    Built by students who live and breathe security,<br />
                                    we operate by one principle:<br />
                                    <span className="text-paper/80">PoC || GTFO.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
                    {stats.map((s) => (
                        <StatCard key={s.label} label={s.label} value={s.value} prefix={s.prefix} suffix={s.suffix} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ── Home page ────────────────────────────────────────────────── */
export default function Home() {
    const [partnersData, setPartnersData] = useState<Partner[]>(fallbackPartners);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const apiPartners = await partnersApi.list();
                if (!alive || !Array.isArray(apiPartners) || apiPartners.length === 0) return;
                const mapped = apiPartners.map((p) => {
                    const tier = String(p.sponsorship_type ?? '').toLowerCase();
                    const normalizedTier: Partner['tier'] =
                        tier === 'title' || tier === 'co-title' || tier === 'strategic' || tier === 'technical' || tier === 'gold' || tier === 'silver' || tier === 'community'
                            ? tier
                            : 'community';
                    return {
                        name: String(p.company_name ?? 'Partner'),
                        description: String(p.offering_writeup ?? ''),
                        tier: normalizedTier,
                        logo: '/logos/recon_transparent.svg',
                        url: String(p.company_website ?? '#'),
                        size: 'md' as const,
                    };
                });
                setPartnersData(mapped);
            } catch {
                // Keep static data if endpoint is auth-protected.
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        const hostInstitution = partnersData.find((p) => p.name === HOST_INSTITUTION);
        const collaboratorInstitutions = partnersData.filter((p) => COLLABORATOR_NAMES.has(p.name));
        const supportSponsors = partnersData.filter(
            (p) => (p.tier !== 'community' || LANDING_COMMUNITY_PARTNERS.has(p.name))
                && p.name !== HOST_INSTITUTION
                && !COLLABORATOR_NAMES.has(p.name),
        );
        const landingLogos = [
            ...(hostInstitution ? [hostInstitution.logo] : []),
            ...collaboratorInstitutions.map((p) => p.logo),
            ...supportSponsors.map((p) => p.logo),
        ];
        // Warm logo assets early so sponsor strip appears without delayed image pop-in.
        landingLogos.forEach((src) => {
            const img = new Image();
            img.decoding = 'async';
            img.src = src;
        });
    }, [partnersData]);

    const baseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL;
    const eventJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        startDate: '2026-04-19',
        endDate: '2026-04-21',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
            '@type': 'Place',
            name: 'VIT-AP University',
            address: {
                '@type': 'PostalAddress',
                streetAddress: 'Near Inavolu, Beside AP Secretariat',
                addressLocality: 'Amaravati',
                addressRegion: 'Andhra Pradesh',
                postalCode: '522237',
                addressCountry: 'IN',
            },
        },
        organizer: {
            '@type': 'Organization',
            name: 'ReconHQ',
            ...(baseUrl ? { url: baseUrl } : {}),
            sameAs: [
                'https://discord.gg/xJdRgYndSJ',
                'https://www.instagram.com/recon_2k26/',
                'https://x.com/Recon2k26/with_replies',
                'https://www.linkedin.com/in/recon-events/',
            ],
        },
        ...(baseUrl ? { url: `${baseUrl}/`, image: [`${baseUrl}${DEFAULT_IMAGE}`] } : {}),
    };

    return (
        <>
            <Seo
                title="RECON 2026"
                description={DEFAULT_DESCRIPTION}
                path="/"
                image={DEFAULT_IMAGE}
                jsonLd={eventJsonLd}
            />
            <Hero />

            <div className="relative z-10 border-y border-edge/30">
                <Marquee
                    items={['CTF', 'KOTH', 'NFC HUNT', 'IoT VILLAGE', 'APPSEC', 'FORENSICS', 'ESCAPE ROOM', 'BUG BOUNTY']}
                    speed="fast"
                    separator="◇"
                />
            </div>

            <SponsorStrip partnersData={partnersData} />
            <AboutSection />
        </>
    );
}

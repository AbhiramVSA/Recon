import { useEffect, useMemo, useState } from 'react';
import { partners as fallbackPartners, type Partner } from '../data';
import { Section, Label } from './ui';
import GlyphGrid from './GlyphGrid';
import Seo from './Seo';
import { partnersApi } from '../api/backend';

const HOST_INSTITUTION = 'VIT-AP University';
const COLLABORATOR_NAMES = new Set(['IIT Madras']);
const INSTITUTION_COPY: Record<string, { title: string; subtitle: string }> = {
    'IIT Madras': {
        title: 'IIT Madras',
        subtitle: 'Indian Institute of Technology Madras',
    },
    'VIT-AP University': {
        title: 'VIT-AP UNIVERSITY',
        subtitle: 'Vellore Institute of Technology Andhra Pradesh',
    },
};

const TIER_ORDER = ['title', 'co-title', 'technical', 'strategic', 'gold', 'silver', 'community'] as const;
const TIER_LABELS: Record<string, string> = {
    title: 'Title Sponsors',
    'co-title': 'Co-Title Sponsors',
    gold: 'Gold Sponsors',
    silver: 'Silver Sponsors',
    strategic: 'Strategic Partners',
    technical: 'Technical Partners',
    community: 'Community Partners',
};

const SIZE_CLASS: Record<NonNullable<Partner['size']>, string> = {
    sm: 'max-h-8',
    md: 'max-h-10',
    lg: 'max-h-12',
};
const logoPlateClass = 'h-12 flex items-center mb-4';

function logoImgClass(partner: Partner) {
    const size = SIZE_CLASS[partner.size ?? 'md'];
    const base = `object-contain transition-all duration-200 opacity-85 group-hover:opacity-100 filter ${size}`;
    if (partner.fix === 'brighten') return `${base} brightness-130 contrast-115`;
    if (partner.fix === 'invert') return `${base} brightness-120 contrast-125`;
    if (partner.fix === 'glow') return `${base} brightness-120 contrast-120 drop-shadow-[0_0_6px_rgba(245,244,249,0.35)] drop-shadow-[0_0_2px_rgba(245,244,249,0.7)]`;
    return `${base} brightness-110 contrast-110`;
}

export default function Sponsors() {
    const [partnerItems, setPartnerItems] = useState<Partner[]>(fallbackPartners);

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
                setPartnerItems(mapped);
            } catch {
                // keep fallback partner data when endpoint is role-restricted
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const hostInstitution = useMemo(() => partnerItems.find((p) => p.name === HOST_INSTITUTION), [partnerItems]);
    const collaborators = useMemo(() => partnerItems.filter((p) => COLLABORATOR_NAMES.has(p.name)), [partnerItems]);
    const sponsorPool = useMemo(() => partnerItems.filter(
        (p) => p.name !== HOST_INSTITUTION && !COLLABORATOR_NAMES.has(p.name),
    ), [partnerItems]);

    const grouped = TIER_ORDER.map((tier) => ({
        tier,
        label: TIER_LABELS[tier],
        items: sponsorPool.filter((p) => p.tier === tier),
    })).filter((g) => g.items.length > 0);

    return (
        <>
            <Seo
                title="Sponsors"
                description="Organizations and partners powering RECON 2026."
                path="/sponsors"
            />
            <Section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-start justify-between">
                        <Label>Sponsors &amp; Partners</Label>
                        <GlyphGrid type="hex" cols={4} rows={2} className="hidden md:block opacity-30" />
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight leading-tight mt-2">
                        Sponsors &amp; Partners
                    </h1>
                    <h2 className="font-display text-xl md:text-2xl text-paper/80 tracking-tight leading-tight mt-2">
                        Powered by the security community
                    </h2>
                    <p className="mt-4 font-body text-sm text-muted leading-relaxed max-w-2xl">
                        RECON 2026 is made possible by organizations that believe in building the next generation of security talent.
                    </p>

                    {(collaborators.length > 0 || hostInstitution) && (
                        <div className="mt-12">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/60">
                                    Official Institutions
                                </span>
                                <span className="flex-1 h-px bg-edge" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {collaborators.length > 0 && (
                                    <div className="border border-edge bg-panel/35 p-6">
                                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/60">
                                            In Collaboration With
                                        </span>
                                        <div className="mt-4 flex flex-wrap items-center gap-6">
                                            {collaborators.map((partner) => (
                                                <a
                                                    key={partner.name}
                                                    href={partner.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group block"
                                                >
                                                    <div className={logoPlateClass}>
                                                        <img
                                                            src={partner.logo}
                                                            alt={partner.name}
                                                            className={logoImgClass(partner)}
                                                            loading="eager"
                                                            fetchPriority="high"
                                                            decoding="async"
                                                        />
                                                    </div>
                                                    <h3 className="font-display text-sm text-paper leading-tight">
                                                        {INSTITUTION_COPY[partner.name]?.title ?? partner.name}
                                                    </h3>
                                                    <p className="mt-1 font-body text-xs text-muted leading-relaxed max-w-[22rem]">
                                                        {INSTITUTION_COPY[partner.name]?.subtitle ?? partner.description}
                                                    </p>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hostInstitution && (
                                    <div className="border border-edge bg-panel/35 p-6">
                                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/60">
                                            Hosted By
                                        </span>
                                        <div className="mt-4 flex items-center gap-6">
                                            <a
                                                href={hostInstitution.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block"
                                            >
                                                <div className={logoPlateClass}>
                                                    <img
                                                        src={hostInstitution.logo}
                                                        alt={hostInstitution.name}
                                                        className={logoImgClass(hostInstitution)}
                                                        loading="eager"
                                                        fetchPriority="high"
                                                        decoding="async"
                                                    />
                                                </div>
                                                <h3 className="font-display text-sm text-paper leading-tight">
                                                    {INSTITUTION_COPY[hostInstitution.name]?.title ?? hostInstitution.name}
                                                </h3>
                                                <p className="mt-1 font-body text-xs text-muted leading-relaxed max-w-[22rem]">
                                                    {INSTITUTION_COPY[hostInstitution.name]?.subtitle ?? hostInstitution.description}
                                                </p>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-16 space-y-16">
                        {grouped.map((group) => (
                            <div key={group.tier}>
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/60">
                                        {group.label}
                                    </span>
                                    <span className="flex-1 h-px bg-edge" />
                                </div>

                                <div className={`grid gap-6 ${group.tier === 'title' || group.tier === 'co-title'
                                    ? 'grid-cols-1 md:grid-cols-2'
                                    : group.tier === 'strategic' || group.tier === 'technical'
                                        ? 'grid-cols-1 sm:grid-cols-2'
                                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                    }`}>
                                    {group.items.map((partner) => (
                                        <a
                                            key={partner.name}
                                            href={partner.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group border border-edge bg-panel/30 p-6 hover:border-paper/30 transition-colors duration-200"
                                        >
                                            <div className={logoPlateClass}>
                                                <img
                                                    src={partner.logo}
                                                    alt={partner.name}
                                                    className={logoImgClass(partner)}
                                                    loading="eager"
                                                    decoding="async"
                                                />
                                            </div>
                                            <h3 className="font-display text-lg text-paper">{partner.name}</h3>
                                            <p className="mt-1 font-body text-xs text-muted leading-relaxed">
                                                {partner.description.replace(/^.*?—\s*/, '')}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}


                    </div>
                </div>
            </Section>
        </>
    );
}

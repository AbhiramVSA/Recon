import { partners } from '../data';
import { Section, Label } from './ui';
import CornerFrame from './CornerFrame';
import Seo from './Seo';

type PrizeTier = {
    place: string;
    worth: string;
    teamNote?: string;
    buckets: Array<{ title: string; entries: string[] }>;
    note?: string;
};

const CTF_TIERS: PrizeTier[] = [
    {
        place: '1st Place',
        worth: '₹5,00,000 worth',
        teamNote: 'Team of 4',
        buckets: [
            {
                title: 'Core High-Value',
                entries: ['1 x CRTP (₹47,000)', '4 x APISec Certifications (₹1,00,000)', '4 x XSSRat Bundles (₹88,000)'],
            },
            {
                title: 'Performance-Based Bonus',
                entries: ['JWPT unlock (Web/Pwn excellence from team performance)'],
            },
            {
                title: 'Tools and Access',
                entries: ['Caido 12-month license (~₹20,000)', 'Hackviser VIP (₹4,000)', 'XYZ Domains (₹6,000)'],
            },
            {
                title: 'Opportunities',
                entries: ['HackersDaddy internship opportunities (select performers)'],
            },
        ],
        note: 'Remaining value is padded through INE access perception and sponsor discounts to align with ~₹5L perceived total.',
    },
    {
        place: '2nd Place',
        worth: '₹3,00,000 worth',
        buckets: [
            {
                title: 'Reward Package',
                entries: [
                    '4 x APISec Certifications (₹1,00,000)',
                    '3 x XSSRat Bundles (₹66,000)',
                    'Caido 6-month (~₹10,000)',
                    'XYZ Domains (~₹6,000)',
                    'Hackviser discounts',
                ],
            },
        ],
        note: 'Includes INE access and sponsor perks to reach ~₹3L total perceived value.',
    },
    {
        place: '3rd Place',
        worth: '₹2,00,000 worth',
        buckets: [
            {
                title: 'Reward Package',
                entries: [
                    '4 x APISec Certifications (₹1,00,000)',
                    '2 x XSSRat Bundles (₹44,000)',
                    'Caido 3-month (~₹5,000)',
                    'XYZ Domains (~₹4,500)',
                ],
            },
        ],
        note: 'Structured as a clean ~₹2L reward package.',
    },
];

const KOTH_TIERS: PrizeTier[] = [
    {
        place: '1st Place',
        worth: '₹3,00,000 worth',
        buckets: [
            {
                title: 'Reward Package',
                entries: [
                    '4 x APISec Certifications (₹1,00,000)',
                    '3 x XSSRat Bundles (₹66,000)',
                    'Caido 12-month (~₹20,000)',
                    'Hackviser VIP',
                    'XYZ Domains (~₹6,000)',
                ],
            },
        ],
        note: 'Packaged to ~₹3L perceived total value.',
    },
    {
        place: '2nd Place',
        worth: '₹1,25,000 worth',
        buckets: [
            {
                title: 'Reward Package',
                entries: ['3 x APISec Certifications (₹75,000)', '2 x XSSRat Bundles (₹44,000)', 'Caido 6-month access'],
            },
        ],
        note: 'Combined value aligns with ~₹1.25L.',
    },
    {
        place: '3rd Place',
        worth: '₹75,000 worth',
        buckets: [
            {
                title: 'Reward Package',
                entries: ['3 x APISec Certifications (₹75,000)'],
            },
        ],
        note: 'Clean ₹75K certification reward.',
    },
];

const ADDITIONAL_REWARDS = [
    'Premium learning bundles',
    'Industry-recognized certifications',
    'Access to pro licenses',
    'Internship opportunities',
    'Swag, domains, and exclusive discounts',
    'Hardware reward drops including Pwnagotchi and Kiisu',
];

const REWARD_SPONSOR_NAMES = new Set([
    'APISec University',
    'TheXSSRat',
    'Caido',
    'Hackviser',
    '.xyz Domains',
    'INE',
    'Hackers Daddy',
]);

const rewardBackers = partners.filter((partner) => REWARD_SPONSOR_NAMES.has(partner.name));

function TierCard({ tier, accent }: { tier: PrizeTier; accent?: boolean }) {
    return (
        <CornerFrame accent={accent}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h3 className="font-display text-xl text-paper tracking-tight leading-none">{tier.place}</h3>
                    {tier.teamNote && <p className="mt-1 font-mono text-[10px] tracking-[0.24em] uppercase text-paper/55">{tier.teamNote}</p>}
                </div>
                <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-paper/70 text-right">{tier.worth}</p>
            </div>

            <div className="space-y-4">
                {tier.buckets.map((bucket) => (
                    <div key={bucket.title} className="border border-edge/70 bg-panel/20 px-3 py-3">
                        <h4 className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/75 mb-2">{bucket.title}</h4>
                        <ul className="space-y-1.5">
                            {bucket.entries.map((entry) => (
                                <li key={entry} className="font-body text-xs text-cream/78 leading-relaxed">{entry}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {tier.note && <p className="mt-4 font-body text-xs text-muted leading-relaxed">{tier.note}</p>}
        </CornerFrame>
    );
}

export default function Prizes() {
    return (
        <>
            <Seo
                title="Prizes & Rewards"
                description="Detailed CTF and King of the Hill prize structure for RECON 2026."
                path="/prizes"
            />
            <Section id="prizes" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <Label>Sponsors & Rewards</Label>
                    <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight leading-tight">
                        Prize Pool Worth <span className="text-paper/80">₹15,00,000+</span>
                    </h1>
                    <p className="mt-4 font-body text-sm text-muted max-w-3xl leading-relaxed">
                        RECON rewards are split across CTF and King of the Hill with structured winner packs covering certifications, premium tools, learning access, and internship opportunities.
                    </p>

                    <div className="mt-10 grid md:grid-cols-2 gap-4">
                        <div className="border border-edge bg-panel/30 p-5">
                            <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-paper/60 mb-3">CTF - ₹10,00,000</div>
                            <div className="space-y-2 text-sm font-body text-cream/85">
                                <p>1st Place - ₹5,00,000 worth + internship opportunities</p>
                                <p>2nd Place - ₹3,00,000 worth</p>
                                <p>3rd Place - ₹2,00,000 worth</p>
                            </div>
                        </div>
                        <div className="border border-edge bg-panel/30 p-5">
                            <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-paper/60 mb-3">King of the Hill - ₹5,00,000</div>
                            <div className="space-y-2 text-sm font-body text-cream/85">
                                <p>1st Place - ₹3,00,000 worth</p>
                                <p>2nd Place - ₹1,25,000 worth</p>
                                <p>3rd Place - ₹75,000 worth</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-cream/60">CTF Breakdown</span>
                            <span className="flex-1 h-px bg-edge" />
                        </div>
                        <div className="grid lg:grid-cols-3 gap-4">
                            {CTF_TIERS.map((tier, index) => (
                                <TierCard key={`ctf-${tier.place}`} tier={tier} accent={index === 0} />
                            ))}
                        </div>
                    </div>

                    <div className="mt-16">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-cream/60">KOTH Breakdown</span>
                            <span className="flex-1 h-px bg-edge" />
                        </div>
                        <div className="grid lg:grid-cols-3 gap-4">
                            {KOTH_TIERS.map((tier, index) => (
                                <TierCard key={`koth-${tier.place}`} tier={tier} accent={index === 0} />
                            ))}
                        </div>
                    </div>

                    <div className="mt-16 grid lg:grid-cols-[1.2fr_1fr] gap-4">
                        <CornerFrame>
                            <h3 className="font-display text-xl text-paper tracking-tight mb-4">Additional Rewards</h3>
                            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
                                {ADDITIONAL_REWARDS.map((reward) => (
                                    <li key={reward} className="font-body text-sm text-cream/80 leading-relaxed">{reward}</li>
                                ))}
                            </ul>
                        </CornerFrame>

                        <CornerFrame>
                            <h3 className="font-display text-xl text-paper tracking-tight mb-4">Reward Sponsors</h3>
                            <div className="flex flex-wrap gap-3">
                                {rewardBackers.map((partner) => (
                                    <a
                                        key={partner.name}
                                        href={partner.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group border border-edge bg-panel/20 px-3 py-2 hover:border-paper/30 transition-colors"
                                    >
                                        <div className="h-8 flex items-center">
                                            <img
                                                src={partner.logo}
                                                alt={partner.name}
                                                className="max-h-7 max-w-[110px] object-contain opacity-75 group-hover:opacity-100 transition-opacity duration-200"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </CornerFrame>
                    </div>
                </div>
            </Section>
        </>
    );
}

import { Section, Label } from './ui';
import ScrambleText from './ScrambleText';
import GlyphGrid from './GlyphGrid';
import CornerFrame from './CornerFrame';
import Seo from './Seo';

const CHANNELS = [
    {
        label: 'Discord',
        value: 'discord.gg/xJdRgYndSJ',
        href: 'https://discord.gg/xJdRgYndSJ',
        note: 'Fastest response · Online daily',
    },
    {
        label: 'Instagram',
        value: '@recon_2k26',
        href: 'https://www.instagram.com/recon_2k26/',
        note: 'Updates & announcements',
    },
    {
        label: 'Twitter / X',
        value: '@Recon2k26',
        href: 'https://x.com/Recon2k26/with_replies',
        note: 'Live event coverage',
    },
    {
        label: 'LinkedIn',
        value: 'recon-events',
        href: 'https://www.linkedin.com/in/recon-events/',
        note: 'Professional inquiries & sponsorship',
    },
];

const CONTACTS = [
    {
        role: 'General Enquiries',
        name: 'ReconHQ Team',
        channel: 'Discord — #general-help',
        href: 'https://discord.gg/xJdRgYndSJ',
    },
    {
        role: 'Sponsorship / Partnerships',
        name: 'ReconHQ',
        channel: 'LinkedIn',
        href: 'https://www.linkedin.com/in/recon-events/',
    },
    {
        role: 'Media & Press',
        name: 'ReconHQ',
        channel: 'Twitter / X',
        href: 'https://x.com/Recon2k26/with_replies',
    },
];

export default function Contact() {
    return (
        <>
            <Seo
                title="Contact"
                description="Get in touch with ReconHQ and find venue details for RECON 2026."
                path="/contact"
            />
            <Section id="contact" className="py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                        <Label>Contact</Label>
                        <GlyphGrid type="braille" cols={5} rows={2} className="hidden sm:block opacity-30" />
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight leading-tight mb-3">
                        <ScrambleText text="Get In Touch" tag="span" speed={16} />
                    </h1>
                    <p className="font-body text-sm text-muted mb-12 max-w-xl">
                        Have a question, want to collaborate, or looking to sponsor RECON 2026? Find us on any of the channels below.
                    </p>

                    {/* Social channels */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="w-4 h-px bg-paper/30" />
                            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-paper/50">
                                Channels
                            </span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mb-14">
                        {CHANNELS.map((ch) => (
                            <a
                                key={ch.label}
                                href={ch.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group"
                            >
                                <CornerFrame>
                                    <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-paper/50 block mb-2">
                                        {ch.label}
                                    </span>
                                    <span className="font-display text-base text-paper group-hover:text-cream transition-colors block">
                                        {ch.value}
                                    </span>
                                    <span className="mt-2 font-body text-xs text-muted block">{ch.note}</span>
                                </CornerFrame>
                            </a>
                        ))}
                    </div>

                    {/* Point of contact by purpose */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="w-4 h-px bg-paper/30" />
                            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-paper/50">
                                Points of Contact
                            </span>
                        </div>
                    </div>

                    <div className="border border-edge bg-panel/20">
                        {CONTACTS.map((c, i) => (
                            <div
                                key={c.role}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 ${i < CONTACTS.length - 1 ? 'border-b border-edge/50' : ''}`}
                            >
                                <div>
                                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-paper/50 block mb-0.5">
                                        {c.role}
                                    </span>
                                    <span className="font-body text-sm text-cream/80">{c.name}</span>
                                </div>
                                <a
                                    href={c.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-[11px] tracking-wider text-muted hover:text-paper transition-colors whitespace-nowrap"
                                >
                                    {c.channel} →
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Venue info + Map */}
                    <div className="mt-10 border border-edge bg-panel/20">
                        {/* Header row */}
                        <div className="px-5 pt-4 pb-3 border-b border-edge/50 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-paper/50" />
                            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-paper/50">
                                Venue
                            </span>
                        </div>

                        {/* Address */}
                        <div className="px-5 py-4 border-b border-edge/50">
                            <p className="font-display text-base text-paper mb-1">VIT-AP University</p>
                            <p className="font-body text-xs text-muted leading-relaxed">
                                Near Inavolu, Beside AP Secretariat,<br />
                                Amaravati — 522 237,<br />
                                Andhra Pradesh, India.
                            </p>
                        </div>

                        {/* Map */}
                        <div className="relative overflow-hidden" style={{ height: '280px' }}>
                            {/* Dark overlay tint matching void bg */}
                            <div className="absolute inset-0 z-10 pointer-events-none mix-blend-multiply bg-void/30" />
                            <iframe
                                title="VIT-AP University Location"
                                src="https://www.openstreetmap.org/export/embed.html?bbox=80.4891%2C16.4841%2C80.5091%2C16.5041&layer=mapnik&marker=16.4941%2C80.4991"
                                width="100%"
                                height="100%"
                                style={{
                                    border: 'none',
                                    filter: 'grayscale(100%) invert(95%) hue-rotate(180deg) brightness(0.75) contrast(1.1)',
                                    display: 'block',
                                }}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                            />
                        </div>

                        {/* Open in maps link */}
                        <div className="px-5 py-3 border-t border-edge/50 flex items-center justify-between">
                            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-faint">
                                16.4941 N, 80.4991 E
                            </span>
                            <a
                                href="https://www.openstreetmap.org/?mlat=16.5193&mlon=80.5188#map=15/16.5193/80.5188"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[10px] tracking-wider text-muted hover:text-paper transition-colors"
                            >
                                Open in Maps →
                            </a>
                        </div>
                    </div>

                    {/* FAQ nudge */}
                    <p className="mt-10 font-body text-xs text-muted">
                        Looking for quick answers?{' '}
                        <a href="/faq" className="text-paper/80 hover:text-paper underline underline-offset-2 transition-colors">
                            Check the FAQ →
                        </a>
                    </p>
                </div>
            </Section>
        </>
    );
}

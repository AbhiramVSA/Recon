import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Section, Label } from './ui';
import GlyphGrid from './GlyphGrid';
import Marquee from './Marquee';
import ScrambleText from './ScrambleText';
import { EVENT_DATE_RANGE_LABEL, EVENT_DATE_RANGE_READABLE } from '../data';

function useDiagnostics() {
    const [data, setData] = useState<Record<string, string>>({});

    useEffect(() => {
        const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
        const d: Record<string, string> = {};
        d['Platform'] = navigator.platform || 'N/A';
        d['Language'] = navigator.language;
        d['Cores'] = String(navigator.hardwareConcurrency || 'N/A');
        d['Viewport'] = `${window.innerWidth}×${window.innerHeight}`;
        d['Color Depth'] = `${screen.colorDepth}bit`;
        d['Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
        d['Cookies'] = navigator.cookieEnabled ? 'Enabled' : 'Disabled';
        d['Network'] = nav.connection?.effectiveType?.toUpperCase() || 'N/A';

        // WebGL renderer
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl');
        if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            d['WebGL'] = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL).split('/')[0].trim().slice(0, 32) : 'Supported';
        } else {
            d['WebGL'] = 'Unavailable';
        }
        d['Session'] = typeof sessionStorage !== 'undefined' ? 'Available' : 'Unavailable';
        setData(d);
    }, []);

    return data;
}

const FOOTER_LINKS = [
    {
        heading: 'Community',
        items: [
            { label: 'Discord', href: 'https://discord.gg/xJdRgYndSJ' },
            { label: 'Twitter/X', href: 'https://x.com/Recon2k26/with_replies' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/recon-events/' },
            { label: 'Instagram', href: 'https://www.instagram.com/recon_2k26/' },
        ],
    },
    {
        heading: 'Resources',
        items: [
            { label: 'FAQ', href: '/faq' },
            { label: 'Contact', href: '/contact' },
        ],
    },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const diag = useDiagnostics();

    return (
        <footer id="site-footer" className="relative z-[55] bg-void">
            {/* Register CTA */}
            <Section className="py-24 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <Label className="justify-center">Incoming Transmission</Label>
                    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-paper tracking-tight leading-tight">
                        Ready to <span className="text-paper/80">breach the perimeter?</span>
                    </h2>
                    <p className="mt-4 font-body text-sm text-muted max-w-lg mx-auto">
                        Registrations are live for {EVENT_DATE_RANGE_READABLE}. Secure your spot at South India's largest campus cybersecurity event.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/login"
                            className="font-mono text-xs tracking-[0.2em] uppercase px-8 py-3.5 bg-paper text-void hover:bg-cream transition-colors duration-200"
                        >
                            <ScrambleText text="Register Now" tag="span" speed={12} />
                        </Link>
                        <a
                            href="https://discord.gg/xJdRgYndSJ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs tracking-[0.2em] uppercase px-8 py-3.5 border border-cream/30 text-muted hover:border-paper/40 hover:text-paper transition-colors duration-200"
                        >
                            <ScrambleText text="Join Discord" tag="span" speed={12} />
                        </a>
                    </div>
                </div>
            </Section>

            {/* Main footer body */}
            <div className="border-t border-edge px-6 py-12">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_340px] gap-12">
                    {/* Left — about + links */}
                    <div>
                        <span className="font-display text-sm tracking-[0.3em] text-paper uppercase">
                            RECON
                        </span>
                        <p className="mt-4 font-body text-xs text-muted leading-relaxed max-w-md">
                            South India's largest campus cybersecurity event. Organized by ReconHQ at VIT-AP University, Amaravati.
                            Hunt vulnerabilities. Break systems. Defend infrastructure.
                        </p>
                        <div className="grid grid-cols-3 gap-8 mt-8">
                            {FOOTER_LINKS.map((col) => (
                                <div key={col.heading}>
                                    <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/70 block mb-3">
                                        {col.heading}
                                    </span>
                                    <ul className="space-y-2">
                                        {col.items.map((item) => (
                                            <li key={item.label}>
                                                {item.href.startsWith('/') ? (
                                                    <Link
                                                        to={item.href}
                                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                                        className="font-mono text-[11px] text-muted hover:text-paper transition-colors"
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ) : (
                                                    <a
                                                        href={item.href}
                                                        target={item.href !== '#' ? '_blank' : undefined}
                                                        rel={item.href !== '#' ? 'noopener noreferrer' : undefined}
                                                        className="font-mono text-[11px] text-muted hover:text-paper transition-colors"
                                                    >
                                                        {item.label}
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — diagnostics panel */}
                    <div className="border border-edge bg-panel/50 backdrop-blur-sm">
                        <div className="px-4 py-2.5 border-b border-edge flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-paper/60 animate-[pulse-neon_2s_ease-in-out_infinite]" />
                            <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-cream/60">
                                Diagnostics
                            </span>
                        </div>
                        <div className="p-4 space-y-0">
                            {Object.entries(diag).map(([key, val]) => (
                                <div key={key} className="flex justify-between py-1.5 border-b border-edge/40 last:border-0">
                                    <span className="font-mono text-[10px] tracking-wider uppercase text-faint">{key}</span>
                                    <span className="font-mono text-[10px] text-cream/80 tabular-nums">{val}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-2.5 border-t border-edge flex items-center gap-2">
                            <span className="font-mono text-[10px] tracking-wider uppercase text-faint">User Agent</span>
                        </div>
                        <div className="px-4 pb-3">
                            <span className="font-mono text-[9px] text-faint/70 break-all leading-relaxed">
                                {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust center */}
            <div className="border-t border-edge px-6 py-4 bg-dark/30">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-paper/60 animate-[pulse-neon_2s_ease-in-out_infinite]" />
                        <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-faint">
                            ALL SYSTEMS OPERATIONAL
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <GlyphGrid type="braille" cols={4} rows={1} className="opacity-40" />
                        <span className="font-mono text-[9px] tracking-[0.2em] text-faint tabular-nums">
                            {new Date().toISOString().slice(0, 19).replace('T', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom marquee */}
            <div className="border-t border-edge/50 bg-dark/20 py-2">
                <Marquee
                    className="py-1"
                    speed="fast"
                    separator="||"
                    items={['RECON PoC', EVENT_DATE_RANGE_LABEL, 'HUNT', 'BREAK', 'DEFEND', 'VIT-AP', 'CTF', 'KOTH']}
                />
            </div>

            {/* Copyright */}
            <div className="border-t border-edge px-6 py-4">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-faint">
                        © {year} ReconHQ — VIT-AP University
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-faint">
                        HUNT. BREAK. DEFEND.
                    </span>
                </div>
            </div>
        </footer>
    );
}

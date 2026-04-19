import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { stats } from '../data';
import { useCountUp } from '../hooks';
import { Section, Label } from './ui';
import GlyphGrid from './GlyphGrid';
import ScrambleText from './ScrambleText';

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

export default function About() {
    return (
        <Section id="about" className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-start justify-between">
                    <Label>About RECON</Label>
                    <GlyphGrid type="hex" cols={5} rows={2} className="hidden md:block opacity-30" />
                </div>

                <div className="grid md:grid-cols-2 gap-10 mt-2">
                    <div>
                        <h2 className="font-display text-2xl md:text-3xl text-paper tracking-tight leading-snug">
                            <ScrambleText text="Where hackers converge to" tag="span" />
                            <span className="text-paper/80"> hunt, break & defend.</span>
                        </h2>
                        <p className="mt-5 font-body text-sm text-muted leading-relaxed">
                            RECON 2026 is a 3-day cybersecurity festival organized by <span className="text-paper">ReconHQ</span> at
                            VIT-AP University, Amaravati. From overnight CTFs and attack-defence warzones to hardware badge soldering
                            and deepfake forensics — this is the largest campus security event in South India.
                        </p>
                        <p className="mt-3 font-body text-sm text-muted leading-relaxed">
                            Whether you're a seasoned red-teamer or writing your first exploit, RECON has a track for you.
                            Join 600+ hackers, compete for ₹1.5M+ in prizes, and connect with the community.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {stats.map((s) => (
                            <StatCard key={s.label} label={s.label} value={s.value} prefix={s.prefix} suffix={s.suffix} />
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    );
}

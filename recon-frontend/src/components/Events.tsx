import { motion } from 'framer-motion';
import { flagshipEvents, sideEvents } from '../data';
import { Section, Label, Tag, Stagger, staggerChild } from './ui';
import CornerFrame from './CornerFrame';
import ScrambleText from './ScrambleText';
import type { SiteEvent } from '../data';
import Seo from './Seo';
import { useMediaQuery } from '../hooks/useMediaQuery';

function EventCard({ event, enlarged }: { event: SiteEvent; enlarged?: boolean }) {
    return (
        <motion.div variants={staggerChild} className={enlarged ? 'min-h-[280px] md:min-h-[320px]' : ''}>
            <CornerFrame accent={event.flagship} size={enlarged ? 'lg' : 'default'}>
                <div className="flex flex-wrap gap-2 mb-3">
                    {event.tags.map((t) => (
                        <Tag key={t} accent={event.flagship}>{t}</Tag>
                    ))}
                </div>
                <h3 className={`font-display text-paper tracking-tight ${enlarged ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                    {event.title}
                </h3>
                <p className={`font-body text-muted leading-relaxed ${enlarged ? 'mt-3 text-sm md:text-base' : 'mt-2 text-xs'}`}>
                    {event.description}
                </p>
                {event.meta.length > 0 && (
                    <div className={`flex flex-wrap gap-3 ${enlarged ? 'mt-4' : 'mt-3'}`}>
                        {event.meta.map((m) => (
                            <span key={m} className={`font-mono text-faint tracking-wider ${enlarged ? 'text-xs' : 'text-[10px]'}`}>
                                {m}
                            </span>
                        ))}
                    </div>
                )}
            </CornerFrame>
        </motion.div>
    );
}

const zigzagEasing: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ZonesOfChaos() {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="flex flex-col gap-6 md:gap-8 overflow-x-hidden">
            {sideEvents.map((event, index) => {
                const fromRight = index % 2 === 0;

                return (
                    <motion.div
                        key={event.title}
                        className={`flex ${fromRight ? 'justify-end' : 'justify-start'}`}
                        initial={{
                            opacity: 0,
                            ...(isDesktop
                                ? { x: fromRight ? 120 : -120 }
                                : { y: 24 }),
                        }}
                        whileInView={{
                            opacity: 1,
                            ...(isDesktop ? { x: 0 } : { y: 0 }),
                        }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{
                            duration: 0.55,
                            ease: zigzagEasing,
                            delay: index * 0.04,
                        }}
                    >
                        <div className="w-full md:w-[75%] lg:w-[70%]">
                            <CornerFrame>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {event.tags.map((t) => (
                                        <Tag key={t}>{t}</Tag>
                                    ))}
                                </div>
                                <h3 className="font-display text-lg text-paper tracking-tight">
                                    {event.title}
                                </h3>
                                <p className="mt-2 font-body text-xs text-muted leading-relaxed">
                                    {event.description}
                                </p>
                            </CornerFrame>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default function Events() {
    return (
        <>
            <Seo
                title="Events"
                description="CTF, King of the Hill, and 10+ side events across hardware, AppSec, and forensics at RECON 2026."
                path="/events"
            />
            <Section id="events" className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <Label>Events</Label>

                    <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight mb-4">
                        Events at <span className="text-paper/80">RECON 2026</span>
                    </h1>

                    {/* Flagship */}
                    <h2 className="font-display text-2xl md:text-3xl text-paper tracking-tight mb-8">
                        <ScrambleText text="Flagship " tag="span" speed={15} /> <span className="text-paper/80">Competitions</span>
                    </h2>
                    <Stagger className="grid md:grid-cols-2 gap-6 mb-16">
                        {flagshipEvents.map((e) => (
                            <EventCard key={e.title} event={e} enlarged />
                        ))}
                    </Stagger>

                    {/* Side events */}
                    <Label>Side Events</Label>
                    <h2 className="font-display text-xl md:text-2xl text-paper tracking-tight mb-8">
                        9 Zones of <span className="text-paper/80">Chaos</span>
                    </h2>
                    <ZonesOfChaos />
                </div>
            </Section>
        </>
    );
}

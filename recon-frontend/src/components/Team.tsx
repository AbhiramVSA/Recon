import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { team, speakers, mentors, managementLeadership, type TeamMember, type Speaker, type Mentor } from '../data';
import { Section, Label } from './ui';
import ScrambleText from './ScrambleText';
import Seo from './Seo';
import { scheduleApi } from '../api/backend';

const TABS = ['Speakers', 'Organizers', 'Mentors'] as const;
type Tab = typeof TABS[number];

/* ── Photo card shared across all three tabs ─────────────────── */
interface PersonCardProps {
    name: string;
    handle?: string;
    role: string;
    bio?: string;
    badges?: string[];
    photo?: string;
    code?: string; // organizer badge code
    url?: string;
    spotlight?: boolean;
    priority?: boolean;
}

function PersonCard({ name, handle, role, bio, badges, photo, code, url, spotlight = false, priority = false }: PersonCardProps) {
    const cardClass = spotlight
        ? 'group border border-paper/30 bg-panel/35 hover:border-paper/55 transition-colors duration-300 overflow-hidden h-full flex flex-col shadow-[0_0_0_1px_rgba(245,244,249,0.05),0_12px_30px_rgba(0,0,0,0.35)]'
        : 'group border border-edge bg-panel/20 hover:border-paper/25 transition-colors duration-300 overflow-hidden h-full flex flex-col';
    const roleClass = spotlight
        ? 'font-mono text-[10px] tracking-[0.24em] uppercase text-paper/85 leading-snug min-h-[2.4rem]'
        : 'mt-1 font-mono text-[10px] tracking-[0.2em] uppercase text-muted';
    const bioClass = spotlight
        ? 'font-body text-[11px] text-cream/70 leading-relaxed line-clamp-4'
        : 'mt-2 font-body text-[11px] text-cream/50 leading-relaxed line-clamp-3';
    const imageClass = spotlight
        ? 'absolute inset-0 w-full h-full object-cover object-top filter grayscale sepia-50 dark:opacity-75 group-hover:opacity-100 group-hover:sepia-0 group-hover:grayscale-0 transition-all duration-300'
        : 'absolute inset-0 w-full h-full object-cover object-top filter grayscale sepia-50 dark:opacity-75 group-hover:opacity-100 group-hover:sepia-0 group-hover:grayscale-0 transition-all duration-300';

    const inner = (
        <div className={cardClass}>
            {/* Photo area */}
            <div className="relative w-full aspect-3/4 bg-panel/40 overflow-hidden shrink-0">
                {spotlight && (
                    <div className="absolute top-2 left-2 z-10 font-mono text-[9px] tracking-[0.22em] uppercase text-paper/85 bg-void/60 border border-paper/25 px-2 py-1">
                        Featured Speaker
                    </div>
                )}
                {photo ? (
                    <img
                        src={photo}
                        alt={name}
                        className={imageClass}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding={priority ? 'sync' : 'async'}
                    />
                ) : (
                    /* Placeholder — monogram grid */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="font-mono text-2xl text-paper/20 tracking-widest select-none">
                            {code ?? name.slice(0, 2).toUpperCase()}
                        </div>
                        {/* subtle scanline texture */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 4px)',
                            }}
                        />
                    </div>
                )}
                {/* Bottom gradient for readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-void/80 to-transparent" />
            </div>

            {/* Text */}
            <div className="p-4 flex flex-col gap-2 grow">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-display text-sm text-paper tracking-tight leading-tight">{name}</span>
                    {handle && (
                        <span className="font-mono text-[10px] text-paper/45 tracking-wider">&quot;{handle}&quot;</span>
                    )}
                </div>
                <div className={roleClass}>{role}</div>
                {spotlight && badges && badges.length > 0 && (
                    <div className="min-h-[1.8rem] flex flex-wrap gap-1">
                        {badges.map((badge) => (
                            <span
                                key={badge}
                                className="inline-flex items-center px-2 py-0.5 border border-paper/20 bg-void/45 font-mono text-[9px] tracking-[0.16em] uppercase text-paper/75"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                )}
                {bio && (
                    <p className={bioClass}>{bio}</p>
                )}
            </div>
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer">
                {inner}
            </a>
        );
    }
    return inner;
}

function OrganizerCards() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {team.map((m: TeamMember, index) => (
                <PersonCard
                    key={m.code}
                    name={m.name}
                    role={m.role}
                    photo={m.photo}
                    code={m.code}
                    priority={index < 8}
                />
            ))}
        </div>
    );
}

function SpeakerCards({ speakerItems }: { speakerItems: Speaker[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {speakerItems.map((s: Speaker, index) => (
                <PersonCard
                    key={s.name}
                    name={s.name}
                    handle={s.handle}
                    role={s.role}
                    bio={s.bio}
                    badges={s.badges}
                    photo={s.photo}
                    url={s.url}
                    spotlight
                    priority={index < 3}
                />
            ))}
        </div>
    );
}


function MentorCards() {
    const grouped = [
        { key: 'leadership', label: 'Management / Leadership', items: managementLeadership },
        { key: 'faculty', label: 'Faculty', items: mentors },
    ].filter((group) => group.items.length > 0);

    return (
        <div className="space-y-14">
            {grouped.map((group) => (
                <div key={group.key}>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/60">
                            {group.label}
                        </span>
                        <span className="flex-1 h-px bg-edge" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {group.items.map((m: Mentor) => (
                            <PersonCard
                                key={`${group.key}-${m.name}`}
                                name={m.name}
                                handle={m.handle}
                                role={m.role}
                                bio={m.bio}
                                photo={m.photo}
                                url={m.url}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Team() {
    const [active, setActive] = useState<Tab>('Speakers');
    const [speakerItems, setSpeakerItems] = useState<Speaker[]>(speakers);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const apiSpeakers = await scheduleApi.listSpeakers();
                if (!alive || !Array.isArray(apiSpeakers) || apiSpeakers.length === 0) return;
                const mapped: Speaker[] = apiSpeakers.map((s) => ({
                    name: String(s.name ?? 'Unknown Speaker'),
                    role: String(s.org ?? 'Guest Speaker'),
                    bio: String(s.bio ?? ''),
                }));
                setSpeakerItems(mapped);
            } catch {
                // keep fallback speakers when endpoint is unavailable
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        // Warm image cache for the first organizer viewport to reduce tab-switch delay.
        const organizerPreviewPhotos = team
            .slice(0, 12)
            .map((member) => member.photo)
            .filter((photo): photo is string => Boolean(photo));

        const timeoutId = window.setTimeout(() => {
            organizerPreviewPhotos.forEach((src, index) => {
                const img = new Image();
                img.decoding = index < 8 ? 'sync' : 'async';
                img.src = src;
            });
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <>
            <Seo
                title="People"
                description="Organizers, speakers, and mentors behind RECON 2026."
                path="/people"
            />
            <Section id="people" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <Label>People</Label>
                    <h1 className="font-display text-2xl md:text-3xl text-paper tracking-tight mb-8">
                        <ScrambleText text="The minds behind " tag="span" speed={15} />
                        <span className="text-paper/80">RECON</span>
                    </h1>

                {/* Tabs */}
                <div className="inline-flex gap-1 mb-10 border border-edge">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActive(tab)}
                            className={`font-mono text-[11px] tracking-[0.2em] uppercase px-5 py-2 transition-colors duration-200 ${active === tab ? 'bg-paper text-void' : 'text-muted hover:text-paper'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab panels */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        {active === 'Speakers' && <SpeakerCards speakerItems={speakerItems} />}
                        {active === 'Organizers' && <OrganizerCards />}
                        {active === 'Mentors' && <MentorCards />}
                    </motion.div>
                </AnimatePresence>
                </div>
            </Section>
        </>
    );
}
